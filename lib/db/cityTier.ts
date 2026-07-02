/**
 * City tier database functions
 * 
 * Provides functions to lookup and manage city tiers from database
 */

import { db } from "./client";
import { CityTier } from "@/lib/mining/contextFactors";
import { CountryCode } from "@/lib/mining/types";

interface CityTierRow {
  country: string;
  city_name: string;
  city_name_variants: string[] | null;
  tier: string;
}

/**
 * Get city tier from database
 * 
 * @param country - Country code
 * @param cityName - City name to lookup
 * @returns City tier or null if not found
 */
export async function getCityTierFromDB(
  country: CountryCode,
  cityName: string
): Promise<CityTier | null> {
  if (!cityName || !country) return null;

  try {
    const lowerCity = cityName.toLowerCase();
    
    // Try exact match first
    let query = `
      SELECT tier
      FROM city_tiers
      WHERE is_active = TRUE
        AND country = $1
        AND LOWER(city_name) = LOWER($2)
      LIMIT 1
    `;

    let result = await db.query<CityTierRow>(query, [country, cityName]);

    if (result.rows.length > 0) {
      return result.rows[0].tier as CityTier;
    }

    // Try variants match
    query = `
      SELECT tier
      FROM city_tiers
      WHERE is_active = TRUE
        AND country = $1
        AND (
          $2 = ANY(city_name_variants)
          OR EXISTS (
            SELECT 1 FROM unnest(city_name_variants) AS variant
            WHERE LOWER(variant) = LOWER($2)
          )
        )
      LIMIT 1
    `;

    result = await db.query<CityTierRow>(query, [country, lowerCity]);

    if (result.rows.length > 0) {
      return result.rows[0].tier as CityTier;
    }

    // Try partial match (contains)
    query = `
      SELECT tier
      FROM city_tiers
      WHERE is_active = TRUE
        AND country = $1
        AND (
          LOWER(city_name) LIKE '%' || LOWER($2) || '%'
          OR LOWER($2) LIKE '%' || LOWER(city_name) || '%'
        )
      ORDER BY LENGTH(city_name) DESC
      LIMIT 1
    `;

    result = await db.query<CityTierRow>(query, [country, lowerCity]);

    if (result.rows.length > 0) {
      return result.rows[0].tier as CityTier;
    }
  } catch (error) {
    console.error(`[getCityTierFromDB] Error:`, error);
  }

  return null;
}

/**
 * Add or update city tier
 * 
 * @param country - Country code
 * @param cityName - City name
 * @param tier - City tier (low, mid, high)
 * @param variants - Optional array of city name variants
 * @param source - Data source (default: 'MANUAL')
 */
export async function upsertCityTier(
  country: CountryCode,
  cityName: string,
  tier: CityTier,
  variants?: string[],
  source: string = "MANUAL"
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO city_tiers (country, city_name, city_name_variants, tier, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (country, city_name) 
       DO UPDATE SET 
         tier = EXCLUDED.tier,
         city_name_variants = EXCLUDED.city_name_variants,
         source = EXCLUDED.source,
         updated_at = CURRENT_TIMESTAMP`,
      [country, cityName, variants || null, tier, source]
    );
    console.log(`[upsertCityTier] Upserted tier for "${cityName}" in ${country}`);
  } catch (error) {
    console.error(`[upsertCityTier] Error:`, error);
    throw error;
  }
}
