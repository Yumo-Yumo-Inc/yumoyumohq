import { NextResponse } from "next/server";
import { getUsdExchangeRate, getUsdRateForCountry } from "@/lib/finance/exchange-rates";
import { getCountryByCode, normalizeCountryCode } from "@/lib/shared/countries";

// ECB daily reference XML covers ~30 major currencies; long-tail (VND, PKR,
// IDR-occasional, NPR, ...) is missing. Returning 500 in this case pollutes
// the logs and the frontend already falls back to null, so this degrades
// gracefully via 200 + rateFromUsd:null + an unsupportedCurrency flag.
function isUnsupportedCurrencyError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("Unsupported ECB currency:");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCountry = searchParams.get("country");
  const rawCurrency = searchParams.get("currency");

  if (rawCurrency) {
    const currency = rawCurrency.toUpperCase();
    try {
      const rate = await getUsdExchangeRate(currency);
      return NextResponse.json({
        currency,
        symbol: currency === "USD" ? "$" : currency,
        rateFromUsd: rate.rate,
        asOf: rate.asOf,
        sourceName: "ECB euro foreign exchange reference rates",
        sourceUrl: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html",
      });
    } catch (error) {
      if (isUnsupportedCurrencyError(error)) {
        return NextResponse.json({
          currency,
          symbol: currency === "USD" ? "$" : currency,
          rateFromUsd: null,
          asOf: null,
          unsupportedCurrency: true,
        });
      }
      console.error("[api/fx/latest] error:", error);
      return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 500 });
    }
  }

  const countryCode = normalizeCountryCode(rawCountry) || "US";
  const country = getCountryByCode(countryCode);
  try {
    const rate = await getUsdRateForCountry(countryCode);
    return NextResponse.json({
      countryCode,
      countryName: country?.name ?? "United States",
      currency: rate.currency,
      symbol: rate.symbol,
      rateFromUsd: rate.rateFromUsd,
      asOf: rate.asOf,
      sourceName: "ECB euro foreign exchange reference rates",
      sourceUrl: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html",
    });
  } catch (error) {
    if (isUnsupportedCurrencyError(error)) {
      return NextResponse.json({
        countryCode,
        countryName: country?.name ?? null,
        currency: country?.currency ?? null,
        symbol: country?.symbol ?? null,
        rateFromUsd: null,
        asOf: null,
        unsupportedCurrency: true,
      });
    }
    console.error("[api/fx/latest] error:", error);
    return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 500 });
  }
}
