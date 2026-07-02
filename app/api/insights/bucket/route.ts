/**
 * GET /api/insights/bucket?range=7d|30d|90d|all
 *
 * Returns the real-data Bucket the /app/insights page renders. Pulls the user's
 * receipts for the selected range (and the preceding range for deltas), line
 * items for products/brands, merchant logo URLs from the merchant_logos
 * registry, and the user's display name (to exclude their own name from the
 * product list), then assembles the Bucket.
 *
 * Empty data is returned as empty arrays / zero totals — no fabricated values.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getReceiptsByDateRangeForInsights } from "@/lib/receipt/storage-db";
import { getLineItemsForRange } from "@/lib/insights/line-items-query";
import { getLogoUrlsForMerchants } from "@/lib/insights/merchant-logo-lookup";
import { buildBucket, rangeDays, type Range } from "@/lib/insights/bucket-builder";
import { sql } from "@/lib/db/client";

function parseRange(v: string | null): Range {
  if (v === "7d" || v === "30d" || v === "90d" || v === "all") return v;
  return "30d";
}

/** Fetches the user's display name (to exclude their own name from the product list). */
async function getUserDisplayName(username: string): Promise<string | null> {
  if (!sql) return null;
  try {
    const rows = (await sql`
      SELECT display_name FROM user_profiles WHERE username = ${username} LIMIT 1
    `) as { display_name: string | null }[];
    return rows[0]?.display_name ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = parseRange(new URL(request.url).searchParams.get("range"));
  const days = rangeDays(range);

  const now = new Date();
  const curStart = range === "all" ? new Date("2000-01-01") : new Date(now.getTime() - days * 86400000);
  const prevStart = range === "all" ? new Date("2000-01-01") : new Date(now.getTime() - 2 * days * 86400000);
  const prevEnd = curStart;

  try {
    const [current, previous, items] = await Promise.all([
      getReceiptsByDateRangeForInsights(username, curStart, now),
      range === "all"
        ? Promise.resolve([])
        : getReceiptsByDateRangeForInsights(username, prevStart, prevEnd),
      getLineItemsForRange(username, curStart, now),
    ]);

    const merchantNames = [...new Set(current.map((r) => r.merchantName).filter(Boolean))];
    const [logoByMerchant, userDisplayName] = await Promise.all([
      getLogoUrlsForMerchants(merchantNames),
      getUserDisplayName(username),
    ]);

    const bucket = buildBucket({ range, current, previous, items, logoByMerchant, userDisplayName });
    return NextResponse.json({ range, bucket });
  } catch (err) {
    console.error("[api/insights/bucket] failed:", err);
    return NextResponse.json({ error: "Failed to build insights" }, { status: 500 });
  }
}
