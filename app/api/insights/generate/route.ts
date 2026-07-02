/**
 * POST /api/insights/generate
 *
 * Runs the personal-behavior orchestrator server-side for the current user,
 * persists the resulting insight events, and returns them.
 *
 * This is idempotent: re-running on the same data updates existing events
 * (same id → upsert) rather than duplicating.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { getUserLocale } from "@/lib/i18n/user-locale";
import {
  bulkUpsertInsightEvents,
  listInsightEvents,
} from "@/lib/insights/events/server";
import {
  runPersonalBehaviorOrchestrator,
  toInsightEventUpsertInputs,
} from "@/lib/insights/personal-behavior/orchestrator";
import type { ReceiptSummary } from "@/lib/insights/types";
import type { CachedReceiptLineItem } from "@/lib/offline/types";

interface ReceiptRow {
  receipt_id: string;
  merchant_name: string;
  merchant_country: string | null;
  pricing_currency: string | null;
  extraction_date_value: string | null;
  extraction_time_value: string | null;
  pricing_total_paid: number;
  pricing_vat_amount: number;
  pricing_paid_ex_tax: number;
  hidden_cost_core: number;
  hidden_cost_breakdown_import_system: number;
  hidden_cost_breakdown_retail_hidden: number;
  merchant_category: string | null;
  flags_gate_confidence: number | null;
}

interface LineItemRow {
  receipt_id: string;
  receipt_line_item_id: string;
  line_index: number;
  purchased_at: string | null;
  raw_name: string | null;
  canonical_name: string | null;
  brand: string | null;
  category_lvl1: string | null;
  category_lvl2: string | null;
  pack_size: string | null;
  unit_type: string | null;
  quantity: number;
  unit_price_gross: number | null;
  line_total_gross: number | null;
  discount_amount: number;
  pricing_currency: string | null;
}

function confidenceFromGate(gate: number | null): "verified" | "low" | "rejected" {
  if (gate === null) return "low";
  if (gate >= 80) return "verified";
  if (gate >= 40) return "low";
  return "rejected";
}

function toReceiptSummary(row: ReceiptRow): ReceiptSummary {
  const totalPaid = Number(row.pricing_total_paid) || 0;
  const productValue =
    totalPaid -
    (Number(row.hidden_cost_core) || 0) -
    (Number(row.pricing_vat_amount) || 0);
  return {
    id: row.receipt_id,
    merchantName: row.merchant_name ?? "",
    country: row.merchant_country ?? "",
    currency: row.pricing_currency ?? "TRY",
    date: row.extraction_date_value ?? new Date().toISOString().slice(0, 10),
    time: row.extraction_time_value ?? undefined,
    totalPaid,
    taxAmount: Number(row.pricing_vat_amount) || 0,
    paidExTax: Number(row.pricing_paid_ex_tax) || 0,
    hiddenCostCore: Number(row.hidden_cost_core) || 0,
    importSystemCost: Number(row.hidden_cost_breakdown_import_system) || 0,
    retailHiddenCost: Number(row.hidden_cost_breakdown_retail_hidden) || 0,
    productValue: Math.max(0, productValue),
    confidence: confidenceFromGate(row.flags_gate_confidence),
    category: row.merchant_category ?? undefined,
  };
}

function toCachedLineItem(row: LineItemRow): CachedReceiptLineItem {
  const packSizeNum = row.pack_size ? Number(row.pack_size) : null;
  return {
    id: `${row.receipt_id}_${row.line_index}`,
    receiptLineItemId: row.receipt_line_item_id,
    receiptId: row.receipt_id,
    lineIndex: row.line_index,
    purchasedAt: row.purchased_at,
    rawName: row.raw_name,
    canonicalName: row.canonical_name,
    brand: row.brand,
    categoryLvl1: row.category_lvl1,
    categoryLvl2: row.category_lvl2,
    packSize: packSizeNum && Number.isFinite(packSizeNum) ? packSizeNum : null,
    unitType: row.unit_type,
    quantity: Number(row.quantity) || 1,
    unitPriceGross: row.unit_price_gross != null ? Number(row.unit_price_gross) : null,
    lineTotalGross: row.line_total_gross != null ? Number(row.line_total_gross) : null,
    discountAmount: Number(row.discount_amount) || 0,
    currency: row.pricing_currency ?? "TRY",
    updated_at: row.purchased_at ?? new Date().toISOString(),
    version: 1,
  };
}

export async function POST() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locale = await getUserLocale(username);

    // 1. Fetch receipts
    const receiptRows = await db.query<ReceiptRow>(
      `
        SELECT
          receipt_id, merchant_name, merchant_country, pricing_currency,
          extraction_date_value, extraction_time_value, pricing_total_paid,
          pricing_vat_amount, pricing_paid_ex_tax, hidden_cost_core,
          hidden_cost_breakdown_import_system, hidden_cost_breakdown_retail_hidden,
          merchant_category, flags_gate_confidence
        FROM receipts
        WHERE username = $1
          AND status IN ('completed', 'verified', 'scanned')
        ORDER BY created_at ASC
      `,
      [username]
    );
    const receipts = receiptRows.rows.map(toReceiptSummary);

    // 2. Fetch line items
    const lineItemRows = await db.query<LineItemRow>(
      `
        SELECT
          rli.receipt_id, rli.id as receipt_line_item_id, rli.id as line_index,
          rli.observed_at as purchased_at, rli.raw_name, rli.canonical_name,
          rli.brand, rli.category_lvl1, rli.category_lvl2, rli.pack_size,
          rli.unit_type, rli.quantity, rli.unit_price_gross, rli.line_total_gross,
          rli.discount_amount, r.pricing_currency
        FROM receipt_line_items rli
        JOIN receipts r ON r.receipt_id = rli.receipt_id
        WHERE r.username = $1
        ORDER BY rli.observed_at ASC
      `,
      [username]
    );
    const lineItems = lineItemRows.rows.map(toCachedLineItem);

    // 3. Run orchestrator
    // Use modal (most common) currency — prevents cross-currency garbage comparisons
    const currencyCount: Record<string, number> = {};
    for (const r of receipts) {
      currencyCount[r.currency] = (currencyCount[r.currency] ?? 0) + 1;
    }
    const dominantCurrency =
      Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "TRY";

    const referenceDate = new Date();
    const batch = runPersonalBehaviorOrchestrator({
      receipts,
      lineItems,
      context: {
        referenceDate,
        currency: dominantCurrency,
        locale,
      },
    });

    // 4. Persist
    const inputs = toInsightEventUpsertInputs(batch);
    const saved = await bulkUpsertInsightEvents(username, inputs);

    // 5. Also run behavior analyzer to keep profile fresh
    const { analyzeAndStoreUserBehavior } = await import(
      "@/lib/insights/user-behavior-analyzer"
    );
    await analyzeAndStoreUserBehavior(username).catch((err) => {
      console.warn("[api/insights/generate] behavior analyzer failed:", err);
    });

    return NextResponse.json({
      insights: saved,
      perEngine: batch.perEngine,
      detectedAt: batch.detectedAt,
    });
  } catch (error) {
    console.error("[api/insights/generate] failed:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

/**
 * GET — returns existing insight events + a flag indicating whether a fresh
 * generation is recommended (events are stale > 24h).
 */
export async function GET(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Number.parseInt(searchParams.get("limit") ?? "50", 10);
    const events = await listInsightEvents(username, { limit });

    // Check if any event is > 24h old
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const stale =
      events.length === 0 ||
      events.some((e) => new Date(e.detectedAt).getTime() < oneDayAgo);

    return NextResponse.json({ events, stale, limit });
  } catch (error) {
    console.error("[api/insights/generate] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load insights" },
      { status: 500 }
    );
  }
}
