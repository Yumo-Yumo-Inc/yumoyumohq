/**
 * Income ratio helpers
 *
 * Income bands are declared in USD ([config/income-bands.ts]). To express
 * spend-to-income ratios in the user's primary currency, we rely on a small
 * static USD conversion table. This is intentionally simple: Phase 0 surfaces
 * a directional gauge on the dashboard; Phase 1 will replace the table with
 * a proper FX-aware layer.
 */

import {
  INCOME_BAND_USD_THRESHOLDS,
  normalizeIncomeBandKey,
  type IncomeBandKey,
} from "@/config/income-bands";
import type {
  IncomeRatioSummary,
  IncomeRatioAlert,
  ReceiptSummary,
} from "@/lib/insights/types";

const NEEDS_KEYWORDS = [
  "grocery",
  "groceries",
  "food",
  "health",
  "pharmacy",
  "transport",
  "utility",
  "home",
  "housing",
];
const WANTS_KEYWORDS = [
  "cafe",
  "restaurant",
  "dining",
  "entertainment",
  "shopping",
  "electronics",
  "beauty",
  "travel",
];

function localCategoryBucket(category: string): "needs" | "wants" | "other" {
  const lower = category.toLowerCase();
  if (NEEDS_KEYWORDS.some((key) => lower.includes(key))) return "needs";
  if (WANTS_KEYWORDS.some((key) => lower.includes(key))) return "wants";
  return "other";
}

const USD_PER_UNIT: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.26,
  TRY: 1 / 32,
  THB: 1 / 35,
};

export function usdToCurrency(usd: number, currency: string): number {
  const rate = USD_PER_UNIT[currency.toUpperCase()] ?? 1;
  return rate > 0 ? usd / rate : usd;
}

export interface IncomeBandSummary {
  key: IncomeBandKey;
  minUsd: number;
  maxUsd: number | null;
  midpointUsd: number;
  midpointInCurrency: number;
  upperInCurrency: number;
  currency: string;
}

export function resolveIncomeBand(
  bandKey: string | null | undefined,
  currency: string
): IncomeBandSummary | null {
  const normalized = normalizeIncomeBandKey(bandKey);
  if (!normalized) return null;
  const thresholds = INCOME_BAND_USD_THRESHOLDS[normalized];
  if (!thresholds) return null;
  const minUsd = thresholds.min;
  const maxUsd = thresholds.max;
  const midpointUsd = maxUsd === null ? minUsd * 1.5 : (minUsd + maxUsd) / 2;
  const upperUsd = maxUsd ?? minUsd * 2;
  return {
    key: normalized,
    minUsd,
    maxUsd,
    midpointUsd,
    midpointInCurrency: usdToCurrency(midpointUsd, currency),
    upperInCurrency: usdToCurrency(upperUsd, currency),
    currency,
  };
}

export interface IncomeRatioGauge {
  ratio: number; // 0..1+ (spend / midpoint)
  tone: "good" | "watch" | "over";
  midpointInCurrency: number;
}

export function computeIncomeRatioGauge(
  monthlySpendInCurrency: number,
  bandKey: string | null | undefined,
  currency: string
): IncomeRatioGauge | null {
  const band = resolveIncomeBand(bandKey, currency);
  if (!band || band.midpointInCurrency <= 0) return null;
  const ratio = monthlySpendInCurrency / band.midpointInCurrency;
  const tone: IncomeRatioGauge["tone"] = ratio >= 0.9 ? "over" : ratio >= 0.6 ? "watch" : "good";
  return { ratio, tone, midpointInCurrency: band.midpointInCurrency };
}

/**
 * Full income ratio summary with 50/30/20 breakdown + warnings.
 *
 * Spend is taken from receipts in the current month (reference date driven),
 * split into needs/wants/other buckets via the shared `categoryBucket` helper.
 * Alerts fire when any bucket exceeds its recommended cap or overall spend
 * approaches the income midpoint.
 */
