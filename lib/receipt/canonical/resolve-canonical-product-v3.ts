/**
 * v3 Taxonomy resolver: OCR receipt line labels -> canonical_products via receipt_product_aliases.
 * Parallel to resolve-canonical-product.ts (legacy). Controlled by USE_TAXONOMY_V3 flag.
 *
 * Flow:
 *   Receipt OCR -> normalize_receipt_text() -> receipt_product_aliases fuzzy search (pg_trgm)
 *     HIT  -> canonical_id -> product_rich_context view -> enriched CanonicalObservation
 *     MISS -> LLM normalization (normalize-product-llm.ts v3 prompt) ->
 *             upsert canonical_products + receipt_product_aliases + brand_registry
 *             -> enriched CanonicalObservation
 */

import { db } from "@/lib/db/client";
import type { CanonicalObservation } from "../canonical-types";
import type { LlmProductNormalization } from "./normalize-product-llm";
import { normalizeReceiptLinesWithLLM } from "./normalize-product-llm";
import { detectGuardedProductCategory } from "./product-category-guards";
import { enrichCanonicalProduct } from "./knowledge-engine";

const FUZZY_THRESHOLD = 0.75; // slightly lower than legacy v1 (0.85) because aliases are raw receipt text

function normQuery(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function safeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

function safeRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

// ─── 1. Fuzzy match against receipt_product_aliases (pg_trgm) ────────────────

interface RichMatch {
  canonical_id: string;
  canonical_name: string;
  display_name_tr: string | null;
  category_path: string | null;
  brand_slug: string | null;
  brand_name: string | null;
  attributes: Record<string, unknown>;
  lifestyle_tags: string[];
  consumption_occasions: string[];
  allergens: string[];
  price_tier: string | null;
  cultural_context_tr: string | null;
  category_cultural_context: string | null;
  llm_one_liner: string | null;
  confidence: number;
  match_type: string;
}

async function fuzzyMatchAliasesBulk(
  rawNames: string[]
): Promise<Map<string, RichMatch>> {
  const map = new Map<string, RichMatch>();
  const uniq = [...new Set(rawNames.map(normQuery).filter((q) => q.length > 0))];
  if (uniq.length === 0) return map;

  const query = `
WITH wanted AS (
  SELECT DISTINCT trim(lower(x)) AS q
  FROM unnest($1::text[]) AS t(x)
  WHERE length(trim(x)) > 0
),
best AS (
  SELECT
    w.q,
    a.canonical_id,
    similarity(a.raw_text_norm, w.q) AS sim,
    a.match_type,
    a.confidence
  FROM wanted w
  CROSS JOIN LATERAL (
    SELECT canonical_id, raw_text_norm, match_type, confidence
    FROM receipt_product_aliases
    ORDER BY similarity(raw_text_norm, w.q) DESC
    LIMIT 1
  ) a
)
SELECT * FROM best WHERE sim >= $2::float
`;

  try {
    const { rows } = await db.query<{
      q: string;
      canonical_id: string;
      sim: string | number;
      match_type: string;
      confidence: string | number;
    }>(query, [uniq, FUZZY_THRESHOLD]);

    // Collect canonical_ids to fetch rich context in one query
    const ids = rows.map((r) => r.canonical_id).filter(Boolean);
    if (ids.length === 0) return map;

    const richQuery = `
SELECT
  id,
  canonical_name,
  display_name_tr,
  category_path,
  brand_slug,
  brand_name,
  attributes,
  lifestyle_tags,
  consumption_occasions,
  allergens,
  price_tier,
  cultural_context_tr,
  category_cultural_context,
  llm_one_liner
FROM product_rich_context
WHERE id = ANY($1::uuid[])
`;

    const { rows: richRows } = await db.query<{
      id: string;
      canonical_name: string;
      display_name_tr: string | null;
      category_path: string | null;
      brand_slug: string | null;
      brand_name: string | null;
      attributes: unknown;
      lifestyle_tags: string[] | null;
      consumption_occasions: string[] | null;
      allergens: string[] | null;
      price_tier: string | null;
      cultural_context_tr: string | null;
      category_cultural_context: string | null;
      llm_one_liner: string | null;
    }>(richQuery, [ids]);

    const richById = new Map<string, typeof richRows[0]>();
    for (const r of richRows) richById.set(r.id, r);

    for (const row of rows) {
      const rich = richById.get(row.canonical_id);
      if (!rich) continue;
      map.set(row.q, {
        canonical_id: rich.id,
        canonical_name: rich.canonical_name,
        display_name_tr: rich.display_name_tr,
        category_path: rich.category_path,
        brand_slug: rich.brand_slug,
        brand_name: rich.brand_name,
        attributes: safeRecord(rich.attributes),
        lifestyle_tags: safeStringArray(rich.lifestyle_tags),
        consumption_occasions: safeStringArray(rich.consumption_occasions),
        allergens: safeStringArray(rich.allergens),
        price_tier: rich.price_tier,
        cultural_context_tr: rich.cultural_context_tr,
        category_cultural_context: rich.category_cultural_context,
        llm_one_liner: rich.llm_one_liner,
        confidence: Math.max(Number(row.sim), Number(row.confidence)),
        match_type: row.match_type,
      });
    }
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e);
    if (/pg_trgm|similarity|does not exist|function similarity/i.test(msg)) {
      console.warn(
        "[resolve-canonical-product-v3] Fuzzy aliases skipped (pg_trgm / similarity). Apply migration 047:",
        msg
      );
    } else {
      console.warn("[resolve-canonical-product-v3] fuzzyMatchAliasesBulk failed:", msg);
    }
  }

  return map;
}

