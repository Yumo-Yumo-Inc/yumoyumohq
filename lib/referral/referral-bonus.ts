/**
 * Referral bonus calculation and reward-log persistence.
 * Called from post-process after receipt_rewards is written.
 * SERVER-ONLY.
 */

if (typeof window !== "undefined") {
  throw new Error("referral-bonus is a server-only module.");
}

import { getSql } from "@/lib/db/client";
import { REFERRAL_BONUS_PCT } from "./referral-config";

let ensuredRewardLog = false;

async function ensureRewardLogTable() {
  const sql = getSql();
  if (!sql || ensuredRewardLog) return;

  const exists = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'referral_reward_log'
    )
  `;
  if (!exists[0]?.exists) {
    await sql`
      CREATE TABLE referral_reward_log (
        id SERIAL PRIMARY KEY,
        receipt_id VARCHAR(255) NOT NULL,
        referral_relationship_id INT NOT NULL,
        amount_ryumo_referee NUMERIC(20,6) DEFAULT 0,
        amount_ryumo_referrer NUMERIC(20,6) DEFAULT 0,
        created_at TIMESTAMP DEFAULT now()
      )
    `;
  }

  await sql`ALTER TABLE referral_reward_log ADD COLUMN IF NOT EXISTS receipt_id VARCHAR(255)`;
  await sql`ALTER TABLE referral_reward_log ADD COLUMN IF NOT EXISTS referral_relationship_id INT`;
  await sql`ALTER TABLE referral_reward_log ADD COLUMN IF NOT EXISTS amount_ryumo_referee NUMERIC(20,6) DEFAULT 0`;
  await sql`ALTER TABLE referral_reward_log ADD COLUMN IF NOT EXISTS amount_ryumo_referrer NUMERIC(20,6) DEFAULT 0`;
  await sql`ALTER TABLE referral_reward_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()`;

  await sql`CREATE INDEX IF NOT EXISTS idx_rrl_receipt ON referral_reward_log(receipt_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_rrl_relationship ON referral_reward_log(referral_relationship_id)`;
  // One bonus per (receipt, relationship) — the DB constraint backs the
  // idempotency check so a concurrent post-process re-run can't double-credit.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_rrl_receipt_rel ON referral_reward_log(receipt_id, referral_relationship_id)`;

  ensuredRewardLog = true;
}

export interface ReferralBonusResult {
  applied: boolean;
  referrerUsername: string | null;
  bonusAmount: number;
}

/**
 * Calculate and persist referral bonus for a verified receipt.
 *
 * @param receiptId     - The verified receipt id
 * @param refereeUsername - The receipt owner (referee)
 * @param ryumoBonusAmount - The rYUMO bonus amount from receipt_rewards
 * @returns Whether a bonus was applied and its amount
 */
export async function applyReferralBonus(
  receiptId: string,
  refereeUsername: string,
  ryumoBonusAmount: number,
): Promise<ReferralBonusResult> {
  const noBonus: ReferralBonusResult = { applied: false, referrerUsername: null, bonusAmount: 0 };

  if (!ryumoBonusAmount || ryumoBonusAmount <= 0) return noBonus;

  const sql = getSql();
  if (!sql) return noBonus;

  await ensureRewardLogTable();

  // Find active, non-expired referral relationship
  const relRows = await sql`
    SELECT id, referrer_username FROM referral_relationships
    WHERE referee_username = ${refereeUsername}
      AND status = 'activated'
      AND bonus_expires_at > now()
    LIMIT 1
  `;
  if (!relRows.length) return noBonus;

  const rel = relRows[0] as { id: number; referrer_username: string };
  const bonusAmount = Math.round(ryumoBonusAmount * REFERRAL_BONUS_PCT * 100) / 100;
  if (bonusAmount <= 0) return noBonus;

  // Idempotency is enforced atomically by the unique index: the INSERT only
  // succeeds for the first writer; a concurrent re-run gets 0 rows back and
  // skips the credit, so the referrer can't be double-credited.
  const inserted = await sql`
    INSERT INTO referral_reward_log (receipt_id, referral_relationship_id, amount_ryumo_referee, amount_ryumo_referrer)
    VALUES (${receiptId}, ${rel.id}, 0, ${bonusAmount})
    ON CONFLICT (receipt_id, referral_relationship_id) DO NOTHING
    RETURNING id
  `;
  if (!inserted.length) return noBonus;

  // Credit the referrer's balance
  await sql`
    UPDATE user_profiles
    SET ryumo_balance = COALESCE(ryumo_balance, 0) + ${bonusAmount},
        updated_at = now()
    WHERE username = ${rel.referrer_username}
  `;

  return { applied: true, referrerUsername: rel.referrer_username, bonusAmount };
}
