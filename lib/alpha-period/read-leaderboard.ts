/**
 * Read the frozen Early Alpha leaderboard for rewards UI.
 */

import { sql } from "@/lib/db/client";

type AlphaLeaderboardEntry = {
  rank: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  fairScore: number;
  cpointsTotal: number;
  cpointsReceipt: number;
  cpointsQuest: number;
  discoveryScore: number;
  receiptCount: number;
};

export type AlphaLeaderboardResult = {
  snapshotAt: string | null;
  scorePeriod: string | null;
  entryCount: number;
  entries: AlphaLeaderboardEntry[];
};

export async function readAlphaPeriodLeaderboard(opts?: {
  limit?: number;
}): Promise<AlphaLeaderboardResult> {
  if (!sql) {
    return { snapshotAt: null, scorePeriod: null, entryCount: 0, entries: [] };
  }

  const limit = Math.min(500, Math.max(1, opts?.limit ?? 200));

  const metaRows = (await sql`
    SELECT snapshot_at, score_period, entry_count
    FROM alpha_period_meta
    WHERE id = 1
    LIMIT 1
  `) as Array<{ snapshot_at: string; score_period: string; entry_count: number }>;

  const meta = metaRows[0];
  if (!meta) {
    return { snapshotAt: null, scorePeriod: null, entryCount: 0, entries: [] };
  }

  const rows = (await sql`
    SELECT
      a.rank,
      a.username,
      a.fair_score,
      a.cpoints_total,
      a.cpoints_receipt,
      a.cpoints_quest,
      a.discovery_score,
      a.receipt_count,
      a.country,
      COALESCE(up.display_name, u.display_name, a.username) AS display_name,
      up.avatar_url
    FROM alpha_period_leaderboard a
    LEFT JOIN users u ON u.username = a.username
    LEFT JOIN user_profiles up ON up.username = a.username
    ORDER BY a.rank ASC
    LIMIT ${limit}
  `) as Array<{
    rank: number;
    username: string;
    fair_score: number | string;
    cpoints_total: number | string;
    cpoints_receipt: number | string;
    cpoints_quest: number | string;
    discovery_score: number | string;
    receipt_count: number;
    country: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }>;

  return {
    snapshotAt: meta.snapshot_at,
    scorePeriod: meta.score_period,
    entryCount: Number(meta.entry_count) || rows.length,
    entries: rows.map((row) => ({
      rank: Number(row.rank),
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      country: row.country,
      fairScore: Number(row.fair_score) || 0,
      cpointsTotal: Number(row.cpoints_total) || 0,
      cpointsReceipt: Number(row.cpoints_receipt) || 0,
      cpointsQuest: Number(row.cpoints_quest) || 0,
      discoveryScore: Number(row.discovery_score) || 0,
      receiptCount: Number(row.receipt_count) || 0,
    })),
  };
}

async function readAlphaPeriodEntry(
  username: string,
): Promise<AlphaLeaderboardEntry | null> {
  if (!sql) return null;

  const rows = (await sql`
    SELECT
      a.rank,
      a.username,
      a.fair_score,
      a.cpoints_total,
      a.cpoints_receipt,
      a.cpoints_quest,
      a.discovery_score,
      a.receipt_count,
      a.country,
      COALESCE(up.display_name, u.display_name, a.username) AS display_name,
      up.avatar_url
    FROM alpha_period_leaderboard a
    LEFT JOIN users u ON u.username = a.username
    LEFT JOIN user_profiles up ON up.username = a.username
    WHERE lower(a.username) = lower(${username})
    LIMIT 1
  `) as Array<{
    rank: number;
    username: string;
    fair_score: number | string;
    cpoints_total: number | string;
    cpoints_receipt: number | string;
    cpoints_quest: number | string;
    discovery_score: number | string;
    receipt_count: number;
    country: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    rank: Number(row.rank),
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    country: row.country,
    fairScore: Number(row.fair_score) || 0,
    cpointsTotal: Number(row.cpoints_total) || 0,
    cpointsReceipt: Number(row.cpoints_receipt) || 0,
    cpointsQuest: Number(row.cpoints_quest) || 0,
    discoveryScore: Number(row.discovery_score) || 0,
    receiptCount: Number(row.receipt_count) || 0,
  };
}
