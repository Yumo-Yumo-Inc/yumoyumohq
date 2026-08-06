/**
 * Multi-strategy product candidate retrieval for RAC pipeline.
 *
 * Strategies (UNION'd, max-score wins per canonical_id):
 *   1. alias  — receipt_product_aliases.raw_text_norm pg_trgm fuzzy
 *   2. trgm   — canonical_products.canonical_name pg_trgm fuzzy
 *   3. embedding — pgvector cosine similarity (only if embedding available)
 *
 * Text retrieval is cached via Redis (yumo:canon:retrieve:product:<sha1>).
 *
 * Price re-ranking runs OUTSIDE the cache, on the cached base set. Two reasons:
 *   - unit price is continuous; folding it into the cache key would kill the hit rate
 *   - the price layer must never be able to break retrieval — if the reference
 *     matview is missing or stale, re-ranking is skipped and the text ranking stands
 *
 * Returns top-K candidates ordered by score DESC.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "lib/canonical/retrieve-product-candidates is server-only."
  );
}

import crypto from "crypto";
import { cacheRead } from "@/lib/cache/redis";
import { db } from "@/lib/db/client";
import { CacheKeys, CacheTTL } from "./cache-config";
import { embedText, vecToPgvector } from "./embedding";
import { getThresholdMap, type ThresholdMap } from "./thresholds";

export interface ProductCandidate {
  id: string;
  canonical_name: string;
  display_name_tr: string | null;
  brand_slug: string | null;
  category_path: string | null;
  attributes: Record<string, unknown>;
  unit_type: string | null;
  typical_unit_size: string | null;
  score: number;
  source: "alias" | "trgm" | "embedding";
  /** Reference median unit price for this canonical, when known (>=3 observations). */
  price_median: number | null;
  /** observed / median. 1.0 = spot on, null = no reference to compare against. */
  price_ratio: number | null;
}

interface ProductCandidateRow {
  id: string;
  canonical_name: string;
  display_name_tr: string | null;
  brand_slug: string | null;
  category_path: string | null;
  attributes: Record<string, unknown> | null;
  unit_type: string | null;
  typical_unit_size: string | null;
  score: number | string;
  source: ProductCandidate["source"];
}

// Fallbacks only. The live values come from canonization_thresholds (scope='product').
// Until 2026-07-17 these constants WERE the live values, and they carried the merchant
// scope's numbers (0.4 / 0.78) rather than the product scope's (0.50 / 0.85) — which
// also meant the admin threshold panel had no effect on the product path.
const ALIAS_THRESHOLD_FALLBACK = 0.5;
const TRGM_THRESHOLD_FALLBACK = 0.5;
const EMBEDDING_THRESHOLD_FALLBACK = 0.85; // cosine similarity (1 - distance)

// Price re-ranking. A candidate whose reference median is far from the observed unit
// price is very unlikely to be the right product ("K.GOFRET @ 12,50" is not a 500g box).
// This re-ranks; it never removes a candidate outright, because the reference itself can
// be thin (>=3 observations) or stale (180d window).
const PRICE_BOOST_MAX = 0.15; // added to score when the price lands on the median
const PRICE_PENALTY_MAX = 0.25; // subtracted when the price is wildly off
const PRICE_RATIO_TIGHT = 1.35; // within this factor of the median => boost
const PRICE_RATIO_LOOSE = 3.0; // beyond this factor => full penalty

function cacheHash(
  rawName: string,
  merchantId: string | null | undefined
): string {
  return crypto
    .createHash("sha1")
    .update(`${rawName.trim().toLowerCase()}|${merchantId ?? ""}`)
    .digest("hex");
}

/**
 * Mirror of the unit_bucket CASE in mv_receipt_price_reference (migration 094).
 * Kept in sync by hand — the matview groups medians by (canonical_name, unit_bucket),
 * so a mismatch here silently means "no reference found" rather than a wrong number.
 */
function unitBucketOf(unitType: string | null | undefined): string {
  const u = (unitType ?? "").toLowerCase();
  if (!u) return "other";
  if (u.includes("kg") || u.includes("kilo")) return "kg";
  if (u.includes("adet") || u.includes("piece") || u.includes("ad")) return "piece";
  if (u.includes("lt") || u.includes("lit")) return "litre";
  return "other";
}

interface PriceReferenceRow {
  canonical_name: string;
  median_unit_tl: string | number;
}

