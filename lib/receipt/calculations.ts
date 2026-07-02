/**
 * Receipt calculations and pricing utilities
 */

import type { Category } from "@/lib/yumo/unified-pricing";
import { getDefaultCategoryRates, type CategoryRates } from "@/lib/yumo/unified-pricing";

/**
 * Map Google Places API types to our Category type
 * @param types Array of Google Places API types (e.g., ["restaurant", "food", "point_of_interest"])
 * @returns Category string
 */
export function mapPlacesTypesToCategory(types: string[]): Category {
  if (!types || types.length === 0) {
    return 'other';
  }

  const typesLower = types.map(t => t.toLowerCase());

  // Restaurant & Cafe categories (priority order matters)
  if (typesLower.some(t => ['restaurant', 'meal_delivery', 'meal_takeaway', 'food'].includes(t))) {
    return 'restaurant';
  }
  if (typesLower.some(t => ['cafe', 'bakery', 'coffee_shop'].includes(t))) {
    return 'cafe';
  }
  if (typesLower.some(t => ['bar', 'night_club', 'lounge'].includes(t))) {
    return 'restaurant'; // Bars are treated as restaurant
  }

  // Grocery
  if (typesLower.some(t => ['supermarket', 'grocery_or_supermarket', 'convenience_store', 'market'].includes(t))) {
    return 'grocery';
  }

  // Fashion & Apparel
  if (typesLower.some(t => ['clothing_store', 'shoe_store', 'jewelry_store', 'store'].includes(t))) {
    return 'fashion';
  }

  // Electronics
  if (typesLower.some(t => ['electronics_store', 'computer_store'].includes(t))) {
    return 'electronics';
  }

  // Fuel
  if (typesLower.some(t => ['gas_station', 'fuel'].includes(t))) {
    return 'fuel';
  }

  // Hospitality & Lodging (check before travel)
  if (typesLower.some(t => ['lodging', 'hotel', 'hostel', 'inn', 'motel', 'resort'].includes(t))) {
    return 'hospitality_lodging';
  }

  // Travel & Mobility (non-lodging travel)
  if (typesLower.some(t => ['airport', 'subway_station', 'train_station', 'bus_station', 'transit_station', 
                            'travel_agency'].includes(t))) {
    return 'travel';
  }

  // Pharmacy
  if (typesLower.some(t => ['pharmacy', 'drugstore'].includes(t))) {
    return 'pharmacy';
  }

  // Alcohol
  if (typesLower.some(t => ['liquor_store', 'beer_store', 'wine_store'].includes(t))) {
    return 'alcohol';
  }

  // Tobacco
  if (typesLower.some(t => ['tobacco_store'].includes(t))) {
    return 'tobacco';
  }

  // Utilities (electricity, water, gas) — gas_station stays fuel above
  if (typesLower.some(t => ['electric_company', 'water_works', 'utility', 'natural_gas_company'].includes(t))) {
    return 'utilities';
  }

  // Default
  return 'other';
}

/**
 * Get category rates for pricing calculations
 * This function wraps getDefaultCategoryRates for consistency
 */
export function getCategoryRates(category: Category | string | undefined): CategoryRates {
  if (!category || typeof category !== 'string') {
    return getDefaultCategoryRates('other');
  }
  
  // Ensure category matches the Category type
  const validCategories: Category[] = [
    'cafe',
    'restaurant',
    'grocery',
    'apparel',
    'electronics',
    'fuel',
    'alcohol',
    'tobacco',
    'pharmacy',
    'fashion',
    'travel',
    'hospitality_lodging',
    'utilities',
    'other',
  ];
  
  const normalizedCategory = category.toLowerCase() as Category;
  
  if (validCategories.includes(normalizedCategory)) {
    return getDefaultCategoryRates(normalizedCategory);
  }
  
  // Default to 'other' if category is not recognized
  return getDefaultCategoryRates('other');
}
