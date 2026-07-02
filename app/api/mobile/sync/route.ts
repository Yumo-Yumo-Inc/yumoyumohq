import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { buildSyncPayloadForUser } from "@/lib/mobile/server-data";

export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { last_sync_at?: string };
    const lastSyncAt =
      typeof body.last_sync_at === "string" && body.last_sync_at.trim()
        ? body.last_sync_at.trim()
        : null;

    const payload = await buildSyncPayloadForUser(username, lastSyncAt);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[api/mobile/sync] error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync mobile payload",
      },
      { status: 500 }
    );
  }
}
