/**
 * Freeze the Early Alpha support leaderboard + raw cPoints totals into
 * alpha_period_leaderboard before the Genesis new-ledger reset.
 */

import { sql } from "@/lib/db/client";
import { buildSupportLeaderboard } from "@/lib/support-score/build-leaderboard";
import type { SupportScorePeriod } from "@/config/support-score";

export type AlphaSnapshotResult = {
  ok: boolean;
  dryRun: boolean;
  entryCount: number;
  snapshotAt: string;
  error?: string;
};

export async function snapshotAlphaPeriodLeaderboard(opts: {
  apply?: boolean;
  limit?: number;
  period?: SupportScorePeriod;
}): Promise<AlphaSnapshotResult> {
  if (!sql) {
    return { ok: false, dryRun: !opts.apply, entryCount: 0, snapshotAt: "", error: "db_unavailable" };
  }

  const limit = Math.min(500, Math.max(1, opts.limit ?? 200));
  const period = opts.period ?? "decayed";
  const snapshotAt = new Date().toISOString();

  const result = await buildSupportLeaderboard({
    period,
    limit,
    excludeAdmin: true,
    honorFilter: true,
  });

  if (result.entries.length === 0) {
    return { ok: false, dryRun: !opts.apply, entryCount: 0, snapshotAt, error: "no_entries" };
  }

  const usernames = result.entries.map((e) => e.username);
  const totalsRows = (await sql`
    SELECT
      username,
      COALESCE(contribution_points, 0)::double precision AS cpoints_total,
      COALESCE(receipt_contribution_points, 0)::double precision AS cpoints_receipt,
      COALESCE(quest_contribution_points, 0)::double precision AS cpoints_quest
    FROM user_contribution_totals
    WHERE username = ANY(${usernames}::text[])
  `) as Array<{
    username: string;
    cpoints_total: number;
    cpoints_receipt: number;
    cpoints_quest: number;
  }>;

  const totalsByUser = new Map(
    totalsRows.map((r) => [
      r.username,
      {
        total: Number(r.cpoints_total) || 0,
        receipt: Number(r.cpoints_receipt) || 0,
        quest: Number(r.cpoints_quest) || 0,
      },
    ]),
  );

  const rows = result.entries.map((entry) => {
    const totals = totalsByUser.get(entry.username) ?? { total: 0, receipt: 0, quest: 0 };
    return {
      username: entry.username,
      rank: entry.rank,
      fair_score: entry.fairScore,
      cpoints_total: totals.total,
      cpoints_receipt: totals.receipt,
      cpoints_quest: totals.quest,
      discovery_score: entry.discoveryScore,
      support_bonus_score: entry.supportBonusScore,
      receipt_count: entry.receiptCount,
      distinct_merchants: entry.distinctMerchants,
      country: entry.country,
      snapshot_at: snapshotAt,
    };
  });

  if (!opts.apply) {
    return { ok: true, dryRun: true, entryCount: rows.length, snapshotAt };
  }

  const usernamesIns = rows.map((r) => r.username);
  const ranks = rows.map((r) => r.rank);
  const fairScores = rows.map((r) => r.fair_score);
  const cpointsTotals = rows.map((r) => r.cpoints_total);
  const cpointsReceipts = rows.map((r) => r.cpoints_receipt);
  const cpointsQuests = rows.map((r) => r.cpoints_quest);
  const discoveryScores = rows.map((r) => r.discovery_score);
  const supportBonusScores = rows.map((r) => r.support_bonus_score);
  const receiptCounts = rows.map((r) => r.receipt_count);
  const distinctMerchants = rows.map((r) => r.distinct_merchants);
  const countries = rows.map((r) => r.country);
  const snapshotAts = rows.map((r) => r.snapshot_at);

  await sql`BEGIN`;
  try {
    await sql`DELETE FROM alpha_period_leaderboard`;
    await sql`DELETE FROM alpha_period_meta WHERE id = 1`;

    await sql`
      INSERT INTO alpha_period_leaderboard (
        username, rank, fair_score, cpoints_total, cpoints_receipt, cpoints_quest,
        discovery_score, support_bonus_score, receipt_count, distinct_merchants,
        country, snapshot_at
      )
      SELECT * FROM UNNEST(
        ${usernamesIns}::text[],
        ${ranks}::int[],
        ${fairScores}::numeric[],
        ${cpointsTotals}::numeric[],
        ${cpointsReceipts}::numeric[],
        ${cpointsQuests}::numeric[],
        ${discoveryScores}::numeric[],
        ${supportBonusScores}::numeric[],
        ${receiptCounts}::int[],
        ${distinctMerchants}::int[],
        ${countries}::text[],
        ${snapshotAts}::timestamptz[]
      )
    `;

    await sql`
      INSERT INTO alpha_period_meta (id, snapshot_at, score_period, entry_count)
      VALUES (1, ${snapshotAt}, ${period}, ${rows.length})
    `;

    await sql`COMMIT`;
    return { ok: true, dryRun: false, entryCount: rows.length, snapshotAt };
  } catch (err) {
    await sql`ROLLBACK`;
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, dryRun: false, entryCount: 0, snapshotAt, error: message };
  }
}
