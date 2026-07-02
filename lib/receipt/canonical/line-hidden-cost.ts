/**
 * Line-level reference price and hidden cost calculation for canonical observations.
 *
 * Methodology (YUMO HiddenCost Methodology v3 — Dual Model):
 *
 *   Every category is assigned one of two models (see production_cost_weights.model_type):
 *
 *   producer_gap (physical goods — groceries_fmcg, apparel, electronics, beauty, home):
 *     "How much less would you pay if you bought this directly from the producer/factory?"
 *     Priority:
 *       0  → TÜİK official average retail price
 *       0.5 → Taxonomy-based PPI-weighted cost calculation (canonical_product_taxonomy)
 *       1  → Category-based PPI-weighted cost calculation (production_cost_weights)
 *       2  → profit_margin_factor
 *       3  → fallback_rate
 *
 *   market_benchmark (services — food_delivery, hospitality, travel, services_digital):
 *     "The sector average for this service is X TL, you paid Y TL."
 *     Priority:
 *       0  → TÜİK official average price
 *       B  → TÜİK CPI sub-series benchmark index (benchmark_series)
 *              ReferencePrice = line_total / CPI_benchmark_index
 *       2  → profit_margin_factor
 *       3  → fallback_rate
 *
 *   fallback (other category):
 *     ReferencePrice = line_total / avg(CPI_GENEL_index, PPI_C_index)
 *
 * Sources:
 *   TÜİK Average Prices: veriportali.tuik.gov.tr (January 2026, 428 products)
 *   TCMB Inflation Report 2026-I, 12 February 2026
 *   Dual HiddenCost Architecture Design Document, 19 February 2026
 */

import type { CanonicalObservation, CanonicalPayload } from "../canonical-types";
import type { TuikPriceResult } from "@/lib/mining/tuikReferencePrice";
import type { HiddenCostModelType } from "@/lib/mining/types";
import { detectGuardedProductCategory } from "./product-category-guards";
import { categorySeriesMap } from "@/lib/mining/categorySeriesMap";
import { toHiddenCategory, computeLineComposition, commercialKatFor, isNonPurchaseLine } from "@/lib/mining/hiddenCostComposition";
import { countryHasExciseModel } from "@/lib/mining/exciseTax";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ProductionCostWeightsRow {
  raw_material_pct: number;
  labor_pct: number;
  rent_pct: number;
  energy_pct: number;
  other_pct: number;
  profit_margin_factor: number;
  /** Calculation model: producer_gap | market_benchmark | fallback */
  model_type: HiddenCostModelType;
  /** TÜİK CPI sub-series code for market_benchmark (e.g. "11", "07", "08") */
  benchmark_series: string | null;
}

export interface LineHiddenCostResult {
  observation: CanonicalObservation;
  reference_price: number;
  hidden_cost_line: number;
  /**
   * Which calculation path was used:
   *   tuik_official      — TÜİK official average price
   *   taxonomy_weighted  — canonical_product_taxonomy, product-based PPI-weighted
   *   weighted_index     — production_cost_weights, category-based PPI-weighted (producer_gap)
   *   market_benchmark_cpi — TÜİK CPI sub-series benchmark (market_benchmark)
   *   fallback_avg_index — avg(CPI GENEL + PPI C) (other/fallback, full tier)
   *   inflation_premium  — amount paid / (annual CPI/GENEL multiplier) (inflation_only tier)
   *   no_data            — inflation_only tier but no CPI data available → hidden cost is 0
   *   profit_margin_factor — profit_margin_factor divisor only
   *   fallback_rate      — fixed rate (no data available)
   */
  calc_method:
    | "izmir_hal"
    | "fuel_otv"
    | "category_kat"
    | "non_purchase"
    | "tuik_official"
    | "taxonomy_weighted"
    | "weighted_index"
    | "market_benchmark_cpi"
    | "fallback_avg_index"
    | "inflation_premium"
    | "no_data"
    | "profit_margin_factor"
    | "fallback_rate";
  /** model_type info — for logging and frontend display */
  model_type?: HiddenCostModelType;
  /** If a TÜİK match exists: which product matched at which price */
  tuik_match?: Pick<TuikPriceResult, "canonical_key" | "tuik_name" | "avg_price_tl" | "match_type">;
  /** If a taxonomy match exists: which canonical product record was used */
  taxonomy_match?: { canonical_name: string; category_lvl2: string; labor_type: string };
}

/** Row returned from the canonical_product_taxonomy table */
export interface TaxonomyRow {
  canonical_name:   string;
  category_lvl1:    string;
  category_lvl2:    string | null;
  raw_material_pct: number;
  labor_pct:        number;
  rent_pct:         number;
  energy_pct:       number;
  other_pct:        number;
  labor_type:       "manufacturing" | "service";
  profit_margin:    number;
}

export interface ComputeLineHiddenCostInput {
  payload: CanonicalPayload;
  country: string;
  yearMonth: string;
  /** Fallback hidden rate (0-1): used when no data is available */
  fallbackHiddenRate: number;
  /** Pre-fetched production cost weights by internal category */
  weightsByCategory?: Record<string, ProductionCostWeightsRow>;
  /** Pre-fetched economic index multipliers (see fetchEconomicIndexMultipliers) — legacy/global */
  economicMultipliers?: EconomicIndexMultipliers;
  /**
   * Pre-fetched YoY (year-over-year) index factor map: "INDEX_TYPE/series" → factor.
   * When provided, category-specific multipliers are derived from this per line
   * (see fetchEconomicYoYMap + multipliersForCategory), replacing economicMultipliers.
   * Provides a category-based, current, ratio/percentage-bug-free calculation.
   */
  economicYoY?: Map<string, number>;
  /**
   * Pre-fetched TÜİK reference prices: canonical_key → TuikPriceResult
   * See getTuikReferencePriceBulk()
   */
  tuikPrices?: Map<string, TuikPriceResult>;
  /**
   * Pre-fetched canonical_product_taxonomy: canonical_name → TaxonomyRow
   * Product-based cost weights; queried before category weights.
   * See fetchTaxonomyBulk()
   */
  taxonomyByName?: Map<string, TaxonomyRow>;
  /**
   * Pre-fetched current Izmir wholesale-market WHOLESALE prices: canonical_key → {avg TL, unit}.
   * Producer/wholesale reference for fresh vegetables/fruit (real data). hidden = paid − wholesale×kg.
   * See fetchIzmirHalBulk()
   */
  halPrices?: Map<string, { avg: number; unit: string }>;
  /**
   * Hidden-cost data tier (supported_countries.hidden_cost_tier):
   *   "full"            — TR: producer-gap model (taxonomy + tax_rates + wholesale market + TÜİK).
   *   "inflation_only"  — countries without detailed data: computed only as an "inflation
   *                       premium" from general inflation (CPI/GENEL YoY). If no CPI data is
   *                       available, hidden cost is not computed (no_data) — it does NOT fall
   *                       back to a fixed 35% rate (no fabrication).
   * Defaults to "full" when not provided (preserves legacy TR behavior).
   */
  hiddenCostTier?: "full" | "inflation_only";
}

