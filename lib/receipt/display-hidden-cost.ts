/**
 * Normalizes hidden cost for UI: never exceeds amount shown as total paid.
 * Distinguishes computed zero from "could not compute" (unavailable).
 */

import { shouldComputeHiddenCost } from "@/lib/receipt/vision-post-rules";

export function resolveRawHiddenCost(input: {
  hiddenTotal?: number | null;
  hiddenCostCore?: number | null;
  totalHidden?: number | null;
}): number {
  const fromTotal = input.hiddenTotal ?? input.totalHidden;
  if (fromTotal != null && Number.isFinite(Number(fromTotal))) {
    return Math.max(0, Number(fromTotal));
  }
  const core = input.hiddenCostCore;
  if (core != null && Number.isFinite(Number(core))) {
    return Math.max(0, Number(core));
  }
  return 0;
}

type HiddenCostLike = {
  totalHidden?: number | null;
  hiddenCostCore?: number | null;
  provenance?: string | null;
  breakdownItems?: Array<{ amount?: number | null }> | null;
} | null | undefined;

/**
 * True when the engine attempted (or should attempt) a purchase hidden-cost
 * calculation but has no verified data — UI must show an empty state, not 0.
 * 0 means "no hidden cost"; unavailable means "could not compute".
 */
export function isHiddenCostUnavailable(receipt: {
  documentType?: string | null;
  flags?: { docType?: string | null } | null;
  hiddenCost?: HiddenCostLike;
  hiddenTotal?: number | null;
  hiddenCostCore?: number | null;
}): boolean {
  const docType =
    receipt.documentType ?? receipt.flags?.docType ?? "receipt";
  if (!shouldComputeHiddenCost(String(docType))) return false;

  const provenance = receipt.hiddenCost?.provenance ?? null;
  if (provenance === "unavailable") return true;

  const raw = resolveRawHiddenCost({
    hiddenTotal: receipt.hiddenCost?.totalHidden ?? receipt.hiddenTotal,
    hiddenCostCore: receipt.hiddenCost?.hiddenCostCore ?? receipt.hiddenCostCore,
    totalHidden: receipt.hiddenCost?.totalHidden ?? receipt.hiddenTotal,
  });
  if (raw > 0) return false;

  if (
    provenance &&
    provenance !== "unavailable" &&
    [
      "item_derived",
      "retail_margin",
      "category_derived",
      "sector_average",
      "regional_proxy",
    ].includes(provenance)
  ) {
    return false;
  }

  const items = receipt.hiddenCost?.breakdownItems ?? [];
  const hasPriced = items.some((item) => (Number(item?.amount) || 0) > 0);
  return !hasPriced;
}

export function displayHiddenCost(receipt: {
  total?: number | null;
  totalPaid?: number | null;
  hiddenCost?: {
    totalHidden?: number | null;
    hiddenCostCore?: number | null;
    provenance?: string | null;
    breakdownItems?: Array<{ amount?: number | null }> | null;
  } | null;
  hiddenTotal?: number | null;
  hiddenCostCore?: number | null;
  documentType?: string | null;
  flags?: { docType?: string | null } | null;
}): number {
  if (isHiddenCostUnavailable(receipt)) return 0;
  const total = Math.max(0, Number(receipt.totalPaid ?? receipt.total ?? 0) || 0);
  const raw = resolveRawHiddenCost({
    hiddenTotal: receipt.hiddenCost?.totalHidden ?? receipt.hiddenTotal,
    hiddenCostCore: receipt.hiddenCost?.hiddenCostCore ?? receipt.hiddenCostCore,
    totalHidden: receipt.hiddenCost?.totalHidden ?? receipt.hiddenTotal,
  });
  if (total <= 0) return raw;
  return Math.min(raw, total);
}

export function displayHiddenPercent(receipt: {
  total?: number | null;
  totalPaid?: number | null;
  hiddenCost?: {
    totalHidden?: number | null;
    hiddenCostCore?: number | null;
    provenance?: string | null;
    breakdownItems?: Array<{ amount?: number | null }> | null;
  } | null;
  documentType?: string | null;
  flags?: { docType?: string | null } | null;
}): number {
  if (isHiddenCostUnavailable(receipt)) return 0;
  const total = Math.max(0, Number(receipt.totalPaid ?? receipt.total ?? 0) || 0);
  if (total <= 0) return 0;
  return (displayHiddenCost(receipt) / total) * 100;
}
