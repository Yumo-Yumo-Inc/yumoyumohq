import { NextResponse } from "next/server";
import { getSql, warmUpConnection } from "@/lib/db/client";
import { getSessionUsername } from "@/lib/auth/session";
import {
  buildMobileActionResultForUser,
  createMobileLevelEvent,
  getMobileLevelSnapshot,
} from "@/lib/mobile/server-data";
import { recordUserCheckIn } from "@/lib/streak/record-check-in";

export async function POST() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json(
        { error: "Database not available", ok: false },
        { status: 503 }
      );
    }

    await warmUpConnection();

    const beforeLevels = await getMobileLevelSnapshot(username);
    const checkIn = await recordUserCheckIn(username);
    if (!checkIn) {
      return NextResponse.json(
        { error: "Check-in failed", ok: false },
        { status: 503 }
      );
    }

    const afterLevels = await getMobileLevelSnapshot(username);
    const levelEvent = createMobileLevelEvent(beforeLevels, afterLevels);

    return NextResponse.json({
      ok: true,
      streak: checkIn.streak,
      alreadyCheckedIn: checkIn.alreadyCheckedIn,
      date: checkIn.todayStr,
      d1Ready: checkIn.wasNew,
      actionResult: await buildMobileActionResultForUser(username, { levelEvent }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[api/check-in] error:", error);
    const isMissingTable =
      /relation "check_ins" does not exist|table "check_ins"|relation "user_profiles".*streak|column "streak" does not exist/i.test(
        msg
      );
    return NextResponse.json(
      {
        error: "Check-in failed",
        ok: false,
      },
      { status: isMissingTable ? 503 : 500 }
    );
  }
}
