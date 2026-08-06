/**
 * Public price history for one product, across every sealed epoch.
 * GET /api/prices/product/[productId]        ([productId] = canonical product id)
 *
 * This is the question the ledger exists to answer: "what has this product cost,
 * where, over time". A single epoch only holds a slice, so the series spans all
 * of them.
 *
 * Query: ?merchant=<name>&country=<XX>&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=N
 *
 * CONVENIENCE, NOT THE TRUST PATH. Every row carries its epoch + leaf hash, so a
 * caller can fetch the inclusion proof (/api/prices/epoch/[n]?proof=<leafHash>)
 * and fold it to the root sealed on Solana. A third party can skip this route
 * entirely: read the epoch memos from the sealer address, pull the manifests from
 * Arweave, verify them against the roots, and query their own copy. This endpoint
 * exists so the app is fast, not so anyone has to trust us.
 */

import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { FLAGS } from "@/config/feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Only epochs whose data is published/verifiable are exposed. */
const PUBLIC_STATUSES = ["verified", "approved", "published"];

type Ctx = { params: Promise<{ productId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  if (!FLAGS.priceLedger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const { productId } = await ctx.params;
  if (!productId || productId.length > 100) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const merchant = url.searchParams.get("merchant");
  const country = url.searchParams.get("country");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 2000, 1), 10000);

  try {
    const rows = (await sql`
      SELECT o.epoch_number, o.leaf_hash, o.canonical_product_id, o.product_name, o.brand,
             o.pack_size, o.category_path, o.country, o.city, o.merchant, o.obs_date,
             o.unit_price, o.currency, o.unit_type, e.memo_tx, e.arweave_tx
      FROM price_epoch_observations o
      JOIN price_epochs e ON e.epoch_number = o.epoch_number
      WHERE o.canonical_product_id = ${productId}
        AND e.status = ANY(${PUBLIC_STATUSES})
        -- A later epoch can retract an observation this one published, naming it by
        -- leaf hash. We tell readers to drop what is withdrawn, and this API is a
        -- reader: serving a value we retracted on chain would make the retraction
        -- theatre. The withdrawing epoch must itself be public, or a draft could
        -- silently hide live data.
        AND NOT EXISTS (
          SELECT 1 FROM price_epoch_withdrawals w
          JOIN price_epochs we ON we.epoch_number = w.epoch_number
          WHERE w.target_leaf = o.leaf_hash
            AND w.target_epoch = o.epoch_number
            AND we.status = ANY(${PUBLIC_STATUSES})
        )
        AND (${merchant}::text IS NULL OR o.merchant = ${merchant})
        AND (${country}::text IS NULL OR o.country = ${country})
        AND (${from}::text IS NULL OR o.obs_date >= ${from})
        AND (${to}::text IS NULL OR o.obs_date <= ${to})
      ORDER BY o.obs_date, o.merchant
      LIMIT ${limit}
    `) as any[];

    if (!rows.length) {
      return NextResponse.json({ productId, observations: [], count: 0 });
    }

    const prices = rows.map((r) => parseFloat(r.unit_price)).filter((n) => Number.isFinite(n));
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted.length
      ? sorted.length % 2
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : null;

    const first = rows[0];
    return NextResponse.json({
      productId,
      product: {
        name: first.product_name,
        brand: first.brand || null,
        packSize: first.pack_size || null,
        category: first.category_path,
      },
      summary: {
        count: rows.length,
        firstDate: rows[0].obs_date,
        lastDate: rows[rows.length - 1].obs_date,
        min: sorted.length ? sorted[0] : null,
        median,
        max: sorted.length ? sorted[sorted.length - 1] : null,
        merchants: [...new Set(rows.map((r) => r.merchant).filter(Boolean))].length,
      },
      observations: rows.map((r) => ({
        date: r.obs_date,
        price: r.unit_price,
        currency: r.currency,
        unit: r.unit_type,
        merchant: r.merchant,
        city: r.city || null,
        country: r.country,
        // verification handles — fold the proof to the root sealed in memoTx
        epoch: r.epoch_number,
        leafHash: r.leaf_hash,
        memoTx: r.memo_tx ?? null,
        arweaveTx: r.arweave_tx ?? null,
      })),
    });
  } catch (e) {
    console.error("[api/prices/product] Error:", e);
    return NextResponse.json({ error: "Failed to load price history" }, { status: 500 });
  }
}
