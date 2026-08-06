/**
 * Referral relationships – database CRUD + milestone fact-gathering.
 * SERVER-ONLY.
 *
 * The reward-granting side (crediting balances, idempotency) lives in
 * referral-bonus.ts. This module owns the relationship row, its milestone
 * timestamp columns, and the read-side fact queries the grant logic depends on.
 */

if (typeof window !== "undefined") {
  throw new Error("referral-storage is a server-only module.");
}

import { getSql } from "@/lib/db/client";
import {
  REFERRAL_CAP_PER_REFERRER,
  REFERRAL_IP_RATE_LIMIT_24H,
  REFERRAL_M2_RECEIPT_COUNT,
  REFERRAL_M2_WINDOW_DAYS,
  REFERRAL_M3_RETENTION_DAYS,
} from "./referral-config";

let ensuredTable = false;

async function withTable() {
  const sql = getSql();
  if (!sql) throw new Error("Database not available");

  if (!ensuredTable) {
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'referral_relationships'
      )
    `;
    if (!exists[0]?.exists) {
      await sql`
        CREATE TABLE referral_relationships (
          id SERIAL PRIMARY KEY,
          referrer_username VARCHAR(255) NOT NULL,
          referee_username VARCHAR(255) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          referee_verified_receipt_count INT NOT NULL DEFAULT 0,
          activated_at TIMESTAMP,
          signup_ip VARCHAR(255),
          created_at TIMESTAMP DEFAULT now(),
          UNIQUE (referee_username)
        )
      `;
    }

    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS referee_username VARCHAR(255)`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS referee_verified_receipt_count INT DEFAULT 0`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS signup_ip VARCHAR(255)`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()`;
    // Milestone reach timestamps (karar 2026-07-15). Null = not yet reached.
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS m1_first_receipt_at TIMESTAMP`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS m2_three_in_7d_at TIMESTAMP`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS m3_retained_30d_at TIMESTAMP`;

    await sql`CREATE INDEX IF NOT EXISTS idx_referral_rel_referrer ON referral_relationships(referrer_username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referral_rel_referee ON referral_relationships(referee_username)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_rel_referee_unique ON referral_relationships(referee_username)`;

    ensuredTable = true;
  }
  return sql;
}

export interface ReferralRelationship {
  id: number;
  referrer_username: string;
  referee_username: string;
  status: "pending" | "activated" | "expired";
  referee_verified_receipt_count: number;
  activated_at: string | null;
  created_at: string;
  m1_first_receipt_at: string | null;
  m2_three_in_7d_at: string | null;
  m3_retained_30d_at: string | null;
  /** Derived (list view only): total cPoints the referee has earned. */
  total_earned_points?: number | null;
  /** Derived (list view only): timestamp of the referee's most recent receipt. */
  last_receipt_at?: string | null;
  /** Derived (list view only): verified receipts within the M2 signup window. */
  receipts_in_window?: number | null;
}

/**
 * Create a pending referral relationship when a new user registers via a referral link.
 * Returns the created row or null if a constraint was violated (e.g. duplicate referee).
 */
export async function createReferralRelationship(
  referrerUsername: string,
  refereeUsername: string,
  signupIp: string | null,
): Promise<ReferralRelationship | null> {
  const sql = await withTable();

  // Self-referral guard
  if (referrerUsername.toLowerCase() === refereeUsername.toLowerCase()) return null;

  // Referrer must exist — match case-insensitively, store canonical username
  const referrerRows = await sql`
    SELECT username FROM users WHERE LOWER(username) = LOWER(${referrerUsername})
  `;
  if (!referrerRows.length) return null;
  const canonicalReferrer = (referrerRows[0] as { username: string }).username;

  // Referrer cap check
  const countRows = await sql`
    SELECT COUNT(*)::int AS cnt FROM referral_relationships
    WHERE referrer_username = ${canonicalReferrer} AND status IN ('pending', 'activated')
  `;
  if ((countRows[0] as { cnt: number })?.cnt >= REFERRAL_CAP_PER_REFERRER) return null;

  // IP rate limit (24h)
  if (signupIp) {
    const ipRows = await sql`
      SELECT COUNT(*)::int AS cnt FROM referral_relationships
      WHERE signup_ip = ${signupIp} AND created_at > now() - INTERVAL '24 hours'
    `;
    if ((ipRows[0] as { cnt: number })?.cnt >= REFERRAL_IP_RATE_LIMIT_24H) return null;
  }

  try {
    const rows = await sql`
      INSERT INTO referral_relationships (referrer_username, referee_username, signup_ip)
      VALUES (${canonicalReferrer}, ${refereeUsername}, ${signupIp})
      ON CONFLICT (referee_username) DO NOTHING
      RETURNING *
    `;
    return (rows[0] as ReferralRelationship) ?? null;
  } catch {
    return null;
  }
}

