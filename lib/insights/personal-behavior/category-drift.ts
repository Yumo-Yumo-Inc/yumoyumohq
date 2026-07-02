/**
 * category-drift — detects meaningful shifts in category share-of-wallet
 * between two adjacent time windows.
 *
 * Strategy:
 *
 *   1. Slice the last 60 days into two 30-day windows: `recent` (the most
 *      recent 30 days) and `baseline` (the 30 days before that).
 *
 *   2. For each window, compute the category share of total spend (the
 *      denominator is per-window total so we're comparing composition, not
 *      absolute inflation). Drop categories below a floor to avoid noise
 *      from one-off purchases.
 *
 *   3. Flag categories where the absolute share change is ≥ 8 percentage
 *      points AND the new share is ≥ 15% OR the category already was ≥ 20%.
 *
 *   4. Emit up to two insights (one top increase, one top decrease) so the
 *      feed stays readable.
 *
 * This engine answers: "Is the shape of your spending changing?" — not
 * "did you spend too much this month?" (that's past-self). Keeping the two
 * questions separate avoids overlapping cards.
 */

import type { ReceiptSummary } from "@/lib/insights/types";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import type {
  BehaviorEngineContext,
  DetectedInsight,
} from "./types";

const WINDOW_DAYS = 30;
const MIN_CATEGORY_SHARE_FLOOR = 0.04;
const MIN_DELTA_PP = 0.08; // 8 percentage points absolute
const STRONG_SHARE_THRESHOLD = 0.15;
const ALREADY_DOMINANT_THRESHOLD = 0.2;
const MIN_TOTAL_RECEIPTS = 10;

interface WindowAgg {
  total: number;
  receiptCount: number;
  byCategory: Map<string, number>;
}

