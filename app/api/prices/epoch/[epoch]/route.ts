/**
 * Public price ledger read + inclusion proof. [epoch] = epoch_number.
 * GET /api/prices/epoch/[epoch]
 *   → header: window, merkle_root, manifest_hash, arweave_tx, memo_tx, counts, status
 *
 * Query:
 *   ?observations=1[&product=<canonical_id>][&limit=N]
 *       → the public, identity-free observations for the epoch (optionally one product)
 *   ?proof=<leaf_hash>
 *       → Merkle inclusion proof for that leaf, foldable to merkle_root
 *
 * Only verified/approved/published epochs are exposed. Ships dark behind
 * FEATURE_PRICE_LEDGER until launch. This endpoint is the trust-minimised read
 * path: the same data lives on Arweave and the root is sealed on Solana, so a
 * third party can bypass this route entirely and rebuild everything from chain.
 */

import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { FLAGS } from "@/config/feature-flags";
import { buildTree, getProof } from "@/lib/rewards/engine/merkle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_STATUSES = ["verified", "approved", "published"];

type Ctx = { params: Promise<{ epoch: string }> };

export async function GET(req: Request, ctx: Ctx) {
  if (!FLAGS.priceLedger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const { epoch } = await ctx.params;
  const epochNumber = Number(epoch);
  if (!Number.isInteger(epochNumber) || epochNumber <= 0) {
    return NextResponse.json({ error: "Invalid epoch id" }, { status: 400 });
  }

  const headerRows = (await sql`
    SELECT epoch_number, window_start, window_end, merkle_root, manifest_hash,
           catalog_hash, catalog_tx, observation_count, receipt_count, arweave_tx, memo_tx, status
    FROM price_epochs WHERE epoch_number = ${epochNumber}
  `) as any[];
  const header = headerRows[0];
  if (!header || !PUBLIC_STATUSES.includes(header.status)) {
    return NextResponse.json({ error: "Epoch not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const proofLeaf = url.searchParams.get("proof");
  const wantObservations = url.searchParams.get("observations");

  // Inclusion proof: rebuild the full tree from all stored leaf hashes.
  //
  // ALL of them — withdrawals fold into the root alongside observations and receipt
  // anchors, so a tree built from two of the three kinds folds to a root that was
  // never sealed, and every proof it hands out fails verification.
  if (proofLeaf) {
    const obs = (await sql`SELECT leaf_hash FROM price_epoch_observations WHERE epoch_number = ${epochNumber}`) as any[];
    const rec = (await sql`SELECT leaf_hash FROM price_epoch_receipt_leaves WHERE epoch_number = ${epochNumber}`) as any[];
    const wdr = (await sql`SELECT leaf_hash FROM price_epoch_withdrawals WHERE epoch_number = ${epochNumber}`) as any[];
    const allLeaves = [
      ...obs.map((r) => String(r.leaf_hash)),
      ...rec.map((r) => String(r.leaf_hash)),
      ...wdr.map((r) => String(r.leaf_hash)),
    ];
    const { root, layers } = buildTree(allLeaves);
    if (!layers[0].includes(proofLeaf)) {
      return NextResponse.json({ error: "Leaf not in epoch" }, { status: 404 });
    }
    return NextResponse.json({
      epochNumber,
      leafHash: proofLeaf,
      proof: getProof(layers, proofLeaf),
      merkleRoot: root,
      memoTx: header.memo_tx ?? null,
    });
  }

  const base = {
    epochNumber: header.epoch_number,
    windowStart: new Date(header.window_start).toISOString(),
    windowEnd: new Date(header.window_end).toISOString(),
    merkleRoot: header.merkle_root,
    manifestHash: header.manifest_hash,
    catalogHash: header.catalog_hash ?? null,
    catalogTx: header.catalog_tx ?? null,
    observationCount: header.observation_count,
    receiptCount: header.receipt_count,
    arweaveTx: header.arweave_tx ?? null,
    memoTx: header.memo_tx ?? null,
    sealed: !!header.memo_tx,
    status: header.status,
  };

  if (wantObservations) {
    const product = url.searchParams.get("product");
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 1000, 1), 5000);
    const rows = product
      ? ((await sql`
          SELECT leaf_index, leaf_hash, canonical_product_id, product_name, brand, pack_size,
                 category_path, country, city, merchant, obs_date, unit_price, currency, unit_type
          FROM price_epoch_observations
          WHERE epoch_number = ${epochNumber} AND canonical_product_id = ${product}
          ORDER BY leaf_index LIMIT ${limit}
        `) as any[])
      : ((await sql`
          SELECT leaf_index, leaf_hash, canonical_product_id, product_name, brand, pack_size,
                 category_path, country, city, merchant, obs_date, unit_price, currency, unit_type
          FROM price_epoch_observations
          WHERE epoch_number = ${epochNumber}
          ORDER BY leaf_index LIMIT ${limit}
        `) as any[]);
    return NextResponse.json({ ...base, observations: rows });
  }

  return NextResponse.json(base);
}
