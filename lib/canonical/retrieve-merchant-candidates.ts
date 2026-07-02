import crypto from "crypto";
import { cacheRead } from "@/lib/cache/redis";
import { db } from "@/lib/db/client";
import { CacheTTL, CacheKeys } from "./cache-config";

export interface MerchantCandidate {
  id: string;
  master_id: string;
  canonical_name: string;
  display_name: string;
  merchant_kind: string;
  tier: string;
  country_code: string | null;
  category: string | null;
  aliases: string[];
  score: number;
  source: "token" | "trgm" | "phonetic";
}

interface MerchantCandidateRow {
  id: string;
  master_id: string;
  canonical_name: string;
  display_name: string;
  merchant_kind: string;
  tier: string;
  country_code: string | null;
  category: string | null;
  aliases: string[] | null;
  score: number | string;
  source: MerchantCandidate["source"];
}

function cacheHash(
  contentTokens: string[],
  countryCode: string | null | undefined,
  phoneticKey: string
): string {
  const normalizedTokens = [...contentTokens].sort().join(",");
  return crypto
    .createHash("sha1")
    .update(`${normalizedTokens}|${countryCode ?? ""}|${phoneticKey}`)
    .digest("hex");
}

export async function retrieveMerchantCandidates(input: {
  raw: string;
  contentTokens: string[];
  legalStripped: string;
  phoneticKey: string;
  countryCode?: string | null;
  category?: string | null;
  limit?: number;
}): Promise<MerchantCandidate[]> {
  const {
    contentTokens,
    legalStripped,
    phoneticKey,
    countryCode,
    limit = 10,
  } = input;

  if (contentTokens.length === 0 && !phoneticKey && !legalStripped.trim()) {
    return [];
  }

  const key = CacheKeys.retrieveMerchant(
    cacheHash(contentTokens, countryCode, phoneticKey)
  );

  return cacheRead(key, CacheTTL.retrieve, async () => {
    const query = `
      WITH token_hits AS (
        SELECT
          mp.merchant_id,
          cardinality(array(
            SELECT unnest(COALESCE(mp.token_set, ARRAY[]::text[]))
            INTERSECT
            SELECT unnest($1::text[])
          ))::float / NULLIF(LEAST(
            cardinality(COALESCE(mp.token_set, ARRAY[]::text[])),
            cardinality($1::text[])
          ), 0) AS score
        FROM merchant_patterns mp
        WHERE cardinality($1::text[]) > 0
          AND mp.token_set IS NOT NULL
          AND mp.token_set && $1::text[]
      ),
      trgm_hits AS (
        SELECT
          mp.merchant_id,
          similarity(COALESCE(mp.legal_stripped, ''), $2) AS score
        FROM merchant_patterns mp
        WHERE $2 <> ''
          AND mp.legal_stripped IS NOT NULL
          AND similarity(COALESCE(mp.legal_stripped, ''), $2) >= 0.40
      ),
      phonetic_hits AS (
        SELECT
          mp.merchant_id,
          0.60::float AS score
        FROM merchant_patterns mp
        WHERE $3 <> ''
          AND mp.phonetic_key = $3
      ),
      merged AS (
        SELECT merchant_id, score, 'token'::text AS source
        FROM token_hits
        WHERE score >= 0.50
        UNION ALL
        SELECT merchant_id, score, 'trgm'::text AS source
        FROM trgm_hits
        UNION ALL
        SELECT merchant_id, score, 'phonetic'::text AS source
        FROM phonetic_hits
      ),
      dedup AS (
        SELECT
          merchant_id,
          MAX(score) AS score,
          (
            ARRAY_AGG(source ORDER BY score DESC, source ASC)
          )[1] AS source
        FROM merged
        GROUP BY merchant_id
      )
      SELECT
        m.id,
        m.master_id,
        m.canonical_name,
        m.display_name,
        m.merchant_kind,
        m.tier,
        m.country_code,
        m.category,
        COALESCE(
          ARRAY_AGG(DISTINCT mp.pattern) FILTER (WHERE mp.pattern IS NOT NULL),
          ARRAY[]::text[]
        ) AS aliases,
        d.score,
        d.source
      FROM dedup d
      JOIN merchants m ON m.id = d.merchant_id
      LEFT JOIN merchant_patterns mp ON mp.merchant_id = m.id
      WHERE m.tier = ANY($4)
        AND ($5::text IS NULL OR m.country_code = $5 OR m.country_code IS NULL)
      GROUP BY
        m.id,
        m.master_id,
        m.canonical_name,
        m.display_name,
        m.merchant_kind,
        m.tier,
        m.country_code,
        m.category,
        d.score,
        d.source
      ORDER BY d.score DESC, m.tier DESC, m.display_name ASC
      LIMIT $6
    `;

    const rows = await db.query<MerchantCandidateRow>(query, [
      contentTokens,
      legalStripped,
      phoneticKey,
      ["candidate", "verified"],
      countryCode ?? null,
      limit,
    ]);

    return rows.rows.map((row) => ({
      id: row.id,
      master_id: row.master_id,
      canonical_name: row.canonical_name,
      display_name: row.display_name,
      merchant_kind: row.merchant_kind,
      tier: row.tier,
      country_code: row.country_code,
      category: row.category,
      aliases: row.aliases ?? [],
      score: Number(row.score) || 0,
      source: row.source,
    }));
  });
}
