/**
 * Economics context mapping utility
 * Maps merchant channel to economics context for banner text selection
 */

export type MerchantChannel =
  | "marketplace"
  | "online_brand_store"
  | "online_retailer"
  | "supermarket_grocery"
  | "physical_retail"
  | "restaurant_cafe"
  | "wholesale"
  | "services_digital"
  | "other";

export type EconomicsContext = "ecommerce" | "retail" | "generic";

/**
 * Get economics context from merchant channel
 * 
 * @param channel - Merchant channel classification
 * @returns Economics context for banner text selection
 */
export function getEconomicsContext(channel: string): EconomicsContext {
  // Normalize channel to handle case variations
  const normalizedChannel = (channel || "other").toLowerCase() as MerchantChannel;

  // E-commerce channels
  if (
    normalizedChannel === "marketplace" ||
    normalizedChannel === "online_brand_store" ||
    normalizedChannel === "online_retailer"
  ) {
    return "ecommerce";
  }

  // Retail channels
  if (
    normalizedChannel === "supermarket_grocery" ||
    normalizedChannel === "physical_retail"
  ) {
    return "retail";
  }

  // Default to generic for all other channels
  return "generic";
}
