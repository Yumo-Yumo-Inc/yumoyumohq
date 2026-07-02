/**
 * Badges + title selection for the signed-in user.
 *
 * GET   /api/user/badges  — earned badges, full catalog, earned/active titles
 * PATCH /api/user/badges  — { activeTitle: string | null } select the display title
 *
 * Earned titles are DERIVED (not a separate table): from the user's highest
 * Genesis tier award + participation. The user picks ONE to display
 * (user_profiles.active_title). PATCH validates the choice is actually earned.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { GENESIS_SEASON, getEarnedTitleKeys } from "@/config/seasons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Highest Genesis tier reached + whether the user participated in Genesis. */
async function getGenesisStanding(
  username: string,
): Promise<{ tierIndex: number | null; participated: boolean }> {
  if (!sql) return { tierIndex: null, participated: false };

  const awardRows = (await sql`
    SELECT tier_index FROM season_tier_awards
    WHERE season_number = ${GENESIS_SEASON.seasonNumber} AND username = ${username}
    LIMIT 1
  `) as Array<{ tier_index: number }>;
  const awardedTier = awardRows[0]?.tier_index ?? null;

  // Live participation: Genesis active and the user has season XP (award not written until close).
  const liveRows = (await sql`
    SELECT COALESCE(up.season_xp, 0)::int AS season_xp
    FROM user_profiles up
    JOIN seasons s ON s.season_number = ${GENESIS_SEASON.seasonNumber} AND s.status = 'active'
    WHERE up.username = ${username}
    LIMIT 1
  `) as Array<{ season_xp: number }>;
  const liveXp = Number(liveRows[0]?.season_xp ?? 0);

  return {
    tierIndex: awardedTier != null ? Number(awardedTier) : null,
    participated: awardedTier != null || liveXp > 0,
  };
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const earned = await sql`
    SELECT b.key, b.title, b.description, b.icon_url, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.username = ${username}
    ORDER BY ub.earned_at DESC
  `;
  const catalog = await sql`SELECT key, title, description, icon_url FROM badges ORDER BY id ASC`;

  const profileRows = (await sql`
    SELECT active_title FROM user_profiles WHERE username = ${username} LIMIT 1
  `) as Array<{ active_title: string | null }>;
  const activeTitle = profileRows[0]?.active_title ?? null;

  const standing = await getGenesisStanding(username);
  const earnedTitles = getEarnedTitleKeys(GENESIS_SEASON, standing.tierIndex, standing.participated);

  return NextResponse.json({
    earnedBadges: earned,
    catalog,
    titles: { earned: earnedTitles, active: activeTitle },
  });
}

export async function PATCH(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  let body: { activeTitle?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const next = body.activeTitle;
  if (next !== null && typeof next !== "string") {
    return NextResponse.json({ error: "activeTitle must be a string or null" }, { status: 400 });
  }

  if (next !== null) {
    const standing = await getGenesisStanding(username);
    const earnedTitles = getEarnedTitleKeys(GENESIS_SEASON, standing.tierIndex, standing.participated);
    if (!earnedTitles.includes(next)) {
      return NextResponse.json({ error: "title not earned" }, { status: 403 });
    }
  }

  await sql`UPDATE user_profiles SET active_title = ${next}, updated_at = now() WHERE username = ${username}`;
  return NextResponse.json({ ok: true, activeTitle: next });
}
