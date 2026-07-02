/**
 * Receipt X-Ray — Pure heuristic engine
 *
 * Computes 5 behavioral layers from a single receipt without LLM.
 * All functions are side-effect free.
 *
 * Post-review fixes:
 * - Inflation layer now measures markup vs product value.
 * - Currency-aware thresholds (TRY vs USD/EUR/GBP).
 * - Signal keys are camelCase so they align with i18n JSON.
 * - Layer descriptions, oneLineRead, and narrative return i18n keys
 *   so the UI can translate them via t().
 * - isWeekend uses getUTCDay() to avoid SSR timezone drift.
 */

import type { Receipt } from "@/lib/mock/types";
import type { ReceiptXRay, XRayLayerResult, XRayLayer, XRaySignal, XRayMessage } from "./types";

/* ─── Helpers ─── */

function parseHour(time?: string): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function isWeekend(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const day = d.getUTCDay();
    return day === 0 || day === 6;
  } catch {
    return false;
  }
}

function hiddenCostRatio(receipt: Receipt): number {
  if (!receipt.total || receipt.total <= 0) return 0;
  return receipt.hiddenCost.totalHidden / receipt.total;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* ─── Currency normalization ─── */

function isMinorAmount(amount: number, currency: string): boolean {
  const c = currency.toUpperCase();
  if (c === "TRY" || c === "THB") return amount < 50;
  if (c === "USD" || c === "EUR" || c === "GBP") return amount < 3;
  return amount < 50;
}

function isMajorAmount(amount: number, currency: string): boolean {
  const c = currency.toUpperCase();
  if (c === "TRY" || c === "THB") return amount > 500;
  if (c === "USD" || c === "EUR" || c === "GBP") return amount > 15;
  return amount > 500;
}

function isLowRiskRewardAmount(amount: number, currency: string): boolean {
  const c = currency.toUpperCase();
  if (c === "TRY" || c === "THB") return amount < 80;
  if (c === "USD" || c === "EUR" || c === "GBP") return amount < 5;
  return amount < 80;
}

/* ─── Category mood mapping ─── */

const MOOD_CATEGORIES = new Set([
  "cafe", "coffee", "dessert", "bakery", "snack", "ice_cream", "tea",
  "fast_food", "burger", "pizza",
]);

const NEED_CATEGORIES = new Set([
  "grocery", "supermarket", "supermarket_grocery", "marketplace",
  "utilities", "pharmacy", "health", "fuel", "transport",
]);

const SOCIAL_CATEGORIES = new Set([
  "restaurant", "cafe", "bar", "nightlife", "entertainment",
  "fast_food", "burger", "pizza",
]);

const LUXURY_CATEGORIES = new Set([
  "luxury", "fashion", "jewelry", "electronics", "cosmetics",
]);

/* ─── Layer engines ─── */

function computeNeedLayer(r: Receipt): XRayLayerResult {
  const cat = (r.category || "other").toLowerCase();
  const signals: XRaySignal[] = [];

  let score = 50;

  if (NEED_CATEGORIES.has(cat)) {
    score += 35;
    signals.push({ key: "basicNeedCategory" });
  }
  if (cat === "utilities") {
    score += 15;
    signals.push({ key: "mandatoryService" });
  }
  if (LUXURY_CATEGORIES.has(cat)) {
    score -= 30;
    signals.push({ key: "luxuryWantCategory" });
  }
  if (cat === "entertainment" || cat === "nightlife") {
    score -= 25;
    signals.push({ key: "entertainmentExpense" });
  }
  if (r.total > 0 && isMinorAmount(r.total, r.currency)) {
    score -= 10;
    signals.push({ key: "lowAmountSmallPurchase" });
  }
  if (r.total > 0 && isMajorAmount(r.total, r.currency)) {
    score += 10;
    signals.push({ key: "highAmountStockPurchase" });
  }

  score = clamp(score, 10, 100);
  const tier = score >= 70 ? "high" : score >= 40 ? "mid" : "low";

  return {
    layer: "need",
    score: Math.round(score),
    label: `need_${tier}` as string,
    descriptionKey: `xray.descriptions.need.${tier}`,
    color: "emerald",
    signals,
  };
}

function computeMoodLayer(r: Receipt): XRayLayerResult {
  const cat = (r.category || "other").toLowerCase();
  const hour = parseHour(r.time);
  const signals: XRaySignal[] = [];

  let score = 30;

  if (MOOD_CATEGORIES.has(cat)) {
    score += 30;
    signals.push({ key: "rewardRelaxationCategory" });
  }
  if (hour !== null && hour >= 18) {
    score += 20;
    signals.push({ key: "eveningEndOfDayReward" });
  }
  if (hour !== null && hour >= 14 && hour < 17) {
    score += 10;
    signals.push({ key: "afternoonBreakTime" });
  }
  if (isWeekend(r.date)) {
    score += 10;
    signals.push({ key: "weekendHigherMood" });
  }
  if (r.total > 0 && isLowRiskRewardAmount(r.total, r.currency)) {
    score += 10;
    signals.push({ key: "smallAmountLowRiskReward" });
  }
  if (cat === "restaurant") {
    score += 15;
    signals.push({ key: "socialMealReward" });
  }

  score = clamp(score, 10, 100);
  const tier = score >= 60 ? "high" : score >= 35 ? "mid" : "low";

  return {
    layer: "mood",
    score: Math.round(score),
    label: `mood_${tier}` as string,
    descriptionKey: `xray.descriptions.mood.${tier}`,
    color: "amber",
    signals,
  };
}

function computeInflationLayer(r: Receipt): XRayLayerResult {
  const signals: XRaySignal[] = [];
  const productValue = Math.max(0, r.hiddenCost.productValue || 0);
  const markup = r.hiddenCost.retailBrand + r.hiddenCost.importSystem;

  let ratio = 0;
  if (productValue > 0) {
    ratio = markup / productValue;
  } else if (r.total > 0) {
    ratio = markup / r.total;
  }

  let score = 10;

  if (ratio >= 1.0) {
    score = 90;
    signals.push({ key: "intermediaryInflation" });
  } else if (ratio >= 0.6) {
    score = 75;
    signals.push({ key: "intermediaryInflation" });
  } else if (ratio >= 0.3) {
    score = 60;
    signals.push({ key: "moderateInflation" });
  } else if (ratio >= 0.15) {
    score = 40;
    signals.push({ key: "moderateInflation" });
  } else {
    score = 20;
  }

  if (r.hiddenCost.retailBrand > r.hiddenCost.importSystem) {
    signals.push({ key: "brandMarkupExceedsImport" });
  }
  if (productValue > 0 && r.hiddenCost.retailBrand > productValue) {
    signals.push({ key: "retailMarkupExceedsProduct" });
  }
  if (r.hiddenCost.importSystem > 0) {
    signals.push({ key: "importLogisticsSignificant" });
  }

  score = clamp(score, 10, 100);
  const tier = score >= 70 ? "high" : score >= 40 ? "mid" : "low";

  return {
    layer: "inflation",
    score: Math.round(score),
    label: `inflation_${tier}` as string,
    descriptionKey: `xray.descriptions.inflation.${tier}`,
    color: "rose",
    signals,
  };
}

function computeSocialLayer(r: Receipt): XRayLayerResult {
  const cat = (r.category || "other").toLowerCase();
  const signals: XRaySignal[] = [];

  let score = 30;

  if (SOCIAL_CATEGORIES.has(cat)) {
    score += 40;
    signals.push({ key: "socialVenueCategory" });
  }
  if (cat === "restaurant") {
    score += 10;
    signals.push({ key: "restaurantSocialContext" });
  }
  if (cat === "bar" || cat === "nightlife") {
    score += 15;
    signals.push({ key: "nightlifeSocialContext" });
  }
  if (cat === "grocery" || cat === "supermarket" || cat === "supermarket_grocery") {
    score -= 20;
    signals.push({ key: "groceryHome" });
  }
  if (cat === "utilities") {
    score -= 25;
    signals.push({ key: "utilityBillHome" });
  }
  if (cat === "online" || cat === "marketplace") {
    score -= 10;
    signals.push({ key: "onlineNoPhysicalSocial" });
  }

  score = clamp(score, 10, 100);
  const tier = score >= 60 ? "high" : score >= 35 ? "mid" : "low";

  return {
    layer: "social",
    score: Math.round(score),
    label: `social_${tier}` as string,
    descriptionKey: `xray.descriptions.social.${tier}`,
    color: "indigo",
    signals,
  };
}

function computeHiddenCostLayer(r: Receipt): XRayLayerResult {
  const ratio = hiddenCostRatio(r);
  const signals: XRaySignal[] = [];

  let score = 10;

  if (ratio >= 0.50) {
    score = 90;
    signals.push({ key: "highHiddenCostRatio", params: { pct: Math.round(ratio * 100) } });
  } else if (ratio >= 0.40) {
    score = 75;
    signals.push({ key: "highHiddenCostRatio", params: { pct: Math.round(ratio * 100) } });
  } else if (ratio >= 0.30) {
    score = 60;
    signals.push({ key: "highHiddenCostRatio", params: { pct: Math.round(ratio * 100) } });
  } else if (ratio >= 0.20) {
    score = 45;
    signals.push({ key: "highHiddenCostRatio", params: { pct: Math.round(ratio * 100) } });
  } else {
    score = 25;
  }

  if (r.hiddenCost.retailBrand > 0) {
    signals.push({
      key: "brandAmount",
      params: { amount: r.hiddenCost.retailBrand.toFixed(2), currency: r.currency },
    });
  }
  if (r.hiddenCost.importSystem > 0) {
    signals.push({
      key: "importAmount",
      params: { amount: r.hiddenCost.importSystem.toFixed(2), currency: r.currency },
    });
  }
  if (r.hiddenCost.state > 0) {
    signals.push({
      key: "stateAmount",
      params: { amount: r.hiddenCost.state.toFixed(2), currency: r.currency },
    });
  }

  score = clamp(score, 10, 100);
  const tier = score >= 70 ? "high" : score >= 40 ? "mid" : "low";

  return {
    layer: "hiddenCost",
    score: Math.round(score),
    label: `hiddenCost_${tier}` as string,
    descriptionKey: `xray.descriptions.hiddenCost.${tier}`,
    color: "violet",
    signals,
  };
}

/* ─── Persona resolver ─── */

function resolvePersona(r: Receipt, layers: XRayLayerResult[]): string {
  const byLayer = Object.fromEntries(layers.map((l) => [l.layer, l.score])) as Record<XRayLayer, number>;
  const cat = (r.category || "other").toLowerCase();
  const hour = parseHour(r.time);

  if (cat === "cafe" || cat === "coffee" || cat === "tea") {
    if (hour !== null && hour >= 8 && hour <= 18) {
      return "workspaceHunter";
    }
    return "eveningRewarder";
  }
  if (byLayer.mood >= 60 && byLayer.social >= 50) {
    return "socialConnector";
  }
  if (byLayer.need >= 70 && byLayer.inflation >= 60) {
    return "inflationVictim";
  }
  if (byLayer.need >= 70) {
    return "routineRestocker";
  }
  if (byLayer.mood >= 60 && byLayer.need <= 40) {
    return "impulseNomad";
  }
  if (byLayer.social >= 60) {
    return "socialConnector";
  }
  return "balancedShopper";
}

/* ─── Orchestrator ─── */

export function computeReceiptXRay(receipt: Receipt): ReceiptXRay {
  const layers: XRayLayerResult[] = [
    computeNeedLayer(receipt),
    computeMoodLayer(receipt),
    computeInflationLayer(receipt),
    computeSocialLayer(receipt),
    computeHiddenCostLayer(receipt),
  ];

  const dominant = layers.reduce((max, l) => (l.score > max.score ? l : max), layers[0]);
  const persona = resolvePersona(receipt, layers);

  return {
    layers,
    dominantLayer: dominant.layer,
    merchantPersona: persona,
    oneLineRead: buildOneLineRead(receipt, layers, dominant.layer, persona),
    narrative: buildNarrative(receipt, layers, dominant.layer, persona),
  };
}

/* ─── Narrative builders (i18n key + params only) ─── */

function buildOneLineRead(
  r: Receipt,
  _layers: XRayLayerResult[],
  dominant: XRayLayer,
  persona: string
): XRayMessage {
  const merchant = r.merchantName;

  const personaMap: Record<string, string> = {
    workspaceHunter: "xray.oneLine.workspaceHunter",
    eveningRewarder: "xray.oneLine.eveningRewarder",
    routineRestocker: "xray.oneLine.routineRestocker",
    socialConnector: "xray.oneLine.socialConnector",
    inflationVictim: "xray.oneLine.inflationVictim",
    impulseNomad: "xray.oneLine.impulseNomad",
  };

  if (personaMap[persona]) {
    return { key: personaMap[persona], params: { merchant } };
  }

  const dominantMap: Record<string, string> = {
    need: "xray.oneLine.needDominant",
    mood: "xray.oneLine.moodDominant",
    inflation: "xray.oneLine.inflationDominant",
    social: "xray.oneLine.socialDominant",
    hiddenCost: "xray.oneLine.hiddenCostDominant",
  };

  return { key: dominantMap[dominant] || "xray.oneLine.fallback", params: { merchant } };
}

function buildNarrative(
  r: Receipt,
  layers: XRayLayerResult[],
  dominant: XRayLayer,
  persona: string
): XRayMessage {
  const byLayer = Object.fromEntries(layers.map((l) => [l.layer, l.score])) as Record<XRayLayer, number>;
  const hour = parseHour(r.time);
  const ratio = hiddenCostRatio(r);
  const merchant = r.merchantName;

  // Persona-driven opening
  const personaMap: Record<string, string> = {
    workspaceHunter: "xray.narrative.workspaceHunter",
    eveningRewarder: "xray.narrative.eveningRewarder",
    routineRestocker: "xray.narrative.routineRestocker",
    socialConnector: "xray.narrative.socialConnector",
    inflationVictim: "xray.narrative.inflationVictim",
    impulseNomad: "xray.narrative.impulseNomad",
  };

  if (personaMap[persona]) {
    return { key: personaMap[persona], params: { merchant } };
  }

  // Layer-combination second sentence (only for non-persona fallback)
  if (dominant === "need" && byLayer.inflation >= 50) {
    return { key: "xray.narrative.needAndInflation", params: { merchant } };
  }
  if (dominant === "mood" && byLayer.social >= 50) {
    return { key: "xray.narrative.moodAndSocial", params: { merchant } };
  }
  if (dominant === "hiddenCost" && byLayer.need >= 50) {
    return { key: "xray.narrative.hiddenCostAndNeed", params: { merchant } };
  }
  if (dominant === "social" && byLayer.mood >= 50) {
    return { key: "xray.narrative.socialAndMood", params: { merchant } };
  }
  if (ratio > 0.4) {
    return { key: "xray.narrative.highRatio", params: { merchant, pct: Math.round(ratio * 100) } };
  }
  if (hour !== null && hour >= 18 && byLayer.mood >= 40) {
    return { key: "xray.narrative.eveningMood", params: { merchant } };
  }

  return { key: "xray.narrative.fallback", params: { merchant } };
}
