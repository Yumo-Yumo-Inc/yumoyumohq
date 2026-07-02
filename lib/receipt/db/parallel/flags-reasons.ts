/**
 * Save flags reasons in parallel
 * SERVER-ONLY: Do not import in client components
 */

import { sql } from "@/lib/db/client";

/**
 * Save flags reasons for a receipt
 * Deletes existing reasons and batch inserts new ones
 */
export async function saveFlagsReasons(
  receiptId: string,
  reasons: string[]
): Promise<void> {
  if (!reasons || reasons.length === 0) {
    return;
  }

  const dbSql = sql;
  if (!dbSql) {
    throw new Error("Database connection not available");
  }

  // Delete existing reasons
  await dbSql`DELETE FROM receipt_flags_reasons WHERE receipt_id = ${receiptId}`;

  const receiptIds = reasons.map(() => receiptId);

  await dbSql`
    INSERT INTO receipt_flags_reasons (receipt_id, reason)
    SELECT *
    FROM UNNEST(
      ${receiptIds}::text[],
      ${reasons}::text[]
    )
  `;
}
