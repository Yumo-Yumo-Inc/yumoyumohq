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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!FLAGS.onchainRewards) return NextResponse.json({ ok: false, disabled: true });

  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const epoch = Number(new URL(req.url).searchParams.get("epoch"));
  if (!Number.isInteger(epoch) || epoch <= 0) {
    return NextResponse.json({ error: "Invalid epoch" }, { status: 400 });
  }

  try {
    // Only expose proofs for epochs whose root is committed (approved/published).
    const head = await sql`
      SELECT merkle_root, status FROM reward_epochs WHERE epoch_number = ${epoch}
    `;
    const epochRow = (head as any[])[0];
    if (!epochRow || !["approved", "published"].includes(epochRow.status)) {
      return NextResponse.json({ error: "Epoch not claimable yet" }, { status: 404 });
    }

    const rows = await sql`
      SELECT wallet_address, raw_amount, int_amount, leaf_index, proof, claimed
      FROM reward_epoch_leaves
      WHERE epoch_number = ${epoch} AND username = ${username}
    `;
    const leaf = (rows as any[])[0];
    if (!leaf) return NextResponse.json({ error: "No allocation for this epoch" }, { status: 404 });

    return NextResponse.json({
      ok: true,
      epoch,
      merkleRoot: epochRow.merkle_root,
      walletAddress: leaf.wallet_address,
      intAmount: leaf.int_amount,
      leafIndex: leaf.leaf_index,
      proof: leaf.proof,
      claimed: leaf.claimed,
    });
  } catch (e) {
    console.error("[rewards/claim-proof] Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
