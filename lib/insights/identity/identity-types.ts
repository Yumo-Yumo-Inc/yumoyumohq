/**
 * Spending Identity — types
 *
 * The Patterns page derives a user's "spending identity" from their receipt
 * history: six independent, single-sourced traits, a derived class name, and
 * per-trait evidence. No cross-user comparison happens here (that is the tribe
 * layer); this is purely the single-user identity.
 *
 * Principles:
 *   - Every trait maps to ONE concrete, sourced signal. No invented values.
 *   - A trait with no supporting data returns value: null (UI shows empty),
 *     never a fabricated number.
 *   - Deterministic: same receipts → same identity.
 */

export type TraitKey =
  | "impulse" // weekend/evening/night spend share
  | "hunter" // discounted purchase ratio
  | "explorer" // new-merchant rate
  | "hedonist" // hedonic-category spend share
  | "loyal" // merchant concentration
  | "planner"; // essentials + steady cadence

export const TRAIT_KEYS: readonly TraitKey[] = [
  "impulse",
  "hunter",
  "explorer",
  "hedonist",
  "loyal",
  "planner",
] as const;

/**
 * Confidence reflects how much we trust the value:
 *   - "high": enough receipts and (where relevant) enough supporting fields.
 *   - "low": signal exists but the sample is thin, so treat as a hint.
 *   - "none": no data for this signal → value is null.
 */
export type TraitConfidence = "high" | "low" | "none";

/**
 * Per-trait evidence counts. The UI composes localized sentences from these;
 * the backend never produces user-facing prose. All fields are raw observations.
 */
export interface TraitEvidence {
  impulse?: {
    weekendNightShare: number; // 0..1 of spend on weekend OR evening/night
    receiptsWithTime: number;
    totalReceipts: number;
  };
  hunter?: {
    discountedItems: number;
    totalItems: number;
    discountedSpendShare: number; // 0..1
  };
  explorer?: {
    newMerchants: number; // merchants first seen inside the window
    merchantVisits: number; // total visits in the window
  };
  hedonist?: {
    hedonicShare: number; // 0..1 of spend in hedonic categories
  };
  loyal?: {
    topMerchantName: string | null;
    topMerchantShare: number; // 0..1 of visits at the single top merchant
    distinctMerchants: number;
  };
  planner?: {
    essentialShare: number; // 0..1 of spend in essential categories
    basketCv: number | null; // coefficient of variation of basket size
  };
}

export interface Trait {
  key: TraitKey;
  /** 0..100, or null when there is no data for this signal. */
  value: number | null;
  /** value − value(previous window), or null when delta cannot be computed. */
  delta: number | null;
  confidence: TraitConfidence;
  /** Raw counts the UI turns into "why?" copy. */
  evidence: TraitEvidence;
}

export interface SpendingIdentity {
  /** ISO timestamp the identity was computed at (stamped by the caller/route). */
  computedAt: string | null;
  /** The user's dominant shopping city, derived from receipts (merchant_city),
   *  in its most common raw form for display. null when no receipt carries a
   *  city. This — not the profile field — is the tribe's city signal. */
  homeCity: string | null;
  /** Total receipts considered in the current window. */
  receiptCount: number;
  /**
   * The current window length in days (the trailing slice we scored).
   * Delta compares this window against the equally long window before it.
   */
  windowDays: number;
  /** The two traits that define the class, highest value first. null when
   *  there is not enough data to name a class. */
  classKeys: [TraitKey, TraitKey] | null;
  traits: Trait[];
  /** True when there are too few receipts to read an identity at all. */
  insufficientData: boolean;
}
