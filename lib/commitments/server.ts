/**
 * Commitment server-side helpers.
 *
 * Schema (kept inline — see the pattern in lib/budgets/server.ts for rationale):
 *
 *   CREATE TABLE IF NOT EXISTS commitments (
 *     id                   TEXT PRIMARY KEY,
 *     username             TEXT NOT NULL,
 *     kind                 TEXT NOT NULL,
 *     status               TEXT NOT NULL DEFAULT 'active',
 *     source_event_id      TEXT,
 *     title                TEXT NOT NULL,
 *     description          TEXT,
 *     params               JSONB NOT NULL DEFAULT '{}'::jsonb,
 *     progress             NUMERIC NOT NULL DEFAULT 0,
 *     target               NUMERIC,
 *     currency             TEXT,
 *     starts_at            TIMESTAMPTZ,
 *     ends_at              TIMESTAMPTZ,
 *     last_evaluated_at    TIMESTAMPTZ,
 *     updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     version              BIGINT NOT NULL
 *   );
 */

import "server-only";

import { getSql, warmUpConnection } from "@/lib/db/client";
import type {
  CachedCommitmentRecord,
  CommitmentKind,
  CommitmentStatus,
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
    CREATE TABLE IF NOT EXISTS commitments (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      source_event_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      params JSONB NOT NULL DEFAULT '{}'::jsonb,
      progress NUMERIC NOT NULL DEFAULT 0,
      target NUMERIC,
      currency TEXT,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      last_evaluated_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      version BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS commitments_user_status_idx ON commitments(username, status)`;
  schemaReady = true;
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapRow(row: Record<string, unknown>): CachedCommitmentRecord {
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at ?? new Date().toISOString());
  const id = String(row.id);
  const paramsRaw = row.params;
  let params: Record<string, unknown> = {};
  if (paramsRaw && typeof paramsRaw === "object") {
    params = paramsRaw as Record<string, unknown>;
  } else if (typeof paramsRaw === "string") {
    try {
      params = JSON.parse(paramsRaw) as Record<string, unknown>;
    } catch {
      params = {};
    }
  }

  return {
    id,
    commitmentId: id,
    kind: String(row.kind ?? "category_cap") as CommitmentKind,
    status: (String(row.status ?? "active") as CommitmentStatus),
    sourceEventId: (row.source_event_id as string | null) ?? null,
    title: String(row.title ?? ""),
    description: (row.description as string | null) ?? null,
    params,
    progress: Number(row.progress ?? 0),
    target: row.target !== null && row.target !== undefined ? Number(row.target) : null,
    currency: (row.currency as string | null) ?? null,
    startsAt: toIsoOrNull(row.starts_at),
    endsAt: toIsoOrNull(row.ends_at),
    lastEvaluatedAt: toIsoOrNull(row.last_evaluated_at),
    updated_at: updatedAt,
    version: Number(row.version ?? Date.parse(updatedAt)),
  };
}

export async function listCommitments(username: string): Promise<CachedCommitmentRecord[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, kind, status, source_event_id, title, description, params,
             progress, target, currency, starts_at, ends_at, last_evaluated_at,
             updated_at, version
      FROM commitments
      WHERE username = ${username}
      ORDER BY status ASC, updated_at DESC
    `;
    return toRows<Record<string, unknown>>(rows).map(mapRow);
  } catch (error) {
    console.error("[commitments] listCommitments failed:", error);
    return [];
  }
}

export interface CommitmentUpsertInput {
  id?: string;
  kind: CommitmentKind;
  status?: CommitmentStatus;
  sourceEventId?: string | null;
  title: string;
  description?: string | null;
  params?: Record<string, unknown>;
  progress?: number;
  target?: number | null;
  currency?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  lastEvaluatedAt?: string | null;
}

function randomId(username: string, kind: CommitmentKind): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `cmt_${username.slice(0, 8)}_${kind.slice(0, 6)}_${Date.now().toString(36)}_${rnd}`;
}

export async function upsertCommitment(
  username: string,
  input: CommitmentUpsertInput
): Promise<CachedCommitmentRecord | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const id = input.id ?? randomId(username, input.kind);
  const nowIso = new Date().toISOString();
  const version = Date.parse(nowIso);
  const paramsJson = JSON.stringify(input.params ?? {});
  const rows = await sql`
    INSERT INTO commitments (
      id, username, kind, status, source_event_id, title, description, params,
      progress, target, currency, starts_at, ends_at, last_evaluated_at,
      updated_at, version
    )
    VALUES (
      ${id}, ${username}, ${input.kind}, ${input.status ?? "active"},
      ${input.sourceEventId ?? null}, ${input.title}, ${input.description ?? null},
      ${paramsJson}::jsonb,
      ${input.progress ?? 0}, ${input.target ?? null}, ${input.currency ?? null},
      ${input.startsAt ?? null}, ${input.endsAt ?? null}, ${input.lastEvaluatedAt ?? null},
      ${nowIso}, ${version}
    )
    ON CONFLICT (id) DO UPDATE SET
      kind = EXCLUDED.kind,
      status = EXCLUDED.status,
      source_event_id = EXCLUDED.source_event_id,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      params = EXCLUDED.params,
      progress = EXCLUDED.progress,
      target = EXCLUDED.target,
      currency = EXCLUDED.currency,
      starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at,
      last_evaluated_at = EXCLUDED.last_evaluated_at,
      updated_at = EXCLUDED.updated_at,
      version = EXCLUDED.version
    WHERE commitments.username = ${username}
    RETURNING id, kind, status, source_event_id, title, description, params,
              progress, target, currency, starts_at, ends_at, last_evaluated_at,
              updated_at, version
  `;
  const row = toRows<Record<string, unknown>>(rows)[0];
  return row ? mapRow(row) : null;
}

export async function setCommitmentStatus(
  username: string,
  id: string,
  status: CommitmentStatus
): Promise<CachedCommitmentRecord | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const nowIso = new Date().toISOString();
  const version = Date.parse(nowIso);
  const rows = await sql`
    UPDATE commitments
    SET status = ${status}, updated_at = ${nowIso}, version = ${version}
    WHERE id = ${id} AND username = ${username}
    RETURNING id, kind, status, source_event_id, title, description, params,
              progress, target, currency, starts_at, ends_at, last_evaluated_at,
              updated_at, version
  `;
  const row = toRows<Record<string, unknown>>(rows)[0];
  return row ? mapRow(row) : null;
}

export async function deleteCommitment(username: string, id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`
    DELETE FROM commitments WHERE username = ${username} AND id = ${id} RETURNING id
  `;
  return toRows(rows).length > 0;
}
