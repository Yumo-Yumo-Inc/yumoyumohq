/**
 * Dynamic rate computation with trends, volatility, and deterministic noise
 */

import type { Country, Category } from "./rates";
import { getBaseRates, clampRate } from "./rates";
import { computeCategoryTrend, computeMerchantTrend } from "./ewma";
import { SeededRNG } from "./dirichlet";
import type { ReceiptSummary } from "@/lib/insights/types";

export interface RateContext {
  country: Country;
  category: Category;
  merchantId?: string;
  merchantName: string;
  date: string;
  receiptId: string;
}

export interface DynamicRatesResult {
  importSystemRate: number;
  retailHiddenRate: number;
  hiddenCostCore: number;
  referencePrice: number;
  reasons: string[];
}

/**
 * Compute dynamic rates for a receipt
 */
export function computeDynamicRates(
  context: RateContext,
  history: ReceiptSummary[],
  paidExTax: number
): DynamicRatesResult {
  const { country, category, merchantId, merchantName, date, receiptId } = context;

  // Get base rates
  const baseRates = getBaseRates(country, category);
  const reasons: string[] = [];

  // Compute trends from history
  const historyWithRates = history.map(r => ({
    date: r.date,
    hiddenCostRate: r.paidExTax > 0 ? r.hiddenCostCore / r.paidExTax : 0,
    category: r.category || "other",
    merchantId: (r as ReceiptSummary & { merchantId?: string }).merchantId,
    merchantName: r.merchantName,
  }));

  const categoryTrend = computeCategoryTrend(historyWithRates, category, 60);
  const merchantTrend = computeMerchantTrend(historyWithRates, merchantId, merchantName, 60);

  // Generate deterministic seed
  const seed = `${receiptId}-${date}-${merchantId || merchantName}-${country}`;
  const rng = new SeededRNG(seed);

  // Compute volatility-adjusted noise
  const categoryVolatility = categoryTrend.volatility;
  const merchantVolatility = merchantTrend.volatility;
  const combinedVolatility = Math.max(categoryVolatility, merchantVolatility);

  // Noise scale: higher volatility = more noise
  const noiseScale = Math.min(0.03, combinedVolatility * 0.5); // Cap at 3%

  // Sample noise for each rate
  const importNoise = rng.nextNormal(0, noiseScale * 0.5); // Smaller noise for import
  const retailNoise = rng.nextNormal(0, noiseScale);

  // Apply trends and noise
  const categoryTrendDelta = categoryTrend.trend * 0.3; // Scale trend impact
  const merchantDelta = merchantTrend.trend * 0.2; // Scale merchant trend

  let importSystemRate = baseRates.importSystemBaseRate + categoryTrendDelta + importNoise;
  let retailHiddenRate = baseRates.retailHiddenBaseRate + categoryTrendDelta + merchantDelta + retailNoise;

  // Clamp to bounds
  importSystemRate = clampRate(importSystemRate, baseRates.importSystemBounds);
  retailHiddenRate = clampRate(retailHiddenRate, baseRates.retailHiddenBounds);

  // Calculate hidden cost core
  const totalRate = importSystemRate + retailHiddenRate;
  const referenceRatio = Math.max(0.1, Math.min(0.9, 1 - totalRate)); // Ensure reasonable bounds
  const referencePrice = paidExTax * referenceRatio;
  let hiddenCostCore = paidExTax - referencePrice;

  // Ensure hiddenCostCore is non-negative
  if (hiddenCostCore < 0) {
    hiddenCostCore = 0;
    reasons.push("hiddenCostCore.clamped=non-negative");
  }

  // Build reasons
  reasons.push(`rate.importSystemBase=${baseRates.importSystemBaseRate.toFixed(3)}`);
  reasons.push(`rate.retailHiddenBase=${baseRates.retailHiddenBaseRate.toFixed(3)}`);
  
  if (categoryTrend.trend !== 0) {
    reasons.push(`trend.category30d=${categoryTrend.trend > 0 ? '+' : ''}${categoryTrend.trend.toFixed(3)}`);
  }
  if (merchantTrend.trend !== 0) {
    reasons.push(`trend.merchant30d=${merchantTrend.trend > 0 ? '+' : ''}${merchantTrend.trend.toFixed(3)}`);
  }
  if (combinedVolatility > 0.01) {
    reasons.push(`volatility.merchant=${combinedVolatility.toFixed(3)}`);
  }
  reasons.push("seededNoise=true");

  return {
    importSystemRate,
    retailHiddenRate,
    hiddenCostCore,
    referencePrice,
    reasons,
  };
}


