/**
 * Referral system constants.
 * Server-only: safe to import in API routes and post-process workers.
 *
 * Model (karar 2026-07-15): a two-sided milestone ladder. Both the referrer and
 * the referee earn a fixed bonus as the referee reaches each milestone. Rewards
 * are granted OUTSIDE the daily receipt-earning cap (growth incentive, not
 * receipt earnings). The previous one-sided "5% of the referee's rewards for 30
 * days" mechanic was removed.
 */

/** Milestone identifiers, in ladder order. */
export type ReferralMilestone = "first_receipt" | "three_in_7d" | "retained_30d";

/**
 * Fixed bonus (visible points / bINT) granted to EACH side when the referee
 * reaches the milestone. Same amount to referrer and referee.
 */
export const REFERRAL_MILESTONE_REWARD: Readonly<Record<ReferralMilestone, number>> = {
  first_receipt: 50,
  three_in_7d: 250,
  retained_30d: 150,
};

/** Ladder order — used for iteration and progress display. */
const REFERRAL_MILESTONE_ORDER: readonly ReferralMilestone[] = [
  "first_receipt",
  "three_in_7d",
  "retained_30d",
];

/** Verified receipts required inside the signup window for the "3-in-7-days" milestone. */
export const REFERRAL_M2_RECEIPT_COUNT = 3;

/** Days after signup within which the M2 receipts must land. */
export const REFERRAL_M2_WINDOW_DAYS = 7;

/** Days after signup at which the referee counts as "retained" (M3). */
export const REFERRAL_M3_RETENTION_DAYS = 30;

/** Max active referral relationships per referrer. */
export const REFERRAL_CAP_PER_REFERRER = 50;

/** Max referral signups from the same IP within a 24-hour window. */
export const REFERRAL_IP_RATE_LIMIT_24H = 3;
