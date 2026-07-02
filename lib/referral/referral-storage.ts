/**
 * Referral relationships – database CRUD.
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("referral-storage is a server-only module.");
}

import { getSql } from "@/lib/db/client";
import {
  REFERRAL_CAP_PER_REFERRER,
  REFERRAL_IP_RATE_LIMIT_24H,
  REFERRAL_ACTIVATION_RECEIPT_COUNT,
  REFERRAL_BONUS_WINDOW_DAYS,
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
          bonus_expires_at TIMESTAMP,
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
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS bonus_expires_at TIMESTAMP`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS signup_ip VARCHAR(255)`;
    await sql`ALTER TABLE referral_relationships ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()`;

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
  bonus_expires_at: string | null;
  created_at: string;
  /** Derived (list view only): total cPoints the referee has earned. */
  total_earned_points?: number | null;
  /** Derived (list view only): timestamp of the referee's most recent receipt. */
  last_receipt_at?: string | null;
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
  if ((countRows[0] as any)?.cnt >= REFERRAL_CAP_PER_REFERRER) return null;

  // IP rate limit (24h)
  if (signupIp) {
    const ipRows = await sql`
      SELECT COUNT(*)::int AS cnt FROM referral_relationships
      WHERE signup_ip = ${signupIp} AND created_at > now() - INTERVAL '24 hours'
    `;
    if ((ipRows[0] as any)?.cnt >= REFERRAL_IP_RATE_LIMIT_24H) return null;
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

/**
 * Get the pending referral relationship for a referee (if any).
 */
export async function getPendingReferralForReferee(
  refereeUsername: string,
): Promise<ReferralRelationship | null> {
  const sql = await withTable();
  const rows = await sql`
    SELECT * FROM referral_relationships
    WHERE referee_username = ${refereeUsername} AND status = 'pending'
    LIMIT 1
  `;
  return (rows[0] as ReferralRelationship) ?? null;
}

/**
 * Get the active referral relationship for a referee (activated & not expired).
 */
export async function getActiveReferralForReferee(
  refereeUsername: string,
): Promise<ReferralRelationship | null> {
  const sql = await withTable();
  const rows = await sql`
    SELECT * FROM referral_relationships
    WHERE referee_username = ${refereeUsername}
      AND status = 'activated'
      AND bonus_expires_at > now()
    LIMIT 1
  `;
  return (rows[0] as ReferralRelationship) ?? null;
}

/** Count receipts that count toward referral progress (matches sync backfill). */
async function countVerifiedReceiptsForReferee(
  sql: Awaited<ReturnType<typeof withTable>>,
  refereeUsername: string,
): Promise<number> {
  const countRows = await sql`
    SELECT COUNT(*)::int AS cnt FROM receipts
    WHERE username = ${refereeUsername} AND status = 'verified'
  `;
  return Number((countRows[0] as { cnt?: number })?.cnt ?? 0);
}

/**
 * Reconcile `referee_verified_receipt_count` from `receipts` for a pending relationship.
 * Post-process may skip the +1 counter when it exits early or fails after a prior run.
 */
export async function reconcileRefereeVerifiedReceiptCount(
  refereeUsername: string,
): Promise<number> {
  const sql = await withTable();
  const count = await countVerifiedReceiptsForReferee(sql, refereeUsername);
  await sql`
    UPDATE referral_relationships
    SET referee_verified_receipt_count = ${count}
    WHERE referee_username = ${refereeUsername} AND status = 'pending'
  `;
  return count;
}

/**
 * After a receipt is verified, refresh the referee counter from `receipts` and
 * activate the relationship when email is verified and count ≥ threshold.
 */
export async function incrementRefereeReceiptCount(
  refereeUsername: string,
): Promise<{ activated: boolean; relationship: ReferralRelationship | null }> {
  const sql = await withTable();

  const userRows = await sql`
    SELECT email_verified_at FROM users WHERE username = ${refereeUsername}
  `;
  const emailVerified = !!(userRows[0] as { email_verified_at?: string | null })?.email_verified_at;

  const count = await reconcileRefereeVerifiedReceiptCount(refereeUsername);

  const pending = await sql`
    SELECT * FROM referral_relationships
    WHERE referee_username = ${refereeUsername} AND status = 'pending'
    LIMIT 1
  `;
  if (!pending.length) return { activated: false, relationship: null };

  const rel = { ...(pending[0] as ReferralRelationship), referee_verified_receipt_count: count };

  if (emailVerified && count >= REFERRAL_ACTIVATION_RECEIPT_COUNT) {
    const activated = await sql`
      UPDATE referral_relationships
      SET status = 'activated',
          activated_at = now(),
          bonus_expires_at = now() + ${REFERRAL_BONUS_WINDOW_DAYS + " days"}::interval
      WHERE id = ${rel.id} AND status = 'pending'
      RETURNING *
    `;
    if (activated.length) {
      return { activated: true, relationship: activated[0] as ReferralRelationship };
    }
  }

  return { activated: false, relationship: rel };
}

/**
 * If the referee already had enough verified receipts before email verification,
 * `incrementRefereeReceiptCount` never reruns — relationship would stay pending
 * until the next receipt. Call this after `email_verified_at` is set.
 */
export async function tryActivatePendingReferralAfterEmailVerified(
  refereeUsername: string,
): Promise<{ activated: boolean; referrerUsername: string | null }> {
  const sql = await withTable();

  await reconcileRefereeVerifiedReceiptCount(refereeUsername);

  const pending = await sql`
    SELECT * FROM referral_relationships
    WHERE referee_username = ${refereeUsername} AND status = 'pending'
    LIMIT 1
  `;
  if (!pending.length) {
    return { activated: false, referrerUsername: null };
  }

  const rel = pending[0] as ReferralRelationship;
  if (rel.referee_verified_receipt_count < REFERRAL_ACTIVATION_RECEIPT_COUNT) {
    return { activated: false, referrerUsername: null };
  }

  const activated = await sql`
    UPDATE referral_relationships
    SET
      status = 'activated',
      activated_at = now(),
      bonus_expires_at = now() + ${REFERRAL_BONUS_WINDOW_DAYS + " days"}::interval
    WHERE id = ${rel.id} AND status = 'pending'
    RETURNING *
  `;

  if (!activated.length) {
    return { activated: false, referrerUsername: null };
  }

  const row = activated[0] as ReferralRelationship;
  return { activated: true, referrerUsername: row.referrer_username };
}

/**
 * Backfill `referee_verified_receipt_count` from `receipts` (status = verified),
 * then activate pending relationships where email is verified and count ≥ threshold.
 * Safe to run multiple times (idempotent for already-activated rows).
 */
export async function syncRefereeVerifiedReceiptCountsFromReceipts(): Promise<{
  relationshipsSynced: number;
  relationshipsActivated: number;
}> {
  const sql = await withTable();

  const synced = await sql`
    UPDATE referral_relationships rr
    SET referee_verified_receipt_count = COALESCE(
      (
        SELECT COUNT(*)::int
        FROM receipts r
        WHERE r.username = rr.referee_username AND r.status = 'verified'
      ),
      0
    )
    RETURNING rr.id
  `;

  const activated = await sql`
    UPDATE referral_relationships rr
    SET
      status = 'activated',
      activated_at = now(),
      bonus_expires_at = now() + ${REFERRAL_BONUS_WINDOW_DAYS + " days"}::interval
    FROM users u
    WHERE rr.referee_username = u.username
      AND rr.status = 'pending'
      AND u.email_verified_at IS NOT NULL
      AND rr.referee_verified_receipt_count >= ${REFERRAL_ACTIVATION_RECEIPT_COUNT}
    RETURNING rr.id
  `;

  return {
    relationshipsSynced: synced.length,
    relationshipsActivated: activated.length,
  };
}

/**
 * List all referral relationships where the given user is the referrer.
 */
export async function listReferralsForReferrer(
  referrerUsername: string,
): Promise<ReferralRelationship[]> {
  const sql = await withTable();

  await sql`
    UPDATE referral_relationships rr
    SET referee_verified_receipt_count = COALESCE(
      (
        SELECT COUNT(*)::int
        FROM receipts r
        WHERE r.username = rr.referee_username AND r.status = 'verified'
      ),
      0
    )
    WHERE rr.referrer_username = ${referrerUsername}
  `;

  await sql`
    UPDATE referral_relationships rr
    SET
      status = 'activated',
      activated_at = now(),
      bonus_expires_at = now() + ${REFERRAL_BONUS_WINDOW_DAYS + " days"}::interval
    FROM users u
    WHERE rr.referrer_username = ${referrerUsername}
      AND rr.referee_username = u.username
      AND rr.status = 'pending'
      AND u.email_verified_at IS NOT NULL
      AND rr.referee_verified_receipt_count >= ${REFERRAL_ACTIVATION_RECEIPT_COUNT}
  `;

  const rows = await sql`
    SELECT
      rr.*,
      up.display_name,
      up.avatar_url,
      COALESCE(uct.contribution_points, 0) AS total_earned_points,
      rc.last_receipt_at
    FROM referral_relationships rr
    LEFT JOIN user_profiles up ON rr.referee_username = up.username
    LEFT JOIN user_contribution_totals uct ON uct.username = rr.referee_username
    LEFT JOIN LATERAL (
      SELECT MAX(r.created_at) AS last_receipt_at
      FROM receipts r
      WHERE r.username = rr.referee_username
    ) rc ON TRUE
    WHERE rr.referrer_username = ${referrerUsername}
    ORDER BY rr.created_at DESC
  `;
  return rows as unknown as ReferralRelationship[];
}

