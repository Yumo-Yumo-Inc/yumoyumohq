import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { sendMessage, getThread, getConversations, getPartner } from "@/lib/messages/storage";
import { createNotification } from "@/lib/notifications/create";
import { MESSAGING_ENABLED } from "@/config/features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DISABLED = NextResponse.json({ error: "messaging disabled" }, { status: 404 });

function toRows(r: unknown): Record<string, unknown>[] {
  if (Array.isArray(r)) return r as Record<string, unknown>[];
  if (r && typeof r === "object" && "rows" in r) return (r as { rows: Record<string, unknown>[] }).rows;
  return [];
}
async function whoIs(username: string): Promise<{ name: string; locale: string }> {
  if (!sql) return { name: username, locale: "en" };
  const p = toRows(await sql`SELECT display_name FROM user_profiles WHERE username=${username} LIMIT 1`)[0];
  const u = toRows(await sql`SELECT preferred_locale FROM users WHERE username=${username} LIMIT 1`)[0];
  return { name: (p?.display_name as string) || username, locale: (u?.preferred_locale as string) || "en" };
}

// GET /api/messages            → conversation list
// GET /api/messages?with=user  → thread with that friend (marks read) + partner
export async function GET(req: Request) {
  if (!MESSAGING_ENABLED) return DISABLED;
  const me = await getSessionUsername();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const other = new URL(req.url).searchParams.get("with");
  try {
    if (other) {
      const partner = await getPartner(me, other);
      if (!partner) return NextResponse.json({ error: "not_friends" }, { status: 403 });
      const messages = await getThread(me, other, true);
      return NextResponse.json({ partner, messages }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const conversations = await getConversations(me);
    return NextResponse.json({ conversations }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("[api/messages] GET error:", (e as Error)?.message);
    return NextResponse.json(other ? { messages: [] } : { conversations: [] });
  }
}

// POST /api/messages { to, body }
export async function POST(req: Request) {
  if (!MESSAGING_ENABLED) return DISABLED;
  const me = await getSessionUsername();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const text = typeof body.body === "string" ? body.body : "";
  if (!to) return NextResponse.json({ error: "recipient required" }, { status: 400 });

  const res = await sendMessage(me, to, text);
  if (!res.ok) return NextResponse.json({ error: res.error ?? "failed" }, { status: res.error === "not_friends" ? 403 : 400 });

  const meInfo = await whoIs(me);
  const recip = await whoIs(to);
  const tr = recip.locale === "tr";
  const preview = text.trim().slice(0, 80);
  await createNotification({
    username: to, type: "message", push: true,
    title: meInfo.name,
    body: preview || (tr ? "Yeni mesaj" : "New message"),
    payload: { username: me, kind: "message" },
  });
  return NextResponse.json({ ok: true, id: res.id });
}
