/**
 * POST /api/rewards/claim-confirm
 * Body: { epoch: number, signature: string }
 *
 * Marks the session user's leaf as claimed AFTER verifying the claim
 * transaction on-chain: the tx must exist, be finalized without error, invoke
 * the Jito distributor program, and be signed by the leaf's wallet. The app
 * never signs claims — the user's wallet does; this route only records it.
 *
 * Disabled unless FEATURE_ONCHAIN_REWARDS.
 */

import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { FLAGS } from "@/config/feature-flags";
import { JITO_DISTRIBUTOR_PROGRAM_ID } from "@/config/chain";
import { getServerConnection } from "@/lib/solana/rpc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!FLAGS.onchainRewards) return NextResponse.json({ ok: false, disabled: true });

  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  let body: { epoch?: unknown; signature?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const epoch = Number(body.epoch);
  const signature = typeof body.signature === "string" ? body.signature.trim() : "";
  if (!Number.isInteger(epoch) || epoch <= 0 || !/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature)) {
    return NextResponse.json({ error: "Invalid epoch or signature" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT wallet_address, claimed FROM reward_epoch_leaves
      WHERE epoch_number = ${epoch} AND username = ${username}
    `;
    const leaf = (rows as any[])[0];
    if (!leaf) return NextResponse.json({ error: "No allocation for this epoch" }, { status: 404 });
    if (leaf.claimed) return NextResponse.json({ ok: true, alreadyClaimed: true });

    const connection = getServerConnection();
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx) return NextResponse.json({ error: "Transaction not found on-chain" }, { status: 400 });
    if (tx.meta?.err) return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });

    const accountKeys = tx.transaction.message.getAccountKeys({
      accountKeysFromLookups: tx.meta?.loadedAddresses,
    });
    const invokesDistributor = tx.transaction.message.compiledInstructions.some(
      (ix) => accountKeys.get(ix.programIdIndex)?.toBase58() === JITO_DISTRIBUTOR_PROGRAM_ID,
    );
    if (!invokesDistributor) {
      return NextResponse.json({ error: "Transaction does not invoke the distributor" }, { status: 400 });
    }

    const leafWallet = new PublicKey(leaf.wallet_address);
    const numSigners = tx.transaction.message.header.numRequiredSignatures;
    let signedByLeafWallet = false;
    for (let i = 0; i < numSigners; i++) {
      if (accountKeys.get(i)?.equals(leafWallet)) signedByLeafWallet = true;
    }
    if (!signedByLeafWallet) {
      return NextResponse.json({ error: "Transaction is not signed by the allocation wallet" }, { status: 400 });
    }

    await sql`
      UPDATE reward_epoch_leaves SET claimed = true, claim_tx = ${signature}
      WHERE epoch_number = ${epoch} AND username = ${username}
    `;
    return NextResponse.json({ ok: true, epoch, signature });
  } catch (e) {
    console.error("[rewards/claim-confirm] Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
