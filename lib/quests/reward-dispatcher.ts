/**
 * Reward dispatcher: when quest completes, add bINT + season XP + account XP.
 * Every quest type grants both season XP and account XP (account XP = rewardAccountXp ?? rewardSeasonXp).
 */

import { getSql } from "@/lib/db/client";
import { getAccountLevelFromXp } from "@/config/account-level-config";
import { getSeasonLevelFromXp } from "@/config/season-level-config";
import { QUEST_XP_TO_POINT_RATE, questXpToCPoints } from "@/config/contribution-config";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows)) {
    return (r as { rows: any[] }).rows;
  }
  return [];
}

export async function dispatchQuestReward(
  username: string,
  userQuestId: number,
  questType: string,
  rewardRyumo: number,
  rewardSeasonXp: number,
  seasonNumber: number,
  rewardAccountXp?: number
): Promise<{ ok: boolean; error?: string; alreadyProcessed?: boolean }> {
  const sql = getSql();
  if (!sql) return { ok: false, error: "Database not available" };

  let transactionOpen = false;

  try {
    const accountXpToAdd = rewardAccountXp ?? rewardSeasonXp;

    await sql`BEGIN`;
    transactionOpen = true;

    const claimResult = await sql`
      UPDATE user_quests
      SET status = 'processing_reward', updated_at = now()
      WHERE id = ${userQuestId}
        AND username = ${username}
        AND status = 'active'
      RETURNING id
    `;
    const claimRows = toRows(claimResult);
    if (claimRows.length === 0) {
      await sql`ROLLBACK`;
      transactionOpen = false;
      return { ok: true, alreadyProcessed: true };
    }

    const upsertResult = await sql`
      INSERT INTO user_profiles (username, bint_balance, season_xp, account_xp, account_level, season_level, updated_at)
      VALUES (${username}, ${rewardRyumo}, ${rewardSeasonXp}, ${accountXpToAdd}, 1, 1, now())
      ON CONFLICT (username) DO UPDATE SET
        bint_balance = COALESCE(user_profiles.bint_balance, 0) + EXCLUDED.bint_balance,
        season_xp = COALESCE(user_profiles.season_xp, 0) + ${rewardSeasonXp},
        account_xp = COALESCE(user_profiles.account_xp, 0) + ${accountXpToAdd},
        updated_at = EXCLUDED.updated_at
      RETURNING account_xp, season_xp
    `;
    const updatedRow = toRows(upsertResult)[0] as { account_xp?: number; season_xp?: number } | undefined;
    const newAccountXp = Number(updatedRow?.account_xp ?? accountXpToAdd);
    const newSeasonXp = Number(updatedRow?.season_xp ?? rewardSeasonXp);
    const newAccountLevel = getAccountLevelFromXp(newAccountXp);
    const newSeasonLevel = getSeasonLevelFromXp(newSeasonXp);

    await sql`
      UPDATE user_profiles
      SET account_level = ${newAccountLevel}, season_level = ${newSeasonLevel}, updated_at = now()
      WHERE username = ${username}
    `;

    await sql`
      UPDATE user_quests
      SET status = 'completed', progress = target, completed_at = now(), updated_at = now()
      WHERE id = ${userQuestId} AND username = ${username}
    `;

    try {
      await sql`
        INSERT INTO season_xp_events (username, xp_delta, source_type, reference_id, season_number)
        VALUES (${username}, ${rewardSeasonXp}, ${"quest_" + questType.toLowerCase()}, ${String(userQuestId)}, ${seasonNumber})
      `;
    } catch (e) {
      console.warn("[reward-dispatcher] season_xp_events insert failed (reward still applied):", e);
    }

    try {
      await sql`
        INSERT INTO account_xp_events (username, xp_delta, source_type, reference_id, ayumo_linked)
        VALUES (${username}, ${accountXpToAdd}, ${"quest_" + questType.toLowerCase()}, ${String(userQuestId)}, false)
      `;
    } catch (e) {
      console.warn("[reward-dispatcher] account_xp_events insert failed (reward still applied):", e);
    }

    // Award contribution points (cPoints) for the quest in real time. Mirrors the
    // backfill conversion (season XP × QUEST_XP_TO_POINT_RATE) and shares the same
    // (source_type, reference_id) so the two paths are idempotent with each other.
    // Without this, quest cPoints only appeared after a manual backfill run.
    try {
      const questPoints = questXpToCPoints(rewardSeasonXp);
      if (questPoints > 0) {
        await sql`
          INSERT INTO contribution_point_events (
            username, points_delta, source_type, reference_id, season_number, metadata, contribution_version
          )
          VALUES (
            ${username},
            ${questPoints},
            ${"quest_" + questType.toLowerCase()},
            ${String(userQuestId)},
            ${seasonNumber},
            ${JSON.stringify({ rewardSeasonXp, rate: QUEST_XP_TO_POINT_RATE })}::jsonb,
            1
          )
          ON CONFLICT (username, source_type, reference_id) DO NOTHING
        `;
      }
    } catch (e) {
      console.warn("[reward-dispatcher] contribution_point_events insert failed (reward still applied):", e);
    }

    await sql`COMMIT`;
    transactionOpen = false;
    return { ok: true };
  } catch (err: any) {
    if (transactionOpen) {
      try {
        await sql`ROLLBACK`;
      } catch (rollbackError) {
        console.error("[reward-dispatcher] rollback failed:", rollbackError);
      }
    }
    console.error("[reward-dispatcher] dispatchQuestReward error:", err);
    return { ok: false, error: err?.message ?? String(err) };
  }
}
