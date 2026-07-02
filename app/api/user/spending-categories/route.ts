import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";

function toRows(r: unknown): any[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: any[] }).rows;
  return [];
}

/**
 * GET /api/user/spending-categories?months=12
 * Returns a category-based spending summary using denormalized columns
 * (merchant_category + pricing_total_paid). Not dependent on the receipt_data JSON.
 */
export async function GET(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const months = Math.min(Math.max(parseInt(searchParams.get("months") ?? "12", 10) || 12, 1), 36);

    await warmUpConnection();

    const rows = await sql`
      SELECT
        merchant_category,
        SUM(pricing_total_paid::numeric) AS total_paid
      FROM receipts
      WHERE username = ${username}
        AND status NOT IN ('rejected', 'scanned')
        AND created_at >= NOW() - INTERVAL '1 month' * ${months}
        AND merchant_category IS NOT NULL
        AND merchant_category <> ''
      GROUP BY merchant_category
      ORDER BY total_paid DESC
      LIMIT 20
    `;

    const data = toRows(rows).map((r: any) => ({
      category: (r.merchant_category as string).trim(),
      totalPaid: Number(r.total_paid) || 0,
    }));

    return NextResponse.json({ categories: data });
  } catch (err: unknown) {
    console.error("[api/user/spending-categories] error:", err);
    return NextResponse.json({ error: "Failed to load spending categories" }, { status: 500 });
  }
}
