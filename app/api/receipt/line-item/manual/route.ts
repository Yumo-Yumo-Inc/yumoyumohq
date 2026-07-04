/**
 * POST /api/receipt/line-item/manual
 * User completes a payment-proof document (POS slip / payment_receipt) that has
 * no line items by typing the items manually.
 *
 * Reward model (decision 2026-07-04):
 *   - base fraction was already granted at analyze time (PARTIAL_REWARD_FRACTION)
 *   - manual completion raises the reward to MANUAL_ITEMS_REWARD_FRACTION of the
 *     full estimate (reward_raw)
 *   - a later documentary match (itemized receipt upload) still unlocks the full
 *     estimate via proof matching
 *
 * Manual items are stored with source='user_manual': shown in the user's own
 * history, excluded from the anonymized data pool, never treated as verified
 * observations. Ownership is enforced in SQL (receipt must belong to the
 * session user).
 */
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
import { MANUAL_ITEMS_REWARD_FRACTION } from "@/lib/receipt/vision-post-rules";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ITEMS = 50;
const MAX_NAME_LENGTH = 120;

type ManualItemInput = {
  name?: unknown;
  quantity?: unknown;
  totalPrice?: unknown;
};

type CleanItem = {
  name: string;
  quantity: number;
  totalPrice: number | null;
};

function cleanItems(raw: unknown): CleanItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CleanItem[] = [];
  for (const entry of raw.slice(0, MAX_ITEMS) as ManualItemInput[]) {
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    if (!name || name.length > MAX_NAME_LENGTH) continue;
    const quantityNum = Number(entry?.quantity);
    const quantity =
      Number.isFinite(quantityNum) && quantityNum > 0 && quantityNum <= 999
        ? quantityNum
        : 1;
    const priceNum = Number(entry?.totalPrice);
    const totalPrice =
      Number.isFinite(priceNum) && priceNum > 0 && priceNum < 10_000_000
        ? Math.round(priceNum * 100) / 100
        : null;
    out.push({ name, quantity, totalPrice });
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const receiptId =
      typeof (body as { receiptId?: unknown }).receiptId === "string"
        ? ((body as { receiptId: string }).receiptId)
        : "";
    const items = cleanItems((body as { items?: unknown }).items);

    if (!receiptId) {
      return NextResponse.json({ error: "receiptId is required" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json(
        { error: "At least one valid item is required" },
        { status: 400 }
      );
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Ownership + state check: only a pending payment-proof document accepts
    // manual items (a matched slip is already complete).
    const rows = (await sql`
      SELECT
        r.receipt_id,
        r.proof_status,
        COALESCE(rr.bint_amount, r.reward_final, 0)::float AS reward_amount,
        r.reward_raw::float AS reward_raw
      FROM receipts r
      LEFT JOIN receipt_rewards rr ON rr.receipt_id = r.receipt_id
      WHERE r.receipt_id = ${receiptId}
        AND r.username = ${username}
        AND r.is_payment_proof = true
        AND r.proof_status = 'pending'
      LIMIT 1
    `) as Array<{
      receipt_id: string;
      proof_status: string;
      reward_amount: number | null;
      reward_raw: number | null;
    }>;

    const receipt = rows[0];
    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found or not awaiting item completion" },
        { status: 404 }
      );
    }

    for (const item of items) {
      await sql`
        INSERT INTO receipt_line_items (
          receipt_id, raw_name, quantity, line_total, line_total_gross, source
        )
        VALUES (
          ${receiptId},
          ${item.name},
          ${item.quantity},
          ${item.totalPrice},
          ${item.totalPrice},
          'user_manual'
        )
      `;
    }

    // Raise the reward from the base fraction to the manual fraction of the
    // full estimate. reward_raw holds the full pre-fraction estimate; if it is
    // missing (legacy row) the reward stays as granted — no fabrication.
    const currentReward = receipt.reward_amount ?? 0;
    const fullEstimate = receipt.reward_raw ?? 0;
    let rewardDelta = 0;
    let newFinal = currentReward;
    if (fullEstimate > 0) {
      const target =
        Math.round(fullEstimate * MANUAL_ITEMS_REWARD_FRACTION * 100) / 100;
      if (target > currentReward) {
        rewardDelta = Math.round((target - currentReward) * 100) / 100;
        newFinal = target;
      }
    }

    await sql`
      UPDATE receipts
      SET
        proof_status = 'manual_items',
        reward_final = ${newFinal},
        updated_at = now()
      WHERE receipt_id = ${receiptId}
        AND username = ${username}
        AND proof_status = 'pending'
    `;

    if (rewardDelta > 0) {
      try {
        await sql`
          UPDATE receipt_rewards
          SET
            base_reward_amount = ${newFinal},
            bint_amount = ${newFinal},
            updated_at = now()
          WHERE receipt_id = ${receiptId}
        `;
      } catch {
        // receipt_rewards row may not exist yet for fresh slips.
      }
    }

    console.log(
      `[ManualItems] ${receiptId}: ${items.length} manual items, reward ${currentReward} → ${newFinal}`
    );

    return NextResponse.json({
      ok: true,
      itemCount: items.length,
      rewardDelta,
      rewardFinal: newFinal,
      fullRewardEstimate: fullEstimate > 0 ? fullEstimate : null,
      proofStatus: "manual_items",
    });
  } catch (err) {
    console.error("[ManualItems] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
