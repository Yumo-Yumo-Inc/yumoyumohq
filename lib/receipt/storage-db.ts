/**
 * Database storage for receipts using Neon PostgreSQL
 * SERVER-ONLY: Do not import in client components
 * Falls back to file-based storage if DATABASE_URL is not set
 * 
 * This is a thin wrapper around lib/receipt/db/ modules
 */

// Prevent import in browser
if (typeof window !== "undefined") {
  throw new Error("storage-db is a server-only module. Do not import in client components.");
}

import type { ReceiptAnalysis } from "./types";
import { getAllReceipts as getAllReceiptsFile, getReceiptById as getReceiptByIdFile, saveReceipt as saveReceiptFile, deleteReceipt as deleteReceiptFile } from "./storage";
import {
  getAllReceipts as getAllReceiptsDb,
  getAllReceiptsAll as getAllReceiptsAllDb,
  getAllReceiptsAllListLite as getAllReceiptsAllListLiteDb,
  getRejectedReceiptsAll as getRejectedReceiptsAllDb,
  getReceiptById as getReceiptByIdDb,
  getReceiptsByDateRange as getReceiptsByDateRangeDb,
  getReceiptsForInsights as getReceiptsForInsightsDb,
  getReceiptsAllForInsights as getReceiptsAllForInsightsDb,
  getReceiptsByDateRangeForInsights as getReceiptsByDateRangeForInsightsDb,
} from "./db/queries/select";

import { insertReceipt as insertReceiptDb } from "./db/queries/insert";
import { deleteReceipt as deleteReceiptDb } from "./db/queries/delete";
import { checkDuplicateReceipt as checkDuplicateReceiptDb } from "./db/duplicate/check";

// Import the type from ./db (type-only import, so no caching concern)
import type { DuplicateCheckResult } from "./db";

// Re-export types
export type { DuplicateCheckResult } from "./db";

/**
 * Get all receipts for a user
 */
export async function getAllReceipts(
  username: string, 
  limit: number = 100, 
  offset: number = 0,
  search: string = "",
  statusValues: string[] = []
): Promise<ReceiptAnalysis[]> {
  try {
    return await getAllReceiptsDb(username, limit, offset, search, statusValues);
  } catch (error) {
    console.error("[storage-db] Error in getAllReceipts, falling back to file storage:", error);
    const allReceipts = await getAllReceiptsFile();
    let filtered = allReceipts.filter((r) => r.username === username);
    
    if (search) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.receiptId?.toLowerCase().includes(searchLower) ||
        r.merchant?.name?.toLowerCase().includes(searchLower)
      );
    }
    if (statusValues.length > 0) {
      filtered = filtered.filter(r => statusValues.includes(r.status ?? ""));
    }
    
    return filtered.slice(offset, offset + limit);
  }
}

export async function getAllReceiptsAll(
  limit: number = 100, 
  offset: number = 0,
  search: string = "",
  statusValues: string[] = []
): Promise<ReceiptAnalysis[]> {
  try {
    return await getAllReceiptsAllDb(limit, offset, search, statusValues);
  } catch (error) {
    console.error("[storage-db] Error in getAllReceiptsAll, falling back to file storage:", error);
    const allReceipts = await getAllReceiptsFile();
    let filtered = allReceipts as any[];
    
    if (search) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.receiptId?.toLowerCase().includes(searchLower) ||
        r.merchant?.name?.toLowerCase().includes(searchLower)
      );
    }
    if (statusValues.length > 0) {
      filtered = filtered.filter(r => statusValues.includes(r.status ?? ""));
    }
    
    return allReceipts.slice(offset, offset + limit);
  }
}

/**
 * Admin list of all users' receipts using denormalized columns only — does NOT
 * read the heavy receipt_data JSONB. For list/queue screens (e.g. the approvals
 * panel) where the card never needs the full payload; the detail modal re-fetches
 * the full receipt by id when opened.
 */
export async function getAllReceiptsAllLite(
  limit: number = 100,
  offset: number = 0,
  search: string = "",
  statusValues: string[] = []
): Promise<ReceiptAnalysis[]> {
  return await getAllReceiptsAllListLiteDb(limit, offset, search, statusValues);
}

