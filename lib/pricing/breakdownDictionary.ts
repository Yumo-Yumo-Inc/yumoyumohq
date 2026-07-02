/**
 * Category-based breakdown dictionary
 * Defines plausible sub-items for each super category with alpha priors
 */

import type { SuperCategory } from "./categoryMap";

export type LayerKey = "store_ops" | "supply_chain" | "retail_brand";

export interface BreakdownItemDef {
  layerKey: LayerKey;
  label: string;
  description: string;
  alphaBase: number; // Prior weight for Dirichlet sampling
  minShare?: number; // Soft minimum share (0-1)
  maxShare?: number; // Soft maximum share (0-1)
}

export type BreakdownDictionary = Record<SuperCategory, BreakdownItemDef[]>;

/**
 * Breakdown dictionary by super category
 */
export const breakdownDictionary: BreakdownDictionary = {
  food_service: [
    // Store & Operations
    { layerKey: "store_ops", label: "Shop Rent", description: "Store location costs", alphaBase: 3.0, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "store_ops", label: "Staff Costs", description: "Wages and salaries", alphaBase: 3.0, minShare: 0.20, maxShare: 0.35 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 1.5, minShare: 0.05, maxShare: 0.15 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.8, minShare: 0.02, maxShare: 0.08 },
    { layerKey: "store_ops", label: "Licensing & Compliance", description: "Operating permits and regulations", alphaBase: 0.6, minShare: 0.01, maxShare: 0.06 },
    // Supply Chain & Journey
    { layerKey: "supply_chain", label: "Ingredient Sourcing", description: "Local ingredient sourcing", alphaBase: 2.5, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "supply_chain", label: "Logistics & Cold Chain", description: "Transportation and storage", alphaBase: 1.2, minShare: 0.05, maxShare: 0.15 },
    // Retail & Brand Layer
    { layerKey: "retail_brand", label: "Restaurant Margin", description: "Restaurant profit margin", alphaBase: 2.2, minShare: 0.10, maxShare: 0.25 },
    { layerKey: "retail_brand", label: "Brand / Experience", description: "Branding and customer experience", alphaBase: 1.3, minShare: 0.05, maxShare: 0.15 },
  ],

  grocery_market: [
    // Store & Operations
    { layerKey: "store_ops", label: "Store Rent", description: "Store location costs", alphaBase: 2.5, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Staff Costs", description: "Wages and salaries", alphaBase: 2.5, minShare: 0.15, maxShare: 0.32 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 1.2, minShare: 0.04, maxShare: 0.12 },
    { layerKey: "store_ops", label: "Shrinkage/Waste", description: "Spoilage, theft, damage", alphaBase: 0.8, minShare: 0.02, maxShare: 0.08 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.01, maxShare: 0.06 },
    // Supply Chain & Journey
    { layerKey: "supply_chain", label: "Supplier Margin", description: "Wholesaler and supplier margins", alphaBase: 1.6, minShare: 0.10, maxShare: 0.22 },
    { layerKey: "supply_chain", label: "Distribution & Logistics", description: "Shipping and logistics", alphaBase: 1.8, minShare: 0.12, maxShare: 0.25 },
    { layerKey: "supply_chain", label: "Storage", description: "Warehouse and cold chain", alphaBase: 0.9, minShare: 0.04, maxShare: 0.12 },
    // Retail & Brand Layer
    { layerKey: "retail_brand", label: "Retail Margin", description: "Store's profit margin", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "retail_brand", label: "Brand / Marketing", description: "Branding and marketing costs", alphaBase: 0.8, minShare: 0.03, maxShare: 0.10 },
  ],

  convenience: [
    // Store & Operations
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 2.2, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Staff", description: "Wages and salaries", alphaBase: 2.0, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 1.0, minShare: 0.04, maxShare: 0.12 },
    { layerKey: "store_ops", label: "24/7 Ops Premium", description: "Round-the-clock operation costs", alphaBase: 1.2, minShare: 0.06, maxShare: 0.15 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.8, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Distribution", description: "Shipping and logistics", alphaBase: 1.8, minShare: 0.10, maxShare: 0.24 },
    { layerKey: "supply_chain", label: "Supplier Premium", description: "Convenience supplier margins", alphaBase: 1.2, minShare: 0.06, maxShare: 0.16 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Convenience Premium", description: "Convenience store markup", alphaBase: 2.2, minShare: 0.15, maxShare: 0.32 },
    { layerKey: "retail_brand", label: "Brand / Marketing", description: "Branding and marketing", alphaBase: 0.7, minShare: 0.03, maxShare: 0.10 },
  ],

  transport_fuel: [
    // Store & Operations
    { layerKey: "store_ops", label: "Station Ops", description: "Gas station operations", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Staff", description: "Wages and salaries", alphaBase: 1.5, minShare: 0.08, maxShare: 0.20 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating", alphaBase: 0.8, minShare: 0.03, maxShare: 0.10 },
    { layerKey: "store_ops", label: "Compliance", description: "Safety and regulatory compliance", alphaBase: 0.8, minShare: 0.03, maxShare: 0.10 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Refining/Procurement", description: "Fuel procurement and refining", alphaBase: 2.2, minShare: 0.18, maxShare: 0.35 },
    { layerKey: "supply_chain", label: "Distribution", description: "Transportation to station", alphaBase: 2.0, minShare: 0.15, maxShare: 0.30 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Retail Margin", description: "Station profit margin", alphaBase: 1.8, minShare: 0.12, maxShare: 0.25 },
    { layerKey: "retail_brand", label: "Brand Premium", description: "Brand and loyalty programs", alphaBase: 0.6, minShare: 0.02, maxShare: 0.08 },
  ],

  fashion_retail: [
    // Store & Operations
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 3.0, minShare: 0.18, maxShare: 0.35 },
    { layerKey: "store_ops", label: "Staff", description: "Wages and salaries", alphaBase: 2.2, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Returns/Handling", description: "Returns and inventory handling", alphaBase: 1.0, minShare: 0.04, maxShare: 0.12 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Manufacturing/Procurement", description: "Production and sourcing", alphaBase: 1.8, minShare: 0.10, maxShare: 0.24 },
    { layerKey: "supply_chain", label: "Shipping", description: "Transportation and logistics", alphaBase: 1.2, minShare: 0.06, maxShare: 0.16 },
    { layerKey: "supply_chain", label: "Warehousing", description: "Storage and inventory", alphaBase: 0.9, minShare: 0.04, maxShare: 0.12 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Retail Margin", description: "Store profit margin", alphaBase: 2.2, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "retail_brand", label: "Brand / Marketing", description: "Branding and marketing", alphaBase: 1.6, minShare: 0.10, maxShare: 0.22 },
  ],

  electronics: [
    // Store & Operations
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 2.5, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Staff", description: "Wages and salaries", alphaBase: 1.8, minShare: 0.10, maxShare: 0.24 },
    { layerKey: "store_ops", label: "Warranty/Returns", description: "Warranty and return handling", alphaBase: 1.3, minShare: 0.06, maxShare: 0.18 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Procurement", description: "Product sourcing", alphaBase: 2.2, minShare: 0.15, maxShare: 0.32 },
    { layerKey: "supply_chain", label: "Shipping", description: "Transportation and logistics", alphaBase: 1.6, minShare: 0.10, maxShare: 0.22 },
    { layerKey: "supply_chain", label: "Warehousing", description: "Storage and inventory", alphaBase: 1.0, minShare: 0.05, maxShare: 0.14 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Retail Margin", description: "Store profit margin", alphaBase: 1.6, minShare: 0.10, maxShare: 0.24 },
    { layerKey: "retail_brand", label: "Brand Premium", description: "Brand and marketing", alphaBase: 1.1, minShare: 0.06, maxShare: 0.16 },
  ],

  pharmacy_health: [
    // Store & Operations
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 2.2, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Staff/Pharmacist", description: "Licensed staff wages", alphaBase: 2.6, minShare: 0.18, maxShare: 0.35 },
    { layerKey: "store_ops", label: "Compliance", description: "Regulatory compliance", alphaBase: 1.2, minShare: 0.06, maxShare: 0.16 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 0.8, minShare: 0.03, maxShare: 0.10 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.6, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Supplier Margin", description: "Pharmaceutical supplier margins", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "supply_chain", label: "Distribution", description: "Shipping and logistics", alphaBase: 1.6, minShare: 0.10, maxShare: 0.22 },
    { layerKey: "supply_chain", label: "Storage", description: "Temperature-controlled storage", alphaBase: 1.1, minShare: 0.05, maxShare: 0.14 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Retail Margin", description: "Pharmacy profit margin", alphaBase: 1.4, minShare: 0.10, maxShare: 0.22 },
    { layerKey: "retail_brand", label: "Brand/Trust Premium", description: "Trust and brand value", alphaBase: 0.8, minShare: 0.04, maxShare: 0.12 },
  ],

  services: [
    // Store & Operations
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 2.4, minShare: 0.15, maxShare: 0.32 },
    { layerKey: "store_ops", label: "Labor", description: "Service provider wages", alphaBase: 3.0, minShare: 0.25, maxShare: 0.40 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 0.9, minShare: 0.04, maxShare: 0.12 },
    { layerKey: "store_ops", label: "Tools/Consumables", description: "Equipment and supplies", alphaBase: 1.1, minShare: 0.05, maxShare: 0.14 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.6, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Materials/Parts", description: "Raw materials and parts", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "supply_chain", label: "Logistics", description: "Shipping and delivery", alphaBase: 0.8, minShare: 0.03, maxShare: 0.10 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Service Margin", description: "Service profit margin", alphaBase: 2.2, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "retail_brand", label: "Brand / Experience", description: "Brand and customer experience", alphaBase: 1.0, minShare: 0.05, maxShare: 0.14 },
  ],

  hospitality_lodging: [
    // Store & Operations
    { layerKey: "store_ops", label: "Property Operations", description: "Hotel operations and maintenance", alphaBase: 2.5, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "store_ops", label: "Staff", description: "Hotel staff wages", alphaBase: 2.8, minShare: 0.20, maxShare: 0.35 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 1.5, minShare: 0.08, maxShare: 0.18 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Housekeeping & Supplies", description: "Cleaning and amenities", alphaBase: 1.8, minShare: 0.10, maxShare: 0.22 },
    { layerKey: "supply_chain", label: "Food & Beverage", description: "Restaurant and room service", alphaBase: 1.5, minShare: 0.08, maxShare: 0.18 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Hotel Margin", description: "Hotel profit margin", alphaBase: 2.2, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "retail_brand", label: "Brand / Experience", description: "Branding and customer experience", alphaBase: 1.3, minShare: 0.08, maxShare: 0.18 },
  ],

  travel_mobility: [
    // Store & Operations
    { layerKey: "store_ops", label: "Operations", description: "Transportation operations", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Staff", description: "Crew and staff wages", alphaBase: 2.2, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Fuel & Energy", description: "Fuel and energy costs", alphaBase: 2.5, minShare: 0.18, maxShare: 0.35 },
    { layerKey: "supply_chain", label: "Maintenance", description: "Vehicle/aircraft maintenance", alphaBase: 1.8, minShare: 0.10, maxShare: 0.22 },
    { layerKey: "supply_chain", label: "Infrastructure", description: "Airport/station fees", alphaBase: 1.5, minShare: 0.08, maxShare: 0.18 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Transport Margin", description: "Transportation profit margin", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "retail_brand", label: "Brand / Service", description: "Branding and service quality", alphaBase: 1.2, minShare: 0.06, maxShare: 0.16 },
  ],

  alcohol: [
    // Store & Operations — excise (ÖTV) is a SEPARATE layer; this schema splits
    // only the commercial remainder after excise has been carved out.
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 2.2, minShare: 0.10, maxShare: 0.26 },
    { layerKey: "store_ops", label: "Staff", description: "Wages and salaries", alphaBase: 1.8, minShare: 0.08, maxShare: 0.22 },
    { layerKey: "store_ops", label: "Licensing & Compliance", description: "Operating permits and regulations", alphaBase: 1.2, minShare: 0.05, maxShare: 0.16 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Supplier Margin", description: "Distributor and importer margins", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "supply_chain", label: "Distribution", description: "Transportation and logistics", alphaBase: 1.4, minShare: 0.08, maxShare: 0.20 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Retail Margin", description: "Store profit margin", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "retail_brand", label: "Brand Premium", description: "Brand and marketing", alphaBase: 1.2, minShare: 0.06, maxShare: 0.18 },
  ],

  tobacco: [
    // Store & Operations — excise (ÖTV) dominates the price and is a SEPARATE
    // layer; the commercial remainder split here is thin.
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 2.2, minShare: 0.12, maxShare: 0.30 },
    { layerKey: "store_ops", label: "Staff", description: "Wages and salaries", alphaBase: 1.8, minShare: 0.10, maxShare: 0.26 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.8, minShare: 0.03, maxShare: 0.10 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Manufacturing/Procurement", description: "Production and sourcing", alphaBase: 2.0, minShare: 0.12, maxShare: 0.30 },
    { layerKey: "supply_chain", label: "Distribution", description: "Transportation and logistics", alphaBase: 1.6, minShare: 0.10, maxShare: 0.24 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Retail Margin", description: "Store profit margin", alphaBase: 1.6, minShare: 0.10, maxShare: 0.24 },
    { layerKey: "retail_brand", label: "Brand Premium", description: "Brand and marketing", alphaBase: 1.0, minShare: 0.05, maxShare: 0.16 },
  ],

  specialty_retail: [
    // Stationery, bookstore, hardware/DIY, florist — a retail (not service) schema.
    // Store & Operations
    { layerKey: "store_ops", label: "Rent", description: "Store location costs", alphaBase: 2.6, minShare: 0.15, maxShare: 0.32 },
    { layerKey: "store_ops", label: "Staff", description: "Wages and salaries", alphaBase: 2.2, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 1.0, minShare: 0.04, maxShare: 0.12 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    // Supply Chain
    { layerKey: "supply_chain", label: "Procurement", description: "Product sourcing", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "supply_chain", label: "Distribution & Logistics", description: "Shipping and logistics", alphaBase: 1.3, minShare: 0.06, maxShare: 0.18 },
    // Retail & Brand
    { layerKey: "retail_brand", label: "Retail Margin", description: "Store profit margin", alphaBase: 2.2, minShare: 0.15, maxShare: 0.30 },
    { layerKey: "retail_brand", label: "Brand / Marketing", description: "Branding and marketing", alphaBase: 0.9, minShare: 0.04, maxShare: 0.12 },
  ],

  other: [
    // Generic breakdown
    { layerKey: "store_ops", label: "Store Rent", description: "Store location costs", alphaBase: 2.5, minShare: 0.12, maxShare: 0.30 },
    { layerKey: "store_ops", label: "Staff Costs", description: "Wages and salaries", alphaBase: 2.5, minShare: 0.15, maxShare: 0.32 },
    { layerKey: "store_ops", label: "Utilities", description: "Electricity, heating, water", alphaBase: 1.2, minShare: 0.04, maxShare: 0.12 },
    { layerKey: "store_ops", label: "Payment Fees", description: "Card processing fees", alphaBase: 0.7, minShare: 0.02, maxShare: 0.08 },
    { layerKey: "supply_chain", label: "Supply Chain", description: "Procurement and logistics", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "supply_chain", label: "Distribution", description: "Shipping and logistics", alphaBase: 1.5, minShare: 0.08, maxShare: 0.20 },
    { layerKey: "retail_brand", label: "Retail Margin", description: "Store profit margin", alphaBase: 2.0, minShare: 0.12, maxShare: 0.28 },
    { layerKey: "retail_brand", label: "Brand / Marketing", description: "Branding and marketing", alphaBase: 1.0, minShare: 0.05, maxShare: 0.14 },
  ],
};

/**
 * Get breakdown items for a super category
 */
export function getBreakdownItems(superCategory: SuperCategory): BreakdownItemDef[] {
  return breakdownDictionary[superCategory] || breakdownDictionary.other;
}





