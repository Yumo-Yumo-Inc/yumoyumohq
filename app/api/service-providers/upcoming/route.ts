import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { listUpcomingPayments } from "@/lib/service-providers/server";

export async function GET(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const within = Number(url.searchParams.get("within") ?? "30");
  const days = Number.isInteger(within) && within > 0 && within <= 90 ? within : 30;

  const upcoming = await listUpcomingPayments(username, days);
  return NextResponse.json({ success: true, upcoming });
}
