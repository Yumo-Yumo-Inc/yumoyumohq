/**
 * Answer submission: pay, measure, propagate.
 *
 * Order matters and is deliberate (K3, Uğur 2026-07-17):
 *
 *   1. record the answer      — UNIQUE(task_id, username) is the double-answer lock
 *   2. pay immediately        — points land now, not on resolution
 *   3. measure (gold only)    — accuracy moves the quota, which is the real limiter
 *   4. evaluate the task      — may resolve, retire, or cap it
 *
 * Paying before the answer is known to be right is the explicit decision: the cost of a
 * wrong answer is future work, not a clawback. Nobody wants to be wrong because being
 * wrong shrinks tomorrow's quota. What bounds the damage is that the quota starts small,
 * so a bad actor extracts at most (starting quota × accounts) before being throttled.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/contribution/answer is server-only.");
}

import { db } from "@/lib/db/client";
import {
  DAILY_TASK_POINT_CAP,
  TASK_POINTS_IDENTIFY,
  TASK_POINTS_PACK_SIZE,
  TASK_POINTS_UNKNOWN,
  TASK_TYPE_PACK_SIZE,
  taskSourceType,
} from "@/config/contribution-center";
import { getCurrentSeasonNumber } from "@/lib/oracle/account-season-level";
import { parseUserPackAnswer } from "@/lib/receipt/pack-size";
import { getReliability, recordGoldOutcome, getDailyBudget } from "./reliability";
import { evaluateTask, type ResolveOutcome } from "./resolve";

export type AnswerKind = "pick" | "other" | "unknown";

export interface SubmitAnswerInput {
  taskId: string | number;
  username: string;
  kind: AnswerKind;
  canonicalId?: string | null;
  freeText?: string | null;
  latencyMs?: number | null;
}

export type SubmitAnswerResult =
  | { ok: false; code: "task_not_open" | "already_answered" | "quota_exhausted" | "invalid" }
  | {
      ok: true;
      pointsAwarded: number;
      /** Resolution is deliberately not surfaced per-answer for gold tasks. */
      outcome: ResolveOutcome;
      quotaRemaining: number;
    };

interface TaskRow {
  id: string;
  status: string;
  is_gold: boolean;
  gold_canonical_id: string | null;
  raw_text_norm: string;
  candidates: unknown;
  task_type: string;
}

/**
 * Did this user actually buy the thing?
 *
 * Derived, never asked — the receipts already know. K4 says everyone may answer and
 * accuracy sorts them out, so this does not affect weight today. It is recorded because
 * it is free: if correlated error ever shows up in the gold metrics (a whole crowd
 * sharing one wrong guess is invisible to an accuracy check), turning witness weighting
 * on becomes a one-line change with history already in place.
 */
