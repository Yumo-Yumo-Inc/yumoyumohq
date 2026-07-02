/**
 * Normalizes hidden cost for UI: never exceeds amount shown as total paid.
 */

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

export function displayHiddenCost(receipt: {
  total?: number | null;
  totalPaid?: number | null;
  hiddenCost?: {
    totalHidden?: number | null;
    hiddenCostCore?: number | null;
  } | null;
  hiddenTotal?: number | null;
  hiddenCostCore?: number | null;
}): number {
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
  hiddenCost?: { totalHidden?: number | null; hiddenCostCore?: number | null } | null;
}): number {
  const total = Math.max(0, Number(receipt.totalPaid ?? receipt.total ?? 0) || 0);
  if (total <= 0) return 0;
  return (displayHiddenCost(receipt) / total) * 100;
}
