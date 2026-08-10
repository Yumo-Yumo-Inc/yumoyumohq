/**
 * Resolution + propagation.
 *
 * Evidence model: every answer adds its weight (the answerer's reliability, frozen at
 * answer time) to the candidate it picked. A task resolves when the leader clears
 * EVIDENCE_THRESHOLD and holds EVIDENCE_MARGIN over the runner-up.
 *
 * The threshold is stage-aware and lives in config. Today it accepts a single confident
 * answer, because PROD (2026-07-17) has 16 real users and not one real product string has
 * reached even two witnesses — a "4 users agree" rule would resolve nothing at all. That
 * is user density, not a design flaw, and it is why the safety net here is NOT the crowd:
 *
 *   - reliability is measured against gold tasks, not against agreement
 *   - a wrong link shows up as price incoherence in price_ledger_clean and is held out
 *     of the chain by the sanity band
 *   - the alias carries match_type='crowd', so crowd resolutions stay revertible
 *
 * When density rises (watch CONSENSUS_WITNESS_RATE_TRIGGER), raising EVIDENCE_THRESHOLD
 * turns on real consensus. Nothing else changes.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/contribution/resolve is server-only.");
}

import { db } from "@/lib/db/client";
import {
  ANSWER_CAP,
  EVIDENCE_MARGIN,
  EVIDENCE_THRESHOLD,
  UNKNOWN_THRESHOLD,
} from "@/config/contribution-center";

export type ResolveOutcome =
  | { status: "open"; reason: string }
  | {
      status: "resolved";
      /** Empty for pack-size resolutions (see packSize). */
      canonicalId: string;
      rowsFixed: number;
      packSize?: string;
    }
  | { status: "unresolvable" }
  | { status: "capped" };

interface TaskRow {
  id: string;
  raw_text_norm: string;
  merchant_id: string | null;
  sample_raw_text: string | null;
  answers_count: number;
  status: string;
  is_gold: boolean;
}

/**
 * Decide whether a task has enough evidence, and act on it.
 *
 * Called after every answer. Gold tasks never resolve anything — their answer is already
 * known; they exist to measure the answerer.
 */
export async function evaluateTask(taskId: string | number): Promise<ResolveOutcome> {
  const { rows: typeRows } = await db.query<{ task_type: string }>(
    `SELECT task_type FROM contribution_tasks WHERE id = $1`,
    [taskId]
  );
  if (typeRows[0]?.task_type === "product_pack_size") {
    const { evaluatePackTask } = await import("./resolve-pack");
    return evaluatePackTask(taskId);
  }

  const { rows: taskRows } = await db.query<TaskRow>(
    `SELECT id, raw_text_norm, merchant_id, sample_raw_text, answers_count, status, is_gold
       FROM contribution_tasks WHERE id = $1`,
    [taskId]
  );
  const task = taskRows[0];
  if (!task) return { status: "open", reason: "task not found" };
  if (task.status !== "open") return { status: "open", reason: `already ${task.status}` };
  if (task.is_gold) return { status: "open", reason: "gold task never resolves" };

  const { rows: tally } = await db.query<{
    canonical_id: string | null;
    answer_kind: string;
    weight: string | number;
  }>(
    `SELECT canonical_id, answer_kind, sum(weight) AS weight
       FROM contribution_answers
      WHERE task_id = $1
      GROUP BY canonical_id, answer_kind`,
    [taskId]
  );

  const unknownWeight = tally
    .filter((t) => t.answer_kind === "unknown")
    .reduce((sum, t) => sum + Number(t.weight), 0);

  // "Bilmiyorum" is information, not a non-answer: enough of it means the string cannot
  // be read at all. Retiring the task is what stops the queue filling with questions
  // nobody can answer, and stops users hitting the same wall twice.
  if (unknownWeight >= UNKNOWN_THRESHOLD) {
    await db.query(
      `UPDATE contribution_tasks
          SET status = 'unresolvable', resolved_at = now()
        WHERE id = $1 AND status = 'open'`,
      [taskId]
    );
    return { status: "unresolvable" };
  }

  const picks = tally
    .filter((t) => t.answer_kind === "pick" && t.canonical_id)
    .map((t) => ({ canonicalId: t.canonical_id as string, weight: Number(t.weight) }))
    .sort((a, b) => b.weight - a.weight);

  const leader = picks[0];
  const runnerUp = picks[1];

  if (leader && leader.weight >= EVIDENCE_THRESHOLD) {
    const margin = leader.weight - (runnerUp?.weight ?? 0);
    // Without the margin rule, a task where two candidates run neck and neck tips to
    // whichever side happens to cross the threshold first.
    if (margin >= EVIDENCE_MARGIN) {
      const rowsFixed = await resolveTaskTo(task, leader.canonicalId);
      return { status: "resolved", canonicalId: leader.canonicalId, rowsFixed };
    }
  }

  // Past the cap the crowd has demonstrably failed to converge, and every further answer
  // is points spent on a question that is not getting better. Hand it to a field mission.
  if (task.answers_count >= ANSWER_CAP) {
    await db.query(
      `UPDATE contribution_tasks SET status = 'capped' WHERE id = $1 AND status = 'open'`,
      [taskId]
    );
    return { status: "capped" };
  }

  return { status: "open", reason: "not enough evidence yet" };
}

