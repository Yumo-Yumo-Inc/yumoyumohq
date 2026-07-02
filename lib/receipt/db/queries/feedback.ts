/**
 * Receipt feedback (Report a bug) queries
 * SERVER-ONLY: Do not import in client components
 */

import { sql, warmUpConnection } from "@/lib/db/client";
import { isDatabaseAvailable, withRetry } from "../connection";

export interface ReceiptFeedbackRow {
  id: string;
  receipt_id: string;
  username: string;
  bug_types: string[];
  created_at: string;
}

const ALLOWED_BUG_TYPES = [
  "category_wrong",
  "date_wrong",
  "merchant_name_wrong",
  "time_wrong",
  "total_wrong",
] as const;

export function getAllowedBugTypes(): readonly string[] {
  return ALLOWED_BUG_TYPES;
}

export function validateBugTypes(bugTypes: string[]): boolean {
  if (!Array.isArray(bugTypes) || bugTypes.length === 0) return false;
  return bugTypes.every((t) => ALLOWED_BUG_TYPES.includes(t as any));
}

/**
 * Insert a receipt feedback (report a bug) row.
 */
export async function insertReceiptFeedback(
  receiptId: string,
  username: string,
  bugTypes: string[]
): Promise<ReceiptFeedbackRow> {
  if (!isDatabaseAvailable() || !sql) {
    throw new Error("Database not available");
  }
  const dbSql = sql;
  await warmUpConnection();

  const rows = await dbSql`
    INSERT INTO receipt_feedback (receipt_id, username, bug_types)
    VALUES (${receiptId}, ${username}, ${bugTypes})
    RETURNING id, receipt_id, username, bug_types, created_at
  `;
  const row = rows[0] as ReceiptFeedbackRow;
  if (!row) throw new Error("Insert failed");
  return row;
}

/**
 * Get all feedback rows for admin (newest first).
 */
export async function getFeedbackAll(
  limit: number = 100,
  offset: number = 0
): Promise<ReceiptFeedbackRow[]> {
  if (!isDatabaseAvailable() || !sql) {
    return [];
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    const rows = await withRetry(async () => {
      return await dbSql`
        SELECT id, receipt_id, username, bug_types, created_at
        FROM receipt_feedback
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    });
    return rows as ReceiptFeedbackRow[];
  } catch (error: any) {
    console.error("[feedback] getFeedbackAll failed:", error);
    return [];
  }
}