function receiptDate(receipt: ReceiptSummary): Date | null {
  if (!receipt.date) return null;
  const d = new Date(receipt.date);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function emptyWindow(): WindowAgg {
  return { total: 0, receiptCount: 0, byCategory: new Map() };
}

function aggregate(receipts: ReceiptSummary[], start: Date, end: Date): WindowAgg {
  const agg = emptyWindow();
  for (const receipt of receipts) {
    const d = receiptDate(receipt);
    if (!d) continue;
    if (d < start || d >= end) continue;
    const amount = receipt.totalPaid ?? 0;
    if (amount <= 0) continue;
    const category = (receipt.category ?? "uncategorized").toLowerCase();
    agg.total += amount;
    agg.receiptCount += 1;
    agg.byCategory.set(category, (agg.byCategory.get(category) ?? 0) + amount);
  }
  return agg;
}

function share(agg: WindowAgg, category: string): number {
  if (agg.total <= 0) return 0;
  return (agg.byCategory.get(category) ?? 0) / agg.total;
}

interface DriftEntry {
  category: string;
  delta: number;
  recentShare: number;
  baselineShare: number;
  recentAmount: number;
  baselineAmount: number;
}

function pickExtreme(entries: DriftEntry[], direction: "up" | "down"): DriftEntry | null {
  const filtered = entries.filter((entry) =>
    direction === "up" ? entry.delta > 0 : entry.delta < 0
  );
  if (filtered.length === 0) return null;
  filtered.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return filtered[0];
}

export function detectCategoryDrift(
  receipts: ReceiptSummary[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  if (receipts.length < MIN_TOTAL_RECEIPTS) return [];

  const recentEnd = new Date(context.referenceDate);
  const recentStart = new Date(recentEnd);
  recentStart.setDate(recentStart.getDate() - WINDOW_DAYS);
  const baselineStart = new Date(recentStart);
  baselineStart.setDate(baselineStart.getDate() - WINDOW_DAYS);

  const recent = aggregate(receipts, recentStart, recentEnd);
  const baseline = aggregate(receipts, baselineStart, recentStart);

  if (recent.receiptCount < MIN_TOTAL_RECEIPTS / 2) return [];
  if (baseline.receiptCount < MIN_TOTAL_RECEIPTS / 2) return [];

  const categories = new Set<string>([
    ...recent.byCategory.keys(),
    ...baseline.byCategory.keys(),
  ]);

  const entries: DriftEntry[] = [];

  for (const category of categories) {
    const recentShare = share(recent, category);
    const baselineShare = share(baseline, category);
    const maxShare = Math.max(recentShare, baselineShare);
    if (maxShare < MIN_CATEGORY_SHARE_FLOOR) continue;

    const delta = recentShare - baselineShare;
    if (Math.abs(delta) < MIN_DELTA_PP) continue;

    // Require either a materially large new share, or an already-dominant
    // category losing weight — otherwise we flag noise.
    if (delta > 0 && recentShare < STRONG_SHARE_THRESHOLD) continue;
    if (delta < 0 && baselineShare < ALREADY_DOMINANT_THRESHOLD) continue;

    entries.push({
      category,
      delta,
      recentShare,
      baselineShare,
      recentAmount: recent.byCategory.get(category) ?? 0,
      baselineAmount: baseline.byCategory.get(category) ?? 0,
    });
  }

  if (entries.length === 0) return [];

  const insights: DetectedInsight[] = [];
  const top = pickExtreme(entries, "up");
  const bottom = pickExtreme(entries, "down");

  const locale = context.locale ?? "tr";
  const formatCategory = (category: string) => categoryLabel(category, locale);

  if (top) {
    const direction = "up" as const;
    const deltaPp = Math.round(top.delta * 100);
    const newShare = Math.round(top.recentShare * 100);
    const monetaryImpact = top.recentAmount - top.baselineAmount;
    const confidence =
      Math.round(
        Math.min(1, Math.max(0, 0.5 + Math.abs(top.delta) * 2 - 0.1)) * 100
      ) / 100;
    insights.push({
      id: `category_drift:up:${top.category}`,
      kind: "category_drift",
      title:
        locale === "tr"
          ? `${formatCategory(top.category)} harcamanda ağırlık kazanıyor`
          : `${formatCategory(top.category)} is gaining share`,
      summary:
        locale === "tr"
          ? `Son 30 günde harcamanın %${newShare}'i ${formatCategory(top.category)} kategorisinde — önceki 30 güne göre +${deltaPp} puan.`
          : `In the last 30 days, ${newShare}% of spend is in this category — up ${deltaPp}pp vs the prior window.`,
      confidence,
      monetaryImpact: Math.round(monetaryImpact * 100) / 100,
      currency: context.currency,
      payload: {
        category: top.category,
        direction,
        recentShare: Number(top.recentShare.toFixed(4)),
        baselineShare: Number(top.baselineShare.toFixed(4)),
        deltaPp: Number(top.delta.toFixed(4)),
        recentAmount: Math.round(top.recentAmount * 100) / 100,
        baselineAmount: Math.round(top.baselineAmount * 100) / 100,
        windowDays: WINDOW_DAYS,
      },
      suggestedCommitment: {
        kind: "category_cap",
        title:
          locale === "tr"
            ? `${formatCategory(top.category)} için limit koy`
            : `Set a cap for ${formatCategory(top.category)}`,
        description:
          locale === "tr"
            ? `Önceki 30 günlük harcaman kadar bir aylık tavan koy.`
            : `Cap next month at your prior 30-day level.`,
        params: {
          category: top.category,
          amount: Math.round(top.baselineAmount * 100) / 100,
          period: "monthly",
        },
        target: Math.round(top.baselineAmount * 100) / 100,
        currency: context.currency,
      },
    });
  }

  if (bottom) {
    const direction = "down" as const;
    const deltaPp = Math.round(bottom.delta * 100);
    const oldShare = Math.round(bottom.baselineShare * 100);
    const monetaryImpact = bottom.baselineAmount - bottom.recentAmount;
    const confidence =
      Math.round(
        Math.min(1, Math.max(0, 0.5 + Math.abs(bottom.delta) * 2 - 0.1)) * 100
      ) / 100;
    insights.push({
      id: `category_drift:down:${bottom.category}`,
      kind: "category_drift",
      title:
        locale === "tr"
          ? `${formatCategory(bottom.category)} harcaman azalıyor`
          : `${formatCategory(bottom.category)} is pulling back`,
      summary:
        locale === "tr"
          ? `Eskiden harcamanın %${oldShare}'iydi; son 30 günde ${deltaPp}pp azaldı.`
          : `Was ${oldShare}% of spend; down ${Math.abs(deltaPp)}pp in the last 30 days.`,
      confidence,
      monetaryImpact: Math.round(monetaryImpact * 100) / 100,
      currency: context.currency,
      payload: {
        category: bottom.category,
        direction,
        recentShare: Number(bottom.recentShare.toFixed(4)),
        baselineShare: Number(bottom.baselineShare.toFixed(4)),
        deltaPp: Number(bottom.delta.toFixed(4)),
        recentAmount: Math.round(bottom.recentAmount * 100) / 100,
        baselineAmount: Math.round(bottom.baselineAmount * 100) / 100,
        windowDays: WINDOW_DAYS,
      },
      // No suggested commitment on decreases — this is informational; the
      // streak_goal family may consume it in a later phase.
      suggestedCommitment: null,
    });
  }

  return insights;
}
