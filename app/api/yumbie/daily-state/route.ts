import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSpokeDay, setSpokeDay } from "@/lib/yumbie/daily-state-server";

/** GET → { spokeDay: string | null } — the local day Yumbie last presented for this user. */
export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const spokeDay = await getSpokeDay(username);
    return NextResponse.json({ spokeDay });
  } catch (error) {
    console.error("[api/yumbie/daily-state] GET failed:", error);
    return NextResponse.json({ error: "Failed to load daily state" }, { status: 500 });
  }
}

/** POST { day } → record that Yumbie presented on `day` (client local day key). */
export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as { day?: unknown };
    const day = typeof body.day === "string" ? body.day.trim() : "";
    // Cheap shape guard — a day key like "2026-6-27". Reject anything weird.
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(day)) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }
    const ok = await setSpokeDay(username, day);
    if (!ok) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/yumbie/daily-state] POST failed:", error);
    return NextResponse.json({ error: "Failed to save daily state" }, { status: 500 });
  }
}
