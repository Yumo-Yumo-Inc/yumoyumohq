/**
 * ritual-loop — detects weekly or daily behavioral rituals.
 *
 * The idea: humans are ritual creatures. The same coffee on the same
 * weekday, the same restaurant every Friday, the same grocery run every
 * Sunday morning. These patterns are not impulse; they are structure.
 * Recognising them helps the user distinguish between "I want this"
 * and "this is just what I do at this time".
 *
 * Strategy:
 *   1. Look at the last 12 weeks.
 *   2. Group receipts by (dayOfWeek, hourBucket, category).
 *   3. Find groups that repeat ≥3 times with ≥70% regularity
 *      (same day + same bucket).
 *   4. Emit one insight per strong ritual.
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import type { BehaviorEngineContext, DetectedInsight } from "./types";
import {
  extractTimestamp,
  extractLocalHour,
  extractLocalDayOfWeek,
  hourBucket,
  dayOfWeekLabel,
  bucketLabel,
} from "./time-utils";

const LOOKBACK_DAYS = 84;
const MIN_REPEAT_COUNT = 3;
const MIN_REGULARITY = 0.7; // 70% of occurrences land in the same bucket



export function detectRitualLoop(
  receipts: ReceiptSummary[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  const cutoff = new Date(context.referenceDate);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  // Group by (dayOfWeek, hourBucket, category)
  const groups = new Map<
    string,
    {
      receipts: ReceiptSummary[];
      total: number;
      dayOfWeek: number;
      bucket: string;
      category: string;
    }
  >();

  for (const receipt of receipts) {
    const ts = extractTimestamp(receipt);
    if (!ts || ts < cutoff) continue;
    const spend = receipt.totalPaid ?? 0;
    if (spend <= 0) continue;

    const dow = extractLocalDayOfWeek(receipt);
    if (dow === null) continue;
    const localHour = extractLocalHour(receipt);
    if (localHour === null) continue;
    const bucket = hourBucket(localHour);
    const category = (receipt.category ?? "uncategorized").toLowerCase();
    const key = `${dow}:${bucket}:${category}`;

    let g = groups.get(key);
    if (!g) {
      g = { receipts: [], total: 0, dayOfWeek: dow, bucket, category };
      groups.set(key, g);
    }
    g.receipts.push(receipt);
    g.total += spend;
  }

  // Also group by category alone to compute regularity.
  const categoryGroups = new Map<string, { receipts: ReceiptSummary[]; sameSlotCount: number }>();
  for (const [key, g] of groups) {
    const catTotal = categoryGroups.get(g.category) ?? { receipts: [], sameSlotCount: 0 };
    catTotal.receipts.push(...g.receipts);
    catTotal.sameSlotCount += g.receipts.length;
    categoryGroups.set(g.category, catTotal);
  }

  // Find strongest ritual.
  let best: (typeof groups.values extends () => Iterator<infer T> ? T : never) | null = null;
  let bestScore = 0;

  for (const g of groups.values()) {
    if (g.receipts.length < MIN_REPEAT_COUNT) continue;

    const catTotal = categoryGroups.get(g.category);
    const regularity = catTotal && catTotal.receipts.length > 0
      ? g.receipts.length / catTotal.receipts.length
      : 0;

    if (regularity < MIN_REGULARITY) continue;

    const score = g.total * regularity * Math.log(g.receipts.length + 1);
    if (score > bestScore) {
      bestScore = score;
      best = g;
    }
  }

  if (!best) return [];

  const weeks = Math.max(LOOKBACK_DAYS / 7, 1);
  const weeklyRate = best.receipts.length / weeks;
  const avgAmount = best.total / best.receipts.length;

  const catTotal = categoryGroups.get(best.category);
  const regularity = catTotal && catTotal.receipts.length > 0
    ? best.receipts.length / catTotal.receipts.length
    : 0;

  // Confidence: repeat count + regularity + duration.
  const repeatWeight = Math.min(best.receipts.length / 10, 1);
  const regularityWeight = Math.min((regularity - MIN_REGULARITY) / (1 - MIN_REGULARITY), 1);
  const durationWeight = Math.min(weeklyRate / 2, 1);
  const confidence = Math.round((0.4 * repeatWeight + 0.4 * regularityWeight + 0.2 * durationWeight) * 100) / 100;

  const locale = context.locale ?? "tr";
  const dayLabel = dayOfWeekLabel(best.dayOfWeek, locale);
  const bucketLabelValue = bucketLabel(best.bucket as import("./time-utils").HourBucket, locale);
  const categoryLabel = best.category.charAt(0).toUpperCase() + best.category.slice(1);

  return [
    {
      id: `ritual_loop:${best.dayOfWeek}:${best.bucket}:${best.category}`,
      kind: "ritual_loop",
      title:
        locale === "tr"
          ? `${dayLabel} ${bucketLabelValue} — ${categoryLabel} ritüelin`
          : `${dayLabel} ${bucketLabelValue} — your ${categoryLabel} ritual`,
      summary:
        locale === "tr"
          ? `Son ${Math.round(weeks)} haftada ${best.receipts.length} kez ${dayLabel} ${bucketLabelValue} saatlerinde ${categoryLabel} harcaması yapmışsın. Bu kategorideki harcamalarının %${Math.round(regularity * 100)}'i tam bu zamana denk geliyor. Bu bir düzen — iyi veya kötü değil, sadece bir ritim.`
          : `Over the last ${Math.round(weeks)} weeks you made ${best.receipts.length} ${dayLabel} ${bucketLabelValue} ${categoryLabel} purchases. ${Math.round(regularity * 100)}% of your ${categoryLabel} spending falls in this exact slot. It's structure — neither good nor bad, just rhythm.`,
      confidence,
      monetaryImpact: Math.round(best.total * 100) / 100,
      currency: context.currency,
      payload: {
        dayOfWeek: best.dayOfWeek,
        hourBucket: best.bucket,
        category: best.category,
        repeatCount: best.receipts.length,
        totalSpend: Math.round(best.total * 100) / 100,
        avgAmount: Math.round(avgAmount * 100) / 100,
        weeklyRate: Number(weeklyRate.toFixed(2)),
        regularity: Number(regularity.toFixed(3)),
        lookbackDays: LOOKBACK_DAYS,
      },
      suggestedCommitment: {
        kind: "time_rule",
        title: locale === "tr" ? "Ritüeli bir kez farklı yap" : "Do the ritual differently once",
        description:
          locale === "tr"
            ? "Bu ritmi tamamen kırmak yerine bir hafta farklı bir alternatif dene. Aynı ihtiyacı başka yolla karşılayabiliyor musun?"
            : "Instead of breaking the ritual entirely, try one different alternative this week. Can you meet the same need another way?",
        params: {
          dayOfWeek: best.dayOfWeek,
          hourBucket: best.bucket,
          category: best.category,
          experiment: "try_alternative_once",
        },
        currency: context.currency,
      },
    },
  ];
}
