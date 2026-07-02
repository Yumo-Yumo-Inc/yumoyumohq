/**
 * stress-pulse — detects spending that correlates with stress signals.
 *
 * The idea: when people are stressed or mentally depleted, they tend to
 * spend on convenience (delivery, ready meals), comfort (snacks, desserts),
 * and escape (late-night purchases). These are not "bad" habits; they are
 * coping mechanisms that happen to have a financial footprint.
 *
 * Signals we look for:
 *   - Late evening / night purchases (21:00+)
 *   - Weekday purchases (Mon–Thu) more than weekend
 *   - Delivery, snack, fast-food, or convenience store categories
 *   - Small basket size but high frequency
 *   - Clustering: multiple purchases within 2-3 days
 *
 * Strategy:
 *   1. Look at the last 8 weeks.
 *   2. Filter to night (21-05) receipts on weekdays.
 *   3. Focus on convenience/comfort categories.
 *   4. Require ≥4 receipts and ≥60% wants share.
 *   5. Check for clustering (≥2 purchases within 48h at least twice).
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import type { BehaviorEngineContext, DetectedInsight } from "./types";
import { extractTimestamp, extractLocalHour, extractLocalDayOfWeek } from "./time-utils";

const LOOKBACK_DAYS = 56;
const MIN_RECEIPTS = 4;
const MIN_WANTS_SHARE = 0.6;

const STRESS_CATEGORIES = new Set([
  "delivery",
  "food_delivery",
  "snack",
  "dessert",
  "fast_food",
  "convenience",
  "bakery",
  "ice_cream",
]);

function isStressCategory(category: string | null | undefined): boolean {
  if (!category) return false;
  return STRESS_CATEGORIES.has(category.toLowerCase());
}

function isWeekday(dow: number): boolean {
  return dow >= 1 && dow <= 4; // Mon–Thu
}

export function detectStressPulse(
  receipts: ReceiptSummary[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  const cutoff = new Date(context.referenceDate);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const candidates: { receipt: ReceiptSummary; ts: Date; spend: number }[] = [];

  for (const receipt of receipts) {
    const ts = extractTimestamp(receipt);
    if (!ts || ts < cutoff) continue;
    const hour = extractLocalHour(receipt);
    if (hour === null) continue;
    const dow = extractLocalDayOfWeek(receipt);
    if (dow === null) continue;
    // Night (21-05) on weekdays
    if (!(hour >= 21 || hour < 5) || !isWeekday(dow)) continue;

    const spend = receipt.totalPaid ?? 0;
    if (spend <= 0) continue;

    candidates.push({ receipt, ts, spend });
  }

  if (candidates.length < MIN_RECEIPTS) return [];

  const stressReceipts = candidates.filter((c) => isStressCategory(c.receipt.category));
  const totalSpend = candidates.reduce((s, c) => s + c.spend, 0);
  const stressSpend = stressReceipts.reduce((s, c) => s + c.spend, 0);
  const wantsShare = totalSpend > 0 ? stressSpend / totalSpend : 0;

  if (wantsShare < MIN_WANTS_SHARE) return [];

  // Clustering check: at least two pairs within 48h.
  let clusterCount = 0;
  const sorted = [...candidates].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].ts.getTime() - sorted[i - 1].ts.getTime();
    if (diff <= 48 * 3600 * 1000) clusterCount++;
  }
  const hasClustering = clusterCount >= 2;

  // Top category.
  const catMap = new Map<string, number>();
  for (const c of stressReceipts) {
    const cat = c.receipt.category!.toLowerCase();
    catMap.set(cat, (catMap.get(cat) ?? 0) + c.spend);
  }
  const topCategory = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];

  // Confidence: sample + wants share + clustering bonus.
  const sampleWeight = Math.min(candidates.length / 10, 1);
  const wantsWeight = Math.min((wantsShare - MIN_WANTS_SHARE) / (1 - MIN_WANTS_SHARE), 1);
  const clusterWeight = hasClustering ? 1 : 0.3;
  const confidence = Math.round((0.35 * sampleWeight + 0.35 * wantsWeight + 0.3 * clusterWeight) * 100) / 100;

  const locale = context.locale ?? "tr";
  const topCatLabel = topCategory
    ? categoryLabel(topCategory[0], locale)
    : locale === "tr"
      ? "rahatlama alışverişi"
      : "comfort purchase";

  return [
    {
      id: `stress_pulse:weeknight:${context.referenceDate.toISOString().slice(0, 10)}`,
      kind: "stress_pulse",
      title:
        locale === "tr"
          ? "Hafta içi geç saatlerde bir rahatlama arayışı görünüyor"
          : "A weekday-night comfort pattern is visible",
      summary:
        locale === "tr"
          ? `Son ${LOOKBACK_DAYS} günde hafta içi gece saatlerinde ${candidates.length} alışveriş yapmışsın. Bunların %${Math.round(wantsShare * 100)}'i ${topCatLabel} gibi kategorilerde${hasClustering ? " ve bazıları 48 saat içinde tekrar etmiş" : ""}. Bu bir disiplin sorunu değil; günün yorgunluk tarafında bir kapanış refleksi olabilir.`
          : `In the last ${LOOKBACK_DAYS} days you made ${candidates.length} weekday-night purchases. ${Math.round(wantsShare * 100)}% are ${topCatLabel}${hasClustering ? " with some clustering within 48h" : ""}. This looks like end-of-day decompression, not a discipline problem.`,
      confidence,
      monetaryImpact: Math.round(stressSpend * 100) / 100,
      currency: context.currency,
      payload: {
        candidateCount: candidates.length,
        stressSpend: Math.round(stressSpend * 100) / 100,
        totalSpend: Math.round(totalSpend * 100) / 100,
        wantsShare: Number(wantsShare.toFixed(3)),
        hasClustering,
        topCategory: topCategory ? topCategory[0] : null,
        lookbackDays: LOOKBACK_DAYS,
      },
      suggestedCommitment: {
        kind: "time_rule",
        title: locale === "tr" ? "Gece rahatlama alışverişine 15 dakika ara" : "Pause 15 min before night comfort buys",
        description:
          locale === "tr"
            ? "21:00 sonrası ilk rahatlama alışverişinden önce 15 dakika bekle. Bu sürede enerji düşüşünü başka yolla dengelemeyi dene."
            : "Wait 15 minutes before your first post-21:00 comfort purchase. Try recharging another way during that time.",
        params: {
          hourStart: 21,
          hourEnd: 5,
          pauseMinutes: 15,
          targetCategories: "comfort",
        },
        currency: context.currency,
      },
    },
  ];
}
