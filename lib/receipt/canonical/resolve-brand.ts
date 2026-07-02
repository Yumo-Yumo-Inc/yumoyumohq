/**
 * Path-agnostic brand resolution + classification, run once over all
 * observations after canonical resolution (v1 or v3) and before line-item
 * persistence. Three responsibilities:
 *
 *   1. Fill a missing brand by deterministic brand_registry match (Layer 1).
 *   2. Classify every observation into a brand_status (resolved / unbranded /
 *      needs_user) — never fabricate a brand; brand-expected gaps become
 *      'needs_user' so the result screen can ask the user.
 *   3. Grow brand_registry with brands found this run (from Gemini/LLM/registry)
 *      so future receipts resolve them deterministically without an LLM call.
 *
 * Defensive: any DB failure degrades to classification only; never throws.
 */

import type { SqlTaggedTemplate } from "@/lib/db/client";
import type { CanonicalObservation } from "../canonical-types";
import { foldForComparison } from "../name-normalization";
import {
  brandNameVariants,
  matchBrandInName,
  type BrandRegistryEntry,
} from "./match-brand-registry";
import { classifyBrandStatus } from "./brand-expectation";

/** Derive a stable registry slug from a brand display name. */
function brandSlug(name: string): string {
  return foldForComparison(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function resolveObservationBrands(
  sql: SqlTaggedTemplate,
  observations: CanonicalObservation[]
): Promise<void> {
  if (observations.length === 0) return;

  // 1. Load the registry once (442 rows today — trivial; matched in memory).
  let entries: BrandRegistryEntry[] = [];
  try {
    const rows = (await sql`
      SELECT slug, name, name_variants FROM brand_registry
    `) as Array<{ slug: string; name: string; name_variants: string[] | null }>;
    entries = rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      name_variants: r.name_variants,
    }));
  } catch (e) {
    console.error("[resolveObservationBrands] registry load failed:", (e as Error)?.message);
  }

  // Brands found this run that are not yet in the registry → upsert at the end.
  const newBrands = new Map<string, string>(); // slug → display name
  const knownSlugs = new Set(entries.map((e) => e.slug));

  for (const obs of observations) {
    if (!obs.brand || !obs.brand.trim()) {
      // 2. Deterministic registry match (canonical key first, then raw label).
      const match =
        matchBrandInName(obs.canonical_name, entries) ||
        matchBrandInName(obs.raw_name, entries);
      if (match) obs.brand = match.name;
    }

    // Track a non-registry brand (Gemini/LLM) so the registry learns it.
    if (obs.brand && obs.brand.trim()) {
      const slug = brandSlug(obs.brand);
      if (slug && !knownSlugs.has(slug)) newBrands.set(slug, obs.brand.trim());
    }

    // 3. Classify — verdict-first, category fallback. Never fabricates a brand.
    obs.brand_status = classifyBrandStatus(
      obs.brand,
      obs.category_path,
      obs.brand_verdict,
      obs.raw_name
    );
  }

  // 4. Grow the registry (idempotent). Failures here never block persistence.
  for (const [slug, name] of newBrands) {
    try {
      await sql`
        INSERT INTO brand_registry (slug, name, name_variants)
        VALUES (${slug}, ${name}, ${brandNameVariants(name)})
        ON CONFLICT (slug) DO NOTHING
      `;
    } catch (e) {
      console.error(
        `[resolveObservationBrands] registry upsert failed for ${slug}:`,
        (e as Error)?.message
      );
    }
  }
}
