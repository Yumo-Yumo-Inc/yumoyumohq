/**
 * Accuracy → task quota (K2, Uğur 2026-07-17).
 *
 * "Doğru cevap verdikçe daha fazla görev alabilirler." Wrong answers are not punished
 * with a fine; they cost future work. Nobody wants to be wrong, and no admin is involved.
 *
 * Accuracy is measured ONLY against gold tasks — tasks whose answer we already know,
 * mixed invisibly into the feed. Never against agreement with the crowd, for two reasons:
 *
 *   - Agreement measures conformity, not correctness. On a string where everyone is
 *     wrong, the one person who is right would lose quota for it.
 *   - It would be circular: consensus is the thing we are trying to establish.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/contribution/reliability is server-only.");
}

import { db } from "@/lib/db/client";
import {
  DAILY_TASK_POINT_CAP,
  RELIABILITY_DEFAULT,
  TASK_SOURCE_TYPE_PREFIX,
  dailyQuotaFor,
  reliabilityFrom,
} from "@/config/contribution-center";

export interface ReliabilityState {
  username: string;
  goldSeen: number;
  goldCorrect: number;
  answersTotal: number;
  answersWrong: number;
  reliability: number;
  dailyQuota: number;
}

const DEFAULT_STATE = (username: string): ReliabilityState => ({
  username,
  goldSeen: 0,
  goldCorrect: 0,
  answersTotal: 0,
  answersWrong: 0,
  reliability: RELIABILITY_DEFAULT,
  dailyQuota: dailyQuotaFor(RELIABILITY_DEFAULT),
});

interface Row {
  username: string;
  gold_seen: number;
  gold_correct: number;
  answers_total: number;
  answers_wrong: number;
  reliability: string | number;
  daily_quota: number;
}

const toState = (r: Row): ReliabilityState => ({
  username: r.username,
  goldSeen: r.gold_seen,
  goldCorrect: r.gold_correct,
  answersTotal: r.answers_total,
  answersWrong: r.answers_wrong,
  reliability: Number(r.reliability),
  dailyQuota: r.daily_quota,
});

/**
 * Read a user's state, creating the default row on first sight.
 *
 * Self-healing rather than seeded at signup: a user who never opens the Contribution
 * Center should not carry a row, and a user who does must not hit an empty result —
 * that pattern already bit us once (season cosmetics, 2026-07-14).
 */
export async function getReliability(username: string): Promise<ReliabilityState> {
  try {
    const { rows } = await db.query<Row>(
      `INSERT INTO user_contribution_reliability (username, reliability, daily_quota)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
       RETURNING *`,
      [username, RELIABILITY_DEFAULT, dailyQuotaFor(RELIABILITY_DEFAULT)]
    );
    return rows[0] ? toState(rows[0]) : DEFAULT_STATE(username);
  } catch (error) {
    // Never block the feed on the accuracy layer.
    console.warn("[contribution/reliability] read failed:", (error as Error).message);
    return DEFAULT_STATE(username);
  }
}

/**
 * Record the outcome of one gold task and recompute quota.
 *
 * Only gold answers move reliability. `wasCorrect` for a non-gold answer is filled in
 * later by the resolution engine for reporting, and deliberately does not feed this.
 */
export async function recordGoldOutcome(
  username: string,
  wasCorrect: boolean
): Promise<ReliabilityState> {
  const { rows } = await db.query<Row>(
    `INSERT INTO user_contribution_reliability
       (username, gold_seen, gold_correct, reliability, daily_quota, updated_at)
     VALUES ($1, 1, $2, $3, $4, now())
     ON CONFLICT (username) DO UPDATE SET
       gold_seen    = user_contribution_reliability.gold_seen + 1,
       gold_correct = user_contribution_reliability.gold_correct + $2,
       updated_at   = now()
     RETURNING *`,
    [
      username,
      wasCorrect ? 1 : 0,
      reliabilityFrom(wasCorrect ? 1 : 0, 1),
      dailyQuotaFor(reliabilityFrom(wasCorrect ? 1 : 0, 1)),
    ]
  );

  const row = rows[0];
  if (!row) return DEFAULT_STATE(username);

  // The counters are authoritative; reliability/quota are derived from them in a second
  // step so the formula lives in one place (config) instead of being half-expressed in
  // SQL. Doing it inside the same statement would mean writing the Beta prior twice.
  const reliability = reliabilityFrom(row.gold_correct, row.gold_seen);
  const quota = dailyQuotaFor(reliability);

  const { rows: updated } = await db.query<Row>(
    `UPDATE user_contribution_reliability
        SET reliability = $2, daily_quota = $3, updated_at = now()
      WHERE username = $1
      RETURNING *`,
    [username, reliability, quota]
  );

  return updated[0] ? toState(updated[0]) : DEFAULT_STATE(username);
}

/** Bump answer counters. Reporting only — does not move reliability (see module docs). */
async function recordAnswerCounters(
  username: string,
  wrong: boolean
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO user_contribution_reliability (username, answers_total, answers_wrong, reliability, daily_quota)
       VALUES ($1, 1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET
         answers_total = user_contribution_reliability.answers_total + 1,
         answers_wrong = user_contribution_reliability.answers_wrong + $2,
         updated_at    = now()`,
      [
        username,
        wrong ? 1 : 0,
        RELIABILITY_DEFAULT,
        dailyQuotaFor(RELIABILITY_DEFAULT),
      ]
    );
  } catch (error) {
    console.warn("[contribution/reliability] counters failed:", (error as Error).message);
  }
}

export interface DailyBudget {
  quota: number;
  answeredToday: number;
  remainingTasks: number;
  pointsToday: number;
  pointsRemaining: number;
}

/**
 * What this user may still do today.
 *
 * Two ceilings, because they bound different things. The quota bounds tasks and is
 * earned (K2). The point cap bounds the ledger and is fixed at 500/day (Uğur) — it
 * normally sits exactly on QUOTA_MAX * TASK_POINTS_IDENTIFY, and only binds separately
 * when points arrive from outside the quota (a won "Diğer" bonus, a field mission).
 *
 * The point cap is not optional: contribution_point_events has no daily limit of its
 * own — every existing cap lives on receipt_rewards.bint_bonus_amount — so a new
 * source_type without one is an uncapped tap.
 */
export async function getDailyBudget(username: string): Promise<DailyBudget> {
  const state = await getReliability(username);

  const { rows } = await db.query<{ answered: number; points: string | number }>(
    `SELECT
       (SELECT count(*)::int FROM contribution_answers
         WHERE username = $1 AND created_at >= (now() AT TIME ZONE 'UTC')::date) AS answered,
       (SELECT COALESCE(sum(points_delta), 0) FROM contribution_point_events
         WHERE username = $1
           AND source_type LIKE $2
           AND created_at >= (now() AT TIME ZONE 'UTC')::date) AS points`,
    [username, `${TASK_SOURCE_TYPE_PREFIX}%`]
  );

  const answeredToday = rows[0]?.answered ?? 0;
  const pointsToday = Number(rows[0]?.points ?? 0);

  return {
    quota: state.dailyQuota,
    answeredToday,
    remainingTasks: Math.max(0, state.dailyQuota - answeredToday),
    pointsToday,
    pointsRemaining: Math.max(0, DAILY_TASK_POINT_CAP - pointsToday),
  };
}
