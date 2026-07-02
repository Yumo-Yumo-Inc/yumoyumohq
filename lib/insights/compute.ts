/**
 * Insights computation functions
 */

import type {
  ReceiptSummary,
  InsightsAggregate,
  InsightsFilters,
  MerchantStats,
  TimeSeriesPoint,
  TrustCounts,
} from "./types";

/**
 * Convert ReceiptAnalysis to ReceiptSummary
 */
export function receiptToSummary(receipt: any): ReceiptSummary {
  const confidence: "verified" | "low" | "rejected" =
    receipt.status === "verified" || receipt.status === "saved"
      ? "verified"
      : receipt.flags?.rejected || receipt.status === "rejected"
      ? "rejected"
      : "low";

  return {
    id: receipt.receiptId,
    merchantName: receipt.merchant?.name || "Unknown",
    country: receipt.merchant?.country || "US",
    currency: receipt.pricing?.currency || "USD",
    date: receipt.extraction?.date?.value || receipt.createdAt || new Date().toISOString(),
    time: receipt.extraction?.time?.value, // Extract time from receipt
    totalPaid: receipt.pricing?.totalPaid || 0,
    taxAmount: receipt.pricing?.vatAmount || 0,
    paidExTax: receipt.pricing?.paidExTax || 0,
    hiddenCostCore: receipt.hiddenCost?.hiddenCostCore || 0,
    importSystemCost: receipt.hiddenCost?.breakdown?.importSystemCost || 0,
    retailHiddenCost: receipt.hiddenCost?.breakdown?.retailHiddenCost || 0,
    productValue: receipt.hiddenCost?.referencePrice || 0,
    confidence,
    category: receipt.merchant?.category || "other",
    merchantId: receipt.merchant?.placeId, // Add merchantId for trend computation
  } as ReceiptSummary & { merchantId?: string };
}

/**
 * Filter receipts based on filters
 */
