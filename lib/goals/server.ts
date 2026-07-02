/**
 * Financial goals server-side helpers.
 *
 * Follows the same pattern as `lib/budgets/server.ts` and
 * `lib/subscriptions/server.ts`:
 *   - lazy schema creation,
 *   - graceful no-op when DATABASE_URL is absent,
 *   - versioned records for delta sync.
 *
 * Schema:
 *
 *   CREATE TABLE IF NOT EXISTS financial_goals (
 *     id              TEXT PRIMARY KEY,
 *     username        TEXT NOT NULL,
 *     title           TEXT NOT NULL,
 *     target_amount   NUMERIC NOT NULL,
 *     currency        TEXT NOT NULL,
 *     deadline        DATE,
 *     progress_amount NUMERIC NOT NULL DEFAULT 0,
 *     status          TEXT NOT NULL DEFAULT 'active',
 *     note            TEXT,
 *     updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     version         BIGINT NOT NULL
 *   );
 */

import "server-only";

import { getSql, warmUpConnection } from "@/lib/db/client";
import type {
  CachedFinancialGoalRecord,
  FinancialGoalStatus,
} from "@/lib/offline/types";

let schemaReady = false;

function toRows<T = unknown>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows)) {
    return (r as { rows: T[] }).rows;
  }
  return [];
}

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = getSql();
  if (!sql) return;
  await warmUpConnection();
  await sql`
    CREATE TABLE IF NOT EXISTS financial_goals (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      target_amount NUMERIC NOT NULL,
      currency TEXT NOT NULL,
      deadline DATE,
      progress_amount NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      note TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      version BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS financial_goals_username_idx ON financial_goals(username)`;
  schemaReady = true;
}

function normalizeStatus(value: unknown): FinancialGoalStatus {
  const raw = String(value ?? "active");
  return raw === "paused" || raw === "achieved" || raw === "cancelled" ? raw : "active";
}

function mapRow(row: Record<string, unknown>): CachedFinancialGoalRecord {
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at ?? new Date().toISOString());
  const deadline =
    row.deadline instanceof Date ? row.deadline.toISOString().slice(0, 10) : (row.deadline as string | null) ?? null;
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    targetAmount: Number(row.target_amount ?? 0),
    currency: String(row.currency ?? "USD"),
    deadline,
    progressAmount: Number(row.progress_amount ?? 0),
    status: normalizeStatus(row.status),
    note: (row.note as string | null) ?? null,
    updated_at: updatedAt,
    version: Number(row.version ?? Date.parse(updatedAt)),
  };
}

export async function listGoals(username: string): Promise<CachedFinancialGoalRecord[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, title, target_amount, currency, deadline, progress_amount, status, note, updated_at, version
      FROM financial_goals
      WHERE username = ${username}
      ORDER BY deadline NULLS LAST, updated_at DESC
    `;
    return toRows<Record<string, unknown>>(rows).map(mapRow);
  } catch (error) {
    console.error("[goals] listGoals failed:", error);
    return [];
  }
}

export interface GoalUpsertInput {
  id?: string;
  title: string;
  targetAmount: number;
  currency: string;
  deadline?: string | null;
  progressAmount?: number;
  status?: FinancialGoalStatus;
  note?: string | null;
}

export async function upsertGoal(
  username: string,
  input: GoalUpsertInput
): Promise<CachedFinancialGoalRecord | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const id = input.id ?? `${username}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = new Date().toISOString();
  const version = Date.parse(nowIso);
  const rows = await sql`
    INSERT INTO financial_goals (id, username, title, target_amount, currency, deadline,
                                 progress_amount, status, note, updated_at, version)
    VALUES (${id}, ${username}, ${input.title}, ${input.targetAmount}, ${input.currency},
            ${input.deadline ?? null}, ${input.progressAmount ?? 0},
            ${input.status ?? "active"}, ${input.note ?? null}, ${nowIso}, ${version})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      target_amount = EXCLUDED.target_amount,
      currency = EXCLUDED.currency,
      deadline = EXCLUDED.deadline,
      progress_amount = EXCLUDED.progress_amount,
      status = EXCLUDED.status,
      note = EXCLUDED.note,
      updated_at = EXCLUDED.updated_at,
      version = EXCLUDED.version
    WHERE financial_goals.username = ${username}
    RETURNING id, title, target_amount, currency, deadline, progress_amount, status, note, updated_at, version
  `;
  const row = toRows<Record<string, unknown>>(rows)[0];
  return row ? mapRow(row) : null;
}

export async function deleteGoal(username: string, id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`
    DELETE FROM financial_goals WHERE username = ${username} AND id = ${id} RETURNING id
  `;
  return toRows(rows).length > 0;
}
