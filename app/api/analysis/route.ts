/**
 * GET /api/analysis
 *
 * Returns the AnalysisPayload rendered by /app/analysis: overview totals,
 * personal price tracks, merchant comparison, unit traps, time heatmap,
 * loyalty items, personal vs official inflation, shrinkflation hits,
 * purchasing power and community comparison.
 *
 * Insufficient data yields null / empty sections — no fabricated values.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { buildAnalysis } from "@/lib/analysis/build-analysis";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await buildAnalysis(username);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[api/analysis] failed:", err);
    return NextResponse.json({ error: "Failed to build analysis" }, { status: 500 });
  }
}