/**
 * Economic index multipliers.
 * Value: (1 + annual_change/100)
 * E.g.: labor up 40.3% → labor = 1.403
 * Missing values default to 1.0 (neutral).
 */
export interface EconomicIndexMultipliers {
  /** PPI/TARIM → raw material cost multiplier (producer_gap) */
  raw_material?: number;
  /** LABOR/TARIM_DISI_NOMINAL → labor multiplier (producer_gap) */
  labor?: number;
  /** RENT/TUIK_GERCEK → rent multiplier (producer_gap) */
  rent?: number;
  /** FUEL/ENERJI_TRENDYIL → energy multiplier (producer_gap) */
  energy?: number;
  /** CPI/GENEL → general CPI multiplier (fallback + service labor proxy) */
  other?: number;
  /** CPI-11: Restaurants and Hotels CPI — food_delivery, hospitality_lodging (market_benchmark) */
  cpi_11?: number;
  /** CPI-07: Transport CPI — travel_ticket (market_benchmark) */
  cpi_07?: number;
  /** CPI-08: Communication CPI — services_digital (market_benchmark) */
  cpi_08?: number;
  /** PPI-C: Manufacturing PPI — for the fallback average calculation */
  ppi_c?: number;
}

// ─────────────────────────────────────────────
// Helper: category mapping
// ─────────────────────────────────────────────

/**
 * Maps a receipt category name (internal code OR rich display name) to one of
 * 12 internal categories. Keyword (substring) based: matches both codes like
 * "gıda"/"grocery" and taxonomy display names like "İçecekler", "Bakliyat & Tahıllar",
 * "Temizlik & Deterjan". Turkish characters are normalized (ı/i, ş/s, ...).
 * Order matters: more specific mappings come first.
 */
function toInternalCategory(
  categoryLvl1: string | null | undefined,
  receiptCategory?: string
): string {
  const raw = (categoryLvl1 ?? receiptCategory ?? "")
    .toLowerCase()
    .replace(/̇/g, "")  // Turkish İ → "i̇" combining dot above; strip it
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .trim();
  if (!raw) return "other";

  // [keywords, internal category] — first match wins.
  const rules: [string[], string][] = [
    // Pharmacy (medicine/OTC). producer_gap; factor sourced from production_cost_weights['pharmacy']
    // (based on Decision 11031's official wholesaler+pharmacist margin). BEFORE healthcare: pharmacy
    // is not healthcare, it's a separate drug supply chain. Same priority as cost-layer-display.
    [["pharmacy", "drug store", "drugstore", "eczane", "ecza"], "pharmacy"],
    // Healthcare service (private hospital/clinic/polyclinic/dental/laboratory). producer_gap;
    // factor sourced from production_cost_weights['healthcare'] (based on MLP Q1'26 gross margin).
    // Must come BEFORE "hizmet" (service), otherwise "saglik hizmeti" falls through to other.
    // Keywords are given as Turkish suffix-resistant ROOTS: "klini" → klinik/kliniği/
    // poliklinik; "sagli" → sağlık/sağlığı (ğ normalizes to g, so "klinik"/"saglik" would not have matched).
    [["healthcare", "sagli", "hastane", "hospital", "klini", "clinic", "tip merkezi",
      "dental", "dis hekim", "laboratuvar", "laboratory", "tibbi", "medical", "muayene"], "healthcare"],
    [["alkol", "alcohol", "tutun", "tobacco", "sigara", "hizmet & diger", "hizmet", "diger"], "other"],
    [["elektronik", "electronic", "telefon", "bilgisayar", "beyaz esya", "teknoloji"], "electronics"],
    [["kozmetik", "kisisel bakim", "bakim", "beauty", "parfum", "makyaj"], "beauty_personal_care"],
    [["giyim", "tekstil", "apparel", "fashion", "moda", "ayakkabi", "konfeksiyon"], "apparel_fashion"],
    [["akaryakit", "yakit", "benzin", "motorin", "fuel", "petrol", "lpg", "istasyon"], "fuel"],
    [["elektrik", "dogalgaz", "fatura", "utilities", "abonelik fatura"], "utilities"],
    [["seyahat", "bilet", "ucak", "otobus", "travel", "ulasim", "ulastirma"], "travel_ticket"],
    [["konaklama", "otel", "hotel", "pansiyon"], "hospitality_lodging"],
    [["dijital", "digital", "yazilim", "abonelik", "uygulama", "oyun"], "services_digital"],
    [["restoran", "restaurant", "yemek", "kafe", "cafe", "lokanta", "fast food"], "food_delivery"],
    [["mobilya", "ev & yasam", "ev &", "ev/yasam", "yasam", "home", "mutfak gereç", "zucaciye"], "home_living"],
    // groceries_fmcg: food + all market sub-categories + cleaning (fast-moving consumer goods)
    [["gida", "grocery", "groceries", "fmcg", "supermarket", "market",
      "icecek", "sekerleme", "cikolata", "atistirmalik", "cips",
      "sut", "yumurta", "meyve", "sebze", "bakliyat", "tahil",
      "et &", "balik", "tavuk", "hazir gida", "konserve",
      "ekmek", "unlu", "yag", "baharat", "sos", "kahvalti",
      "temizlik", "deterjan", "kagit", "bebek", "ev bakim"], "groceries_fmcg"],
  ];

  for (const [keys, cat] of rules) {
    if (keys.some((k) => raw.includes(k))) return cat;
  }
  return "other";
}

