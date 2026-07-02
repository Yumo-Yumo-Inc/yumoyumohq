/**
 * Spending Pulse computation functions
 * Calculate spending pace, projections, and cumulative series
 */

import type { ReceiptSummary } from "./types";

/**
 * Get spend amount from receipt (prefer totalPaid, else paidExTax, else 0)
 */
export function getReceiptSpend(receipt: ReceiptSummary): number {
  return receipt.totalPaid || receipt.paidExTax || 0;
}

/**
 * Group receipts by day (YYYY-MM-DD -> { spendSum, count })
 */
export function groupByDay(
  receipts: ReceiptSummary[]
): Map<string, { spendSum: number; count: number }> {
  const dayMap = new Map<string, { spendSum: number; count: number }>();

  receipts.forEach((receipt) => {
    try {
      // Parse date and get YYYY-MM-DD format
      const date = new Date(receipt.date);
      if (isNaN(date.getTime())) {
        console.warn(`[spendingPulse] Invalid date for receipt ${receipt.id}: ${receipt.date}`);
        return;
      }

      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const spend = getReceiptSpend(receipt);

      const existing = dayMap.get(dateKey) || { spendSum: 0, count: 0 };
      dayMap.set(dateKey, {
        spendSum: existing.spendSum + spend,
        count: existing.count + 1,
      });
    } catch (error) {
      console.warn(`[spendingPulse] Error processing receipt ${receipt.id}:`, error);
    }
  });

  return dayMap;
}

/**
 * Compute daily burn rate (average spend per day within selected range)
 */
export function computeDailyBurnRate(
  receipts: ReceiptSummary[],
  daysInRange: number
): number {
  if (daysInRange <= 0 || receipts.length === 0) return 0;

  const totalSpend = receipts.reduce((sum, r) => sum + getReceiptSpend(r), 0);
  return totalSpend / daysInRange;
}

/**
 * Compute receipt frequency (average receipts per day)
 */
export function computeReceiptFrequency(
  receipts: ReceiptSummary[],
  daysInRange: number
): number {
  if (daysInRange <= 0) return 0;
  return receipts.length / daysInRange;
}

/**
 * Cumulative series data point
 */
export interface CumulativePoint {
  dayLabel: string; // "Day 1", "Day 2", etc.
  date: string; // YYYY-MM-DD
  daySpend: number; // Spend on this day
  cumulativeSpend: number; // Cumulative spend up to this day
}

/**
 * Compute cumulative series for current month
 * Returns array of points for each day of the month
 */
export function computeCumulativeSeriesForMonth(
  receipts: ReceiptSummary[],
  monthStart: Date,
  monthEnd: Date
): CumulativePoint[] {
  const series: CumulativePoint[] = [];
  const dayMap = groupByDay(receipts);

  // Get all days in the month
  const current = new Date(monthStart);
  let cumulativeSpend = 0;
  let dayNumber = 1;

  while (current <= monthEnd) {
    const dateKey = current.toISOString().split("T")[0];
    const dayData = dayMap.get(dateKey) || { spendSum: 0, count: 0 };

    cumulativeSpend += dayData.spendSum;

    series.push({
      dayLabel: `Day ${dayNumber}`,
      date: dateKey,
      daySpend: dayData.spendSum,
      cumulativeSpend,
    });

    // Move to next day
    current.setDate(current.getDate() + 1);
    dayNumber++;
  }

  return series;
}

/**
 * Compute projection series (dashed line)
 * Simple linear projection: projectedEnd = (cumulativeSoFar / daysElapsed) * monthDays
 */
