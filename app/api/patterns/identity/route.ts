/**
 * GET /api/patterns/identity
 *
 * Returns the signed-in user's spending identity (six traits, deltas, derived
 * class) for the Patterns page. All values are computed from the user's own
 * receipt history; traits without supporting data come back as null and the UI
 * shows an empty state — no fabricated numbers.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSpendingIdentity, type IdentityRange } from "@/lib/insights/identity/compute-identity";

function parseRange(v: string | null): IdentityRange {
  return v === "30d" || v === "all" ? v : "90d";
}

export async function GET(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = parseRange(new URL(request.url).searchParams.get("range"));

  try {
    const identity = await getSpendingIdentity(username, range);
    return NextResponse.json({ identity });
  } catch (err) {
    console.error("[api/patterns/identity] failed:", err);
    return NextResponse.json({ error: "Failed to build identity" }, { status: 500 });
  }
}
