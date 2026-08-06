/**
 * Referral milestone rewards.
 *
 * Both the referrer and the referee earn a fixed cPoints bonus as the referee
 * climbs the milestone ladder (karar 2026-07-15). Rewards are written to the
 * canonical contribution-points ledger (`contribution_point_events`), so they:
 *   - land in the user's visible cPoints balance (`user_contribution_totals`),
 *   - are idempotent via the existing UNIQUE (username, source_type, reference_id),
 *   - sit OUTSIDE the daily receipt-earning cap (that cap is enforced on receipt
 *     `bint_bonus_amount`, not on other-source contribution events).
 *
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("referral-bonus is a server-only module.");
}

import { getSql } from "@/lib/db/client";
import {
  REFERRAL_MILESTONE_REWARD,
  REFERRAL_M2_RECEIPT_COUNT,
  type ReferralMilestone,
} from "./referral-config";
import { getRefereeMilestoneFacts, markMilestoneReached } from "./referral-storage";

const MILESTONE_COLUMN: Record<
  ReferralMilestone,
  "m1_first_receipt_at" | "m2_three_in_7d_at" | "m3_retained_30d_at"
> = {
  first_receipt: "m1_first_receipt_at",
  three_in_7d: "m2_three_in_7d_at",
  retained_30d: "m3_retained_30d_at",
};

export interface ReferralMilestoneGrant {
  milestone: ReferralMilestone;
  amount: number;
  referrerUsername: string;
  refereeUsername: string;
}

// sql tipi: neon() tarafından döndürülen template tag function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlClient = (...args: any[]) => any;

async function resolveActiveSeasonNumber(sql: SqlClient): Promise<number | null> {
  try {
    const rows = await sql`
      SELECT season_number FROM seasons WHERE status = 'active' ORDER BY start_at DESC LIMIT 1
    `;
    return (rows as { season_number?: number }[])[0]?.season_number ?? null;
  } catch {
    return null;
  }
}

/**
 * Credit `amount` cPoints to `username` for a referral milestone. Idempotent:
 * the UNIQUE (username, source_type, reference_id) skips a second credit.
 * Returns true only when this call inserted the row.
 */
async function creditMilestonePoints(
  sql: SqlClient,
  username: string,
  amount: number,
  relationshipId: number,
  milestone: ReferralMilestone,
  role: "referrer" | "referee",
  seasonNumber: number | null,
): Promise<boolean> {
  const referenceId = `${relationshipId}:${milestone}:${role}`;
  const metadata = { relationshipId, milestone, role, amount };
  const inserted = await sql`
    INSERT INTO contribution_point_events (
      username, points_delta, source_type, reference_id, season_number, metadata, contribution_version
    )
    VALUES (
      ${username}, ${amount}, 'referral_milestone', ${referenceId}, ${seasonNumber},
      ${JSON.stringify(metadata)}::jsonb, 1
    )
    ON CONFLICT (username, source_type, reference_id) DO NOTHING
    RETURNING id
  `;
  return (inserted as unknown[]).length > 0;
}

/**
 * Evaluate the referee's milestone ladder and grant any newly-reached milestones
 * to BOTH the referrer and the referee. Safe to call on every verified receipt
 * (and after email verification) — idempotent at the ledger level.
 *
 * @returns One entry per milestone that was granted by *this* call (empty if none).
 */
export async function grantReferralMilestones(
  refereeUsername: string,
): Promise<ReferralMilestoneGrant[]> {
  const sql = getSql();
  if (!sql) return [];

  const facts = await getRefereeMilestoneFacts(refereeUsername);
  if (!facts) return [];

  const { relationship: rel, emailVerified } = facts;
  // Email verification gates every grant — an unverified referee earns nothing.
  if (!emailVerified) return [];

  const referrer = rel.referrer_username;
  const seasonNumber = await resolveActiveSeasonNumber(sql);

  const reached: ReferralMilestone[] = [];
  if (!rel.m1_first_receipt_at && facts.verifiedCount >= 1) {
    reached.push("first_receipt");
  }
  if (!rel.m2_three_in_7d_at && facts.countWithinM2Window >= REFERRAL_M2_RECEIPT_COUNT) {
    reached.push("three_in_7d");
  }
  if (!rel.m3_retained_30d_at && facts.retainedAtDay30) {
    reached.push("retained_30d");
  }
  if (!reached.length) return [];

  const grants: ReferralMilestoneGrant[] = [];
  for (const milestone of reached) {
    const amount = REFERRAL_MILESTONE_REWARD[milestone];

    // Credit both sides. The ledger unique index is the real idempotency guard;
    // the relationship column is only marked after at least one side was credited.
    const refereeInserted = await creditMilestonePoints(
      sql, refereeUsername, amount, rel.id, milestone, "referee", seasonNumber,
    );
    const referrerInserted = await creditMilestonePoints(
      sql, referrer, amount, rel.id, milestone, "referrer", seasonNumber,
    );

    await markMilestoneReached(rel.id, MILESTONE_COLUMN[milestone]).catch(() => {});

    if (refereeInserted || referrerInserted) {
      grants.push({ milestone, amount, referrerUsername: referrer, refereeUsername });
    }
  }

  return grants;
}