/**
 * Get rejected receipts (admin)
 */
export async function getRejectedReceiptsAll(
  limit: number = 100,
  offset: number = 0
): Promise<ReceiptAnalysis[]> {
  try {
    return await getRejectedReceiptsAllDb(limit, offset);
  } catch (error) {
    console.error("[storage-db] Error in getRejectedReceiptsAll:", error);
    const allReceipts = await getAllReceiptsFile();
    const rejected = allReceipts.filter((r: any) => r.status === "rejected");
    return rejected.slice(offset, offset + limit);
  }
}

/**
 * Get lightweight ReceiptSummary[] for Insights (no receipt_data, denormalized columns only).
 */
export async function getReceiptsForInsights(
  username: string,
  limit: number = 500,
  offset: number = 0
) {
  return getReceiptsForInsightsDb(username, limit, offset);
}

/**
 * Get lightweight ReceiptSummary[] for Insights (admin - all users).
 */
export async function getReceiptsAllForInsights(limit: number = 500, offset: number = 0) {
  return getReceiptsAllForInsightsDb(limit, offset);
}

/**
 * Get lightweight ReceiptSummary[] for Insights by date range.
 */
export async function getReceiptsByDateRangeForInsights(
  username: string,
  start: Date,
  end: Date
) {
  return getReceiptsByDateRangeForInsightsDb(username, start, end);
}

/**
 * Get receipts for a user within a date range (dashboard by period).
 */
export async function getReceiptsByDateRange(
  username: string,
  start: Date,
  end: Date
): Promise<ReceiptAnalysis[]> {
  try {
    return await getReceiptsByDateRangeDb(username, start, end);
  } catch (error) {
    console.error("[storage-db] Error in getReceiptsByDateRange, falling back to file storage:", error);
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter((r) => r.username === username);
    return filtered.filter((r) => {
      const d = (r.extraction?.date?.value as string) || (r as any).createdAt;
      if (!d) return false;
      const t = new Date(d).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }
}

/**
 * Get receipt by ID
 */
export async function getReceiptById(
  receiptId: string,
  username?: string,
  isAdmin: boolean = false
): Promise<ReceiptAnalysis | null> {
  try {
    return await getReceiptByIdDb(receiptId, username, isAdmin);
  } catch (error) {
    console.error("[storage-db] Error in getReceiptById, falling back to file storage:", error);
    const receipt = await getReceiptByIdFile(receiptId);
    if (receipt && username && !isAdmin && receipt.username !== username) {
      return null;
    }
    return receipt;
  }
}

/**
 * Save receipt to database
 */
export async function saveReceipt(receipt: ReceiptAnalysis): Promise<ReceiptAnalysis> {
  try {
    return await insertReceiptDb(receipt);
  } catch (error: any) {
    console.error("[storage-db] Error in saveReceipt, falling back to file storage:", error);
    return saveReceiptFile(receipt);
  }
}

/**
 * Delete receipt from database
 */
export async function deleteReceipt(
  receiptId: string,
  username: string,
  isAdmin: boolean = false
): Promise<boolean> {
  try {
    return await deleteReceiptDb(receiptId, username, isAdmin);
  } catch (error) {
    console.error("[storage-db] Error in deleteReceipt, falling back to file storage:", error);
    const receipt = await getReceiptByIdFile(receiptId);
    if (!receipt) {
      return false;
    }
    if (!isAdmin && receipt.username !== username) {
      return false;
    }
    return deleteReceiptFile(receiptId);
  }
}

/**
 * Check if a duplicate receipt already exists
 */
export async function checkDuplicateReceipt(
  receiptHash: string,
  perceptualHash: string | null,
  contentHash: string | null,
  username: string,
  isAdmin: boolean = false
): Promise<DuplicateCheckResult> {
  try {
    return await checkDuplicateReceiptDb(receiptHash, perceptualHash, contentHash, username, isAdmin);
  } catch (error) {
    console.error("[storage-db] Error in checkDuplicateReceipt:", error);
    // Fail open - allow upload on error
    return { isDuplicate: false };
  }
}