// ─── 2. Upsert brand_registry (idempotent) ───────────────────────────────────

async function upsertBrandRegistry(
  brandName: string | null,
  categoryPath: string | null,
  priceTier?: string | null,
  defaultOccasions?: string[],
  defaultLifestyleTags?: string[]
): Promise<string | null> {
  if (!brandName) return null;
  const slug = brandName
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!slug) return null;

  try {
    await db.query(
      `
INSERT INTO brand_registry (slug, name, name_variants, category_scope, brand_tier, default_occasions, default_lifestyle_tags)
VALUES ($1, $2, ARRAY[$3], ARRAY[$4], $5, $6, $7)
ON CONFLICT (slug) DO UPDATE SET
  name_variants = CASE
    WHEN $3 = ANY(brand_registry.name_variants) THEN brand_registry.name_variants
    ELSE array_append(brand_registry.name_variants, $3)
  END,
  category_scope = CASE
    WHEN $4 IS NULL OR $4 = ANY(brand_registry.category_scope) THEN brand_registry.category_scope
    ELSE array_append(brand_registry.category_scope, $4)
  END,
  brand_tier = COALESCE(NULLIF($5, ''), brand_registry.brand_tier),
  default_occasions = CASE
    WHEN brand_registry.default_occasions IS NULL OR array_length(brand_registry.default_occasions, 1) IS NULL
    THEN $6 ELSE brand_registry.default_occasions
  END,
  default_lifestyle_tags = CASE
    WHEN brand_registry.default_lifestyle_tags IS NULL OR array_length(brand_registry.default_lifestyle_tags, 1) IS NULL
    THEN $7 ELSE brand_registry.default_lifestyle_tags
  END,
  updated_at = now()
`,
      [
        slug,
        brandName.trim(),
        brandName.trim(),
        categoryPath,
        priceTier ?? null,
        defaultOccasions ?? null,
        defaultLifestyleTags ?? null,
      ]
    );
  } catch (e) {
    console.warn("[resolve-canonical-product-v3] upsertBrandRegistry failed:", (e as Error)?.message);
  }
  return slug;
}

// ─── 2b. Auto-create missing category hierarchy paths ────────────────────────

async function ensureCategoryPath(categoryPath: string | null): Promise<void> {
  if (!categoryPath) return;
  const parts = categoryPath.split(".").filter(Boolean);
  if (parts.length === 0) return;

  let parentId: number | null = null;
  let currentPath = "";

  for (let i = 0; i < parts.length; i++) {
    const slug = parts[i];
    currentPath = currentPath ? `${currentPath}.${slug}` : slug;
    const level = i + 1;

    try {
      const { rows } = await db.query<{ id: number }>(
        `SELECT id FROM product_categories WHERE path = $1 LIMIT 1`,
        [currentPath]
      );
      if (rows.length > 0) {
        parentId = rows[0].id;
        continue;
      }

      // Insert missing level
      const nameTr = slug
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const catResult: { rows: Array<{ id: number }> } = await db.query<{ id: number }>(
        `
INSERT INTO product_categories (slug, path, parent_id, level, name_tr, name_en)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (path) DO UPDATE SET updated_at = now()
RETURNING id
`,
        [slug, currentPath, parentId, level, nameTr, slug]
      );
      const newParentId = catResult.rows[0]?.id;
      if (newParentId != null) parentId = newParentId;
    } catch (e) {
      console.warn(
        `[resolve-canonical-product-v3] ensureCategoryPath failed for "${currentPath}":`,
        (e as Error)?.message
      );
      break;
    }
  }
}