export function computeIncomeRatio(
  receipts: ReceiptSummary[],
  bandKey: string | null | undefined,
  currency: string,
  referenceDate: Date = new Date()
): IncomeRatioSummary | null {
  const band = resolveIncomeBand(bandKey, currency);
  if (!band || band.midpointInCurrency <= 0) return null;

  const monthKey = referenceDate.toISOString().slice(0, 7);
  let actualNeedsSpend = 0;
  let actualWantsSpend = 0;
  let actualOtherSpend = 0;

  for (const receipt of receipts) {
    if (!receipt.date.startsWith(monthKey)) continue;
    const bucket = localCategoryBucket(receipt.category ?? "other");
    const amount = receipt.totalPaid || 0;
    if (bucket === "needs") actualNeedsSpend += amount;
    else if (bucket === "wants") actualWantsSpend += amount;
    else actualOtherSpend += amount;
  }

  const monthlySpend = actualNeedsSpend + actualWantsSpend + actualOtherSpend;
  const midpoint = band.midpointInCurrency;
  const spendRatio = monthlySpend / midpoint;
  const recommendedNeedsCap = midpoint * 0.5;
  const recommendedWantsCap = midpoint * 0.3;
  const recommendedSavingsCap = midpoint * 0.2;
  const needsRatio = actualNeedsSpend / midpoint;
  const wantsRatio = actualWantsSpend / midpoint;
  const savingsRatio = Math.max(0, 1 - spendRatio);

  const alertLevel: IncomeRatioSummary["alertLevel"] =
    spendRatio >= 0.95 ? "over" : spendRatio >= 0.7 ? "watch" : "ok";

  const alerts: IncomeRatioAlert[] = [];
  if (spendRatio >= 0.95) {
    alerts.push({
      id: "overall_over",
      kind: "overall_over",
      severity: "alert",
      title: `Gelirin %${Math.round(spendRatio * 100)}'i harcandi`,
      detail: "Toplam aylik harcama gelir orta noktasina dayandi.",
      metric: spendRatio,
    });
  } else if (spendRatio >= 0.7) {
    alerts.push({
      id: "overall_watch",
      kind: "overall_over",
      severity: "warning",
      title: `Gelirin %${Math.round(spendRatio * 100)}'i kullanildi`,
      detail: "Tasarruf hedefi icin ikinci yariyi kontrollu kullan.",
      metric: spendRatio,
    });
  }

  if (actualNeedsSpend > recommendedNeedsCap && actualNeedsSpend > 0) {
    alerts.push({
      id: "needs_over",
      kind: "needs_over",
      severity: actualNeedsSpend > recommendedNeedsCap * 1.2 ? "alert" : "warning",
      title: `Ihtiyac bucketi asildi`,
      detail: `50/30/20 onerisi ${Math.round(recommendedNeedsCap)} ${currency}; su an ${Math.round(
        actualNeedsSpend
      )} ${currency}.`,
      metric: actualNeedsSpend / Math.max(1, recommendedNeedsCap),
    });
  }

  if (actualWantsSpend > recommendedWantsCap && actualWantsSpend > 0) {
    alerts.push({
      id: "wants_over",
      kind: "wants_over",
      severity: actualWantsSpend > recommendedWantsCap * 1.3 ? "alert" : "warning",
      title: `Istek bucketi asildi`,
      detail: `50/30/20 onerisi ${Math.round(recommendedWantsCap)} ${currency}; su an ${Math.round(
        actualWantsSpend
      )} ${currency}.`,
      metric: actualWantsSpend / Math.max(1, recommendedWantsCap),
    });
  }

  if (savingsRatio < 0.1 && spendRatio > 0.3) {
    alerts.push({
      id: "low_savings",
      kind: "low_savings",
      severity: savingsRatio <= 0 ? "alert" : "warning",
      title: "Tasarruf payi dusuk",
      detail: "Gelirin %10 altinda bir tasarruf dilimi goruluyor.",
      metric: savingsRatio,
    });
  }

  return {
    incomeMidpoint: midpoint,
    currency,
    monthlySpend,
    spendRatio,
    bandKey: band.key,
    recommendedNeedsCap,
    recommendedWantsCap,
    recommendedSavingsCap,
    actualNeedsSpend,
    actualWantsSpend,
    actualOtherSpend,
    needsRatio,
    wantsRatio,
    savingsRatio,
    alertLevel,
    alerts,
  };
}
