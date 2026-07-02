/**
 * Insight event server-side helpers.
 *
 * An insight_event is the canonical record of a behavior-engine detection.
 * Engines (own-price-track, impulse-fingerprint, category-drift, past-self)
 * emit `detected` events; the user's interaction mutates `state`, and when
 * they commit we write `spawned_commitment_id` to close the loop.
 *
 * Schema:
 *
 *   CREATE TABLE IF NOT EXISTS insight_events (
 *     id                      TEXT PRIMARY KEY,
 *     username                TEXT NOT NULL,
 *     kind                    TEXT NOT NULL,
 *     state                   TEXT NOT NULL DEFAULT 'detected',
 *     title                   TEXT NOT NULL,
 *     summary                 TEXT,
 *     confidence              NUMERIC NOT NULL DEFAULT 0.5,
 *     monetary_impact         NUMERIC,
 *     currency                TEXT,
 *     payload                 JSONB NOT NULL DEFAULT '{}'::jsonb,
 *     detected_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     viewed_at               TIMESTAMPTZ,
 *     resolved_at             TIMESTAMPTZ,
 *     spawned_commitment_id   TEXT,
 *     updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     version                 BIGINT NOT NULL
 *   );
 */

import "server-only";

import { getSql, warmUpConnection } from "@/lib/db/client";
import type {
  CachedInsightEventRecord,
  InsightEventKind,
  InsightEventState,
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
    CREATE TABLE IF NOT EXISTS insight_events (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      kind TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'detected',
      title TEXT NOT NULL,
      summary TEXT,
      confidence NUMERIC NOT NULL DEFAULT 0.5,
      monetary_impact NUMERIC,
      currency TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      viewed_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      spawned_commitment_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      version BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS insight_events_user_state_idx ON insight_events(username, state)`;
  await sql`CREATE INDEX IF NOT EXISTS insight_events_detected_idx ON insight_events(username, detected_at DESC)`;
  schemaReady = true;
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapRow(row: Record<string, unknown>): CachedInsightEventRecord {
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at ?? new Date().toISOString());
  const detectedAt = toIsoOrNull(row.detected_at) ?? updatedAt;
  const id = String(row.id);
  const payloadRaw = row.payload;
  let payload: Record<string, unknown> = {};
  if (payloadRaw && typeof payloadRaw === "object") {
    payload = payloadRaw as Record<string, unknown>;
  } else if (typeof payloadRaw === "string") {
    try {
      payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  return {
    id,
    insightEventId: id,
    kind: String(row.kind ?? "past_self") as InsightEventKind,
    state: String(row.state ?? "detected") as InsightEventState,
    title: String(row.title ?? ""),
    summary: (row.summary as string | null) ?? null,
    confidence: Number(row.confidence ?? 0.5),
    monetaryImpact:
      row.monetary_impact !== null && row.monetary_impact !== undefined
        ? Number(row.monetary_impact)
        : null,
    currency: (row.currency as string | null) ?? null,
    payload,
    detectedAt,
    viewedAt: toIsoOrNull(row.viewed_at),
    resolvedAt: toIsoOrNull(row.resolved_at),
    spawnedCommitmentId: (row.spawned_commitment_id as string | null) ?? null,
    updated_at: updatedAt,
    version: Number(row.version ?? Date.parse(updatedAt)),
  };
}

export async function listInsightEvents(
  username: string,
  options?: { since?: string | null; limit?: number }
): Promise<CachedInsightEventRecord[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureSchema();
    const since = options?.since?.trim() ? options!.since!.trim() : null;
    const limit = Math.max(1, Math.min(options?.limit ?? 200, 1000));
    const rows = since
      ? await sql`
          SELECT id, kind, state, title, summary, confidence, monetary_impact,
                 currency, payload, detected_at, viewed_at, resolved_at,
                 spawned_commitment_id, updated_at, version
          FROM insight_events
          WHERE username = ${username} AND updated_at > ${since}
          ORDER BY detected_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT id, kind, state, title, summary, confidence, monetary_impact,
                 currency, payload, detected_at, viewed_at, resolved_at,
                 spawned_commitment_id, updated_at, version
          FROM insight_events
          WHERE username = ${username}
          ORDER BY detected_at DESC
          LIMIT ${limit}
        `;
    return toRows<Record<string, unknown>>(rows).map(mapRow);
  } catch (error) {
    console.error("[insight_events] listInsightEvents failed:", error);
    return [];
  }
}

export interface InsightEventUpsertInput {
  id?: string;
  kind: InsightEventKind;
  state?: InsightEventState;
  title: string;
  summary?: string | null;
  confidence?: number;
  monetaryImpact?: number | null;
  currency?: string | null;
  payload?: Record<string, unknown>;
  detectedAt?: string | null;
}

function randomEventId(username: string, kind: InsightEventKind): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `ie_${username.slice(0, 8)}_${kind.slice(0, 6)}_${Date.now().toString(36)}_${rnd}`;
}

export async function upsertInsightEvent(
  username: string,
  input: InsightEventUpsertInput
): Promise<CachedInsightEventRecord | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const id = input.id ?? randomEventId(username, input.kind);
  const nowIso = new Date().toISOString();
  const version = Date.parse(nowIso);
  const payloadJson = JSON.stringify(input.payload ?? {});
  const detectedAt = input.detectedAt ?? nowIso;
  const rows = await sql`
    INSERT INTO insight_events (
      id, username, kind, state, title, summary, confidence, monetary_impact,
      currency, payload, detected_at, updated_at, version
    )
    VALUES (
      ${id}, ${username}, ${input.kind}, ${input.state ?? "detected"},
      ${input.title}, ${input.summary ?? null},
      ${input.confidence ?? 0.5}, ${input.monetaryImpact ?? null},
      ${input.currency ?? null}, ${payloadJson}::jsonb,
      ${detectedAt}, ${nowIso}, ${version}
    )
    ON CONFLICT (id) DO UPDATE SET
      kind = EXCLUDED.kind,
      state = EXCLUDED.state,
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      confidence = EXCLUDED.confidence,
      monetary_impact = EXCLUDED.monetary_impact,
      currency = EXCLUDED.currency,
      payload = EXCLUDED.payload,
      detected_at = EXCLUDED.detected_at,
      updated_at = EXCLUDED.updated_at,
      version = EXCLUDED.version
    WHERE insight_events.username = ${username}
    RETURNING id, kind, state, title, summary, confidence, monetary_impact,
              currency, payload, detected_at, viewed_at, resolved_at,
              spawned_commitment_id, updated_at, version
  `;
  const row = toRows<Record<string, unknown>>(rows)[0];
  return row ? mapRow(row) : null;
}

/**
 * Transition an event to a new state. Optionally stamp the commitment id
 * that spawned from it (used when transitioning to `committed`).
 */
export async function setInsightEventState(
  username: string,
  id: string,
  state: InsightEventState,
  options?: { spawnedCommitmentId?: string | null }
): Promise<CachedInsightEventRecord | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const nowIso = new Date().toISOString();
  const version = Date.parse(nowIso);
  const viewedAt = state === "viewed" ? nowIso : null;
  const resolvedAt =
    state === "committed" || state === "dismissed" || state === "snoozed" ? nowIso : null;
  const commitmentId = options?.spawnedCommitmentId ?? null;

  const rows = await sql`
    UPDATE insight_events
    SET state = ${state},
        viewed_at = COALESCE(${viewedAt}, viewed_at),
        resolved_at = COALESCE(${resolvedAt}, resolved_at),
        spawned_commitment_id = COALESCE(${commitmentId}, spawned_commitment_id),
        updated_at = ${nowIso},
        version = ${version}
    WHERE id = ${id} AND username = ${username}
    RETURNING id, kind, state, title, summary, confidence, monetary_impact,
              currency, payload, detected_at, viewed_at, resolved_at,
              spawned_commitment_id, updated_at, version
  `;
  const row = toRows<Record<string, unknown>>(rows)[0];
  return row ? mapRow(row) : null;
}

/**
 * Bulk upsert used by the orchestrator when it surfaces a fresh detection
 * batch. Returns all successfully persisted rows in the order they were
 * submitted.
 */
export async function bulkUpsertInsightEvents(
  username: string,
  inputs: InsightEventUpsertInput[]
): Promise<CachedInsightEventRecord[]> {
  if (inputs.length === 0) return [];
  const out: CachedInsightEventRecord[] = [];
  for (const input of inputs) {
    const result = await upsertInsightEvent(username, input);
    if (result) out.push(result);
  }
  return out;
}
