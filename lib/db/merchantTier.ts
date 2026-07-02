/**
 * Merchant tier database functions
 * 
 * Provides functions to lookup and manage merchant tiers from database
 */

import { db } from "./client";
import { MerchantTier } from "@/lib/mining/contextFactors";
import { CountryCode } from "@/lib/mining/types";

interface MerchantTierRow {
  merchant_name_pattern: string;
  merchant_name_regex: string | null;
  country: string | null;
  tier: string;
  confidence: number;
}

/**
 * Get merchant tier from database
 * 
 * @param merchantName - Merchant name to lookup
 * @param country - Country code (optional, for country-specific matching)
 * @returns Merchant tier or null if not found
 */
export async function getMerchantTierFromDB(
  merchantName: string,
  country?: CountryCode
): Promise<MerchantTier | null> {
  if (!merchantName) return null;

  try {
    // Try an exact match with country first
    const query = `
      SELECT tier, confidence, merchant_name_regex
      FROM merchant_tiers
      WHERE is_active = TRUE
        AND (
          LOWER($1) LIKE '%' || LOWER(merchant_name_pattern) || '%'
          OR (merchant_name_regex IS NOT NULL AND $1 ~* merchant_name_regex)
        )
        AND (country = $2 OR country IS NULL)
      ORDER BY 
        CASE WHEN country = $2 THEN 1 ELSE 2 END, -- Country-specific first
        confidence DESC,
        LENGTH(merchant_name_pattern) DESC -- Longer patterns first (more specific)
      LIMIT 1
    `;

    const result = await db.query<MerchantTierRow>(
      query,
      [merchantName, country || null]
    );

    if (result.rows.length > 0) {
      const tier = result.rows[0].tier as MerchantTier;
      if (tier) {
        console.log(`[getMerchantTierFromDB] Found tier "${tier}" for "${merchantName}" (confidence: ${result.rows[0].confidence})`);
        return tier;
      }
    }
  } catch (error) {
    console.error(`[getMerchantTierFromDB] Error:`, error);
  }

  return null;
}

/**
 * Add or update merchant tier
 * 
 * @param merchantNamePattern - Pattern to match merchant name
 * @param tier - Merchant tier (discount, normal, premium)
 * @param country - Country code (optional, NULL = all countries)
 * @param regex - Optional regex pattern for complex matching
 * @param source - Data source (default: 'MANUAL')
 */
export async function upsertMerchantTier(
  merchantNamePattern: string,
  tier: MerchantTier,
  country?: CountryCode,
  regex?: string,
  source: string = "MANUAL"
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO merchant_tiers (merchant_name_pattern, merchant_name_regex, country, tier, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (merchant_name_pattern, country) 
       DO UPDATE SET 
         tier = EXCLUDED.tier,
         merchant_name_regex = EXCLUDED.merchant_name_regex,
         source = EXCLUDED.source,
         updated_at = CURRENT_TIMESTAMP`,
      [merchantNamePattern, regex || null, country || null, tier, source]
    );
    console.log(`[upsertMerchantTier] Upserted tier for "${merchantNamePattern}"`);
  } catch (error) {
    console.error(`[upsertMerchantTier] Error:`, error);
    throw error;
  }
}
