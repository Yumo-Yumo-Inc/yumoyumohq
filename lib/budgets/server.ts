/**
 * Budget server-side helpers.
 *
 * The Personal Finance OS uses three new tables. Rather than requiring an
 * ahead-of-time migration, each helper calls `ensureSchema()` before running
 * queries. This keeps the feature deployable on Vercel/Neon without manual
 * steps and gracefully degrades (returns empty arrays) when DATABASE_URL is
 * not configured.
 *
 * Schema (plain SQL):
 *
 *   CREATE TABLE IF NOT EXISTS budgets (
 *     id            TEXT PRIMARY KEY,
 *     username      TEXT NOT NULL,
 *     category      TEXT NOT NULL,
 *     period        TEXT NOT NULL DEFAULT 'monthly',
 *     amount        NUMERIC NOT NULL,
 *     currency      TEXT NOT NULL,
 *     note          TEXT,
 *     source        TEXT NOT NULL DEFAULT 'manual',
 *     active        BOOLEAN NOT NULL DEFAULT TRUE,
 *     updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     version       BIGINT NOT NULL
 *   );
 */

import "server-only";

import { getSql, warmUpConnection } from "@/lib/db/client";
import type { CachedBudgetRecord } from "@/lib/offline/types";

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
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      category TEXT NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL,
      note TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      version BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS budgets_username_idx ON budgets(username)`;
  schemaReady = true;
}

function mapRow(row: Record<string, unknown>): CachedBudgetRecord {
  const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? new Date().toISOString());
  return {
    id: String(row.id),
    category: String(row.category ?? "other"),
    period: (row.period === "weekly" ? "weekly" : "monthly"),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "USD"),
    note: (row.note as string | null) ?? null,
    source: (row.source === "suggested" ? "suggested" : "manual"),
    active: row.active !== false,
    updated_at: updatedAt,
    version: Number(row.version ?? Date.parse(updatedAt)),
  };
}

export async function listBudgets(username: string): Promise<CachedBudgetRecord[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, category, period, amount, currency, note, source, active, updated_at, version
      FROM budgets
      WHERE username = ${username}
      ORDER BY category ASC
    `;
    return toRows<Record<string, unknown>>(rows).map(mapRow);
  } catch (error) {
    console.error("[budgets] listBudgets failed:", error);
    return [];
  }
}

export interface BudgetUpsertInput {
  id?: string;
  category: string;
  period?: "monthly" | "weekly";
  amount: number;
  currency: string;
  note?: string | null;
  source?: "manual" | "suggested";
  active?: boolean;
}

export async function upsertBudget(
  username: string,
  input: BudgetUpsertInput
): Promise<CachedBudgetRecord | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const id = input.id ?? `${username}:${input.category}:${input.period ?? "monthly"}`;
  const nowIso = new Date().toISOString();
  const version = Date.parse(nowIso);
  const rows = await sql`
    INSERT INTO budgets (id, username, category, period, amount, currency, note, source, active, updated_at, version)
    VALUES (${id}, ${username}, ${input.category}, ${input.period ?? "monthly"}, ${input.amount}, ${input.currency}, ${input.note ?? null}, ${input.source ?? "manual"}, ${input.active ?? true}, ${nowIso}, ${version})
    ON CONFLICT (id) DO UPDATE SET
      category = EXCLUDED.category,
      period = EXCLUDED.period,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      note = EXCLUDED.note,
      source = EXCLUDED.source,
      active = EXCLUDED.active,
      updated_at = EXCLUDED.updated_at,
      version = EXCLUDED.version
    WHERE budgets.username = ${username}
    RETURNING id, category, period, amount, currency, note, source, active, updated_at, version
  `;
  const row = toRows<Record<string, unknown>>(rows)[0];
  return row ? mapRow(row) : null;
}

export async function deleteBudget(username: string, id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`
    DELETE FROM budgets WHERE username = ${username} AND id = ${id} RETURNING id
  `;
  return toRows(rows).length > 0;
}
