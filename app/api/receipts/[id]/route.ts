import { NextResponse } from "next/server";
import { getReceiptById, saveReceipt, deleteReceipt } from "@/lib/receipt/storage-db";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
import { getSessionUsername } from "@/lib/auth/session";
import { mergeProtectedReceiptFields, sanitizeReceiptForClient } from "@/lib/receipt/public-response";
import { updateDailyQuestProgressOnReceiptSaved } from "@/lib/quests/update-progress-on-receipt";

// Admin users list
import { isAdminUser } from "@/lib/auth/admin-users";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get username from cookie
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const idTrimmed = id?.trim() ?? id;
    
    // Check if admin - admin can view any receipt
    const isAdmin = isAdminUser(username);
    
    // Pass username and isAdmin to verify ownership (admin bypasses ownership check)
    const receipt = await getReceiptById(idTrimmed, username, isAdmin);
    
    if (!receipt) {
      console.warn("[api/receipts/[id]] Receipt not found:", { receiptId: idTrimmed, username, isAdmin });
      return NextResponse.json(
        { error: "Receipt not found", receiptId: idTrimmed },
        { status: 404 }
      );
    }

    return NextResponse.json(sanitizeReceiptForClient(receipt, { isAdmin }));
  } catch (error: any) {
    console.error("[api/receipts/[id]] GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch receipt",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get username from cookie
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if admin - admin can update any receipt
    const isAdmin = isAdminUser(username);
    
    // Verify receipt exists and belongs to user (admin bypasses ownership check)
    const existingReceipt = await getReceiptById(id, username, isAdmin);
    if (!existingReceipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    let receipt: ReceiptAnalysis = {
      ...body, 
      receiptId: id,
      username: username // Ensure username is preserved
    };

    if (!isAdmin) {
      receipt = mergeProtectedReceiptFields(receipt, existingReceipt);
    }

    const saved = await saveReceipt(receipt);

    await updateDailyQuestProgressOnReceiptSaved(username).catch((err) =>
      console.warn("[api/receipts/[id]] Quest progress update failed:", err)
    );

    return NextResponse.json(sanitizeReceiptForClient(saved, { isAdmin }));
  } catch (error: any) {
    console.error("[api/receipts/[id]] PUT error:", error);
    return NextResponse.json(
      {
        error: "Failed to update receipt",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get username from cookie
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = isAdminUser(username);
    const { id } = await params;
    
    // Admin can delete any receipt, regular users can only delete their own
    const deleted = await deleteReceipt(id, username, isAdmin);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/receipts/[id]] DELETE error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete receipt",
      },
      { status: 500 }
    );
  }
}
