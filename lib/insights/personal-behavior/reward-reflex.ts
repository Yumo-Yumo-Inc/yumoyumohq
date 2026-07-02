/**
 * reward-reflex — detects evening decompression / reward spending.
 *
 * The idea: many people develop a small reward ritual at the end of the
 * workday — coffee, dessert, a quick snack, delivery — not because they
 * need it, but because it marks the transition from "productive time" to
 * "personal time". These purchases are small individually but frequent
 * and emotionally loaded.
 *
 * Strategy:
 *   1. Look at the last 10 weeks.
 *   2. Filter to evening (17-22) and night (22-05) receipts.
 *   3. Focus on wants-type categories: cafe, dessert, snack, delivery,
 *      fast food, bakery, ice cream.
 *   4. Require ≥5 receipts in the window, wants share ≥50%, and
 *      frequency ≥2 per week on average.
 *   5. Emit one insight describing the reward ritual.
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import type { BehaviorEngineContext, DetectedInsight } from "./types";
import { extractTimestamp, extractLocalHour } from "./time-utils";

const LOOKBACK_DAYS = 70;
const MIN_RECEIPTS = 5;
const MIN_WANTS_SHARE = 0.5;
const MIN_AVG_WEEKLY_FREQUENCY = 2;

const REWARD_CATEGORIES = new Set([
  "cafe",
  "coffee",
  "dessert",
  "snack",
  "delivery",
  "food_delivery",
  "fast_food",
  "bakery",
  "ice_cream",
  "bar",
]);

function isRewardCategory(category: string | null | undefined): boolean {
  if (!category) return false;
  return REWARD_CATEGORIES.has(category.toLowerCase());
}

export function detectRewardReflex(
  receipts: ReceiptSummary[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  const cutoff = new Date(context.referenceDate);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const windowReceipts: ReceiptSummary[] = [];
  let totalWindowSpend = 0;
  let rewardSpend = 0;

  for (const receipt of receipts) {
    const ts = extractTimestamp(receipt);
    if (!ts || ts < cutoff) continue;
    const localHour = extractLocalHour(receipt);
    if (localHour === null) continue;
    const hour = localHour;
    // Evening (17-22) or night (22-05)
    if (hour >= 5 && hour < 17) continue;

    const spend = receipt.totalPaid ?? 0;
    if (spend <= 0) continue;

    windowReceipts.push(receipt);
    totalWindowSpend += spend;

    if (isRewardCategory(receipt.category)) {
      rewardSpend += spend;
    }
  }

  if (windowReceipts.length < MIN_RECEIPTS) return [];

  const wantsShare = totalWindowSpend > 0 ? rewardSpend / totalWindowSpend : 0;
  if (wantsShare < MIN_WANTS_SHARE) return [];

  const weeks = Math.max(LOOKBACK_DAYS / 7, 1);
  const avgWeekly = windowReceipts.length / weeks;
  if (avgWeekly < MIN_AVG_WEEKLY_FREQUENCY) return [];

  // Find top reward category.
  const categoryBreakdown = new Map<string, number>();
  for (const r of windowReceipts) {
    if (isRewardCategory(r.category)) {
      const cat = r.category!.toLowerCase();
      categoryBreakdown.set(cat, (categoryBreakdown.get(cat) ?? 0) + (r.totalPaid ?? 0));
    }
  }
  const topCategory = Array.from(categoryBreakdown.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // Confidence: sample size (capped at 12) + wants share + frequency regularity.
  const sampleWeight = Math.min(windowReceipts.length / 12, 1);
  const wantsWeight = Math.min((wantsShare - MIN_WANTS_SHARE) / (1 - MIN_WANTS_SHARE), 1);
  const freqWeight = Math.min(avgWeekly / 5, 1);
  const confidence = Math.round((0.4 * sampleWeight + 0.35 * wantsWeight + 0.25 * freqWeight) * 100) / 100;

  const locale = context.locale ?? "tr";
  const topCatLabel = topCategory
    ? categoryLabel(topCategory[0], locale)
    : locale === "tr"
      ? "ödül alışverişi"
      : "reward purchase";

  return [
    {
      id: `reward_reflex:evening:${context.referenceDate.toISOString().slice(0, 10)}`,
      kind: "reward_reflex",
      title:
        locale === "tr"
          ? "Akşam ödül ritüelin belirginleşiyor"
          : "Your evening reward ritual is forming",
      summary:
        locale === "tr"
          ? `Son ${LOOKBACK_DAYS} günde akşam ve gece saatlerinde ${windowReceipts.length} alışveriş yapmışsın. Bunların %${Math.round(wantsShare * 100)}'i ${topCatLabel} gibi küçük ödül kategorilerinde. Bu bir savurganlık değil; günün kapanış ritüeli olabilir.`
          : `In the last ${LOOKBACK_DAYS} days you made ${windowReceipts.length} evening/night purchases. ${Math.round(wantsShare * 100)}% are small rewards like ${topCatLabel}. This looks like a decompression ritual, not wastefulness.`,
      confidence,
      monetaryImpact: Math.round(rewardSpend * 100) / 100,
      currency: context.currency,
      payload: {
        windowReceipts: windowReceipts.length,
        totalWindowSpend: Math.round(totalWindowSpend * 100) / 100,
        rewardSpend: Math.round(rewardSpend * 100) / 100,
        wantsShare: Number(wantsShare.toFixed(3)),
        avgWeeklyFrequency: Number(avgWeekly.toFixed(2)),
        topCategory: topCategory ? topCategory[0] : null,
        lookbackDays: LOOKBACK_DAYS,
      },
      suggestedCommitment: {
        kind: "time_rule",
        title: locale === "tr" ? "Akşam ödülünü 10 dakika geciktir" : "Delay evening reward by 10 min",
        description:
          locale === "tr"
            ? "Akşam saatlerinde ilk ödül alışverişinden önce 10 dakika bekle. Karar hâlâ mantıklıysa al."
            : "Wait 10 minutes before your first evening reward purchase. If it still makes sense, go ahead.",
        params: {
          hourStart: 17,
          hourEnd: 23,
          pauseMinutes: 10,
          targetCategories: "reward",
        },
        currency: context.currency,
      },
    },
  ];
}