export function filterReceipts(
  receipts: ReceiptSummary[],
  filters: InsightsFilters
): ReceiptSummary[] {
  let filtered = [...receipts];

  // Time range filter
  if (filters.timeRange && filters.timeRange !== "all") {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (filters.timeRange) {
      case "7d":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        cutoffDate.setDate(now.getDate() - 90);
        break;
    }
    
    // Set time to start of day for accurate comparison
    cutoffDate.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter((r) => {
      try {
        const receiptDate = new Date(r.date);
        if (isNaN(receiptDate.getTime())) {
          console.warn("Invalid date in filter:", r.id, r.date);
          return false;
        }
        receiptDate.setHours(0, 0, 0, 0);
        return receiptDate >= cutoffDate;
      } catch (error) {
        console.warn("Error filtering by date:", r.id, r.date, error);
        return false;
      }
    });
  }

  // Country filter
  if (filters.country) {
    filtered = filtered.filter((r) => r.country === filters.country);
  }

  // Currency filter (display only, doesn't filter)
  // if (filters.currency) {
  //   filtered = filtered.filter((r) => r.currency === filters.currency);
  // }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter((r) => r.category === filters.category);
  }

  // Merchant search
  if (filters.merchant) {
    const searchLower = filters.merchant.toLowerCase();
    filtered = filtered.filter((r) =>
      r.merchantName.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

/**
 * Aggregate receipts into insights
 */
export function aggregateReceipts(
  receipts: ReceiptSummary[],
  filters: InsightsFilters = {}
): InsightsAggregate {
  const filtered = filterReceipts(receipts, filters);

  if (filtered.length === 0) {
    return {
      totalSpend: 0,
      totalPaidExTax: 0,
      totalHiddenCostCore: 0,
      totalProductValue: 0,
      totalTaxAmount: 0,
      totalImportSystemCost: 0,
      totalRetailHiddenCost: 0,
      hiddenCostCoreRate: 0,
      confidenceCoverage: 0,
      timeSeries: [],
      merchantStats: [],
      categoryStats: [],
      trustCounts: { verified: 0, low: 0, rejected: 0, total: 0 },
      categoryBaselines: {},
      countryBaselines: {},
    };
  }

  // Calculate totals
  const totals = filtered.reduce(
    (acc, r) => ({
      totalSpend: acc.totalSpend + r.totalPaid,
      totalPaidExTax: acc.totalPaidExTax + r.paidExTax,
      totalHiddenCostCore: acc.totalHiddenCostCore + r.hiddenCostCore,
      totalProductValue: acc.totalProductValue + r.productValue,
      totalTaxAmount: acc.totalTaxAmount + (r.taxAmount || 0),
      totalImportSystemCost: acc.totalImportSystemCost + r.importSystemCost,
      totalRetailHiddenCost: acc.totalRetailHiddenCost + r.retailHiddenCost,
    }),
    {
      totalSpend: 0,
      totalPaidExTax: 0,
      totalHiddenCostCore: 0,
      totalProductValue: 0,
      totalTaxAmount: 0,
      totalImportSystemCost: 0,
      totalRetailHiddenCost: 0,
    }
  );

  // Calculate rates
  const hiddenCostCoreRate =
    totals.totalPaidExTax > 0
      ? (totals.totalHiddenCostCore / totals.totalPaidExTax) * 100
      : 0;

  // Trust counts
  const trustCounts: TrustCounts = filtered.reduce(
    (acc, r) => {
      acc[r.confidence]++;
      acc.total++;
      return acc;
    },
    { verified: 0, low: 0, rejected: 0, total: 0 }
  );

  const confidenceCoverage =
    trustCounts.total > 0
      ? (trustCounts.verified / trustCounts.total) * 100
      : 0;

  // Time series (weekly aggregation)
  const timeSeriesMap = new Map<string, TimeSeriesPoint>();
  filtered.forEach((r) => {
    const date = new Date(r.date);
    if (isNaN(date.getTime())) {
      return; // Skip receipts with invalid/missing date
    }
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!timeSeriesMap.has(weekKey)) {
      timeSeriesMap.set(weekKey, {
        date: weekKey,
        spend: 0,
        hiddenCostCore: 0,
        productValue: 0,
        taxAmount: 0,
      });
    }

    const point = timeSeriesMap.get(weekKey)!;
    point.spend += r.totalPaid;
    point.hiddenCostCore += r.hiddenCostCore;
    point.productValue += r.productValue;
    point.taxAmount += r.taxAmount || 0;
  });

  const timeSeries = Array.from(timeSeriesMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  // Merchant stats
  const merchantMap = new Map<string, MerchantStats>();
  filtered.forEach((r) => {
    if (!merchantMap.has(r.merchantName)) {
      merchantMap.set(r.merchantName, {
        merchantName: r.merchantName,
        receiptCount: 0,
        totalHiddenCostCore: 0,
        avgHiddenPercent: 0,
        totalSpend: 0,
      });
    }

    const stats = merchantMap.get(r.merchantName)!;
    stats.receiptCount++;
    stats.totalHiddenCostCore += r.hiddenCostCore;
    stats.totalSpend += r.totalPaid;
  });

  // Calculate avg hidden % for each merchant
  // Sum up paidExTax for all receipts from this merchant
  const merchantPaidExTaxMap = new Map<string, number>();
  filtered.forEach((r) => {
    const current = merchantPaidExTaxMap.get(r.merchantName) || 0;
    merchantPaidExTaxMap.set(r.merchantName, current + r.paidExTax);
  });

  merchantMap.forEach((stats) => {
    const totalPaidExTax = merchantPaidExTaxMap.get(stats.merchantName) || stats.totalSpend;
    stats.avgHiddenPercent =
      totalPaidExTax > 0
        ? (stats.totalHiddenCostCore / totalPaidExTax) * 100
        : 0;
  });

  const merchantStats = Array.from(merchantMap.values())
    .sort((a, b) => b.totalHiddenCostCore - a.totalHiddenCostCore)
    .slice(0, 10);

  // Category stats
  const categoryMap = new Map<string, { count: number; totalHidden: number; totalSpend: number }>();
  filtered.forEach((r) => {
    const cat = r.category || "other";
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { count: 0, totalHidden: 0, totalSpend: 0 });
    }

    const stats = categoryMap.get(cat)!;
    stats.count++;
    stats.totalHidden += r.hiddenCostCore;
    stats.totalSpend += r.totalPaid;
  });

  const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    receiptCount: stats.count,
    totalHiddenCostCore: stats.totalHidden,
    avgHiddenPercent:
      stats.totalSpend > 0 ? (stats.totalHidden / stats.totalSpend) * 100 : 0,
  }));

  // Calculate baselines (average hidden % per category and country)
  const categoryBaselines: Record<string, number> = {};
  categoryMap.forEach((stats, category) => {
    categoryBaselines[category] =
      stats.totalSpend > 0 ? (stats.totalHidden / stats.totalSpend) * 100 : 0;
  });

  const countryMap = new Map<string, { totalHidden: number; totalSpend: number }>();
  filtered.forEach((r) => {
    if (!countryMap.has(r.country)) {
      countryMap.set(r.country, { totalHidden: 0, totalSpend: 0 });
    }

    const stats = countryMap.get(r.country)!;
    stats.totalHidden += r.hiddenCostCore;
    stats.totalSpend += r.totalPaid;
  });

  const countryBaselines: Record<string, number> = {};
  countryMap.forEach((stats, country) => {
    countryBaselines[country] =
      stats.totalSpend > 0 ? (stats.totalHidden / stats.totalSpend) * 100 : 0;
  });

  return {
    ...totals,
    hiddenCostCoreRate,
    confidenceCoverage,
    timeSeries,
    merchantStats,
    categoryStats,
    trustCounts,
    categoryBaselines,
    countryBaselines,
  };
}

/**
 * Compute transparency score for a merchant (0-100)
 * Lower hidden% relative to baseline => higher score
 */
export function computeTransparencyScore(
  merchantStats: MerchantStats,
  categoryBaseline: number,
  countryBaseline: number
): number {
  const baseline = (categoryBaseline + countryBaseline) / 2;
  
  if (baseline === 0) return 50; // Neutral if no baseline
  
  // If merchant's hidden% is lower than baseline, score is higher
  const diff = baseline - merchantStats.avgHiddenPercent;
  const score = 50 + (diff / baseline) * 50; // Scale to 0-100
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Compute what-if savings
 */
export function computeWhatIfSavings(
  totalHiddenCostCore: number,
  reductionPercent: number
): number {
  return totalHiddenCostCore * (reductionPercent / 100);
}

