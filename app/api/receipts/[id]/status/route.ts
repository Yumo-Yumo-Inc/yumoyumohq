import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getSessionUsername } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin-users";

/**
 * Lightweight status endpoint used by the analyzing UI to poll for
 * completion. Unlike `/api/receipts/[id]` (which only knows about the
 * `receipts` table) this endpoint also looks at `other_expense_receipts`
 * so that "other"-type receipts still complete the polling
 * loop instead of returning 404 forever.
 *
 * Response shape:
 *   { status: "scanned" | "analyzed" | "verified" | "rejected" | "rewarded_other" | "not_found",
 *     expenseType: "personal" | "other" | null,
 *     visible: boolean,                 // true when the receipt should appear in the user's list
 *     finished: boolean }               // true when the pipeline has reached a terminal state
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const trimmed = id?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const isAdmin = isAdminUser(username);

  try {
    // 1) Primary path: the receipts table (visible to the user).
    const primary = await db.query<{
      status: string;
      expense_type: string | null;
      username: string;
    }>(
      `SELECT status, expense_type, username
         FROM receipts
        WHERE receipt_id = $1
        LIMIT 1`,
      [trimmed]
    );
    const primaryRow = primary.rows?.[0];
    if (primaryRow) {
      if (!isAdmin && primaryRow.username !== username) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const status = String(primaryRow.status || "scanned");
      // Contribution points (cPoints) for this receipt are written by
      // post-process (background) after analyze responds, so the upload screen
      // polls this endpoint to surface the real per-receipt cPoints once ready.
      let contributionPoints: number | null = null;
      try {
        const cp = await db.query<{ points_delta: string | number }>(
          `SELECT points_delta
             FROM contribution_point_events
            WHERE reference_id = $1 AND source_type = 'receipt_verified'
            LIMIT 1`,
          [trimmed]
        );
        if (cp.rows?.[0]?.points_delta != null) {
          contributionPoints = Number(cp.rows[0].points_delta) || 0;
        }
      } catch {
        contributionPoints = null;
      }
      return NextResponse.json({
        status,
        expenseType: primaryRow.expense_type ?? "personal",
        visible: true,
        finished: isTerminal(status),
        contributionPoints,
      });
    }

    // 2) Other-expense archive (legacy rows not yet in receipts).
    const other = await db.query<{
      status: string;
      username: string;
    }>(
      `SELECT status, username
         FROM other_expense_receipts
        WHERE receipt_id = $1
        LIMIT 1`,
      [trimmed]
    );
    const otherRow = other.rows?.[0];
    if (otherRow) {
      if (!isAdmin && otherRow.username !== username) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const status = String(otherRow.status || "rewarded_other");
      return NextResponse.json({
        status,
        expenseType: "other",
        visible: true,
        finished: true,
      });
    }

    return NextResponse.json({
      status: "not_found",
      expenseType: null,
      visible: false,
      finished: false,
    });
  } catch (err: any) {
    console.error("[api/receipts/[id]/status] query failed:", err?.message);
    return NextResponse.json(
      { error: "Failed to read status" },
      { status: 500 }
    );
  }
}

function isTerminal(status: string): boolean {
  return ["analyzed", "verified", "rejected", "rewarded_other"].includes(status);
}
