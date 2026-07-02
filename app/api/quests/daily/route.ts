import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";
import { ensureDailyQuestsForUser } from "@/lib/quests/daily-generator";
import { withDailyEnsureCache } from "@/lib/quests/ensure-cache";
import { getQuestTitle } from "@/lib/quests/quest-pools";

import { isAdminUser } from "@/lib/auth/admin-users";
const ADMIN_FREE_QUEST_TYPE = "D_ADMIN_FREE_300XP";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: any[] }).rows;
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
      return NextResponse.json({ quests: [], season: null });
    }

    await warmUpConnection();

    // Read user locale from cookie for quest title translation
    const cookieStore = await cookies();
    const locale = cookieStore.get("app_locale")?.value ?? "en";

    // Today = GMT/UTC day. A new day starts after 00:01 GMT; old quests do not carry over.
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const seasonResult = await sql`
      SELECT id, season_number, name, start_at, end_at
      FROM seasons
      WHERE status = 'active'
      ORDER BY start_at DESC
      LIMIT 1
    `;
    const season = toRows(seasonResult)[0] ?? null;
    const seasonNumber = (season as { season_number?: number })?.season_number ?? 1;

    // Dedup: if /api/mobile/sync already ran ensure for this user/day in the
    // last 5 minutes, skip the SQL existence check entirely. Falls through on
    // cache miss (cold function start, day rollover, or post-invalidation).
    const ensureRan = await withDailyEnsureCache(username, todayStr, () =>
      ensureDailyQuestsForUser(username, todayStr, seasonNumber)
    );
    if (ensureRan) {
      console.log(`[api/quests/daily] ensure ran for ${username}, date=${todayStr}, season=${seasonNumber}`);
    }

    const isAdmin = isAdminUser(username);
    if (isAdmin) {
      const templateRow = await sql`
        SELECT id FROM quest_templates WHERE type = ${ADMIN_FREE_QUEST_TYPE} LIMIT 1
      `;
      const templateId = (toRows(templateRow)[0] as { id?: number } | undefined)?.id;
      if (!templateId) {
        console.warn("[api/quests/daily] Admin quest template D_ADMIN_FREE_300XP not found. Run migration 029 in Neon SQL Editor.");
      }
      if (templateId) {
        const existingAdmin = await sql`
          SELECT 1 FROM user_quests uq
          JOIN quest_templates qt ON uq.quest_template_id = qt.id
          WHERE uq.username = ${username} AND qt.type = ${ADMIN_FREE_QUEST_TYPE}
            AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
          LIMIT 1
        `;
        if (toRows(existingAdmin).length === 0) {
          const endOfDay = new Date(todayStr + "T23:59:59.999Z");
          await sql`
            INSERT INTO user_quests (username, quest_template_id, status, progress, target, season_number, expires_at)
            VALUES (${username}, ${templateId}, 'active', 1, 1, ${seasonNumber}, ${endOfDay.toISOString()})
          `;
        }
      }
    }

    // V2: today's quests across all tiers — excludes weekly and admin
    let rowsResult;
    try {
      rowsResult = await sql`
        SELECT uq.id, uq.progress, uq.target, uq.status, uq.completed_at,
               qt.type, qt.title, qt.reward_bint, qt.reward_season_xp,
               COALESCE(qt.tier, 'receipt') as tier
        FROM user_quests uq
        JOIN quest_templates qt ON uq.quest_template_id = qt.id
        WHERE uq.username = ${username}
          AND (qt.frequency = 'daily'
               OR qt.type IN ('D1','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','D14','D15','D16','D17')
               OR qt.type LIKE 'DD%' OR qt.type LIKE 'DS%' OR qt.type LIKE 'DC%')
          AND qt.type NOT LIKE 'W%'
          AND qt.type != 'D_ADMIN_FREE_300XP'
          AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
        ORDER BY qt.type
      `;
    } catch {
      // frequency/tier columns may not exist — fallback
      rowsResult = await sql`
        SELECT uq.id, uq.progress, uq.target, uq.status, uq.completed_at,
               qt.type, qt.title, qt.reward_bint, qt.reward_season_xp,
               'receipt' as tier
        FROM user_quests uq
        JOIN quest_templates qt ON uq.quest_template_id = qt.id
        WHERE uq.username = ${username}
          AND qt.type IN ('D1','D3','D4','D5','D6','D7','D8','D9')
          AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
        ORDER BY qt.type
      `;
    }

    let rows = toRows(rowsResult);
    console.log(`[api/quests/daily] main query returned ${rows.length} rows:`, rows.map((r: any) => `${r.type}(status=${r.status})`));

    if (isAdmin) {
      const adminQuestResult = await sql`
        SELECT uq.id, uq.progress, uq.target, uq.status, uq.completed_at,
               qt.type, qt.title, qt.reward_bint, qt.reward_season_xp
        FROM user_quests uq
        JOIN quest_templates qt ON uq.quest_template_id = qt.id
        WHERE uq.username = ${username} AND qt.type = ${ADMIN_FREE_QUEST_TYPE}
          AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
        ORDER BY uq.id DESC LIMIT 1
      `;
      const adminRows = toRows(adminQuestResult);
      if (adminRows.length > 0) rows = [...rows, ...adminRows];
    }

    // Reconcile block removed: the reward is now only granted when the user presses the
    // "Complete Quest" button (/api/quests/daily/complete endpoint). No automatic completion.

    const mapped = rows.map((r: any) => {
      const progress = Number(r.progress) ?? 0;
      const target = Number(r.target) ?? 1;
      const dbStatus = r.status ?? "active";
      // status always comes from the DB; if progress >= target the button is shown as active, completion is left to the user.
      const status = dbStatus;
      return {
        id: r.id,
        type: r.type,
        title: getQuestTitle(r.type, locale, r.title),
        progress,
        target,
        status,
        tier: r.tier ?? "receipt",
        completedAt: r.completed_at,
        rewardRyumo: Number(r.reward_bint) ?? 12,
        rewardSeasonXp: Number(r.reward_season_xp) ?? 32,
      };
    });

    // There should not be multiple records of the same type for the same day; if there are, show only one per type (completed, or the most recent id)
    const byType = new Map<string, (typeof mapped)[0]>();
    for (const q of mapped) {
      const existing = byType.get(q.type);
      if (
        !existing ||
        (q.status === "completed" && existing.status !== "completed") ||
        (q.status === existing.status && q.id > existing.id)
      ) {
        byType.set(q.type, q);
      }
    }
    const items = Array.from(byType.values()).sort((a, b) => (a.type < b.type ? -1 : 1));

    return NextResponse.json({
      quests: items,
      totalRyumo: items.reduce((s, q) => s + (q.status === "completed" ? 0 : q.rewardRyumo), 0),
      totalSeasonXp: items.reduce((s, q) => s + (q.status === "completed" ? 0 : q.rewardSeasonXp), 0),
      date: todayStr,
      season: season ? { seasonNumber, name: (season as any).name, startAt: (season as any).start_at, endAt: (season as any).end_at } : null,
    });
  } catch (error: any) {
    console.error("[api/quests/daily] error:", error);
    return NextResponse.json(
      { error: "Failed to load daily quests" },
      { status: 500 }
    );
  }
}
