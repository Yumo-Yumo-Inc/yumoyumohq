/**
 * Map database row to ReceiptAnalysis
 * SERVER-ONLY: Do not import in client components
 */

import type { ReceiptAnalysis } from "../../types";

/**
 * Convert database row to ReceiptAnalysis
 * Ensures username is set from DB column if missing
 */
export function dbRowToReceipt(row: any): ReceiptAnalysis {
  const receipt = row.receipt_data as ReceiptAnalysis;
  // Ensure username is set from database column if missing in receipt_data
  if (!receipt.username && row.username) {
    receipt.username = row.username;
  }
  return receipt;
}
