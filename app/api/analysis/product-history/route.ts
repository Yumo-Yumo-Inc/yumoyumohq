/**
 * GET /api/analysis/product-history?key=<productKey>
 *
 * Returns the full purchase history for a tracked product identified by its
 * productKey (normalised_name:p{packSize}:unitType). Includes every purchase
 * instance with merchant, date, quantity, unit price and line total, plus
 * summary statistics (min, max, avg, latest unit price).
 *
 * Insufficient data yields an empty history array — no fabricated values.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import type { ProductHistoryResponse, ProductHistoryItem, ProductHistoryStats } from "@/lib/analysis/types";

function normaliseText(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "");
}

interface RawRow {
  receipt_id: string;
  dt: string;
  merchant: string | null;
  raw_name: string | null;
  canonical_name: string | null;
  display_name_tr: string | null;
  brand: string | null;
  pack_size: number | null;
  unit_type: string | null;
  quantity: number;
  unit_price_gross: number | null;
  line_total_gross: number | null;
}

function parseProductKey(key: string): { normalisedName: string; packSize: number | null; unitType: string | null } | null {
  const parts = key.split(":");
  if (parts.length < 1 || parts.length > 3) return null;
  const normalisedName = parts[0];
  if (!normalisedName) return null;

  let packSize: number | null = null;
  let unitType: string | null = null;

  if (parts.length >= 2 && parts[1].startsWith("p")) {
    const n = Number(parts[1].slice(1));
    if (Number.isFinite(n) && n > 0) packSize = n;
  }

  if (parts.length >= 3) {
    unitType = parts[2] || null;
  }

  return { normalisedName, packSize, unitType };
}

function matchesProductKey(row: RawRow, key: ReturnType<typeof parseProductKey>): boolean {
  if (!key) return false;
  const name = (row.canonical_name || row.raw_name || "").trim();
  if (!name) return false;
  if (normaliseText(name) !== key.normalisedName) return false;
  if (key.packSize !== null && row.pack_size !== key.packSize) return false;
  if (key.unitType !== null && row.unit_type !== key.unitType) return false;
  return true;
}

function computeStats(items: ProductHistoryItem[]): ProductHistoryStats {
  const prices = items
    .map((i) => i.unitPrice)
    .filter((p): p is number => p !== null && Number.isFinite(p) && p > 0);

  if (prices.length === 0) {
    return { min: null, max: null, avg: null, latest: null, count: items.length, spanDays: 0 };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
  const latest = prices[prices.length - 1];

  let spanDays = 0;
  if (items.length >= 2) {
    const first = new Date(items[0].date + "T00:00:00Z");
    const last = new Date(items[items.length - 1].date + "T00:00:00Z");
    if (!Number.isNaN(first.getTime()) && !Number.isNaN(last.getTime())) {
      spanDays = Math.round((last.getTime() - first.getTime()) / 86400000);
    }
  }

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    latest: Math.round(latest * 100) / 100,
    count: items.length,
    spanDays,
  };
}

export async function GET(request: NextRequest) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");
  if (!keyParam) {
    return NextResponse.json({ error: "Missing 'key' query parameter" }, { status: 400 });
  }

  const parsedKey = parseProductKey(keyParam);
  if (!parsedKey) {
    return NextResponse.json({ error: "Invalid product key format" }, { status: 400 });
  }

  try {
    const startStr = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

    const rows = (await sql`
      SELECT
        i.receipt_id,
        COALESCE(
          to_char(i.observed_at, 'YYYY-MM-DD'),
          NULLIF(r.extraction_date_value, ''),
          to_char(r.created_at, 'YYYY-MM-DD')
        ) AS dt,
        COALESCE(NULLIF(m.display_name, ''), r.merchant_name) AS merchant,
        i.raw_name,
        i.canonical_name,
        COALESCE(NULLIF(i.display_name_tr, ''), NULLIF(cp.display_name_tr, '')) AS display_name_tr,
        NULLIF(i.brand, '') AS brand,
        i.pack_size,
        NULLIF(i.unit_type, '') AS unit_type,
        COALESCE(i.quantity, 1) AS quantity,
        COALESCE(i.unit_price_gross, i.unit_price) AS unit_price_gross,
        COALESCE(i.line_total_gross, i.line_total) AS line_total_gross
      FROM receipt_line_items i
      JOIN receipts r ON r.receipt_id = i.receipt_id
      LEFT JOIN merchants m ON m.id = r.merchant_id
      LEFT JOIN canonical_products cp ON cp.id::text = i.canonical_id
      WHERE r.username = ${username}
        AND COALESCE(r.expense_type, 'personal') = 'personal'
        AND COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) >= ${startStr}
        AND i.line_kind IS DISTINCT FROM 'discount'
        AND i.line_kind IS DISTINCT FROM 'tax'
        AND i.line_kind IS DISTINCT FROM 'payment'
        AND i.line_kind IS DISTINCT FROM 'bag'
        AND i.line_kind IS DISTINCT FROM 'fee'
        AND i.line_kind IS DISTINCT FROM 'department'
        AND i.line_kind IS DISTINCT FROM 'fuel'
        AND i.line_kind IS DISTINCT FROM 'other'
      ORDER BY dt ASC, i.id ASC
    `) as RawRow[];

    const matched = (Array.isArray(rows) ? rows : []).filter((row) => matchesProductKey(row, parsedKey));

    if (matched.length === 0) {
      return NextResponse.json({
        productKey: keyParam,
        name: "",
        brand: null,
        packSize: parsedKey.packSize,
        unitType: parsedKey.unitType,
        stats: { min: null, max: null, avg: null, latest: null, count: 0, spanDays: 0 },
        history: [],
      } satisfies ProductHistoryResponse);
    }

    const first = matched[0];
    const displayName = first.display_name_tr || first.canonical_name || first.raw_name || "";

    const history: ProductHistoryItem[] = matched.map((row) => ({
      receiptId: row.receipt_id,
      date: typeof row.dt === "string" ? row.dt.slice(0, 10) : "",
      merchantName: row.merchant ?? null,
      quantity: Number(row.quantity) || 1,
      unitPrice: row.unit_price_gross != null ? Number(row.unit_price_gross) : null,
      lineTotal: row.line_total_gross != null ? Number(row.line_total_gross) : null,
      unitType: row.unit_type ?? null,
    }));

    const stats = computeStats(history);

    return NextResponse.json({
      productKey: keyParam,
      name: displayName,
      brand: first.brand ?? null,
      packSize: first.pack_size ?? null,
      unitType: first.unit_type ?? null,
      stats,
      history,
    } satisfies ProductHistoryResponse);
  } catch (err) {
    console.error("[api/analysis/product-history] failed:", err);
    return NextResponse.json({ error: "Failed to load product history" }, { status: 500 });
  }
}