import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { getDailyBudget } from "@/lib/contribution/reliability";
import { CONSENSUS_WITNESS_RATE_TRIGGER } from "@/config/contribution-center";

export const dynamic = "force-dynamic";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [budget, own, collective, witness] = await Promise.all([
    getDailyBudget(username),
    db.query<{ answered: number; rows_fixed: number }>(
      `SELECT count(*)::int AS answered,
              COALESCE(sum(CASE WHEN t.status = 'resolved' THEN t.row_count ELSE 0 END), 0)::int AS rows_fixed
         FROM contribution_answers a JOIN contribution_tasks t ON t.id = a.task_id
        WHERE a.username = $1`,
      [username]
    ),
    db.query<{ open_tasks: number; resolved_tasks: number }>(
      `SELECT count(*) FILTER (WHERE status = 'open')::int AS open_tasks,
              count(*) FILTER (WHERE status = 'resolved')::int AS resolved_tasks
         FROM contribution_tasks`
    ),
    db.query<{ rate: string | number | null }>(
      `SELECT CASE WHEN count(*) = 0 THEN NULL
                   ELSE sum(witness_count)::numeric / count(*) END AS rate
         FROM contribution_tasks WHERE created_at >= now() - interval '30 days'`
    ),
  ]);
  const witnessRate = witness.rows[0]?.rate == null ? null : Number(witness.rows[0].rate);
  return NextResponse.json({
    me: {
      answered: own.rows[0]?.answered ?? 0,
      rowsFixed: own.rows[0]?.rows_fixed ?? 0,
      quota: budget.quota,
      quotaRemaining: budget.remainingTasks,
      pointsToday: budget.pointsToday,
      pointsRemaining: budget.pointsRemaining,
    },
    collective: {
      openTasks: collective.rows[0]?.open_tasks ?? 0,
      resolvedTasks: collective.rows[0]?.resolved_tasks ?? 0,
    },
    consensus: {
      witnessRate,
      trigger: CONSENSUS_WITNESS_RATE_TRIGGER,
      reachable: witnessRate != null && witnessRate >= CONSENSUS_WITNESS_RATE_TRIGGER,
    },
  });
}

