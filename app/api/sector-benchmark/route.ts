/**
 * Public: category-based sector hidden-cost benchmark (verified).
 *
 * GET /api/sector-benchmark?category=grocery&country=TR
 *   → { benchmark: { ratioPct, source, sourceUrl, effectiveDate } } | { benchmark: null }
 *
 * Only rows with is_verified=TRUE are returned. If no data exists,
 * benchmark is null — the client does not show the "Sector comparison"
 * card (no fabricated data).
 */

import { NextResponse } from "next/server";
import { getSectorBenchmark } from "@/lib/receipt/sector-benchmark";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "").trim();
  const country = (searchParams.get("country") || "TR").trim();

  if (!category) {
    return NextResponse.json({ benchmark: null }, { status: 200 });
  }

  const benchmark = await getSectorBenchmark(category, country);
  return NextResponse.json({ benchmark });
}
