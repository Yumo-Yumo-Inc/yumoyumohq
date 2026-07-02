import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { listSoftCaps, upsertSoftCap } from "@/lib/yumbie/soft-caps-server";

/** GET → the user's soft caps as a { categoryKey: amount } map. */
export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const caps = await listSoftCaps(username);
    const map: Record<string, number> = {};
    for (const c of caps) map[c.categoryKey] = c.amount;
    return NextResponse.json({ caps: map });
  } catch (error) {
    console.error("[api/yumbie/soft-caps] GET failed:", error);
    return NextResponse.json({ error: "Failed to load soft caps" }, { status: 500 });
  }
}

/** POST { categoryKey, amount, currency? } → upsert one soft cap. */
export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as { categoryKey?: string; amount?: number; currency?: string };
    if (!body.categoryKey || typeof body.amount !== "number") {
      return NextResponse.json({ error: "categoryKey and amount are required" }, { status: 400 });
    }
    const ok = await upsertSoftCap(
      username,
      String(body.categoryKey),
      Number(body.amount),
      String(body.currency || "TRY")
    );
    if (!ok) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/yumbie/soft-caps] POST failed:", error);
    return NextResponse.json({ error: "Failed to save soft cap" }, { status: 500 });
  }
}
