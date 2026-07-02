/**
 * In-memory dedup cache for quest "ensure" operations.
 *
 * `ensureDailyQuestsForUser` and `ensureWeeklyQuestsForUser` are idempotent —
 * they SELECT to check existence, then INSERT only if missing. On a typical
 * mobile sync flood (clients polling /api/mobile/sync every minute, plus
 * action-result triggers, plus visibility-change triggers), these "ensure"
 * calls fire dozens of times per user per day, almost always finding the
 * quests already exist. Each call still runs the full SQL check (~300–1500ms
 * against Neon).
 *
 * This module memoizes successful runs in process memory. Within a single
 * Vercel function instance, repeated calls for the same (user, dateStr) are
 * a no-op for the cache TTL window. Cold starts re-run once, which is fine.
 *
 * TTL is intentionally short (5 minutes) so:
 *   - Day rollover (UTC midnight) triggers a fresh ensure within 5 min
 *   - Manual quest deletions (admin tools) self-heal within 5 min
 *   - Normal user activity gets dedup benefit
 */

type EnsureFn<T> = () => Promise<T>;

interface CacheEntry {
  expiresAt: number;
}

const dailyCache = new Map<string, CacheEntry>();
const weeklyCache = new Map<string, CacheEntry>();

const ENSURE_TTL_MS = 5 * 60 * 1000;

function readEntry(map: Map<string, CacheEntry>, key: string): boolean {
  const entry = map.get(key);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    map.delete(key);
    return false;
  }
  return true;
}

function writeEntry(map: Map<string, CacheEntry>, key: string): void {
  map.set(key, { expiresAt: Date.now() + ENSURE_TTL_MS });
  // Opportunistic GC: keep the map small. If it grows past 5k keys, drop expired ones.
  if (map.size > 5_000) {
    const now = Date.now();
    for (const [k, v] of map) {
      if (v.expiresAt < now) map.delete(k);
    }
  }
}

/**
 * Run `fn` only if (username, dateStr) hasn't been ensured-as-daily within
 * the TTL. Returns whether the wrapped function actually ran (true) or was
 * skipped because of cache (false).
 */
export async function withDailyEnsureCache(
  username: string,
  dateStr: string,
  fn: EnsureFn<unknown>
): Promise<boolean> {
  const key = `${username}:${dateStr}`;
  if (readEntry(dailyCache, key)) {
    return false;
  }
  await fn();
  writeEntry(dailyCache, key);
  return true;
}

/**
 * Same as {@link withDailyEnsureCache} but keyed by weekly bucket.
 * Caller should pass a stable week-start string (e.g. ISO Monday date).
 */
export async function withWeeklyEnsureCache(
  username: string,
  weekKey: string,
  fn: EnsureFn<unknown>
): Promise<boolean> {
  const key = `${username}:${weekKey}`;
  if (readEntry(weeklyCache, key)) {
    return false;
  }
  await fn();
  writeEntry(weeklyCache, key);
  return true;
}

/** Test/admin hook to force a fresh ensure on next call. */
export function invalidateEnsureCache(username: string, dateStr?: string): void {
  if (!dateStr) {
    // Drop all entries for this user
    for (const k of dailyCache.keys()) {
      if (k.startsWith(`${username}:`)) dailyCache.delete(k);
    }
    for (const k of weeklyCache.keys()) {
      if (k.startsWith(`${username}:`)) weeklyCache.delete(k);
    }
    return;
  }
  dailyCache.delete(`${username}:${dateStr}`);
  weeklyCache.delete(`${username}:${dateStr}`);
}
