/**
 * Base rate priors and bounds for TR and TH by category
 * These are starting points that get adjusted by trends and volatility
 */

export type Country = "TR" | "TH";
export type Category = 
  | "restaurant" | "cafe" | "grocery" | "convenience" 
  | "fuel" | "fashion" | "electronics" | "pharmacy" | "services" | "utilities" | "other";

export interface RateBounds {
  min: number;
  max: number;
}

export interface CategoryRates {
  importSystemBaseRate: number;
  retailHiddenBaseRate: number;
  importSystemBounds: RateBounds;
  retailHiddenBounds: RateBounds;
}

/**
 * Base rates by country and category
 * These represent industry-average priors
 */
export const baseRates: Record<Country, Record<Category, CategoryRates>> = {
  TR: {
    restaurant: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.20,
      importSystemBounds: { min: 0.05, max: 0.15 },
      retailHiddenBounds: { min: 0.12, max: 0.30 },
    },
    cafe: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.18,
      importSystemBounds: { min: 0.05, max: 0.15 },
      retailHiddenBounds: { min: 0.10, max: 0.28 },
    },
    grocery: {
      importSystemBaseRate: 0.06,
      retailHiddenBaseRate: 0.16,
      importSystemBounds: { min: 0.03, max: 0.12 },
      retailHiddenBounds: { min: 0.10, max: 0.24 },
    },
    convenience: {
      importSystemBaseRate: 0.07,
      retailHiddenBaseRate: 0.19,
      importSystemBounds: { min: 0.04, max: 0.13 },
      retailHiddenBounds: { min: 0.12, max: 0.28 },
    },
    fuel: {
      importSystemBaseRate: 0.04,
      retailHiddenBaseRate: 0.14,
      importSystemBounds: { min: 0.02, max: 0.08 },
      retailHiddenBounds: { min: 0.08, max: 0.20 },
    },
    fashion: {
      importSystemBaseRate: 0.12,
      retailHiddenBaseRate: 0.28,
      importSystemBounds: { min: 0.08, max: 0.18 },
      retailHiddenBounds: { min: 0.18, max: 0.38 },
    },
    electronics: {
      importSystemBaseRate: 0.14,
      retailHiddenBaseRate: 0.22,
      importSystemBounds: { min: 0.10, max: 0.20 },
      retailHiddenBounds: { min: 0.15, max: 0.32 },
    },
    pharmacy: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.18,
      importSystemBounds: { min: 0.05, max: 0.13 },
      retailHiddenBounds: { min: 0.12, max: 0.26 },
    },
    services: {
      importSystemBaseRate: 0.06,
      retailHiddenBaseRate: 0.20,
      importSystemBounds: { min: 0.03, max: 0.11 },
      retailHiddenBounds: { min: 0.12, max: 0.30 },
    },
    utilities: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.18,
      importSystemBounds: { min: 0.04, max: 0.14 },
      retailHiddenBounds: { min: 0.10, max: 0.26 },
    },
    other: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.18,
      importSystemBounds: { min: 0.04, max: 0.14 },
      retailHiddenBounds: { min: 0.10, max: 0.26 },
    },
  },
  TH: {
    restaurant: {
      importSystemBaseRate: 0.10,
      retailHiddenBaseRate: 0.22,
      importSystemBounds: { min: 0.06, max: 0.16 },
      retailHiddenBounds: { min: 0.14, max: 0.32 },
    },
    cafe: {
      importSystemBaseRate: 0.10,
      retailHiddenBaseRate: 0.20,
      importSystemBounds: { min: 0.06, max: 0.16 },
      retailHiddenBounds: { min: 0.12, max: 0.30 },
    },
    grocery: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.18,
      importSystemBounds: { min: 0.04, max: 0.14 },
      retailHiddenBounds: { min: 0.12, max: 0.26 },
    },
    convenience: {
      importSystemBaseRate: 0.09,
      retailHiddenBaseRate: 0.21,
      importSystemBounds: { min: 0.05, max: 0.15 },
      retailHiddenBounds: { min: 0.14, max: 0.30 },
    },
    fuel: {
      importSystemBaseRate: 0.05,
      retailHiddenBaseRate: 0.15,
      importSystemBounds: { min: 0.03, max: 0.09 },
      retailHiddenBounds: { min: 0.10, max: 0.22 },
    },
    fashion: {
      importSystemBaseRate: 0.13,
      retailHiddenBaseRate: 0.30,
      importSystemBounds: { min: 0.09, max: 0.19 },
      retailHiddenBounds: { min: 0.20, max: 0.40 },
    },
    electronics: {
      importSystemBaseRate: 0.15,
      retailHiddenBaseRate: 0.24,
      importSystemBounds: { min: 0.11, max: 0.21 },
      retailHiddenBounds: { min: 0.16, max: 0.34 },
    },
    pharmacy: {
      importSystemBaseRate: 0.10,
      retailHiddenBaseRate: 0.20,
      importSystemBounds: { min: 0.06, max: 0.15 },
      retailHiddenBounds: { min: 0.13, max: 0.28 },
    },
    services: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.22,
      importSystemBounds: { min: 0.04, max: 0.13 },
      retailHiddenBounds: { min: 0.14, max: 0.32 },
    },
    utilities: {
      importSystemBaseRate: 0.08,
      retailHiddenBaseRate: 0.18,
      importSystemBounds: { min: 0.04, max: 0.14 },
      retailHiddenBounds: { min: 0.10, max: 0.26 },
    },
    other: {
      importSystemBaseRate: 0.10,
      retailHiddenBaseRate: 0.20,
      importSystemBounds: { min: 0.06, max: 0.16 },
      retailHiddenBounds: { min: 0.12, max: 0.30 },
    },
  },
};

/**
 * Get base rates for a country and category
 */
export function getBaseRates(country: Country, category: Category): CategoryRates {
  return baseRates[country]?.[category] || baseRates[country]?.other || baseRates.TR.other;
}

/**
 * Clamp a value to bounds
 */
export function clampRate(value: number, bounds: RateBounds): number {
  return Math.max(bounds.min, Math.min(bounds.max, value));
}





