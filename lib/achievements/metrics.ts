/**
 * Achievement metrics — the real, grounded value behind each track.
 *
 * Every query is scoped to one user and reads existing tables only (no new
 * counters, no fabrication). Each metric is defensive: any failure returns 0 so
 * the caller (achievement evaluation) never breaks the receipt pipeline.
 *
 * "Verified receipt" for achievements (Ugur 2026-08-10) means a receipt that
 * paid a reward — contribution ledger receipt_verified, reward_final > 0, or
 * receipt_rewards with points/amount. It is NOT proof_status = matched
 * (that flag is only the dual-proof POS-itemized link).
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

/** Distinct merchants on rewarded receipts (by normalized name). */
async function distinctMerchants(username: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(DISTINCT lower(btrim(r.merchant_name)))::int AS n
    FROM receipts r
    WHERE r.username = ${username}
      AND r.merchant_name IS NOT NULL AND btrim(r.merchant_name) <> ''
      AND (
        COALESCE(r.reward_final, 0) > 0
        OR EXISTS (
          SELECT 1 FROM contribution_point_events e
          WHERE e.username = r.username
            AND e.source_type = 'receipt_verified'
            AND e.reference_id = r.receipt_id::text
            AND e.points_delta > 0
        )
        OR EXISTS (
          SELECT 1 FROM receipt_rewards rr
          WHERE rr.receipt_id = r.receipt_id
            AND (COALESCE(rr.contribution_points, 0) > 0 OR COALESCE(rr.bint_amount, 0) > 0)
        )
      )
  `;
  return scalar(rows);
}

/** Distinct v3-taxonomy category paths across the user's rewarded receipts. */
async function distinctCategories(username: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(DISTINCT li.category_path)::int AS n
    FROM receipt_line_items li
    JOIN receipts r ON r.receipt_id = li.receipt_id
    WHERE r.username = ${username}
      AND li.category_path IS NOT NULL
      AND (
        COALESCE(r.reward_final, 0) > 0
        OR EXISTS (
          SELECT 1 FROM contribution_point_events e
          WHERE e.username = r.username
            AND e.source_type = 'receipt_verified'
            AND e.reference_id = r.receipt_id::text
            AND e.points_delta > 0
        )
        OR EXISTS (
          SELECT 1 FROM receipt_rewards rr
          WHERE rr.receipt_id = r.receipt_id
            AND (COALESCE(rr.contribution_points, 0) > 0 OR COALESCE(rr.bint_amount, 0) > 0)
        )
      )
  `;
  return scalar(rows);
}

async function bestStreak(username: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(MAX(longest_streak), 0)::int AS n
    FROM user_streaks
    WHERE username = ${username}
  `;
  return scalar(rows);
}

async function accountLevel(username: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(account_level, 1)::int AS n
    FROM user_profiles
    WHERE username = ${username}
    LIMIT 1
  `;
  return scalar(rows);
}

/** Count of rewarded receipts (achievement "verified" = paid out). */
async function verifiedReceipts(username: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(DISTINCT r.receipt_id)::int AS n
    FROM receipts r
    WHERE r.username = ${username}
      AND (
        COALESCE(r.reward_final, 0) > 0
        OR EXISTS (
          SELECT 1 FROM contribution_point_events e
          WHERE e.username = r.username
            AND e.source_type = 'receipt_verified'
            AND e.reference_id = r.receipt_id::text
            AND e.points_delta > 0
        )
        OR EXISTS (
          SELECT 1 FROM receipt_rewards rr
          WHERE rr.receipt_id = r.receipt_id
            AND (COALESCE(rr.contribution_points, 0) > 0 OR COALESCE(rr.bint_amount, 0) > 0)
        )
      )
  `;
  return scalar(rows);
}

async function hiddenCostSurfaced(username: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(rc.total_hidden_canonical), 0)::numeric AS n
    FROM receipt_canonical rc
    JOIN receipts r ON r.receipt_id = rc.receipt_id
    WHERE r.username = ${username}
      AND (
        COALESCE(r.reward_final, 0) > 0
        OR EXISTS (
          SELECT 1 FROM contribution_point_events e
          WHERE e.username = r.username
            AND e.source_type = 'receipt_verified'
            AND e.reference_id = r.receipt_id::text
            AND e.points_delta > 0
        )
        OR EXISTS (
          SELECT 1 FROM receipt_rewards rr
          WHERE rr.receipt_id = r.receipt_id
            AND (COALESCE(rr.contribution_points, 0) > 0 OR COALESCE(rr.bint_amount, 0) > 0)
        )
      )
  `;
  return scalar(rows);
}

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
