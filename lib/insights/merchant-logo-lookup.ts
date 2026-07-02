/**
 * Server-side lookup for merchant logos from the merchant_logos registry.
 * SERVER-ONLY: do not import in client components.
 *
 * Given merchant display names (as they appear on receipts), returns a map
 * merchantName -> logoUrl for those resolving to a known chain with a stored
 * logo. Unresolved names, or chains without a logo yet, are absent → the card
 * falls back to its icon. Logo is a secondary enhancement: if the table is
 * missing or the query fails, we return no logos rather than failing the page.
 */

import { sql } from "@/lib/db/client";
import { resolveMerchantBrandKey } from "./merchant-domain";

export async function getLogoUrlsForMerchants(
  merchantNames: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!sql || merchantNames.length === 0) return out;

  const nameToBrand = new Map<string, string>();
  const brandKeys = new Set<string>();
  for (const name of merchantNames) {
    const brand = resolveMerchantBrandKey(name);
    if (brand) {
      nameToBrand.set(name, brand);
      brandKeys.add(brand);
    }
  }
  if (brandKeys.size === 0) return out;

  try {
    const rows = (await sql`
      SELECT brand_key, logo_url
      FROM merchant_logos
      WHERE is_active AND logo_url IS NOT NULL
        AND brand_key = ANY(${Array.from(brandKeys)})
    `) as { brand_key: string; logo_url: string }[];

    const logoByBrand = new Map<string, string>();
    for (const r of rows) logoByBrand.set(r.brand_key, r.logo_url);

    for (const [name, brand] of nameToBrand) {
      const url = logoByBrand.get(brand);
      if (url) out.set(name, url);
    }
  } catch (err) {
    console.warn("[insights] merchant_logos lookup skipped:", err instanceof Error ? err.message : err);
  }
  return out;
}
