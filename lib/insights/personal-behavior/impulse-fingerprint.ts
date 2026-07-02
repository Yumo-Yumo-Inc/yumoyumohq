/**
 * impulse-fingerprint — identifies the user's personal "high-impulse window"
 * (day-of-week × hour bucket) and the categories that leak spend into it.
 *
 * The idea: many people have a recurring micro-pattern — e.g. "Friday night
 * 22–01, snack + delivery" — that accounts for a meaningful share of wants
 * spending but is invisible when you just look at monthly totals. By
 * surfacing the pattern as a single sentence the user can recognise, we
 * convert a passive spend report into an actionable commitment (time rule
 * or category cap).
 *
 * Strategy:
 *
 *   1. Consider only the last 12 weeks to keep the fingerprint current.
 *
 *   2. Bucket each receipt into (dayOfWeek, hourBucket) where the hour
 *      bucket is one of: morning (05–11), afternoon (11–17),
 *      evening (17–22), night (22–05). This matches how humans actually
 *      talk about shopping moments and reduces dimensionality so 12 weeks
 *      of data is enough.
 *
 *   3. For each bucket compute total spend and a "wants share" — the
 *      fraction of bucket spend that falls into wants-type categories
 *      (dining, entertainment, snack-heavy grocery sub-categories, etc.).
 *      A high wants share with a non-trivial absolute number is the
 *      impulse signal.
 *
 *   4. Emit at most one insight — the strongest bucket. Otherwise the feed
 *      fills with tiny same-shape cards.
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import type {
  BehaviorEngineContext,
  DetectedInsight,
} from "./types";

const LOOKBACK_DAYS = 84;
const MIN_RECEIPTS_IN_BUCKET = 4;
const MIN_WANTS_SHARE = 0.55;
const MIN_SHARE_OF_WALLET = 0.1;

type HourBucket = "morning" | "afternoon" | "evening" | "night";

const WANTS_CATEGORIES = new Set([
  "dining",
  "restaurants",
  "restaurant",
  "fast_food",
  "cafe",
  "coffee",
  "bar",
  "alcohol",
  "entertainment",
  "delivery",
  "food_delivery",
  "snack",
  "dessert",
  "bakery",
  "ice_cream",
  "streaming",
  "gaming",
]);

function hourBucket(hour: number): HourBucket {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function extractTimestamp(receipt: ReceiptSummary): Date | null {
  if (!receipt.date) return null;
  const d = new Date(receipt.date);
  if (Number.isNaN(d.getTime())) return null;
  if (receipt.time && /^\d{2}:\d{2}/.test(receipt.time)) {
    const [hh, mm] = receipt.time.split(":");
    d.setUTCHours(Number(hh), Number(mm), 0, 0);
  }
  return d;
}

function isWants(category: string | null | undefined): boolean {
  if (!category) return false;
  return WANTS_CATEGORIES.has(category.toLowerCase());
}

interface BucketAgg {
  dayOfWeek: number;
  hourBucket: HourBucket;
  totalSpend: number;
  wantsSpend: number;
  receiptIds: string[];
  categoryBreakdown: Map<string, number>;
}

function bucketKey(dayOfWeek: number, bucket: HourBucket): string {
  return `${dayOfWeek}:${bucket}`;
}

function dayOfWeekLabel(dow: number, locale: "tr" | "en"): string {
  const tr = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const en = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (locale === "tr" ? tr : en)[dow] ?? "";
}

function bucketLabel(bucket: HourBucket, locale: "tr" | "en"): string {
  const map: Record<HourBucket, [string, string]> = {
    morning: ["sabah (05–11)", "morning (5–11)"],
    afternoon: ["öğleden sonra (11–17)", "afternoon (11–17)"],
    evening: ["akşam (17–22)", "evening (17–22)"],
    night: ["gece (22–05)", "night (22–5)"],
  };
  return locale === "tr" ? map[bucket][0] : map[bucket][1];
}

export function detectImpulseFingerprint(
  receipts: ReceiptSummary[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  const cutoff = new Date(context.referenceDate);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const buckets = new Map<string, BucketAgg>();
  let walletTotal = 0;

  for (const receipt of receipts) {
    const ts = extractTimestamp(receipt);
    if (!ts || ts < cutoff) continue;
    const spend = receipt.totalPaid ?? 0;
    if (spend <= 0) continue;

    walletTotal += spend;

    const dow = ts.getUTCDay();
    const bucket = hourBucket(ts.getUTCHours());
    const key = bucketKey(dow, bucket);

    let agg = buckets.get(key);
    if (!agg) {
      agg = {
        dayOfWeek: dow,
        hourBucket: bucket,
        totalSpend: 0,
        wantsSpend: 0,
        receiptIds: [],
        categoryBreakdown: new Map(),
      };
      buckets.set(key, agg);
    }

    agg.totalSpend += spend;
    agg.receiptIds.push(receipt.id);
    const category = receipt.category ?? null;
    if (isWants(category)) agg.wantsSpend += spend;
    if (category) {
      agg.categoryBreakdown.set(
        category,
        (agg.categoryBreakdown.get(category) ?? 0) + spend
      );
    }
  }

  if (walletTotal <= 0) return [];

  // Pick strongest candidate bucket.
  let best: BucketAgg | null = null;
  let bestScore = 0;

  for (const agg of buckets.values()) {
    if (agg.receiptIds.length < MIN_RECEIPTS_IN_BUCKET) continue;
    const wantsShare = agg.wantsSpend / agg.totalSpend;
    const shareOfWallet = agg.totalSpend / walletTotal;
    if (wantsShare < MIN_WANTS_SHARE) continue;
    if (shareOfWallet < MIN_SHARE_OF_WALLET) continue;

    // Score favours buckets that are both high-wants and high-volume.
    const score = wantsShare * 0.6 + shareOfWallet * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = agg;
    }
  }

  if (!best) return [];

  const wantsShare = best.wantsSpend / best.totalSpend;
  const shareOfWallet = best.totalSpend / walletTotal;

  const topCategory = Array.from(best.categoryBreakdown.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const locale = context.locale ?? "tr";
  const dowLabel = dayOfWeekLabel(best.dayOfWeek, locale);
  const bLabel = bucketLabel(best.hourBucket, locale);

  // Confidence grows with sample size (capped at 12) and wants share.
  const sampleWeight = Math.min(best.receiptIds.length / 12, 1);
  const wantsWeight = Math.min((wantsShare - MIN_WANTS_SHARE) / (1 - MIN_WANTS_SHARE), 1);
  const confidence =
    Math.round((0.6 * sampleWeight + 0.4 * wantsWeight) * 100) / 100;

  return [
    {
      id: `impulse_fingerprint:${best.dayOfWeek}:${best.hourBucket}`,
      kind: "impulse_fingerprint",
      title:
        locale === "tr"
          ? `${dowLabel} ${bLabel}: impulse pencere`
          : `${dowLabel} ${bLabel}: impulse window`,
      summary:
        locale === "tr"
          ? `${best.receiptIds.length} alışverişin bu pencerede; toplam harcamanın %${Math.round(
              shareOfWallet * 100
            )}'i ve bunun %${Math.round(wantsShare * 100)}'i wants kategorisinde${
              topCategory ? ` (en çok: ${topCategory[0]})` : ""
            }.`
          : `${best.receiptIds.length} receipts land in this window; ${Math.round(
              shareOfWallet * 100
            )}% of your 12-week spend, of which ${Math.round(
              wantsShare * 100
            )}% is wants-type${topCategory ? ` (top: ${topCategory[0]})` : ""}.`,
      confidence,
      monetaryImpact: Math.round(best.wantsSpend * 100) / 100,
      currency: context.currency,
      payload: {
        dayOfWeek: best.dayOfWeek,
        hourBucket: best.hourBucket,
        totalSpend: Math.round(best.totalSpend * 100) / 100,
        wantsSpend: Math.round(best.wantsSpend * 100) / 100,
        wantsShare: Number(wantsShare.toFixed(3)),
        shareOfWallet: Number(shareOfWallet.toFixed(3)),
        sampleSize: best.receiptIds.length,
        topCategory: topCategory ? topCategory[0] : null,
        lookbackDays: LOOKBACK_DAYS,
      },
      suggestedCommitment: {
        kind: "time_rule",
        title:
          locale === "tr"
            ? `${dowLabel} ${bLabel} kuralı`
            : `${dowLabel} ${bLabel} rule`,
        description:
          locale === "tr"
            ? "Bu pencerede wants kategorisinde alışveriş yapmadan önce 10 dakika bekle."
            : "Pause 10 minutes before any wants purchase in this window.",
        params: {
          dayOfWeek: best.dayOfWeek,
          hourBucket: best.hourBucket,
          pauseMinutes: 10,
          targetCategories: "wants",
        },
        currency: context.currency,
      },
    },
  ];
}
