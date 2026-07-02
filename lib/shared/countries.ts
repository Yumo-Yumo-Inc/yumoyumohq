/**
 * Country list with currency information
 * Sorted alphabetically by country name
 */

export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: string; // ISO 4217
  symbol: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "AE", name: "United Arab Emirates", currency: "AED", symbol: "د.إ" },
  { code: "AR", name: "Argentina", currency: "ARS", symbol: "$" },
  { code: "BD", name: "Bangladesh", currency: "BDT", symbol: "৳" },
  { code: "CO", name: "Colombia", currency: "COP", symbol: "$" },
  { code: "KG", name: "Kyrgyzstan", currency: "KGS", symbol: "som" },
  { code: "KZ", name: "Kazakhstan", currency: "KZT", symbol: "₸" },
  { code: "LA", name: "Laos", currency: "LAK", symbol: "₭" },
  { code: "LK", name: "Sri Lanka", currency: "LKR", symbol: "Rs" },
  { code: "PE", name: "Peru", currency: "PEN", symbol: "S/" },
  { code: "PK", name: "Pakistan", currency: "PKR", symbol: "₨" },
  { code: "TJ", name: "Tajikistan", currency: "TJS", symbol: "SM" },
  { code: "TM", name: "Turkmenistan", currency: "TMT", symbol: "m" },
  { code: "UY", name: "Uruguay", currency: "UYU", symbol: "$U" },
  { code: "UZ", name: "Uzbekistan", currency: "UZS", symbol: "soʻm" },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "A$" },
  { code: "AT", name: "Austria", currency: "EUR", symbol: "€" },
  { code: "BE", name: "Belgium", currency: "EUR", symbol: "€" },
  { code: "BN", name: "Brunei", currency: "BND", symbol: "B$" },
  { code: "BR", name: "Brazil", currency: "BRL", symbol: "R$" },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "C$" },
  { code: "CL", name: "Chile", currency: "CLP", symbol: "$" },
  { code: "CN", name: "China", currency: "CNY", symbol: "¥" },
  { code: "CZ", name: "Czech Republic", currency: "CZK", symbol: "Kč" },
  { code: "DK", name: "Denmark", currency: "DKK", symbol: "kr" },
  { code: "EG", name: "Egypt", currency: "EGP", symbol: "£" },
  { code: "EE", name: "Estonia", currency: "EUR", symbol: "€" },
  { code: "FI", name: "Finland", currency: "EUR", symbol: "€" },
  { code: "FR", name: "France", currency: "EUR", symbol: "€" },
  { code: "DE", name: "Germany", currency: "EUR", symbol: "€" },
  { code: "GR", name: "Greece", currency: "EUR", symbol: "€" },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "HU", name: "Hungary", currency: "HUF", symbol: "Ft" },
  { code: "IN", name: "India", currency: "INR", symbol: "₹" },
  { code: "ID", name: "Indonesia", currency: "IDR", symbol: "Rp" },
  { code: "IE", name: "Ireland", currency: "EUR", symbol: "€" },
  { code: "IL", name: "Israel", currency: "ILS", symbol: "₪" },
  { code: "IT", name: "Italy", currency: "EUR", symbol: "€" },
  { code: "JP", name: "Japan", currency: "JPY", symbol: "¥" },
  { code: "KR", name: "South Korea", currency: "KRW", symbol: "₩" },
  { code: "MY", name: "Malaysia", currency: "MYR", symbol: "RM" },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "$" },
  { code: "NL", name: "Netherlands", currency: "EUR", symbol: "€" },
  { code: "NZ", name: "New Zealand", currency: "NZD", symbol: "NZ$" },
  { code: "NO", name: "Norway", currency: "NOK", symbol: "kr" },
  { code: "PH", name: "Philippines", currency: "PHP", symbol: "₱" },
  { code: "PL", name: "Poland", currency: "PLN", symbol: "zł" },
  { code: "PT", name: "Portugal", currency: "EUR", symbol: "€" },
  { code: "RO", name: "Romania", currency: "RON", symbol: "lei" },
  { code: "RU", name: "Russia", currency: "RUB", symbol: "₽" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", symbol: "﷼" },
  { code: "SG", name: "Singapore", currency: "SGD", symbol: "S$" },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R" },
  { code: "ES", name: "Spain", currency: "EUR", symbol: "€" },
  { code: "SE", name: "Sweden", currency: "SEK", symbol: "kr" },
  { code: "CH", name: "Switzerland", currency: "CHF", symbol: "CHF" },
  { code: "TW", name: "Taiwan", currency: "TWD", symbol: "NT$" },
  { code: "TH", name: "Thailand", currency: "THB", symbol: "฿" },
  { code: "TR", name: "Turkey", currency: "TRY", symbol: "₺" },
  { code: "US", name: "United States", currency: "USD", symbol: "$" },
  { code: "VN", name: "Vietnam", currency: "VND", symbol: "₫" },
];

