/**
 * Multi-strategy product candidate retrieval for RAC pipeline.
 *
 * Strategies (UNION'd, max-score wins per canonical_id):
 *   1. alias  — receipt_product_aliases.raw_text_norm pg_trgm fuzzy
 *   2. trgm   — canonical_products.canonical_name pg_trgm fuzzy
 *   3. embedding — pgvector cosine similarity (only if embedding available)
 *
 * Cached via Redis (yumo:canon:retrieve:product:<sha1>) for 10-30 min.
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

const ALIAS_THRESHOLD = 0.5;
const TRGM_THRESHOLD = 0.4;
const EMBEDDING_THRESHOLD = 0.78; // cosine similarity (1 - distance)

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
 * Retrieve top-K canonical_products candidates for a raw OCR product line.
 *
 * @param rawName    Raw OCR string ("TADIM FISTIK 150G")
 * @param merchantId Optional: hint to prioritize same-merchant matches
 * @param limit      Max candidates returned (default 5)
 * @param useEmbedding  If false, skip OpenAI embed call (used in tight loops)
 */
export async function retrieveProductCandidates(input: {
  rawName: string;
  merchantId?: string | null;
  limit?: number;
  useEmbedding?: boolean;
}): Promise<ProductCandidate[]> {
  const { rawName, merchantId, limit = 5, useEmbedding = true } = input;
  const trimmed = rawName?.trim() ?? "";
  if (!trimmed) return [];

  const key = CacheKeys.retrieveProduct(cacheHash(trimmed, merchantId));

  return cacheRead(key, CacheTTL.retrieve, async () => {
    const norm = trimmed.toLowerCase();

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
        ALIAS_THRESHOLD,
        TRGM_THRESHOLD,
        EMBEDDING_THRESHOLD,
        limit,
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
}