// ─── 2c. Auto-insert cost weights for new products ───────────────────────────

async function ensureCostWeights(
  canonicalName: string,
  categoryPath: string | null
): Promise<void> {
  if (!canonicalName || !categoryPath) return;

  // Check if already exists
  try {
    const { rows } = await db.query<{ count: number }>(
      `SELECT 1 as count FROM canonical_product_cost_weights WHERE canonical_name = $1 LIMIT 1`,
      [canonicalName]
    );
    if (rows.length > 0) return;
  } catch { /* ignore */ }

  // Derive internal category from path
  const l1 = categoryPath.split(".")[0] ?? "";
  const internalCat =
    l1 === "groceries" || l1 === "gida"
      ? "groceries_fmcg"
      : l1 === "fashion" || l1 === "giyim"
      ? "apparel_fashion"
      : l1 === "electronics" || l1 === "elektronik"
      ? "electronics"
      : l1 === "food_service" || l1 === "yemek"
      ? "food_delivery"
      : l1 === "transport" || l1 === "ulasim"
      ? "travel_ticket"
      : l1 === "health" || l1 === "saglik"
      ? "beauty_personal_care"
      : l1 === "home_living" || l1 === "ev"
      ? "home_living"
      : "other";

  const laborType =
    l1 === "food_service" || l1 === "yemek" || l1 === "services" || l1 === "hizmetler"
      ? "service"
      : "manufacturing";

  // Try to fetch category-level weights from production_cost_weights
  let weights: {
    raw_material_pct: number;
    labor_pct: number;
    rent_pct: number;
    energy_pct: number;
    other_pct: number;
  } | null = null;

  try {
    const { rows } = await db.query<{
      raw_material_pct: number;
      labor_pct: number;
      rent_pct: number;
      energy_pct: number;
      other_pct: number;
    }>(
      `SELECT raw_material_pct, labor_pct, rent_pct, energy_pct, other_pct
       FROM production_cost_weights
       WHERE category = $1
       LIMIT 1`,
      [internalCat]
    );
    if (rows.length > 0) {
      weights = {
        raw_material_pct: Number(rows[0].raw_material_pct),
        labor_pct: Number(rows[0].labor_pct),
        rent_pct: Number(rows[0].rent_pct),
        energy_pct: Number(rows[0].energy_pct),
        other_pct: Number(rows[0].other_pct),
      };
    }
  } catch {
    /* ignore */
  }

  // Fallback defaults
  const defaultPcts = weights ?? {
    raw_material_pct: 55,
    labor_pct: 12,
    rent_pct: 10,
    energy_pct: 8,
    other_pct: 15,
  };

  try {
    await db.query(
      `
INSERT INTO canonical_product_cost_weights (
  canonical_name, category_path, raw_material_pct, labor_pct, rent_pct, energy_pct, other_pct,
  labor_type, profit_margin, source
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (canonical_name) DO NOTHING
`,
      [
        canonicalName,
        categoryPath,
        defaultPcts.raw_material_pct,
        defaultPcts.labor_pct,
        defaultPcts.rent_pct,
        defaultPcts.energy_pct,
        defaultPcts.other_pct,
        laborType,
        20,
        "AUTO_INFERRED",
      ]
    );
  } catch (e) {
    console.warn(
      "[resolve-canonical-product-v3] ensureCostWeights failed:",
      (e as Error)?.message
    );
  }
}

// ─── 2d. Auto-stub category_attribute_schema for new categories ──────────────

async function upsertCategoryAttributeSchema(
  categoryPath: string | null,
  attributes: Record<string, unknown>
): Promise<void> {
  if (!categoryPath || !attributes || Object.keys(attributes).length === 0) return;
  const keys = Object.keys(attributes);
  for (const key of keys) {
    try {
      await db.query(
        `
INSERT INTO category_attribute_schema (category_path, attr_key, attr_name_tr, attr_type, is_required, affects_price, affects_comparison)
VALUES ($1, $2, $3, $4, FALSE, FALSE, TRUE)
ON CONFLICT (category_path, attr_key) DO NOTHING
`,
        [categoryPath, key, key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), "text"]
      );
    } catch (e) {
      console.warn(
        `[resolve-canonical-product-v3] upsertCategoryAttributeSchema failed for ${key}:`,
        (e as Error)?.message
      );
    }
  }
}

