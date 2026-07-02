/**
 * own-price-track — detects meaningful unit-price drift on products the user
 * buys repeatedly.
 *
 * Strategy:
 *
 *   1. Group line items by a stable product key. We prefer
 *      `canonical_name + pack_size + unit_type` (so "Süt 1L" stays
 *      distinct from "Süt 500ml"). When canonical_name is null we fall
 *      back to a normalised rawName, but noisy rows (no quantity, no
 *      price) are dropped.
 *
 *   2. Require ≥ 3 purchases spanning ≥ 14 days and at least 2 distinct
 *      calendar weeks. Any less and price drift is indistinguishable from
 *      promo / tier change noise.
 *
 *   3. Compute the normalised unit price series (lineTotalGross / quantity
 *      / packSize when pack_size is present; otherwise unitPriceGross).
 *      Compare the most recent observation to the median of the prior
 *      observations.
 *
 *   4. Emit an insight when the delta is ≥ 8% (either direction) AND the
 *      absolute change per unit is ≥ 0.5 in local currency — tiny swings
 *      on cheap items are not worth a card.
 *
 *   5. Confidence scales with sample size (capped at 12 observations) and
 *      time coverage (capped at 90 days). See `scoreConfidence`.
 *
 * The engine never compares across users, never asks "is this cheap at X
 * vs Y store" — that's explicitly out of scope per the product direction.
 * It only answers: "For YOU, is this product getting more expensive?"
 */

import type { CachedReceiptLineItem } from "@/lib/offline/types";
import type {
  BehaviorEngineContext,
  DetectedInsight,
} from "./types";

const MIN_OBSERVATIONS = 3;
const MIN_SPAN_DAYS = 14;
const MIN_DISTINCT_WEEKS = 2;
const MIN_DELTA_RATIO = 0.08;
const MIN_ABS_DELTA = 0.5;

interface ProductSeries {
  key: string;
  canonicalName: string | null;
  brand: string | null;
  packSize: number | null;
  unitType: string | null;
  observations: Array<{
    purchasedAt: Date;
    unitPrice: number;
    quantity: number;
    receiptId: string;
  }>;
}

function normaliseText(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "");
}

function productKey(item: CachedReceiptLineItem): string | null {
  const name = item.canonicalName?.trim() || item.rawName?.trim();
  if (!name) return null;
  const parts = [normaliseText(name)];
  if (item.packSize != null) parts.push(`p${item.packSize}`);
  if (item.unitType) parts.push(item.unitType.slice(0, 4));
  return parts.join(":");
}

/**
 * Unit price per normalised unit of packaging.
 *
 * If we have a line total and pack size, (line total / qty / pack size)
 * is the cleanest signal — robust against OCR errors in `unit_price_gross`.
 * Falls back to the unit_price_gross column when that path isn't viable.
 */
function normalisedUnitPrice(item: CachedReceiptLineItem): number | null {
  const qty = item.quantity || 1;
  if (item.lineTotalGross && item.packSize && item.packSize > 0) {
    const perUnit = item.lineTotalGross / qty / item.packSize;
    if (Number.isFinite(perUnit) && perUnit > 0) return perUnit;
  }
  if (item.unitPriceGross && item.unitPriceGross > 0) {
    return item.packSize && item.packSize > 0
      ? item.unitPriceGross / item.packSize
      : item.unitPriceGross;
  }
  if (item.lineTotalGross && qty > 0) {
    return item.lineTotalGross / qty;
  }
  return null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function weekKey(date: Date): string {
  const year = date.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const offset = Math.floor((date.getTime() - jan1.getTime()) / 86400000);
  const week = Math.floor((offset + jan1.getUTCDay()) / 7);
  return `${year}-${week}`;
}

function scoreConfidence(
  sampleSize: number,
  spanDays: number,
  deltaRatio: number
): number {
  const sampleWeight = Math.min(sampleSize / 12, 1);
  const spanWeight = Math.min(spanDays / 90, 1);
  const deltaWeight = Math.min(Math.abs(deltaRatio) / 0.3, 1);
  const raw = 0.5 * sampleWeight + 0.3 * spanWeight + 0.2 * deltaWeight;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100) / 100;
}

