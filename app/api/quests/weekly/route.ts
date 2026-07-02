/**
 * Weekly Quest API V2: 4 auto-assigned quests per week (tier-based).
 * The user does not select — the system assigns 4 quests every Monday.
 * The old "selection" flow is preserved for backward compatibility.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";
import { syncWeeklyQuestProgress, getWeekBounds } from "@/lib/quests/weekly-progress";
import { ensureWeeklyQuestsForUser } from "@/lib/quests/weekly-generator";
import { withWeeklyEnsureCache } from "@/lib/quests/ensure-cache";
import { getQuestTitle } from "@/lib/quests/quest-pools";
// Note: weekly-generator imports from quest-segments and quest-pools

function toRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "rows" in value && Array.isArray((value as { rows?: unknown[] }).rows)) {
    return ((value as { rows: unknown[] }).rows ?? []) as T[];
  }
  return [];
}

export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
      return NextResponse.json({ weeklyQuests: [], weekly: null, options: [], weekStart: "", weekEnd: "" });
    }

    await warmUpConnection();

    // Read user locale from cookie for quest title translation
    const cookieStore = await cookies();
    const locale = cookieStore.get("app_locale")?.value ?? "en";

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const { start: weekStart, end: weekEnd } = getWeekBounds(todayStr);

    // Get season
    const seasonRow = await sql`
      SELECT season_number FROM seasons WHERE status = 'active' ORDER BY start_at DESC LIMIT 1
    `;
    const seasonNumber = Number((toRows(seasonRow)[0] as any)?.season_number ?? 1);

    // Ensure 4 weekly quests exist (auto-generate if not).
    // Deduped via in-memory cache (5min TTL) — same dedup as /api/mobile/sync.
    await withWeeklyEnsureCache(username, weekStart, () =>
      ensureWeeklyQuestsForUser(username, todayStr, seasonNumber)
    );

    // Sync progress from receipts
    await syncWeeklyQuestProgress(username, todayStr);

    // Fetch fresh data from DB after sync
    const weeklyRows = await sql`
      SELECT uq.id, uq.progress, uq.target, uq.status, uq.completed_at,
             qt.type, qt.title, qt.reward_bint, qt.reward_season_xp,
             COALESCE(qt.reward_account_xp, 0) as reward_account_xp,
             COALESCE(qt.tier, 'receipt') as tier
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND uq.expires_at >= ${weekStart}::date
        AND uq.expires_at < (${weekEnd}::date + INTERVAL '1 day')
        AND qt.type NOT LIKE 'D%'
      ORDER BY qt.tier, qt.type
    `;

    const items = toRows(weeklyRows).map((r: any) => ({
      id: Number(r.id ?? 0),
      type: String(r.type ?? ""),
      title: getQuestTitle(String(r.type ?? ""), locale, String(r.title ?? "")),
      progress: Number(r.progress ?? 0),
      target: Number(r.target ?? 1),
      status: String(r.status ?? "active"),
      completedAt: r.completed_at ?? null,
      rewardRyumo: Number(r.reward_bint ?? 220),
      rewardSeasonXp: Number(r.reward_season_xp ?? 500),
      rewardAccountXp: Number(r.reward_account_xp ?? 0),
      tier: String(r.tier ?? "receipt"),
    }));

    // Backward compat: also return legacy format for old frontend
    const firstWeekly = items[0] ?? null;

    return NextResponse.json({
      // V2 format: array of 4 weekly quests
      weeklyQuests: items,
      // Legacy format: single weekly quest (for old frontend)
      weekly: firstWeekly,
      options: [], // no selection needed anymore
      weekStart,
      weekEnd,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/quests/weekly] error:", error);
    return NextResponse.json(
      { error: "Failed to load weekly quests", details: message },
      { status: 500 }
    );
  }
}
