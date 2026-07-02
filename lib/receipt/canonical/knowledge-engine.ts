/**
 * Knowledge Engine: Enrich canonical product records with category defaults,
 * brand defaults, and rule-based inference.
 *
 * This runs AFTER LLM normalization to fill in gaps and apply hard rules
 * that LLM may miss or get wrong.
 */

import { db } from "@/lib/db/client";

export interface EnrichmentInput {
  canonical_id?: string | null;
  category_path: string | null;
  brand_slug: string | null;
  attributes: Record<string, unknown>;
  lifestyle_tags?: string[];
  consumption_occasions?: string[];
  allergens?: string[];
  cultural_context_tr?: string | null;
  price_tier?: string | null;
}

export interface EnrichmentResult {
  lifestyle_tags: string[];
  consumption_occasions: string[];
  allergens: string[];
  cultural_context_tr: string | null;
  price_tier: string | null;
}

interface CategoryDefaults {
  cultural_context_tr: string | null;
  consumption_occasions: string[];
  lifestyle_tags_typical: string[];
  allergen_flags: string[];
  price_tier_typical: string | null;
}

interface BrandDefaults {
  cultural_notes_tr: string | null;
  default_occasions: string[];
  default_lifestyle_tags: string[];
  brand_tier: string | null;
}

async function fetchCategoryDefaults(categoryPath: string | null): Promise<CategoryDefaults | null> {
  if (!categoryPath) return null;
  try {
    const { rows } = await db.query<{
      cultural_context_tr: string | null;
      consumption_occasions: string[] | null;
      lifestyle_tags_typical: string[] | null;
      allergen_flags: string[] | null;
      price_tier_typical: string | null;
    }>(
      `
SELECT cultural_context_tr, consumption_occasions, lifestyle_tags_typical, allergen_flags, price_tier_typical
FROM product_categories
WHERE path = $1
LIMIT 1
`,
      [categoryPath]
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      cultural_context_tr: r.cultural_context_tr,
      consumption_occasions: r.consumption_occasions ?? [],
      lifestyle_tags_typical: r.lifestyle_tags_typical ?? [],
      allergen_flags: r.allergen_flags ?? [],
      price_tier_typical: r.price_tier_typical,
    };
  } catch (e) {
    console.warn("[knowledge-engine] fetchCategoryDefaults failed:", (e as Error)?.message);
    return null;
  }
}

async function fetchBrandDefaults(brandSlug: string | null): Promise<BrandDefaults | null> {
  if (!brandSlug) return null;
  try {
    const { rows } = await db.query<{
      cultural_notes_tr: string | null;
      default_occasions: string[] | null;
      default_lifestyle_tags: string[] | null;
      brand_tier: string | null;
    }>(
      `
SELECT cultural_notes_tr, default_occasions, default_lifestyle_tags, brand_tier
FROM brand_registry
WHERE slug = $1
LIMIT 1
`,
      [brandSlug]
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      cultural_notes_tr: r.cultural_notes_tr,
      default_occasions: r.default_occasions ?? [],
      default_lifestyle_tags: r.default_lifestyle_tags ?? [],
      brand_tier: r.brand_tier,
    };
  } catch (e) {
    console.warn("[knowledge-engine] fetchBrandDefaults failed:", (e as Error)?.message);
    return null;
  }
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr.filter((s) => typeof s === "string" && s.length > 0))];
}

function union(a: string[], b: string[]): string[] {
  return dedupe([...a, ...b]);
}

function applyWeightRules(
  occasions: string[],
  attrs: Record<string, unknown>
): string[] {
  const weightG = typeof attrs.weight_g === "number" ? attrs.weight_g : null;
  const volumeMl = typeof attrs.volume_ml === "number" ? attrs.volume_ml : null;

  const result = [...occasions];

  // Large package -> social / family occasions
  if ((weightG && weightG >= 500) || (volumeMl && volumeMl >= 1000)) {
    if (!result.includes("misafir_ikrami")) result.push("misafir_ikrami");
    if (!result.includes("bayram")) result.push("bayram");
    if (!result.includes("ramazan_iftar")) result.push("ramazan_iftar");
  }

  // Small single-serve package -> personal / on-the-go
  if ((weightG && weightG <= 50) || (volumeMl && volumeMl <= 250)) {
    if (!result.includes("yolculuk")) result.push("yolculuk");
    if (!result.includes("ofis")) result.push("ofis");
    if (!result.includes("atistirmalik")) result.push("atistirmalik");
  }

  // Medium package -> daily / family
  if ((weightG && weightG > 50 && weightG < 500) || (volumeMl && volumeMl > 250 && volumeMl < 1000)) {
    if (!result.includes("cay_kahve_yaninda")) result.push("cay_kahve_yaninda");
    if (!result.includes("kahvalti")) result.push("kahvalti");
  }

  return dedupe(result);
}