// ─── 3. Upsert canonical_products + receipt_product_aliases from LLM result ────

async function upsertCanonicalProductFromLlmV3(
  llm: LlmProductNormalization
): Promise<RichMatch | null> {
  if (!llm.canonical_name) return null;

  // 1. Ensure category hierarchy exists (auto-create missing L1-L4)
  await ensureCategoryPath(llm.category_path);

  // 2. Compute brand slug for enrichment (before DB write)
  const brandSlug = llm.brand
    ? llm.brand
        .toLowerCase()
        .trim()
        .replace(/ı/g, "i")
        .replace(/ş/g, "s")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    : null;

  // 3. Knowledge engine enrichment (category defaults + brand defaults + hard rules)
  const enriched = await enrichCanonicalProduct(
    {
      category_path: llm.category_path,
      brand_slug: brandSlug,
      attributes: safeRecord(llm.attributes),
      lifestyle_tags: safeStringArray(llm.lifestyle_tags),
      consumption_occasions: safeStringArray(llm.consumption_occasions),
      allergens: safeStringArray(llm.allergens),
      price_tier: llm.price_tier,
    },
    llm.raw_name,
    llm.canonical_name
  );

  // 4. Upsert brand registry with enriched defaults
  if (llm.brand && brandSlug) {
    await upsertBrandRegistry(
      llm.brand,
      llm.category_path,
      enriched.price_tier,
      enriched.consumption_occasions,
      enriched.lifestyle_tags
    );
  }

  // 5. Insert canonical product with enriched data
  const upsertCp = `
INSERT INTO canonical_products (
  canonical_name,
  category_path,
  brand_slug,
  display_name_tr,
  attributes,
  lifestyle_tags,
  consumption_occasions,
  allergens,
  price_tier,
  unit_type,
  typical_unit_size,
  cultural_context_tr,
  confidence_score
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
ON CONFLICT (canonical_name) DO UPDATE SET
  category_path         = EXCLUDED.category_path,
  brand_slug            = EXCLUDED.brand_slug,
  display_name_tr       = EXCLUDED.display_name_tr,
  attributes            = EXCLUDED.attributes,
  lifestyle_tags        = EXCLUDED.lifestyle_tags,
  consumption_occasions = EXCLUDED.consumption_occasions,
  allergens             = EXCLUDED.allergens,
  price_tier            = EXCLUDED.price_tier,
  unit_type             = EXCLUDED.unit_type,
  typical_unit_size     = EXCLUDED.typical_unit_size,
  cultural_context_tr   = EXCLUDED.cultural_context_tr,
  confidence_score      = LEAST(EXCLUDED.confidence_score, canonical_products.confidence_score),
  updated_at            = now()
RETURNING id
`;

  let canonicalId: string | null = null;
  try {
    const { rows } = await db.query<{ id: string }>(upsertCp, [
      llm.canonical_name,
      llm.category_path,
      brandSlug,
      llm.display_name_tr ?? llm.canonical_name.replace(/_/g, " "),
      JSON.stringify(safeRecord(llm.attributes)),
      enriched.lifestyle_tags,
      enriched.consumption_occasions,
      enriched.allergens,
      enriched.price_tier,
      llm.unit_type,
      llm.unit_size ? `${llm.unit_size}${llm.unit_type ?? ""}` : null,
      enriched.cultural_context_tr,
      llm.confidence,
    ]);
    canonicalId = rows[0]?.id ?? null;
  } catch (e) {
    console.warn(
      "[resolve-canonical-product-v3] upsertCanonicalProduct failed:",
      (e as Error)?.message
    );
    return null;
  }

  if (!canonicalId) return null;

  // 6. Ensure cost weights exist for hidden-cost calculation
  await ensureCostWeights(llm.canonical_name, llm.category_path);

  // 7. Stub attribute schema for new categories
  await upsertCategoryAttributeSchema(llm.category_path, llm.attributes);

  // 8. Insert alias mapping
  try {
    await db.query(
      `
INSERT INTO receipt_product_aliases (raw_text, canonical_id, match_type, confidence, times_seen, last_seen)
VALUES ($1, $2, 'llm', $3, 1, now())
ON CONFLICT (raw_text, canonical_id) DO UPDATE SET
  confidence = GREATEST(EXCLUDED.confidence, receipt_product_aliases.confidence),
  times_seen = receipt_product_aliases.times_seen + 1,
  last_seen  = now()
`,
      [llm.raw_name.trim(), canonicalId, llm.confidence]
    );
  } catch (e) {
    console.warn("[resolve-canonical-product-v3] upsert alias failed:", (e as Error)?.message);
  }

  // Build a lightweight RichMatch from enriched LLM result (no DB re-query)
  return {
    canonical_id: canonicalId,
    canonical_name: llm.canonical_name,
    display_name_tr: llm.display_name_tr,
    category_path: llm.category_path,
    brand_slug: brandSlug,
    brand_name: llm.brand,
    attributes: safeRecord(llm.attributes),
    lifestyle_tags: enriched.lifestyle_tags,
    consumption_occasions: enriched.consumption_occasions,
    allergens: enriched.allergens,
    price_tier: enriched.price_tier,
    cultural_context_tr: enriched.cultural_context_tr,
    category_cultural_context: null,
    llm_one_liner: null,
    confidence: llm.confidence,
    match_type: "llm",
  };
}

