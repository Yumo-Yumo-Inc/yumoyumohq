/**
 * GET /api/rewards/season-leaderboard
 *
 * Genesis tab standings:
 *  - Active season → live rank by season_xp (same metric closeSeason snapshots).
 *  - No active season → frozen snapshot from season_leaderboard for the most
 *    recently closed season (written at close). Never falls back to epoch /
 *    lifetime points — that produced wrong ranks after Genesis closed.
 *
 * Users with zero season score are omitted. Admins are filtered from the live
 * board (and re-ranked); the closed snapshot keeps official stored ranks.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql, warmUpConnection } from "@/lib/db/client";
import { isAdminUser } from "@/lib/auth/admin-users";
import { getActiveSeason } from "@/lib/season/lifecycle";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type LiveRow = {
  username: string;
  display_name: string | null;
  country: string | null;
  avatar_url: string | null;
  points: number;
};

type SnapshotRow = LiveRow & { rank: number };

export async function GET(request: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    await warmUpConnection();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)),
    );

    const active = await getActiveSeason();

    if (active) {
      const rows = (await sql`
        SELECT
          up.username,
          COALESCE(up.display_name, u.display_name, up.username) AS display_name,
          COALESCE(up.country, u.country) AS country,
          up.avatar_url,
          COALESCE(up.season_xp, 0)::int AS points
        FROM user_profiles up
        LEFT JOIN users u ON u.username = up.username
        WHERE COALESCE(up.season_xp, 0) > 0
        ORDER BY COALESCE(up.season_xp, 0) DESC, up.username ASC
        LIMIT ${MAX_LIMIT}
      `) as LiveRow[];

      const leaderboard = rows
        .filter((row) => !isAdminUser(row.username))
        .slice(0, limit)
        .map((row, index) => ({
          rank: index + 1,
          username: row.username,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          country: row.country,
          points: Math.round(Number(row.points) || 0),
        }));

      return NextResponse.json({
        viewerUsername: username,
        seasonNumber: Number(active.season_number),
        seasonName: active.name,
        status: "active" as const,
        snapshotAt: null,
        leaderboard,
      });
    }

    // Frozen: most recently closed season's official snapshot.
    const closedRows = (await sql`
      SELECT id, season_number, name, closed_at
      FROM seasons
      WHERE status = 'closed'
      ORDER BY season_number DESC
      LIMIT 1
    `) as Array<{
      id: number;
      season_number: number;
      name: string | null;
      closed_at: string | null;
    }>;
    const closed = closedRows[0];
    if (!closed) {
      return NextResponse.json({
        viewerUsername: username,
        seasonNumber: null,
        seasonName: null,
        status: "none" as const,
        snapshotAt: null,
        leaderboard: [],
      });
    }

    const snap = (await sql`
      SELECT
        sl.rank,
        sl.username,
        COALESCE(up.display_name, u.display_name, sl.username) AS display_name,
        COALESCE(up.country, u.country) AS country,
        up.avatar_url,
        COALESCE(sl.quest_xp, sl.total_score, 0)::int AS points
      FROM season_leaderboard sl
      LEFT JOIN user_profiles up ON up.username = sl.username
      LEFT JOIN users u ON u.username = sl.username
      WHERE sl.season_id = ${closed.id}
        AND COALESCE(sl.quest_xp, sl.total_score, 0) > 0
      ORDER BY sl.rank ASC NULLS LAST, points DESC, sl.username ASC
      LIMIT ${limit}
    `) as SnapshotRow[];

    const leaderboard = snap.map((row) => ({
      rank: Number(row.rank) || 0,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      country: row.country,
      points: Math.round(Number(row.points) || 0),
    }));

    return NextResponse.json({
      viewerUsername: username,
      seasonNumber: Number(closed.season_number),
      seasonName: closed.name,
      status: "closed" as const,
      snapshotAt: closed.closed_at,
      leaderboard,
    });
  } catch (error) {
    console.error("[api/rewards/season-leaderboard] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load season leaderboard" },
      { status: 500 },
    );
  }
}