async function isWitness(username: string, rawTextNorm: string): Promise<boolean> {
  try {
    const { rows } = await db.query<{ hit: number }>(
      `SELECT 1 AS hit
         FROM receipt_line_items li
         JOIN receipts r ON r.receipt_id = li.receipt_id
        WHERE r.username = $1
          AND upper(btrim(li.raw_name)) = $2
        LIMIT 1`,
      [username, rawTextNorm]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function submitAnswer(
  input: SubmitAnswerInput
): Promise<SubmitAnswerResult> {
  const { taskId, username, kind } = input;

  if (kind === "pick" && !input.canonicalId) return { ok: false, code: "invalid" };
  if (kind === "other" && !input.freeText?.trim()) return { ok: false, code: "invalid" };

  const { rows: taskRows } = await db.query<TaskRow>(
    `SELECT id, status, is_gold, gold_canonical_id, raw_text_norm, candidates, task_type
       FROM contribution_tasks WHERE id = $1`,
    [taskId]
  );
  const task = taskRows[0];
  if (!task || task.status !== "open") return { ok: false, code: "task_not_open" };

  const isPackTask = task.task_type === TASK_TYPE_PACK_SIZE;
  // Pack tasks vote via free_text (chips + typed). A pick with a product UUID is invalid.
  if (isPackTask && kind === "pick") return { ok: false, code: "invalid" };
  if (isPackTask && kind === "other") {
    if (!parseUserPackAnswer(input.freeText)) return { ok: false, code: "invalid" };
  }

  const budget = await getDailyBudget(username);
  if (budget.remainingTasks <= 0) return { ok: false, code: "quota_exhausted" };

  const state = await getReliability(username);
  const witness = await isWitness(username, task.raw_text_norm);

  // Points are clamped by what is left of the daily cap, so the ledger can never exceed
  // it even if the quota is somehow out of step. contribution_point_events has no daily
  // limit of its own — every existing cap sits on receipt_rewards — so this is the only
  // thing standing between a new source_type and an uncapped tap.
  const basePoints =
    kind === "unknown"
      ? TASK_POINTS_UNKNOWN
      : isPackTask
        ? TASK_POINTS_PACK_SIZE
        : TASK_POINTS_IDENTIFY;
  const points = Math.max(0, Math.min(basePoints, budget.pointsRemaining));

  let freeText: string | null = kind === "other" ? input.freeText?.trim() ?? null : null;
  if (isPackTask && freeText) {
    const parsed = parseUserPackAnswer(freeText);
    freeText = parsed?.packSize ?? freeText;
  }

  const { rows: inserted } = await db.query<{ id: string }>(
    `INSERT INTO contribution_answers
       (task_id, username, answer_kind, canonical_id, free_text, is_witness, weight, points_paid, latency_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (task_id, username) DO NOTHING
     RETURNING id`,
    [
      taskId,
      username,
      kind,
      kind === "pick" ? input.canonicalId : null,
      freeText,
      witness,
      state.reliability,
      points,
      input.latencyMs ?? null,
    ]
  );

  // The unique index is the lock: a double submit is a no-op, not a double payment.
  if (inserted.length === 0) return { ok: false, code: "already_answered" };

  await db.query(
    `UPDATE contribution_tasks SET answers_count = answers_count + 1 WHERE id = $1`,
    [taskId]
  );

  if (points > 0) {
    await payPoints(username, taskId, points, task.task_type);
  }

  // A gold task's answer is already known, so it teaches us nothing about the product —
  // it measures the person. This is the ONLY input to reliability: measuring against
  // crowd agreement would reward conformity and would be circular, since consensus is
  // exactly what we are trying to establish.
  if (task.is_gold) {
    const correct = kind === "pick" && input.canonicalId === task.gold_canonical_id;
    await recordGoldOutcome(username, correct);
    await db.query(`UPDATE contribution_answers SET was_correct = $2 WHERE id = $1`, [
      inserted[0].id,
      correct,
    ]);
  }

  // A free-text answer becomes an option for the next user. This is what makes "Diğer"
  // scale: the first person does the hard half (typing a name the machine never had),
  // everyone after only has to agree with it — and it is the only path by which a
  // correct answer that was missing from the candidates can ever win.
  if (kind === "other" && freeText) {
    if (isPackTask) {
      await appendPackCandidate(taskId, freeText, username);
    } else {
      await appendFreeTextCandidate(taskId, freeText, username);
    }
  }

  const outcome = task.is_gold
    ? ({ status: "open", reason: "gold task never resolves" } as ResolveOutcome)
    : await evaluateTask(taskId);

  return {
    ok: true,
    pointsAwarded: points,
    outcome,
    quotaRemaining: Math.max(0, budget.remainingTasks - 1),
  };
}

async function payPoints(
  username: string,
  taskId: string | number,
  points: number,
  taskType: string
): Promise<void> {
  try {
    // reference_id = task id, and the ledger's UNIQUE(username, source_type, reference_id)
    // makes a second payment for the same task structurally impossible.
    await db.query(
      `INSERT INTO contribution_point_events
         (username, points_delta, source_type, reference_id, season_number, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (username, source_type, reference_id) DO NOTHING`,
      [
        username,
        points,
        taskSourceType(taskType),
        String(taskId),
        getCurrentSeasonNumber(),
        JSON.stringify({ cap: DAILY_TASK_POINT_CAP }),
      ]
    );
  } catch (error) {
    // Non-fatal: the answer is recorded and useful even if the ledger write trips.
    console.warn("[contribution/answer] point write failed:", (error as Error).message);
  }
}

interface CandidateEntry {
  canonical_id: string | null;
  label: string;
  score: number;
  via: string;
  added_by: string | null;
}

/**
 * Turn a free-text answer into a votable option.
 *
 * Normalised against what is already there so the same product typed five different ways
 * does not become five competing options — which would split the vote and guarantee
 * nothing ever clears the margin.
 */
async function appendFreeTextCandidate(
  taskId: string | number,
  text: string,
  username: string
): Promise<void> {
  try {
    const { rows } = await db.query<{ candidates: CandidateEntry[] | null }>(
      `SELECT candidates FROM contribution_tasks WHERE id = $1`,
      [taskId]
    );
    const current: CandidateEntry[] = Array.isArray(rows[0]?.candidates)
      ? (rows[0]?.candidates as CandidateEntry[])
      : [];

    const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
    if (current.some((c) => norm(c.label) === norm(text))) return;

    // Only append a free-text option that maps to a real canonical product. A label with
    // no canonical_id cannot be voted into a resolution (resolve.ts tallies by
    // canonical_id), so adding one would just be dead weight on the screen.
    const { rows: match } = await db.query<{ id: string; display_name_tr: string | null; canonical_name: string }>(
      `SELECT id, display_name_tr, canonical_name
         FROM canonical_products
        WHERE is_active = TRUE
          AND regexp_replace(translate(lower(canonical_name), 'şğüöçı', 'sguoci'), '[^a-z0-9]', '', 'g')
              = regexp_replace(translate(lower($1), 'şğüöçı', 'sguoci'), '[^a-z0-9]', '', 'g')
        LIMIT 1`,
      [text]
    );
    if (match.length === 0) return;

    const entry: CandidateEntry = {
      canonical_id: match[0].id,
      label: match[0].display_name_tr ?? match[0].canonical_name,
      score: 0,
      via: "other",
      added_by: username,
    };
    if (current.some((c) => c.canonical_id === entry.canonical_id)) return;

    await db.query(
      `UPDATE contribution_tasks SET candidates = $2::jsonb WHERE id = $1`,
      [taskId, JSON.stringify([...current, entry])]
    );
  } catch (error) {
    console.warn(
      "[contribution/answer] free-text candidate append failed:",
      (error as Error).message
    );
  }
}
