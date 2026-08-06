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

import { distance } from "fastest-levenshtein";
import type { SqlTaggedTemplate } from "@/lib/db/client";
import type { CanonicalObservation } from "../canonical-types";
import { foldForComparison, normalizeBrandName } from "../name-normalization";
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

/**
 * Find the raw-name token the LLM read the brand out of, so the registry can
 * learn the OCR spelling ("SENSOD'NE" → Sensodyne). Conservative: the token
 * must be ≥4 chars and ≥0.6 similar to the brand name after folding —
 * otherwise nothing is learned.
 */
function findOcrBrandToken(
  rawName: string,
  brandName: string
): string | null {
  const brandKey = foldForComparison(brandName).replace(/[^a-z0-9]/g, "");
  if (brandKey.length < 4) return null;
  let best: { token: string; score: number } | null = null;
  for (const token of rawName.split(/\s+/)) {
    const tokenKey = foldForComparison(token).replace(/[^a-z0-9]/g, "");
    if (tokenKey.length < 4) continue;
    if (tokenKey === brandKey) return null; // exact spelling — nothing to learn
    const maxLen = Math.max(tokenKey.length, brandKey.length);
    const score = 1 - distance(tokenKey, brandKey) / maxLen;
    if (score >= 0.6 && (!best || score > best.score)) {
      best = { token: token.trim(), score };
    }
  }
  return best?.token ?? null;
}

export interface BrandResolveContext {
  /** Merchant display name — enables private-label attribution. */
  merchantName?: string | null;
}

