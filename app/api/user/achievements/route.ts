/**
 * GET /api/user/achievements — the caller's achievement progress.
 *
 * For each track: current metric value, the highest tier reached, the next tier
 * (for a progress bar), and every tier with earned/locked + earned_at. Read-only;
 * grants happen in the pipeline (lib/achievements/evaluate). The UI showcase
 * (Faz 0b /app/account) consumes this. Amounts/thresholds: config/achievements.ts.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import {
  ACHIEVEMENT_TRACKS,
  tierDescription,
  currentTier,
  nextTier,
} from "@/config/achievements";
import { computeAchievementMetrics } from "@/lib/achievements/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const metrics = await computeAchievementMetrics(username);

  // Which achievement badges the user already owns (key -> earned_at).
  // Achievement badge keys are all prefixed 'ach_' (config/achievements.ts).
  const ownedRows = (await sql`
    SELECT b.key AS key, ub.earned_at AS earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.username = ${username} AND LEFT(b.key, 4) = 'ach_'
  `) as Array<{ key: string; earned_at: string }>;
  const earnedAt = new Map(ownedRows.map((r) => [r.key, r.earned_at]));

  const tracks = ACHIEVEMENT_TRACKS.map((track) => {
    const value = metrics[track.metric] ?? 0;
    const cur = currentTier(track, value);
    const nxt = nextTier(track, value);
    return {
      key: track.key,
      metric: track.metric,
      name: track.name,
      value,
      currentTier: cur ? { index: cur.index, key: cur.key, name: cur.name, threshold: cur.threshold } : null,
      nextTier: nxt ? { index: nxt.index, key: nxt.key, name: nxt.name, threshold: nxt.threshold } : null,
      tiers: track.tiers.map((tier) => ({
        index: tier.index,
        key: tier.key,
        threshold: tier.threshold,
        name: tier.name,
        description: tierDescription(track, tier),
        earned: earnedAt.has(tier.key),
        earnedAt: earnedAt.get(tier.key) ?? null,
      })),
    };
  });

  return NextResponse.json({ tracks });
}