// ─── 4. Main resolver (mutates observations in place) ─────────────────────────

const LLM_BATCH = 18;

export interface ResolveContext {
  /** The merchant id the receipt came from — used as a hint in RAC retrieval */
  merchantId?: string | null;
  /** Receipt language hint (tr/en/ms/id/th/ar) */
  language?: string;
}

export async function resolveCanonicalObservationsV3(
  observations: CanonicalObservation[],
  context: ResolveContext = {}
): Promise<void> {
  if (!observations.length) return;

  const rawNames = observations.map((o) => o.raw_name).filter(Boolean);
  const fuzzyByNorm = await fuzzyMatchAliasesBulk(rawNames);

  const fuzzyResolvedNorm = new Set<string>();
  for (const obs of observations) {
    const q = normQuery(obs.raw_name);
    const hit = q ? fuzzyByNorm.get(q) : undefined;
    if (!hit) continue;

    obs.canonical_name = hit.canonical_name;
    obs.brand = hit.brand_name ?? obs.brand;
    obs.category_path = hit.category_path;
    obs.display_name_tr = hit.display_name_tr;
    obs.attributes = hit.attributes;
    obs.lifestyle_tags = hit.lifestyle_tags;
    obs.consumption_occasions = hit.consumption_occasions;
    obs.allergens = hit.allergens;
    obs.price_tier = hit.price_tier;
    obs.canonical_id = hit.canonical_id;
    obs.confidence_score = Math.max(obs.confidence_score ?? 0.8, hit.confidence);

    // Backward-compat: derive lvl1/lvl2 from path
    if (hit.category_path) {
      const parts = hit.category_path.split(".");
      obs.category_lvl1 = parts[0] ?? obs.category_lvl1;
      obs.category_lvl2 = parts[1] ?? obs.category_lvl2;
    }

    fuzzyResolvedNorm.add(q);
  }

  // Guarded categories (alcohol / tobacco / fuel) hard overrides
  for (const obs of observations) {
    const guarded = detectGuardedProductCategory(`${obs.raw_name} ${obs.canonical_name}`);
    if (guarded) {
      obs.category_lvl1 = guarded;
      obs.category_lvl2 = guarded;
      if (guarded === "alcohol") obs.category_path = "groceries.alcohol";
      if (guarded === "tobacco") obs.category_path = "groceries.tobacco";
      if (guarded === "fuel" && !obs.category_path?.startsWith("transport.fuel")) {
        obs.category_path = "transport.fuel";
      }
      obs.confidence_score = Math.max(obs.confidence_score ?? 0.8, 0.95);
    }
  }

  const needLlm = observations
    .filter((o) => !fuzzyResolvedNorm.has(normQuery(o.raw_name)))
    .map((o) => o.raw_name);
  const uniqueLlm = [...new Set(needLlm.map((r) => r.trim()).filter(Boolean))];
  if (uniqueLlm.length === 0) return;

  // ─── RAC flow (USE_RAC_PRODUCT=true) ──────────────────────────────────────
  // Shows existing canonical_products to the LLM as candidates → matches instead of duplicating.
  if (process.env.USE_RAC_PRODUCT === "true") {
    await applyRacFlow(observations, fuzzyResolvedNorm, uniqueLlm, context);
    return;
  }

  // ─── Legacy LLM-only flow (current behavior, default) ─────────────────────
  for (let i = 0; i < uniqueLlm.length; i += LLM_BATCH) {
    const chunk = uniqueLlm.slice(i, i + LLM_BATCH);
    const llmMap = await normalizeReceiptLinesWithLLM(chunk);

    for (const obs of observations) {
      const q = normQuery(obs.raw_name);
      if (fuzzyResolvedNorm.has(q)) continue;

      const llm =
        llmMap.get(obs.raw_name.toLowerCase()) ||
        llmMap.get(q) ||
        llmMap.get(obs.raw_name.trim());
      if (!llm) continue;

      obs.brand_verdict = llm.brand_verdict;

      const guarded = detectGuardedProductCategory(
        `${obs.raw_name} ${obs.canonical_name} ${llm.raw_name} ${llm.canonical_name}`
      );

      let finalCategoryPath = llm.category_path;
      if (guarded === "alcohol") finalCategoryPath = "groceries.alcohol";
      if (guarded === "tobacco") finalCategoryPath = "groceries.tobacco";
      if (guarded === "fuel" && !llm.category_path?.startsWith("transport.fuel")) {
        finalCategoryPath = "transport.fuel";
      }

      const enriched = await upsertCanonicalProductFromLlmV3({
        ...llm,
        category_path: finalCategoryPath,
      });

      if (enriched) {
        obs.canonical_name = enriched.canonical_name;
        obs.brand = enriched.brand_name ?? obs.brand;
        obs.category_path = enriched.category_path;
        obs.display_name_tr = enriched.display_name_tr;
        obs.attributes = enriched.attributes;
        obs.lifestyle_tags = enriched.lifestyle_tags;
        obs.consumption_occasions = enriched.consumption_occasions;
        obs.allergens = enriched.allergens;
        obs.price_tier = enriched.price_tier;
        obs.canonical_id = enriched.canonical_id;
        obs.confidence_score = guarded ? 0.95 : enriched.confidence;
      } else {
        // Fallback: just populate v3 fields from LLM without DB persistence
        obs.canonical_name = llm.canonical_name;
        if (llm.brand) obs.brand = llm.brand;
        obs.category_path = finalCategoryPath;
        obs.display_name_tr = llm.display_name_tr;
        obs.attributes = safeRecord(llm.attributes);
        obs.lifestyle_tags = safeStringArray(llm.lifestyle_tags);
        obs.consumption_occasions = safeStringArray(llm.consumption_occasions);
        obs.allergens = safeStringArray(llm.allergens);
        obs.price_tier = llm.price_tier;
        obs.confidence_score = guarded ? 0.95 : llm.confidence;
      }

      // Backward-compat
      if (obs.category_path) {
        const parts = obs.category_path.split(".");
        obs.category_lvl1 = parts[0] ?? obs.category_lvl1;
        obs.category_lvl2 = parts[1] ?? obs.category_lvl2;
      }

      fuzzyResolvedNorm.add(q);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RAC (Retrieval-Augmented Canonicalization) flow
// ═══════════════════════════════════════════════════════════════════════════
//
// Shows existing canonical_products to the LLM as candidates to prevent
// duplicate creation. Flow:
//   1. retrieveProductCandidates(rawName) → top-3 candidates (alias trgm +
//      canonical trgm + embedding cosine union)
//   2. Decision cache check (Redis-first, PG fallback) — skip LLM if present
//   3. llmCanonicalizeProductsBatch(rawNames, candidatesByRaw)
//   4. decision='match' → link to the existing canonical (no new row created)
//      decision='new'   → go through the legacy upsertCanonicalProductFromLlmV3 flow
//   5. setCachedProductDecision (Redis + PG audit)
// ═══════════════════════════════════════════════════════════════════════════

async function applyRacFlow(
  observations: CanonicalObservation[],
  fuzzyResolvedNorm: Set<string>,
  uniqueLlm: string[],
  context: ResolveContext
): Promise<void> {
  const [
    { retrieveProductCandidates },
    { llmCanonicalizeProductsBatch, getCachedProductDecision, setCachedProductDecision },
  ] = await Promise.all([
    import("@/lib/canonical/retrieve-product-candidates"),
    import("@/lib/canonical/llm-product-canonicalize"),
  ]);

  // 1. Retrieve candidates for each unique raw name + cache check
  const candidatesByRaw = new Map<
    string,
    Awaited<ReturnType<typeof retrieveProductCandidates>>
  >();
  const cachedByRaw = new Map<
    string,
    Awaited<ReturnType<typeof getCachedProductDecision>>
  >();
  const needLlmRaw: string[] = [];

  for (const raw of uniqueLlm) {
    const cached = await getCachedProductDecision(raw, context.merchantId);
    if (cached) {
      cachedByRaw.set(raw, cached);
      continue;
    }
    const candidates = await retrieveProductCandidates({
      rawName: raw,
      merchantId: context.merchantId,
      limit: 3,
    });
    candidatesByRaw.set(raw, candidates);
    needLlmRaw.push(raw);
  }

  // 2. LLM batch canonicalize (cache miss only)
  const llmDecisions =
    needLlmRaw.length > 0
      ? await llmCanonicalizeProductsBatch({
          rawNames: needLlmRaw,
          candidatesByRaw,
          merchantId: context.merchantId,
          language: context.language,
        })
      : new Map();

  // 3. Apply decisions to observations
  for (const obs of observations) {
    const q = normQuery(obs.raw_name);
    if (fuzzyResolvedNorm.has(q)) continue;

    const raw = obs.raw_name.trim();
    const decision =
      cachedByRaw.get(raw) ??
      llmDecisions.get(obs.raw_name.toLowerCase()) ??
      llmDecisions.get(q) ??
      llmDecisions.get(raw);

    if (!decision) continue;

    const guarded = detectGuardedProductCategory(
      `${obs.raw_name} ${obs.canonical_name} ${decision.canonical_name ?? ""}`
    );

    if (decision.decision === "match" && decision.matched_id) {
      // Link to the existing canonical — DO NOT create a new row
      const existing = await fetchCanonicalById(decision.matched_id);
      if (existing) {
        applyExistingToObservation(obs, existing, decision.confidence);
        // Save the alias (learning — resolved directly via fuzzy hit next time)
        await upsertAliasMapping(raw, decision.matched_id, decision.confidence);

        // Cache (if not already cached)
        if (!cachedByRaw.has(raw)) {
          await setCachedProductDecision(
            raw,
            context.merchantId,
            candidatesByRaw.get(raw) ?? [],
            decision
          );
        }
        fuzzyResolvedNorm.add(q);
        continue;
      }
      // matched_id invalid/deleted → fall through to 'new' path
    }

    // decision='new' or 'match' failed → create via the existing flow
    let finalCategoryPath = decision.category_path;
    if (guarded === "alcohol") finalCategoryPath = "groceries.alcohol";
    if (guarded === "tobacco") finalCategoryPath = "groceries.tobacco";
    if (
      guarded === "fuel" &&
      !decision.category_path?.startsWith("transport.fuel")
    ) {
      finalCategoryPath = "transport.fuel";
    }

    const enriched = await upsertCanonicalProductFromLlmV3({
      raw_name: raw,
      canonical_name: decision.canonical_name ?? "",
      display_name_tr: decision.display_name_tr,
      brand: decision.brand,
      brand_verdict: decision.brand ? "BRAND" : "UNKNOWN",
      category_path: finalCategoryPath,
      category_lvl1: finalCategoryPath?.split(".")[0] ?? null,
      category_lvl2: finalCategoryPath?.split(".")[1] ?? null,
      unit_size: decision.unit_size,
      unit_type: decision.unit_type,
      attributes: decision.attributes,
      lifestyle_tags: decision.lifestyle_tags,
      consumption_occasions: decision.consumption_occasions,
      allergens: decision.allergens,
      price_tier: decision.price_tier,
      confidence: decision.confidence,
    });

    if (enriched) {
      obs.canonical_name = enriched.canonical_name;
      obs.brand = enriched.brand_name ?? obs.brand;
      obs.category_path = enriched.category_path;
      obs.display_name_tr = enriched.display_name_tr;
      obs.attributes = enriched.attributes;
      obs.lifestyle_tags = enriched.lifestyle_tags;
      obs.consumption_occasions = enriched.consumption_occasions;
      obs.allergens = enriched.allergens;
      obs.price_tier = enriched.price_tier;
      obs.canonical_id = enriched.canonical_id;
      obs.confidence_score = guarded ? 0.95 : enriched.confidence;
    } else if (decision.canonical_name) {
      obs.canonical_name = decision.canonical_name;
      if (decision.brand) obs.brand = decision.brand;
      obs.category_path = finalCategoryPath;
      obs.display_name_tr = decision.display_name_tr;
      obs.attributes = safeRecord(decision.attributes);
      obs.lifestyle_tags = safeStringArray(decision.lifestyle_tags);
      obs.consumption_occasions = safeStringArray(decision.consumption_occasions);
      obs.allergens = safeStringArray(decision.allergens);
      obs.price_tier = decision.price_tier;
      obs.confidence_score = guarded ? 0.95 : decision.confidence;
    }

    if (obs.category_path) {
      const parts = obs.category_path.split(".");
      obs.category_lvl1 = parts[0] ?? obs.category_lvl1;
      obs.category_lvl2 = parts[1] ?? obs.category_lvl2;
    }

    // Cache write (new decision)
    if (!cachedByRaw.has(raw)) {
      await setCachedProductDecision(
        raw,
        context.merchantId,
        candidatesByRaw.get(raw) ?? [],
        decision
      );
    }

    fuzzyResolvedNorm.add(q);
  }
}

// ─── RAC helpers ─────────────────────────────────────────────────────────────

interface ExistingCanonical {
  canonical_id: string;
  canonical_name: string;
  display_name_tr: string | null;
  brand_name: string | null;
  category_path: string | null;
  attributes: Record<string, unknown>;
  lifestyle_tags: string[];
  consumption_occasions: string[];
  allergens: string[];
  price_tier: string | null;
}

async function fetchCanonicalById(
  id: string
): Promise<ExistingCanonical | null> {
  try {
    const { rows } = await db.query<{
      id: string;
      canonical_name: string;
      display_name_tr: string | null;
      brand_name: string | null;
      category_path: string | null;
      attributes: unknown;
      lifestyle_tags: string[] | null;
      consumption_occasions: string[] | null;
      allergens: string[] | null;
      price_tier: string | null;
    }>(
      `SELECT cp.id, cp.canonical_name, cp.display_name_tr,
              br.name AS brand_name,
              cp.category_path, cp.attributes,
              cp.lifestyle_tags, cp.consumption_occasions, cp.allergens, cp.price_tier
         FROM canonical_products cp
         LEFT JOIN brand_registry br ON br.slug = cp.brand_slug
        WHERE cp.id = $1
        LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      canonical_id: r.id,
      canonical_name: r.canonical_name,
      display_name_tr: r.display_name_tr,
      brand_name: r.brand_name,
      category_path: r.category_path,
      attributes: safeRecord(r.attributes),
      lifestyle_tags: safeStringArray(r.lifestyle_tags),
      consumption_occasions: safeStringArray(r.consumption_occasions),
      allergens: safeStringArray(r.allergens),
      price_tier: r.price_tier,
    };
  } catch (e) {
    console.warn(
      "[resolve-canonical-product-v3] fetchCanonicalById failed:",
      (e as Error)?.message
    );
    return null;
  }
}

function applyExistingToObservation(
  obs: CanonicalObservation,
  existing: ExistingCanonical,
  confidence: number
): void {
  obs.canonical_id = existing.canonical_id;
  obs.canonical_name = existing.canonical_name;
  obs.display_name_tr = existing.display_name_tr;
  obs.brand = existing.brand_name ?? obs.brand;
  obs.category_path = existing.category_path;
  obs.attributes = existing.attributes;
  obs.lifestyle_tags = existing.lifestyle_tags;
  obs.consumption_occasions = existing.consumption_occasions;
  obs.allergens = existing.allergens;
  obs.price_tier = existing.price_tier;
  obs.confidence_score = Math.max(obs.confidence_score ?? 0.8, confidence);
  if (existing.category_path) {
    const parts = existing.category_path.split(".");
    obs.category_lvl1 = parts[0] ?? obs.category_lvl1;
    obs.category_lvl2 = parts[1] ?? obs.category_lvl2;
  }
}

async function upsertAliasMapping(
  rawText: string,
  canonicalId: string,
  confidence: number
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO receipt_product_aliases
         (raw_text, canonical_id, match_type, confidence, times_seen, last_seen)
       VALUES ($1, $2, 'llm', $3, 1, now())
       ON CONFLICT (raw_text, canonical_id) DO UPDATE SET
         confidence = GREATEST(EXCLUDED.confidence, receipt_product_aliases.confidence),
         times_seen = receipt_product_aliases.times_seen + 1,
         last_seen  = now()`,
      [rawText.trim(), canonicalId, confidence]
    );
  } catch (e) {
    console.warn(
      "[resolve-canonical-product-v3] upsertAliasMapping failed:",
      (e as Error)?.message
    );
  }
}
