import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getAccountRestriction } from "@/lib/receipt/account-restriction";

/**
 * GET /api/user/restriction
 *
 * The signed-in account's active upload restriction, or null. The app calls
 * this on launch to decide whether to show the restriction notice.
 *
 * An expired restriction reads as null, so the notice stops appearing on its
 * own the day it lapses — no cron, no cleanup step.
 */
export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restriction = await getAccountRestriction(username);
  if (!restriction) {
    return NextResponse.json({ restriction: null });
  }

  return NextResponse.json({
    restriction: {
      dailyReceiptLimit: restriction.dailyReceiptLimit,
      expiresAt: restriction.expiresAt,
    },
  });
}
