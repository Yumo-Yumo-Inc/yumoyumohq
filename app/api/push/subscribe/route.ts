/**
 * POST   /api/push/subscribe   → Save a push subscription
 * DELETE /api/push/subscribe   → Remove a push subscription
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/push/web-push";
import { getSql } from "@/lib/db/client";
import { isValidTimeZone } from "@/lib/service-providers/reminders";

/** Persist the user's IANA timezone (best-effort; reminders rely on it). */
async function saveUserTimezone(username: string, timeZone: unknown): Promise<void> {
  if (!isValidTimeZone(timeZone)) return;
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`UPDATE users SET timezone = ${timeZone}, updated_at = NOW() WHERE username = ${username}`;
  } catch (err) {
    console.error("[PushAPI] timezone update failed:", err);
  }
}

export async function POST(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { endpoint, keys, timeZone } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription" },
        { status: 400 }
      );
    }

    await savePushSubscription(username, { endpoint, keys });
    await saveUserTimezone(username, timeZone);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PushAPI] Subscribe failed:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { endpoint } = body;
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Missing endpoint" },
        { status: 400 }
      );
    }

    await deletePushSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PushAPI] Unsubscribe failed:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
