import { NextResponse } from "next/server";
import { z } from "zod";
import { getReceiptById, getReceiptsByDateRange, getReceiptsForInsights, getReceiptsAllForInsights, getReceiptsByDateRangeForInsights, saveReceipt } from "@/lib/receipt/storage-db";
import { getReceiptCount, getReceiptCountAll, getAllReceiptsListLite, getAllReceiptsAllListLite } from "@/lib/receipt/db/queries/select";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
import { getSql, warmUpConnection } from "@/lib/db/client";
import { getSessionUsername } from "@/lib/auth/session";
import { updateDailyQuestProgressOnReceiptSaved } from "@/lib/quests/update-progress-on-receipt";
import { isAdminUser } from "@/lib/auth/admin-users";
import {
  mergeProtectedReceiptFields,
  sanitizeReceiptForClient,
  sanitizeReceiptsForClient,
} from "@/lib/receipt/public-response";
import {
  buildMobileActionResultForUser,
  createMobileLevelEvent,
  getMobileLevelSnapshot,
} from "@/lib/mobile/server-data";
import { upsertOtherExpenseReceipt } from "@/lib/receipt/db/other-expense";

/** Adds user_profiles.display_name (display name) to each record in the receipt list. */
async function enrichReceiptsWithDisplayNames(receipts: (ReceiptAnalysis & { displayName?: string | null })[]): Promise<(ReceiptAnalysis & { displayName?: string | null })[]> {
  const usernames = [...new Set(receipts.map((r) => r.username).filter(Boolean))] as string[];
  if (usernames.length === 0) return receipts;
  const sql = getSql();
  if (!sql) return receipts;
  try {
    await warmUpConnection();
    const rows = await sql`
      SELECT username, display_name
      FROM user_profiles
      WHERE username = ANY(${usernames})
    `;
    const map = new Map<string, string>();
    for (const row of Array.isArray(rows) ? rows : (rows as { rows?: { username: string; display_name: string | null }[] }).rows ?? []) {
      const r = row as { username: string; display_name: string | null };
      if (r.display_name) map.set(r.username, r.display_name);
    }
    return receipts.map((r) => ({ ...r, displayName: r.username ? map.get(r.username) ?? null : null }));
  } catch {
    return receipts;
  }
}


// Zod schema: validates critical fields of the client-supplied receipt POST body.
// Uses .passthrough() so optional/future fields are not rejected.
const ReceiptPostSchema = z.object({
  receiptId: z.string().uuid("receiptId must be a valid UUID"),
  status: z.enum(["draft", "verified", "saved", "rejected", "pending", "analyzed", "scanned"]),
  merchant: z.object({
    name: z.string().min(1).max(500),
    category: z.string().max(200).optional(),
    country: z.string().max(10).optional(),
    channel: z.string().max(100).optional(),
  }).passthrough(),
  extraction: z.object({
    date: z.object({ value: z.string(), confidence: z.number() }).passthrough(),
    total: z.object({ value: z.number(), confidence: z.number() }).passthrough(),
    vat: z.object({ value: z.number(), confidence: z.number() }).passthrough(),
  }).passthrough(),
  pricing: z.object({
    totalPaid: z.number(),
    vatAmount: z.number(),
    paidExTax: z.number(),
    paidPriceExTax: z.number(),
    stateLayerTax: z.number(),
    importSystemRate: z.number(),
    retailHiddenRate: z.number(),
  }).passthrough(),
}).passthrough();

