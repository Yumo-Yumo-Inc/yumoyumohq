import type { ThresholdMap } from "@/lib/canonical/thresholds";

export interface ExternalMatchSignals {
  name: number;
  alias?: number | null;
  embedding?: number | null;
  merchant?: number | null;
  brand?: number | null;
  productType?: number | null;
  package?: number | null;
  price?: number | null;
  brandConflict?: boolean;
  packageConflict?: boolean;
}

export type ExternalMatchDecision = "suggested" | "needs_review" | "pending";

export interface ExternalMatchScore {
  score: number;
  decision: ExternalMatchDecision;
  method: "exact" | "alias" | "trigram" | "embedding";
  evidence: Record<string, number | boolean | null>;
}

const WEIGHT_KEYS = {
  name: "external_name_weight",
  alias: "external_alias_weight",
  embedding: "external_embedding_weight",
  merchant: "external_merchant_weight",
  brand: "external_brand_weight",
  productType: "external_product_type_weight",
  package: "external_package_weight",
  price: "external_price_weight",
} as const;

function bounded(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

export function scoreExternalCanonicalMatch(
  signals: ExternalMatchSignals,
  thresholds: ThresholdMap
): ExternalMatchScore {
  let weighted = 0;
  let weightTotal = 0;
  for (const [signalKey, thresholdKey] of Object.entries(WEIGHT_KEYS) as Array<
    [keyof typeof WEIGHT_KEYS, string]
  >) {
    const value = bounded(signals[signalKey] as number | null | undefined);
    const weight = thresholds[thresholdKey];
    if (value == null || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += value * weight;
    weightTotal += weight;
  }
  const score = weightTotal > 0 ? weighted / weightTotal : 0;
  const suggestMin = thresholds.external_suggest_min;
  const reviewMin = thresholds.external_review_min;
  const identityEvidence = Math.max(
    bounded(signals.name) ?? 0,
    bounded(signals.alias) ?? 0,
    bounded(signals.embedding) ?? 0
  );
  const compatible = !signals.brandConflict && !signals.packageConflict;

  let decision: ExternalMatchDecision = "pending";
  if (
    Number.isFinite(suggestMin) &&
    score >= suggestMin &&
    identityEvidence >= suggestMin &&
    compatible
  ) {
    decision = "suggested";
  } else if (Number.isFinite(reviewMin) && score >= reviewMin) {
    decision = "needs_review";
  }

  const method =
    (bounded(signals.alias) ?? 0) >= identityEvidence
      ? "alias"
      : (bounded(signals.embedding) ?? 0) >= identityEvidence
        ? "embedding"
        : identityEvidence === 1
          ? "exact"
          : "trigram";

  return {
    score: Number(score.toFixed(6)),
    decision,
    method,
    evidence: {
      name: bounded(signals.name),
      alias: bounded(signals.alias),
      embedding: bounded(signals.embedding),
      merchant: bounded(signals.merchant),
      brand: bounded(signals.brand),
      product_type: bounded(signals.productType),
      package: bounded(signals.package),
      price: bounded(signals.price),
      brand_conflict: !!signals.brandConflict,
      package_conflict: !!signals.packageConflict,
      price_is_auxiliary: true,
    },
  };
}

