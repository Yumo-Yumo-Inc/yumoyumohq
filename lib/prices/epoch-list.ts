/**
 * Shared read path for the public price ledger.
 *
 * `listSealedEpochs` is the single query behind both the list API
 * (GET /api/prices/epochs) and the public /ledger page. Only epochs that were
 * actually sealed on Solana (memo_tx IS NOT NULL) with a public status are
 * exposed — pending/no-op epochs never leak into the list as "sealed".
 *
 * withdrawal counts are derived from the withdrawals table (source of truth)
 * rather than the mirrored `withdrawn_count` column, so a mismatch between the
 * two can never under-report.
 */

import { sql } from "@/lib/db/client";

/** Lifecycle states whose data is verified/publishable. Mirrors the epoch routes. */
const PUBLIC_STATUSES = ["verified", "approved", "published"];

export type SealedPriceEpoch = {
  epochNumber: number;
  windowStart: string;
  windowEnd: string;
  merkleRoot: string | null;
  observationCount: number;
  receiptCount: number;
  withdrawnCount: number;
  arweaveTx: string | null;
  memoTx: string | null;
  sealed: boolean;
  status: string;
};

export async function listSealedEpochs(): Promise<SealedPriceEpoch[]> {
  if (!sql) return [];

  const rows = (await sql`
    SELECT e.epoch_number, e.window_start, e.window_end, e.merkle_root,
           e.observation_count, e.receipt_count, e.arweave_tx, e.memo_tx, e.status,
           (SELECT count(*)::int FROM price_epoch_withdrawals w
             WHERE w.epoch_number = e.epoch_number) AS withdrawn_count
    FROM price_epochs e
    WHERE e.memo_tx IS NOT NULL
      AND e.status = ANY(${PUBLIC_STATUSES})
    ORDER BY e.epoch_number DESC
  `) as any[];

  return rows.map((r) => ({
    epochNumber: Number(r.epoch_number),
    windowStart: new Date(r.window_start).toISOString(),
    windowEnd: new Date(r.window_end).toISOString(),
    merkleRoot: r.merkle_root ?? null,
    observationCount: Number(r.observation_count),
    receiptCount: Number(r.receipt_count),
    withdrawnCount: Number(r.withdrawn_count ?? 0),
    arweaveTx: r.arweave_tx ?? null,
    memoTx: r.memo_tx ?? null,
    sealed: !!r.memo_tx,
    status: String(r.status),
  }));
}