export function detectOwnPriceTrack(
  allLineItems: CachedReceiptLineItem[],
  context: BehaviorEngineContext
): DetectedInsight[] {
  // Filter to the dominant currency so cross-currency price comparisons don't fire
  const lineItems = allLineItems.filter((li) => li.currency === context.currency);
  if (lineItems.length < MIN_OBSERVATIONS) return [];

  const seriesByKey = new Map<string, ProductSeries>();

  for (const item of lineItems) {
    const key = productKey(item);
    if (!key) continue;
    const unitPrice = normalisedUnitPrice(item);
    if (unitPrice === null) continue;
    const purchasedAt = item.purchasedAt ? new Date(item.purchasedAt) : null;
    if (!purchasedAt || Number.isNaN(purchasedAt.getTime())) continue;

    let series = seriesByKey.get(key);
    if (!series) {
      series = {
        key,
        canonicalName: item.canonicalName ?? item.rawName ?? null,
        brand: item.brand,
        packSize: item.packSize,
        unitType: item.unitType,
        observations: [],
      };
      seriesByKey.set(key, series);
    }
    series.observations.push({
      purchasedAt,
      unitPrice,
      quantity: item.quantity,
      receiptId: item.receiptId,
    });
  }

  const insights: DetectedInsight[] = [];

  for (const series of seriesByKey.values()) {
    if (series.observations.length < MIN_OBSERVATIONS) continue;

    // Sort ascending by date so the last element is the most recent.
    series.observations.sort(
      (a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime()
    );

    const distinctWeeks = new Set(
      series.observations.map((obs) => weekKey(obs.purchasedAt))
    );
    if (distinctWeeks.size < MIN_DISTINCT_WEEKS) continue;

    const spanDays =
      (series.observations[series.observations.length - 1].purchasedAt.getTime() -
        series.observations[0].purchasedAt.getTime()) /
      86400000;
    if (spanDays < MIN_SPAN_DAYS) continue;

    const latest = series.observations[series.observations.length - 1];
    const prior = series.observations.slice(0, -1);
    const baseline = median(prior.map((obs) => obs.unitPrice));
    if (baseline <= 0) continue;

    const absDelta = latest.unitPrice - baseline;
    const deltaRatio = absDelta / baseline;

    if (Math.abs(deltaRatio) < MIN_DELTA_RATIO) continue;
    if (Math.abs(absDelta) < MIN_ABS_DELTA) continue;

    // Monetary impact over the next 30 days assuming the user keeps their
    // observed purchase cadence. We do NOT invent future purchases — we
    // derive frequency from the observed span.
    const purchasesPerDay = series.observations.length / Math.max(spanDays, 1);
    const projectedPurchases = purchasesPerDay * 30;
    const avgQtyPerPurchase =
      series.observations.reduce((acc, obs) => acc + obs.quantity, 0) /
      series.observations.length;
    const packMultiplier = series.packSize && series.packSize > 0 ? series.packSize : 1;
    const monthlyImpact =
      projectedPurchases * avgQtyPerPurchase * packMultiplier * absDelta;

    const confidence = scoreConfidence(
      series.observations.length,
      spanDays,
      deltaRatio
    );

    const direction = deltaRatio > 0 ? "up" : "down";
    const productLabel = series.canonicalName ?? series.key;

    insights.push({
      id: `own_price_track:${series.key}`,
      kind: "own_price_track",
      title:
        direction === "up"
          ? `${productLabel} senin için pahalılaşıyor`
          : `${productLabel} senin için ucuzladı`,
      summary:
        direction === "up"
          ? `Son alışında birim fiyat %${Math.round(
              deltaRatio * 100
            )} arttı. Önceki medyan: ${baseline.toFixed(2)} ${context.currency}.`
          : `Son alışında birim fiyat %${Math.round(
              Math.abs(deltaRatio) * 100
            )} düştü. Önceki medyan: ${baseline.toFixed(2)} ${context.currency}.`,
      confidence,
      monetaryImpact: Math.round(monthlyImpact * 100) / 100,
      currency: context.currency,
      payload: {
        productKey: series.key,
        canonicalName: series.canonicalName,
        brand: series.brand,
        packSize: series.packSize,
        unitType: series.unitType,
        baselineUnitPrice: Number(baseline.toFixed(4)),
        latestUnitPrice: Number(latest.unitPrice.toFixed(4)),
        deltaRatio: Number(deltaRatio.toFixed(4)),
        sampleSize: series.observations.length,
        spanDays: Math.round(spanDays),
        direction,
        recentReceiptId: latest.receiptId,
      },
      suggestedCommitment:
        direction === "up"
          ? {
              kind: "price_watch",
              title: `${productLabel} fiyat takibi`,
              description:
                "Birim fiyat %5 daha artarsa haber ver; %5 düşerse yine haber ver.",
              params: {
                productKey: series.key,
                baselineUnitPrice: Number(baseline.toFixed(4)),
                triggerRatio: 0.05,
              },
              target: Number(baseline.toFixed(2)),
              currency: context.currency,
            }
          : null,
    });
  }

  return insights;
}
