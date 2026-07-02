import { sql } from "@/lib/db/client";

/**
 * Shopping list smart-suggest engine.
 *
 * Ranking (top to bottom):
 *   1. recent_purchase — canonical products the user has bought (per receipts)
 *      in the last 90 days (by frequency, via line_items with a known canonical_id)
 *   2. fuzzy_match     — pg_trgm similarity > 0.25 against
 *      canonical_products.display_name_tr / display_name_en
 *
 * When both sources land on the same canonical_id, the best (highest-scoring)
 * version is kept via dedup.
 */

export type SuggestionSource = "recent_purchase" | "fuzzy_match";

export type ShoppingSuggestion = {
  canonicalId: string;
  displayName: string;
  brand: string | null;
  source: SuggestionSource;
  score: number;
  /** Number of receipts in the last 90 days containing this product; meaningful only for recent_purchase. */
  purchaseCount: number;
  /** Last purchase date (for recent_purchase). */
  lastSeenAt: string | null;
  /** Accompanying micro-hint for UI display — e.g. "geçen sefer ₺X'ten aldın" shown underneath. */
  hint: string | null;
};

const MAX_SUGGESTIONS = 8;
const RECENT_LOOKBACK_DAYS = 90;
const SIMILARITY_THRESHOLD = 0.25;

type RecentRow = {
  canonical_id: string;
  display_name: string;
  brand_slug: string | null;
  purchase_count: number;
  last_seen_at: string;
  last_unit_price: number | null;
};

type FuzzyRow = {
  canonical_id: string;
  display_name: string;
  brand_slug: string | null;
  score: number;
};

/**
 * Returns products the user has purchased, per receipt, in the last N days.
 *
 * Goes through line_items that have a canonical_id set — legacy free-text
 * lines are skipped. When `q` is provided, no filtering happens here since the
 * frontend already debounces the same request; the full recent set is
 * returned and the frontend merges it.
 */
export async function fetchRecentPurchases(
  username: string,
  q: string,
): Promise<ShoppingSuggestion[]> {
  // lower(coalesce) so the filter still works even when the query is an empty string
  const query = q.trim().toLowerCase();
  const useFilter = query.length >= 2;

  const rows = (await sql`
    WITH recent AS (
      SELECT rli.canonical_id,
             COUNT(*)::int AS purchase_count,
             MAX(r.purchase_date)::text AS last_seen_at,
             (ARRAY_AGG(rli.unit_price ORDER BY r.purchase_date DESC))[1] AS last_unit_price
      FROM receipt_line_items rli
      JOIN receipts r ON r.id = rli.receipt_id
      WHERE r.username = ${username}
        AND r.purchase_date >= NOW() - (${RECENT_LOOKBACK_DAYS}::int || ' days')::interval
        AND rli.canonical_id IS NOT NULL
      GROUP BY rli.canonical_id
    )
    SELECT recent.canonical_id::text AS canonical_id,
           COALESCE(cp.display_name_tr, cp.canonical_name) AS display_name,
           cp.brand_slug,
           recent.purchase_count,
           recent.last_seen_at,
           recent.last_unit_price
    FROM recent
    JOIN canonical_products cp ON cp.id = recent.canonical_id
    WHERE cp.is_active = TRUE
      AND (
        ${!useFilter}::boolean
        OR lower(cp.display_name_tr) LIKE ${`%${query}%`}
        OR lower(COALESCE(cp.display_name_en, '')) LIKE ${`%${query}%`}
        OR EXISTS (
          SELECT 1 FROM unnest(cp.aliases) a WHERE lower(a) LIKE ${`%${query}%`}
        )
      )
    ORDER BY recent.purchase_count DESC, recent.last_seen_at DESC
    LIMIT ${MAX_SUGGESTIONS}
  `) as RecentRow[];

  return rows.map((row) => ({
    canonicalId: row.canonical_id,
    displayName: row.display_name,
    brand: row.brand_slug,
    source: "recent_purchase",
    score: 1 + Math.min(row.purchase_count, 10) / 10,
    purchaseCount: row.purchase_count,
    lastSeenAt: row.last_seen_at,
    hint:
      row.last_unit_price !== null
        ? `geçen sefer ₺${Number(row.last_unit_price).toFixed(2).replace(".", ",")}`
        : null,
  }));
}

/**
 * Search via trgm similarity over the canonical_products taxonomy.
 * `display_name_tr` is the primary column; `display_name_en` and aliases are fallbacks.
 */
export async function fetchFuzzyMatches(
  q: string,
  excludeCanonicalIds: string[],
): Promise<ShoppingSuggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];

  const exclusion =
    excludeCanonicalIds.length > 0 ? excludeCanonicalIds : ["00000000-0000-0000-0000-000000000000"];

  const rows = (await sql`
    SELECT id::text AS canonical_id,
           COALESCE(display_name_tr, canonical_name) AS display_name,
           brand_slug,
           GREATEST(
             similarity(display_name_tr, ${query}),
             similarity(COALESCE(display_name_en, ''), ${query})
           ) AS score
    FROM canonical_products
    WHERE is_active = TRUE
      AND (
        display_name_tr % ${query}
        OR COALESCE(display_name_en, '') % ${query}
        OR EXISTS (
          SELECT 1 FROM unnest(aliases) a WHERE a % ${query}
        )
      )
      AND id::text <> ALL(${exclusion})
    ORDER BY score DESC, display_name_tr ASC
    LIMIT ${MAX_SUGGESTIONS}
  `) as FuzzyRow[];

  return rows
    .filter((row) => Number(row.score) >= SIMILARITY_THRESHOLD)
    .map((row) => ({
      canonicalId: row.canonical_id,
      displayName: row.display_name,
      brand: row.brand_slug,
      source: "fuzzy_match" as const,
      score: Number(row.score),
      purchaseCount: 0,
      lastSeenAt: null,
      hint: null,
    }));
}

/**
 * Combined suggestion call. Recent purchases come first; fuzzy matches fill the remaining slots.
 */
export async function fetchShoppingSuggestions(
  username: string,
  q: string,
): Promise<ShoppingSuggestion[]> {
  const recent = await fetchRecentPurchases(username, q);
  const remaining = MAX_SUGGESTIONS - recent.length;
  if (remaining <= 0) return recent.slice(0, MAX_SUGGESTIONS);

  const fuzzy = await fetchFuzzyMatches(
    q,
    recent.map((r) => r.canonicalId),
  );

  return [...recent, ...fuzzy.slice(0, remaining)];
}