export async function resolveObservationBrands(
  sql: SqlTaggedTemplate,
  observations: CanonicalObservation[],
  context: BrandResolveContext = {}
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
  // OCR spellings learned this run → appended to name_variants at the end.
  const learnedVariants = new Map<string, Set<string>>(); // slug → variants

  // Private-label context: the retailer's own products carry the retailer
  // name on the label ("MIGROS TARÇIN..." at Migros). Distinctive first token
  // of the merchant name, folded — only tokens ≥4 chars participate.
  const merchantToken = context.merchantName
    ? foldForComparison(context.merchantName).split(/\s+/)[0] ?? ""
    : "";
  const merchantBrandName = context.merchantName?.trim().split(/\s+/)[0] ?? "";

  for (const obs of observations) {
    if (!obs.brand || !obs.brand.trim()) {
      // 2. Deterministic registry match (canonical key first, then raw label).
      const match =
        matchBrandInName(obs.canonical_name, entries) ||
        matchBrandInName(obs.raw_name, entries);
      if (match) obs.brand = match.name;
    }

    // 2b. Private label: the raw line names the retailer itself.
    if (
      (!obs.brand || !obs.brand.trim()) &&
      merchantToken.length >= 4 &&
      foldForComparison(obs.raw_name)
        .split(/\s+/)
        .some((t) => t === merchantToken)
    ) {
      obs.brand = merchantBrandName;
    }

    // Final guard before the registry learns anything: whatever path set the
    // brand (fuzzy alias hit, RAC decision cache, LLM, private label), it must
    // be a name — no numbers ("1.0"), no copy of the item name ("Peynir" on
    // "PEYNİR"). Column-misaligned parses die here instead of entering
    // brand_registry.
    obs.brand = normalizeBrandName(obs.brand, obs.raw_name);

    // Track a non-registry brand (Gemini/LLM) so the registry learns it.
    if (obs.brand && obs.brand.trim()) {
      const slug = brandSlug(obs.brand);
      if (slug && !knownSlugs.has(slug)) newBrands.set(slug, obs.brand.trim());
      // Learn the OCR spelling of a known brand ("SENSOD'NE" → Sensodyne)
      // so the next receipt resolves deterministically without an LLM call.
      if (slug && knownSlugs.has(slug)) {
        const entry = entries.find((e) => e.slug === slug);
        const token = findOcrBrandToken(obs.raw_name, obs.brand);
        if (
          entry &&
          token &&
          !(entry.name_variants ?? []).includes(foldForComparison(token))
        ) {
          if (!learnedVariants.has(slug)) learnedVariants.set(slug, new Set());
          learnedVariants.get(slug)!.add(foldForComparison(token));
        }
      }
    }

    // 3. Classify — verdict-first, category fallback. Never fabricates a brand.
    obs.brand_status = classifyBrandStatus(
      obs.brand,
      obs.category_path,
      obs.brand_verdict,
      obs.raw_name
    );
  }

  // 4. Grow the registry (idempotent, single batched INSERT — this runs on the
  //    receipt hot path, so per-brand round-trips are avoided). Failures here
  //    never block persistence. Variant lists ride along as delimiter-joined
  //    strings because nested arrays don't survive unnest().
  const VARIANT_SEP = "";
  if (newBrands.size > 0) {
    const slugs: string[] = [];
    const names: string[] = [];
    const variantStrs: string[] = [];
    for (const [slug, name] of newBrands) {
      slugs.push(slug);
      names.push(name);
      variantStrs.push(brandNameVariants(name).join(VARIANT_SEP));
    }
    try {
      await sql`
        INSERT INTO brand_registry (slug, name, name_variants)
        SELECT v.slug, v.name, string_to_array(v.variants, ${VARIANT_SEP})
        FROM (
          SELECT unnest(${slugs}::text[]) AS slug,
                 unnest(${names}::text[]) AS name,
                 unnest(${variantStrs}::text[]) AS variants
        ) v
        ON CONFLICT (slug) DO NOTHING
      `;
    } catch (e) {
      console.error(
        `[resolveObservationBrands] registry batch upsert failed:`,
        (e as Error)?.message
      );
    }
  }

  // 4b. Append learned OCR variants (idempotent, single batched UPDATE;
  //     variants already present on the row are filtered out in SQL).
  if (learnedVariants.size > 0) {
    const variantSlugs: string[] = [];
    const variantStrs: string[] = [];
    for (const [slug, variants] of learnedVariants) {
      variantSlugs.push(slug);
      variantStrs.push([...variants].join(VARIANT_SEP));
    }
    try {
      await sql`
        UPDATE brand_registry br
           SET name_variants = COALESCE(br.name_variants, '{}') || array(
                 SELECT x FROM unnest(string_to_array(v.variants, ${VARIANT_SEP})) x
                 WHERE NOT (x = ANY(COALESCE(br.name_variants, '{}')))
               )
          FROM (
            SELECT unnest(${variantSlugs}::text[]) AS slug,
                   unnest(${variantStrs}::text[]) AS variants
          ) v
         WHERE br.slug = v.slug
      `;
    } catch (e) {
      console.error(
        `[resolveObservationBrands] variant batch learn failed:`,
        (e as Error)?.message
      );
    }
  }

  // 5. Feed resolved brands back into brandless canonical_products rows so the
  //    two layers converge (canonical → line inheritance already happens in
  //    the resolver; this is the reverse direction). Batched: first slug per
  //    canonical id wins (the row is only touched while brand_slug IS NULL).
  const feedback = new Map<string, string>();
  for (const obs of observations) {
    if (!obs.canonical_id || !obs.brand?.trim() || obs.brand_status !== "resolved") {
      continue;
    }
    const slug = brandSlug(obs.brand);
    if (!slug || feedback.has(obs.canonical_id)) continue;
    feedback.set(obs.canonical_id, slug);
  }
  if (feedback.size > 0) {
    try {
      await sql`
        UPDATE canonical_products cp
           SET brand_slug = v.slug, updated_at = now()
          FROM (
            SELECT unnest(${[...feedback.keys()]}::uuid[]) AS id,
                   unnest(${[...feedback.values()]}::text[]) AS slug
          ) v
         WHERE cp.id = v.id AND cp.brand_slug IS NULL
      `;
    } catch (e) {
      console.error(
        `[resolveObservationBrands] canonical brand feedback failed:`,
        (e as Error)?.message
      );
    }
  }
}
