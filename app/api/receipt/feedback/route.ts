import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  insertReceiptFeedback,
  validateBugTypes,
} from "@/lib/receipt/db/queries/feedback";

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { receiptId, bugTypes } = body as { receiptId?: string; bugTypes?: string[] };

    if (!receiptId || typeof receiptId !== "string" || receiptId.trim() === "") {
      return NextResponse.json(
        { error: "receiptId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(bugTypes) || bugTypes.length === 0) {
      return NextResponse.json(
        { error: "At least one bug type is required" },
        { status: 400 }
      );
    }

    if (!validateBugTypes(bugTypes)) {
      return NextResponse.json(
        { error: "Invalid bug type(s)" },
        { status: 400 }
      );
    }

    const row = await insertReceiptFeedback(
      receiptId.trim(),
      username,
      bugTypes
    );

    return NextResponse.json({
      id: row.id,
      receiptId: row.receipt_id,
      bugTypes: row.bug_types,
      createdAt: row.created_at,
    });
  } catch (error: any) {
    console.error("[api/receipt/feedback] POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit feedback",
      },
      { status: 500 }
    );
  }
}
