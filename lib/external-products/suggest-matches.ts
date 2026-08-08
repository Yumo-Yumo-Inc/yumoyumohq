import { db } from "@/lib/db/client";
import { retrieveProductCandidates } from "@/lib/canonical/retrieve-product-candidates";
import { getThresholdMap } from "@/lib/canonical/thresholds";
import { comparePackages, parsePackage } from "./market-fiyati-parser";
import { scoreExternalCanonicalMatch } from "./scoring";

interface ExternalProductRow {
  id: string;
  raw_name: string;
  merchant_id: string;
  brand: string | null;
  product_type: string | null;
  package_count: string | number;
  package_size: string | number | null;
  package_unit: string | null;
  package_signature: string;
  price_tl: string | number;
  unit_price_tl: string | number | null;
  unit_type: string | null;
}

export interface SuggestMatchesResult {
  scanned: number;
  suggestions: number;
  needsReview: number;
}

/** Brand slugs can carry a sub-brand ("eti_bidolu"); the registry root is what identifies it. */
function sameBrand(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  return a.split("_")[0] === b.split("_")[0] ? 1 : 0;
}

/**
 * Compare the external package against the canonical product's typical size.
 *
 * Both sides become quantities first. `package_signature` ("1x180ml") and
 * `typical_unit_size` ("180 ml") never matched as strings, which marked every candidate as
 * a package conflict and blocked suggestions outright.
 */
function samePackage(external: ExternalProductRow, typicalUnitSize: string | null): number | null {
  if (!typicalUnitSize) return null;
  return comparePackages(
    {
      count: Number(external.package_count) || 1,
      size: external.package_size == null ? null : Number(external.package_size),
      unit: external.package_unit,
      signature: external.package_signature,
    },
    parsePackage(typicalUnitSize)
  );
}

export async function suggestExternalCanonicalMatches(batchId: string): Promise<SuggestMatchesResult> {
  const thresholds = await getThresholdMap("product");
  const { rows } = await db.query<ExternalProductRow>(
    `SELECT DISTINCT ep.id, ep.raw_name, ep.merchant_id, ep.brand, ep.product_type,
            ep.package_count, ep.package_size, ep.package_unit, ep.package_signature,
            o.price_tl, o.unit_price_tl, o.unit_type
       FROM external_product_catalog ep
       JOIN external_price_observations o ON o.external_product_id = ep.id
      WHERE o.batch_id = $1
        AND ep.match_status IN ('pending', 'needs_review')`,
    [batchId]
  );
  let suggestions = 0;
  let needsReview = 0;

  for (const external of rows) {
    const candidates = await retrieveProductCandidates({
      rawName: external.raw_name,
      merchantId: external.merchant_id,
      limit: 5,
      unitPrice: external.unit_price_tl == null ? Number(external.price_tl) : Number(external.unit_price_tl),
      unitType: external.unit_type,
    });
    let bestDecision: "suggested" | "needs_review" | "pending" = "pending";
    for (const candidate of candidates) {
      const packageMatch = samePackage(external, candidate.typical_unit_size);
      const brandMatch = sameBrand(external.brand, candidate.brand_slug);
      const scored = scoreExternalCanonicalMatch(
        {
          name: candidate.source === "trgm" ? candidate.score : 0,
          alias: candidate.source === "alias" ? candidate.score : null,
          embedding: candidate.source === "embedding" ? candidate.score : null,
          merchant: 1,
          brand: brandMatch,
          productType: external.product_type && candidate.category_path
            ? Number(candidate.category_path.includes(external.product_type))
            : null,
          package: packageMatch,
          price: candidate.price_ratio == null
            ? null
            : Math.max(0, 1 - Math.abs(Math.log(candidate.price_ratio)) / Math.log(3)),
          brandConflict: brandMatch === 0,
          packageConflict: packageMatch === 0,
        },
        thresholds
      );
      if (scored.decision === "pending") continue;
      await db.query(
        `INSERT INTO external_product_canonical_matches
           (external_product_id, canonical_id, status, confidence, match_method, evidence)
         VALUES ($1, $2, 'suggested', $3, $4, $5::jsonb)
         ON CONFLICT (external_product_id, canonical_id) WHERE status = 'suggested'
         DO UPDATE SET
           confidence = GREATEST(EXCLUDED.confidence, external_product_canonical_matches.confidence),
           match_method = EXCLUDED.match_method,
           evidence = EXCLUDED.evidence,
           updated_at = now()`,
        [
          external.id,
          candidate.id,
          scored.score,
          scored.method,
          JSON.stringify({ ...scored.evidence, candidate_source: candidate.source }),
        ]
      );
      if (scored.decision === "suggested") bestDecision = "suggested";
      else if (bestDecision === "pending") bestDecision = "needs_review";
      suggestions += 1;
    }
    if (bestDecision === "needs_review") needsReview += 1;
    await db.query(
      `UPDATE external_product_catalog SET match_status = $2 WHERE id = $1`,
      [external.id, bestDecision]
    );
  }
  return { scanned: rows.length, suggestions, needsReview };
}
