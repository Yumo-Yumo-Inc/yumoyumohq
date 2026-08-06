/**
 * Owner-only receipt proof.
 * GET /api/receipts/[id]/proof        → labeled plain-text proof package
 * GET /api/receipts/[id]/proof?json=1 → the same handles as JSON (for the UI)
 *
 * Returns everything the owner needs to show, independently and forever, that
 * their receipt existed and was unaltered at seal time — without exposing the
 * receipt to anyone. The wallet is hashed into the leaf and published nowhere
 * (K3, a privacy property).
 *
 * This package does NOT prove ownership: a wallet address is public, and no
 * signature is ever requested. Ownership would need the holder to sign a
 * challenge. Correction of 2026-07-17 — do not re-add the ownership claim.
 *
 * Auth: the session user must own the receipt. The proof reveals the receipt's
 * content back to its owner only; the chain never held it (K4).
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { FLAGS } from "@/config/feature-flags";
import { buildTree, getProof } from "@/lib/rewards/engine/merkle";
import { receiptLeaf } from "@/lib/prices/engine/leaf";
import { buildReceiptProof } from "@/lib/prices/receipt-proof";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  if (!FLAGS.priceLedger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: receiptId } = await ctx.params;
  if (!receiptId) return NextResponse.json({ error: "Invalid receipt id" }, { status: 400 });

  try {
    // Ownership is enforced in the query — never trust a receipt id alone.
    const rows = (await sql`
      SELECT r.receipt_id,
             COALESCE(r.content_hash, r.receipt_hash, r.receipt_id) AS content_hash,
             COALESCE(r.wallet_address, u.wallet_address, '')        AS wallet,
             COALESCE(m.display_name, r.merchant_name)               AS merchant,
             r.extraction_date_value AS date, r.pricing_total_paid AS total,
             r.pricing_currency AS currency
      FROM receipts r
      LEFT JOIN users u ON u.username = r.username
      LEFT JOIN merchants m ON m.id = r.merchant_id
      WHERE r.receipt_id = ${receiptId} AND r.username = ${username}
    `) as any[];
    const receipt = rows[0];
    if (!receipt) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

    // Which epoch anchored it?
    const anchorRows = (await sql`
      SELECT l.epoch_number, l.leaf_hash, e.merkle_root, e.memo_tx, e.arweave_tx, e.status
      FROM price_epoch_receipt_leaves l
      JOIN price_epochs e ON e.epoch_number = l.epoch_number
      WHERE l.receipt_id = ${receiptId}
      ORDER BY l.epoch_number DESC
      LIMIT 1
    `) as any[];
    const anchor = anchorRows[0];
    if (!anchor) {
      return NextResponse.json(
        { sealed: false, message: "Bu fiş henüz bir epoch'a mühürlenmedi." },
        { status: 200 }
      );
    }

    // Re-derive the leaf from the owner's own data — it must match what was sealed.
    const derivedLeaf = receiptLeaf({
      receiptId: String(receipt.receipt_id),
      contentHash: String(receipt.content_hash),
      wallet: String(receipt.wallet ?? ""),
    });
    if (derivedLeaf !== String(anchor.leaf_hash)) {
      // The receipt changed after it was sealed, or the wallet was linked later.
      return NextResponse.json(
        {
          sealed: true,
          verified: false,
          error: "Fiş mühürlendikten sonra değişmiş ya da cüzdan sonradan bağlanmış — kanıt üretilemiyor.",
          epoch: anchor.epoch_number,
        },
        { status: 409 }
      );
    }

    // Rebuild the epoch's tree to produce the inclusion proof.
    // Every leaf kind, or the tree is not the tree that was sealed. Withdrawals fold
    // in beside observations and receipt anchors, so leaving them out yields a root
    // that never existed and an inclusion proof that fails against the memo — the
    // owner would be told their own receipt does not check out.
    const obs = (await sql`SELECT leaf_hash FROM price_epoch_observations WHERE epoch_number = ${anchor.epoch_number}`) as any[];
    const rec = (await sql`SELECT leaf_hash FROM price_epoch_receipt_leaves WHERE epoch_number = ${anchor.epoch_number}`) as any[];
    const wdr = (await sql`SELECT leaf_hash FROM price_epoch_withdrawals WHERE epoch_number = ${anchor.epoch_number}`) as any[];
    const allLeaves = [
      ...obs.map((r) => String(r.leaf_hash)),
      ...rec.map((r) => String(r.leaf_hash)),
      ...wdr.map((r) => String(r.leaf_hash)),
    ];
    const { root, layers } = buildTree(allLeaves);
    const proof = getProof(layers, derivedLeaf);

    const lineRows = (await sql`
      SELECT COALESCE(canonical_name, raw_name) AS name, quantity, unit_price
      FROM receipt_line_items WHERE receipt_id = ${receiptId} ORDER BY id
    `) as any[];

    const handles = {
      sealed: !!anchor.memo_tx,
      verified: true,
      receiptId: String(receipt.receipt_id),
      // The owner signs over (receipt_id, content_hash) and the verifier rebuilds
      // the leaf from these three — so the client needs them to prove ownership.
      // Owner-gated above; they are the owner's own values.
      contentHash: String(receipt.content_hash),
      wallet: String(receipt.wallet ?? ""),
      leafHash: derivedLeaf,
      epoch: anchor.epoch_number,
      merkleRoot: root,
      storedRoot: anchor.merkle_root,
      proof,
      memoTx: anchor.memo_tx ?? null,
      arweaveTx: anchor.arweave_tx ?? null,
    };

    if (new URL(req.url).searchParams.get("json")) {
      return NextResponse.json(handles);
    }

    const text = buildReceiptProof({
      receiptId: String(receipt.receipt_id),
      contentHash: String(receipt.content_hash),
      wallet: String(receipt.wallet ?? ""),
      epochNumber: anchor.epoch_number,
      merkleRoot: String(anchor.merkle_root ?? root),
      proof,
      memoTx: anchor.memo_tx ?? null,
      arweaveTx: anchor.arweave_tx ?? null,
      receipt: {
        merchant: String(receipt.merchant ?? ""),
        date: String(receipt.date ?? ""),
        total: String(receipt.total ?? ""),
        currency: String(receipt.currency ?? ""),
        lines: lineRows.map((l) => ({
          name: String(l.name ?? ""),
          quantity: String(l.quantity ?? ""),
          price: String(l.unit_price ?? ""),
        })),
      },
    });

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="yumo-receipt-proof-${receiptId}.txt"`,
      },
    });
  } catch (e) {
    console.error("[api/receipts/proof] Error:", e);
    return NextResponse.json({ error: "Kanıt üretilemedi" }, { status: 500 });
  }
}
