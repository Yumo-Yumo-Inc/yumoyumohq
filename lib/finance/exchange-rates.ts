import { getCountryByCode } from "@/lib/shared/countries";

const ECB_DAILY_XML_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type EcbRatesSnapshot = {
  asOf: string;
  rates: Record<string, number>;
};

let cachedSnapshot: EcbRatesSnapshot | null = null;
let cachedAt = 0;

function parseEcbRates(xml: string): EcbRatesSnapshot {
  const dateMatch = xml.match(/<Cube\s+time=['"]([^'"]+)['"]/i);
  const asOf = dateMatch?.[1];
  if (!asOf) {
    throw new Error("ECB response missing effective date");
  }

  const rates: Record<string, number> = { EUR: 1 };
  const matches = xml.matchAll(/<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]\s*\/>/g);
  for (const match of matches) {
    const currency = match[1];
    const rate = Number(match[2]);
    if (currency && Number.isFinite(rate) && rate > 0) {
      rates[currency] = rate;
    }
  }

  if (!rates.USD) {
    throw new Error("ECB response missing USD reference rate");
  }

  return { asOf, rates };
}

export async function getLatestEcbRates(): Promise<EcbRatesSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedAt < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  const response = await fetch(ECB_DAILY_XML_URL, {
    headers: { Accept: "application/xml,text/xml" },
    next: { revalidate: 21_600 },
  });

  if (!response.ok) {
    throw new Error(`ECB rates request failed with status ${response.status}`);
  }

  const xml = await response.text();
  const snapshot = parseEcbRates(xml);
  cachedSnapshot = snapshot;
  cachedAt = now;
  return snapshot;
}

export async function getUsdExchangeRate(targetCurrency: string): Promise<{ asOf: string; rate: number }> {
  const normalizedCurrency = targetCurrency.toUpperCase();
  if (normalizedCurrency === "USD") {
    const snapshot = await getLatestEcbRates();
    return { asOf: snapshot.asOf, rate: 1 };
  }

  const snapshot = await getLatestEcbRates();
  const usdPerEur = snapshot.rates.USD;
  const targetPerEur = snapshot.rates[normalizedCurrency];

  if (!targetPerEur) {
    throw new Error(`Unsupported ECB currency: ${normalizedCurrency}`);
  }

  return {
    asOf: snapshot.asOf,
    rate: targetPerEur / usdPerEur,
  };
}

export async function getUsdRateForCountry(countryCode: string | null | undefined) {
  const country = countryCode ? getCountryByCode(countryCode) : undefined;
  const currency = country?.currency ?? "USD";
  const symbol = country?.symbol ?? "$";
  const rate = await getUsdExchangeRate(currency);

  return {
    countryCode: country?.code ?? "US",
    currency,
    symbol,
    rateFromUsd: rate.rate,
    asOf: rate.asOf,
    sourceUrl: ECB_DAILY_XML_URL,
  };
}
