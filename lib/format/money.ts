/**
 * Canonical money formatter for Yumo.
 *
 * Currency is derived from the user's profile country (ISO-3166 alpha-2).
 * Falls back to USD when country is missing or unknown.
 *
 * Locale selection: the user's app locale (en/tr/ru/th/es/zh) drives number
 * formatting (decimal separators, digit grouping) — NOT the currency.
 * A Turkish-speaking user living in Germany sees "1.234,56 €" not "1.234,56 ₺".
 *
 * Two existing helpers in the repo were not sufficient:
 *   - lib/insights/format.ts          — hardcoded symbol table, locale fixed to en-US
 *   - components/app/currency-with-usd.tsx — inline, not exported
 *
 * This module replaces both for new code.
 */

import { getCountryByCode, type CountryInfo } from "@/lib/shared/countries";

/* ───────────────────────── Currency resolution ───────────────────────── */

const USD_FALLBACK: CountryInfo = {
  code: "US",
  name: "United States",
  currency: "USD",
  symbol: "$",
};

/** Returns the country's currency info, defaulting to USD when unknown. */
export function currencyForCountry(
  countryCode: string | null | undefined
): CountryInfo {
  if (!countryCode) return USD_FALLBACK;
  const info = getCountryByCode(countryCode);
  return info ?? USD_FALLBACK;
}

/* ───────────────────────── Locale → Intl tag ─────────────────────────── */

const LOCALE_TAG_MAP: Record<string, string> = {
  en: "en-US",
  tr: "tr-TR",
  ru: "ru-RU",
  th: "th-TH",
  es: "es-ES",
  zh: "zh-CN",
};

function intlLocaleTag(appLocale: string | undefined): string {
  if (!appLocale) return "en-US";
  return LOCALE_TAG_MAP[appLocale] ?? appLocale;
}

/* ───────────────────────── Currency normalization ────────────────────── */

/** Normalize known aliases that show up in OCR / user input. */
function normalizeCurrencyCode(currency: string | null | undefined): string {
  const normalized = (currency || "USD").trim().toUpperCase();
  if (normalized === "TL") return "TRY";
  if (normalized === "RM") return "MYR";
  return normalized || "USD";
}

/* ───────────────────────── Public API ────────────────────────────────── */

export interface FormatMoneyOptions {
  /** Number of fraction digits. Defaults: 0 for >= 1000, otherwise 2. */
  maximumFractionDigits?: number;
  /** Force a specific minimum. */
  minimumFractionDigits?: number;
  /** Render the symbol-only form ("$ 19", "₺ 19") instead of full currency style. */
  compact?: boolean;
}

/**
 * Format a money amount using `Intl.NumberFormat`.
 *
 * @param amount   Numeric amount
 * @param currency ISO 4217 code (USD, TRY, EUR, …)
 * @param appLocale User's app locale from useAppLocale() (en/tr/ru/th/es/zh)
 */
export function formatMoney(
  amount: number,
  currency: string,
  appLocale: string | undefined,
  options: FormatMoneyOptions = {}
): string {
  const tag = intlLocaleTag(appLocale);
  const code = normalizeCurrencyCode(currency);
  const max =
    options.maximumFractionDigits ?? (Math.abs(amount) >= 1000 ? 0 : 2);
  const min = options.minimumFractionDigits ?? 0;

  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency: code,
      maximumFractionDigits: max,
      minimumFractionDigits: min,
    }).format(amount);
  } catch {
    // Some currencies/locales may not be supported by the runtime;
    // fall back to "1.234 TRY"-style suffix.
    const numStr = amount.toLocaleString(tag, {
      maximumFractionDigits: max,
      minimumFractionDigits: min,
    });
    return `${numStr} ${code}`;
  }
}

/**
 * Format a money amount for the given user country directly.
 * Convenience wrapper — most call sites have country, not currency.
 */
export function formatMoneyForCountry(
  amount: number,
  countryCode: string | null | undefined,
  appLocale: string | undefined,
  options: FormatMoneyOptions = {}
): string {
  const { currency } = currencyForCountry(countryCode);
  return formatMoney(amount, currency, appLocale, options);
}

/**
 * Render just the currency symbol for the user's country.
 * Useful as a suffix in compact contexts (cards, hero rows).
 */
export function currencySymbolForCountry(
  countryCode: string | null | undefined
): string {
  return currencyForCountry(countryCode).symbol;
}
