import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { searchUsers } from "@/lib/friends/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/users/search?q= — find users by username/display name (min 2 chars). */
export async function GET(req: Request) {
  const me = await getSessionUsername();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const results = await searchUsers(me, q);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("[api/users/search] error:", (e as Error)?.message);
    return NextResponse.json({ results: [] });
  }
}
