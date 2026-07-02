import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { getSessionUsername } from "@/lib/auth/session";

/**
 * cPoints earned in the CURRENT calendar month for the signed-in user.
 *
 * Sums `contribution_point_events.points_delta` from the first of this month
 * onward. Deterministic DB query (not an LLM output), so plain JSON is fine.
 * Returns `{ earnedThisMonth: 0 }` when there are no events — the dashboard
 * shows "+0", never a fabricated number.
 */
export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    if (!sql) {
      // No DB configured — surface 0 rather than guessing.
      return NextResponse.json({ earnedThisMonth: 0 });
    }

    const rows = await sql`
      SELECT COALESCE(SUM(points_delta), 0)::float AS earned_this_month
      FROM contribution_point_events
      WHERE username = ${username}
        AND created_at >= date_trunc('month', now())
    `;
    const earnedThisMonth = Number((rows as Array<{ earned_this_month: number }>)[0]?.earned_this_month ?? 0);

    return NextResponse.json({ earnedThisMonth });
  } catch (error) {
    console.error("[api/contribution-points/monthly] error:", error);
    return NextResponse.json({ error: "Failed to load monthly cPoints" }, { status: 500 });
  }
}
