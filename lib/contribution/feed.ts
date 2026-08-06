/**
 * The feed: which tasks this user sees, in which order.
 *
 * Three rules, each earning its place:
 *
 *   1. Witness tasks first (K7). If the string is on your own receipt, you bought the
 *      thing — it may still be in your bag. That answer is evidence, not inference, and
 *      it costs nothing to collect. PROD supplies ~20 such lines a day.
 *
 *   2. A stranger only sees strings with real reach (MIN_ROW_COUNT_FOR_CROWD). PROD
 *      2026-07-17: 96.9% of unresolved strings appear exactly once. Showing a
 *      single-row string to someone who never bought it buys one guess to fix one row —
 *      the worst trade on the screen.
 *
 *   3. Gold tasks are mixed in invisibly. They pay the same and look the same; if they
 *      paid differently they would be detectable, and a detectable gold task measures
 *      nothing.
 *
 * The feed spreads across the top slice rather than handing everyone the single highest
 * task: a task needs a handful of answers, so serving it to 400 people is 400 payments
 * for the same fact.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/contribution/feed is server-only.");
}

import { db } from "@/lib/db/client";
import {
  GOLD_TASK_RATE,
  MIN_ROW_COUNT_FOR_CROWD,
} from "@/config/contribution-center";
import { getDailyBudget } from "./reliability";

interface FeedCandidate {
  canonicalId: string | null;
  label: string;
}

interface FeedTask {
  id: string;
  rawText: string;
  merchantLabel: string | null;
  priceMedian: number | null;
  currency: string | null;
  /** How many line items this one answer would fix — the honest multiplier. */
  rowCount: number;
  isWitness: boolean;
  candidates: FeedCandidate[];
}

interface TaskRow {
  id: string;
  sample_raw_text: string | null;
  raw_text_norm: string;
  merchant_label: string | null;
  price_median: string | number | null;
  currency: string | null;
  row_count: number;
  candidates: Array<{ canonical_id: string | null; label: string }> | null;
  is_witness: boolean;
}

/** Widen the pool so attention spreads instead of piling onto one task. */
const SPREAD_POOL = 40;

function toFeedTask(row: TaskRow, seed: number): FeedTask {
  const raw = row.sample_raw_text ?? row.raw_text_norm;
  const candidates: FeedCandidate[] = (row.candidates ?? [])
    .filter((c) => c && c.canonical_id)
    .map((c) => ({ canonicalId: c.canonical_id, label: c.label }));

  return {
    id: row.id,
    rawText: raw,
    merchantLabel: row.merchant_label,
    priceMedian: row.price_median == null ? null : Number(row.price_median),
    currency: row.currency,
    rowCount: row.row_count,
    isWitness: row.is_witness,
    // Option order is randomised per user. With a fixed order everyone anchors on the
    // machine's top guess, and what you measure stops being the truth and becomes the
    // machine's confidence reflected back at you.
    candidates: shuffle(candidates, seed + Number(row.id)),
  };
}

/** Deterministic per (user, task) shuffle — stable across a reload, different per user. */
function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hashUser(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface FeedResult {
  tasks: FeedTask[];
  quotaRemaining: number;
  pointsRemaining: number;
}

export async function getContributionFeed(
  username: string,
  limit = 10
): Promise<FeedResult> {
  const budget = await getDailyBudget(username);
  const take = Math.max(0, Math.min(limit, budget.remainingTasks));
  if (take === 0) {
    return { tasks: [], quotaRemaining: 0, pointsRemaining: budget.pointsRemaining };
  }

  const { rows } = await db.query<TaskRow>(
    `
    WITH mine AS (
      SELECT DISTINCT upper(btrim(li.raw_name)) AS norm
        FROM receipt_line_items li
        JOIN receipts r ON r.receipt_id = li.receipt_id
       WHERE r.username = $1
    )
    SELECT
      t.id,
      t.sample_raw_text,
      t.raw_text_norm,
      t.merchant_label,
      t.price_median,
      t.currency,
      t.row_count,
      t.candidates,
      (m.norm IS NOT NULL) AS is_witness
    FROM contribution_tasks t
    LEFT JOIN mine m ON m.norm = t.raw_text_norm
    WHERE t.status = 'open'
      -- One answer per user per task; a task already answered must never reappear.
      AND NOT EXISTS (
        SELECT 1 FROM contribution_answers a
         WHERE a.task_id = t.id AND a.username = $1
      )
      -- Rule 2: strangers only see strings with reach; witnesses see their own regardless.
      AND (m.norm IS NOT NULL OR t.row_count >= $3)
      AND t.is_gold = FALSE
    ORDER BY (m.norm IS NOT NULL) DESC, t.priority DESC, t.id
    LIMIT $2
    `,
    [username, SPREAD_POOL, MIN_ROW_COUNT_FOR_CROWD]
  );

  const seed = hashUser(username);
  const pool = rows.map((r) => toFeedTask(r, seed));

  // Witnesses stay in front; the rest of the pool is spread so the crowd does not all
  // land on the same task.
  const witnessTasks = pool.filter((t) => t.isWitness);
  const otherTasks = shuffle(
    pool.filter((t) => !t.isWitness),
    seed
  );
  const ordered = [...witnessTasks, ...otherTasks].slice(0, take);

  const withGold = await injectGoldTasks(username, ordered, seed, take);

  return {
    tasks: withGold,
    quotaRemaining: budget.remainingTasks,
    pointsRemaining: budget.pointsRemaining,
  };
}

/**
 * Mix in known-answer tasks at GOLD_TASK_RATE.
 *
 * Every gold task is throughput spent on a question nobody needed answered — but it is
 * the only way to measure a user without an admin, and the quota (K2) plus every
 * evidence weight depends on that measurement.
 */
async function injectGoldTasks(
  username: string,
  tasks: FeedTask[],
  seed: number,
  take: number
): Promise<FeedTask[]> {
  const goldCount = Math.floor(take * GOLD_TASK_RATE);
  if (goldCount <= 0) return tasks;

  const { rows } = await db.query<TaskRow>(
    `SELECT
       t.id, t.sample_raw_text, t.raw_text_norm, t.merchant_label,
       t.price_median, t.currency, t.row_count, t.candidates,
       FALSE AS is_witness
     FROM contribution_tasks t
     WHERE t.status = 'open'
       AND t.is_gold = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM contribution_answers a
          WHERE a.task_id = t.id AND a.username = $1
       )
     ORDER BY random()
     LIMIT $2`,
    [username, goldCount]
  );
  if (rows.length === 0) return tasks;

  const golds = rows.map((r) => toFeedTask(r, seed));
  const merged = [...tasks];
  // Scatter rather than append: a gold task in a fixed slot is a detectable gold task.
  for (const g of golds) {
    const at = Math.floor(Math.random() * (merged.length + 1));
    merged.splice(at, 0, g);
  }
  return merged.slice(0, take);
}
