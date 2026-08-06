/**
 * GET /api/season/recap — the caller's season-so-far numbers for the recap card.
 *
 * Read-only, defensive. Aggregates the active season's window (start_at..end_at)
 * for the viewer: verified receipts, hidden cost uncovered, total spend, plus
 * their season points and rank (same points formula as the season leaderboard).
 * Returns { active: null } when no season is running. No fabrication — zero when
 * there is no data.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { getActiveSeason } from "@/lib/season/lifecycle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const season = await getActiveSeason();
  if (!season) return NextResponse.json({ active: null });

  const startAt = season.start_at;
  const endAt = season.end_at;

  // Viewer's receipt-based totals in the season window.
  const metricRows = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE r.status IN ('analyzed', 'verified'))::int AS receipts,
      COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status IN ('analyzed', 'verified')), 0)::double precision AS hidden,
      COALESCE(SUM(r.pricing_total_paid) FILTER (WHERE r.status IN ('analyzed', 'verified')), 0)::double precision AS spend
    FROM receipts r
    WHERE r.username = ${username}
      AND r.created_at >= ${startAt}
      AND r.created_at < ${endAt}
  `) as Array<{ receipts: number; hidden: number; spend: number }>;
  const m = metricRows[0] ?? { receipts: 0, hidden: 0, spend: 0 };

  // Season points + rank (same formula as the season leaderboard).
  const rankRows = (await sql`
    WITH receipt_pts AS (
      SELECT r.username, COALESCE(SUM(rr.bint_bonus_amount), 0)::double precision AS pts
      FROM receipt_rewards rr
      JOIN receipts r ON r.receipt_id = rr.receipt_id
      WHERE r.status IN ('analyzed', 'verified')
        AND NOT COALESCE(rr.is_backfill, false)
        AND r.username IS NOT NULL
        AND r.created_at >= ${startAt}
      GROUP BY r.username
    ),
    quest_pts AS (
      SELECT username, COALESCE(bint_balance, 0)::double precision AS pts
      FROM user_profiles WHERE COALESCE(bint_balance, 0) > 0
    ),
    user_base AS (
      SELECT username FROM receipt_pts UNION SELECT username FROM quest_pts
    ),
    combined AS (
      SELECT ub.username, COALESCE(rp.pts, 0) + COALESCE(qp.pts, 0) AS points
      FROM user_base ub
      LEFT JOIN receipt_pts rp ON rp.username = ub.username
      LEFT JOIN quest_pts qp ON qp.username = ub.username
    ),
    ranked AS (
      SELECT username, points, RANK() OVER (ORDER BY points DESC) AS rank
      FROM combined WHERE points > 0
    )
    SELECT points, rank FROM ranked WHERE username = ${username}
  `) as Array<{ points: number; rank: number }>;
  const r = rankRows[0] ?? { points: 0, rank: 0 };

  // Per-category breakdown for the season window (Season X-Ray capability).
  const catRows = (await sql`
    SELECT
      COALESCE(NULLIF(r.merchant_category, ''), 'other') AS category,
      COUNT(*)::int AS receipts,
      COALESCE(SUM(r.hidden_cost_core), 0)::double precision AS hidden,
      COALESCE(SUM(r.pricing_total_paid), 0)::double precision AS spend
    FROM receipts r
    WHERE r.username = ${username}
      AND r.created_at >= ${startAt} AND r.created_at < ${endAt}
      AND r.status IN ('analyzed', 'verified')
    GROUP BY 1
    ORDER BY spend DESC
    LIMIT 8
  `) as Array<{ category: string; receipts: number; hidden: number; spend: number }>;

  return NextResponse.json({
    active: {
      seasonNumber: Number(season.season_number),
      name: season.name,
      startAt,
      endAt,
    },
    stats: {
      receipts: Number(m.receipts) || 0,
      hiddenCost: Math.round(Number(m.hidden) || 0),
      spend: Math.round(Number(m.spend) || 0),
      points: Math.round(Number(r.points) || 0),
      rank: Number(r.rank) || null,
    },
    categories: catRows.map((c) => ({
      category: c.category,
      receipts: Number(c.receipts) || 0,
      hidden: Math.round(Number(c.hidden) || 0),
      spend: Math.round(Number(c.spend) || 0),
    })),
  });
}
