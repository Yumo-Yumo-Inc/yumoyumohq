/**
 * Upstash Redis client (REST API).
 *
 * SERVER-ONLY. Do not import in client components.
 *
 * Env vars come from the Vercel ↔ Upstash integration:
 *   KV_REST_API_URL    — REST endpoint (e.g. https://*.upstash.io)
 *   KV_REST_API_TOKEN  — write token
 *
 * The client is a thin wrapper around `@upstash/redis`. Failures degrade
 * gracefully — every helper returns `null` / no-ops on connection errors so
 * a Redis outage never takes the app down. The leaderboard layer treats
 * cache miss + cache error identically (recompute from Postgres).
 */

if (typeof window !== "undefined") {
  throw new Error("lib/cache/redis is a server-only module. Do not import in client components.");
}

import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let initialized = false;

function getClient(): Redis | null {
  if (initialized) return client;
  initialized = true;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[cache/redis] KV_REST_API_URL / KV_REST_API_TOKEN not set — cache disabled. " +
          "Run `vercel env pull .env.local` if you've connected the Upstash integration."
      );
    }
    return null;
  }

  client = new Redis({ url, token });
  return client;
}

/**
 * Get a JSON-serializable value from cache. Returns null on miss or on any
 * error (including Redis being unavailable or misconfigured).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const c = getClient();
  if (!c) return null;
  try {
    return (await c.get<T>(key)) ?? null;
  } catch (error) {
    console.warn(`[cache/redis] GET ${key} failed:`, error);
    return null;
  }
}

/**
 * Set a JSON-serializable value with a TTL in seconds. Silently no-ops on error.
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.warn(`[cache/redis] SET ${key} failed:`, error);
  }
}

/**
 * Delete a single key. Silently no-ops on error.
 */
export async function cacheDelete(key: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.del(key);
  } catch (error) {
    console.warn(`[cache/redis] DEL ${key} failed:`, error);
  }
}

/**
 * Wrap a `compute` function with a read-through cache. On cache miss, the
 * function runs and its result is stored under `key` for `ttlSeconds`.
 * Errors in the cache layer never bubble up — the compute function always
 * runs as a fallback.
 *
 * The SET on miss is awaited (rather than fire-and-forget) because:
 *   1) Next.js / Vercel serverless functions don't reliably keep a request
 *      alive after the response is returned, so background promises may be
 *      killed before they reach Upstash.
 *   2) Upstash REST round-trips are typically <10ms when colocated with the
 *      function, so the await cost is negligible vs. the compute() that
 *      already ran (often 1–3 seconds for leaderboard aggregations).
 */
export async function cacheRead<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  const fresh = await compute();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

/** True iff the cache is configured and the client was successfully created. */
export function isCacheEnabled(): boolean {
  return getClient() !== null;
}
