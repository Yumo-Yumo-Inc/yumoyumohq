import { db } from "@/lib/db/client";
import {
  EVIDENCE_MARGIN,
  EVIDENCE_THRESHOLD,
  TASK_POINTS_IDENTIFY,
  taskSourceType,
} from "@/config/contribution-center";
import { getCurrentSeasonNumber } from "@/lib/oracle/account-season-level";
import { getDailyBudget, getReliability } from "./reliability";
import { submitAnswer, type SubmitAnswerResult } from "./answer";
import {
  confirmExternalMatchesForTask,
  markExternalCandidatesNeedsReviewForTask,
  rejectExternalCandidatesForTask,
} from "@/lib/external-products/confirmation";

export type ExternalAnswerKind = "pick" | "other" | "none" | "unknown";

async function isCandidatePick(input: {
  taskId: string | number;
  canonicalId: string;
}): Promise<boolean> {
  const { rows } = await db.query<{ allowed: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM contribution_tasks task
         CROSS JOIN LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(task.candidates) = 'array'
                THEN task.candidates ELSE '[]'::jsonb END
         ) candidate
        WHERE task.id = $1
          AND task.task_type = 'product_identify'
          AND task.status = 'open'
          AND candidate->>'canonical_id' = $2::text
     ) AS allowed`,
    [input.taskId, input.canonicalId]
  );
  return rows[0]?.allowed === true;
}

async function confirmationActor(
  taskId: string | number,
  canonicalId: string,
  preferredUsername: string
): Promise<string | null> {
  const { rows } = await db.query<{ username: string }>(
    `SELECT username
       FROM contribution_answers
      WHERE task_id = $1 AND answer_kind = 'pick' AND canonical_id = $2::uuid
      ORDER BY CASE WHEN username = $3 THEN 0 ELSE 1 END, weight DESC, created_at DESC
      LIMIT 1`,
    [taskId, canonicalId, preferredUsername]
  );
  return rows[0]?.username ?? null;
}

async function evaluateNoneConsensus(taskId: string | number): Promise<boolean> {
  const { rows } = await db.query<{ answer_kind: string; weight: string | number }>(
    `SELECT answer_kind, sum(weight) AS weight
       FROM contribution_answers
      WHERE task_id = $1
      GROUP BY answer_kind, canonical_id`,
    [taskId]
  );
  const noneWeight = rows
    .filter((row) => row.answer_kind === "none")
    .reduce((sum, row) => sum + Number(row.weight), 0);
  const strongestPick = rows
    .filter((row) => row.answer_kind === "pick")
    .reduce((max, row) => Math.max(max, Number(row.weight)), 0);
  if (
    noneWeight < EVIDENCE_THRESHOLD
    || noneWeight - strongestPick < EVIDENCE_MARGIN
  ) return false;

  const retired = await db.query<{ id: string }>(
    `UPDATE contribution_tasks
        SET status = 'unresolvable', resolution = 'crowd', resolved_at = now()
      WHERE id = $1 AND status = 'open'
      RETURNING id`,
    [taskId]
  );
  return retired.rows.length > 0;
}

export async function submitAnswerWithExternal(input: {
  taskId: string | number;
  username: string;
  kind: ExternalAnswerKind;
  canonicalId?: string | null;
  freeText?: string | null;
  latencyMs?: number | null;
}): Promise<SubmitAnswerResult> {
  if (input.kind !== "none") {
    if (
      input.kind === "pick"
      && (!input.canonicalId || !(await isCandidatePick({
        taskId: input.taskId,
        canonicalId: input.canonicalId,
      })))
    ) return { ok: false, code: "invalid" };

    const result = await submitAnswer({
      ...input,
      kind: input.kind,
    });
    if (result.ok && result.outcome.status === "resolved") {
      const actor = await confirmationActor(
        input.taskId,
        result.outcome.canonicalId,
        input.username
      );
      if (actor) {
        try {
          await confirmExternalMatchesForTask({
            taskId: input.taskId,
            canonicalId: result.outcome.canonicalId,
            confirmedBy: actor,
          });
        } catch (error) {
          console.warn("[contribution/external-answer] external confirmation failed:", (error as Error).message);
          await markExternalCandidatesNeedsReviewForTask({ taskId: input.taskId });
        }
      } else {
        await markExternalCandidatesNeedsReviewForTask({ taskId: input.taskId });
      }
    } else if (result.ok && result.outcome.status === "unresolvable") {
      await markExternalCandidatesNeedsReviewForTask({ taskId: input.taskId });
    } else if (result.ok && result.outcome.status === "capped") {
      await markExternalCandidatesNeedsReviewForTask({ taskId: input.taskId });
    }
    return result;
  }

  const budget = await getDailyBudget(input.username);
  if (budget.remainingTasks <= 0) return { ok: false, code: "quota_exhausted" };
  const reliability = await getReliability(input.username);
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO contribution_answers
       (task_id, username, answer_kind, is_witness, weight, points_paid, latency_ms)
     SELECT $1, $2, 'none', FALSE, $3, $4, $5
      WHERE EXISTS (
        SELECT 1 FROM contribution_tasks
         WHERE id = $1 AND status = 'open' AND task_type = 'product_identify'
      )
     ON CONFLICT (task_id, username) DO NOTHING
     RETURNING id`,
    [input.taskId, input.username, reliability.reliability, TASK_POINTS_IDENTIFY, input.latencyMs ?? null]
  );
  if (!rows.length) return { ok: false, code: "already_answered" };
  await db.query(`UPDATE contribution_tasks SET answers_count = answers_count + 1 WHERE id = $1`, [input.taskId]);
  await db.query(
    `INSERT INTO contribution_point_events
       (username, points_delta, source_type, reference_id, season_number, metadata)
     VALUES ($1, $2, $3, $4, $5, jsonb_build_object('answer_kind', 'none'))
     ON CONFLICT (username, source_type, reference_id) DO NOTHING`,
    [
      input.username,
      Math.min(TASK_POINTS_IDENTIFY, budget.pointsRemaining),
      taskSourceType("product_identify"),
      String(input.taskId),
      getCurrentSeasonNumber(),
    ]
  );
  const noneResolved = await evaluateNoneConsensus(input.taskId);
  if (noneResolved) {
    await rejectExternalCandidatesForTask({ taskId: input.taskId, username: input.username });
  }
  return {
    ok: true,
    pointsAwarded: Math.min(TASK_POINTS_IDENTIFY, budget.pointsRemaining),
    outcome: noneResolved
      ? { status: "unresolvable" }
      : { status: "open", reason: "none answer recorded; awaiting consensus" },
    quotaRemaining: Math.max(0, budget.remainingTasks - 1),
  };
}
