import { getSql } from "@/lib/db/client";
import { dispatchQuestReward } from "@/lib/quests/reward-dispatcher";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows)) {
    return (r as { rows: any[] }).rows;
  }
  return [];
}

type EligibleDailyQuestRow = {
  id: number;
  season_number: number;
  type: string;
  reward_ryumo: number;
  reward_season_xp: number;
};

export async function autoCompleteEligibleDailyQuests(
  username: string,
  dateStr: string = new Date().toISOString().slice(0, 10)
): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;

  const eligibleResult = await sql`
    SELECT
      uq.id,
      uq.season_number,
      qt.type,
      qt.reward_ryumo,
      qt.reward_season_xp
    FROM user_quests uq
    JOIN quest_templates qt ON uq.quest_template_id = qt.id
    WHERE uq.username = ${username}
      AND qt.type IN ('D1','D3','D4','D5','D6','D7','D8','D9','D_ADMIN_FREE_300XP')
      AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${dateStr}::date
      AND uq.status = 'active'
      AND COALESCE(uq.progress, 0) >= COALESCE(uq.target, 1)
    ORDER BY uq.updated_at ASC, uq.id ASC
  `;

  const eligible = toRows(eligibleResult) as EligibleDailyQuestRow[];
  let completedCount = 0;

  for (const quest of eligible) {
    const result = await dispatchQuestReward(
      username,
      Number(quest.id),
      String(quest.type),
      Number(quest.reward_ryumo) || 0,
      Number(quest.reward_season_xp) || 0,
      Number(quest.season_number) || 1
    );

    if (result.ok) {
      if (!result.alreadyProcessed) {
        completedCount += 1;
      }
      continue;
    }

    console.warn("[quests] auto-complete failed:", {
      username,
      questId: quest.id,
      questType: quest.type,
      error: result.error,
    });
  }

  return completedCount;
}