export function computeProjection(
  series: CumulativePoint[],
  todayIndex: number,
  monthDays: number
): CumulativePoint[] {
  if (todayIndex < 0 || todayIndex >= series.length) {
    return [];
  }

  const cumulativeSoFar = series[todayIndex].cumulativeSpend;
  const daysElapsed = todayIndex + 1;

  if (daysElapsed === 0) {
    return [];
  }

  const avgDailySpend = cumulativeSoFar / daysElapsed;
  const projectedEnd = avgDailySpend * monthDays;

  // Create projection series (from today to end of month)
  const projection: CumulativePoint[] = [];
  const todayCumulative = cumulativeSoFar;

  for (let i = todayIndex; i < series.length; i++) {
    const daysRemaining = i - todayIndex;
    const projectedCumulative = todayCumulative + avgDailySpend * daysRemaining;

    projection.push({
      dayLabel: series[i].dayLabel,
      date: series[i].date,
      daySpend: avgDailySpend, // Projected daily spend
      cumulativeSpend: projectedCumulative,
    });
  }

  return projection;
}

/**
 * Get current month start and end dates
 */
export function getCurrentMonthRange(): { start: Date; end: Date; days: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
  const days = end.getDate();

  return { start, end, days };
}

/**
 * Get month range for a specific date
 */
export function getMonthRange(date: Date): { start: Date; end: Date; days: number } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days = end.getDate();

  return { start, end, days };
}

/**
 * Get last month range (for comparison)
 */
export function getLastMonthRange(): { start: Date; end: Date; days: number } {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return getMonthRange(lastMonth);
}

/**
 * Compute spending pulse data
 */
export interface SpendingPulseData {
  dailyBurnRate: number;
  receiptFrequency: number;
  projectedMonthEnd: number;
  currentMonthSeries: CumulativePoint[];
  projectionSeries: CumulativePoint[];
  topSpendingDay: { weekday: string; amount: number; date: string } | null;
  mostFrequentCategory: { category: string; count: number } | null;
  insight: string;
}