function applyAllergenRules(
  allergens: string[],
  categoryFlags: string[],
  rawName: string,
  canonicalName: string
): string[] {
  const combinedText = `${rawName} ${canonicalName}`.toLowerCase();
  const result = [...allergens];

  // If category declares an allergen flag, and product name hints at it, confirm it
  const allergenKeywords: Record<string, string[]> = {
    fistik: ["fist", "antep", "pistachio"],
    findik: ["find", "hazelnut", "nutella"],
    badem: ["badem", "almond"],
    ceviz: ["ceviz", "walnut"],
    gluten: ["bugday", "ekmek", "makarna", "pasta", "un", "bulgur", "biskuvi"],
    laktoz: ["sut", "peynir", "yogurt", "tereyag", "kaymak", "ayran", "kefir", "dairy", "milk", "cheese"],
    yumurta: ["yumurta", "egg", "mayonez"],
    soya: ["soya", "soy", "tofu"],
    susam: ["susam", "sesame", "tahin"],
  };

  for (const [allergen, keywords] of Object.entries(allergenKeywords)) {
    if (result.includes(allergen)) continue;
    // Only add if category flags it AND text matches
    if (categoryFlags.includes(allergen)) {
      const matches = keywords.some((k) => combinedText.includes(k));
      if (matches && !result.includes(allergen)) {
        result.push(allergen);
      }
    }
  }

  return dedupe(result);
}

function inferPriceTier(
  inputTier: string | null | undefined,
  categoryTier: string | null,
  brandTier: string | null,
  attrs: Record<string, unknown>
): string | null {
  if (inputTier && inputTier !== "degisken") return inputTier;
  if (brandTier) return brandTier;
  if (categoryTier) return categoryTier;

  // Fallback: use package size as weak signal
  const weightG = typeof attrs.weight_g === "number" ? attrs.weight_g : null;
  const volumeMl = typeof attrs.volume_ml === "number" ? attrs.volume_ml : null;
  if ((weightG && weightG >= 1000) || (volumeMl && volumeMl >= 5000)) {
    return "butce"; // bulk = budget
  }
  return "orta";
}

function buildCulturalContext(
  categoryContext: string | null,
  brandNotes: string | null,
  productSpecific: string | null
): string | null {
  const parts: string[] = [];
  if (categoryContext) parts.push(categoryContext);
  if (brandNotes) parts.push(brandNotes);
  if (productSpecific) parts.push(productSpecific);
  if (parts.length === 0) return null;
  return parts.join(" ");
}

/**
 * Main enrichment function. Call this after LLM normalization to layer on
 * category defaults, brand defaults, and hard rules.
 */
export async function enrichCanonicalProduct(
  input: EnrichmentInput,
  rawName?: string,
  canonicalName?: string
): Promise<EnrichmentResult> {
  const [catDefaults, brandDefaults] = await Promise.all([
    fetchCategoryDefaults(input.category_path),
    fetchBrandDefaults(input.brand_slug),
  ]);

  // 1. Merge tags & occasions from category + brand + LLM
  const lifestyleTags = union(
    union(input.lifestyle_tags ?? [], catDefaults?.lifestyle_tags_typical ?? []),
    brandDefaults?.default_lifestyle_tags ?? []
  );

  let consumptionOccasions = union(
    union(input.consumption_occasions ?? [], catDefaults?.consumption_occasions ?? []),
    brandDefaults?.default_occasions ?? []
  );

  // 2. Apply weight/volume rules
  consumptionOccasions = applyWeightRules(consumptionOccasions, input.attributes);

  // 3. Allergen rules
  const allergenFlags = catDefaults?.allergen_flags ?? [];
  const allergens = applyAllergenRules(
    input.allergens ?? [],
    allergenFlags,
    rawName ?? "",
    canonicalName ?? ""
  );

  // 4. Price tier
  const priceTier = inferPriceTier(
    input.price_tier,
    catDefaults?.price_tier_typical ?? null,
    brandDefaults?.brand_tier ?? null,
    input.attributes
  );

  // 5. Cultural context
  const culturalContextTr = buildCulturalContext(
    catDefaults?.cultural_context_tr ?? null,
    brandDefaults?.cultural_notes_tr ?? null,
    input.cultural_context_tr ?? null
  );

  return {
    lifestyle_tags: lifestyleTags,
    consumption_occasions: consumptionOccasions,
    allergens,
    cultural_context_tr: culturalContextTr,
    price_tier: priceTier,
  };
}
