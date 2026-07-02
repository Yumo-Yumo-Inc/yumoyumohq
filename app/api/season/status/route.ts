/**
 * GET /api/season/status — active season + the caller's tier progress.
 *
 * Read-only. Returns the active season (name, days left), the caller's current
 * tier, and the next tier threshold for a "next reward" progress bar. Returns
 * { active: null } when no season is running. Amounts are DRAFT (config/seasons.ts).
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { getActiveSeason } from "@/lib/season/lifecycle";
import { getSeasonConfig, getTierForXp, getNextTier } from "@/config/seasons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const season = await getActiveSeason();
  if (!season) return NextResponse.json({ active: null });

  const config = getSeasonConfig(Number(season.season_number));

  const rows = await sql`
    SELECT COALESCE(season_xp, 0)::int AS season_xp, COALESCE(season_level, 1)::int AS season_level
    FROM user_profiles WHERE username = ${username} LIMIT 1
  `;
  const seasonXp = Number((rows as Array<{ season_xp: number }>)[0]?.season_xp ?? 0);
  const seasonLevel = Number((rows as Array<{ season_level: number }>)[0]?.season_level ?? 1);

  const endMs = new Date(season.end_at).getTime();
  const daysLeft = Math.max(0, Math.ceil((endMs - Date.now()) / (24 * 60 * 60 * 1000)));

  const currentTier = config ? getTierForXp(config, seasonXp) : null;
  const nextTier = config ? getNextTier(config, seasonXp) : null;

  return NextResponse.json({
    active: {
      seasonNumber: Number(season.season_number),
      name: season.name,
      key: config?.key ?? null,
      startAt: season.start_at,
      endAt: season.end_at,
      daysLeft,
    },
    progress: {
      seasonXp,
      seasonLevel,
      currentTier: currentTier
        ? { index: currentTier.index, key: currentTier.key, cpointsReward: currentTier.cpointsReward }
        : null,
      nextTier: nextTier
        ? { index: nextTier.index, key: nextTier.key, minSeasonXp: nextTier.minSeasonXp, cpointsReward: nextTier.cpointsReward }
        : null,
    },
    serverNow: new Date().toISOString(),
  });
}
