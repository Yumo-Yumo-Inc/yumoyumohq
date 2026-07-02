/**
 * GET /api/patterns/tribe
 *
 * Returns the signed-in user's tribe: cohort counts, a class-based leaderboard,
 * and places the tribe frequents. The social layer is gated — when the cohort is
 * too small the response carries enough:false and zeroed/empty fields, and the
 * UI shows an empty state rather than inventing a community. No fabricated data.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getTribe } from "@/lib/insights/identity/tribe";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tribe = await getTribe(username);
    return NextResponse.json({ tribe });
  } catch (err) {
    console.error("[api/patterns/tribe] failed:", err);
    return NextResponse.json({ error: "Failed to build tribe" }, { status: 500 });
  }
}
