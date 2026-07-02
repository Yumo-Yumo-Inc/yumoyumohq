/**
 * Fetches receipt line items (geminiLineItems) for a user within a date range,
 * for the insights products/brands sections.
 * SERVER-ONLY: do not import in client components.
 *
 * Line items live in receipt_data->'geminiLineItems' (jsonb), populated by the
 * TR line-item extraction step. Older receipts may lack them → those receipts
 * simply contribute no items. Defensive: malformed item → skipped, never throws.
 */

import { sql } from "@/lib/db/client";
import type { LineItemRow } from "./bucket-builder";

export async function getLineItemsForRange(
  username: string,
  start: Date,
  end: Date
): Promise<LineItemRow[]> {
  if (!sql) return [];
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  try {
    const rows = (await sql`
      SELECT
        r.receipt_id,
        COALESCE(NULLIF(r.extraction_date_value, ''), to_char(r.created_at, 'YYYY-MM-DD')) AS dt,
        it->>'name'       AS name,
        it->>'brand'      AS brand,
        it->>'quantity'   AS quantity,
        it->>'unitPrice'  AS unit_price,
        it->>'totalPrice' AS total_price,
        it->>'category'   AS category
      FROM receipts r
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(r.receipt_data->'geminiLineItems') = 'array'
             THEN r.receipt_data->'geminiLineItems' ELSE '[]'::jsonb END
      ) AS it
      WHERE r.username = ${username}
        AND COALESCE(r.expense_type, 'personal') = 'personal'
        AND (
          (r.extraction_date_value IS NOT NULL AND r.extraction_date_value != ''
            AND r.extraction_date_value >= ${startStr} AND r.extraction_date_value <= ${endStr})
          OR
          ((r.extraction_date_value IS NULL OR r.extraction_date_value = '')
            AND r.created_at >= ${start.toISOString()} AND r.created_at <= ${end.toISOString()})
        )
    `) as Record<string, unknown>[];

    const num = (v: unknown): number | null => {
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    return (Array.isArray(rows) ? rows : [])
      .map((row): LineItemRow | null => {
        const name = typeof row.name === "string" ? row.name.trim() : "";
        if (!name) return null;
        const brandRaw = typeof row.brand === "string" ? row.brand.trim() : "";
        return {
          name,
          brand: brandRaw || null,
          quantity: num(row.quantity),
          unitPrice: num(row.unit_price),
          totalPrice: num(row.total_price),
          category: typeof row.category === "string" ? row.category : null,
          receiptId: String(row.receipt_id ?? ""),
          date: typeof row.dt === "string" ? row.dt.slice(0, 10) : "",
        };
      })
      .filter((x): x is LineItemRow => x !== null);
  } catch (err) {
    console.error("[insights] getLineItemsForRange failed:", err);
    return [];
  }
}
