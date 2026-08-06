import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { getFriendsData, sendRequest, acceptRequest, removeEdge, statusOf } from "@/lib/friends/storage";
import { createNotification } from "@/lib/notifications/create";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toRows(r: unknown): Record<string, unknown>[] {
  if (Array.isArray(r)) return r as Record<string, unknown>[];
  if (r && typeof r === "object" && "rows" in r) return (r as { rows: Record<string, unknown>[] }).rows;
  return [];
}

/** Display name + preferred locale of a user (for notification copy). */
async function whoIs(username: string): Promise<{ name: string; locale: string }> {
  if (!sql) return { name: username, locale: "en" };
  const row = toRows(await sql`
    SELECT p.display_name, u.preferred_locale
    FROM users u
    LEFT JOIN user_profiles p ON p.username = u.username
    WHERE u.username = ${username}
    LIMIT 1
  `)[0];
  return { name: (row?.display_name as string) || username, locale: (row?.preferred_locale as string) || "en" };
}

// ── GET: my friends + pending in/out ─────────────────────────────────────────
export async function GET() {
  const me = await getSessionUsername();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await getFriendsData(me);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("[api/friends] GET error:", (e as Error)?.message);
    return NextResponse.json({ friends: [], incoming: [], outgoing: [] });
  }
}

// ── POST: send a friend request { username } ─────────────────────────────────
export async function POST(req: Request) {
  const me = await getSessionUsername();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const other = typeof body.username === "string" ? body.username.trim() : "";
  if (!other) return NextResponse.json({ error: "username required" }, { status: 400 });

  const res = await sendRequest(me, other);
  if (!res.ok && res.error !== "already_friends" && res.error !== "already_requested") {
    return NextResponse.json({ error: res.error ?? "failed" }, { status: 400 });
  }
  if (res.ok) {
    const meInfo = await whoIs(me);
    if (res.status === "friends") {
      // matched a reverse pending request → both are now friends; tell the other
      const tr = meInfo.locale === "tr";
      await createNotification({
        username: other, type: "friend_accepted", push: true,
        title: tr ? "Yeni arkadaş" : "New friend",
        body: tr ? `${meInfo.name} ile artık arkadaşsınız.` : `You and ${meInfo.name} are now friends.`,
        payload: { username: me },
      });
    } else {
      const otherInfo = await whoIs(other);
      const tr = otherInfo.locale === "tr";
      await createNotification({
        username: other, type: "friend_request", push: true,
        title: tr ? "Arkadaşlık isteği" : "Friend request",
        body: tr ? `${meInfo.name} sana arkadaşlık isteği gönderdi.` : `${meInfo.name} sent you a friend request.`,
        payload: { username: me },
      });
    }
  }
  return NextResponse.json({ ok: true, status: res.status });
}

// ── PATCH: { username, action: accept | reject | remove } ─────────────────────
export async function PATCH(req: Request) {
  const me = await getSessionUsername();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const other = typeof body.username === "string" ? body.username.trim() : "";
  const action = body.action;
  if (!other || !["accept", "reject", "remove"].includes(action)) {
    return NextResponse.json({ error: "username and valid action required" }, { status: 400 });
  }

  if (action === "accept") {
    await acceptRequest(me, other);
    const [meInfo, otherInfo] = await Promise.all([whoIs(me), whoIs(other)]);
    const tr = otherInfo.locale === "tr";
    await createNotification({
      username: other, type: "friend_accepted", push: true,
      title: tr ? "Arkadaşlık kabul edildi" : "Friend request accepted",
      body: tr ? `${meInfo.name} arkadaşlık isteğini kabul etti.` : `${meInfo.name} accepted your friend request.`,
      payload: { username: me },
    });
  } else {
    await removeEdge(me, other);
  }
  return NextResponse.json({ ok: true, status: await statusOf(me, other) });
}
