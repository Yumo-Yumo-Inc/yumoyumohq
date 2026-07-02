import type { ReceiptSummary } from "@/lib/insights/types";
import type {
  CachedInsightsRecord,
  CategoryInsightSummary,
  MerchantInsightSummary,
  MonthlyInsightSummary,
} from "@/lib/offline/types";

function monthKeyFromDate(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 7);
  }
  return date.toISOString().slice(0, 7);
}

function lastSixMonthKeys(now = new Date()): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(cursor);
    date.setUTCMonth(cursor.getUTCMonth() - index);
    keys.push(date.toISOString().slice(0, 7));
  }
  return keys;
}

export function buildOfflineInsightsRecord(input: {
  receipts: ReceiptSummary[];
  xpByMonth?: Record<string, number>;
  updatedAt?: string;
  version?: number;
}): CachedInsightsRecord {
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const version = input.version ?? Date.parse(updatedAt);
  const monthlyAccumulator = new Map<
    string,
    {
      totalSpent: number;
      receiptCount: number;
      hiddenCostTotal: number;
      categoryCounts: Map<string, number>;
    }
  >();
  const categoryAccumulator = new Map<string, { totalSpent: number; count: number }>();
  const merchantAccumulator = new Map<string, { count: number; totalSpent: number }>();
  const spendingByMonth = new Map<string, number>();

  let totalSpend = 0;
  let totalHiddenCost = 0;
  let totalReceiptCount = 0;
  let primaryCurrency = "USD";

  for (const receipt of input.receipts) {
    const monthKey = monthKeyFromDate(receipt.date);
    const category = receipt.category || "other";
    const merchantName = receipt.merchantName || "Unknown";
    const spend = Number(receipt.totalPaid) || 0;
    const hidden = Number(receipt.hiddenCostCore) || 0;

    if (!primaryCurrency && receipt.currency) {
      primaryCurrency = receipt.currency;
    } else if (primaryCurrency === "USD" && receipt.currency) {
      primaryCurrency = receipt.currency;
    }

    totalSpend += spend;
    totalHiddenCost += hidden;
    totalReceiptCount += 1;

    if (!monthlyAccumulator.has(monthKey)) {
      monthlyAccumulator.set(monthKey, {
        totalSpent: 0,
        receiptCount: 0,
        hiddenCostTotal: 0,
        categoryCounts: new Map<string, number>(),
      });
    }
    const monthly = monthlyAccumulator.get(monthKey)!;
    monthly.totalSpent += spend;
    monthly.receiptCount += 1;
    monthly.hiddenCostTotal += hidden;
    monthly.categoryCounts.set(category, (monthly.categoryCounts.get(category) ?? 0) + 1);

    if (!categoryAccumulator.has(category)) {
      categoryAccumulator.set(category, { totalSpent: 0, count: 0 });
    }
    const categoryStats = categoryAccumulator.get(category)!;
    categoryStats.totalSpent += spend;
    categoryStats.count += 1;

    if (!merchantAccumulator.has(merchantName)) {
      merchantAccumulator.set(merchantName, { count: 0, totalSpent: 0 });
    }
    const merchantStats = merchantAccumulator.get(merchantName)!;
    merchantStats.count += 1;
    merchantStats.totalSpent += spend;

    spendingByMonth.set(monthKey, (spendingByMonth.get(monthKey) ?? 0) + spend);
  }

  const recentMonthKeys = lastSixMonthKeys();
  const monthly: Record<string, MonthlyInsightSummary> = {};
  for (const key of recentMonthKeys) {
    const stats = monthlyAccumulator.get(key);
    const topCategories = stats
      ? Array.from(stats.categoryCounts.entries())
          .sort((left, right) => right[1] - left[1])
          .slice(0, 3)
          .map(([category]) => category)
      : [];
    monthly[key] = {
      totalSpent: stats?.totalSpent ?? 0,
      receiptCount: stats?.receiptCount ?? 0,
      topCategories,
      hiddenCostTotal: stats?.hiddenCostTotal ?? 0,
      xpEarned: input.xpByMonth?.[key] ?? 0,
    };
  }

  const categoryBreakdown: Record<string, CategoryInsightSummary> = {};
  for (const [category, stats] of categoryAccumulator.entries()) {
    categoryBreakdown[category] = {
      totalSpent: stats.totalSpent,
      count: stats.count,
      pct: totalSpend > 0 ? (stats.totalSpent / totalSpend) * 100 : 0,
    };
  }

  const topMerchants: MerchantInsightSummary[] = Array.from(merchantAccumulator.entries())
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      totalSpent: stats.totalSpent,
    }))
    .sort((left, right) => right.totalSpent - left.totalSpent)
    .slice(0, 5);

  const spendingTrend = recentMonthKeys.map((key) => spendingByMonth.get(key) ?? 0);

  return {
    id: "main",
    updated_at: updatedAt,
    version,
    currency: primaryCurrency,
    totalSpend,
    totalHiddenCost,
    totalReceiptCount,
    monthly,
    categoryBreakdown,
    spendingTrend,
    topMerchants,
  };
}
