/**
 * Deterministic per-item split of a hidden-cost layer.
 *
 * The layer amount itself comes from the solved hidden-cost model (sourced,
 * category-aware). This module only DECOMPOSES that amount across the named
 * sub-items of the layer's sector schema, using each item's `alphaBase` as a
 * fixed proportional weight. No randomness (no Dirichlet), so the same layer
 * amount always yields the same split, and the parts sum back to the whole.
 *
 * "Uydurma yok": the total is never invented here — it is the model's value;
 * only the within-layer proportions come from the sourced priors, and every
 * resulting item is flagged `estimated`.
 */

import { getBreakdownItems, type LayerKey } from "@/lib/pricing/breakdownDictionary";
import type { SuperCategory } from "@/lib/pricing/categoryMap";
import type { HiddenCostBreakdownItem } from "@/lib/receipt/types";

type Bucket = NonNullable<HiddenCostBreakdownItem["bucket"]>;

function roundCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

/**
 * Split `layerAmount` across the dictionary items of (`superCategory`, `layerKey`).
 * Falls back to a single generic row when the schema has no matching items or the
 * amount is not positive. The returned amounts always sum to round(layerAmount).
 */
export function splitLayerIntoItems(
  layerAmount: number,
  superCategory: SuperCategory,
  layerKey: LayerKey,
  bucket: Bucket,
  fallbackLabel: string,
  tooltip?: string
): HiddenCostBreakdownItem[] {
  const totalCents = Math.max(0, roundCents(layerAmount));
  const defs = getBreakdownItems(superCategory).filter((d) => d.layerKey === layerKey);
  const totalAlpha = defs.reduce((sum, d) => sum + Math.max(0, d.alphaBase), 0);

  // Defensive: nothing to split into, or no signal → single generic row.
  if (defs.length === 0 || totalCents <= 0 || totalAlpha <= 0) {
    return [
      {
        label: fallbackLabel,
        amount: totalCents / 100,
        description: tooltip,
        bucket,
        estimated: true,
      },
    ];
  }

  // Proportional split in integer cents, then hand the rounding remainder to the
  // largest fractional parts so the items sum exactly back to the layer total.
  const raw = defs.map((d) => (Math.max(0, d.alphaBase) / totalAlpha) * totalCents);
  const cents = raw.map((v) => Math.floor(v));
  const distributed = cents.reduce((sum, v) => sum + v, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < totalCents - distributed; k++) {
    cents[order[k % order.length].i] += 1;
  }

  return defs.map((d, i) => ({
    label: d.label,
    amount: cents[i] / 100,
    description: d.description,
    bucket,
    estimated: true,
  }));
}
