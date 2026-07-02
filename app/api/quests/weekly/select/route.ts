import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";
import type { WeeklyQuestType, WeeklyReceiptType } from "@/lib/quests/schema";
import {
  WEEKLY_TYPES,
  autoCompleteEligibleWeeklyQuests,
  getWeekBounds,
  getWeeklyQuestRewardAccountXp,
  getWeeklyQuestSelectionState,
} from "@/lib/quests/weekly-progress";
import {
  buildMobileActionResultForUser,
  createMobileLevelEvent,
  getMobileLevelSnapshot,
} from "@/lib/mobile/server-data";

function toRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "rows" in value && Array.isArray((value as { rows?: unknown[] }).rows)) {
    return ((value as { rows: unknown[] }).rows ?? []) as T[];
  }
  return [];
}

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const questType = body?.questType ?? body?.type;
    if (!questType || !WEEKLY_TYPES.includes(questType as WeeklyReceiptType)) {
      return NextResponse.json({ error: "Invalid questType", valid: WEEKLY_TYPES }, { status: 400 });
    }
    const selectedType = questType as WeeklyQuestType;

    await warmUpConnection();

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const { endTimestamp } = getWeekBounds(todayStr);
    const selectionState = await getWeeklyQuestSelectionState(username, todayStr);

    const existing = await sql`
      SELECT 1 FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND qt.type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6')
        AND uq.expires_at >= ${selectionState.weekStart}::date
        AND uq.expires_at < (${selectionState.weekEnd}::date + INTERVAL '1 day')
      LIMIT 1
    `;

    if (toRows(existing).length > 0) {
      return NextResponse.json({ error: "Already selected weekly quest for this week" }, { status: 400 });
    }

    const templateRow = await sql`
      SELECT id, reward_ryumo, reward_season_xp
      FROM quest_templates
      WHERE type = ${selectedType}
      LIMIT 1
    `;
    const template = toRows<Record<string, unknown>>(templateRow)[0] ?? null;
    if (!template) {
      return NextResponse.json({ error: "Quest template not found" }, { status: 404 });
    }

    const rewardRyumo = Number(template.reward_ryumo ?? 220) || 220;
    const rewardSeasonXp = Number(template.reward_season_xp ?? 500) || 500;
    const rewardAccountXp = getWeeklyQuestRewardAccountXp(selectedType);
    const target = selectionState.targetsByType[selectedType];
    const currentProgress = Math.min(selectionState.progressByType[selectedType], target);
    const beforeLevels = await getMobileLevelSnapshot(username);

    const seasonRow = await sql`
      SELECT season_number FROM seasons WHERE status = 'active' ORDER BY start_at DESC LIMIT 1
    `;
    const seasonNumber =
      Number((toRows<Record<string, unknown>>(seasonRow)[0] ?? {}).season_number ?? 1) || 1;

    await sql`
      INSERT INTO user_quests (username, quest_template_id, status, progress, target, season_number, expires_at)
      VALUES (${username}, ${template.id}, 'active', ${currentProgress}, ${target}, ${seasonNumber}, ${endTimestamp}::timestamptz)
    `;

    const autoCompletedCount = await autoCompleteEligibleWeeklyQuests(username, todayStr);
    const afterLevels = await getMobileLevelSnapshot(username);
    const levelEvent = createMobileLevelEvent(beforeLevels, afterLevels);

    return NextResponse.json({
      ok: true,
      questType: selectedType,
      progress: currentProgress,
      target,
      rewardRyumo,
      rewardSeasonXp,
      rewardAccountXp: rewardAccountXp ?? 0,
      autoCompleted: autoCompletedCount > 0,
      expiresAt: endTimestamp,
      actionResult: await buildMobileActionResultForUser(username, { levelEvent }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/quests/weekly/select] error:", error);
    return NextResponse.json(
      { error: "Failed to select weekly quest", details: message },
      { status: 500 }
    );
  }
}
