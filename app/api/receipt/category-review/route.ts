import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin-users";
import { getReceiptById } from "@/lib/receipt/storage-db";
import {
  insertCategoryReview,
  isValidSuggestedCategory,
} from "@/lib/receipt/db/queries/category-review";

/**
 * User submits a category for a receipt that was classified as "other".
 * The pick is queued for admin review and is NOT applied to the receipt here.
 */
export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { receiptId, category } = body as {
      receiptId?: string;
      category?: string;
    };

    if (!receiptId || typeof receiptId !== "string" || receiptId.trim() === "") {
      return NextResponse.json({ error: "receiptId is required" }, { status: 400 });
    }

    if (!isValidSuggestedCategory(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Verify the user owns this receipt (admins may also submit).
    const isAdmin = isAdminUser(username);
    const receipt = await getReceiptById(receiptId.trim(), username, isAdmin);
    if (!receipt) {
      console.warn("[api/receipt/category-review] Receipt not found:", {
        receiptId: receiptId.trim(),
        username,
        isAdmin,
      });
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const currentCategory = receipt.merchant?.category ?? null;

    const row = await insertCategoryReview(
      receiptId.trim(),
      username,
      category,
      currentCategory
    );

    return NextResponse.json({
      id: row.id,
      receiptId: row.receipt_id,
      suggestedCategory: row.suggested_category,
      status: row.status,
      createdAt: row.created_at,
    });
  } catch (error: any) {
    console.error("[api/receipt/category-review] POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit category" },
      { status: 500 }
    );
  }
}
