/**
 * Admin resolution of receipt corrections (Faz 3).
 * SERVER-ONLY. Admin-gated: approve credits a +10% bonus (and recomputes reward
 * for total/vat); reject reverts harmless immediate edits and escalates per Karar C.
 *
 * See: memory/decisions/2026-06-03-honor-tabanli-odul-ve-edit-akisi.md (Faz 3).
 */

import { sql, warmUpConnection } from "@/lib/db/client";
import { isDatabaseAvailable } from "@/lib/receipt/db/connection";
import { updateUserHonor } from "@/lib/receipt/db/user-honor";
import { runPostProcess } from "@/lib/receipt/post-process/run-post-process";
import {
  CORRECTION_BONUS_RATE,
  WRONG_CORRECTION_WINDOW_DAYS,
  WRONG_CORRECTION_HONOR_DROP_TIER,
  WRONG_CORRECTION_HONOR_PENALTY,
} from "./policy";

export interface CorrectionRow {
  id: string;
  receipt_id: string;
  username: string;
  field: string;
  old_value: string | null;
  new_value: string;
  status: string;
  affects_reward: boolean;
  applied_immediately: boolean;
  contradiction_flag: boolean;
  bonus_points: number | null;
  honor_delta: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CorrectionListItem extends CorrectionRow {
  merchant_name: string | null;
  pricing_total_paid: number | null;
  reward_final: number | null;
}

export async function listCorrections(opts: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<CorrectionListItem[]> {
  if (!isDatabaseAvailable() || !sql) return [];
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  await warmUpConnection();

  if (opts.status) {
    return (await sql`
      SELECT c.*, r.merchant_name, r.pricing_total_paid, r.reward_final
      FROM receipt_corrections c
      LEFT JOIN receipts r ON r.receipt_id = c.receipt_id
      WHERE c.status = ${opts.status}
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as CorrectionListItem[];
  }
  return (await sql`
    SELECT c.*, r.merchant_name, r.pricing_total_paid, r.reward_final
    FROM receipt_corrections c
    LEFT JOIN receipts r ON r.receipt_id = c.receipt_id
    ORDER BY c.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as CorrectionListItem[];
}

export type ResolveResult =
  | { ok: true; decision: "approved"; bonusPoints: number }
  | { ok: true; decision: "rejected"; honorDropped: boolean; rejectionCount: number }
  | { ok: false; error: string; code: "not_found" | "already_resolved" | "db" };

async function getActiveSeasonNumber(): Promise<number | null> {
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT season_number FROM seasons WHERE status = 'active' ORDER BY start_at DESC LIMIT 1
    `;
    return (rows as any[])[0]?.season_number ?? null;
  } catch {
    return null;
  }
}

/**
 * Apply the corrected field, reset reward, then re-run post-process for a clean
 * recompute. This re-evaluates ELIGIBILITY too (e.g. a date fix can flip an
 * out_of_current_month receipt to reward-eligible) and grants the base reward if
 * it now qualifies — but ONLY here, on admin approval. See decision 2026-06-03.
 */
async function recomputeAfterCorrection(
  receiptId: string,
  field: string,
  newValue: string
): Promise<void> {
  if (!sql) return;
  if (field === "total") {
    const n = Number(newValue);
    await sql`
      UPDATE receipts
      SET pricing_total_paid = ${n},
          pricing_paid_ex_tax = GREATEST(0, ${n} - COALESCE(pricing_vat_amount, 0)),
          reward_final = 0, reward_raw = 0,
          post_process_state = 'pending', updated_at = now()
      WHERE receipt_id = ${receiptId}
    `;
  } else if (field === "vat") {
    const n = Number(newValue);
    await sql`
      UPDATE receipts
      SET pricing_vat_amount = ${n},
          pricing_paid_ex_tax = GREATEST(0, COALESCE(pricing_total_paid, 0) - ${n}),
          reward_final = 0, reward_raw = 0,
          post_process_state = 'pending', updated_at = now()
      WHERE receipt_id = ${receiptId}
    `;
  } else if (field === "date") {
    // Date drives the out_of_current_month eligibility gate.
    await sql`
      UPDATE receipts
      SET extraction_date_value = ${newValue},
          reward_final = 0, reward_raw = 0,
          post_process_state = 'pending', updated_at = now()
      WHERE receipt_id = ${receiptId}
    `;
  }
  // storedRewardFinal is now 0 → resolveGrantedReward recomputes (eligibility + amount) from scratch.
  await runPostProcess(receiptId);
}

/** Revert a harmless immediate edit back to its old value (on rejection). */
async function revertImmediateField(
  receiptId: string,
  field: string,
  oldValue: string | null
): Promise<void> {
  if (!sql) return;
  switch (field) {
    case "merchant_name":
      await sql`UPDATE receipts SET merchant_name = ${oldValue}, updated_at = now() WHERE receipt_id = ${receiptId}`;
      break;
    case "date":
      await sql`UPDATE receipts SET extraction_date_value = ${oldValue}, updated_at = now() WHERE receipt_id = ${receiptId}`;
      break;
    case "time":
      await sql`UPDATE receipts SET extraction_time_value = ${oldValue}, updated_at = now() WHERE receipt_id = ${receiptId}`;
      break;
  }
}

async function notify(
  username: string,
  receiptId: string,
  type: string,
  title: string,
  body: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!sql) return;
  try {
    await sql`
      INSERT INTO user_notifications (username, type, title, body, payload, receipt_id)
      VALUES (${username}, ${type}, ${title}, ${body}, ${JSON.stringify(payload)}::jsonb, ${receiptId})
    `;
  } catch (e) {
    console.warn("[corrections] notify failed (non-fatal):", e);
  }
}

export async function resolveCorrection(opts: {
  correctionId: string;
  adminUsername: string;
  decision: "approve" | "reject";
}): Promise<ResolveResult> {
  if (!isDatabaseAvailable() || !sql) {
    return { ok: false, error: "Database not available", code: "db" };
  }
  const dbSql = sql;
  await warmUpConnection();

  // Atomically claim the pending row so two admins can't double-resolve.
  const claimed = await dbSql`
    UPDATE receipt_corrections
    SET status = ${opts.decision === "approve" ? "approved" : "rejected"},
        reviewed_by = ${opts.adminUsername}, reviewed_at = now()
    WHERE id = ${opts.correctionId} AND status = 'pending'
    RETURNING *
  `;
  const row = (claimed as CorrectionRow[])[0];
  if (!row) {
    // Either missing or already resolved.
    const exists = await dbSql`SELECT 1 FROM receipt_corrections WHERE id = ${opts.correctionId} LIMIT 1`;
    return (exists as any[]).length > 0
      ? { ok: false, error: "Correction already resolved", code: "already_resolved" }
      : { ok: false, error: "Correction not found", code: "not_found" };
  }

  if (opts.decision === "approve") {
    // Reward fields: apply corrected value + recompute before reading reward base.
    if (row.affects_reward) {
      try {
        await recomputeAfterCorrection(row.receipt_id, row.field, row.new_value);
      } catch (e) {
        console.error("[corrections] recompute failed:", e);
      }
    }

    // Bonus = CORRECTION_BONUS_RATE of the (recomputed) reward.
    const rewardRows = await dbSql`SELECT reward_final FROM receipts WHERE receipt_id = ${row.receipt_id} LIMIT 1`;
    const rewardFinal = Number((rewardRows as any[])[0]?.reward_final ?? 0) || 0;
    const bonusPoints = Math.round(rewardFinal * CORRECTION_BONUS_RATE * 100) / 100;

    if (bonusPoints > 0) {
      const season = await getActiveSeasonNumber();
      try {
        await dbSql`
          INSERT INTO contribution_point_events (
            username, points_delta, source_type, reference_id, season_number, metadata, contribution_version
          )
          VALUES (
            ${row.username}, ${bonusPoints}, 'correction_bonus', ${row.id}, ${season},
            ${JSON.stringify({ field: row.field, receiptId: row.receipt_id, rewardFinal })}::jsonb, 1
          )
          ON CONFLICT (username, source_type, reference_id) DO NOTHING
        `;
      } catch (e) {
        console.warn("[corrections] bonus credit failed (non-fatal):", e);
      }
    }

    await dbSql`UPDATE receipt_corrections SET bonus_points = ${bonusPoints} WHERE id = ${row.id}`;
    await notify(
      row.username,
      row.receipt_id,
      "correction_approved",
      "Düzeltmen onaylandı",
      bonusPoints > 0
        ? `Düzeltme önerin onaylandı. ${bonusPoints} cPoints bonus kazandın.`
        : "Düzeltme önerin onaylandı.",
      { correctionId: row.id, field: row.field, bonusPoints }
    );
    return { ok: true, decision: "approved", bonusPoints };
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  // Revert any harmless edit that was applied at submission time.
  if (row.applied_immediately) {
    try {
      await revertImmediateField(row.receipt_id, row.field, row.old_value);
    } catch (e) {
      console.warn("[corrections] revert failed (non-fatal):", e);
    }
  }

  // Rolling-window rejection count (this row included).
  let rejectionCount = 1;
  try {
    const cntRows = await dbSql`
      SELECT COUNT(*)::int AS c
      FROM receipt_corrections
      WHERE username = ${row.username}
        AND status = 'rejected'
        AND created_at >= now() - make_interval(days => ${WRONG_CORRECTION_WINDOW_DAYS})
    `;
    rejectionCount = Number((cntRows as any[])[0]?.c ?? 1);
  } catch { /* default 1 */ }

  const honorDropped = rejectionCount >= WRONG_CORRECTION_HONOR_DROP_TIER;
  let honorDelta = 0;
  if (honorDropped) {
    honorDelta = -WRONG_CORRECTION_HONOR_PENALTY;
    try {
      await updateUserHonor(row.username, honorDelta);
    } catch (e) {
      console.warn("[corrections] honor penalty failed (non-fatal):", e);
    }
  }
  await dbSql`UPDATE receipt_corrections SET honor_delta = ${honorDelta} WHERE id = ${row.id}`;

  await notify(
    row.username,
    row.receipt_id,
    "correction_rejected",
    honorDropped ? "Hesap puanın düştü" : "Düzeltme onaylanmadı",
    honorDropped
      ? "Tekrar eden hatalı düzeltmeler nedeniyle hesap sağlık puanın düştü."
      : "İncelememiz sonucunda düzeltme önerin onaylanmadı.",
    { correctionId: row.id, field: row.field, rejectionCount, honorDelta }
  );

  return { ok: true, decision: "rejected", honorDropped, rejectionCount };
}