/**
 * Converts a benchmark_series code to the corresponding multiplier in EconomicIndexMultipliers.
 * "11" → cpi_11, "07" → cpi_07, "08" → cpi_08, other → other (general CPI fallback)
 */
function getBenchmarkMultiplier(
  benchmarkSeries: string | null | undefined,
  multipliers: EconomicIndexMultipliers
): number {
  if (!benchmarkSeries) return multipliers.other ?? 1.0;
  switch (benchmarkSeries) {
    case "11": return multipliers.cpi_11 ?? multipliers.other ?? 1.0;
    case "07": return multipliers.cpi_07 ?? multipliers.other ?? 1.0;
    case "08": return multipliers.cpi_08 ?? multipliers.other ?? 1.0;
    default:   return multipliers.other ?? 1.0;
  }
}

// ─────────────────────────────────────────────
// Main calculation: computeLineHiddenCosts
// ─────────────────────────────────────────────

/**
 * Computes ReferencePrice and HiddenCost for each observation.
 * The model type (producer_gap | market_benchmark | fallback) is determined from weights.model_type.
 */
export function computeLineHiddenCosts(input: ComputeLineHiddenCostInput): {
  results: LineHiddenCostResult[];
  totalHiddenCanonical: number;
} {
  const {
    payload,
    country,
    fallbackHiddenRate,
    weightsByCategory = {},
    economicMultipliers: economicMultipliersGlobal,
    economicYoY,
    tuikPrices,
    taxonomyByName,
    halPrices,
    hiddenCostTier = "full",
  } = input;

  const receiptCategory = payload.merchant?.category_lvl1 ?? undefined;
  // Embedded tax (excise/TRT) is applied only in countries with a defined excise model.
  // Otherwise TR excise rates would leak into a US/IN receipt. In inflation_only countries
  // without an excise model, embeddedTax = 0, commercialBase = lineTotal.
  const applyEmbeddedTax = countryHasExciseModel(country);
  const results: LineHiddenCostResult[] = [];

  for (const obs of payload.observations) {
    const lineTotal = obs.line_total_gross ?? 0;

    if (lineTotal <= 0) {
      results.push({
        observation: obs,
        reference_price: 0,
        hidden_cost_line: 0,
        calc_method: "fallback_rate",
        model_type: "fallback",
      });
      continue;
    }

    // Non-purchase line (insurance coverage, wire transfer, transfer) → NO hidden cost.
    if (isNonPurchaseLine(obs.canonical_name || obs.raw_name)) {
      results.push({
        observation: obs,
        reference_price: lineTotal,
        hidden_cost_line: 0,
        calc_method: "non_purchase",
        model_type: "fallback",
      });
      continue;
    }

    const internalCat = toInternalCategory(obs.category_lvl1, receiptCategory);
    const weights = weightsByCategory[internalCat];
    const modelType: HiddenCostModelType = weights?.model_type ?? "fallback";

    // Category-based multipliers: when a YoY map is provided, each line derives its
    // multiplier from its own category's series (categorySeriesMap); otherwise falls
    // back to the global one. This rewiring lets the model bodies below run unchanged.
    const economicMultipliers: EconomicIndexMultipliers | undefined =
      economicYoY && economicYoY.size > 0
        ? multipliersForCategory(internalCat, economicYoY)
        : economicMultipliersGlobal;

    // Embedded taxes (excise + TRT): go to the state, not the producer → always hidden.
    // The reference (producer price) is computed on a tax-EXCLUDED commercial base; since
    // hidden = lineTotal − reference, the tax is automatically included in the hidden amount.
    // For an iPhone, the 50% excise + TRT is captured here (category cost-composition alone missed this).
    const taxName = obs.canonical_name || obs.raw_name || "";
    const taxCat = toHiddenCategory(taxName, obs.category_lvl1);
    const taxComp = computeLineComposition(taxCat, lineTotal, {
      quantity: obs.quantity, unitType: obs.unit_type, name: taxName,
    });
    const embeddedTax = applyEmbeddedTax
      ? Math.min(lineTotal * 0.85, taxComp.components.otv + taxComp.components.trt)
      : 0;
    const commercialBase = Math.max(0, lineTotal - embeddedTax);

    let reference: number;
    let calc_method: LineHiddenCostResult["calc_method"];
    let tuik_match: LineHiddenCostResult["tuik_match"] | undefined;
    let taxonomy_match: LineHiddenCostResult["taxonomy_match"] | undefined;

    // ── inflation_only tier: no detailed data → general inflation premium ─────
    // Detailed producer-gap data (taxonomy/wholesale market/TÜİK/commercial multiple) exists
    // only for TR. In other countries, hidden cost = the share of the price coming from
    // general inflation (CPI/GENEL YoY): reference = commercialBase / annual CPI multiplier,
    // hidden = paid − reference. If no CPI data is available it is not computed (no_data) —
    // it does NOT fall back to a fixed 35% rate (per the product decision, §3).
    // Short-circuits BEFORE the TR-specific special cases (wholesale market/fuel excise/category_kat/TÜİK).
    if (hiddenCostTier === "inflation_only") {
      const cpiGenelYoY = economicMultipliers?.other;
      if (cpiGenelYoY && cpiGenelYoY > 1) {
        reference = commercialBase / cpiGenelYoY;
        const hidden = Math.max(0, lineTotal - reference);
        results.push({
          observation: obs,
          reference_price: Math.round(reference * 100) / 100,
          hidden_cost_line: Math.round(hidden * 100) / 100,
          calc_method: "inflation_premium",
          model_type: "fallback",
        });
      } else {
        results.push({
          observation: obs,
          reference_price: lineTotal,
          hidden_cost_line: 0,
          calc_method: "no_data",
          model_type: "fallback",
        });
      }
      continue;
    }

    // ── Priority 0: Fresh produce → current Izmir wholesale-market price (producer reference) ──
    // Instead of deriving production cost from an index, fresh vegetables/fruit have a real
    // wholesale price (Izmir Metropolitan Municipality open data). reference = wholesale_unit × kg;
    // hidden = paid − reference. This captures the actual gap for fresh produce (not a generic 20%).
    if (halPrices && halPrices.size > 0 && taxCat === "fresh_produce") {
      const hn = taxName.toLowerCase()
        .replace(/̇/g, "").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
        .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");
      let hal: { avg: number; unit: string } | undefined;
      for (const [token, v] of halPrices) { if (token.length >= 3 && hn.includes(token)) { hal = v; break; } }
      const qty = obs.quantity && obs.quantity > 0 ? obs.quantity : 1;
      const ut = (obs.unit_type ?? "").toLowerCase();
      const unitOk = hal ? (hal.unit === "kg" ? !/adet|piece|ad\b/.test(ut) : (/adet|piece|ad/.test(ut) || !ut)) : false;
      if (hal && unitOk) {
        const halRef = hal.avg * qty;
        if (halRef > 0 && halRef < lineTotal) {
          reference = halRef;
          calc_method = "izmir_hal";
          const hidden = Math.max(0, lineTotal - reference);
          results.push({
            observation: obs,
            reference_price: Math.round(reference * 100) / 100,
            hidden_cost_line: Math.round(hidden * 100) / 100,
            calc_method, model_type: modelType,
          });
          continue;
        }
      }
    }

    // ── Priority 0b: Fuel → fixed excise + EPDK margin (NOT the TÜİK average) ──
    // Producer = refinery. Hidden = fixed excise (liter × rate) + distributor/dealer margin (~2.4% EPDK).
    if (taxCat === "fuel" && embeddedTax > 0) {
      const stationMargin = commercialBase * 0.024;
      const hidden = Math.min(lineTotal * 0.6, Math.round((embeddedTax + stationMargin) * 100) / 100);
      results.push({
        observation: obs,
        reference_price: Math.round((lineTotal - hidden) * 100) / 100,
        hidden_cost_line: hidden,
        calc_method: "fuel_otv", model_type: modelType,
      });
      continue;
    }

    // ── Priority 0c: Category-based REAL commercial multiple (KAP/TZOB source registry) ──
    // Real producer×retail multiple based on the fine category (toHiddenCategory). INDEPENDENT of the
    // coarse modelType — also catches items like meat_fish/dairy that fall into "other" at the coarse level.
    // Taxes are handled separately in embeddedTax.
    {
      const ck = commercialKatFor(taxCat);
      if (ck && ck.kat > 1) {
        reference = commercialBase / ck.kat;
        const hidden = Math.max(0, lineTotal - reference);
        results.push({
          observation: obs,
          reference_price: Math.round(reference * 100) / 100,
          hidden_cost_line: Math.round(hidden * 100) / 100,
          calc_method: "category_kat", model_type: modelType,
        });
        continue;
      }
    }

    // ── Path 0: TÜİK official average price (excludes high-tax categories) ────
    // For tax-heavy products (fuel/cigarettes), the TÜİK retail average is not a valid
    // reference; the excise-based calculation wins instead. TÜİK average is used only for low-tax products.
    if (tuikPrices && tuikPrices.size > 0 && embeddedTax < lineTotal * 0.05) {
      const { buildSearchKey } = require("@/lib/mining/tuikReferencePrice") as typeof import("@/lib/mining/tuikReferencePrice");
      const searchKey = buildSearchKey(obs.canonical_name || obs.raw_name, obs.unit_type ?? undefined);
      const tuikResult = tuikPrices.get(searchKey);

      if (tuikResult) {
        const qty = obs.quantity && obs.quantity > 0 ? obs.quantity : 1;
        const tuikLineRef = tuikResult.avg_price_tl * qty;
        if (tuikLineRef > 0 && tuikLineRef <= lineTotal * 3) {
          reference = tuikLineRef;
          calc_method = "tuik_official";
          tuik_match = {
            canonical_key: tuikResult.canonical_key,
            tuik_name:     tuikResult.tuik_name,
            avg_price_tl:  tuikResult.avg_price_tl,
            match_type:    tuikResult.match_type,
          };
          const hidden = Math.max(0, lineTotal - reference);
          results.push({
            observation: obs,
            reference_price: Math.round(reference * 100) / 100,
            hidden_cost_line: Math.round(hidden * 100) / 100,
            calc_method,
            model_type: modelType,
            tuik_match,
          });
          continue;
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODEL BRANCH: if no TÜİK price was found, follow a different path per model type
    // ════════════════════════════════════════════════════════════════════════

    if (modelType === "producer_gap") {
      // ── PRODUCER GAP: Supply chain margin ────────────────────────────────
      //
      // Path 0.5: Product-based taxonomy (canonical_product_taxonomy)
      if (taxonomyByName && taxonomyByName.size > 0 && economicMultipliers) {
        const productKey = (obs.canonical_name || obs.raw_name || "").toLowerCase().trim();
        const taxRow = productKey ? taxonomyByName.get(productKey) : undefined;
        const guardedCategory = detectGuardedProductCategory(`${obs.raw_name} ${obs.canonical_name}`);

        if (taxRow && !guardedCategory) {
          const rm = economicMultipliers.raw_material ?? 1.0;
          const lb = taxRow.labor_type === "service"
            ? (economicMultipliers.cpi_11 ?? economicMultipliers.other ?? 1.0)
            : (economicMultipliers.labor ?? 1.0);
          const rn = economicMultipliers.rent   ?? 1.0;
          const en = economicMultipliers.energy ?? 1.0;
          const ot = economicMultipliers.other  ?? 1.0;

          const rmW = taxRow.raw_material_pct / 100;
          const lbW = taxRow.labor_pct        / 100;
          const rnW = taxRow.rent_pct         / 100;
          const enW = taxRow.energy_pct       / 100;
          const otW = taxRow.other_pct        / 100;

          const costMultiplier = rmW * rm + lbW * lb + rnW * rn + enW * en + otW * ot;
          const profitFactor   = 1 + taxRow.profit_margin / 100;

          if (costMultiplier > 0) {
            reference = commercialBase /(costMultiplier * profitFactor);
            calc_method = "taxonomy_weighted";
            taxonomy_match = {
              canonical_name: taxRow.canonical_name,
              category_lvl2:  taxRow.category_lvl2 ?? "",
              labor_type:     taxRow.labor_type,
            };
            const hidden = Math.max(0, lineTotal - reference);
            results.push({
              observation: obs,
              reference_price:  Math.round(reference * 100) / 100,
              hidden_cost_line: Math.round(hidden * 100) / 100,
              calc_method,
              model_type: modelType,
              taxonomy_match,
            });
            continue;
          }
        }
      }

      // Path 1: Category-based weighted PPI index
      if (weights && weights.profit_margin_factor >= 1 && economicMultipliers) {
        const rm = economicMultipliers.raw_material ?? 1.0;
        const lb = economicMultipliers.labor        ?? 1.0;
        const rn = economicMultipliers.rent         ?? 1.0;
        const en = economicMultipliers.energy       ?? 1.0;
        const ot = economicMultipliers.other        ?? 1.0;

        const costMultiplier =
          weights.raw_material_pct * rm +
          weights.labor_pct        * lb +
          weights.rent_pct         * rn +
          weights.energy_pct       * en +
          weights.other_pct        * ot;

        // BUG fix: this used to be `commercialBase / costMultiplier` — since costMultiplier
        // is an inflation multiplier (~1.07), the hidden share came out as ~4% (sucuk/cheese/papia).
        // The correct producer→market multiple is profit_margin_factor. costMultiplier reflects
        // component inflation; it fine-tunes the multiple relative to the base factor.
        void costMultiplier;
        reference = commercialBase / weights.profit_margin_factor;
        calc_method = "weighted_index";
      } else if (weights && weights.profit_margin_factor >= 1) {
        // Path 2: No index, profit_margin_factor only
        reference = commercialBase /weights.profit_margin_factor;
        calc_method = "profit_margin_factor";
      } else {
        // Path 3: Fallback rate
        const rate = Math.max(0, Math.min(1, fallbackHiddenRate));
        reference = commercialBase /(1 + rate);
        calc_method = "fallback_rate";
      }

    } else if (modelType === "market_benchmark") {
      // ── MARKET BENCHMARK: Sector-average comparison (CPI-based) ─────────
      //
      // Path B: use the benchmark_series CPI index as the divisor
      // Interpretation: "Sector prices rose by CPI_benchmark_index this month;
      //                  if you had paid the average, it would be line_total / index."
      if (economicMultipliers && weights?.benchmark_series) {
        const benchmarkIdx = getBenchmarkMultiplier(weights.benchmark_series, economicMultipliers);
        if (benchmarkIdx > 1.0) {
          // If the benchmark index > 1, real inflation exists — the calculation is meaningful
          reference = commercialBase /benchmarkIdx;
          calc_method = "market_benchmark_cpi";
        } else if (weights.profit_margin_factor >= 1) {
          reference = commercialBase /weights.profit_margin_factor;
          calc_method = "profit_margin_factor";
        } else {
          const rate = Math.max(0, Math.min(1, fallbackHiddenRate));
          reference = commercialBase /(1 + rate);
          calc_method = "fallback_rate";
        }
      } else if (weights && weights.profit_margin_factor >= 1) {
        reference = commercialBase /weights.profit_margin_factor;
        calc_method = "profit_margin_factor";
      } else {
        const rate = Math.max(0, Math.min(1, fallbackHiddenRate));
        reference = commercialBase /(1 + rate);
        calc_method = "fallback_rate";
      }

    } else {
      // ── FALLBACK (other): avg(CPI GENEL + PPI C) ──────────────────────────
      if (economicMultipliers) {
        const cpiGenel = economicMultipliers.other   ?? 1.0;  // CPI GENEL
        const ppiC     = economicMultipliers.ppi_c   ?? economicMultipliers.labor ?? 1.0;  // PPI C
        const avgIdx   = (cpiGenel + ppiC) / 2;
        if (avgIdx > 1.0) {
          reference = commercialBase /avgIdx;
          calc_method = "fallback_avg_index";
        } else {
          const rate = Math.max(0, Math.min(1, fallbackHiddenRate));
          reference = commercialBase /(1 + rate);
          calc_method = "fallback_rate";
        }
      } else {
        const rate = Math.max(0, Math.min(1, fallbackHiddenRate));
        reference = commercialBase /(1 + rate);
        calc_method = "fallback_rate";
      }
    }

    const hidden = Math.max(0, lineTotal - reference);

    results.push({
      observation: obs,
      reference_price: Math.round(reference * 100) / 100,
      hidden_cost_line: Math.round(hidden * 100) / 100,
      calc_method,
      model_type: modelType,
      taxonomy_match,
    });
  }

  const totalHiddenCanonical =
    Math.round(results.reduce((s, r) => s + r.hidden_cost_line, 0) * 100) / 100;

  // Log summary
  const methodCounts = results.reduce((acc, r) => {
    const key = `${r.model_type ?? "?"}:${r.calc_method}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log("[computeLineHiddenCosts] Hesap yöntemi dağılımı:", methodCounts);

  return { results, totalHiddenCanonical };
}

// ─────────────────────────────────────────────
// Single-pass calculation: hidden cost from raw line items (upload + post-process share the same engine)
// ─────────────────────────────────────────────

/**
 * Computes hidden cost from raw (non-canonicalized) line items in a SINGLE pass — used
 * directly at upload time; since post-process calls the same engine, the result DOES NOT
 * CHANGE (single calculation). Fetches all inputs (weights, indices, wholesale market,
 * taxonomy, TÜİK) and runs computeLineHiddenCosts.
 * confidence: high (izmir_hal/fuel_otv/excise/category_kat-high), medium, low → completePaid/incompletePaid.
 */
// Global inputs (weights/indices/wholesale market) are the same for everyone → short-lived cache (for upload speed).
const _globalsCache = new Map<string, { at: number; data: [Record<string, ProductionCostWeightsRow>, Map<string, number>, EconomicIndexMultipliers | null, Map<string, { avg: number; unit: string }>] }>();
const _GLOBALS_TTL_MS = 30 * 60 * 1000; // 30 min

async function fetchHiddenCostGlobals(country: string, yearMonth: string) {
  const key = `${country}:${yearMonth}`;
  const hit = _globalsCache.get(key);
  if (hit && (Date.now() - hit.at) < _GLOBALS_TTL_MS) return hit.data;
  // Loads research-data overrides (tax_rates + commercial_margins) into memory;
  // the calculation functions read the snapshot synchronously. See lib/mining/hiddenCostOverrides.ts
  const { ensureHiddenCostOverrides } = await import("@/lib/mining/hiddenCostOverrides");
  await ensureHiddenCostOverrides(country);
  const data = await Promise.all([
    fetchProductionCostWeights(country), fetchEconomicYoYMap(country, yearMonth),
    fetchEconomicIndexMultipliers(country, yearMonth), fetchIzmirHalBulk(),
  ]) as [Record<string, ProductionCostWeightsRow>, Map<string, number>, EconomicIndexMultipliers | null, Map<string, { avg: number; unit: string }>];
  _globalsCache.set(key, { at: Date.now(), data });
  return data;
}

export async function computeReceiptHiddenFromLineItems(
  lineItems: Array<{ name: string; totalPrice?: number | null; category?: string | null; quantity?: number | null; unitType?: string | null }>,
  country: string,
  yearMonth: string,
  merchantCategory?: string | null
): Promise<{ totalHidden: number; completePaid: number; incompletePaid: number; methodCounts: Record<string, number> } | null> {
  const items = (lineItems ?? []).filter((it) => (it.totalPrice ?? 0) > 0);
  if (items.length === 0) return null;
  const { commercialKatFor, toHiddenCategory } = await import("@/lib/mining/hiddenCostComposition");
  const { getTuikReferencePriceBulk } = await import("@/lib/mining/tuikReferencePrice");

  const observations = items.map((it) => ({
    raw_name: it.name, canonical_name: it.name, category_lvl1: it.category ?? merchantCategory ?? null,
    unit_type: it.unitType ?? null, quantity: it.quantity != null ? Number(it.quantity) : null,
    line_total_gross: Number(it.totalPrice),
  }));
  const [weights, economicYoY, economicMultipliers, halPrices] = await fetchHiddenCostGlobals(country, yearMonth);
  const names = observations.map((o) => o.canonical_name);
  const [taxonomyByName, tuikPrices] = await Promise.all([
    fetchTaxonomyBulk(names),
    getTuikReferencePriceBulk(observations.map((o) => ({ name: o.canonical_name, unit: o.unit_type ?? undefined })), yearMonth),
  ]);
  const payload = { merchant: { category_lvl1: merchantCategory ?? null }, observations } as unknown as CanonicalPayload;
  const { getHiddenCostTier } = await import("./hidden-cost-tier");
  const hiddenCostTier = await getHiddenCostTier(country);
  const { results, totalHiddenCanonical } = computeLineHiddenCosts({
    payload, country, yearMonth, fallbackHiddenRate: 0.35,
    weightsByCategory: weights, economicMultipliers: economicMultipliers ?? undefined,
    economicYoY, tuikPrices, taxonomyByName, halPrices, hiddenCostTier,
  });

  let completePaid = 0, incompletePaid = 0;
  const methodCounts: Record<string, number> = {};
  for (const r of results) {
    const lt = r.observation.line_total_gross ?? 0;
    methodCounts[r.calc_method] = (methodCounts[r.calc_method] ?? 0) + 1;
    if (r.calc_method === "non_purchase") continue;
    const cat = toHiddenCategory(r.observation.canonical_name || r.observation.raw_name, r.observation.category_lvl1);
    let high = r.calc_method === "izmir_hal" || r.calc_method === "fuel_otv" || cat === "tobacco" || cat === "alcohol";
    if (r.calc_method === "category_kat") high = commercialKatFor(cat)?.conf === "high";
    if (high) completePaid += lt; else incompletePaid += lt;
  }
  return { totalHidden: totalHiddenCanonical, completePaid, incompletePaid, methodCounts };
}

// ─────────────────────────────────────────────
// DB fetch: fetchIzmirHalBulk — current Izmir wholesale-market prices (fresh-produce reference)
// ─────────────────────────────────────────────

/**
 * Fetches current Izmir wholesale-market prices (latest trade_date, source=IZMIR_HAL_OPENDATA).
 * canonical_key → {avg TL, unit}. Same canonical (e.g. pear varieties) → lowest average
 * (conservative: shrinks the hidden share). Producer/wholesale reference for fresh vegetables/fruit.
 */
export async function fetchIzmirHalBulk(): Promise<Map<string, { avg: number; unit: string }>> {
  const map = new Map<string, { avg: number; unit: string }>();
  const { getSql } = await import("@/lib/db/client");
  const sql = getSql();
  if (!sql) return map;
  try {
    const rows = (await sql`
      SELECT canonical_key, unit, price_avg_tl FROM hks_hal_prices
      WHERE source = 'IZMIR_HAL_OPENDATA' AND price_avg_tl > 0
        AND trade_date = (SELECT MAX(trade_date) FROM hks_hal_prices WHERE source = 'IZMIR_HAL_OPENDATA')
    `) as Array<{ canonical_key: string; unit: string; price_avg_tl: number }>;
    for (const r of rows) {
      const key = (r.canonical_key || "").toLowerCase().trim();
      if (key.length < 3) continue;
      const u = (r.unit || "").toUpperCase().startsWith("AD") ? "adet" : "kg";
      const prev = map.get(key);
      if (!prev || Number(r.price_avg_tl) < prev.avg) map.set(key, { avg: Number(r.price_avg_tl), unit: u });
    }
  } catch (e) {
    console.warn("[line-hidden-cost] fetchIzmirHalBulk failed:", (e as Error)?.message);
  }
  return map;
}

// ─────────────────────────────────────────────
// DB fetch: fetchProductionCostWeights
// ─────────────────────────────────────────────

export async function fetchProductionCostWeights(
  country: string
): Promise<Record<string, ProductionCostWeightsRow>> {
  const { getSql } = await import("@/lib/db/client");
  const sql = getSql();
  if (!sql) return {};

  try {
    const rows = await sql`
      SELECT category, raw_material_pct, labor_pct, rent_pct, energy_pct, other_pct,
             profit_margin_factor, model_type, benchmark_series
      FROM production_cost_weights
      WHERE country = ${country}
    `;
    const map: Record<string, ProductionCostWeightsRow> = {};
    for (const r of rows as Array<{
      category: string;
      raw_material_pct: number;
      labor_pct: number;
      rent_pct: number;
      energy_pct: number;
      other_pct: number;
      profit_margin_factor: number;
      model_type: string | null;
      benchmark_series: string | null;
    }>) {
      const rawModelType = r.model_type ?? "producer_gap";
      const modelType: HiddenCostModelType =
        rawModelType === "market_benchmark" ? "market_benchmark"
        : rawModelType === "fallback"       ? "fallback"
        : "producer_gap";

      map[r.category] = {
        raw_material_pct:    Number(r.raw_material_pct),
        labor_pct:           Number(r.labor_pct),
        rent_pct:            Number(r.rent_pct),
        energy_pct:          Number(r.energy_pct),
        other_pct:           Number(r.other_pct),
        profit_margin_factor: Number(r.profit_margin_factor),
        model_type:          modelType,
        benchmark_series:    r.benchmark_series ?? null,
      };
    }
    return map;
  } catch (e) {
    console.warn(
      "[line-hidden-cost] fetchProductionCostWeights failed:",
      (e as Error)?.message
    );
    return {};
  }
}

// ─────────────────────────────────────────────
// DB fetch: fetchEconomicIndexMultipliers
// ─────────────────────────────────────────────

/**
 * Fetches all component multipliers for the given country + month from the
 * economic_indices table.
 * Multiplier = 1 + (value / 100)
 *
 * Mapping:
 *   raw_material → PPI/TARIM or PPI/IMALAT_TREND
 *   labor        → LABOR/TARIM_DISI_NOMINAL or LABOR/ASGARI_UCRET
 *   rent         → RENT/TUIK_GERCEK or RENT/YKKE
 *   energy       → FUEL/ENERJI_TRENDYIL or FUEL/ELEKTRIK_PROXY
 *   other        → CPI/GENEL  (market_benchmark fallback + service labor proxy)
 *   cpi_11       → CPI/11    (restaurants/prepared food — food_delivery, hospitality)
 *   cpi_07       → CPI/07    (transport — travel_ticket)
 *   cpi_08       → CPI/08    (communication — services_digital)
 *   ppi_c        → PPI/C     (manufacturing PPI — for the fallback average)
 */
export async function fetchEconomicIndexMultipliers(
  country: string,
  yearMonth: string
): Promise<EconomicIndexMultipliers | null> {
  const { getSql } = await import("@/lib/db/client");
  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT index_type, series, year_month, value
      FROM economic_indices
      WHERE country = ${country}
        AND is_verified = TRUE
        AND (
          year_month = ${yearMonth}
          OR year_month = (
            SELECT MAX(e2.year_month)
            FROM economic_indices e2
            WHERE e2.country    = economic_indices.country
              AND e2.index_type = economic_indices.index_type
              AND e2.series     = economic_indices.series
              AND e2.is_verified = TRUE
          )
        )
      ORDER BY year_month DESC
    ` as Array<{ index_type: string; series: string; year_month: string; value: number }>;

    if (!rows.length) return null;

    function pick(indexType: string, ...seriesList: string[]): number {
      for (const series of seriesList) {
        const exact = rows.find(
          (r) =>
            r.index_type === indexType &&
            r.series === series &&
            r.year_month === yearMonth
        );
        if (exact) return 1 + Number(exact.value) / 100;

        const latest = rows.find(
          (r) => r.index_type === indexType && r.series === series
        );
        if (latest) return 1 + Number(latest.value) / 100;
      }
      return 1.0;
    }

    const multipliers: EconomicIndexMultipliers = {
      // producer_gap components
      raw_material: pick("PPI",   "TARIM", "IMALAT_TREND"),
      labor:        pick("LABOR", "TARIM_DISI_NOMINAL", "ASGARI_UCRET"),
      rent:         pick("RENT",  "TUIK_GERCEK", "YKKE"),
      energy:       pick("FUEL",  "ENERJI_TRENDYIL", "ELEKTRIK_PROXY"),
      // general + fallback
      other:        pick("CPI",   "GENEL"),
      ppi_c:        pick("PPI",   "C"),
      // market_benchmark sub-series
      cpi_11:       pick("CPI",   "11"),
      cpi_07:       pick("CPI",   "07"),
      cpi_08:       pick("CPI",   "08"),
    };

    return multipliers;
  } catch (e) {
    console.warn(
      "[line-hidden-cost] fetchEconomicIndexMultipliers failed:",
      (e as Error)?.message
    );
    return null;
  }
}

// ─────────────────────────────────────────────
// DB fetch: fetchEconomicYoYMap (category-based, ratio→YoY, bug-free)
// ─────────────────────────────────────────────

/**
 * Returns the ANNUAL (YoY) change factor for all CPI/PPI series for a given country:
 *   "INDEX_TYPE/series" → value[yearMonth] / value[yearMonth - 12 months]
 *
 * Series are stored in economic_indices as a 2025-01 = 1.0 normalized ratio; the YoY
 * factor is derived from that ratio (e.g. PPI/C 2025-05=1.092, 2026-05=1.428 → 1.308 = +30.8%).
 * This replaces the old manually-entered YoY percentage series (TARIM, etc.) and allows
 * current, category-based series selection. If 12 months back is unavailable, that series
 * is skipped (neutral 1.0).
 */
export async function fetchEconomicYoYMap(
  country: string,
  yearMonth: string
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const { getSql } = await import("@/lib/db/client");
  const sql = getSql();
  if (!sql) return out;

  try {
    // Fetches all CPI/PPI rows (≤ requested month); computes YoY PER SERIES.
    // Each series bases its calculation on its own MOST RECENT month (≤ requested) —
    // because series can be populated up to different months (e.g. for the US, the
    // legacy series='' goes up to 2025-12, while the new series='GENEL' goes up to
    // 2025-07). Using a single global MAX(year_month) would leave a series (GENEL)
    // not present in that month empty. Also resilient to month rollover: if the
    // requested month has not been published yet, the series' latest available month is used.
    const rows = (await sql`
      SELECT index_type, series, year_month, value
      FROM economic_indices
      WHERE country = ${country}
        AND index_type IN ('CPI', 'PPI')
        AND year_month <= ${yearMonth}
    `) as Array<{ index_type: string; series: string; year_month: string; value: number }>;

    // key "INDEX/series" → (year_month → value)
    const bySeries = new Map<string, Map<string, number>>();
    for (const r of rows) {
      const key = `${r.index_type}/${r.series}`;
      let m = bySeries.get(key);
      if (!m) { m = new Map(); bySeries.set(key, m); }
      m.set(r.year_month, Number(r.value));
    }

    for (const [key, months] of bySeries) {
      // This series' own most recent month (≤ requested).
      let effMonth: string | null = null;
      for (const ym of months.keys()) if (!effMonth || ym > effMonth) effMonth = ym;
      if (!effMonth) continue;
      const prevYM = shiftMonths(effMonth, -12);
      const c = months.get(effMonth);
      const p = months.get(prevYM);
      if (c && p && c > 0 && p > 0) out.set(key, c / p);
    }
  } catch (e) {
    console.warn("[line-hidden-cost] fetchEconomicYoYMap failed:", (e as Error)?.message);
  }
  return out;
}

/** Adds/subtracts delta months to/from a "YYYY-MM" month. */
function shiftMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/**
 * Produces EconomicIndexMultipliers from the YoY map for a given internal category.
 * raw_material and energy come from category-specific series (categorySeriesMap); labor=PPI C,
 * rent=CPI 04 (falls back to PPI D), other=CPI GENEL, benchmark series are CPI 11/07/08.
 * A missing series defaults to 1.0 (neutral). This replaces the old economy-wide, buggy pick().
 */
function multipliersForCategory(
  internalCat: string,
  yoy: Map<string, number>
): EconomicIndexMultipliers {
  const cfg = categorySeriesMap[internalCat as keyof typeof categorySeriesMap]
    ?? categorySeriesMap.other;
  const g = (k: string) => yoy.get(k) ?? 1.0;
  const rawKey = `${cfg.rawMaterial.indexType}/${cfg.rawMaterial.series}`;
  const enKey = `${cfg.energyOverhead.indexType}/${cfg.energyOverhead.series}`;
  return {
    raw_material: g(rawKey),
    labor:        g("PPI/C"),
    rent:         yoy.get("CPI/04") ?? g("PPI/D"),
    energy:       g(enKey),
    other:        g("CPI/GENEL"),
    ppi_c:        g("PPI/C"),
    cpi_11:       g("CPI/11"),
    cpi_07:       g("CPI/07"),
    cpi_08:       g("CPI/08"),
  };
}

// ─────────────────────────────────────────────
// DB fetch: fetchTaxonomyBulk
// ─────────────────────────────────────────────

/**
 * Bulk lookup from the canonical_product_taxonomy table for the given product names.
 * Returns a canonical_name → TaxonomyRow map.
 *
 * Used only for producer_gap categories (products in the taxonomy are physical goods).
 */
export async function fetchTaxonomyBulk(
  canonicalNames: (string | null | undefined)[]
): Promise<Map<string, TaxonomyRow>> {
  const map = new Map<string, TaxonomyRow>();
  const keys = canonicalNames
    .map((n) => (n ?? "").toLowerCase().trim())
    .filter(Boolean);
  if (!keys.length) return map;

  const { getSql } = await import("@/lib/db/client");
  const sql = getSql();
  if (!sql) return map;

  try {
    const rows = await sql`
      SELECT canonical_name, category_lvl1, category_lvl2,
             raw_material_pct, labor_pct, rent_pct, energy_pct, other_pct,
             labor_type, profit_margin
      FROM canonical_product_taxonomy
      WHERE canonical_name = ANY(${keys})
    `;
    for (const r of rows as TaxonomyRow[]) {
      map.set(r.canonical_name.toLowerCase().trim(), {
        canonical_name:   r.canonical_name,
        category_lvl1:    r.category_lvl1,
        category_lvl2:    r.category_lvl2,
        raw_material_pct: Number(r.raw_material_pct),
        labor_pct:        Number(r.labor_pct),
        rent_pct:         Number(r.rent_pct),
        energy_pct:       Number(r.energy_pct),
        other_pct:        Number(r.other_pct),
        labor_type:       r.labor_type,
        profit_margin:    Number(r.profit_margin),
      });
    }
    if (map.size > 0) {
      console.log(`[fetchTaxonomyBulk] ${map.size}/${keys.length} ürün eşleşti`);
    }
  } catch (e) {
    console.warn(
      "[line-hidden-cost] fetchTaxonomyBulk failed:",
      (e as Error)?.message
    );
  }
  return map;
}

// ─────────────────────────────────────────────
// DB fetch: fetchTaxonomyBulkV3 (canonical_product_cost_weights)
// ─────────────────────────────────────────────

/**
 * Bulk lookup from the canonical_product_cost_weights table for the given product names.
 * Returns a canonical_name → TaxonomyRow map.
 * Splits the category_path field on "." to produce backward-compat category_lvl1/lvl2.
 */
export async function fetchTaxonomyBulkV3(
  canonicalNames: (string | null | undefined)[]
): Promise<Map<string, TaxonomyRow>> {
  const map = new Map<string, TaxonomyRow>();
  const keys = canonicalNames
    .map((n) => (n ?? "").toLowerCase().trim())
    .filter(Boolean);
  if (!keys.length) return map;

  const { getSql } = await import("@/lib/db/client");
  const sql = getSql();
  if (!sql) return map;

  try {
    const rows = await sql`
      SELECT canonical_name, category_path,
             raw_material_pct, labor_pct, rent_pct, energy_pct, other_pct,
             labor_type, profit_margin
      FROM canonical_product_cost_weights
      WHERE canonical_name = ANY(${keys})
    `;
    for (const r of rows as Array<{
      canonical_name: string;
      category_path: string | null;
      raw_material_pct: number;
      labor_pct: number;
      rent_pct: number;
      energy_pct: number;
      other_pct: number;
      labor_type: string;
      profit_margin: number;
    }>) {
      const pathParts = (r.category_path ?? "").split(".");
      const lvl1 = pathParts[0] ?? "";
      const lvl2 = pathParts[1] ?? null;
      map.set(r.canonical_name.toLowerCase().trim(), {
        canonical_name: r.canonical_name,
        category_lvl1: lvl1,
        category_lvl2: lvl2,
        raw_material_pct: Number(r.raw_material_pct),
        labor_pct: Number(r.labor_pct),
        rent_pct: Number(r.rent_pct),
        energy_pct: Number(r.energy_pct),
        other_pct: Number(r.other_pct),
        labor_type: r.labor_type === "service" ? "service" : "manufacturing",
        profit_margin: Number(r.profit_margin),
      });
    }
    if (map.size > 0) {
      console.log(`[fetchTaxonomyBulkV3] ${map.size}/${keys.length} ürün eşleşti`);
    }
  } catch (e) {
    console.warn(
      "[line-hidden-cost] fetchTaxonomyBulkV3 failed:",
      (e as Error)?.message
    );
  }
  return map;
}

