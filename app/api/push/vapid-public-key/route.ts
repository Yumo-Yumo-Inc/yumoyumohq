/**
 * GET /api/push/vapid-public-key
 *
 * Returns the VAPID public key so the frontend can subscribe to push
 * notifications without exposing the private key.
 */

import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/web-push";

export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Push not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ success: true, publicKey: key });
}
