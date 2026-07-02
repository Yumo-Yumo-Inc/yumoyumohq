/**
 * Merchant Places Cache database functions
 * 
 * Provides functions to cache and retrieve Google Places API results
 * to avoid repeated API calls for the same merchant
 */

import { db } from "./client";
import { CountryCode } from "@/lib/mining/types";

export interface MerchantPlaceCacheRow {
  merchant_name_normalized: string;
  merchant_name_original: string | null;
  place_id: string | null;
  price_level: number | null;
  country: string | null;
  place_name: string | null;
  place_types: string[] | null;
  domain: string | null;
  confidence: number;
  cached_at: Date;
  expires_at: Date | null;
}

/**
 * Get cached merchant place data
 * 
 * @param normalizedName - Normalized merchant name
 * @param country - Country code (optional)
 * @returns Cached data or null if not found or expired
 */
export async function getMerchantPlaceCache(
  normalizedName: string,
  country?: CountryCode
): Promise<MerchantPlaceCacheRow | null> {
  if (!normalizedName) return null;

  try {
    const query = `
      SELECT merchant_name_normalized, merchant_name_original, place_id, price_level,
             country, place_name, place_types, domain, confidence, cached_at, expires_at
      FROM merchant_places_cache
      WHERE merchant_name_normalized = $1
        AND (country = $2 OR country IS NULL)
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY 
        CASE WHEN country = $2 THEN 1 ELSE 2 END, -- Country-specific first
        cached_at DESC
      LIMIT 1
    `;

    const result = await db.query<MerchantPlaceCacheRow>(
      query,
      [normalizedName, country || null]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    console.error(`[getMerchantPlaceCache] Error:`, error);
  }

  return null;
}

/**
 * Cache merchant place data
 * 
 * @param normalizedName - Normalized merchant name
 * @param data - Place data to cache
 * @param expiresInDays - Cache expiration in days (default: 30)
 */
export async function setMerchantPlaceCache(
  normalizedName: string,
  data: {
    originalName?: string;
    placeId?: string;
    priceLevel?: number;
    country?: CountryCode;
    placeName?: string;
    placeTypes?: string[];
    domain?: string;
    confidence?: number;
  },
  expiresInDays: number = 30
): Promise<void> {
  if (!normalizedName) return;

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await db.query(
      `INSERT INTO merchant_places_cache 
       (merchant_name_normalized, merchant_name_original, place_id, price_level, 
        country, place_name, place_types, domain, confidence, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (merchant_name_normalized, country) 
       DO UPDATE SET 
         place_id = EXCLUDED.place_id,
         price_level = EXCLUDED.price_level,
         place_name = EXCLUDED.place_name,
         place_types = EXCLUDED.place_types,
         domain = EXCLUDED.domain,
         confidence = EXCLUDED.confidence,
         cached_at = CURRENT_TIMESTAMP,
         expires_at = EXCLUDED.expires_at`,
      [
        normalizedName,
        data.originalName || null,
        data.placeId || null,
        data.priceLevel !== undefined ? data.priceLevel : null,
        data.country || null,
        data.placeName || null,
        data.placeTypes || null,
        data.domain || null,
        data.confidence !== undefined ? data.confidence : 0.8,
        expiresAt,
      ]
    );
  } catch (error) {
    console.error(`[setMerchantPlaceCache] Error:`, error);
    // Don't throw - cache failure shouldn't break the flow
  }
}

/**
 * Clear expired cache entries
 * 
 * @returns Number of deleted entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const result = await db.query<{ count: number }>(
      `DELETE FROM merchant_places_cache 
       WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
       RETURNING id`
    );
    return result.rows.length;
  } catch (error) {
    console.error(`[clearExpiredCache] Error:`, error);
    return 0;
  }
}
