/**
 * Monthly income bands stored for `declared_monthly_income_band`.
 * New bands are USD-based. Legacy TRY keys are normalized on read/write.
 */

export const INCOME_BAND_KEYS = [
  "under_1000",
  "1000_2000",
  "2000_4000",
  "4000_7000",
  "7000_12000",
  "12000_plus",
] as const;

export type IncomeBandKey = (typeof INCOME_BAND_KEYS)[number];

export const LEGACY_INCOME_BAND_KEY_MAP: Record<string, IncomeBandKey> = {
  under_30: "under_1000",
  "30_35": "1000_2000",
  "35_45": "1000_2000",
  "45_60": "1000_2000",
  "60_70": "2000_4000",
  "70_85": "2000_4000",
  "85_100": "2000_4000",
  "100_120": "4000_7000",
  "120_150": "4000_7000",
  "150_plus": "7000_12000",
};

export const INCOME_BAND_USD_THRESHOLDS: Record<IncomeBandKey, { min: number; max: number | null }> = {
  under_1000: { min: 0, max: 1000 },
  "1000_2000": { min: 1000, max: 2000 },
  "2000_4000": { min: 2000, max: 4000 },
  "4000_7000": { min: 4000, max: 7000 },
  "7000_12000": { min: 7000, max: 12000 },
  "12000_plus": { min: 12000, max: null },
};

export function normalizeIncomeBandKey(value: string | null | undefined): IncomeBandKey | "" {
  if (!value) return "";
  if ((INCOME_BAND_KEYS as readonly string[]).includes(value)) {
    return value as IncomeBandKey;
  }
  return LEGACY_INCOME_BAND_KEY_MAP[value] ?? "";
}

export function getIncomeBandKeyFromUsdMonthly(usdAmount: number): IncomeBandKey {
  if (usdAmount < 1000) return "under_1000";
  if (usdAmount < 2000) return "1000_2000";
  if (usdAmount < 4000) return "2000_4000";
  if (usdAmount < 7000) return "4000_7000";
  if (usdAmount < 12000) return "7000_12000";
  return "12000_plus";
}
