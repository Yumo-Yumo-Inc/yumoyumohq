import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { buildBootstrapPayloadForUser } from "@/lib/mobile/server-data";

export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await buildBootstrapPayloadForUser(username);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[api/mobile/bootstrap] error:", error);
    return NextResponse.json(
      {
        error: "Failed to build bootstrap payload",
      },
      { status: 500 }
    );
  }
}
