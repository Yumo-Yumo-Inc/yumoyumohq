import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";
import {
  aggregateDashboardProducts,
  type DashboardProductSource,
} from "@/lib/dashboard/product-intelligence";

type ProductRow = {
  raw_name: string | null;
  canonical_name: string | null;
  brand: string | null;
  category_lvl1: string | null;
  category_lvl2: string | null;
  merchant_category: string | null;
  purchased_at: string | null;
  updated_at: string | null;
};

export async function GET(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ items: [] });
    }

    const { searchParams } = new URL(req.url);
    const limitRaw = Number.parseInt(searchParams.get("limit") || "240", 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(20, Math.min(400, limitRaw)) : 240;

    await warmUpConnection();

    const rows = await sql`
      SELECT
        rli.raw_name,
        rli.canonical_name,
        rli.brand,
        rli.category_lvl1,
        rli.category_lvl2,
        r.merchant_category,
        r.created_at::text AS purchased_at,
        r.updated_at::text AS updated_at
      FROM receipt_line_items rli
      INNER JOIN receipts r ON r.receipt_id = rli.receipt_id
      WHERE r.username = ${username}
      ORDER BY r.created_at DESC NULLS LAST, rli.id DESC
      LIMIT ${limit}
    `;

    const list = (Array.isArray(rows) ? rows : []) as ProductRow[];
    const normalizedItems = aggregateDashboardProducts(
      list.map<DashboardProductSource>((row) => ({
        rawName: row.raw_name,
        canonicalName: row.canonical_name,
        brand: row.brand,
        categoryLvl1: row.category_lvl1,
        categoryLvl2: row.category_lvl2,
        merchantCategory: row.merchant_category,
        purchasedAt: row.purchased_at,
        updatedAt: row.updated_at,
      }))
    );

    return NextResponse.json({
      items: normalizedItems,
    });
  } catch (error) {
    console.error("[api/dashboard/products] GET failed:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
