/**
 * Build one price epoch and persist it (header upsert + snapshot replace).
 * Shared by the daily cron and the admin rebuild action.
 *
 * The header upsert only applies while the epoch is still
 * pending_verification / verify_failed, so an approved or published epoch can
 * never be overwritten (its root may already be sealed on-chain).
 *
 * The snapshot is what gets published and verified: it must mirror the leaf
 * exactly. What is publishable was already decided in price_ledger_clean —
 * nothing is filtered here.
 */

import { sql } from "@/lib/db/client";
import { buildPriceEpoch, type PriceEpochResult } from "./build-price-epoch";

export async function buildAndPersistPriceEpoch(
  epochNumber: number,
  windowStart: string,
  windowEnd: string
): Promise<PriceEpochResult> {
  if (!sql) throw new Error("Database not available");

  const epoch = await buildPriceEpoch(epochNumber, windowStart, windowEnd);
  if (epoch.observationCount === 0 && epoch.receiptCount === 0) return epoch;

  const upserted = await sql`
    INSERT INTO price_epochs (
      epoch_number, window_start, window_end, merkle_root, manifest_hash,
      catalog_hash, observation_count, receipt_count, withdrawn_count, status
    ) VALUES (
      ${epoch.epochNumber}, ${epoch.windowStart}, ${epoch.windowEnd}, ${epoch.merkleRoot},
      ${epoch.manifestHash}, ${epoch.catalogHash}, ${epoch.observationCount},
      ${epoch.receiptCount}, ${epoch.withdrawnCount}, 'pending_verification'
    )
    ON CONFLICT (epoch_number) DO UPDATE SET
      window_start = EXCLUDED.window_start,
      window_end = EXCLUDED.window_end,
      merkle_root = EXCLUDED.merkle_root,
      manifest_hash = EXCLUDED.manifest_hash,
      catalog_hash = EXCLUDED.catalog_hash,
      observation_count = EXCLUDED.observation_count,
      receipt_count = EXCLUDED.receipt_count,
      withdrawn_count = EXCLUDED.withdrawn_count,
      status = 'pending_verification',
      verify_notes = NULL,
      updated_at = now()
    WHERE price_epochs.status IN ('pending_verification', 'verify_failed')
    RETURNING epoch_number
  `;
  if (!(upserted as unknown[]).length) {
    throw new Error(`Price epoch ${epoch.epochNumber} is no longer rebuildable (already verified/approved)`);
  }

  await sql`DELETE FROM price_epoch_observations WHERE epoch_number = ${epoch.epochNumber}`;
  await sql`DELETE FROM price_epoch_receipt_leaves WHERE epoch_number = ${epoch.epochNumber}`;
  await sql`DELETE FROM price_epoch_withdrawals WHERE epoch_number = ${epoch.epochNumber}`;

  if (epoch.observations.length) {
    const o = epoch.observations;
    await sql`
      INSERT INTO price_epoch_observations (
        epoch_number, source_line_id, leaf_index, leaf_hash, canonical_product_id, product_name,
        brand, pack_size, category_path, country, city, merchant, obs_date, unit_price,
        currency, unit_type
      )
      SELECT ${epoch.epochNumber}, sid, li, lh, cpid, pn, br, ps, cat, ctry, cty, mer, od, up, cur, ut
      FROM UNNEST(
        ${o.map((x) => x.sourceLineId)}::bigint[],
        ${o.map((x) => x.leafIndex)}::int[],
        ${o.map((x) => x.leafHash)}::text[],
        ${o.map((x) => x.canonicalProductId)}::text[],
        ${o.map((x) => x.productName)}::text[],
        ${o.map((x) => x.brand)}::text[],
        ${o.map((x) => x.packSize)}::text[],
        ${o.map((x) => x.categoryPath)}::text[],
        ${o.map((x) => x.country)}::text[],
        ${o.map((x) => x.city)}::text[],
        ${o.map((x) => x.merchant)}::text[],
        ${o.map((x) => x.obsDate)}::text[],
        ${o.map((x) => x.unitPrice)}::text[],
        ${o.map((x) => x.currency)}::text[],
        ${o.map((x) => x.unitType)}::text[]
      ) AS t(sid, li, lh, cpid, pn, br, ps, cat, ctry, cty, mer, od, up, cur, ut)
    `;
  }

  if (epoch.receiptAnchors.length) {
    const a = epoch.receiptAnchors;
    await sql`
      INSERT INTO price_epoch_receipt_leaves (epoch_number, receipt_id, leaf_index, leaf_hash)
      SELECT ${epoch.epochNumber}, rid, li, lh
      FROM UNNEST(
        ${a.map((x) => x.receiptId)}::text[],
        ${a.map((x) => x.leafIndex)}::int[],
        ${a.map((x) => x.leafHash)}::text[]
      ) AS t(rid, li, lh)
    `;
  }

  if (epoch.withdrawals.length) {
    const w = epoch.withdrawals;
    await sql`
      INSERT INTO price_epoch_withdrawals (epoch_number, target_epoch, target_leaf, reason, leaf_hash, leaf_index)
      SELECT ${epoch.epochNumber}, te, tl, rs, lh, li
      FROM UNNEST(
        ${w.map((x) => x.epochNumber)}::int[],
        ${w.map((x) => x.targetLeaf)}::text[],
        ${w.map((x) => x.reason)}::text[],
        ${w.map((x) => x.leafHash)}::text[],
        ${w.map((x) => x.leafIndex)}::int[]
      ) AS t(te, tl, rs, lh, li)
    `;
  }

  return epoch;
}
