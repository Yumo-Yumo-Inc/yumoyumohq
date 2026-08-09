/**
 * Public price ledger — sealed epoch list.
 * GET /api/prices/epochs
 *
 * Auth-free, behind FEATURE_PRICE_LEDGER. Returns only epochs sealed on Solana
 * (memo_tx IS NOT NULL) with a public status, newest first. Pending / no-op
 * epochs are never listed — nothing here is fabricated.
 *
 * This is the trust-minimised list: it is a convenience index over the same
 * data a third party can rebuild from the sealer address + Arweave directly.
 */

import { NextResponse } from "next/server";
import { FLAGS } from "@/config/feature-flags";
import { listSealedEpochs } from "@/lib/prices/epoch-list";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!FLAGS.priceLedger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!process.env.DATABASE_URL && !process.env.NEW_DB_DATABASE_URL) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const epochs = await listSealedEpochs();
    return NextResponse.json({ epochs });
  } catch (e) {
    console.error("[api/prices/epochs] Error:", e);
    return NextResponse.json({ error: "Failed to load price epochs" }, { status: 500 });
  }
}