/**
 * Countries the user can select (enabled) — regions where status='active' in
 * supported_countries and the hidden cost (TR producer-margin or the general
 * inflation premium) can be computed. Countries outside this set are not shown
 * in the selector; receipts are not accepted for those countries (consistent
 * with the existing country-match gate). Existing data is not deleted — only
 * new selection is disabled.
 *
 * Enabled regions (product decision, 2026-06-30): Turkey + North America + Europe
 * + South Asia + South America + Central Asia. Same set as supported_countries
 * (migration 096).
 */
export const ENABLED_COUNTRY_CODES: ReadonlySet<string> = new Set([
  "TR",
  // North America
  "US", "CA",
  // Europe
  "DE", "EE", "RO", "GB", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "GR",
  "PL", "CZ", "HU", "DK", "FI", "SE", "NO", "CH",
  // South Asia
  "IN", "PK", "BD", "LK",
  // South America
  "BR", "AR", "CL", "CO", "PE", "UY",
  // Central Asia
  "KZ", "UZ", "KG", "TJ", "TM",
  // Southeast Asia (added 2026-06-30)
  "TH", "VN", "MY", "ID", "PH", "SG", "LA", "BN",
]);

/**
 * Sentinel country code for "Other". Users in countries without completed
 * integration select this during registration: the receipt still uploads and
 * the country is detected from it, but no reward is issued and it cannot be
 * used on-chain. Not a real ISO code — stored only as the account country and
 * recognized at the reward gate.
 */
export const OTHER_COUNTRY_CODE = "OTHER";

/** Whether the account country is "Other" (no integration, no reward). */
export function isOtherCountry(code: string | null | undefined): boolean {
  return (code ?? "").trim().toUpperCase() === OTHER_COUNTRY_CODE;
}

/** Whether a country code is enabled (selectable) for users. */
export function isCountryEnabled(code: string | null | undefined): boolean {
  if (!code) return false;
  return ENABLED_COUNTRY_CODES.has(code.trim().toUpperCase());
}

/**
 * Enabled countries to show in selectors (sorted by name). Used for new
 * registration / onboarding / profile country change — in place of
 * getCountriesSorted().
 */
export function getEnabledCountries(): CountryInfo[] {
  return COUNTRIES.filter((c) => ENABLED_COUNTRY_CODES.has(c.code))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * For surfaces that edit an EXISTING selection, such as the profile: enabled
 * countries plus the user's current country if it is not enabled, so it still
 * appears in the list. This way an existing user in a paused country doesn't
 * see their country blank or wrong (data is preserved).
 */
export function getSelectableCountries(currentCode?: string | null): CountryInfo[] {
  const list = getEnabledCountries();
  const cur = currentCode?.trim().toUpperCase();
  if (cur && !ENABLED_COUNTRY_CODES.has(cur)) {
    const existing = getCountryByCode(cur);
    if (existing) return [existing, ...list];
  }
  return list;
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export function getCountryByName(name: string): CountryInfo | undefined {
  const normalized = name.trim().toLowerCase();
  return COUNTRIES.find((country) => country.name.toLowerCase() === normalized);
}

export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // "Other" sentinel — not a real ISO code, but a valid account country value.
  if (trimmed.toUpperCase() === OTHER_COUNTRY_CODE) return OTHER_COUNTRY_CODE;

  const byCode = getCountryByCode(trimmed);
  if (byCode) return byCode.code;

  const byName = getCountryByName(trimmed);
  if (byName) return byName.code;

  return null;
}

/**
 * Get countries sorted alphabetically by name
 */
export function getCountriesSorted(): CountryInfo[] {
  return [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
}





