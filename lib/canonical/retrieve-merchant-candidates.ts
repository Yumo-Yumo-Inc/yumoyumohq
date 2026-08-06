import crypto from "crypto";
import { cacheRead } from "@/lib/cache/redis";
import { db } from "@/lib/db/client";
import { CacheTTL, CacheKeys } from "./cache-config";
import { embedText, vecToPgvector } from "./embedding";
import { embedTextForMerchant } from "./preprocess";

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
  source: "token" | "trgm" | "phonetic" | "embedding";
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
  raw: string,
  contentTokens: string[],
  countryCode: string | null | undefined,
  phoneticKey: string
): string {
  const normalizedTokens = [...contentTokens].sort().join(",");
  // raw is part of the key: a pure CJK/Thai name produces no ASCII tokens and
  // no phonetic key, so without it every such query would share one cache slot.
  return crypto
    .createHash("sha1")
    .update(
      `${raw.trim().toLowerCase()}|${normalizedTokens}|${countryCode ?? ""}|${phoneticKey}`
    )
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

  // A pure CJK/Thai name yields no ASCII tokens, no phonetic key and an empty
  // legal-strip — but embedding recall still works on the raw text, so only
  // a genuinely empty input short-circuits.
  if (
    !input.raw.trim() &&
    contentTokens.length === 0 &&
    !phoneticKey &&
    !legalStripped.trim()
  ) {
    return [];
  }

  const key = CacheKeys.retrieveMerchant(
    cacheHash(input.raw, contentTokens, countryCode, phoneticKey)
  );

  return cacheRead(key, CacheTTL.retrieve, async () => {
    // COST GATE: text strategies (token/trgm/phonetic — pure SQL, zero API
    // calls) run first. A strong text hit answers most receipts; only weak or
    // empty text results pay for a Gemini embedding call.
    const textOnly = await runRetrievalQuery(null);
    const bestText = textOnly[0]?.score ?? 0;
    if (bestText >= 0.9) return textOnly;

    // Embedding recall: the only strategy that can surface "7-Eleven" for the
    // raw "7-11" or a cross-script sibling — text similarity never will.
    // Query embeds the SAME text form the patterns were embedded from
    // (embedTextForMerchant): raw-vs-normalized mismatch costs ~0.2 similarity.
    // Recall-oriented threshold; the LLM decision layer filters precision.
    let embVector: string | null = null;
    try {
      const vec = await embedText(embedTextForMerchant(input.raw, legalStripped));
      if (vec) embVector = vecToPgvector(vec);
    } catch {
      /* embedding unavailable → text strategies only */
    }
    if (!embVector) return textOnly;
    return runRetrievalQuery(embVector);
  });

  async function runRetrievalQuery(
    embVector: string | null
  ): Promise<MerchantCandidate[]> {
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
      embedding_hits AS (
        SELECT
          mp.merchant_id,
          1 - (mp.embedding <=> ($7::text)::vector) AS score
        FROM merchant_patterns mp
        WHERE $7::text IS NOT NULL
          AND mp.embedding IS NOT NULL
          AND 1 - (mp.embedding <=> ($7::text)::vector) >= 0.60
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
        UNION ALL
        SELECT merchant_id, score, 'embedding'::text AS source
        FROM embedding_hits
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
      embVector,
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
  }
}
