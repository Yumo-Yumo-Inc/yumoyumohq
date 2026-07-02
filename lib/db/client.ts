/**
 * Neon PostgreSQL database client
 * SERVER-ONLY: Do not import in client components.
 */

if (typeof window !== "undefined") {
  throw new Error("db/client is a server-only module. Do not import in client components.");
}

import { neon } from "@neondatabase/serverless";

/** Row object from tagged-template queries (values are DB driver–dependent). */
export type SqlRow = Record<string, any>;
export type SqlTaggedTemplate = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<SqlRow[]>;

function getDatabaseUrl(): string | null {
  // NEW_DB_DATABASE_URL is the env var Vercel's Neon integration created
  // for the new us-east-1 database (the old DATABASE_URL is still wired
  // to the Singapore project and is integration-locked, so we cannot
  // edit it from the dashboard). Prefer the new one when present.
  // instrumentation.ts also remaps these at server startup; this fallback
  // is a defense-in-depth so the connection picks up the right URL even
  // if the instrumentation hook is bypassed for any reason.
  return process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL || null;
}

function describeDatabaseTarget(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "unknown-target";
  }
}

/**
 * One raw Neon client + a separately typed tagged-template wrapper.
 * Returning the raw callable from getSql() keeps TypeScript tied to Neon's
 * union return type; app code only sees SqlTaggedTemplate from getSql().
 */
/** Raw `neon()` handle; typed loosely to avoid generic variance across @neondatabase/serverless versions. */
let cachedNeonRaw: any = null;
let cachedTaggedSql: SqlTaggedTemplate | null = null;
let cachedSqlUrl: string | null = null;

function resolveNeon(databaseUrl: string): { raw: any; tag: SqlTaggedTemplate } {
  if (cachedNeonRaw && cachedSqlUrl === databaseUrl && cachedTaggedSql) {
    return { raw: cachedNeonRaw, tag: cachedTaggedSql };
  }
  const raw = neon(databaseUrl);
  const tag: SqlTaggedTemplate = (strings, ...values) =>
    raw(strings, ...values) as Promise<SqlRow[]>;
  cachedNeonRaw = raw;
  cachedTaggedSql = tag;
  cachedSqlUrl = databaseUrl;
  return { raw, tag };
}

export function getSql(): SqlTaggedTemplate | null {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.warn("[db/client] DATABASE_URL not set. Database operations will fail.");
    return null;
  }
  return resolveNeon(databaseUrl).tag;
}

/** Module init; typed as always callable to match historical call sites (runtime still no-ops if URL missing). */
export const sql = getSql() as SqlTaggedTemplate;

/**
 * Detect transient Neon connection failures that are safe to retry.
 * Covers cold-start resets, TLS handshake drops, and write timeouts seen in
 * production logs ("fetch failed" + ECONNRESET / ETIMEDOUT).
 */
function isTransientConnectionError(error: any): boolean {
  const cause = error?.cause;
  const codes = [error?.code, cause?.code, cause?.errno];
  if (codes.includes("ECONNRESET")) return true;
  if (codes.includes("ECONNREFUSED")) return true;
  if (codes.includes("ETIMEDOUT")) return true;
  if (codes.includes(-110)) return true; // ETIMEDOUT errno
  const message = `${error?.message ?? ""} ${cause?.message ?? ""}`.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("socket disconnected") ||
    message.includes("connection") ||
    message.includes("timeout")
  );
}

/** Retry a DB call with exponential backoff, only for transient connection errors. */
export async function withConnectionRetry<T>(fn: () => Promise<T>, retries = 2, delay = 400): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt < retries && isTransientConnectionError(error)) {
        console.warn(
          `[db/client] Transient connection error, retry ${attempt + 1}/${retries} after ${delay}ms:`,
          error?.message ?? error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("[db/client] Max connection retries exceeded");
}

function normalizeQueryResult(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: unknown[] }).rows;
  }
  return [];
}

export const db = {
  query: async <T = any>(queryText: string, params?: any[]): Promise<{ rows: T[] }> => {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      throw new Error("Database connection not available. DATABASE_URL is not set.");
    }
    const sqlClient = resolveNeon(databaseUrl).raw;

    return withConnectionRetry(async () => {
      if (params && params.length > 0) {
        const result = await sqlClient.query(queryText, params);
        const rows = normalizeQueryResult(result) as T[];
        return { rows };
      }

      // Parameterless path: use .query() (not .unsafe()). In this @neondatabase
      // /serverless version, sqlClient.unsafe(text) returns an UNEXECUTED query
      // descriptor ({ sql }), so every parameterless db.query() silently yielded
      // zero rows (e.g. admin stats counters read 0). .query(text) executes and
      // returns the same row-array shape normalizeQueryResult already handles.
      const result = await sqlClient.query(queryText);
      const rows = normalizeQueryResult(result) as T[];
      return { rows };
    });
  },
};

let isWarmedUp = false;
let warmUpPromise: Promise<void> | null = null;

export async function warmUpConnection(): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl || isWarmedUp) return;
  if (warmUpPromise) return warmUpPromise;

  warmUpPromise = (async () => {
    try {
      const raw = resolveNeon(databaseUrl).raw;
      await raw`SELECT 1`;
      isWarmedUp = true;
      console.log(`[db/client] Database connection warmed up (${describeDatabaseTarget(databaseUrl)})`);
    } catch (error) {
      console.warn("[db/client] Warm-up failed, will retry on first query:", error);
    } finally {
      warmUpPromise = null;
    }
  })();

  return warmUpPromise;
}