/**
 * Re-rank candidates by how well the observed unit price matches each candidate's
 * reference median. Defensive by contract: any failure returns the input untouched.
 */
async function rerankByPrice(
  candidates: ProductCandidate[],
  unitPrice: number,
  unitType: string | null | undefined
): Promise<ProductCandidate[]> {
  if (!candidates.length || !(unitPrice > 0)) return candidates;

  const bucket = unitBucketOf(unitType);
  let medianByName = new Map<string, number>();

  try {
    const { rows } = await db.query<PriceReferenceRow>(
      `SELECT canonical_name, median_unit_tl
         FROM mv_receipt_price_reference
        WHERE unit_bucket = $1
          AND canonical_name = ANY($2::text[])`,
      [bucket, candidates.map((c) => c.canonical_name)]
    );
    medianByName = new Map(
      rows
        .map((r) => [r.canonical_name, Number(r.median_unit_tl)] as const)
        .filter(([, v]) => Number.isFinite(v) && v > 0)
    );
  } catch (error) {
    // Matview missing / not yet refreshed / permission — text ranking stands.
    console.warn(
      "[retrieve-product-candidates] price reference unavailable, skipping re-rank —",
      (error as Error).message?.slice(0, 120)
    );
    return candidates;
  }

  if (medianByName.size === 0) return candidates;

  const scored = candidates.map((c) => {
    const median = medianByName.get(c.canonical_name);
    if (median == null) {
      return { ...c, price_median: null, price_ratio: null };
    }
    // Symmetric distance: 2x too expensive and 2x too cheap are equally suspicious.
    const ratio = unitPrice / median;
    const fold = ratio >= 1 ? ratio : 1 / ratio;

    let delta: number;
    if (fold <= PRICE_RATIO_TIGHT) {
      // Linear boost, full at the median, fading to 0 at the tight edge.
      const closeness = 1 - (fold - 1) / (PRICE_RATIO_TIGHT - 1);
      delta = PRICE_BOOST_MAX * closeness;
    } else if (fold >= PRICE_RATIO_LOOSE) {
      delta = -PRICE_PENALTY_MAX;
    } else {
      const off = (fold - PRICE_RATIO_TIGHT) / (PRICE_RATIO_LOOSE - PRICE_RATIO_TIGHT);
      delta = -PRICE_PENALTY_MAX * off;
    }

    return {
      ...c,
      score: Math.max(0, c.score + delta),
      price_median: median,
      price_ratio: Number(ratio.toFixed(3)),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Retrieve top-K canonical_products candidates for a raw OCR product line.
 *
 * @param rawName    Raw OCR string ("TADIM FISTIK 150G")
 * @param merchantId Optional: scopes the cache key; alias scoping lives in the alias table
 * @param limit      Max candidates returned (default 5)
 * @param useEmbedding  If false, skip OpenAI embed call (used in tight loops)
 * @param unitPrice  Observed unit price. When given, candidates are re-ranked against
 *                   their reference median — the cheapest discriminator we have.
 * @param unitType   Observed unit ("kg"/"adet"/...), used to pick the price bucket.
 */
export async function retrieveProductCandidates(input: {
  rawName: string;
  merchantId?: string | null;
  limit?: number;
  useEmbedding?: boolean;
  unitPrice?: number | null;
  unitType?: string | null;
}): Promise<ProductCandidate[]> {
  const {
    rawName,
    merchantId,
    limit = 5,
    useEmbedding = true,
    unitPrice = null,
    unitType = null,
  } = input;
  const trimmed = rawName?.trim() ?? "";
  if (!trimmed) return [];

  const key = CacheKeys.retrieveProduct(cacheHash(trimmed, merchantId));

  // Text retrieval: cached. Over-fetch so price re-ranking has room to reorder before
  // the final cut — otherwise a price-correct candidate sitting at rank 4 never surfaces.
  const overFetch = unitPrice && unitPrice > 0 ? Math.max(limit * 3, 10) : limit;

  const base = await cacheRead(key, CacheTTL.retrieve, async () => {
    const norm = trimmed.toLowerCase();

    const thresholds: ThresholdMap = await getThresholdMap("product").catch(
      () => ({}) as ThresholdMap
    );
    const aliasThreshold = thresholds.alias_sim ?? ALIAS_THRESHOLD_FALLBACK;
    const trgmThreshold = thresholds.trgm_sim ?? TRGM_THRESHOLD_FALLBACK;
    const embeddingThreshold =
      thresholds.embedding_cosine ?? EMBEDDING_THRESHOLD_FALLBACK;

    // Embedding pre-fetch (single call, reused below)
    let embeddingLiteral: string | null = null;
    if (useEmbedding) {
      const vec = await embedText(trimmed);
      if (vec && vec.length === 1536) {
        embeddingLiteral = vecToPgvector(vec);
      }
    }

    // Combined SQL: 3 CTEs UNION'd, dedup by canonical_id
    const query = `
      WITH alias_hits AS (
        SELECT DISTINCT ON (rpa.canonical_id)
          rpa.canonical_id AS id,
          similarity(rpa.raw_text_norm, $1) AS score,
          'alias'::text AS source
        FROM receipt_product_aliases rpa
        WHERE rpa.canonical_id IS NOT NULL
          AND rpa.raw_text_norm IS NOT NULL
          AND similarity(rpa.raw_text_norm, $1) >= $4::float
        ORDER BY rpa.canonical_id, similarity(rpa.raw_text_norm, $1) DESC
      ),
      trgm_hits AS (
        SELECT
          cp.id,
          similarity(lower(replace(cp.canonical_name, '_', ' ')), $1) AS score,
          'trgm'::text AS source
        FROM canonical_products cp
        WHERE similarity(lower(replace(cp.canonical_name, '_', ' ')), $1) >= $5::float
        -- Without ORDER BY, LIMIT 20 took an arbitrary 20 of everything above the
        -- threshold, so the actual best trigram candidate could be dropped silently.
        ORDER BY similarity(lower(replace(cp.canonical_name, '_', ' ')), $1) DESC
        LIMIT 20
      ),
      embedding_hits AS (
        SELECT
          cp.id,
          (1 - (cp.embedding <=> $2::vector))::float AS score,
          'embedding'::text AS source
        FROM canonical_products cp
        WHERE $3::boolean = TRUE
          AND cp.embedding IS NOT NULL
          AND (1 - (cp.embedding <=> $2::vector)) >= $6::float
        ORDER BY cp.embedding <=> $2::vector
        LIMIT 20
      ),
      merged AS (
        SELECT id, score, source FROM alias_hits
        UNION ALL
        SELECT id, score, source FROM trgm_hits
        UNION ALL
        SELECT id, score, source FROM embedding_hits
      ),
      dedup AS (
        SELECT
          id,
          MAX(score) AS score,
          (ARRAY_AGG(source ORDER BY score DESC))[1] AS source
        FROM merged
        GROUP BY id
      )
      SELECT
        cp.id,
        cp.canonical_name,
        cp.display_name_tr,
        cp.brand_slug,
        cp.category_path,
        cp.attributes,
        cp.unit_type,
        cp.typical_unit_size,
        d.score,
        d.source
      FROM dedup d
      JOIN canonical_products cp ON cp.id = d.id
      WHERE cp.is_active = TRUE
      ORDER BY d.score DESC
      LIMIT $7
    `;

    try {
      const rows = await db.query<ProductCandidateRow>(query, [
        norm,
        embeddingLiteral ?? "[]", // unused if $3 = false
        embeddingLiteral != null,
        aliasThreshold,
        trgmThreshold,
        embeddingThreshold,
        overFetch,
      ]);

      return rows.rows.map((row) => ({
        id: row.id,
        canonical_name: row.canonical_name,
        display_name_tr: row.display_name_tr,
        brand_slug: row.brand_slug,
        category_path: row.category_path,
        attributes:
          (row.attributes && typeof row.attributes === "object"
            ? row.attributes
            : {}) ?? {},
        unit_type: row.unit_type,
        typical_unit_size: row.typical_unit_size,
        score: Number(row.score) || 0,
        source: row.source,
        price_median: null,
        price_ratio: null,
      }));
    } catch (error) {
      const message = (error as Error).message ?? "";
      if (/embedding|vector|pg_trgm|similarity|does not exist/i.test(message)) {
        console.warn(
          "[retrieve-product-candidates] schema not ready, returning [] —",
          message.slice(0, 120)
        );
        return [];
      }
      throw error;
    }
  });

  if (!base.length) return base;
  if (!(unitPrice && unitPrice > 0)) return base.slice(0, limit);

  const reranked = await rerankByPrice(base, unitPrice, unitType);
  return reranked.slice(0, limit);
}
