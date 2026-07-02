/**
 * Account & Season level (Master v4) — XP events and user_profiles updates.
 * Use only when ORACLE_ACCOUNT_SEASON_LEVEL_ENABLED=true.
 */

import { sql } from "@/lib/db/client";
import { getAccountLevelFromXp } from "@/config/account-level-config";
import { getSeasonLevelFromXp } from "@/config/season-level-config";

/** Current season number (from env, defaults to 1). */
export function getCurrentSeasonNumber(): number {
  const v = process.env.CURRENT_SEASON_NUMBER;
  if (v != null && v !== "") {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n >= 1) return n;
  }
  return 1;
}

/** XP granted when a receipt is approved: per plan, "approved receipt 20, S-tier +50". */
export function getReceiptXpDeltas(qualityTier: string | null): {
  accountXp: number;
  seasonXp: number;
} {
  const base = 20;
  const tierBonus = qualityTier === "S" ? 50 : 0;
  return { accountXp: base + tierBonus, seasonXp: base + tierBonus };
}

/**
 * Writes XP for a receipt approval and updates user_profiles.account_xp/account_level,
 * season_xp/season_level.
 * Called by trust-update when ORACLE_ACCOUNT_SEASON_LEVEL_ENABLED is set.
 */
export async function grantReceiptXpAndUpdateLevels(
  username: string,
  receiptId: string,
  qualityTier: string | null
): Promise<{ accountXp: number; seasonXp: number; accountLevel: number; seasonLevel: number } | null> {
  if (!sql) return null;

  const { accountXp: accountDelta, seasonXp: seasonDelta } =
    getReceiptXpDeltas(qualityTier);
  const seasonNumber = getCurrentSeasonNumber();

  // Idempotency guard: a receipt may be re-processed (e.g. admin correction
  // re-runs the pipeline), which would otherwise stack XP for the same receipt.
  // If XP was already granted for this receipt, return current levels untouched.
  const alreadyGranted = await sql`
    SELECT 1 FROM account_xp_events
    WHERE username = ${username}
      AND source_type = 'receipt_verified'
      AND reference_id = ${receiptId}
    LIMIT 1
  `;
  if (alreadyGranted.length > 0) {
    const cur = await sql`
      SELECT COALESCE(account_xp, 0) AS account_xp, COALESCE(account_level, 1) AS account_level,
             COALESCE(season_xp, 0) AS season_xp, COALESCE(season_level, 1) AS season_level
      FROM user_profiles WHERE username = ${username} LIMIT 1
    `;
    if (cur.length > 0) {
      const p = cur[0] as { account_xp: number; account_level: number; season_xp: number; season_level: number };
      return {
        accountXp: Number(p.account_xp) || 0,
        seasonXp: Number(p.season_xp) || 0,
        accountLevel: Number(p.account_level) || 1,
        seasonLevel: Number(p.season_level) || 1,
      };
    }
    return null;
  }

  await sql`
    INSERT INTO account_xp_events (username, xp_delta, source_type, reference_id, ayumo_linked)
    VALUES (${username}, ${accountDelta}, 'receipt_verified', ${receiptId}, true)
  `;
  await sql`
    INSERT INTO season_xp_events (username, xp_delta, source_type, reference_id, season_number)
    VALUES (${username}, ${seasonDelta}, 'receipt_verified', ${receiptId}, ${seasonNumber})
  `;

  const profileRows = await sql`
    SELECT COALESCE(account_xp, 0) AS account_xp, COALESCE(season_xp, 0) AS season_xp
    FROM user_profiles WHERE username = ${username} LIMIT 1
  `;
  let newAccountXp = accountDelta;
  let newSeasonXp = seasonDelta;
  if (profileRows.length > 0) {
    const p = profileRows[0] as { account_xp: number; season_xp: number };
    newAccountXp = (Number(p.account_xp) || 0) + accountDelta;
    newSeasonXp = (Number(p.season_xp) || 0) + seasonDelta;
  }

  const newAccountLevel = getAccountLevelFromXp(newAccountXp);
  const newSeasonLevel = getSeasonLevelFromXp(newSeasonXp);

  await sql`
    INSERT INTO user_profiles (username, account_xp, account_level, season_xp, season_level, updated_at)
    VALUES (${username}, ${newAccountXp}, ${newAccountLevel}, ${newSeasonXp}, ${newSeasonLevel}, now())
    ON CONFLICT (username) DO UPDATE SET
      account_xp = EXCLUDED.account_xp,
      account_level = EXCLUDED.account_level,
      season_xp = EXCLUDED.season_xp,
      season_level = EXCLUDED.season_level,
      updated_at = now()
  `;

  return {
    accountXp: newAccountXp,
    seasonXp: newSeasonXp,
    accountLevel: newAccountLevel,
    seasonLevel: newSeasonLevel,
  };
}
