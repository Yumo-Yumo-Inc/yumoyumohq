/**
 * Reads supported_countries.hidden_cost_tier — the hidden-cost data tier.
 *
 *   "full"            — TR: producer-gap model (taxonomy + tax_rates + Izmir wholesale + TÜİK).
 *   "inflation_only"  — countries without detailed data: computed as an "inflation premium"
 *                       from general inflation (CPI/GENEL YoY).
 *
 * Feeds into computeLineHiddenCosts; both call paths (upload pricing-calculator and
 * post-process) read from the same source. A short-TTL in-memory cache avoids a DB
 * query per receipt. Safe default when the record/column is missing: TR→full, other→inflation_only
 * (prevents TR-specific tax/margin logic from being applied to another country by mistake).
 */

import { getSql } from "@/lib/db/client";

export type HiddenCostTier = "full" | "inflation_only";

const TIER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const cache = new Map<string, { tier: HiddenCostTier; at: number }>();

function safeDefault(country: string): HiddenCostTier {
  return country.toUpperCase() === "TR" ? "full" : "inflation_only";
}

/** Returns a country's hidden-cost tier. Falls back to the safe default on DB error. */
export async function getHiddenCostTier(
  country: string | null | undefined
): Promise<HiddenCostTier> {
  const cc = (country ?? "TR").trim().toUpperCase().slice(0, 2) || "TR";

  const hit = cache.get(cc);
  if (hit && Date.now() - hit.at < TIER_CACHE_TTL_MS) return hit.tier;

  let tier: HiddenCostTier = safeDefault(cc);
  try {
    const sql = getSql();
    if (sql) {
      const rows = (await sql`
        SELECT hidden_cost_tier
        FROM supported_countries
        WHERE country = ${cc}
      `) as Array<{ hidden_cost_tier: string | null }>;
      const raw = rows[0]?.hidden_cost_tier;
      if (raw === "full" || raw === "inflation_only") tier = raw;
    }
  } catch (e) {
    console.warn(`[getHiddenCostTier] lookup failed for ${cc}:`, (e as Error)?.message);
  }

  cache.set(cc, { tier, at: Date.now() });
  return tier;
}
