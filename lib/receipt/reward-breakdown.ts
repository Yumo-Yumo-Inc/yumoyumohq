/**
 * reward-breakdown.ts — Structured, user-facing decomposition of the points a
 * receipt earned.
 *
 * The displayed number (receipt_rewards.bint_bonus_amount) is produced in two
 * passes and collapses into a single figure that cannot be reconstructed after
 * the fact: the upload pass folds the hidden-cost slice, the scan-bonus stack,
 * caps and the honor factor into reward_final; the post-process pass multiplies
 * that by the CPI and season-level factors. To show an honest breakdown on the
 * result screen we capture every component AT THE POINT it is applied and carry
 * it forward.
 *
 * Sensitive calibration (the hidden-rate ceiling, the honor factor value, the
 * decade cap tables) is never exposed numerically — those steps are surfaced as
 * boolean flags only (CLAUDE.md §9). The additive scan bonuses and the itemized
 * / streak / CPI / season multipliers are product-facing and shown with values.
 */

import type { RewardCapResult } from "@/lib/receipt/reward-caps";

const REWARD_BREAKDOWN_VERSION = 2 as const;

export interface RewardBreakdown {
  version: typeof REWARD_BREAKDOWN_VERSION;
  /** Unit of every amount below. */
  currency: "bINT";

  // ── Upload pass ──────────────────────────────────────────────────────────
  /** Hidden-cost slice in bINT, before any bonus (RewardCapResult.rawReward). */
  baseSlice: number;
  /** Flat scan bonus added to every rewarded receipt. */
  scanBonus: number;
  /** Flat bonus for the first rewarded receipt of the UTC day (0 otherwise). */
  firstScanOfDayBonus: number;
  /** ×1 when the document has no proven line items, else the itemized factor. */
  itemizedMultiplier: number;
  /** ×1 unless the user had a rewarded receipt the previous UTC day. */
  streakMultiplier: number;
  /** Reward after the bonus stack, before caps and honor. */
  boostedReward: number;
  /** Which cap (if any) clipped the upload reward. Shown as a flag, no number. */
  capApplied: RewardCapResult["capApplied"];
  /** True when the honor factor scaled the reward down. Flag only, no value. */
  honorApplied: boolean;
  /** Upload final: capped(boosted) × honor. Feeds the post-process multipliers. */
  rewardFinal: number;

  // ── Post-process pass (filled by run-post-process) ───────────────────────
  /** Inflation (CPI) multiplier in the [1, 2] band. */
  cpiMultiplier?: number;
  /** Season-level multiplier in the [1, 1.10] band. */
  seasonLevelMultiplier?: number;
  /** Category catalyzer (currently neutral ×1). */
  categoryCatalyzer?: number;
  /** True when the per-receipt headroom clamp reduced the bonus. Flag only. */
  postProcessCapApplied?: boolean;
  /** The final displayed points (bint_bonus_amount). */
  finalPoints?: number;
}

function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/**
 * Build the upload-pass breakdown from the cap result. Returns null when the
 * receipt earned no reward (nothing to explain).
 */
export function buildUploadRewardBreakdown(args: {
  capResult: RewardCapResult | null | undefined;
  rewardFinal: number;
  honorApplied: boolean;
}): RewardBreakdown | null {
  const { capResult } = args;
  const rewardFinal = round2(args.rewardFinal);
  if (!capResult || rewardFinal <= 0) return null;

  const bonus = capResult.bonus;
  return {
    version: REWARD_BREAKDOWN_VERSION,
    currency: "bINT",
    baseSlice: round2(capResult.rawReward),
    scanBonus: round2(bonus.scanBonus),
    firstScanOfDayBonus: round2(bonus.firstScanOfDayBonus),
    itemizedMultiplier: bonus.itemizedMultiplier || 1,
    streakMultiplier: bonus.streakMultiplier || 1,
    boostedReward: round2(bonus.boostedReward),
    capApplied: capResult.capApplied,
    honorApplied: !!args.honorApplied,
    rewardFinal,
  };
}

/**
 * Append the post-process multipliers and the final displayed points to an
 * upload breakdown. Falls back to a minimal breakdown reconstructed from
 * rewardFinal when the upload breakdown is missing (older receipts), so the
 * result screen still shows the CPI / season chain instead of nothing.
 */
export function augmentRewardBreakdownPostProcess(args: {
  uploadBreakdown: RewardBreakdown | null | undefined;
  rewardFinal: number;
  cpiMultiplier: number;
  seasonLevelMultiplier: number;
  categoryCatalyzer: number;
  finalPoints: number;
}): RewardBreakdown | null {
  const rewardFinal = round2(args.rewardFinal);
  const finalPoints = round2(args.finalPoints);
  if (finalPoints <= 0) return null;

  const base: RewardBreakdown =
    args.uploadBreakdown && args.uploadBreakdown.rewardFinal > 0
      ? args.uploadBreakdown
      : {
          version: REWARD_BREAKDOWN_VERSION,
          currency: "bINT",
          baseSlice: rewardFinal,
          scanBonus: 0,
          firstScanOfDayBonus: 0,
          itemizedMultiplier: 1,
          streakMultiplier: 1,
          boostedReward: rewardFinal,
          capApplied: "none",
          honorApplied: false,
          rewardFinal,
        };

  // The bonus row is clamped to the per-receipt headroom; when the naive
  // product exceeds what was actually granted, a cap was applied downstream.
  const naiveProduct = round2(
    rewardFinal * args.cpiMultiplier * args.seasonLevelMultiplier * args.categoryCatalyzer
  );
  const postProcessCapApplied = naiveProduct - finalPoints > 0.01;

  return {
    ...base,
    version: REWARD_BREAKDOWN_VERSION,
    rewardFinal,
    cpiMultiplier: args.cpiMultiplier || 1,
    seasonLevelMultiplier: args.seasonLevelMultiplier || 1,
    categoryCatalyzer: args.categoryCatalyzer || 1,
    postProcessCapApplied,
    finalPoints,
  };
}

/** Parse a stored jsonb breakdown defensively; returns null on any mismatch. */
export function parseRewardBreakdown(raw: unknown): RewardBreakdown | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const finalPoints = Number(b.finalPoints ?? b.rewardFinal);
  if (!Number.isFinite(finalPoints) || finalPoints <= 0) return null;
  const num = (v: unknown, fallback = 0): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const cap = b.capApplied;
  const capApplied: RewardBreakdown["capApplied"] =
    cap === "per_receipt" || cap === "daily_user" ? cap : "none";
  return {
    version: REWARD_BREAKDOWN_VERSION,
    currency: "bINT",
    baseSlice: num(b.baseSlice),
    scanBonus: num(b.scanBonus),
    firstScanOfDayBonus: num(b.firstScanOfDayBonus),
    itemizedMultiplier: num(b.itemizedMultiplier, 1) || 1,
    streakMultiplier: num(b.streakMultiplier, 1) || 1,
    boostedReward: num(b.boostedReward),
    capApplied,
    honorApplied: b.honorApplied === true,
    rewardFinal: num(b.rewardFinal),
    cpiMultiplier: b.cpiMultiplier != null ? num(b.cpiMultiplier, 1) : undefined,
    seasonLevelMultiplier:
      b.seasonLevelMultiplier != null ? num(b.seasonLevelMultiplier, 1) : undefined,
    categoryCatalyzer:
      b.categoryCatalyzer != null ? num(b.categoryCatalyzer, 1) : undefined,
    postProcessCapApplied: b.postProcessCapApplied === true,
    finalPoints,
  };
}
