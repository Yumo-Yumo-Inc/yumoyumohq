/**
 * Channel-aware economics banner texts
 * Provides context-specific messaging for different merchant channels
 */

import type { EconomicsContext } from "./economics-context";

export interface EconomicsTexts {
  banner: string;
  tooltip: string;
}

/**
 * Get economics banner texts based on context
 * 
 * @param context - Economics context (ecommerce, retail, or generic)
 * @returns Banner and tooltip texts
 */
export function getEconomicsTexts(context: EconomicsContext): EconomicsTexts {
  if (context === "ecommerce") {
    return {
      banner:
        "For low-priced products, hidden system costs such as logistics and platform fees can exceed the product price. This is normal in modern e-commerce.",
      tooltip:
        "Logistics, platform commissions, payment processing and operational costs are mostly fixed while product prices vary. For low-priced items, these system costs can be higher than the product price itself. This is normal unit economics.",
    };
  }

  if (context === "retail") {
    return {
      banner:
        "For low-priced products, hidden system costs such as logistics, distribution and store operations can exceed the product's own value. This is common in modern retail.",
      tooltip:
        "Bringing a product to the shelf creates fixed system costs: wholesale margins, transport, warehousing and store operations. For very low-priced items, these costs can be higher than the product value itself. This is a normal effect of modern retail economics, especially with discounts and promotions.",
    };
  }

  // Generic fallback
  return {
    banner:
      "Hidden system costs (logistics, operations, tax) can be higher than the product value, especially for low-priced items.",
    tooltip:
      "System costs such as logistics, operations and tax are partly fixed and can exceed the value of very low-priced items. Values shown here are estimates for transparency, not accounting data.",
  };
}
