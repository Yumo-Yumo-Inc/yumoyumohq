/**
 * External catalog evidence for canonical candidates.
 *
 * This module deliberately does NOT retrieve candidates. The alias/trigram/embedding
 * retrieval in lib/canonical stays the only thing that decides WHICH canonical products a
 * receipt line could be; the external catalog only annotates those candidates with the
 * market and price it was observed at. Letting an external row introduce a candidate, or
 * raise its score, would make price a matching decision — which it is not allowed to be.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/external-products/evidence is server-only.");
}

import { db } from "@/lib/db/client";
import type { ProductCandidate } from "@/lib/canonical/retrieve-product-candidates";

export interface ExternalCatalogEvidence {
  externalProductId: string;
  merchantLabel: string | null;
  rawName: string;
  packageSignature: string;
  priceTl: number | null;
  unitPriceTl: number | null;
  unitType: string | null;
  observedAt: string | null;
  /** Median across observations of this canonical + package. Null until the link is confirmed. */
  medianPriceTl: number | null;
  /** False while the link rests on fewer observations than the price reference minimum. */
  medianIsReliable: boolean;
}

export type ProductCandidateWithExternal = ProductCandidate & {
  externalEvidence?: ExternalCatalogEvidence[];
};

/**
 * A `user_confirmed` match counts only when it can be replayed against the task that
 * produced it: resolved task, canonical in the candidate snapshot, and a stored pick by
 * the recorded confirmer. `manual` is the separate admin path. Migration 141 introduced
 * this rule; the price views carry the same condition.
 */
const VERIFIED_LINK = `(
  m.status = 'suggested'
  OR (
    m.status = 'user_confirmed'
    AND (m.match_method = 'manual' OR EXISTS (
      SELECT 1 FROM contribution_tasks task
       WHERE task.id = CASE
         WHEN m.evidence->>'task_id' ~ '^[0-9]+$' THEN (m.evidence->>'task_id')::bigint
       END
         AND task.task_type = 'product_identify'
         AND task.status = 'resolved'
         AND task.resolved_canonical_id = m.canonical_id
         AND EXISTS (
           SELECT 1 FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(task.candidates) = 'array'
                  THEN task.candidates ELSE '[]'::jsonb END
           ) candidate
           WHERE candidate->>'canonical_id' = m.canonical_id::text
         )
         AND EXISTS (
           SELECT 1 FROM contribution_answers answer
            WHERE answer.task_id = task.id
              AND answer.username = m.confirmed_by
              AND answer.answer_kind = 'pick'
              AND answer.canonical_id = m.canonical_id
         )
    ))
  )
)`;

interface EvidenceRow {
  canonical_id: string;
  external_product_id: string;
  merchant_label: string | null;
  raw_name: string;
  package_signature: string;
  price_tl: string | number | null;
  unit_price_tl: string | number | null;
  unit_type: string | null;
  observed_at: string | null;
  median_price_tl: string | number | null;
  median_is_reliable: boolean | null;
}

/**
 * Load external evidence for a set of canonical ids, scoped to one merchant.
 *
 * Merchant scope is required: a price observed at another chain is not evidence about this
 * receipt's line. Without a merchant there is nothing to scope to and the result is empty.
 */
