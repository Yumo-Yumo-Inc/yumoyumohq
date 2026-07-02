/**
 * User Segment Engine: dormant / casual / power classification.
 *
 * Segment based on last 14 days of activity:
 *   - dormant: 0-1 receipts/week avg
 *   - casual:  2-5 receipts/week avg
 *   - power:   6+  receipts/week avg
 *
 * Cached in user_segments table, recalculated if stale (>24h).
 */

import { getSql } from "@/lib/db/client";
import type { UserSegment } from "./schema";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: any[] }).rows;
  return [];
}

function classifySegment(weeklyAvgReceipts: number): UserSegment {
  if (weeklyAvgReceipts <= 1) return "dormant";
  if (weeklyAvgReceipts <= 5) return "casual";
  return "power";
}

function calculateDifficulty(segment: UserSegment, weeklyAvg: number): number {
  switch (segment) {
    case "dormant": return 0.5;
    case "casual":  return 1.0;
    case "power":   return Math.min(2.0, 1.0 + (weeklyAvg - 5) * 0.1);
  }
}

export async function getUserSegment(username: string): Promise<UserSegment> {
  const sql = getSql();
  if (!sql) return "casual";

  try {
    // Try cache first (may fail if table doesn't exist yet)
    try {
      const cacheRow = await sql`
        SELECT segment, weekly_avg_receipts, last_calculated_at
        FROM user_segments
        WHERE username = ${username}
      `;
      const cached = toRows(cacheRow)[0] as {
        segment?: string; weekly_avg_receipts?: number; last_calculated_at?: string;
      } | undefined;

      if (cached?.segment && cached.last_calculated_at) {
        const age = Date.now() - new Date(cached.last_calculated_at).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          return cached.segment as UserSegment;
        }
      }
    } catch {
      // user_segments table may not exist yet — continue to calculate
    }

    // Calculate from receipts (last 14 days) — this table always exists
    const statsRow = await sql`
      SELECT COUNT(*)::int AS total_receipts
      FROM receipts
      WHERE username = ${username}
        AND created_at >= (NOW() - INTERVAL '14 days')
    `;
    const totalReceipts = Number(toRows(statsRow)[0]?.total_receipts ?? 0);
    const weeklyAvg = totalReceipts / 2;

    const segment = classifySegment(weeklyAvg);

    // Try to cache (may fail if table doesn't exist)
    try {
      const difficulty = calculateDifficulty(segment, weeklyAvg);
      const completionRow = await sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
          COUNT(*)::int AS total
        FROM user_quests
        WHERE username = ${username}
          AND created_at >= (NOW() - INTERVAL '14 days')
      `;
      const cRow = toRows(completionRow)[0] as { completed?: number; total?: number } | undefined;
      const completionRate = (cRow?.total ?? 0) > 0
        ? (Number(cRow?.completed ?? 0) / Number(cRow?.total ?? 1))
        : 0;

      await sql`
        INSERT INTO user_segments (username, segment, weekly_avg_receipts, difficulty_factor, total_quests_completed, quest_completion_rate, last_calculated_at)
        VALUES (${username}, ${segment}, ${weeklyAvg}, ${difficulty}, ${Number(cRow?.completed ?? 0)}, ${completionRate}, NOW())
        ON CONFLICT (username) DO UPDATE SET
          segment = EXCLUDED.segment,
          weekly_avg_receipts = EXCLUDED.weekly_avg_receipts,
          difficulty_factor = EXCLUDED.difficulty_factor,
          total_quests_completed = EXCLUDED.total_quests_completed,
          quest_completion_rate = EXCLUDED.quest_completion_rate,
          last_calculated_at = NOW()
      `;
    } catch {
      // Cache write failed (table may not exist) — that's OK
    }

    return segment;
  } catch (err) {
    console.warn("[quest-segments] getUserSegment failed:", err);
    return "casual";
  }
}

export async function getDifficultyFactor(username: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 1.0;

  try {
    const row = await sql`
      SELECT difficulty_factor FROM user_segments WHERE username = ${username}
    `;
    return Number(toRows(row)[0]?.difficulty_factor ?? 1.0);
  } catch {
    return 1.0;
  }
}
