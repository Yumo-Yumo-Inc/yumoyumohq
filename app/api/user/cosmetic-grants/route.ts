/**
 * GET /api/user/cosmetic-grants — the caller's owned season-pass cosmetic keys.
 *
 * Read-only. The cosmetic picker ORs these into the account-level ownership gates
 * so granted season cosmetics become selectable. Ownership is enforced again on
 * write (app/api/user/profile PATCH) against the same source.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { getSeasonPassGrants, syncSeasonPassGrants } from "@/lib/season/pass-grants";
import { getCurrentSeasonNumber } from "@/lib/oracle/account-season-level";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seasonNumber = getCurrentSeasonNumber();
  if (sql) {
    const rows = await sql`
      SELECT COALESCE(season_level, 1) AS season_level
      FROM user_profiles WHERE username = ${username} LIMIT 1
    `;
    const seasonLevel = Number((rows as Array<{ season_level?: number }>)[0]?.season_level ?? 1) || 1;
    await syncSeasonPassGrants(username, seasonNumber, seasonLevel);
  }
  const grants = await getSeasonPassGrants(username);
  return NextResponse.json({ grants });
}