/** Milestone facts for a referee, derived from `receipts` + `users`. */
export interface RefereeMilestoneFacts {
  relationship: ReferralRelationship;
  emailVerified: boolean;
  verifiedCount: number;
  /** Verified receipts whose created_at is within signup + M2 window. */
  countWithinM2Window: number;
  /** True if a verified receipt exists on/after signup + M3 retention days. */
  retainedAtDay30: boolean;
}

/**
 * Gather the milestone facts for a referee's relationship (if one exists and is
 * not expired). Returns null when there is no live relationship to evaluate.
 */
export async function getRefereeMilestoneFacts(
  refereeUsername: string,
): Promise<RefereeMilestoneFacts | null> {
  const sql = await withTable();

  const relRows = await sql`
    SELECT * FROM referral_relationships
    WHERE referee_username = ${refereeUsername}
      AND status IN ('pending', 'activated')
    LIMIT 1
  `;
  if (!relRows.length) return null;
  const relationship = relRows[0] as ReferralRelationship;

  const userRows = await sql`
    SELECT email_verified_at FROM users WHERE username = ${refereeUsername}
  `;
  const emailVerified = !!(userRows[0] as { email_verified_at?: string | null })?.email_verified_at;

  const factRows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE r.status = 'verified')::int AS verified_count,
      COUNT(*) FILTER (
        WHERE r.status = 'verified'
          AND r.created_at <= ${relationship.created_at}::timestamp + ${REFERRAL_M2_WINDOW_DAYS + " days"}::interval
      )::int AS within_m2,
      COUNT(*) FILTER (
        WHERE r.status = 'verified'
          AND r.created_at >= ${relationship.created_at}::timestamp + ${REFERRAL_M3_RETENTION_DAYS + " days"}::interval
      )::int AS retained_30d
    FROM receipts r
    WHERE r.username = ${refereeUsername}
  `;
  const f = (factRows[0] ?? {}) as {
    verified_count?: number;
    within_m2?: number;
    retained_30d?: number;
  };

  return {
    relationship,
    emailVerified,
    verifiedCount: Number(f.verified_count ?? 0),
    countWithinM2Window: Number(f.within_m2 ?? 0),
    retainedAtDay30: Number(f.retained_30d ?? 0) >= 1,
  };
}

/**
 * Persist a milestone reach timestamp on the relationship. Idempotent: only sets
 * the column when it is currently null. Also flips status to 'activated' on M1.
 * The authoritative idempotency guard for the *reward* is the reward-log unique
 * index in referral-bonus.ts; this column is a fast-path / display marker.
 */
export async function markMilestoneReached(
  relationshipId: number,
  column: "m1_first_receipt_at" | "m2_three_in_7d_at" | "m3_retained_30d_at",
): Promise<void> {
  const sql = await withTable();
  if (column === "m1_first_receipt_at") {
    await sql`
      UPDATE referral_relationships
      SET m1_first_receipt_at = COALESCE(m1_first_receipt_at, now()),
          status = 'activated',
          activated_at = COALESCE(activated_at, now())
      WHERE id = ${relationshipId}
    `;
  } else if (column === "m2_three_in_7d_at") {
    await sql`
      UPDATE referral_relationships
      SET m2_three_in_7d_at = COALESCE(m2_three_in_7d_at, now())
      WHERE id = ${relationshipId}
    `;
  } else {
    await sql`
      UPDATE referral_relationships
      SET m3_retained_30d_at = COALESCE(m3_retained_30d_at, now())
      WHERE id = ${relationshipId}
    `;
  }
}

/** One invitee row of the referral network view (raw query shape). */
interface ReferralNetworkRow {
  id: number;
  referee_username: string;
  status: string;
  created_at: string;
  m1_first_receipt_at: string | null;
  m2_three_in_7d_at: string | null;
  m3_retained_30d_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  verified_count: number;
  active_days: number;
  last_receipt_at: string | null;
  is_friend: boolean;
  identity_primary: string | null;
  identity_secondary: string | null;
  earned_by_me: number;
}

export interface ReferralNetwork {
  invitees: ReferralNetworkRow[];
  /** Total cPoints this user earned from referral milestones (both roles). */
  earnedTotal: number;
  /** Who invited this user (network origin), if anyone. */
  origin: { username: string; displayName: string | null } | null;
}

/**
 * Full network view for the "My Network" tab: every invitee with receipts,
 * active days, milestone flags, what they earned the referrer, and — only when
 * the invitee is ALSO a friend — their spending-identity class (karar
 * 2026-07-15: archetype is friend-gated).
 */
export async function getReferralNetworkForUser(username: string): Promise<ReferralNetwork> {
  const sql = await withTable();

  let invitees: ReferralNetworkRow[];
  try {
    invitees = (await sql`
      SELECT
        rr.id,
        rr.referee_username,
        rr.status,
        rr.created_at,
        rr.m1_first_receipt_at,
        rr.m2_three_in_7d_at,
        rr.m3_retained_30d_at,
        up.display_name,
        up.avatar_url,
        rc.verified_count,
        rc.active_days,
        rc.last_receipt_at,
        fr.is_friend,
        CASE WHEN fr.is_friend THEN ubp.identity_primary END AS identity_primary,
        CASE WHEN fr.is_friend THEN ubp.identity_secondary END AS identity_secondary,
        COALESCE(cpe.earned, 0) AS earned_by_me
      FROM referral_relationships rr
      LEFT JOIN user_profiles up ON up.username = rr.referee_username
      LEFT JOIN user_behavior_profile ubp ON ubp.username = rr.referee_username
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE r.status = 'verified')::int AS verified_count,
          COUNT(DISTINCT r.created_at::date) FILTER (WHERE r.status = 'verified')::int AS active_days,
          MAX(r.created_at) AS last_receipt_at
        FROM receipts r
        WHERE r.username = rr.referee_username
      ) rc ON TRUE
      LEFT JOIN LATERAL (
        SELECT EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
            AND ((f.requester_username = rr.referrer_username AND f.addressee_username = rr.referee_username)
              OR (f.requester_username = rr.referee_username AND f.addressee_username = rr.referrer_username))
        ) AS is_friend
      ) fr ON TRUE
      LEFT JOIN LATERAL (
        SELECT SUM(e.points_delta) AS earned
        FROM contribution_point_events e
        WHERE e.username = rr.referrer_username
          AND e.source_type = 'referral_milestone'
          AND e.reference_id LIKE rr.id::text || ':%'
      ) cpe ON TRUE
      WHERE rr.referrer_username = ${username}
      ORDER BY rc.active_days DESC NULLS LAST, rr.created_at DESC
    `) as unknown as ReferralNetworkRow[];
  } catch (e) {
    // friendships / user_behavior_profile may not exist yet on a fresh DB —
    // fall back to the referral-only shape rather than failing the whole view.
    console.warn("[referral-storage] network full query failed, using basic:", e);
    invitees = (await sql`
      SELECT
        rr.id, rr.referee_username, rr.status, rr.created_at,
        rr.m1_first_receipt_at, rr.m2_three_in_7d_at, rr.m3_retained_30d_at,
        up.display_name, up.avatar_url,
        rc.verified_count, rc.active_days, rc.last_receipt_at,
        FALSE AS is_friend,
        NULL AS identity_primary,
        NULL AS identity_secondary,
        0 AS earned_by_me
      FROM referral_relationships rr
      LEFT JOIN user_profiles up ON up.username = rr.referee_username
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE r.status = 'verified')::int AS verified_count,
          COUNT(DISTINCT r.created_at::date) FILTER (WHERE r.status = 'verified')::int AS active_days,
          MAX(r.created_at) AS last_receipt_at
        FROM receipts r
        WHERE r.username = rr.referee_username
      ) rc ON TRUE
      WHERE rr.referrer_username = ${username}
      ORDER BY rc.active_days DESC NULLS LAST, rr.created_at DESC
    `) as unknown as ReferralNetworkRow[];
  }

  const earnedRows = await sql`
    SELECT COALESCE(SUM(points_delta), 0) AS total
    FROM contribution_point_events
    WHERE username = ${username} AND source_type = 'referral_milestone'
  `;
  const earnedTotal = Number((earnedRows[0] as { total?: number })?.total ?? 0);

  const originRows = await sql`
    SELECT rr.referrer_username, up.display_name
    FROM referral_relationships rr
    LEFT JOIN user_profiles up ON up.username = rr.referrer_username
    WHERE rr.referee_username = ${username}
    LIMIT 1
  `;
  const origin = originRows.length
    ? {
        username: (originRows[0] as { referrer_username: string }).referrer_username,
        displayName: (originRows[0] as { display_name: string | null }).display_name,
      }
    : null;

  return { invitees, earnedTotal, origin };
}

;
