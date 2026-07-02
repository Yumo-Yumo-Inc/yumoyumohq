/**
 * Map Google Places API categories to super categories
 * Used for selecting appropriate breakdown dictionary
 */

export type SuperCategory =
  | "food_service"      // restaurant, cafe
  | "grocery_market"    // grocery, supermarket
  | "convenience"       // convenience store
  | "transport_fuel"    // fuel, gas station
  | "travel_mobility"  // flight, train, bus, ferry
  | "hospitality_lodging" // hotel, hostel, resort, apartment
  | "fashion_retail"    // fashion, apparel
  | "electronics"       // electronics
  | "pharmacy_health"   // pharmacy, health
  | "alcohol"           // liquor store, off-licence (excise-heavy)
  | "tobacco"           // tobacconist (excise-heavy)
  | "specialty_retail"  // stationery, bookstore, hardware/DIY, florist
  | "services"          // salon, repair, etc.
  | "other";

/**
 * Map category string to super category
 */
export function mapToSuperCategory(category: string | undefined | null): SuperCategory {
  if (!category) return "other";

  const cat = category.toLowerCase().trim();

  // Safety: "other" should never map to fuel, even if it somehow contains fuel keywords
  if (cat === "other") {
    return "other";
  }

  // Alcohol (excise-heavy) — checked early so "store"/"market" branches don't steal it
  if (["alcohol", "liquor", "wine", "beer", "rakı", "raki", "tekel", "spirits"].some(k => cat.includes(k))) {
    return "alcohol";
  }

  // Tobacco (excise-heavy)
  if (["tobacco", "cigarette", "cigar", "sigara", "tütün", "tutun"].some(k => cat.includes(k))) {
    return "tobacco";
  }

  // Specialty retail (stationery, bookstore, hardware/DIY, florist) — before grocery so
  // "bookstore" (contains "store") and the services branch don't capture it.
  if (["specialty_retail", "stationery", "kırtasiye", "kirtasiye", "bookstore", "kitabevi",
       "nalbur", "hardware", "hırdavat", "hirdavat", "florist", "çiçek", "cicek"].some(k => cat.includes(k))) {
    return "specialty_retail";
  }

  // Food service
  if (["restaurant", "cafe", "food", "meal", "dining", "bakery", "coffee"].some(k => cat.includes(k))) {
    return "food_service";
  }

  // Grocery/Market
  if (["grocery", "supermarket", "market", "store", "mart"].some(k => cat.includes(k))) {
    return "grocery_market";
  }

  // Convenience
  if (["convenience", "7-eleven", "7eleven", "family", "mini"].some(k => cat.includes(k))) {
    return "convenience";
  }

  // Transport/Fuel - stricter detection
  // Only map to transport_fuel if category explicitly contains fuel-related keywords
  // Do NOT map based on generic words like "station" alone (could be train station, bus station, etc.)
  // IMPORTANT: This should only be called if category was already verified as fuel by isLikelyFuelReceipt
  const fuelKeywords = [
    "fuel",
    "gas station",      // Explicit gas station
    "gasoline",         // Explicit gasoline
    "petrol",           // Petrol/petroleum
    "pump",             // Fuel pump
  ];
  
  // Check for explicit fuel keywords
  if (fuelKeywords.some(k => cat.includes(k))) {
    return "transport_fuel";
  }
  
  // Also check for standalone "gas" but only if it's clearly fuel-related
  // (not "gas" as in natural gas utility, which would be "gas company" or "gas utility")
  if (cat === "gas" || cat.startsWith("gas ")) {
    return "transport_fuel";
  }

  // Hospitality & Lodging (Hotel/Hostel/Resort/Apartment) - check before travel_mobility
  if (["hospitality_lodging", "hotel", "hostel", "accommodation", "reservation", 
       "rezervasyon", "lodging", "inn", "motel", "resort", "apartment", "agoda", 
       "booking.com", "booking", "expedia", "airbnb"].some(k => cat.includes(k))) {
    return "hospitality_lodging";
  }

  // Travel & Mobility (Flight/Train/Bus/Ferry - non-lodging travel)
  if (["flight", "airline", "airport", "train", "railway", "bus", "ferry", "travel", 
       "trip.com", "ticket", "bilet", "uçak", "tren", "otobüs", "feribot"].some(k => cat.includes(k))) {
    return "travel_mobility";
  }

  // Fashion/Retail
  if (["fashion", "apparel", "clothing", "clothes", "shoe", "jewelry"].some(k => cat.includes(k))) {
    return "fashion_retail";
  }

  // Electronics
  if (["electronics", "electronic", "tech", "computer", "phone", "mobile"].some(k => cat.includes(k))) {
    return "electronics";
  }

  // Pharmacy/Health
  if (["pharmacy", "drug", "health", "medical", "clinic"].some(k => cat.includes(k))) {
    return "pharmacy_health";
  }

  // Services
  if (["service", "salon", "repair", "beauty", "spa", "barber"].some(k => cat.includes(k))) {
    return "services";
  }

  return "other";
}



