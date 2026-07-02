/**
 * Daily FX Rate Service
 *
 * Fetches exchange rates once per day and stores them in the `currency_rates` table.
 * All rates are expressed as "1 [currency] = X USD".
 *
 * Sources tried in order:
 *   1. Open Exchange Rates (OPENEXCHANGERATES_APP_ID env)
 *   2. Frankfurter API (free, no key needed) — fallback
 *
 * Scheduled via: app/api/cron/fx-rates/route.ts (daily at 06:00 UTC)
 */

import { getSql } from "@/lib/db/client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** $300 USD threshold for payment proof requirement */
export const PAYMENT_PROOF_THRESHOLD_USD = 300;

/** How long a cached rate stays valid (25 hours — covers timezone drift) */
const RATE_TTL_MS = 25 * 60 * 60 * 1000;

/** In-memory cache to avoid DB round-trip within the same process */
const rateCache = new Map<string, { rateToUsd: number; fetchedAt: number }>();

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function saveRatesToDb(rates: Record<string, number>): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  const today = new Date().toISOString().slice(0, 10);
  const rows = Object.entries(rates).map(([currency, rateToUsd]) => ({
    currency: currency.toUpperCase(),
    rate_to_usd: rateToUsd,
    fetched_date: today,
  }));

  if (rows.length === 0) return;

  await sql`
    INSERT INTO currency_rates (currency, rate_to_usd, fetched_date)
    SELECT r.currency, r.rate_to_usd::numeric, r.fetched_date::date
    FROM json_to_recordset(${JSON.stringify(rows)}::json)
      AS r(currency text, rate_to_usd numeric, fetched_date date)
    ON CONFLICT (currency, fetched_date)
    DO UPDATE SET rate_to_usd = EXCLUDED.rate_to_usd, updated_at = now()
  `;

  console.log(`[FX] Saved ${rows.length} rates to DB for ${today}`);
}

async function getLatestRateFromDb(currency: string): Promise<number | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = (await sql`
    SELECT rate_to_usd
    FROM currency_rates
    WHERE currency = ${currency.toUpperCase()}
    ORDER BY fetched_date DESC
    LIMIT 1
  `) as { rate_to_usd: number }[];

  return rows[0]?.rate_to_usd ?? null;
}

// ---------------------------------------------------------------------------
// FX source 1: Open Exchange Rates
// ---------------------------------------------------------------------------

async function fetchFromOpenExchangeRates(): Promise<Record<string, number> | null> {
  const appId = process.env.OPENEXCHANGERATES_APP_ID;
  if (!appId) return null;

  try {
    const res = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as { rates?: Record<string, number> };
    if (!data.rates) return null;

    // Convert "X per USD" → "1 currency = Y USD" (invert)
    const rateToUsd: Record<string, number> = {};
    for (const [currency, perUsd] of Object.entries(data.rates)) {
      if (perUsd > 0) rateToUsd[currency] = 1 / perUsd;
    }
    rateToUsd["USD"] = 1;
    return rateToUsd;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// FX source 2: Frankfurter API (free, no key)
// ---------------------------------------------------------------------------

async function fetchFromFrankfurter(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD",
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as { rates?: Record<string, number> };
    if (!data.rates) return null;

    const rateToUsd: Record<string, number> = { USD: 1 };
    for (const [currency, perUsd] of Object.entries(data.rates)) {
      if (perUsd > 0) rateToUsd[currency] = 1 / perUsd;
    }
    return rateToUsd;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main: fetch and persist
// ---------------------------------------------------------------------------

/**
 * Fetch today's FX rates from external source and save to DB.
 * Call this from the daily cron job.
 */
export async function fetchAndSaveDailyRates(): Promise<{ count: number; source: string }> {
  let rates = await fetchFromOpenExchangeRates();
  let source = "openexchangerates";

  if (!rates) {
    rates = await fetchFromFrankfurter();
    source = "frankfurter";
  }

  if (!rates) {
    console.warn("[FX] ⚠️ All FX sources failed — rates not updated");
    return { count: 0, source: "none" };
  }

  // Warm in-memory cache
  const now = Date.now();
  for (const [currency, rateToUsd] of Object.entries(rates)) {
    rateCache.set(currency.toUpperCase(), { rateToUsd, fetchedAt: now });
  }

  await saveRatesToDb(rates);
  return { count: Object.keys(rates).length, source };
}

// ---------------------------------------------------------------------------
// Convert total to USD — used by threshold check
// ---------------------------------------------------------------------------

/**
 * Static emergency fallback rates (approximate).
 * Used only when DB + API are both unavailable.
 * Updated quarterly — last update: 2026 Q2.
 */
const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  TRY: 0.028,   // ~35 TRY/USD
  MYR: 0.22,    // ~4.5 MYR/USD
  THB: 0.028,   // ~36 THB/USD
  IDR: 0.000062,// ~16000 IDR/USD
  SGD: 0.74,
  PHP: 0.017,
  AED: 0.27,
  SAR: 0.27,
  RUB: 0.011,
};

/**
 * Get the USD equivalent of an amount in the given currency.
 * Resolution order: in-memory cache → DB → static fallback.
 */
export async function convertToUSD(
  amount: number | null | undefined,
  currency: string | null | undefined
): Promise<number | null> {
  if (!amount || amount <= 0) return null;
  const cur = (currency ?? "USD").toUpperCase().slice(0, 3);
  if (cur === "USD") return amount;

  // 1. In-memory cache (valid for TTL)
  const cached = rateCache.get(cur);
  if (cached && Date.now() - cached.fetchedAt < RATE_TTL_MS) {
    return Math.round(amount * cached.rateToUsd * 100) / 100;
  }

  // 2. DB (latest row)
  try {
    const dbRate = await getLatestRateFromDb(cur);
    if (dbRate !== null && dbRate > 0) {
      rateCache.set(cur, { rateToUsd: dbRate, fetchedAt: Date.now() });
      return Math.round(amount * dbRate * 100) / 100;
    }
  } catch (err) {
    console.warn(`[FX] DB rate lookup failed for ${cur}:`, err);
  }

  // 3. Static fallback
  const fallback = FALLBACK_RATES_TO_USD[cur];
  if (fallback) {
    console.warn(`[FX] Using static fallback rate for ${cur}: ${fallback}`);
    return Math.round(amount * fallback * 100) / 100;
  }

  console.warn(`[FX] No rate available for ${cur} — cannot convert to USD`);
  return null;
}

/**
 * Returns true if amount >= PAYMENT_PROOF_THRESHOLD_USD.
 * Returns false (skip threshold) when currency cannot be converted.
 */
export async function exceedsPaymentProofThreshold(
  amount: number | null | undefined,
  currency: string | null | undefined
): Promise<boolean> {
  const usd = await convertToUSD(amount, currency);
  if (usd === null) return false; // unknown currency → don't block
  return usd >= PAYMENT_PROOF_THRESHOLD_USD;
}
