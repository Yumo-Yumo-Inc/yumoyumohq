/**
 * SELECT queries for receipts
 * SERVER-ONLY: Do not import in client components
 */

import { sql, getSql, warmUpConnection } from "@/lib/db/client";
import type { ReceiptAnalysis } from "../../types";
import { getAllReceipts as getAllReceiptsFile, getReceiptById as getReceiptByIdFile } from "../../storage";
import { isDatabaseAvailable, withRetry } from "../connection";
import { dbRowToReceipt } from "../mappers/from-db";
import type { ReceiptSummary } from "@/lib/insights/types";
import {
  countCombinedUserReceipts,
  fetchCombinedUserReceiptsLite,
  getOtherExpenseReceiptById,
  type ReceiptExpenseFilter,
} from "../other-expense";

export async function getAllReceipts(
  username: string, 
  limit: number = 100, 
  offset: number = 0,
  search: string = "",
  statusValues: string[] = []
): Promise<ReceiptAnalysis[]> {
  if (!isDatabaseAvailable() || !sql) {
    console.log("[storage-db] DATABASE_URL not set, falling back to file storage");
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

  const dbSql = sql;
  await warmUpConnection();

  try {
    const searchTrimmed = search.trim();
    console.log("[storage-db] Fetching receipts from database for user:", username, `(limit: ${limit}, offset: ${offset}, search: "${searchTrimmed}", statusValues: [${statusValues}])`);
    
    const receipts = await withRetry(async () => {
      let rows;
      
      if (statusValues.length > 0 && searchTrimmed) {
        const searchPattern = `%${searchTrimmed}%`;
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts 
          WHERE username = ${username}
            AND status = ANY(${statusValues})
            AND (
              receipt_id ILIKE ${searchPattern}
              OR merchant_name ILIKE ${searchPattern}
            )
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (statusValues.length > 0) {
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts 
          WHERE username = ${username}
            AND status = ANY(${statusValues})
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (searchTrimmed) {
        // IF SEARCHING: search receipt_id or merchant_name
        const searchPattern = `%${searchTrimmed}%`;
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts 
          WHERE username = ${username}
            AND (
              receipt_id ILIKE ${searchPattern}
              OR merchant_name ILIKE ${searchPattern}
            )
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        // IF NOT SEARCHING: normal query
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts 
          WHERE username = ${username}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }
      
      console.log(`[storage-db] Found ${rows.length} receipts for user: "${username}" (limit: ${limit}, offset: ${offset}, search: "${searchTrimmed}")`);
      
      // ... rest of code (similarUsernames check etc.)
      
      const isDevelopment = process.env.NODE_ENV === "development";
      
      if (rows.length === 0 && isDevelopment && offset === 0) {
        const similarUsernames = await dbSql`
          SELECT DISTINCT username, COUNT(*) as count
          FROM receipts
          WHERE username LIKE ${`%${username}%`}
          GROUP BY username
          LIMIT 5
        `;
        if (similarUsernames.length > 0) {
          console.warn(`[storage-db] ⚠️ Found similar usernames:`, similarUsernames);
        }
      }
      
      return rows.map((row: any) => dbRowToReceipt(row));
    });
    
    console.log("[storage-db] Successfully fetched receipts from database");
    return receipts;
  } catch (error: any) {
    console.error("[storage-db] Failed to fetch receipts from database after retries:", error);
    console.log("[storage-db] Falling back to file storage");
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter(
      (r) => r.username === username && (r.expenseType ?? "personal") === "personal"
    );
    return filtered.slice(offset, offset + limit);
  }
}

/**
 * Get total count of receipts for a user (for pagination)
 */
export async function getReceiptCount(
  username: string,
  search: string = "",
  statusValues: string[] = [],
  expenseFilter: ReceiptExpenseFilter = null
): Promise<number> {
  if (!isDatabaseAvailable() || !sql) {
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
    if (expenseFilter) {
      filtered = filtered.filter((r) => (r.expenseType ?? "personal") === expenseFilter);
    }

    return filtered.length;
  }

  await warmUpConnection();

  try {
    return await countCombinedUserReceipts({
      username,
      search,
      statusValues,
      expenseFilter,
    });
  } catch (error: any) {
    console.error("[storage-db] Failed to get receipt count:", error);
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
    if (expenseFilter) {
      filtered = filtered.filter((r) => (r.expenseType ?? "personal") === expenseFilter);
    }

    return filtered.length;
  }
}

/**
 * Get total count of all receipts (for admin pagination)
 */
export async function getReceiptCountAll(search: string = "", statusValues: string[] = []): Promise<number> {
  if (!isDatabaseAvailable() || !sql) {
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
    
    return filtered.length;
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    const searchTrimmed = search.trim();
    let result;
    
    if (statusValues.length > 0 && searchTrimmed) {
      const searchPattern = `%${searchTrimmed}%`;
      result = await dbSql`
        SELECT COUNT(*) as count
        FROM receipts
        WHERE status = ANY(${statusValues})
          AND (
            receipt_id ILIKE ${searchPattern}
            OR merchant_name ILIKE ${searchPattern}
            OR username ILIKE ${searchPattern}
          )
      `;
    } else if (statusValues.length > 0) {
      result = await dbSql`
        SELECT COUNT(*) as count
        FROM receipts
        WHERE status = ANY(${statusValues})
      `;
    } else if (searchTrimmed) {
      const searchPattern = `%${searchTrimmed}%`;
      result = await dbSql`
        SELECT COUNT(*) as count
        FROM receipts
        WHERE (
          receipt_id ILIKE ${searchPattern}
          OR merchant_name ILIKE ${searchPattern}
          OR username ILIKE ${searchPattern}
        )
      `;
    } else {
      result = await dbSql`
        SELECT COUNT(*) as count
        FROM receipts
      `;
    }
    
    return parseInt(result[0]?.count || '0', 10);
  } catch (error: any) {
    console.error("[storage-db] Failed to get total receipt count:", error);
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
    
    return filtered.length;
  }
}

export async function getAllReceiptsAll(
  limit: number = 100, 
  offset: number = 0,
  search: string = "",
  statusValues: string[] = []
): Promise<ReceiptAnalysis[]> {
  if (!isDatabaseAvailable() || !sql) {
    console.log("[storage-db] DATABASE_URL not set, falling back to file storage");
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
    
    return filtered.slice(offset, offset + limit);
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    const searchTrimmed = search.trim();
    console.log("[storage-db] Fetching ALL receipts from database (admin)", `(limit: ${limit}, offset: ${offset}, search: "${searchTrimmed}", statusValues: [${statusValues}])`);
    
    const receipts = await withRetry(async () => {
      let rows;
      
      if (statusValues.length > 0 && searchTrimmed) {
        const searchPattern = `%${searchTrimmed}%`;
        // LOWER(status): the column holds mixed case ('verified' and a few 'VERIFIED').
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts
          WHERE LOWER(status) = ANY(${statusValues})
            AND (
              receipt_id ILIKE ${searchPattern}
              OR merchant_name ILIKE ${searchPattern}
              OR username ILIKE ${searchPattern}
            )
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (statusValues.length > 0) {
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts
          WHERE LOWER(status) = ANY(${statusValues})
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (searchTrimmed) {
        // IF SEARCHING: search receipt_id, merchant_name, or username
        const searchPattern = `%${searchTrimmed}%`;
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts 
          WHERE (
            receipt_id ILIKE ${searchPattern}
            OR merchant_name ILIKE ${searchPattern}
            OR username ILIKE ${searchPattern}
          )
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        // IF NOT SEARCHING: normal query
        rows = await dbSql`
          SELECT receipt_data, username
          FROM receipts 
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }
      
      console.log(`[storage-db] Found ${rows.length} total receipts (limit: ${limit}, offset: ${offset}, search: "${searchTrimmed}")`);
      
      return rows.map((row: any) => dbRowToReceipt(row));
    });
    
    console.log("[storage-db] Successfully fetched all receipts from database");
    return receipts;
  } catch (error: any) {
    console.error("[storage-db] Failed to fetch all receipts from database:", error);
    console.log("[storage-db] Falling back to file storage");
    const allReceipts = await getAllReceiptsFile();
    
    if (search) {
      const searchLower = search.toLowerCase().trim();
      const filtered = allReceipts.filter(r => 
        r.receiptId?.toLowerCase().includes(searchLower) ||
        r.merchant?.name?.toLowerCase().includes(searchLower)
      );
      return filtered.slice(offset, offset + limit);
    }
    
    return allReceipts.slice(offset, offset + limit);
  }
}

/**
 * Get rejected receipts (admin) — status = 'rejected'
 */
export async function getRejectedReceiptsAll(
  limit: number = 100,
  offset: number = 0
): Promise<ReceiptAnalysis[]> {
  if (!isDatabaseAvailable() || !sql) {
    const allReceipts = await getAllReceiptsFile();
    const rejected = allReceipts.filter((r: any) => r.status === "rejected");
    return rejected.slice(offset, offset + limit);
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    const rows = await dbSql`
      SELECT receipt_data, username
      FROM receipts
      WHERE status = 'rejected'
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    return rows.map((row: any) => dbRowToReceipt(row));
  } catch (error: any) {
    console.error("[storage-db] Failed to fetch rejected receipts:", error);
    const allReceipts = await getAllReceiptsFile();
    const rejected = allReceipts.filter((r: any) => r.status === "rejected");
    return rejected.slice(offset, offset + limit);
  }
}

/**
 * Get receipts for a user within a date range (for dashboard by period).
 * Uses extraction_date_value (receipt transaction date) when present, else created_at.
 */
export async function getReceiptsByDateRange(
  username: string,
  start: Date,
  end: Date
): Promise<ReceiptAnalysis[]> {
  if (!isDatabaseAvailable() || !sql) {
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter((r) => r.username === username);
    return filtered.filter((r) => {
      const d = (r.extraction?.date?.value as string) || (r as any).createdAt;
      if (!d) return false;
      const t = new Date(d).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }

  const dbSql = sql;
  await warmUpConnection();

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  try {
    const rows = await withRetry(async () => {
      return await dbSql`
        SELECT receipt_data, username
        FROM receipts
        WHERE username = ${username}
          AND COALESCE(expense_type, 'personal') = 'personal'
          AND (
            (extraction_date_value IS NOT NULL AND extraction_date_value != ''
              AND extraction_date_value >= ${startStr} AND extraction_date_value <= ${endStr})
            OR
            ((extraction_date_value IS NULL OR extraction_date_value = '')
              AND created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()})
          )
        ORDER BY created_at DESC
      `;
    });
    return rows.map((row: any) => dbRowToReceipt(row));
  } catch (error: any) {
    console.error("[storage-db] getReceiptsByDateRange failed:", error);
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter(
      (r) => r.username === username && (r.expenseType ?? "personal") === "personal"
    );
    return filtered.filter((r) => {
      const d = (r.extraction?.date?.value as string) || (r as any).createdAt;
      if (!d) return false;
      const t = new Date(d).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }
}

/**
 * Lightweight fetch for Insights: selects only denormalized columns (no receipt_data).
 * Much faster than getAllReceipts for large datasets.
 */
export async function getReceiptsForInsights(
  username: string,
  limit: number = 500,
  offset: number = 0
): Promise<ReceiptSummary[]> {
  if (!isDatabaseAvailable() || !sql) {
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter(
      (r) => r.username === username && (r.expenseType ?? "personal") === "personal"
    );
    const { receiptToSummary } = await import("@/lib/insights/compute");
    return filtered.slice(offset, offset + limit).map((r) => receiptToSummary(r)).filter(Boolean);
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    const rows = await withRetry(async () => {
      return await dbSql`
        SELECT
          receipt_id,
          merchant_name,
          merchant_country,
          merchant_category,
          merchant_place_id,
          extraction_date_value,
          extraction_time_value,
          created_at,
          pricing_total_paid,
          pricing_vat_amount,
          pricing_paid_ex_tax,
          pricing_currency,
          hidden_cost_core,
          hidden_cost_breakdown_import_system,
          hidden_cost_breakdown_retail_hidden,
          hidden_cost_reference_price,
          status,
          flags_rejected
        FROM receipts
        WHERE username = ${username}
          AND COALESCE(expense_type, 'personal') = 'personal'
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    });

    return (Array.isArray(rows) ? rows : []).map((row: any) => {
      const confidence: "verified" | "low" | "rejected" =
        row.status === "verified" || row.status === "saved"
          ? "verified"
          : row.flags_rejected || row.status === "rejected"
          ? "rejected"
          : "low";
      const dateVal = row.extraction_date_value || (row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      return {
        id: row.receipt_id,
        merchantName: row.merchant_name || "Unknown",
        country: row.merchant_country || "US",
        currency: row.pricing_currency || "USD",
        date: typeof dateVal === "string" ? dateVal.slice(0, 10) : dateVal,
        time: row.extraction_time_value ?? undefined,
        totalPaid: Number(row.pricing_total_paid) || 0,
        taxAmount: Number(row.pricing_vat_amount) || 0,
        paidExTax: Number(row.pricing_paid_ex_tax) || 0,
        hiddenCostCore: Number(row.hidden_cost_core) || 0,
        importSystemCost: Number(row.hidden_cost_breakdown_import_system) || 0,
        retailHiddenCost: Number(row.hidden_cost_breakdown_retail_hidden) || 0,
        productValue: Number(row.hidden_cost_reference_price) || 0,
        confidence,
        category: row.merchant_category || "other",
        merchantId: row.merchant_place_id ?? undefined,
      } as ReceiptSummary;
    });
  } catch (error: any) {
    console.error("[storage-db] getReceiptsForInsights failed:", error);
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter(
      (r) => r.username === username && (r.expenseType ?? "personal") === "personal"
    );
    const { receiptToSummary } = await import("@/lib/insights/compute");
    return filtered.slice(offset, offset + limit).map((r) => receiptToSummary(r)).filter(Boolean);
  }
}

/**
 * Lightweight fetch for Insights (admin): all receipts, denormalized columns only.
 */
export async function getReceiptsAllForInsights(
  limit: number = 500,
  offset: number = 0
): Promise<ReceiptSummary[]> {
  if (!isDatabaseAvailable() || !sql) {
    const allReceipts = await getAllReceiptsFile();
    const { receiptToSummary } = await import("@/lib/insights/compute");
    return allReceipts
      .filter((r) => (r.expenseType ?? "personal") === "personal")
      .slice(offset, offset + limit)
      .map((r) => receiptToSummary(r))
      .filter(Boolean);
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    const rows = await withRetry(async () => {
      return await dbSql`
        SELECT receipt_id, merchant_name, merchant_country, merchant_category, merchant_place_id,
          extraction_date_value, extraction_time_value, created_at,
          pricing_total_paid, pricing_vat_amount, pricing_paid_ex_tax, pricing_currency,
          hidden_cost_core, hidden_cost_breakdown_import_system, hidden_cost_breakdown_retail_hidden,
          hidden_cost_reference_price, status, flags_rejected
        FROM receipts
        WHERE COALESCE(expense_type, 'personal') = 'personal'
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    });

    return (Array.isArray(rows) ? rows : []).map((row: any) => {
      const confidence: "verified" | "low" | "rejected" =
        row.status === "verified" || row.status === "saved" ? "verified"
          : row.flags_rejected || row.status === "rejected" ? "rejected" : "low";
      const dateVal = row.extraction_date_value || (row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      return {
        id: row.receipt_id,
        merchantName: row.merchant_name || "Unknown",
        country: row.merchant_country || "US",
        currency: row.pricing_currency || "USD",
        date: typeof dateVal === "string" ? dateVal.slice(0, 10) : dateVal,
        time: row.extraction_time_value ?? undefined,
        totalPaid: Number(row.pricing_total_paid) || 0,
        taxAmount: Number(row.pricing_vat_amount) || 0,
        paidExTax: Number(row.pricing_paid_ex_tax) || 0,
        hiddenCostCore: Number(row.hidden_cost_core) || 0,
        importSystemCost: Number(row.hidden_cost_breakdown_import_system) || 0,
        retailHiddenCost: Number(row.hidden_cost_breakdown_retail_hidden) || 0,
        productValue: Number(row.hidden_cost_reference_price) || 0,
        confidence,
        category: row.merchant_category || "other",
        merchantId: row.merchant_place_id ?? undefined,
      } as ReceiptSummary;
    });
  } catch (error: any) {
    console.error("[storage-db] getReceiptsAllForInsights failed:", error);
    const allReceipts = await getAllReceiptsFile();
    const { receiptToSummary } = await import("@/lib/insights/compute");
    return allReceipts
      .filter((r) => (r.expenseType ?? "personal") === "personal")
      .slice(offset, offset + limit)
      .map((r) => receiptToSummary(r))
      .filter(Boolean);
  }
}

/**
 * Lightweight fetch for Insights by date range (no receipt_data).
 */
export async function getReceiptsByDateRangeForInsights(
  username: string,
  start: Date,
  end: Date
): Promise<ReceiptSummary[]> {
  if (!isDatabaseAvailable() || !sql) {
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter(
      (r) => r.username === username && (r.expenseType ?? "personal") === "personal"
    );
    const sliced = filtered.filter((r) => {
      const d = (r.extraction?.date?.value as string) || (r as any).createdAt;
      if (!d) return false;
      const t = new Date(d).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const { receiptToSummary } = await import("@/lib/insights/compute");
    return sliced.map((r) => receiptToSummary(r)).filter(Boolean);
  }

  const dbSql = sql;
  await warmUpConnection();

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  try {
    const rows = await withRetry(async () => {
      return await dbSql`
        SELECT
          receipt_id,
          merchant_name,
          merchant_country,
          merchant_category,
          merchant_place_id,
          extraction_date_value,
          extraction_time_value,
          created_at,
          pricing_total_paid,
          pricing_vat_amount,
          pricing_paid_ex_tax,
          pricing_currency,
          hidden_cost_core,
          hidden_cost_breakdown_import_system,
          hidden_cost_breakdown_retail_hidden,
          hidden_cost_reference_price,
          status,
          flags_rejected
        FROM receipts
        WHERE username = ${username}
          AND COALESCE(expense_type, 'personal') = 'personal'
          AND (
            (extraction_date_value IS NOT NULL AND extraction_date_value != ''
              AND extraction_date_value >= ${startStr} AND extraction_date_value <= ${endStr})
            OR
            ((extraction_date_value IS NULL OR extraction_date_value = '')
              AND created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()})
          )
        ORDER BY created_at DESC
      `;
    });

    return (Array.isArray(rows) ? rows : []).map((row: any) => {
      const confidence: "verified" | "low" | "rejected" =
        row.status === "verified" || row.status === "saved"
          ? "verified"
          : row.flags_rejected || row.status === "rejected"
          ? "rejected"
          : "low";
      const dateVal = row.extraction_date_value || (row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      return {
        id: row.receipt_id,
        merchantName: row.merchant_name || "Unknown",
        country: row.merchant_country || "US",
        currency: row.pricing_currency || "USD",
        date: typeof dateVal === "string" ? dateVal.slice(0, 10) : dateVal,
        time: row.extraction_time_value ?? undefined,
        totalPaid: Number(row.pricing_total_paid) || 0,
        taxAmount: Number(row.pricing_vat_amount) || 0,
        paidExTax: Number(row.pricing_paid_ex_tax) || 0,
        hiddenCostCore: Number(row.hidden_cost_core) || 0,
        importSystemCost: Number(row.hidden_cost_breakdown_import_system) || 0,
        retailHiddenCost: Number(row.hidden_cost_breakdown_retail_hidden) || 0,
        productValue: Number(row.hidden_cost_reference_price) || 0,
        confidence,
        category: row.merchant_category || "other",
        merchantId: row.merchant_place_id ?? undefined,
      } as ReceiptSummary;
    });
  } catch (error: any) {
    console.error("[storage-db] getReceiptsByDateRangeForInsights failed:", error);
    const allReceipts = await getAllReceiptsFile();
    const filtered = allReceipts.filter(
      (r) => r.username === username && (r.expenseType ?? "personal") === "personal"
    );
    const sliced = filtered.filter((r) => {
      const d = (r.extraction?.date?.value as string) || (r as any).createdAt;
      if (!d) return false;
      const t = new Date(d).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const { receiptToSummary } = await import("@/lib/insights/compute");
    return sliced.map((r) => receiptToSummary(r)).filter(Boolean);
  }
}

/**
 * Lite mapper: denormalized columns + receipt_rewards JOIN → partial ReceiptAnalysis shape.
 * All fields are readable by convertReceiptAnalysisToReceipt.
 */
function rowToLiteReceiptAnalysis(row: any): ReceiptAnalysis {
  const dateVal =
    row.extraction_date_value ||
    (row.created_at
      ? new Date(row.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10));
  return {
    receiptId: row.receipt_id,
    username: row.username,
    status: row.status || "pending",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    merchant: {
      name: row.merchant_name || "Unknown",
      country: row.merchant_country || undefined,
      category: row.merchant_category || undefined,
      placeId: row.merchant_place_id || undefined,
    },
    extraction: {
      date: { value: typeof dateVal === "string" ? dateVal.slice(0, 10) : String(dateVal), confidence: 0, sourceLine: 0 },
      time: row.extraction_time_value ? { value: row.extraction_time_value, confidence: 0, sourceLine: 0 } : undefined,
      total: { value: Number(row.pricing_total_paid) || 0, confidence: 0, sourceLine: 0 },
    },
    pricing: {
      totalPaid: Number(row.pricing_total_paid) || 0,
      vatAmount: Number(row.pricing_vat_amount) || 0,
      paidExTax: Number(row.pricing_paid_ex_tax) || 0,
      currency: row.pricing_currency || "TRY",
    },
    hiddenCost: {
      hiddenCostCore: Number(row.hidden_cost_core) || 0,
      referencePrice: Number(row.hidden_cost_reference_price) || 0,
      breakdown: {
        importSystemCost: Number(row.hidden_cost_breakdown_import_system) || 0,
        retailHiddenCost: Number(row.hidden_cost_breakdown_retail_hidden) || 0,
        items: [],
      },
    },
    rewards: {
      ayumo_amount:
        row.reward_final != null
          ? Number(row.reward_final) || 0
          : Number(row.ayumo_amount ?? 0) || 0,
      ryumo_bonus_amount: Number(row.ryumo_bonus_amount) || 0,
    },
    expenseType:
      row.expense_type === "other" ? "other" : "personal",
    // display_name (admin JOIN'den gelir, user path'te undefined)
    ...( row.display_name != null ? { displayName: row.display_name } : {} ),
  } as unknown as ReceiptAnalysis;
}

/**
 * Lite receipt list (for a given user) — does not read receipt_data JSONB.
 * Uses denormalized columns + a receipt_rewards JOIN.
 * ~10x faster for the list page.
 */
export async function getAllReceiptsListLite(
  username: string,
  limit: number = 10,
  offset: number = 0,
  search: string = "",
  statusValues: string[] = [],
  expenseFilter: ReceiptExpenseFilter = null
): Promise<ReceiptAnalysis[]> {
  if (!isDatabaseAvailable() || !sql) {
    const all = await getAllReceipts(username, limit, offset, search, statusValues);
    return expenseFilter
      ? all.filter((r) => (r.expenseType ?? "personal") === expenseFilter)
      : all;
  }

  await warmUpConnection();

  try {
    const rows = await withRetry(async () => {
      return fetchCombinedUserReceiptsLite({
        username,
        limit,
        offset,
        search,
        statusValues,
        expenseFilter,
      });
    });

    return rows.map(rowToLiteReceiptAnalysis);
  } catch (error: any) {
    console.error("[storage-db] getAllReceiptsListLite failed, falling back:", error);
    return getAllReceipts(username, limit, offset, search, statusValues);
  }
}

/**
 * Lite receipt list (admin — all users) — does not read receipt_data JSONB.
 * Also fetches display_name via a user_profiles JOIN (no need for enrichReceiptsWithDisplayNames).
 */
export async function getAllReceiptsAllListLite(
  limit: number = 10,
  offset: number = 0,
  search: string = "",
  statusValues: string[] = []
): Promise<ReceiptAnalysis[]> {
  if (!isDatabaseAvailable() || !sql) {
    return getAllReceiptsAll(limit, offset, search, statusValues);
  }

  const dbSql = sql;
  await warmUpConnection();

  try {
    const searchTrimmed = search.trim();
    const searchPattern = searchTrimmed ? `%${searchTrimmed}%` : null;

    const rows = await withRetry(async () => {
      if (statusValues.length > 0 && searchPattern) {
        return await dbSql`
          SELECT
            r.receipt_id, r.username, r.status, r.created_at,
            r.merchant_name, r.merchant_country, r.merchant_category, r.merchant_place_id,
            r.extraction_date_value, r.extraction_time_value,
            r.pricing_total_paid, r.pricing_vat_amount, r.pricing_paid_ex_tax, r.pricing_currency,
            r.hidden_cost_core, r.hidden_cost_breakdown_import_system,
            r.hidden_cost_breakdown_retail_hidden, r.hidden_cost_reference_price,
            rr.bint_amount AS ayumo_amount, rr.bint_bonus_amount AS ryumo_bonus_amount, r.reward_final,
            up.display_name
          FROM receipts r
          LEFT JOIN receipt_rewards rr ON r.receipt_id = rr.receipt_id
          LEFT JOIN user_profiles up ON r.username = up.username
          WHERE r.status = ANY(${statusValues})
            AND (
              r.receipt_id ILIKE ${searchPattern}
              OR r.merchant_name ILIKE ${searchPattern}
              OR r.username ILIKE ${searchPattern}
            )
          ORDER BY r.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (statusValues.length > 0) {
        return await dbSql`
          SELECT
            r.receipt_id, r.username, r.status, r.created_at,
            r.merchant_name, r.merchant_country, r.merchant_category, r.merchant_place_id,
            r.extraction_date_value, r.extraction_time_value,
            r.pricing_total_paid, r.pricing_vat_amount, r.pricing_paid_ex_tax, r.pricing_currency,
            r.hidden_cost_core, r.hidden_cost_breakdown_import_system,
            r.hidden_cost_breakdown_retail_hidden, r.hidden_cost_reference_price,
            rr.bint_amount AS ayumo_amount, rr.bint_bonus_amount AS ryumo_bonus_amount, r.reward_final,
            up.display_name
          FROM receipts r
          LEFT JOIN receipt_rewards rr ON r.receipt_id = rr.receipt_id
          LEFT JOIN user_profiles up ON r.username = up.username
          WHERE r.status = ANY(${statusValues})
          ORDER BY r.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (searchPattern) {
        return await dbSql`
          SELECT
            r.receipt_id, r.username, r.status, r.created_at,
            r.merchant_name, r.merchant_country, r.merchant_category, r.merchant_place_id,
            r.extraction_date_value, r.extraction_time_value,
            r.pricing_total_paid, r.pricing_vat_amount, r.pricing_paid_ex_tax, r.pricing_currency,
            r.hidden_cost_core, r.hidden_cost_breakdown_import_system,
            r.hidden_cost_breakdown_retail_hidden, r.hidden_cost_reference_price,
            rr.bint_amount AS ayumo_amount, rr.bint_bonus_amount AS ryumo_bonus_amount, r.reward_final,
            up.display_name
          FROM receipts r
          LEFT JOIN receipt_rewards rr ON r.receipt_id = rr.receipt_id
          LEFT JOIN user_profiles up ON r.username = up.username
          WHERE (
            r.receipt_id ILIKE ${searchPattern}
            OR r.merchant_name ILIKE ${searchPattern}
            OR r.username ILIKE ${searchPattern}
          )
          ORDER BY r.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        return await dbSql`
          SELECT
            r.receipt_id, r.username, r.status, r.created_at,
            r.merchant_name, r.merchant_country, r.merchant_category, r.merchant_place_id,
            r.extraction_date_value, r.extraction_time_value,
            r.pricing_total_paid, r.pricing_vat_amount, r.pricing_paid_ex_tax, r.pricing_currency,
            r.hidden_cost_core, r.hidden_cost_breakdown_import_system,
            r.hidden_cost_breakdown_retail_hidden, r.hidden_cost_reference_price,
            rr.bint_amount AS ayumo_amount, rr.bint_bonus_amount AS ryumo_bonus_amount, r.reward_final,
            up.display_name
          FROM receipts r
          LEFT JOIN receipt_rewards rr ON r.receipt_id = rr.receipt_id
          LEFT JOIN user_profiles up ON r.username = up.username
          ORDER BY r.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }
    });

    return (Array.isArray(rows) ? rows : []).map(rowToLiteReceiptAnalysis);
  } catch (error: any) {
    console.error("[storage-db] getAllReceiptsAllListLite failed, falling back:", error);
    return getAllReceiptsAll(limit, offset, search, statusValues);
  }
}

export async function getReceiptById(
  receiptId: string,
  username?: string,
  isAdmin: boolean = false
): Promise<ReceiptAnalysis | null> {
  const dbSql = getSql();
  if (!isDatabaseAvailable() || !dbSql) {
    console.warn("[getReceiptById] DATABASE_URL not set or getSql() null, using file storage for id:", receiptId?.slice(0, 8) + "...");
    const receipt = await getReceiptByIdFile(receiptId);
    if (receipt && username && !isAdmin && receipt.username !== username) {
      return null;
    }
    return receipt;
  }

  const idTrimmed = receiptId?.trim() ?? receiptId;
  const idLower = idTrimmed.toLowerCase();
  try {
    const receipt = await withRetry(async () => {
      // Try exact match first, then case-insensitive (UUID can be stored in different cases)
      let rows = await dbSql`
        SELECT receipt_data, username, receipt_id
        FROM receipts 
        WHERE receipt_id = ${idTrimmed}
        LIMIT 1
      `;
      if (rows.length === 0) {
        rows = await dbSql`
          SELECT receipt_data, username, receipt_id
          FROM receipts 
          WHERE LOWER(TRIM(receipt_id::text)) = ${idLower}
          LIMIT 1
        `;
      }
      
      if (rows.length === 0) {
        console.warn("[getReceiptById] No row in receipts table for id:", idTrimmed);
        return await getOtherExpenseReceiptById(idTrimmed, username, isAdmin);
      }
      
      const r = dbRowToReceipt(rows[0]);
      return r;
    });
    
    if (!receipt) {
      return null;
    }
    
    if (username && !isAdmin && receipt.username !== username) {
      return null;
    }
    
    // Optional: attach blob_url if column exists (for admin image download)
    try {
      let blobRows = await dbSql`
        SELECT blob_url FROM receipts WHERE receipt_id = ${idTrimmed} LIMIT 1
      `;
      if (blobRows.length === 0) {
        blobRows = await dbSql`
          SELECT blob_url FROM receipts WHERE LOWER(TRIM(receipt_id::text)) = ${idLower} LIMIT 1
        `;
      }
      if (blobRows.length > 0 && blobRows[0].blob_url) {
        (receipt as any).blobUrl = blobRows[0].blob_url;
      }
    } catch {
      // blob_url column may not exist yet; ignore
    }

    // Attach receipt_rewards if available (base/extra reward, hidden cost breakdown)
    try {
      const rewardRows = await dbSql`
        SELECT
          base_reward_amount,
          extra_reward_amount,
          bint_amount AS ayumo_amount,
          bint_bonus_amount AS ryumo_bonus_amount,
          base_hidden_cost,
          final_hidden_cost,
          reward_version,
          created_at,
          updated_at
        FROM receipt_rewards
        WHERE receipt_id = ${idTrimmed}
        LIMIT 1
      `;
      if (rewardRows.length > 0) {
        const rw = rewardRows[0];
        (receipt as ReceiptAnalysis).rewards = {
          base_reward_amount:  Number(rw.base_reward_amount  ?? 0),
          extra_reward_amount: Number(rw.extra_reward_amount ?? 0),
          ayumo_amount:        Number(rw.ayumo_amount        ?? 0),
          ryumo_bonus_amount:  rw.ryumo_bonus_amount != null ? Number(rw.ryumo_bonus_amount) : null,
          base_hidden_cost:    rw.base_hidden_cost  != null ? Number(rw.base_hidden_cost)  : null,
          final_hidden_cost:   rw.final_hidden_cost != null ? Number(rw.final_hidden_cost) : null,
          reward_version:      Number(rw.reward_version ?? 1),
          created_at:          rw.created_at  ? new Date(rw.created_at).toISOString()  : null,
          updated_at:          rw.updated_at  ? new Date(rw.updated_at).toISOString()  : null,
        };
      }
    } catch {
      // receipt_rewards table may not exist yet; ignore
    }

    // Attach client-safe line items (receipt_line_items) for the detail page.
    // No hidden-cost decomposition — only raw printed data.
    try {
      const itemRows = await dbSql`
        SELECT
          id,
          raw_name,
          canonical_name,
          display_name_tr,
          brand,
          brand_status,
          quantity::text AS quantity,
          unit_type,
          unit_price_gross::text AS unit_price_gross,
          line_total_gross::text AS line_total_gross
        FROM receipt_line_items
        WHERE receipt_id = ${idTrimmed}
        ORDER BY id ASC
      `;
      if (itemRows.length > 0) {
        (receipt as ReceiptAnalysis).lineItems = itemRows.map((it: any) => ({
          id: it.id != null ? Number(it.id) : null,
          rawName: String(it.raw_name ?? ""),
          canonicalName: it.canonical_name ?? null,
          displayName: it.display_name_tr ?? null,
          brand: it.brand ?? null,
          brandStatus: it.brand_status ?? null,
          quantity: it.quantity != null ? Number(it.quantity) : null,
          unitType: it.unit_type ?? null,
          unitPrice: it.unit_price_gross != null ? Number(it.unit_price_gross) : null,
          lineTotal: it.line_total_gross != null ? Number(it.line_total_gross) : null,
        }));
      }
    } catch {
      // receipt_line_items table may not exist yet; ignore
    }

    return receipt;
  } catch (error) {
    console.error("[storage-db] Failed to fetch receipt from database after retries:", error);
    const receipt = await getReceiptByIdFile(receiptId);
    if (receipt && username && !isAdmin && receipt.username !== username) {
      return null;
    }
    return receipt;
  }
}

export interface ReceiptLogRow {
  receiptId: string;
  blobFilename: string | null;
  pipelineLog: string;
  createdAt: string;
  merchantName: string | null;
}

/**
 * Get receipts that have pipeline logs (for admin bulk log download).
 * Returns lightweight rows: receiptId, blobFilename, pipelineLog, createdAt, merchantName.
 */
export async function getReceiptLogsForAdmin(
  hours: number = 48,
  limit: number = 500
): Promise<ReceiptLogRow[]> {
  if (!isDatabaseAvailable() || !sql) {
    return [];
  }

  const dbSql = sql;
  await warmUpConnection();

  const hoursInt = Math.min(720, Math.max(1, hours));
  const limitInt = Math.min(1000, Math.max(1, limit));

  try {
    const rows = await dbSql`
      SELECT receipt_id,
        receipt_data->>'blobFilename' as blob_filename,
        receipt_data->>'pipelineLog' as pipeline_log,
        created_at,
        receipt_data->'merchant'->>'name' as merchant_name
      FROM receipts
      WHERE created_at >= now() - ${hoursInt} * interval '1 hour'
      AND receipt_data->>'pipelineLog' IS NOT NULL
      AND trim(coalesce(receipt_data->>'pipelineLog', '')) != ''
      ORDER BY created_at DESC
      LIMIT ${limitInt}
    `;

    return (rows as any[]).map((r) => ({
      receiptId: r.receipt_id,
      blobFilename: r.blob_filename || null,
      pipelineLog: r.pipeline_log || "",
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : "",
      merchantName: r.merchant_name || null,
    }));
  } catch (error) {
    console.error("[storage-db] getReceiptLogsForAdmin error:", error);
    return [];
  }
}

export interface ReceiptOcrRow {
  receiptId: string;
  blobFilename: string | null;
  ocrRawText: string;
  createdAt: string;
  merchantName: string | null;
}

const MAX_OCR_DOWNLOAD = 1000;

/**
 * Get receipts with raw OCR text for admin bulk OCR download.
 * Returns at most MAX_OCR_DOWNLOAD (1000) rows. Used for RAW OCR export by time range.
 */
export async function getReceiptOcrForAdmin(
  hours: number = 48,
  limit: number = MAX_OCR_DOWNLOAD
): Promise<ReceiptOcrRow[]> {
  if (!isDatabaseAvailable() || !sql) {
    return [];
  }

  const dbSql = sql;
  await warmUpConnection();

  const hoursInt = Math.min(720, Math.max(1, hours));
  const limitInt = Math.min(MAX_OCR_DOWNLOAD, Math.max(1, limit));

  try {
    const rows = await dbSql`
      SELECT receipt_id,
        receipt_data->>'blobFilename' as blob_filename,
        coalesce(ocr_raw_text, '') as ocr_raw_text,
        created_at,
        receipt_data->'merchant'->>'name' as merchant_name
      FROM receipts
      WHERE created_at >= now() - ${hoursInt} * interval '1 hour'
      AND ocr_raw_text IS NOT NULL
      AND trim(ocr_raw_text) != ''
      ORDER BY created_at DESC
      LIMIT ${limitInt}
    `;

    return (rows as any[]).map((r) => ({
      receiptId: r.receipt_id,
      blobFilename: r.blob_filename || null,
      ocrRawText: r.ocr_raw_text || "",
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : "",
      merchantName: r.merchant_name || null,
    }));
  } catch (error) {
    console.error("[storage-db] getReceiptOcrForAdmin error:", error);
    return [];
  }
}
