/**
 * Behavior Trap Detector computation utilities
 */

import type { ReceiptSummary } from "./types";

export interface TimeBucket {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
}

export interface HeatmapCell {
  avgRate: number; // 0..1 (hiddenCostCoreRate)
  count: number;
  sumSpend: number;
  sumHidden: number;
}

export interface BehaviorInsights {
  primary: string;
  secondary?: string;
  action?: string;
}

export interface OverallStats {
  avgHiddenRate: number; // 0..1
  totalSpend: number;
  totalHidden: number;
  receiptCount: number;
}

// Time buckets: 4 buckets for simplicity
export const TIME_BUCKETS: TimeBucket[] = [
  { id: "morning", label: "06-12", startHour: 6, endHour: 12 },
  { id: "afternoon", label: "12-18", startHour: 12, endHour: 18 },
  { id: "evening", label: "18-00", startHour: 18, endHour: 24 },
  { id: "night", label: "00-06", startHour: 0, endHour: 6 },
];

// Day of week: 0 = Monday, 6 = Sunday
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Get time bucket for a date
 */
export function getTimeBucket(date: Date): TimeBucket {
  const hour = date.getHours();
  
  for (const bucket of TIME_BUCKETS) {
    if (bucket.startHour < bucket.endHour) {
      // Normal range (e.g., 6-12, 12-18, 18-24)
      if (hour >= bucket.startHour && hour < bucket.endHour) {
        return bucket;
      }
    } else {
      // Wraps around midnight (e.g., 0-6)
      // For night bucket: startHour=0, endHour=6
      if (hour >= bucket.startHour || hour < bucket.endHour) {
        return bucket;
      }
    }
  }
  
  // Fallback to morning (shouldn't happen, but just in case)
  return TIME_BUCKETS[0];
}

/**
 * Get day of week index (0 = Monday, 6 = Sunday)
 */
export function getDayOfWeekIndex(date: Date): number {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  return day === 0 ? 6 : day - 1; // Convert to Monday = 0
}

/**
 * Get day name from index
 */
export function getDayName(index: number): string {
  return DAY_NAMES[index] || "Unknown";
}

/**
 * Calculate hidden cost rate for a receipt (0..1)
 */
function getHiddenCostRate(receipt: ReceiptSummary): number {
  if (receipt.paidExTax <= 0) return 0;
  return Math.max(0, Math.min(1, receipt.hiddenCostCore / receipt.paidExTax));
}

/**
 * Compute overall statistics
 */
export function computeOverallStats(receipts: ReceiptSummary[]): OverallStats {
  if (receipts.length === 0) {
    return {
      avgHiddenRate: 0,
      totalSpend: 0,
      totalHidden: 0,
      receiptCount: 0,
    };
  }

  let totalSpend = 0;
  let totalHidden = 0;
  let totalPaidExTax = 0;

  receipts.forEach((r) => {
    totalSpend += r.totalPaid || 0;
    totalHidden += r.hiddenCostCore;
    totalPaidExTax += r.paidExTax;
  });

  const avgHiddenRate = totalPaidExTax > 0 ? totalHidden / totalPaidExTax : 0;

  return {
    avgHiddenRate: Math.max(0, Math.min(1, avgHiddenRate)),
    totalSpend,
    totalHidden,
    receiptCount: receipts.length,
  };
}

/**
 * Compute heatmap matrix
 * Returns: matrix[dayIndex][bucketIndex] = HeatmapCell
 */
