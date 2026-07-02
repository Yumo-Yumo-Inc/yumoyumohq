/**
 * CPI and exchange rate config by country (Master v4).
 * Sources: TUIK (TR), TCMB, DOSM/BNM (MY), MoC (TH), BOT, BLS (US), etc.
 */

export interface CpiConfigEntry {
  country: string;
  cpiSource: string;
  exchangeSource: string;
  currency: string;
}

export const CPI_CONFIG: Record<string, CpiConfigEntry> = {
  TR: { country: "TR", cpiSource: "TUIK", exchangeSource: "TCMB", currency: "TRY" },
  US: { country: "US", cpiSource: "BLS", exchangeSource: "BLS", currency: "USD" },
  MY: { country: "MY", cpiSource: "DOSM", exchangeSource: "BNM", currency: "MYR" },
  TH: { country: "TH", cpiSource: "MoC", exchangeSource: "BOT", currency: "THB" },
};

/** Default CPI multiplier when no country match (e.g. 1.0 for USD). */
export const DEFAULT_CPI_MULTIPLIER = 1.0;
