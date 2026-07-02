/**
 * Referral system constants.
 * Server-only: safe to import in API routes and post-process workers.
 */

/** Percentage of referee's rYUMO bonus that goes to the referrer (0–1 scale). */
export const REFERRAL_BONUS_PCT = 0.05;

/** Days after activation during which the referrer earns the bonus. */
export const REFERRAL_BONUS_WINDOW_DAYS = 30;

/** Number of verified receipts the referee must submit before the relationship activates. */
export const REFERRAL_ACTIVATION_RECEIPT_COUNT = 3;

/** Max active (pending + activated) referral relationships per referrer. */
export const REFERRAL_CAP_PER_REFERRER = 50;

/** Max referral signups from the same IP within a 24-hour window. */
export const REFERRAL_IP_RATE_LIMIT_24H = 3;
