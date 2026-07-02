/**
 * One-time backfill: if D1 (check-in) quests completed in the past never wrote XP,
 * this function updates account_xp/season_xp based on the number of completed D1s.
 * Called when the profile page loads; only corrects state when account_xp = 0.
 */

import { getSql } from "@/lib/db/client";
import { getAccountLevelFromXp } from "@/config/account-level-config";
import { getSeasonLevelFromXp } from "@/config/season-level-config";

const D1_XP_PER_QUEST = 32;

function toRows(r: unknown): unknown[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: unknown[] }).rows;
  return [];
}

export async function reconcileQuestXpForUser(username: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  const countResult = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM user_quests uq
    JOIN quest_templates qt ON uq.quest_template_id = qt.id
    WHERE uq.username = ${username} AND qt.type = 'D1' AND uq.status = 'completed'
  `;
  const countRow = toRows(countResult)[0] as { cnt?: number } | undefined;
  const completedD1 = Number(countRow?.cnt ?? 0);
  if (completedD1 === 0) return;

  const expectedXp = completedD1 * D1_XP_PER_QUEST;
  const newAccountLevel = getAccountLevelFromXp(expectedXp);
  const newSeasonLevel = getSeasonLevelFromXp(expectedXp);

  await sql`
    INSERT INTO user_profiles (username, account_xp, account_level, season_xp, season_level, bint_balance, updated_at)
    VALUES (${username}, ${expectedXp}, ${newAccountLevel}, ${expectedXp}, ${newSeasonLevel}, 0, now())
    ON CONFLICT (username) DO UPDATE SET
      account_xp = CASE WHEN COALESCE(user_profiles.account_xp, 0) = 0 THEN ${expectedXp} ELSE user_profiles.account_xp END,
      account_level = CASE WHEN COALESCE(user_profiles.account_xp, 0) = 0 THEN ${newAccountLevel} ELSE user_profiles.account_level END,
      season_xp = CASE WHEN COALESCE(user_profiles.season_xp, 0) = 0 THEN ${expectedXp} ELSE user_profiles.season_xp END,
      season_level = CASE WHEN COALESCE(user_profiles.season_xp, 0) = 0 THEN ${newSeasonLevel} ELSE user_profiles.season_level END,
      updated_at = now()
  `;
}
