/**
 * Achievement metrics — the real, grounded value behind each track.
 *
 * Every query is scoped to one user and reads existing tables only (no new
 * counters, no fabrication). A "verified" receipt is proof_status='matched'
 * (lib/receipt/proof-matching, migration 082). Each metric is defensive: any
 * failure returns 0 so the caller (achievement evaluation) never breaks the
 * receipt pipeline.
 *
 * Column grounding (verified against migrations + live DEV data):
 *  - receipts.username, receipts.merchant_name, receipts.proof_status (082)
 *    NOTE: receipts.merchant_id is NOT populated by the pipeline (0/9 matched rows
 *    in DEV) — merchant identity lives in merchant_name, so diversity counts that.
 *  - receipt_line_items.receipt_id, .category_path                    (050)
 *  - receipt_canonical.receipt_id, .total_hidden_canonical            (023)
 *  - user_streaks.username, .longest_streak                           (044)
 *  - user_profiles.username, .account_level                           (015)
 *  - referral_relationships.referrer_username, .active, .referee_phone_verified_at (015)
 */

import { sql } from "@/lib/db/client";
import type { AchievementMetric } from "@/config/achievements";

async function scalar(rows: unknown): Promise<number> {
  const r = (rows as Array<Record<string, unknown>>)[0];
  if (!r) return 0;
  const v = Object.values(r)[0];
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Distinct merchants on verified receipts (by normalized name — merchant_id is unset). */
async function distinctMerchants(username: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(DISTINCT lower(btrim(merchant_name)))::int AS n
    FROM receipts
    WHERE username = ${username} AND proof_status = 'matched'
      AND merchant_name IS NOT NULL AND btrim(merchant_name) <> ''
  `;
  return scalar(rows);
}

/** Distinct v3-taxonomy category paths across the user's verified receipts. */
async function distinctCategories(username: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(DISTINCT li.category_path)::int AS n
    FROM receipt_line_items li
    JOIN receipts r ON r.receipt_id = li.receipt_id
    WHERE r.username = ${username} AND r.proof_status = 'matched' AND li.category_path IS NOT NULL
  `;
  return scalar(rows);
}

/** Best (longest) active-day streak the user has reached, across streak types. */
async function bestStreak(username: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(MAX(longest_streak), 0)::int AS n
    FROM user_streaks
    WHERE username = ${username}
  `;
  return scalar(rows);
}

/** Account level (lifetime). */
async function accountLevel(username: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(account_level, 1)::int AS n
    FROM user_profiles
    WHERE username = ${username}
    LIMIT 1
  `;
  return scalar(rows);
}

/** Count of verified receipts. */
async function verifiedReceipts(username: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS n
    FROM receipts
    WHERE username = ${username} AND proof_status = 'matched'
  `;
  return scalar(rows);
}

/** Cumulative hidden cost surfaced across verified receipts (₺). */
async function hiddenCostSurfaced(username: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(rc.total_hidden_canonical), 0)::numeric AS n
    FROM receipt_canonical rc
    JOIN receipts r ON r.receipt_id = rc.receipt_id
    WHERE r.username = ${username} AND r.proof_status = 'matched'
  `;
  return scalar(rows);
}

/** Successful referrals: active relationships whose referee verified their phone. */
async function successfulReferrals(username: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS n
    FROM referral_relationships
    WHERE referrer_username = ${username}
      AND active = true
      AND referee_phone_verified_at IS NOT NULL
  `;
  return scalar(rows);
}

const METRIC_FNS: Record<AchievementMetric, (username: string) => Promise<number>> = {
  distinct_merchants: distinctMerchants,
  distinct_categories: distinctCategories,
  best_streak: bestStreak,
  account_level: accountLevel,
  verified_receipts: verifiedReceipts,
  hidden_cost_surfaced: hiddenCostSurfaced,
  successful_referrals: successfulReferrals,
};

/**
 * Compute every achievement metric for a user. Defensive: a failing metric
 * resolves to 0 and never throws, so achievement evaluation cannot break the
 * receipt pipeline.
 */
export async function computeAchievementMetrics(
  username: string,
): Promise<Record<AchievementMetric, number>> {
  const entries = await Promise.all(
    (Object.keys(METRIC_FNS) as AchievementMetric[]).map(async (metric) => {
      if (!sql) return [metric, 0] as const;
      try {
        return [metric, await METRIC_FNS[metric](username)] as const;
      } catch (err) {
        console.error(`[achievements] metric ${metric} failed for ${username}:`, err);
        return [metric, 0] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<AchievementMetric, number>;
}
