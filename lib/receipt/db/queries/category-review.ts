/**
 * Category review queue queries.
 * When a receipt is classified as "other", the user picks the correct category.
 * The pick is queued here and applied only after an admin approves it.
 * SERVER-ONLY: Do not import in client components.
 */

import { sql, warmUpConnection } from "@/lib/db/client";
import { isDatabaseAvailable, withRetry } from "../connection";
import { CANONICAL_RECEIPT_CATEGORIES } from "@/lib/receipt/categories";

export interface CategoryReviewRow {
  id: string;
  receipt_id: string;
  username: string;
  current_category: string | null;
  suggested_category: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** A user may only suggest a concrete category, never "other". */
export function isValidSuggestedCategory(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value !== "other" &&
    (CANONICAL_RECEIPT_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Insert a category suggestion for a receipt. Idempotent on the pending slot:
 * if a pending row already exists for this receipt, it is overwritten.
 */
export async function insertCategoryReview(
  receiptId: string,
  username: string,
  suggestedCategory: string,
  currentCategory: string | null
): Promise<CategoryReviewRow> {
  if (!isDatabaseAvailable() || !sql) {
    throw new Error("Database not available");
  }
  const dbSql = sql;
  await warmUpConnection();

  // Replace any existing pending pick for this receipt so the queue stays clean.
  await dbSql`
    DELETE FROM category_review_queue
    WHERE receipt_id = ${receiptId} AND status = 'pending'
  `;

  const rows = await dbSql`
    INSERT INTO category_review_queue
      (receipt_id, username, current_category, suggested_category, status)
    VALUES (${receiptId}, ${username}, ${currentCategory}, ${suggestedCategory}, 'pending')
    RETURNING id, receipt_id, username, current_category,
              suggested_category, status, reviewed_by, reviewed_at, created_at
  `;
  const row = rows[0] as CategoryReviewRow;
  if (!row) throw new Error("Insert failed");
  return row;
}

/** Admin: list category review rows, optionally filtered by status. */
export async function getCategoryReviews(
  status: "pending" | "approved" | "rejected" | "all" = "pending",
  limit: number = 100,
  offset: number = 0
): Promise<CategoryReviewRow[]> {
  if (!isDatabaseAvailable() || !sql) {
    return [];
  }
  const dbSql = sql;
  await warmUpConnection();

  try {
    return await withRetry(async () => {
      if (status === "all") {
        return (await dbSql`
          SELECT id, receipt_id, username, current_category,
                 suggested_category, status, reviewed_by, reviewed_at, created_at
          FROM category_review_queue
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `) as CategoryReviewRow[];
      }
      return (await dbSql`
        SELECT id, receipt_id, username, current_category,
               suggested_category, status, reviewed_by, reviewed_at, created_at
        FROM category_review_queue
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `) as CategoryReviewRow[];
    });
  } catch (error: any) {
    console.error("[category-review] getCategoryReviews failed:", error);
    return [];
  }
}

/** Mark a review row resolved. Does NOT mutate the receipt — caller does that. */
export async function resolveCategoryReview(
  id: string,
  decision: "approved" | "rejected",
  reviewedBy: string
): Promise<CategoryReviewRow | null> {
  if (!isDatabaseAvailable() || !sql) {
    throw new Error("Database not available");
  }
  const dbSql = sql;
  await warmUpConnection();

  const rows = await dbSql`
    UPDATE category_review_queue
    SET status = ${decision}, reviewed_by = ${reviewedBy}, reviewed_at = NOW()
    WHERE id = ${id} AND status = 'pending'
    RETURNING id, receipt_id, username, current_category,
              suggested_category, status, reviewed_by, reviewed_at, created_at
  `;
  return (rows[0] as CategoryReviewRow) ?? null;
}
