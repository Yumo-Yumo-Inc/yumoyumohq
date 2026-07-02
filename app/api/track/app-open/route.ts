/**
 * POST /api/track/app-open
 *
 * Records a dashboard open event for predictive pre-warm.
 * Throttled: skips if same user opened within last 5 minutes.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

const THROTTLE_MINUTES = 5;

export async function POST() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Database unavailable" },
      { status: 500 }
    );
  }

  try {
    /* Throttle: skip if opened within last 5 minutes */
    const recent = await sql`
      SELECT 1 FROM app_open_events
      WHERE username = ${username}
        AND opened_at >= NOW() - ${THROTTLE_MINUTES} * interval '1 minute'
      LIMIT 1
    `;

    if (recent.length > 0) {
      return NextResponse.json({ success: true, tracked: false, throttled: true });
    }

    await sql`
      INSERT INTO app_open_events (username, opened_at)
      VALUES (${username}, NOW())
    `;

    return NextResponse.json({ success: true, tracked: true });
  } catch (err) {
    console.error("[TrackAppOpen] Failed:", err);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
