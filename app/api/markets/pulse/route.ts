import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getUserCountry } from "@/lib/storage/user-country-storage";
import { fetchEconomicYoYMap } from "@/lib/receipt/canonical/line-hidden-cost";
import { getUsdRateForCountry } from "@/lib/finance/exchange-rates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/markets/pulse — the dashboard market strip.
 *
 * Returns two Kraken spot pairs (SOL/USDC, SOL/BTC) and the annual CPI
 * inflation of the signed-in user's account country (from economic_indices,
 * which is populated by the sourced ETL pipelines). Every field is nullable:
 * when a source is unavailable the field is null and the UI shows an empty
 * state — no fabricated values.
 *
 * Crypto source is Kraken (not Binance): Vercel production regions get
 * HTTP 451 from api.binance.com, so SOL cells vanished in prod while
 * USD/fiat + CPI (ECB / DB) kept working.
 */

interface PairQuote {
  price: number;
  /** Session change vs today's open, percent (Kraken ticker `o` → `c`). */
  changePct: number;
}

interface CryptoQuotes {
  solUsdc: PairQuote | null;
  solBtc: PairQuote | null;
}

/** Kraken public ticker row — only fields we read. */
interface KrakenTickerRow {
  /** Last trade closed [price, lot volume]. */
  c?: [string, string];
  /** Today's opening price. */
  o?: string;
}

const CRYPTO_TTL_MS = 60_000;
/** Serve a stale crypto quote for up to 10 minutes if Kraken is unreachable. */
const CRYPTO_STALE_MAX_MS = 10 * 60_000;
const INFLATION_TTL_MS = 6 * 60 * 60_000;

let cryptoCache: { at: number; quotes: CryptoQuotes } | null = null;
const inflationCache = new Map<string, { at: number; yoyPct: number | null }>();

function parseKrakenPair(row: KrakenTickerRow | undefined): PairQuote | null {
  if (!row?.c?.[0] || row.o == null) return null;
  const price = Number(row.c[0]);
  const open = Number(row.o);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(open) || open <= 0) return null;
  const changePct = ((price - open) / open) * 100;
  if (!Number.isFinite(changePct)) return null;
  return { price, changePct };
}

async function fetchCryptoQuotes(): Promise<CryptoQuotes> {
  const now = Date.now();
  if (cryptoCache && now - cryptoCache.at < CRYPTO_TTL_MS) return cryptoCache.quotes;
  try {
    // SOLUSDC + SOLXBT (BTC) — same labels the dock already shows.
    const url = "https://api.kraken.com/0/public/Ticker?pair=SOLUSDC,SOLXBT";
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok) throw new Error(`kraken ${res.status}`);
    const body = (await res.json()) as {
      error?: string[];
      result?: Record<string, KrakenTickerRow>;
    };
    if (body.error && body.error.length > 0) {
      throw new Error(`kraken ${body.error.join("; ")}`);
    }
    const result = body.result ?? {};
    // Kraken sometimes renames pairs in `result` keys; match by exact or suffix.
    const pick = (...names: string[]): KrakenTickerRow | undefined => {
      for (const name of names) {
        if (result[name]) return result[name];
      }
      const values = Object.entries(result);
      for (const name of names) {
        const hit = values.find(([k]) => k === name || k.endsWith(name));
        if (hit) return hit[1];
      }
      return undefined;
    };
    const quotes: CryptoQuotes = {
      solUsdc: parseKrakenPair(pick("SOLUSDC")),
      solBtc: parseKrakenPair(pick("SOLXBT", "SOLBTC")),
    };
    cryptoCache = { at: now, quotes };
    return quotes;
  } catch (e) {
    console.warn("[markets/pulse] crypto fetch failed:", (e as Error)?.message);
    if (cryptoCache && now - cryptoCache.at < CRYPTO_STALE_MAX_MS) return cryptoCache.quotes;
    return { solUsdc: null, solBtc: null };
  }
}

/** Headline CPI YoY (%) for a country, from economic_indices. Null when the
 *  series (or 12 months of history) is not available. */
async function fetchInflationYoY(country: string): Promise<number | null> {
  const now = Date.now();
  const cached = inflationCache.get(country);
  if (cached && now - cached.at < INFLATION_TTL_MS) return cached.yoyPct;

  let yoyPct: number | null = null;
  try {
    const yearMonth = new Date().toISOString().slice(0, 7);
    const map = await fetchEconomicYoYMap(country, yearMonth);
    // Headline series is "GENEL"; some legacy imports use an empty series name.
    const ratio = map.get("CPI/GENEL") ?? map.get("CPI/");
    if (typeof ratio === "number" && Number.isFinite(ratio) && ratio > 0) {
      yoyPct = (ratio - 1) * 100;
    }
  } catch (e) {
    console.warn("[markets/pulse] inflation fetch failed:", (e as Error)?.message);
  }
  inflationCache.set(country, { at: now, yoyPct });
  return yoyPct;
}

export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [quotes, country] = await Promise.all([
      fetchCryptoQuotes(),
      getUserCountry(username).catch(() => null),
    ]);

    const countryCode = typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : null;
    const [yoyPct, usdFiat] = await Promise.all([
      countryCode ? fetchInflationYoY(countryCode) : Promise.resolve(null),
      // USD → account currency (ECB daily reference, cached in the fx lib).
      countryCode
        ? getUsdRateForCountry(countryCode)
            .then((r) => (r.currency === "USD" ? null : { currency: r.currency, rate: r.rateFromUsd }))
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      solUsdc: quotes.solUsdc,
      solBtc: quotes.solBtc,
      usdFiat,
      inflation: countryCode && yoyPct !== null ? { country: countryCode, yoyPct } : null,
      sources: { crypto: "kraken-spot-ticker", fx: "ecb-daily", inflation: "economic_indices" },
    });
  } catch (error) {
    console.error("[api/markets/pulse] error:", error);
    return NextResponse.json({ error: "Failed to load market pulse" }, { status: 500 });
  }
}
