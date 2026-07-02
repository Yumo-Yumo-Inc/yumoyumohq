/**
 * Subscription server-side helpers.
 *
 * Mirrors the pattern used in `lib/budgets/server.ts`:
 *   - lazy schema creation so the feature works without a manual migration;
 *   - graceful no-op when DATABASE_URL is absent;
 *   - versioned records for delta sync.
 *
 * Schema:
 *
 *   CREATE TABLE IF NOT EXISTS subscriptions (
 *     id             TEXT PRIMARY KEY,
 *     username       TEXT NOT NULL,
 *     merchant_name  TEXT NOT NULL,
 *     category       TEXT,
 *     amount         NUMERIC NOT NULL,
 *     currency       TEXT NOT NULL,
 *     cadence        TEXT NOT NULL DEFAULT 'monthly',
 *     next_charge_at TIMESTAMPTZ,
 *     source         TEXT NOT NULL DEFAULT 'manual',
 *     confidence     NUMERIC NOT NULL DEFAULT 1,
 *     status         TEXT NOT NULL DEFAULT 'active',
 *     last_seen_at   TIMESTAMPTZ,
 *     updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     version        BIGINT NOT NULL
 *   );
 */

import "server-only";

import { getSql, warmUpConnection } from "@/lib/db/client";
import type {
  CachedSubscriptionRecord,
  SubscriptionCadence,
  SubscriptionStatus,
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
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      merchant_name TEXT NOT NULL,
      category TEXT,
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL,
      cadence TEXT NOT NULL DEFAULT 'monthly',
      next_charge_at TIMESTAMPTZ,
      source TEXT NOT NULL DEFAULT 'manual',
      confidence NUMERIC NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      last_seen_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      version BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS subscriptions_username_idx ON subscriptions(username)`;
  schemaReady = true;
}

function mapRow(row: Record<string, unknown>): CachedSubscriptionRecord {
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at ?? new Date().toISOString());
  const nextChargeAt =
    row.next_charge_at instanceof Date ? row.next_charge_at.toISOString() : (row.next_charge_at as string | null) ?? null;
  const lastSeenAt =
    row.last_seen_at instanceof Date ? row.last_seen_at.toISOString() : (row.last_seen_at as string | null) ?? null;
  const cadenceRaw = String(row.cadence ?? "monthly");
  const cadence: SubscriptionCadence =
    cadenceRaw === "weekly" || cadenceRaw === "yearly" || cadenceRaw === "unknown"
      ? cadenceRaw
      : "monthly";
  const statusRaw = String(row.status ?? "active");
  const status: SubscriptionStatus =
    statusRaw === "paused" || statusRaw === "cancelled" ? statusRaw : "active";
  return {
    id: String(row.id),
    merchantName: String(row.merchant_name ?? "Unknown"),
    category: (row.category as string | null) ?? null,
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "USD"),
    cadence,
    nextChargeAt,
    source: row.source === "auto_detected" ? "auto_detected" : "manual",
    confidence: Number(row.confidence ?? 1),
    status,
    lastSeenAt,
    updated_at: updatedAt,
    version: Number(row.version ?? Date.parse(updatedAt)),
  };
}

export async function listSubscriptions(username: string): Promise<CachedSubscriptionRecord[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, merchant_name, category, amount, currency, cadence, next_charge_at,
             source, confidence, status, last_seen_at, updated_at, version
      FROM subscriptions
      WHERE username = ${username}
      ORDER BY merchant_name ASC
    `;
    return toRows<Record<string, unknown>>(rows).map(mapRow);
  } catch (error) {
    console.error("[subscriptions] listSubscriptions failed:", error);
    return [];
  }
}

export interface SubscriptionUpsertInput {
  id?: string;
  merchantName: string;
  category?: string | null;
  amount: number;
  currency: string;
  cadence?: SubscriptionCadence;
  nextChargeAt?: string | null;
  source?: "manual" | "auto_detected";
  confidence?: number;
  status?: SubscriptionStatus;
  lastSeenAt?: string | null;
}

export async function upsertSubscription(
  username: string,
  input: SubscriptionUpsertInput
): Promise<CachedSubscriptionRecord | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const id = input.id ?? `${username}:${input.merchantName}:${input.cadence ?? "monthly"}`;
  const nowIso = new Date().toISOString();
  const version = Date.parse(nowIso);
  const rows = await sql`
    INSERT INTO subscriptions (id, username, merchant_name, category, amount, currency,
                               cadence, next_charge_at, source, confidence, status,
                               last_seen_at, updated_at, version)
    VALUES (${id}, ${username}, ${input.merchantName}, ${input.category ?? null}, ${input.amount},
            ${input.currency}, ${input.cadence ?? "monthly"}, ${input.nextChargeAt ?? null},
            ${input.source ?? "manual"}, ${input.confidence ?? 1}, ${input.status ?? "active"},
            ${input.lastSeenAt ?? null}, ${nowIso}, ${version})
    ON CONFLICT (id) DO UPDATE SET
      merchant_name = EXCLUDED.merchant_name,
      category = EXCLUDED.category,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      cadence = EXCLUDED.cadence,
      next_charge_at = EXCLUDED.next_charge_at,
      source = EXCLUDED.source,
      confidence = EXCLUDED.confidence,
      status = EXCLUDED.status,
      last_seen_at = EXCLUDED.last_seen_at,
      updated_at = EXCLUDED.updated_at,
      version = EXCLUDED.version
    WHERE subscriptions.username = ${username}
    RETURNING id, merchant_name, category, amount, currency, cadence, next_charge_at,
              source, confidence, status, last_seen_at, updated_at, version
  `;
  const row = toRows<Record<string, unknown>>(rows)[0];
  return row ? mapRow(row) : null;
}

export async function deleteSubscription(username: string, id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`
    DELETE FROM subscriptions WHERE username = ${username} AND id = ${id} RETURNING id
  `;
  return toRows(rows).length > 0;
}
