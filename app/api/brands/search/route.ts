/**
 * GET /api/brands/search?q=fa
 * Typeahead over brand_registry for the result-screen brand prompt. Returns up
 * to 8 brand display names matching the query as a prefix (folded variants or
 * the display name). Read-only; suggestions only — the user still confirms.
 */
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { foldForComparison } from "@/lib/receipt/name-normalization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ brands: [] });

    const sql = getSql();
    if (!sql) return NextResponse.json({ brands: [] });

    const folded = foldForComparison(q).replace(/[^a-z0-9 ]+/g, "");
    const rows = await sql`
      SELECT name FROM brand_registry
      WHERE name ILIKE ${q + "%"}
         OR EXISTS (
           SELECT 1 FROM unnest(name_variants) v WHERE v LIKE ${folded + "%"}
         )
      ORDER BY length(name), name
      LIMIT 8
    `;
    return NextResponse.json({ brands: rows.map((r: any) => String(r.name)) });
  } catch (error: any) {
    console.error("[api/brands/search] error:", error);
    return NextResponse.json({ brands: [] });
  }
}
