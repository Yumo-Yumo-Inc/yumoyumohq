/**
 * Basket comparison API
 * POST /api/basket/compare
 * Body: { lat, lng, items: [{ canonicalName, quantity }] }
 *
 * NOTE: Since store_lat / store_lng are not currently populated, this returns
 * the cheapest branches based on total basket price only, instead of distance.
 * Once the location fields are populated, results can also be sorted by distance.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface BasketItemInput {
  canonicalName: string;
  quantity: number;
}

interface BasketCompareRequest {
  lat: number;
  lng: number;
  radiusKm?: number;
  items: BasketItemInput[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BasketCompareRequest;
    const items = body.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Basket items required" }, { status: 400 });
    }

    const names: string[] = [];
    const qtys: number[] = [];
    for (const it of items) {
      const name = it.canonicalName?.trim();
      const q = Number(it.quantity) || 1;
      if (!name) continue;
      names.push(name.toLowerCase());
      qtys.push(q);
    }
    if (names.length === 0) {
      return NextResponse.json({ error: "No valid items" }, { status: 400 });
    }

    const storeLimit = 20;

    const sql = `
      WITH basket AS (
        SELECT
          unnest($1::text[])  AS canonical_name,
          unnest($2::numeric[]) AS qty
      ),
      latest AS (
        SELECT
          store_id,
          merchant_canonical_name,
          canonical_name,
          price_tl,
          store_name
        FROM v_scraped_store_latest
        WHERE LOWER(canonical_name) = ANY($1)
      )
      SELECT
        l.store_id,
        l.merchant_canonical_name,
        MIN(l.store_name)                    AS store_name,
        SUM(l.price_tl * b.qty)              AS basket_total,
        COUNT(DISTINCT b.canonical_name)     AS matched_items
      FROM latest l
      JOIN basket b ON LOWER(l.canonical_name) = b.canonical_name
      GROUP BY l.store_id, l.merchant_canonical_name
      HAVING COUNT(DISTINCT b.canonical_name) = $3
      ORDER BY basket_total ASC
      LIMIT $4;
    `;

    const result = await db.query<{
      store_id: string | null;
      merchant_canonical_name: string;
      store_name: string | null;
      basket_total: string;
      matched_items: number;
    }>(sql, [names, qtys, names.length, storeLimit]);

    const offers = result.rows.map((r) => ({
      storeId: r.store_id,
      merchantCanonicalName: r.merchant_canonical_name,
      storeName: r.store_name,
      basketTotalTl: Number(r.basket_total),
      matchedItems: r.matched_items,
      distanceKm: null as number | null,
    }));

    return NextResponse.json({ offers });
  } catch (e) {
    console.error("[api/basket/compare] POST error:", e);
    return NextResponse.json({ error: "Failed to compare basket" }, { status: 500 });
  }
}
