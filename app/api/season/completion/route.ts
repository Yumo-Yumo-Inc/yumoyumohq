/**
 * GET /api/season/completion — closed-season result for the caller's first visit.
 *
 * Returns the most recent closed season where the caller appears on the
 * season_leaderboard snapshot (written at close). Used by the one-shot
 * "Season complete" celebration modal. Returns { pending: null } when there is
 * nothing to show (no closed season, or the caller did not participate).
 * Rank/XP come only from the snapshot — never fabricated.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { getSeasonConfig } from "@/config/seasons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const rows = (await sql`
    SELECT
      s.season_number,
      s.name,
      s.closed_at,
      s.start_at,
      s.end_at,
      sl.rank,
      COALESCE(sl.quest_xp, sl.total_score, 0)::int AS season_xp,
      sta.tier_key,
      sta.tier_index,
      COALESCE(sta.cpoints_amount, 0)::double precision AS cpoints_amount
    FROM seasons s
    JOIN season_leaderboard sl
      ON sl.season_id = s.id AND sl.username = ${username}
    LEFT JOIN season_tier_awards sta
      ON sta.season_number = s.season_number AND sta.username = ${username}
    WHERE s.status = 'closed'
      AND sl.rank IS NOT NULL
    ORDER BY s.season_number DESC
    LIMIT 1
  `) as Array<{
    season_number: number;
    name: string | null;
    closed_at: string | null;
    start_at: string;
    end_at: string;
    rank: number;
    season_xp: number;
    tier_key: string | null;
    tier_index: number | null;
    cpoints_amount: number;
  }>;

  const row = rows[0];
  if (!row) return NextResponse.json({ pending: null });

  const seasonNumber = Number(row.season_number);
  const config = getSeasonConfig(seasonNumber);
  const rank = Number(row.rank);
  if (!Number.isFinite(rank) || rank < 1) {
    return NextResponse.json({ pending: null });
  }

  return NextResponse.json({
    pending: {
      seasonNumber,
      name: row.name || config?.name || `Season ${seasonNumber}`,
      key: config?.key ?? null,
      closedAt: row.closed_at,
      startAt: row.start_at,
      endAt: row.end_at,
      rank,
      seasonXp: Number(row.season_xp) || 0,
      tier:
        row.tier_key && row.tier_index != null
          ? {
              key: row.tier_key,
              index: Number(row.tier_index),
              pointsReward: Math.round(Number(row.cpoints_amount) || 0),
            }
          : null,
    },
  });
}
