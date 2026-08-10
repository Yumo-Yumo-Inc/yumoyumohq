/**
 * GET /api/analysis/product-history?key=<productKey>
 *
 * Returns the full purchase history for a tracked product identified by its
 * productKey (normalised_name:p{packSize}:unitType). Includes every purchase
 * instance with merchant, date, quantity, unit price and line total, plus
 * summary statistics (min, max, avg, latest unit price).
 *
 * Unit prices prefer line_total/quantity (same comparable path as Analysis
 * tracks). Min/max/avg use the outlier gate so a single OCR misread cannot
 * stretch the range (e.g. bread 15 → 2587). Insufficient data yields an empty
 * history array — no fabricated values.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { comparableUnitPrice, resolvePiecePackCount } from "@/lib/analysis/comparable-unit-price";
import { filterOutlierValues } from "@/lib/analysis/price-sanity";
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
  pack_size: string | number | null;
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
  const rowPack =
    resolvePiecePackCount({
      name: row.display_name_tr || row.canonical_name || row.raw_name,
      packSize: row.pack_size,
    });
  if (key.packSize !== null && rowPack !== key.packSize) return false;
  if (key.unitType !== null && row.unit_type !== key.unitType) return false;
  return true;
}

function computeStats(items: ProductHistoryItem[]): ProductHistoryStats {
  const cleanPrices = items
    .filter((i) => !i.outlier && i.unitPrice != null && i.unitPrice > 0)
    .map((i) => i.unitPrice as number);

  if (cleanPrices.length === 0) {
    return { min: null, max: null, avg: null, latest: null, count: items.length, spanDays: 0 };
  }

  const sorted = [...cleanPrices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;

  let latest: number | null = null;
  for (let i = items.length - 1; i >= 0; i--) {
    const row = items[i];
    if (!row.outlier && row.unitPrice != null && row.unitPrice > 0) {
      latest = row.unitPrice;
      break;
    }
  }
  if (latest == null) latest = sorted[sorted.length - 1];

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

    const historyDraft: ProductHistoryItem[] = matched.map((row) => {
      const quantity = Number(row.quantity) || 1;
      const lineTotal = row.line_total_gross != null ? Number(row.line_total_gross) : null;
      const rawUnit = row.unit_price_gross != null ? Number(row.unit_price_gross) : null;
      const displayName = row.display_name_tr || row.canonical_name || row.raw_name || "";
      const packSize = resolvePiecePackCount({
        name: displayName,
        packSize: row.pack_size,
      });
      return {
        receiptId: row.receipt_id,
        date: typeof row.dt === "string" ? row.dt.slice(0, 10) : "",
        merchantName: row.merchant ?? null,
        quantity,
        unitPrice: comparableUnitPrice({
          name: displayName,
          quantity,
          unitPrice: rawUnit,
          lineTotal,
          packSize,
          unitType: row.unit_type,
        }),
        lineTotal,
        unitType: row.unit_type ?? null,
      };
    });

    // Index-stable outlier mark: same rounded price on two rows must not
    // collapse both into "kept" via a Set.
    const pricedIdx = historyDraft
      .map((item, idx) => ({ idx, p: item.unitPrice }))
      .filter((x): x is { idx: number; p: number } => x.p != null && x.p > 0);
    const remaining = [...filterOutlierValues(pricedIdx.map((x) => x.p))];
    const keptIdx = new Set<number>();
    for (const row of pricedIdx) {
      const at = remaining.indexOf(row.p);
      if (at >= 0) {
        keptIdx.add(row.idx);
        remaining.splice(at, 1);
      }
    }

    const history: ProductHistoryItem[] = historyDraft.map((item, idx) => ({
      ...item,
      outlier: item.unitPrice != null && item.unitPrice > 0 ? !keptIdx.has(idx) : false,
    }));

    const stats = computeStats(history);

    return NextResponse.json({
      productKey: keyParam,
      name: displayName,
      brand: first.brand ?? null,
      packSize: resolvePiecePackCount({
        name: displayName,
        packSize: first.pack_size,
      }),
      unitType: first.unit_type ?? null,
      stats,
      history,
    } satisfies ProductHistoryResponse);
  } catch (err) {
    console.error("[api/analysis/product-history] failed:", err);
    return NextResponse.json({ error: "Failed to load product history" }, { status: 500 });
  }
}