export async function loadExternalEvidence(input: {
  canonicalIds: string[];
  merchantId: string | null;
}): Promise<Map<string, ExternalCatalogEvidence[]>> {
  const byCanonical = new Map<string, ExternalCatalogEvidence[]>();
  if (!input.merchantId || input.canonicalIds.length === 0) return byCanonical;

  try {
    const { rows } = await db.query<EvidenceRow>(
      `WITH active_links AS (
         SELECT DISTINCT ON (m.external_product_id)
           m.external_product_id, m.canonical_id
         FROM external_product_canonical_matches m
         WHERE m.canonical_id = ANY($1::uuid[])
           AND ${VERIFIED_LINK}
         ORDER BY m.external_product_id,
           CASE m.status WHEN 'user_confirmed' THEN 0 ELSE 1 END,
           m.confidence DESC,
           m.created_at DESC
       )
       SELECT
         l.canonical_id,
         ep.id AS external_product_id,
         merchants.display_name AS merchant_label,
         ep.raw_name,
         ep.package_signature,
         latest.price_tl,
         latest.unit_price_tl,
         latest.unit_type,
         latest.observed_at,
         reference.median_price_tl,
         reference.is_reliable AS median_is_reliable
       FROM active_links l
       JOIN external_product_catalog ep ON ep.id = l.external_product_id
       JOIN merchants ON merchants.id = ep.merchant_id
       LEFT JOIN LATERAL (
         SELECT o.price_tl, o.unit_price_tl, o.unit_type, o.observed_at
           FROM external_price_observations o
          WHERE o.external_product_id = ep.id
          ORDER BY o.observed_at DESC
          LIMIT 1
       ) latest ON TRUE
       LEFT JOIN LATERAL (
         SELECT v.median_price_tl, v.is_reliable
           FROM canonical_external_price_overall v
          WHERE v.canonical_id = l.canonical_id
            AND v.package_signature = ep.package_signature
          ORDER BY v.observation_count DESC
          LIMIT 1
       ) reference ON TRUE
       WHERE ep.merchant_id = $2::uuid
         AND ep.match_status <> 'rejected'
       ORDER BY latest.observed_at DESC NULLS LAST`,
      [input.canonicalIds, input.merchantId]
    );

    for (const row of rows) {
      const list = byCanonical.get(row.canonical_id) ?? [];
      list.push({
        externalProductId: row.external_product_id,
        merchantLabel: row.merchant_label,
        rawName: row.raw_name,
        packageSignature: row.package_signature,
        priceTl: row.price_tl == null ? null : Number(row.price_tl),
        unitPriceTl: row.unit_price_tl == null ? null : Number(row.unit_price_tl),
        unitType: row.unit_type,
        observedAt: row.observed_at,
        medianPriceTl: row.median_price_tl == null ? null : Number(row.median_price_tl),
        medianIsReliable: row.median_is_reliable === true,
      });
      byCanonical.set(row.canonical_id, list);
    }
  } catch (error) {
    // The catalog is an optional annotation layer. A database that has not received the
    // migration yet must not break task generation.
    const message = (error as Error).message ?? "";
    if (!/does not exist|external_product|canonical_external_price/i.test(message)) throw error;
    console.warn("[external-products/evidence] catalog unavailable:", message.slice(0, 120));
  }
  return byCanonical;
}

/** Annotate candidates in place-order, leaving their identity, order and scores untouched. */
export async function attachExternalEvidence<T extends ProductCandidate>(
  candidates: T[],
  merchantId: string | null
): Promise<Array<T & { externalEvidence?: ExternalCatalogEvidence[] }>> {
  if (candidates.length === 0) return candidates;
  const evidence = await loadExternalEvidence({
    canonicalIds: candidates.map((candidate) => candidate.id),
    merchantId,
  });
  if (evidence.size === 0) return candidates;
  return candidates.map((candidate) => {
    const found = evidence.get(candidate.id);
    return found?.length ? { ...candidate, externalEvidence: found } : candidate;
  });
}

/**
 * Short, locale-independent price reference for one candidate.
 *
 * Numbers and merchant name only — the surrounding copy is the UI's job, so nothing here
 * needs translating.
 */
export function evidenceReference(evidence: ExternalCatalogEvidence[]): string | null {
  const best = evidence[0];
  if (!best) return null;
  const parts = [best.merchantLabel];
  const price = best.medianIsReliable && best.medianPriceTl != null
    ? best.medianPriceTl
    : best.priceTl;
  if (price != null) parts.push(`${price.toFixed(2)} ₺`);
  if (best.unitPriceTl != null && best.unitType) {
    parts.push(`${best.unitPriceTl.toFixed(2)} ₺/${best.unitType}`);
  }
  const text = parts.filter(Boolean).join(" · ");
  return text || null;
}
