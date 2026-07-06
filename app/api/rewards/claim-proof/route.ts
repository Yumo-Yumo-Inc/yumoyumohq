/**
 * GET /api/rewards/claim-proof?epoch=N
 *
 * Returns the session user's own merkle leaf + proof for an approved/published
 * epoch, so they can claim at the distributor (claim itself is on-chain/ops).
 * Scoped to the session user (WHERE username = session) — no IDOR.
 *
 * Disabled unless FEATURE_ONCHAIN_REWARDS.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { FLAGS } from "@/config/feature-flags";
import { chainConfig } from "@/config/chain";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!FLAGS.onchainRewards) return NextResponse.json({ ok: false, disabled: true });

  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const epochParam = new URL(req.url).searchParams.get("epoch");
  let epoch: number;
  if (epochParam === "latest") {
    const latest = await sql`
      SELECT max(epoch_number) AS n FROM reward_epochs WHERE status IN ('approved','published')
    `;
    const n = (latest as any[])[0]?.n;
    if (!n) return NextResponse.json({ error: "No claimable epoch yet" }, { status: 404 });
    epoch = Number(n);
  } else {
    epoch = Number(epochParam);
  }
  if (!Number.isInteger(epoch) || epoch <= 0) {
    return NextResponse.json({ error: "Invalid epoch" }, { status: 400 });
  }

  try {
    // Only expose proofs for epochs whose root is committed (approved/published).
    const head = await sql`
      SELECT merkle_root, status, distributor_address, distributor_root
      FROM reward_epochs WHERE epoch_number = ${epoch}
    `;
    const epochRow = (head as any[])[0];
    if (!epochRow || !["approved", "published"].includes(epochRow.status)) {
      return NextResponse.json({ error: "Epoch not claimable yet" }, { status: 404 });
    }

    const rows = await sql`
      SELECT wallet_address, raw_amount, int_amount, leaf_index, proof, claimed,
             jito_proof, jito_leaf_index, claim_tx
      FROM reward_epoch_leaves
      WHERE epoch_number = ${epoch} AND username = ${username}
    `;
    const leaf = (rows as any[])[0];
    if (!leaf) return NextResponse.json({ error: "No allocation for this epoch" }, { status: 404 });

    // The claim transaction needs the Jito distributor tree's proof, which is
    // ingested separately (scripts/ingest-distributor-tree.ts) after the ops
    // side builds and verifies the on-chain tree. Until then the leaf is
    // visible but not claimable.
    const claimReady = Boolean(leaf.jito_proof && epochRow.distributor_address);

    return NextResponse.json({
      ok: true,
      epoch,
      merkleRoot: epochRow.merkle_root,
      walletAddress: leaf.wallet_address,
      intAmount: leaf.int_amount,
      leafIndex: leaf.leaf_index,
      proof: leaf.proof,
      claimed: leaf.claimed,
      claimTx: leaf.claim_tx ?? null,
      claimReady,
      distributorAddress: epochRow.distributor_address ?? null,
      intMint: chainConfig.intMint() || null,
      jitoProof: leaf.jito_proof ?? null,
      jitoLeafIndex: leaf.jito_leaf_index ?? null,
    });
  } catch (e) {
    console.error("[rewards/claim-proof] Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
