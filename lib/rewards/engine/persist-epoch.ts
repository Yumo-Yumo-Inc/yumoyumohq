/**
 * Build one reward epoch and persist it (header upsert + leaf replace).
 * Shared by the weekly cron and the admin rebuild action.
 *
 * The header upsert only applies while the epoch is still
 * pending_verification / verify_failed, so an approved or published epoch can
 * never be overwritten. The upsert also refreshes window_start/window_end:
 * a rebuild extends the window to "now", and the verifier recomputes against
 * the stored window, so stale window columns would fail verification.
 *
 * When the window has no eligible claims, nothing is written and the caller
 * decides how to report it (cron: skip; rebuild: 409).
 */

import { sql } from "@/lib/db/client";
import { buildEpoch, type EpochResult } from "./build-epoch";

export async function buildAndPersistEpoch(
  epochNumber: number,
  windowStart: string,
  windowEnd: string
): Promise<EpochResult> {
  if (!sql) throw new Error("Database not available");

  const epoch = await buildEpoch(epochNumber, windowStart, windowEnd);
  if (epoch.participantCount === 0) return epoch;

  const upserted = await sql`
    INSERT INTO reward_epochs (
      epoch_number, window_start, window_end, merkle_root, total_int,
      soft_cap_scale, participant_count, ledger_hash, status
    ) VALUES (
      ${epoch.epochNumber}, ${epoch.windowStart}, ${epoch.windowEnd}, ${epoch.merkleRoot},
      ${epoch.totalInt}, ${epoch.softCapScale}, ${epoch.participantCount},
      ${epoch.ledgerHash}, 'pending_verification'
    )
    ON CONFLICT (epoch_number) DO UPDATE SET
      window_start = EXCLUDED.window_start,
      window_end = EXCLUDED.window_end,
      merkle_root = EXCLUDED.merkle_root,
      total_int = EXCLUDED.total_int,
      soft_cap_scale = EXCLUDED.soft_cap_scale,
      participant_count = EXCLUDED.participant_count,
      ledger_hash = EXCLUDED.ledger_hash,
      status = 'pending_verification',
      verify_notes = NULL,
      updated_at = now()
    WHERE reward_epochs.status IN ('pending_verification', 'verify_failed')
    RETURNING epoch_number
  `;
  if (!(upserted as unknown[]).length) {
    throw new Error(`Epoch ${epoch.epochNumber} is no longer rebuildable (already verified/approved)`);
  }

  await sql`DELETE FROM reward_epoch_leaves WHERE epoch_number = ${epoch.epochNumber}`;

  const usernames = epoch.leaves.map((l) => l.username);
  const wallets = epoch.leaves.map((l) => l.walletAddress);
  const rawAmounts = epoch.leaves.map((l) => l.rawAmount);
  const intAmounts = epoch.leaves.map((l) => l.intAmount);
  const leafIndexes = epoch.leaves.map((l) => l.leafIndex);
  const proofs = epoch.leaves.map((l) => JSON.stringify(l.proof));

  await sql`
    INSERT INTO reward_epoch_leaves (
      epoch_number, username, wallet_address, raw_amount, int_amount, leaf_index, proof
    )
    SELECT ${epoch.epochNumber}, u, w, ra, ia, li, pr::jsonb
    FROM UNNEST(
      ${usernames}::text[],
      ${wallets}::text[],
      ${rawAmounts}::numeric[],
      ${intAmounts}::numeric[],
      ${leafIndexes}::int[],
      ${proofs}::text[]
    ) AS t(u, w, ra, ia, li, pr)
  `;

  return epoch;
}