export function computeHeatmap(
  receipts: ReceiptSummary[],
  minCellCount: number = 1 // Show cells with at least 1 receipt
): {
  matrix: (HeatmapCell | null)[][];
  maxRate: number;
  minRate: number;
} {
  // Initialize 7x4 matrix (7 days, 4 time buckets)
  const matrix: (HeatmapCell | null)[][] = Array(7)
    .fill(null)
    .map(() => Array(4).fill(null).map(() => null));

  // Group receipts by day and time bucket
  const cellData: Map<string, ReceiptSummary[]> = new Map();

  let processedCount = 0;
  let skippedCount = 0;
  const skippedReasons: Map<string, number> = new Map();

  receipts.forEach((receipt) => {
    try {
      // Parse date from receipt (supports multiple formats)
      const dateStr = receipt.date;
      if (!dateStr) {
        skippedCount++;
        skippedReasons.set("Missing date", (skippedReasons.get("Missing date") || 0) + 1);
        console.warn("Missing date in receipt:", receipt.id);
        return;
      }
      
      let year: number, month: number, day: number;
      
      // Try ISO format first (YYYY-MM-DD)
      const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        year = parseInt(isoMatch[1]);
        month = parseInt(isoMatch[2]) - 1; // Month is 0-indexed
        day = parseInt(isoMatch[3]);
      } else {
        // Try DD.MM.YYYY or DD/MM/YYYY format
        const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
        if (ddmmyyyyMatch) {
          day = parseInt(ddmmyyyyMatch[1]);
          month = parseInt(ddmmyyyyMatch[2]) - 1; // Month is 0-indexed
          year = parseInt(ddmmyyyyMatch[3]);
        } else {
          // Try YYYY.MM.DD or YYYY/MM/DD format
          const yyyymmddMatch = dateStr.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
          if (yyyymmddMatch) {
            year = parseInt(yyyymmddMatch[1]);
            month = parseInt(yyyymmddMatch[2]) - 1;
            day = parseInt(yyyymmddMatch[3]);
          } else {
            // Fallback: try to parse as Date object
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) {
              skippedCount++;
              skippedReasons.set("Could not parse date format", (skippedReasons.get("Could not parse date format") || 0) + 1);
              console.warn("Could not parse date format:", receipt.id, dateStr);
              return;
            }
            year = dateObj.getFullYear();
            month = dateObj.getMonth();
            day = dateObj.getDate();
          }
        }
      }
      
      // Validate parsed date
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        skippedCount++;
        skippedReasons.set("Invalid date values", (skippedReasons.get("Invalid date values") || 0) + 1);
        console.warn("Invalid date values:", receipt.id, dateStr, { year, month, day });
        return;
      }
      
      // Parse time from receipt if available (HH:MM format)
      let hour = 12; // Default to noon if no time
      let minute = 0;
      
      if (receipt.time && receipt.time.trim()) {
        const timeParts = receipt.time.trim().split(':');
        if (timeParts.length >= 2) {
          hour = parseInt(timeParts[0]);
          minute = parseInt(timeParts[1]);
          // Validate hour and minute
          if (isNaN(hour) || hour < 0 || hour > 23) {
            console.warn("Invalid hour:", receipt.id, receipt.time, hour);
            hour = 12;
          }
          if (isNaN(minute) || minute < 0 || minute > 59) {
            console.warn("Invalid minute:", receipt.id, receipt.time, minute);
            minute = 0;
          }
        }
      }
      
      // Create date object with receipt date and time
      const receiptDateTime = new Date(year, month, day, hour, minute);
      if (isNaN(receiptDateTime.getTime())) {
        skippedCount++;
        skippedReasons.set("Invalid date/time object", (skippedReasons.get("Invalid date/time object") || 0) + 1);
        console.warn("Invalid date/time object:", receipt.id, { year, month, day, hour, minute });
        return;
      }

      const dayIndex = getDayOfWeekIndex(receiptDateTime);
      const bucket = getTimeBucket(receiptDateTime);
      const bucketIndex = TIME_BUCKETS.findIndex((b) => b.id === bucket.id);

      if (bucketIndex === -1) {
        skippedCount++;
        skippedReasons.set("Could not find time bucket", (skippedReasons.get("Could not find time bucket") || 0) + 1);
        console.warn("Could not find time bucket:", receipt.id, bucket);
        return;
      }

      const key = `${dayIndex}-${bucketIndex}`;
      if (!cellData.has(key)) {
        cellData.set(key, []);
      }
      cellData.get(key)!.push(receipt);
      processedCount++;
    } catch (error) {
      skippedCount++;
      skippedReasons.set("Exception during processing", (skippedReasons.get("Exception during processing") || 0) + 1);
      console.warn("Invalid date/time in receipt:", receipt.id, receipt.date, receipt.time, error);
    }
  });

  // Log summary
  console.log(`[Behavior Trap Detector] Processed ${processedCount} receipts, skipped ${skippedCount}`);
  if (skippedCount > 0) {
    console.log("[Behavior Trap Detector] Skip reasons:", Object.fromEntries(skippedReasons));
  }

  // Calculate stats for each cell
  let maxRate = 0;
  let minRate = 1;

  cellData.forEach((cellReceipts, key) => {
    const [dayIndex, bucketIndex] = key.split("-").map(Number);

    if (cellReceipts.length < minCellCount) {
      return; // Skip cells with insufficient data
    }

    let sumSpend = 0;
    let sumHidden = 0;
    let sumPaidExTax = 0;

    cellReceipts.forEach((r) => {
      sumSpend += r.totalPaid || 0;
      sumHidden += r.hiddenCostCore;
      sumPaidExTax += r.paidExTax;
    });

    const avgRate = sumPaidExTax > 0 ? sumHidden / sumPaidExTax : 0;
    const clampedRate = Math.max(0, Math.min(1, avgRate));

    matrix[dayIndex][bucketIndex] = {
      avgRate: clampedRate,
      count: cellReceipts.length,
      sumSpend,
      sumHidden,
    };

    if (clampedRate > maxRate) maxRate = clampedRate;
    if (clampedRate < minRate) minRate = clampedRate;
  });

  return {
    matrix,
    maxRate: maxRate > 0 ? maxRate : 1,
    minRate: minRate < 1 ? minRate : 0,
  };
}

/**
 * Generate insights from heatmap
 */
