/**
 * Save breakdown items in parallel
 * SERVER-ONLY: Do not import in client components
 */

import { sql } from "@/lib/db/client";
import type { HiddenCostBreakdownItem } from "../../types";

/**
 * Save breakdown items for a receipt
 * Deletes existing items and batch inserts new ones
 */
export async function saveBreakdownItems(
  receiptId: string,
  items: HiddenCostBreakdownItem[]
): Promise<void> {
  if (!items || items.length === 0) {
    return;
  }

  const dbSql = sql;
  if (!dbSql) {
    throw new Error("Database connection not available");
  }

  // Delete existing breakdown items
  await dbSql`DELETE FROM receipt_breakdown_items WHERE receipt_id = ${receiptId}`;

  const receiptIds = items.map(() => receiptId);
  const labels = items.map((item) => item.label);
  const amounts = items.map((item) => item.amount);
  const descriptions = items.map((item) => item.description || null);
  const buckets = items.map((item) => item.bucket || null);
  const estimatedFlags = items.map((item) => item.estimated || false);

  await dbSql`
    INSERT INTO receipt_breakdown_items (receipt_id, label, amount, description, bucket, estimated)
    SELECT *
    FROM UNNEST(
      ${receiptIds}::text[],
      ${labels}::text[],
      ${amounts}::numeric[],
      ${descriptions}::text[],
      ${buckets}::text[],
      ${estimatedFlags}::boolean[]
    )
  `;
}
