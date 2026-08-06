/**
 * Platform support score weights — bonuses NOT covered by airdrop core.
 * Airdrop core = contribution_points × diversity_mult × receipt_mult (config/airdrop.ts).
 */

function envNum(key: string, def: number): number {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) && raw >= 0 ? raw : def;
}

export const SUPPORT_BONUS_WEIGHTS = {
  /** canonical merchant first uploader — primary discovery tier */
  merchantDiscovery: envNum("SUPPORT_SCORE_MERCHANT_DISCOVERY", 80),
  /** first global uploader of a canonical product (receipt_line_items.canonical_id) */
  productLineDiscovery: envNum("SUPPORT_SCORE_PRODUCT_LINE_DISCOVERY", 40),
  /** first time user contributes a canonical product category_path */
  productCategoryDiscovery: envNum("SUPPORT_SCORE_PRODUCT_CATEGORY_DISCOVERY", 25),
  /** first receipt per merchant_category (grocery, restaurant, …) for the user */
  merchantCategoryDiversity: envNum("SUPPORT_SCORE_MERCHANT_CATEGORY_DIVERSITY", 12),
  correctionSubmit: envNum("SUPPORT_SCORE_CORRECTION", 10),
  documentTypeDiversity: envNum("SUPPORT_SCORE_DOCUMENT_TYPE_DIVERSITY", 8),
} as const;

/** Discovery event kinds summed into the primary discovery score bucket. */
export const SUPPORT_DISCOVERY_KINDS = [
  "merchant_discovery",
  "product_line_discovery",
  "product_category_discovery",
] as const;

/**
 * cPoints × multipliers contribute at this fraction. Discovery is the dominant term.
 * Full airdrop core is still computed for transparency; only the weighted slice counts.
 */
export const SUPPORT_AIRDROP_CORE_FACTOR = envNum("SUPPORT_AIRDROP_CORE_FACTOR", 0.05);

/** @deprecated Use SUPPORT_BONUS_WEIGHTS — kept for scripts referencing old name. */
export const SUPPORT_SCORE_WEIGHTS = {
  merchantDiscovery: SUPPORT_BONUS_WEIGHTS.merchantDiscovery,
  correctionSubmit: SUPPORT_BONUS_WEIGHTS.correctionSubmit,
  receiptUnit: 0,
  merchantDiversity: 0,
  categoryDiversity: SUPPORT_BONUS_WEIGHTS.merchantCategoryDiversity,
  documentTypeDiversity: SUPPORT_BONUS_WEIGHTS.documentTypeDiversity,
  questComplete: 0,
  accountLevel: 0,
} as const;

/** Hyperbolic decay half-life in days (contribution at this age counts 50%). */
export const SUPPORT_SCORE_HALF_LIFE_DAYS = envNum("SUPPORT_SCORE_HALF_LIFE_DAYS", 90);

/** Tenure normalization: fairScore = net / sqrt(1 + tenureDays / scale). */
export const SUPPORT_SCORE_TENURE_SCALE_DAYS = envNum("SUPPORT_SCORE_TENURE_SCALE_DAYS", 30);

/**
 * Honesty penalties — subtracted from gross support score.
 * Detects duplicate farming, rejected uploads, and bad-faith corrections.
 */
export const SUPPORT_HONESTY_PENALTIES = {
  duplicateMarked: envNum("SUPPORT_PENALTY_DUPLICATE_MARKED", 25),
  sameUserContentRepeat: envNum("SUPPORT_PENALTY_SAME_USER_CONTENT", 30),
  contentHashGlobalRepeat: envNum("SUPPORT_PENALTY_CONTENT_HASH_REPEAT", 20),
  rejectedUpload: envNum("SUPPORT_PENALTY_REJECTED_UPLOAD", 10),
  rejectedCorrection: envNum("SUPPORT_PENALTY_REJECTED_CORRECTION", 15),
  contradictionCorrection: envNum("SUPPORT_PENALTY_CONTRADICTION_CORRECTION", 20),
} as const;

export const SUPPORT_INTEGRITY_FLOOR = envNum("SUPPORT_INTEGRITY_FLOOR", 0.05);

export type SupportScorePeriod = "decayed" | "30d" | "90d";

export function supportTimeWeight(ageDays: number, halfLifeDays = SUPPORT_SCORE_HALF_LIFE_DAYS): number {
  const age = Math.max(0, ageDays);
  const half = Math.max(1, halfLifeDays);
  return 1 / (1 + age / half);
}

export function supportEventPoints(
  basePoints: number,
  ageDays: number,
  opts?: { halfLifeDays?: number; useDecay?: boolean }
): number {
  const useDecay = opts?.useDecay ?? true;
  if (!useDecay) return basePoints;
  return basePoints * supportTimeWeight(ageDays, opts?.halfLifeDays);
}

export function supportFairScore(decayedScore: number, tenureDays: number): number {
  const tenure = Math.max(0, tenureDays);
  const scale = Math.max(1, SUPPORT_SCORE_TENURE_SCALE_DAYS);
  return decayedScore / Math.sqrt(1 + tenure / scale);
}

export function supportIntegrityRatio(grossScore: number, penaltyScore: number): number {
  const gross = Math.max(0, grossScore);
  const penalty = Math.max(0, penaltyScore);
  if (gross <= 0 && penalty <= 0) return 1;
  const raw = gross / (gross + penalty + 1);
  return Math.max(SUPPORT_INTEGRITY_FLOOR, Math.min(1, raw));
}

export function supportNetScore(grossScore: number, penaltyScore: number): number {
  return Math.max(0, grossScore - Math.max(0, penaltyScore));
}

export function roundSupportScore(value: number): number {
  return Math.round(value * 100) / 100;
}