export async function GET(req: Request) {
  try {
    const username = await getSessionUsername();

    if (!username) {
      console.warn("[api/receipts] No username found in session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters for pagination and optional time range (for Insights)
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("timeRange") || null; // "7d" | "30d" | "90d" | "all" | null
    const forInsights = searchParams.get("forInsights") === "true"; // Slim ReceiptSummary payload for Insights page
    const page = parseInt(searchParams.get("page") || "1", 10); // Default page 1
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10); // Default 10 per page
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("statusFilter") || ""; // UI status value
    const expenseFilterRaw = searchParams.get("expenseFilter") || "";
    const expenseFilter =
      expenseFilterRaw === "other" || expenseFilterRaw === "personal"
        ? expenseFilterRaw
        : null;
    const maxPageSize = 1000; // Safety limit (Insights may request many when timeRange=all)

    // Map UI status values to DB status values
    function mapStatusToDbValues(uiStatus: string): string[] {
      switch (uiStatus) {
        case "VERIFIED": return ["verified", "saved"];
        case "analyzed": return ["analyzed"];
        case "REJECTED": return ["rejected"];
        case "PENDING": return ["pending"];
        case "scanned": return ["scanned"];
        case "verifiedOnly": return ["verified", "saved", "analyzed", "rewarded_other"];
        case "rewarded_other": return ["rewarded_other"];
        default: return [];
      }
    }
    const statusValues = mapStatusToDbValues(statusFilter);
    const safePageSize = Math.min(Math.max(1, pageSize), maxPageSize);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safePageSize;
    const limit = safePageSize;

    const isAdmin = isAdminUser(username);

    // When timeRange is 7d/30d/90d, fetch by date range (non-admin only)
    if (!isAdmin && timeRange && ["7d", "30d", "90d"].includes(timeRange)) {
      const end = new Date();
      const start = new Date();
      if (timeRange === "7d") start.setDate(start.getDate() - 7);
      else if (timeRange === "30d") start.setDate(start.getDate() - 30);
      else if (timeRange === "90d") start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      if (forInsights) {
        const summaries = await getReceiptsByDateRangeForInsights(username, start, end);
        return NextResponse.json({ receipts: summaries, insightsFormat: true, pagination: { page: 1, pageSize: summaries.length, total: summaries.length, totalPages: 1 } });
      }
      const userReceipts = await getReceiptsByDateRange(username, start, end);
      const enriched = await enrichReceiptsWithDisplayNames(userReceipts);
      const sanitized = sanitizeReceiptsForClient(enriched, { isAdmin });
      return NextResponse.json({
        receipts: sanitized,
        pagination: {
          page: 1,
          pageSize: sanitized.length,
          total: sanitized.length,
          totalPages: 1,
        },
      });
    }

    // Insights: lightweight path (denormalized columns only, no receipt_data)
    if (forInsights) {
      const summaries = isAdmin
        ? await getReceiptsAllForInsights(limit, offset)
        : await getReceiptsForInsights(username, limit, offset);
      return NextResponse.json({
        receipts: summaries,
        insightsFormat: true,
        pagination: { page: safePage, pageSize: safePageSize, total: summaries.length, totalPages: Math.ceil(Math.max(1, summaries.length) / safePageSize) }
      });
    }

    // Get receipts and total count (all for admin, user's own for normal users)
    // Lite path: denormalized columns only — no receipt_data JSONB read
    if (isAdmin) {
      console.log(`[api/receipts] 🔍 GET - Admin lite (page: ${safePage}, pageSize: ${safePageSize}, search: "${search}", statusFilter: "${statusFilter}")`);
      const [allReceipts, totalCount] = await Promise.all([
        getAllReceiptsAllListLite(limit, offset, search, statusValues),
        getReceiptCountAll(search, statusValues)
      ]);
      // display_name already included via user_profiles JOIN in lite query
      console.log(`[api/receipts] GET RESPONSE for admin: ${allReceipts.length} receipts (total: ${totalCount}, page: ${safePage})`);
      const sanitized = sanitizeReceiptsForClient(allReceipts, { isAdmin });
      return NextResponse.json({
        receipts: sanitized,
        pagination: {
          page: safePage,
          pageSize: safePageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / safePageSize)
        }
      });
    }

    const [userReceipts, totalCount] = await Promise.all([
      getAllReceiptsListLite(username, limit, offset, search, statusValues, expenseFilter),
      getReceiptCount(username, search, statusValues, expenseFilter)
    ]);

    console.log(`[api/receipts] GET RESPONSE for "${username}": ${userReceipts.length} receipts (total: ${totalCount}, page: ${safePage})`);

    const sanitized = sanitizeReceiptsForClient(userReceipts, { isAdmin });

    return NextResponse.json({
      receipts: sanitized,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safePageSize)
      }
    });
  } catch (error: any) {
    console.error("[api/receipts] error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch receipts",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();

    if (!username) {
      console.warn("[api/receipts] POST - No username found in session, returning 401");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rawBody = await req.json();
    const parsed = ReceiptPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid receipt data", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    let receipt: ReceiptAnalysis = parsed.data as unknown as ReceiptAnalysis;
    const isAdmin = isAdminUser(username);

    // Add username to receipt
    receipt.username = username;
    receipt.createdAt = new Date().toISOString();
    
    console.log("[api/receipts] POST request:", {
      receiptId: receipt.receiptId,
      username: username,
      receiptUsername: receipt.username,
      status: receipt.status
    });
    
    let existingReceipt: ReceiptAnalysis | null = null;
    if (!isAdmin) {
      existingReceipt = await getReceiptById(receipt.receiptId, username, false);
      receipt = mergeProtectedReceiptFields(receipt, existingReceipt);
    } else {
      existingReceipt = await getReceiptById(receipt.receiptId, username, true);
    }

    // Idempotency: if the row is already in a terminal state (verified/saved/
    // rewarded_other) and the client is asking for the same-or-weaker state,
    // skip the heavy save path. This prevents the 16-second double-POST we saw
    // when the claim screen re-fires handleSave (e.g. React re-mount).
    const incomingStatus = receipt.status;
    const existingStatus = (existingReceipt as any)?.status as string | undefined;
    const TERMINAL = new Set(["verified", "saved", "rewarded_other"]);
    const isIdempotentRepeat =
      existingStatus &&
      TERMINAL.has(existingStatus) &&
      (incomingStatus === existingStatus ||
        (existingStatus === "verified" && incomingStatus === "saved") ||
        (existingStatus === "saved" && incomingStatus === "verified"));

    if (isIdempotentRepeat && existingReceipt) {
      // The analyze step persists + auto-verifies the row WITHOUT a wallet
      // (the wallet only reaches this save call). When the row is already
      // terminal we skip the heavy save path — but the wallet must still be
      // stamped, or the user can never enter a reward epoch (build-epoch
      // requires a receipt with wallet_address). Persist it here before skipping.
      const incomingWallet =
        typeof receipt.walletAddress === "string" ? receipt.walletAddress.trim() : "";
      const existingWallet = (existingReceipt as { walletAddress?: string | null }).walletAddress;
      if (incomingWallet && !existingWallet) {
        try {
          const sql = getSql();
          if (sql) {
            await warmUpConnection();
            await sql`
              UPDATE receipts SET wallet_address = ${incomingWallet}, updated_at = now()
              WHERE receipt_id = ${receipt.receiptId} AND username = ${username}
                AND wallet_address IS NULL
            `;
            (existingReceipt as { walletAddress?: string | null }).walletAddress = incomingWallet;
          }
        } catch (walletErr) {
          console.warn("[api/receipts] wallet stamp on idempotent skip failed:", walletErr);
        }
      }
      console.log("[api/receipts] ⏭ Idempotent skip:", {
        receiptId: receipt.receiptId,
        existingStatus,
        incomingStatus,
        walletStamped: Boolean(incomingWallet && !existingWallet),
      });
      return NextResponse.json({
        ...sanitizeReceiptForClient(existingReceipt, { isAdmin }),
        actionResult: await buildMobileActionResultForUser(username, { levelEvent: null }),
      });
    }

    const isOtherExpense = receipt.expenseType === "other";
    const beforeLevels = await getMobileLevelSnapshot(username);
    const saved = isOtherExpense
      ? await (async () => {
          const payload: ReceiptAnalysis = {
            ...receipt,
            status: "rewarded_other",
            expenseType: "other",
          };
          const persisted = await saveReceipt(payload);
          await upsertOtherExpenseReceipt(persisted);
          return persisted;
        })()
      : await saveReceipt(receipt);

    // Daily quest progress: updates category (D3/D4) and merchant (D7/D8) counts
    // Awaited so the DB is updated before the response is returned
    if (!isOtherExpense) {
      await updateDailyQuestProgressOnReceiptSaved(username).catch((err) =>
        console.warn("[api/receipts] Quest progress update failed:", err)
      );
    }
    const afterLevels = await getMobileLevelSnapshot(username);
    const levelEvent = createMobileLevelEvent(beforeLevels, afterLevels);

    console.log("[api/receipts] POST response:", {
      receiptId: saved.receiptId,
      savedUsername: saved.username,
      status: saved.status
    });

    return NextResponse.json({
      ...sanitizeReceiptForClient(saved, { isAdmin }),
      actionResult: await buildMobileActionResultForUser(username, { levelEvent }),
    });
  } catch (error: any) {
    console.error("[api/receipts] error:", error);
    return NextResponse.json(
      {
        error: "Failed to save receipt",
      },
      { status: 500 }
    );
  }
}
