import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";
import type { WeeklyQuestType } from "@/lib/quests/schema";
import { dispatchQuestReward } from "@/lib/quests/reward-dispatcher";
import { getWeeklyQuestRewardAccountXp, getWeekBounds } from "@/lib/quests/weekly-progress";
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
    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    await warmUpConnection();

    const body = await req.json().catch(() => ({}));
    const questId = typeof body.questId === "number" ? body.questId : Number(body.questId);
    if (!Number.isInteger(questId) || questId <= 0) {
      return NextResponse.json({ error: "Invalid questId", ok: false }, { status: 400 });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const { start, end } = getWeekBounds(todayStr);

    const questRow = await sql`
      SELECT uq.id, uq.progress, uq.target, uq.status, uq.season_number,
             qt.type, qt.reward_ryumo, qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.id = ${questId}
        AND uq.username = ${username}
        AND qt.type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6')
        AND uq.expires_at >= ${start}::date
        AND uq.expires_at < (${end}::date + INTERVAL '1 day')
      LIMIT 1
    `;
    const quest = toRows<Record<string, unknown>>(questRow)[0] ?? null;

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found or not this week's quest", ok: false },
        { status: 404 }
      );
    }

    if (quest.status === "completed") {
      return NextResponse.json({
        ok: true,
        alreadyCompleted: true,
        levelUp: null,
        accountLevel: null,
        seasonLevel: null,
        actionResult: await buildMobileActionResultForUser(username),
      });
    }

    const progress = Number(quest.progress ?? 0) || 0;
    const target = Number(quest.target ?? 1) || 1;
    if (progress < target) {
      return NextResponse.json(
        { error: "Conditions not met", ok: false, progress, target },
        { status: 400 }
      );
    }

    const beforeLevels = await getMobileLevelSnapshot(username);
    const questType = String(quest.type ?? "") as WeeklyQuestType;

    const result = await dispatchQuestReward(
      username,
      Number(quest.id ?? 0),
      questType,
      Number(quest.reward_ryumo ?? 0) || 0,
      Number(quest.reward_season_xp ?? 0) || 0,
      Number(quest.season_number ?? 1) || 1,
      getWeeklyQuestRewardAccountXp(questType)
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Reward failed", ok: false },
        { status: 500 }
      );
    }

    if (result.alreadyProcessed) {
      return NextResponse.json({
        ok: true,
        alreadyCompleted: true,
        levelUp: null,
        accountLevel: beforeLevels.accountLevel,
        seasonLevel: beforeLevels.seasonLevel,
        actionResult: await buildMobileActionResultForUser(username),
      });
    }

    const afterLevels = await getMobileLevelSnapshot(username);

    let levelUp: "account" | "season" | "both" | null = null;
    if (afterLevels.accountLevel > beforeLevels.accountLevel && afterLevels.seasonLevel > beforeLevels.seasonLevel) levelUp = "both";
    else if (afterLevels.accountLevel > beforeLevels.accountLevel) levelUp = "account";
    else if (afterLevels.seasonLevel > beforeLevels.seasonLevel) levelUp = "season";
    const levelEvent = createMobileLevelEvent(beforeLevels, afterLevels);

    return NextResponse.json({
      ok: true,
      levelUp,
      accountLevel: afterLevels.accountLevel,
      seasonLevel: afterLevels.seasonLevel,
      actionResult: await buildMobileActionResultForUser(username, { levelEvent }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[api/quests/weekly/complete] error:", error);
    return NextResponse.json(
      { error: "Failed to complete weekly quest", details: msg, ok: false },
      { status: 500 }
    );
  }
}