export function computeSpendingPulse(
  receipts: ReceiptSummary[],
  filters?: { timeRange?: "7d" | "30d" | "90d" | "all" }
): SpendingPulseData {
  // Filter receipts for current month
  const now = new Date();
  const { start: monthStart, end: monthEnd, days: monthDays } = getCurrentMonthRange();
  const todayIndex = Math.min(now.getDate() - 1, monthDays - 1); // 0-indexed

  // Filter receipts to current month
  const currentMonthReceipts = receipts.filter((r) => {
    try {
      const receiptDate = new Date(r.date);
      if (isNaN(receiptDate.getTime())) return false;
      return receiptDate >= monthStart && receiptDate <= monthEnd;
    } catch {
      return false;
    }
  });

  // Calculate days in range for KPIs
  let daysInRange = monthDays;
  if (filters?.timeRange) {
    const now = new Date();
    switch (filters.timeRange) {
      case "7d":
        daysInRange = 7;
        break;
      case "30d":
        daysInRange = 30;
        break;
      case "90d":
        daysInRange = 90;
        break;
      case "all":
        // Use all receipts, calculate range from first to last receipt
        if (receipts.length > 0) {
          const dates = receipts
            .map((r) => {
              try {
                return new Date(r.date);
              } catch {
                return null;
              }
            })
            .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

          if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
            const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
            daysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          }
        }
        break;
    }
  }

  // Use filtered receipts for KPIs (respect filters)
  const filteredReceipts = filters?.timeRange && filters.timeRange !== "all"
    ? receipts.filter((r) => {
        try {
          const receiptDate = new Date(r.date);
          if (isNaN(receiptDate.getTime())) return false;
          const cutoffDate = new Date();
          switch (filters.timeRange) {
            case "7d":
              cutoffDate.setDate(cutoffDate.getDate() - 7);
              break;
            case "30d":
              cutoffDate.setDate(cutoffDate.getDate() - 30);
              break;
            case "90d":
              cutoffDate.setDate(cutoffDate.getDate() - 90);
              break;
          }
          cutoffDate.setHours(0, 0, 0, 0);
          receiptDate.setHours(0, 0, 0, 0);
          return receiptDate >= cutoffDate;
        } catch {
          return false;
        }
      })
    : receipts;

  // Compute KPIs
  const dailyBurnRate = computeDailyBurnRate(filteredReceipts, daysInRange);
  const receiptFrequency = computeReceiptFrequency(filteredReceipts, daysInRange);

  // Compute cumulative series for current month
  const currentMonthSeries = computeCumulativeSeriesForMonth(
    currentMonthReceipts,
    monthStart,
    monthEnd
  );

  // Compute projection (only if we have data up to today)
  const projectionSeries = todayIndex >= 0 && todayIndex < currentMonthSeries.length && currentMonthSeries.length > 0
    ? computeProjection(currentMonthSeries, todayIndex, monthDays)
    : [];
  const projectedMonthEnd = projectionSeries.length > 0
    ? projectionSeries[projectionSeries.length - 1].cumulativeSpend
    : currentMonthSeries.length > 0
    ? currentMonthSeries[currentMonthSeries.length - 1].cumulativeSpend
    : 0;

  // Find top spending day
  const dayMap = groupByDay(currentMonthReceipts);
  let topSpendingDay: { weekday: string; amount: number; date: string } | null = null;
  let maxSpend = 0;

  dayMap.forEach((data, dateKey) => {
    if (data.spendSum > maxSpend) {
      maxSpend = data.spendSum;
      const date = new Date(dateKey);
      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
      topSpendingDay = { weekday, amount: data.spendSum, date: dateKey };
    }
  });

  // Find most frequent category
  const categoryCounts = new Map<string, number>();
  currentMonthReceipts.forEach((r) => {
    if (r.category) {
      categoryCounts.set(r.category, (categoryCounts.get(r.category) || 0) + 1);
    }
  });

  let mostFrequentCategory: { category: string; count: number } | null = null;
  let maxCount = 0;
  categoryCounts.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentCategory = { category, count };
    }
  });

  // Generate insight sentence
  let insight = "";
  if (currentMonthReceipts.length === 0) {
    insight = "Not enough data yet — upload more receipts.";
  } else {
    // Try to compare with last month if data exists
    const lastMonthRange = getLastMonthRange();
    const lastMonthReceipts = receipts.filter((r) => {
      try {
        const receiptDate = new Date(r.date);
        if (isNaN(receiptDate.getTime())) return false;
        return (
          receiptDate >= lastMonthRange.start && receiptDate <= lastMonthRange.end
        );
      } catch {
        return false;
      }
    });

    if (lastMonthReceipts.length > 0) {
      // Compare same number of days
      const lastMonthDaysElapsed = Math.min(
        lastMonthRange.days,
        Math.floor((Date.now() - lastMonthRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      const lastMonthSpend = lastMonthReceipts.reduce(
        (sum, r) => sum + getReceiptSpend(r),
        0
      );
      const lastMonthDailyRate = lastMonthSpend / lastMonthDaysElapsed;

      if (lastMonthDailyRate > 0) {
        const percentChange = ((dailyBurnRate - lastMonthDailyRate) / lastMonthDailyRate) * 100;
        const sign = percentChange >= 0 ? "+" : "";
        insight = `Your spending pace is ${sign}${percentChange.toFixed(0)}% ${percentChange >= 0 ? "higher" : "lower"} than last month (same days).`;
      } else {
        insight = `At this pace, you'll spend ~${Math.round(projectedMonthEnd)} ${currentMonthReceipts[0]?.currency || "USD"} this month.`;
      }
    } else {
      insight = `At this pace, you'll spend ~${Math.round(projectedMonthEnd)} ${currentMonthReceipts[0]?.currency || "USD"} this month.`;
    }
  }

  return {
    dailyBurnRate,
    receiptFrequency,
    projectedMonthEnd,
    currentMonthSeries,
    projectionSeries,
    topSpendingDay,
    mostFrequentCategory,
    insight,
  };
}

