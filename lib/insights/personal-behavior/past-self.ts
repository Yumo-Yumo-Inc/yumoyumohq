/**
 * past-self — compares the current month's spend to the user's trailing
 * 3-month median for the same period-to-date.
 *
 * The framing matters: "You've spent X by day 12" is a fair benchmark only
 * when compared to previous months *also by day 12*, not to the full
 * 30-day total of prior months. Without this correction, every insight
 * card would be trivially "you're under last month" until month end.
 *
 * Strategy:
 *
 *   1. Pin month-to-date (MTD) spend: current month, only receipts up to
 *      the reference date's day-of-month.
 *
 *   2. For each of the previous 3 months, compute spend with the same
 *      day-of-month cutoff. Take the median of those three numbers as the
 *      baseline — median, not mean, because a single outlier month (e.g.
 *      tax refund splurge) should not skew the comparison.
 *
 *   3. Emit an insight when |delta| ≥ 15% AND the absolute gap is ≥ 250
 *      (local currency proxy, orchestrator can scale later).
 *
 *   4. At most one card — this engine is the "monthly pulse" card.
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import type {
  BehaviorEngineContext,
  DetectedInsight,
} from "./types";

const LOOKBACK_MONTHS = 3;
const MIN_DELTA_RATIO = 0.15;
const MIN_ABS_DELTA = 250;
const MIN_BASELINE_RECEIPTS = 5;

function ymd(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function isOnOrBeforeDay(
  receiptDate: Date,
  cutoffYear: number,
  cutoffMonth: number,
  cutoffDay: number
): boolean {
  if (receiptDate.getFullYear() !== cutoffYear) return false;
  if (receiptDate.getMonth() !== cutoffMonth) return false;
  return receiptDate.getDate() <= cutoffDay;
}

function parseReceiptDate(receipt: ReceiptSummary): Date | null {
  if (!receipt.date) return null;
  const d = new Date(receipt.date);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function sumSpendInWindow(
  receipts: ReceiptSummary[],
  year: number,
  month: number,
  dayCutoff: number
): { total: number; count: number } {
  let total = 0;
  let count = 0;
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const effectiveCutoff = Math.min(dayCutoff, lastDayOfMonth);
  for (const receipt of receipts) {
    const d = parseReceiptDate(receipt);
    if (!d) continue;
    if (!isOnOrBeforeDay(d, year, month, effectiveCutoff)) continue;
    const amount = receipt.totalPaid ?? 0;
    if (amount <= 0) continue;
    total += amount;
    count += 1;
  }
  return { total, count };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function detectPastSelf(
  allReceipts: ReceiptSummary[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  const { year, month, day } = ymd(context.referenceDate);

  // Only compare receipts in the same currency — mixing THB+MYR produces garbage numbers
  const receipts = allReceipts.filter((r) => r.currency === context.currency);

  const current = sumSpendInWindow(receipts, year, month, day);
  // If we don't have enough activity this month, there's nothing meaningful
  // to compare — return empty rather than emit a misleading card.
  if (current.count < 2) return [];

  const prior: Array<{ year: number; month: number; total: number; count: number }> = [];
  for (let offset = 1; offset <= LOOKBACK_MONTHS; offset += 1) {
    const refDate = new Date(year, month - offset, 1);
    const py = refDate.getFullYear();
    const pm = refDate.getMonth();
    const window = sumSpendInWindow(receipts, py, pm, day);
    prior.push({ year: py, month: pm, ...window });
  }

  const sufficientPrior = prior.filter((p) => p.count >= 2);
  if (sufficientPrior.length < 2) return [];

  const totalBaselineReceipts = sufficientPrior.reduce(
    (acc, p) => acc + p.count,
    0
  );
  if (totalBaselineReceipts < MIN_BASELINE_RECEIPTS) return [];

  const baseline = median(sufficientPrior.map((p) => p.total));
  if (baseline <= 0) return [];

  const absDelta = current.total - baseline;
  const deltaRatio = absDelta / baseline;
  if (Math.abs(deltaRatio) < MIN_DELTA_RATIO) return [];
  if (Math.abs(absDelta) < MIN_ABS_DELTA) return [];

  const locale = context.locale ?? "tr";
  const direction = deltaRatio > 0 ? "over" : "under";
  const deltaPct = Math.round(Math.abs(deltaRatio) * 100);

  const confidence =
    Math.round(
      Math.min(
        1,
        0.4 +
          Math.min(sufficientPrior.length / 3, 1) * 0.3 +
          Math.min(Math.abs(deltaRatio) / 0.5, 1) * 0.3
      ) * 100
    ) / 100;

  return [
    {
      id: `past_self:${year}-${month + 1}:day_${day}`,
      kind: "past_self",
      title:
        locale === "tr"
          ? direction === "over"
            ? "Geçmiş 3 aya göre yukarıdasın"
            : "Geçmiş 3 aya göre aşağıdasın"
          : direction === "over"
            ? "Ahead of your 3-month trend"
            : "Behind your 3-month trend",
      summary:
        locale === "tr"
          ? direction === "over"
            ? `Bu ayın ${day}. gününde harcaman, geçmiş 3 ayın aynı gününe göre %${deltaPct} fazla (+${Math.round(
                absDelta
              )} ${context.currency}).`
            : `Bu ayın ${day}. gününde harcaman, geçmiş 3 ayın aynı gününe göre %${deltaPct} az (${Math.round(
                absDelta
              )} ${context.currency}).`
          : direction === "over"
            ? `By day ${day} this month you're ${deltaPct}% above your 3-month median (+${Math.round(
                absDelta
              )} ${context.currency}).`
            : `By day ${day} this month you're ${deltaPct}% below your 3-month median (${Math.round(
                absDelta
              )} ${context.currency}).`,
      confidence,
      monetaryImpact: Math.round(absDelta * 100) / 100,
      currency: context.currency,
      payload: {
        currentTotal: Math.round(current.total * 100) / 100,
        currentReceiptCount: current.count,
        baselineMedian: Math.round(baseline * 100) / 100,
        baselineMonths: sufficientPrior.map((p) => ({
          year: p.year,
          month: p.month + 1,
          total: Math.round(p.total * 100) / 100,
          count: p.count,
        })),
        dayOfMonth: day,
        direction,
        deltaRatio: Number(deltaRatio.toFixed(4)),
      },
      suggestedCommitment:
        direction === "over"
          ? {
              kind: "streak_goal",
              title:
                locale === "tr"
                  ? "Ayı kapatmak için 7 günlük denge serisi"
                  : "7-day balance streak to close the month",
              description:
                locale === "tr"
                  ? "Önümüzdeki 7 gün, günlük harcaman ortalamanın altında kalsın."
                  : "Keep daily spend below your average for the next 7 days.",
              params: {
                streakDays: 7,
                targetDailyAverage: Math.round((baseline / 30) * 100) / 100,
              },
              target: 7,
              currency: context.currency,
            }
          : null,
    },
  ];
}
