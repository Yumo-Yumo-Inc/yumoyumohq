/**
 * Reward from the hidden-cost slice (percentage of paidExTax).
 *
 * baseReward  = paidExTax × hiddenRate / usdRate
 * extraReward = paidExTax × max(0, finalRate − baseRate) / usdRate  (line-item top-up only)
 */

const MAX_HIDDEN_RATE = 0.7;

export function computeHiddenRate(paidExTax: number, hiddenCost: number): number {
  if (!Number.isFinite(paidExTax) || paidExTax <= 0) return 0;
  if (!Number.isFinite(hiddenCost) || hiddenCost <= 0) return 0;
  return Math.min(MAX_HIDDEN_RATE, Math.max(0, hiddenCost / paidExTax));
}

export function hiddenCostFromRate(paidExTax: number, hiddenRate: number): number {
  if (paidExTax <= 0 || hiddenRate <= 0) return 0;
  return paidExTax * Math.min(MAX_HIDDEN_RATE, hiddenRate);
}

export function computeRewardFromHiddenSlice(
  paidExTax: number,
  hiddenRate: number,
  usdRate: number
): number {
  if (paidExTax <= 0 || hiddenRate <= 0 || usdRate <= 0) return 0;
  const hiddenCost = hiddenCostFromRate(paidExTax, hiddenRate);
  return Math.round((hiddenCost / usdRate) * 100) / 100;
}
