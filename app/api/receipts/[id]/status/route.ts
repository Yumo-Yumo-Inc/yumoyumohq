import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getSessionUsername } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin-users";
import { getDailyXpReceiptLimit } from "@/lib/oracle/account-season-level";
import { parseRewardBreakdown } from "@/lib/receipt/reward-breakdown";

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
      hidden_cost_core: string | number | null;
      pricing_total_paid: string | number | null;
      hc_provenance: string | null;
      document_type: string | null;
    }>(
      `SELECT status, expense_type, username, hidden_cost_core, pricing_total_paid,
              receipt_data->'hiddenCost'->>'provenance' AS hc_provenance,
              COALESCE(document_type, receipt_data->'flags'->>'docType') AS document_type
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
      // User-visible points = contribution ledger (karar 2026-06-28).
      // bINT from receipt_rewards remains internal / fallback while post-process
      // finishes writing contribution_point_events.
      let contributionPoints: number | null = null;
      try {
        const cp = await db.query<{ points: string | number | null }>(
          `SELECT points_delta AS points
             FROM contribution_point_events
            WHERE reference_id = $1
              AND source_type = 'receipt_verified'
            LIMIT 1`,
          [trimmed]
        );
        if (cp.rows?.[0]?.points != null) {
          contributionPoints = Number(cp.rows[0].points) || 0;
        }
      } catch {
        contributionPoints = null;
      }

      let bint: number | null = null;
      let rewardBreakdown: unknown = null;
      try {
        const b = await db.query<{ amount: string | number | null; breakdown: unknown }>(
          `SELECT bint_bonus_amount AS amount, reward_breakdown AS breakdown
             FROM receipt_rewards
            WHERE receipt_id = $1
            LIMIT 1`,
          [trimmed]
        );
        if (b.rows?.[0]?.amount != null) bint = Number(b.rows[0].amount) || 0;
        rewardBreakdown = parseRewardBreakdown(b.rows?.[0]?.breakdown ?? null);
      } catch {
        bint = null;
        rewardBreakdown = null;
      }

      // Prefer contribution points once written; otherwise keep bINT estimate.
      const points =
        contributionPoints != null
          ? contributionPoints
          : bint;

      // XP earned for this receipt. Granted by trust-update in the background, so
      // it may lag the first poll. When no XP row exists yet, distinguish
      // "still computing" (null → keep polling) from "capped by the daily
      // receipt limit" (0 → resolved): if the user already hit the daily XP
      // receipt count, this receipt will never earn XP.
      let xp: number | null = null;
      try {
        const xrow = await db.query<{ xp_delta: string | number }>(
          `SELECT xp_delta
             FROM account_xp_events
            WHERE reference_id = $1 AND source_type = 'receipt_verified'
            LIMIT 1`,
          [trimmed]
        );
        if (xrow.rows?.[0]?.xp_delta != null) {
          xp = Number(xrow.rows[0].xp_delta) || 0;
        } else {
          const usedRow = await db.query<{ n: string | number }>(
            `SELECT COUNT(DISTINCT reference_id)::int AS n
               FROM account_xp_events
              WHERE username = $1
                AND source_type = 'receipt_verified'
                AND created_at >= (now() AT TIME ZONE 'UTC')::date`,
            [primaryRow.username]
          );
          const usedToday = Number(usedRow.rows?.[0]?.n) || 0;
          xp = usedToday >= getDailyXpReceiptLimit() ? 0 : null;
        }
      } catch {
        xp = null;
      }

      // Hidden cost. Upload writes a first figure from raw OCR lines;
      // post-process may replace it with the line-level result once canonical
      // resolution has run (see run-post-process "DISPLAY CORRECTION"). The
      // analyzing screen polls this so the number it shows follows that
      // correction instead of freezing on the upload estimate. Clamped to the
      // amount paid, mirroring displayHiddenCost.
      // When provenance is unavailable, return null (not 0) — 0 means
      // “no hidden cost”, unavailable means “could not compute”.
      let hiddenCost: number | null = null;
      let hiddenCostStatus: "computed" | "unavailable" | "pending" = "pending";
      const provenance = primaryRow.hc_provenance;
      if (provenance === "unavailable") {
        hiddenCost = null;
        hiddenCostStatus = "unavailable";
      } else if (primaryRow.hidden_cost_core != null) {
        const raw = Number(primaryRow.hidden_cost_core);
        const paid = Number(primaryRow.pricing_total_paid) || 0;
        if (Number.isFinite(raw) && raw >= 0) {
          hiddenCost = paid > 0 ? Math.min(raw, paid) : raw;
          hiddenCostStatus =
            raw <= 0 && !provenance ? "unavailable" : "computed";
          if (hiddenCostStatus === "unavailable") hiddenCost = null;
        }
      }

      return NextResponse.json({
        status,
        expenseType: primaryRow.expense_type ?? "personal",
        visible: true,
        finished: isTerminal(status),
        // User-facing points (contribution ledger preferred).
        bint: points,
        contributionPoints,
        rewardBreakdown,
        xp,
        hiddenCost,
        hiddenCostStatus,
        documentType: primaryRow.document_type,
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