/**
 * Commit a resolution: mark the task, teach the alias, and backfill every line carrying
 * the string.
 *
 * The backfill is the whole economics of this feature — one answer fixes 45 rows, and it
 * is where the honest "47 fiş düzeldi" number comes from. It is also why the alias write
 * matters more than the row update: from here on, the fuzzy matcher resolves that string
 * on arrival and the task is never generated again.
 */
async function resolveTaskTo(task: TaskRow, canonicalId: string): Promise<number> {
  const claimed = await db.query<{ id: string }>(
    `UPDATE contribution_tasks
        SET status = 'resolved',
            resolution = 'crowd',
            resolved_canonical_id = $2,
            resolved_at = now()
      WHERE id = $1 AND status = 'open'
      RETURNING id`,
    [task.id, canonicalId]
  );
  // Atomic claim: two answers landing together must not both run the propagation.
  if (claimed.rows.length === 0) return 0;

  const rawText = task.sample_raw_text ?? task.raw_text_norm;

  // Teach the matcher. match_type='crowd' keeps this reversible and auditable — it feeds
  // canonical_id, which feeds the price median, which reaches the chain.
  try {
    await db.query(
      `INSERT INTO receipt_product_aliases
         (raw_text, canonical_id, merchant_id, match_type, confidence, times_seen, last_seen)
       VALUES ($1, $2, $3, 'crowd', 1.0, 1, now())
       ON CONFLICT (raw_text, COALESCE(merchant_id, '00000000-0000-0000-0000-000000000000'::uuid), canonical_id)
       DO UPDATE SET
         match_type = 'crowd',
         confidence = 1.0,
         times_seen = receipt_product_aliases.times_seen + 1,
         last_seen  = now()`,
      [rawText, canonicalId, task.merchant_id]
    );
  } catch (error) {
    console.warn("[contribution/resolve] alias write failed:", (error as Error).message);
  }

  // Backfill every line with this string at this merchant. Scoped to the merchant on
  // purpose: the same shorthand at another store may be another product entirely — that
  // is the K.GOFRET failure, and the point of scoping in the first place.
  // RETURNING, not rowCount: db.query only exposes { rows }. The count is shown to the
  // user ("47 fiş düzeldi"), so it has to be the real number of rows written.
  const backfilled = await db.query<{ id: number }>(
    `UPDATE receipt_line_items li
        SET canonical_id = $2
       FROM receipts r
      WHERE r.receipt_id = li.receipt_id
        AND li.canonical_id IS NULL
        AND upper(btrim(li.raw_name)) = $1
        AND r.merchant_id IS NOT DISTINCT FROM $3::uuid
      RETURNING li.id`,
    [task.raw_text_norm, canonicalId, task.merchant_id]
  );

  return backfilled.rows.length;
}
