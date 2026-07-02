/**
 * Canonical receipt payload type produced by Vision -> canonical pipeline.
 * Used for product-level hidden cost calculation in post-process.
 */

export type CanonicalUnitType = "adet" | "kg" | "g" | "l" | "ml" | "pack" | "set" | string | null;

export interface CanonicalMerchant {
  canonical_name: string;
  raw_name?: string;
  category_lvl1?: string;
  category_lvl2?: string;
  il?: string | null;
  ilce?: string | null;
  mahalle?: string | null;
  sube_kodu?: string | null;
  sube_adi?: string | null;
  address_raw?: string | null;
  last_update: string;
}

export interface CanonicalObservation {
  raw_name: string;
  canonical_name: string;
  brand: string | null;
  pack_size: string | null;
  category_lvl1: string | null;
  category_lvl2: string | null;
  unit_type: CanonicalUnitType;
  quantity: number;
  unit_price_gross: number | null;
  line_total_gross: number;
  discount_amount: number;
  vat_rate: number | null;
  last_price_update: string;
  confidence_score: number;
  extra_specs?: Record<string, unknown>;

  // v3 taxonomy enrichment (optional during incremental rollout)
  category_path?: string | null;
  display_name_tr?: string | null;
  attributes?: Record<string, unknown>;
  lifestyle_tags?: string[];
  consumption_occasions?: string[];
  allergens?: string[];
  price_tier?: string | null;
  canonical_id?: string | null;

  // Brand resolution (Faz B): verdict is the LLM's 3-state judgement, status is
  // the final classification persisted to receipt_line_items.brand_status.
  brand_verdict?: "BRAND" | "UNBRANDED" | "UNKNOWN" | null;
  brand_status?: "resolved" | "unbranded" | "needs_user" | "user_provided" | null;
}

export interface CanonicalPayload {
  receipt_file: string;
  date: string;
  currency: "TRY" | string;
  total_gross?: number;
  merchant: CanonicalMerchant;
  observations: CanonicalObservation[];
}
