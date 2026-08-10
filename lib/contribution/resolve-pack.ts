/**
 * Resolve a product_pack_size contribution task and persist the pack hint.
 *
 * Evidence tallies by normalised free_text (chip or typed pack). On resolve we
 * write product_pack_hints and backfill empty pack_size on matching lines.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/contribution/resolve-pack is server-only.");
}

import { db } from "@/lib/db/client";
import {
  ANSWER_CAP,
  EVIDENCE_MARGIN,
  EVIDENCE_THRESHOLD,
  UNKNOWN_THRESHOLD,
} from "@/config/contribution-center";
import { parseUserPackAnswer } from "@/lib/receipt/pack-size";
import type { ResolveOutcome } from "./resolve";

interface TaskRow {
  id: string;
  raw_text_norm: string;
  merchant_id: string | null;
  sample_raw_text: string | null;
  answers_count: number;
  status: string;
  is_gold: boolean;
  task_type: string;
}

export async function evaluatePackTask(taskId: string | number): Promise<ResolveOutcome> {
  const { rows: taskRows } = await db.query<TaskRow>(
    `SELECT id, raw_text_norm, merchant_id, sample_raw_text, answers_count, status, is_gold, task_type
       FROM contribution_tasks WHERE id = $1`,
    [taskId]
  );
  const task = taskRows[0];
  if (!task) return { status: "open", reason: "task not found" };
  if (task.status !== "open") return { status: "open", reason: `already ${task.status}` };
  if (task.is_gold) return { status: "open", reason: "gold task never resolves" };

  const { rows: tally } = await db.query<{
    free_text: string | null;
    answer_kind: string;
    weight: string | number;
  }>(
    `SELECT free_text, answer_kind, sum(weight) AS weight
       FROM contribution_answers
      WHERE task_id = $1
      GROUP BY free_text, answer_kind`,
    [taskId]
  );

  const unknownWeight = tally
    .filter((t) => t.answer_kind === "unknown")
    .reduce((sum, t) => sum + Number(t.weight), 0);

  if (unknownWeight >= UNKNOWN_THRESHOLD) {
    await db.query(
      `UPDATE contribution_tasks
          SET status = 'unresolvable', resolved_at = now()
        WHERE id = $1 AND status = 'open'`,
      [taskId]
    );
    return { status: "unresolvable" };
  }

  const packs = new Map<string, { packSize: string; unitType: string | null; weight: number }>();
  for (const row of tally) {
    if (row.answer_kind !== "other" || !row.free_text) continue;
    const parsed = parseUserPackAnswer(row.free_text);
    if (!parsed) continue;
    const prev = packs.get(parsed.packSize);
    packs.set(parsed.packSize, {
      packSize: parsed.packSize,
      unitType: parsed.unitType,
      weight: (prev?.weight ?? 0) + Number(row.weight),
    });
  }

  const ranked = [...packs.values()].sort((a, b) => b.weight - a.weight);
  const leader = ranked[0];
  const runnerUp = ranked[1];

  if (leader && leader.weight >= EVIDENCE_THRESHOLD) {
    const margin = leader.weight - (runnerUp?.weight ?? 0);
    if (margin >= EVIDENCE_MARGIN) {
      const rowsFixed = await resolvePackTaskTo(task, leader.packSize, leader.unitType);
      return {
        status: "resolved",
        canonicalId: "",
        packSize: leader.packSize,
        rowsFixed,
      };
    }
  }

  if (task.answers_count >= ANSWER_CAP) {
    await db.query(
      `UPDATE contribution_tasks SET status = 'capped' WHERE id = $1 AND status = 'open'`,
      [taskId]
    );
    return { status: "capped" };
  }

  return { status: "open", reason: "not enough evidence yet" };
}

async function resolvePackTaskTo(
  task: TaskRow,
  packSize: string,
  unitType: string | null
): Promise<number> {
  const claimed = await db.query<{ id: string }>(
    `UPDATE contribution_tasks
        SET status = 'resolved',
            resolution = 'crowd',
            resolved_at = now()
      WHERE id = $1 AND status = 'open'
      RETURNING id`,
    [task.id]
  );
  if (claimed.rows.length === 0) return 0;

  try {
    await db.query(
      `INSERT INTO product_pack_hints
         (raw_text_norm, pack_size, unit_type, source, task_id, updated_at)
       VALUES ($1, $2, $3, 'crowd', $4, now())
       ON CONFLICT (raw_text_norm) DO UPDATE SET
         pack_size = EXCLUDED.pack_size,
         unit_type = EXCLUDED.unit_type,
         source = 'crowd',
         task_id = EXCLUDED.task_id,
         updated_at = now()`,
      [task.raw_text_norm, packSize, unitType, task.id]
    );
  } catch (error) {
    console.warn("[contribution/resolve-pack] hint write failed:", (error as Error).message);
  }

  const backfilled = await db.query<{ id: number }>(
    `UPDATE receipt_line_items li
        SET pack_size = $2
       FROM receipts r
      WHERE r.receipt_id = li.receipt_id
        AND upper(btrim(li.raw_name)) = $1
        AND (li.pack_size IS NULL OR btrim(li.pack_size) = '')
        AND r.merchant_id IS NOT DISTINCT FROM $3::uuid
      RETURNING li.id`,
    [task.raw_text_norm, packSize, task.merchant_id]
  );

  return backfilled.rows.length;
}
