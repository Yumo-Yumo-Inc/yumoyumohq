/**
 * POST /api/receipt/line-item/brand
 * User answers the result-screen brand prompt for a single line item whose
 * brand could not be determined (brand_status = 'needs_user').
 *
 * Two outcomes:
 *   - a brand name  → brand set, brand_status = 'user_provided', registry grows
 *   - "unbranded"   → brand cleared, brand_status = 'unbranded'
 *
 * Ownership is enforced in SQL (the line item must belong to a receipt owned by
 * the session user) — no IDOR. We never fabricate a brand; the value is the
 * user's own input.
 */
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
import { foldForComparison, normalizeBrandName } from "@/lib/receipt/name-normalization";
import { brandNameVariants } from "@/lib/receipt/canonical/match-brand-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function brandSlug(name: string): string {
  return foldForComparison(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { lineItemId, brand, unbranded } = body as {
      lineItemId?: number | string;
      brand?: string;
      unbranded?: boolean;
    };

    const id = Number(lineItemId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "lineItemId is required" }, { status: 400 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // "Unbranded" → genuine commodity, no brand.
    if (unbranded) {
      const rows = await sql`
        UPDATE receipt_line_items
        SET brand = NULL, brand_status = 'unbranded'
        WHERE id = ${id}
          AND receipt_id IN (SELECT receipt_id FROM receipts WHERE username = ${username})
        RETURNING id
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Line item not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, brand: null, brandStatus: "unbranded" });
    }

    // A brand name → normalize, persist, grow the registry.
    const cleanBrand = normalizeBrandName(typeof brand === "string" ? brand : null, null);
    if (!cleanBrand) {
      return NextResponse.json({ error: "brand is required" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE receipt_line_items
      SET brand = ${cleanBrand}, brand_status = 'user_provided'
      WHERE id = ${id}
        AND receipt_id IN (SELECT id FROM receipts WHERE username = ${username})
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    const slug = brandSlug(cleanBrand);
    if (slug) {
      try {
        await sql`
          INSERT INTO brand_registry (slug, name, name_variants)
          VALUES (${slug}, ${cleanBrand}, ${brandNameVariants(cleanBrand)})
          ON CONFLICT (slug) DO NOTHING
        `;
      } catch (e) {
        console.error("[api/receipt/line-item/brand] registry upsert failed:", (e as Error)?.message);
      }
    }

    return NextResponse.json({ ok: true, brand: cleanBrand, brandStatus: "user_provided" });
  } catch (error: any) {
    console.error("[api/receipt/line-item/brand] POST error:", error);
    return NextResponse.json({ error: "Failed to save brand" }, { status: 500 });
  }
}
