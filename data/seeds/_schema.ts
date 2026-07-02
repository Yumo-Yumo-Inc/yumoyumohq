/**
 * Public merchant seed file schema.
 *
 * Format: JSON dosyası, version controlled. Yeni country için yeni dosya:
 *   data/seeds/{country_code}-{topic}.json
 *
 * Validation: lib/canonical/seed/seed-loader.ts kullanır.
 */

export type SeedTier = "verified" | "candidate" | "unverified";

export type SeedMerchantKind =
  | "brand"
  | "legal_entity"
  | "franchise"
  | "subsidiary"
  | "location"
  | "rebrand_old"
  | "duplicate";

export interface SeedMerchant {
  /** Unique slug across all seed files (e.g. "tr-bim-001") */
  id: string;
  /** Short canonical brand name (no legal suffixes) */
  canonical_name: string;
  /** Multilingual display names — at least one entry required */
  display_names: Record<string, string>;
  /** Receipt-level category (cafe/restaurant/grocery/etc.) */
  category: string;
  /** Tax ID — if known. Used for VKN exact match (Layer 1). */
  vkn?: string | null;
  /** Default tier for newly imported entries */
  tier?: SeedTier;
  /** Default merchant_kind */
  merchant_kind?: SeedMerchantKind;
  /** Aliases (legal entity names, OCR variants) — written as merchant_patterns */
  aliases?: string[];
  /** Optional metadata — stored in DB as JSON for audit */
  tax_office?: string;
  logo_url?: string;
  website?: string;
  founded_year?: number;
  /** Editor notes — not exposed via API */
  notes?: string;
}

export interface SeedFile {
  /** ISO country code */
  country_code: string;
  /** Date-based version (e.g. "2026-05-08-001") for tracking */
  version: string;
  /** Last edited by username (audit) */
  last_edited_by?: string;
  /** Description of file purpose */
  description?: string;
  /** Default values applied to all merchants if absent */
  defaults?: {
    tier?: SeedTier;
    merchant_kind?: SeedMerchantKind;
  };
  /** Merchant entries */
  merchants: SeedMerchant[];
}
