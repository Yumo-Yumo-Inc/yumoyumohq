/**
 * Unified pricing types and enums
 * Used for country, currency, category, and pricing calculations
 */

// ISO 3166-1 alpha-2 country codes
export type CountryCode =
  | "TH" // Thailand
  | "MY" // Malaysia
  | "TR" // Turkey
  | "US" // United States
  | "DE" // Germany
  | "GB" // United Kingdom
  | "AE" // UAE
  | "SG" // Singapore
  | "FR" // France
  | "JP" // Japan
  | "RU" // Russia
  | "CN" // China
  | "ES" // Spain
  | string; // Allow other country codes

// ISO 4217 currency codes
export type CurrencyCode =
  | "THB" // Thai Baht
  | "MYR" // Malaysian Ringgit
  | "TRY" // Turkish Lira
  | "USD" // US Dollar
  | "EUR" // Euro
  | "GBP" // British Pound
  | "AED" // UAE Dirham
  | "SGD" // Singapore Dollar
  | "JPY" // Japanese Yen
  | "RUB" // Russian Ruble
  | "CNY" // Chinese Yuan
  | string; // Allow other currency codes

// Product/service categories
export type Category =
  | "cafe"
  | "restaurant"
  | "grocery"
  | "apparel"
  | "electronics"
  | "fuel"
  | "alcohol"
  | "tobacco"
  | "pharmacy"
  | "fashion"
  | "travel"
  | "hospitality_lodging"
  | "utilities"
  | "other";

// Sector classification
export type SectorClass =
  | "FOOD_BEVERAGE"
  | "RETAIL"
  | "SERVICES"
  | "ENERGY"
  | "HEALTHCARE"
  | "OTHER";

// Brand tier classification
export type BrandTier =
  | "PREMIUM"
  | "MID_RANGE"
  | "BUDGET"
  | "UNKNOWN";

/**
 * Pricing rate configuration per category
 */
export interface CategoryRates {
  importRate: number; // Import system cost rate (0-1)
  retailRate: number; // Retail hidden cost rate (0-1)
  isEstimate?: boolean; // Whether rates are estimated/fallback
}

/**
 * Get default rates for a category
 */
export function getDefaultCategoryRates(category: Category): CategoryRates {
  const rates: Record<Category, CategoryRates> = {
    cafe: { importRate: 0.1, retailRate: 0.2 },
    restaurant: { importRate: 0.1, retailRate: 0.22 },
    grocery: { importRate: 0.08, retailRate: 0.18 },
    apparel: { importRate: 0.12, retailRate: 0.25 },
    electronics: { importRate: 0.15, retailRate: 0.2 },
    fuel: { importRate: 0.05, retailRate: 0.15 },
    alcohol: { importRate: 0.2, retailRate: 0.3 },
    tobacco: { importRate: 0.25, retailRate: 0.35 },
    pharmacy: { importRate: 0.1, retailRate: 0.2 },
    fashion: { importRate: 0.12, retailRate: 0.25 },
    travel: { importRate: 0.12, retailRate: 0.2 },
    hospitality_lodging: { importRate: 0.15, retailRate: 0.25 },
    utilities: { importRate: 0.08, retailRate: 0.18, isEstimate: true },
    other: { importRate: 0.1, retailRate: 0.2, isEstimate: true },
  };

  return rates[category] || rates.other;
}






