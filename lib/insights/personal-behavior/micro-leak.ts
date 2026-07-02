/**
 * micro-leak — detects small, repeated purchases that quietly add up.
 *
 * The idea: a 35-TL coffee every weekday feels like nothing. But over a
 * month that's 700+ TL. The brain doesn't register small repeats the same
 * way it registers one large purchase. This engine surfaces the hidden
 * volume of micro-spending.
 *
 * Strategy:
 *   1. Look at the last 10 weeks.
 *   2. Group receipts by merchant + category + hour bucket.
 *   3. Find groups where each purchase is small (< median basket * 0.4)
 *      but the group repeats ≥5 times.
 *   4. The leak is the total of the group minus what it would cost if
 *      the user limited it to a reasonable frequency (e.g. 3x/week).
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import type { BehaviorEngineContext, DetectedInsight } from "./types";
import { extractTimestamp, extractLocalHour } from "./time-utils";

const LOOKBACK_DAYS = 70;
const MIN_REPEAT_COUNT = 5;
const MAX_BASKET_RATIO = 0.4; // must be < 40% of median basket

function hourBucket(hour: number): string {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function detectMicroLeak(
  receipts: ReceiptSummary[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  const cutoff = new Date(context.referenceDate);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  // Compute median basket for the user.
  const allAmounts = receipts
    .filter((r) => {
      const ts = extractTimestamp(r);
      return ts && ts >= cutoff && (r.totalPaid ?? 0) > 0;
    })
    .map((r) => r.totalPaid ?? 0)
    .sort((a, b) => a - b);

  const medianBasket =
    allAmounts.length === 0
      ? 0
      : allAmounts.length % 2 === 1
        ? allAmounts[Math.floor(allAmounts.length / 2)]
        : (allAmounts[allAmounts.length / 2 - 1] + allAmounts[allAmounts.length / 2]) / 2;

  if (medianBasket <= 0) return [];

  const maxMicroAmount = medianBasket * MAX_BASKET_RATIO;

  // Group by merchant + category + hour bucket.
  const groups = new Map<
    string,
    { receipts: ReceiptSummary[]; total: number; merchant: string; category: string; bucket: string }
  >();

  for (const receipt of receipts) {
    const ts = extractTimestamp(receipt);
    if (!ts || ts < cutoff) continue;
    const spend = receipt.totalPaid ?? 0;
    if (spend <= 0 || spend > maxMicroAmount) continue;

    const merchant = (receipt.merchantName ?? "unknown").toLowerCase().trim();
    const category = (receipt.category ?? "uncategorized").toLowerCase();
    const localHour = extractLocalHour(receipt);
    if (localHour === null) continue;
    const bucket = hourBucket(localHour);
    const key = `${merchant}:${category}:${bucket}`;

    let g = groups.get(key);
    if (!g) {
      g = { receipts: [], total: 0, merchant, category, bucket };
      groups.set(key, g);
    }
    g.receipts.push(receipt);
    g.total += spend;
  }

  // Find the strongest leak group.
  let best: (typeof groups.values extends () => Iterator<infer T> ? T : never) | null = null;
  let bestScore = 0;

  for (const g of groups.values()) {
    if (g.receipts.length < MIN_REPEAT_COUNT) continue;
    const score = g.total * Math.log(g.receipts.length + 1);
    if (score > bestScore) {
      bestScore = score;
      best = g;
    }
  }

  if (!best) return [];

  const weeks = Math.max(LOOKBACK_DAYS / 7, 1);
  const avgWeekly = best.receipts.length / weeks;

  // Estimate monthly leak if frequency continues.
  const monthlyProjected = (best.total / best.receipts.length) * avgWeekly * 4.3;

  // Confidence: repeat count (capped at 15) + amount significance.
  const repeatWeight = Math.min(best.receipts.length / 15, 1);
  const amountWeight = Math.min(monthlyProjected / (medianBasket * 4), 1);
  const confidence = Math.round((0.5 * repeatWeight + 0.5 * amountWeight) * 100) / 100;

  const locale = context.locale ?? "tr";
  const merchantLabel =
    best.merchant.charAt(0).toUpperCase() + best.merchant.slice(1);

  return [
    {
      id: `micro_leak:${best.merchant}:${best.category}:${best.bucket}`,
      kind: "micro_leak",
      title:
        locale === "tr"
          ? `${merchantLabel}'te küçük ama sık tekrar eden bir akış`
          : `A small-but-steady stream at ${merchantLabel}`,
      summary:
        locale === "tr"
          ? `Son ${LOOKBACK_DAYS} günde ${best.receipts.length} kez ${merchantLabel}'ten ortalama ${Math.round((best.total / best.receipts.length) * 100) / 100} ${context.currency ?? "TL"} harcamışsın. Tek başına küçük ama haftada ~${Math.round(avgWeekly * 10) / 10} kez tekrar ediyor. Bu bir sızıntı değil; bir ritim. Ama farkında olmak faydalı.`
          : `In the last ${LOOKBACK_DAYS} days you visited ${merchantLabel} ${best.receipts.length} times, averaging ${Math.round((best.total / best.receipts.length) * 100) / 100} ${context.currency ?? "TL"}. Small alone, but ~${Math.round(avgWeekly * 10) / 10}x per week. It's a rhythm, not a leak — but awareness helps.`,
      confidence,
      monetaryImpact: Math.round(monthlyProjected * 100) / 100,
      currency: context.currency,
      payload: {
        merchant: best.merchant,
        category: best.category,
        hourBucket: best.bucket,
        repeatCount: best.receipts.length,
        totalSpend: Math.round(best.total * 100) / 100,
        avgAmount: Math.round((best.total / best.receipts.length) * 100) / 100,
        avgWeeklyFrequency: Number(avgWeekly.toFixed(2)),
        monthlyProjected: Math.round(monthlyProjected * 100) / 100,
        medianBasket: Math.round(medianBasket * 100) / 100,
        lookbackDays: LOOKBACK_DAYS,
      },
      suggestedCommitment: {
        kind: "frequency_cap",
        title: locale === "tr" ? "Haftada 2 kez sınırı dene" : "Try a 2x/week limit",
        description:
          locale === "tr"
            ? "Bu ritmi tamamen kesmek yerine haftada 2 kez sınırı koy. Kalan günlerde alternatif bir mola yöntemi dene."
            : "Instead of cutting this rhythm entirely, cap it at 2x/week. Try an alternative break on other days.",
        params: {
          merchant: best.merchant,
          category: best.category,
          maxWeekly: 2,
        },
        currency: context.currency,
      },
    },
  ];
}
