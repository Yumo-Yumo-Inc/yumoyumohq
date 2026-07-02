import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";
import { dispatchQuestReward } from "@/lib/quests/reward-dispatcher";
import {
  buildMobileActionResultForUser,
  createMobileLevelEvent,
  getMobileLevelSnapshot,
} from "@/lib/mobile/server-data";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: any[] }).rows;
  return [];
}


/**
 * POST /api/quests/daily/complete
 * Body: { questId: number }
 * Completes the quest and distributes the reward if conditions are met (progress >= target).
 * Returns levelUp: 'account' | 'season' | 'both' | null (for confetti).
 */
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
      return NextResponse.json(
        { error: "Invalid questId", ok: false },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const questResult = await sql`
      SELECT uq.id, uq.progress, uq.target, uq.status, uq.season_number,
             qt.type, qt.reward_bint, qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.id = ${questId} AND uq.username = ${username}
        AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
    `;
    const questRows = toRows(questResult);
    const quest = questRows[0] as { id: number; progress: number; target: number; status: string; season_number: number; type: string; reward_bint: number; reward_season_xp: number } | undefined;

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found or not today's quest", ok: false },
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

    const progress = Number(quest.progress) ?? 0;
    const target = Number(quest.target) ?? 1;
    if (progress < target) {
      return NextResponse.json(
        { error: "Conditions not met", ok: false, progress, target },
        { status: 400 }
      );
    }

    const beforeLevels = await getMobileLevelSnapshot(username);

    const seasonNumber = Number(quest.season_number) || 1;
    const rewardRyumo = Number(quest.reward_bint) ?? 12;
    const rewardSeasonXp = Number(quest.reward_season_xp) ?? 60;

    const result = await dispatchQuestReward(
      username,
      quest.id,
      quest.type,
      rewardRyumo,
      rewardSeasonXp,
      seasonNumber
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/quests/daily/complete] error:", err);
    return NextResponse.json(
      { error: "Failed to complete quest", details: msg, ok: false },
      { status: 500 }
    );
  }
}