export function generateInsights(
  heatmap: ReturnType<typeof computeHeatmap>,
  overallStats: OverallStats,
  receipts: ReceiptSummary[]
): BehaviorInsights {
  const { matrix, maxRate } = heatmap;
  const insights: BehaviorInsights = { primary: "" };

  // Find cell with highest hidden rate
  let maxCell: { day: number; bucket: number; rate: number; count: number } | null = null;
  
  // Category insight variable (defined outside if block for proper type narrowing)
  type CategoryInfo = { name: string; rate: number };
  let maxCategory: CategoryInfo | null = null;

  for (let day = 0; day < 7; day++) {
    for (let bucket = 0; bucket < 4; bucket++) {
      const cell = matrix[day][bucket];
      if (cell && cell.count >= 2) {
        if (!maxCell || cell.avgRate > maxCell.rate) {
          maxCell = {
            day,
            bucket,
            rate: cell.avgRate,
            count: cell.count,
          };
        }
      }
    }
  }

  // Primary insight: highest rate cell
  if (maxCell && maxCell.rate > overallStats.avgHiddenRate) {
    const dayName = getDayName(maxCell.day);
    const bucketLabel = TIME_BUCKETS[maxCell.bucket].label;
    const deltaPercent = ((maxCell.rate - overallStats.avgHiddenRate) * 100).toFixed(1);
    
    // Determine time description
    let timeDesc = "";
    if (maxCell.bucket === 0) timeDesc = "mornings";
    else if (maxCell.bucket === 1) timeDesc = "afternoons";
    else if (maxCell.bucket === 2) timeDesc = "evenings";
    else timeDesc = "nights";

    insights.primary = `Your hidden costs peak on ${dayName} ${timeDesc} (+${deltaPercent}% vs your overall average).`;
  } else if (receipts.length < 8) {
    insights.primary = "Not enough data yet — upload more receipts.";
  } else {
    insights.primary = "Your spending patterns are relatively consistent across days and times.";
  }

  // Secondary insight: small vs large purchases
  if (receipts.length >= 10) {
    const sortedByAmount = [...receipts].sort((a, b) => a.totalPaid - b.totalPaid);
    const smallThreshold = sortedByAmount[Math.floor(sortedByAmount.length * 0.5)].totalPaid;
    
    const smallReceipts = receipts.filter((r) => r.totalPaid < smallThreshold);
    const largeReceipts = receipts.filter((r) => r.totalPaid >= smallThreshold);

    if (smallReceipts.length > 0 && largeReceipts.length > 0) {
      const smallTotalPaidExTax = smallReceipts.reduce((sum, r) => sum + r.paidExTax, 0);
      const smallTotalHidden = smallReceipts.reduce((sum, r) => sum + r.hiddenCostCore, 0);
      const smallRate = smallTotalPaidExTax > 0 ? smallTotalHidden / smallTotalPaidExTax : 0;

      const largeTotalPaidExTax = largeReceipts.reduce((sum, r) => sum + r.paidExTax, 0);
      const largeTotalHidden = largeReceipts.reduce((sum, r) => sum + r.hiddenCostCore, 0);
      const largeRate = largeTotalPaidExTax > 0 ? largeTotalHidden / largeTotalPaidExTax : 0;

      if (Math.abs(smallRate - largeRate) > 0.05) {
        // 5% difference threshold
        if (smallRate > largeRate) {
          insights.secondary = `Small purchases have higher hidden ratios than large purchases.`;
        } else {
          insights.secondary = `Large purchases have higher hidden ratios than small purchases.`;
        }
      }
    }
  }

  // Category insight (if we have enough data)
  if (receipts.length >= 15) {
    const categoryMap = new Map<string, { totalPaidExTax: number; totalHidden: number; count: number }>();
    
    receipts.forEach((r) => {
      const cat = r.category || "other";
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { totalPaidExTax: 0, totalHidden: 0, count: 0 });
      }
      const stats = categoryMap.get(cat)!;
      stats.totalPaidExTax += r.paidExTax;
      stats.totalHidden += r.hiddenCostCore;
      stats.count++;
    });

    // Find category with highest rate above baseline
    categoryMap.forEach((stats, cat) => {
      if (stats.count >= 3) {
        const rate = stats.totalPaidExTax > 0 ? stats.totalHidden / stats.totalPaidExTax : 0;
        if (rate > overallStats.avgHiddenRate + 0.05) {
          if (!maxCategory || rate > maxCategory.rate) {
            maxCategory = { name: cat, rate };
          }
        }
      }
    });

    // Use maxCategory for secondary insight (inside the if block for proper type narrowing)
    if (maxCategory !== null && !insights.secondary) {
      // TypeScript type narrowing: maxCategory is not null here
      const categoryInfo: CategoryInfo = maxCategory;
      insights.secondary = `Category "${categoryInfo.name}" is consistently above your baseline.`;
    }
  }

  // Action suggestion
  if (maxCell && maxCell.rate > overallStats.avgHiddenRate + 0.05) {
    const dayName = getDayName(maxCell.day);
    const bucketLabel = TIME_BUCKETS[maxCell.bucket].label;
    
    // Suggest opposite time
    let suggestedTime = "";
    if (maxCell.bucket === 2) suggestedTime = "Weekday Daytime";
    else if (maxCell.bucket === 3) suggestedTime = "Daytime";
    else suggestedTime = "Weekday Mornings";

    insights.action = `Try shifting purchases from ${dayName} ${TIME_BUCKETS[maxCell.bucket].label} to ${suggestedTime} and compare.`;
  }

  return insights;
}

