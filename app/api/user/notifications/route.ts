import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";

const LIMIT = 50;

export type UserNotificationRow = {
  id: number;
  type: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  receipt_id: string | null;
  read_at: string | null;
  created_at: string;
};


/** GET: list notifications for current user; returns { notifications, unreadCount }. */
export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json(
        { notifications: [], unreadCount: 0 },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    await warmUpConnection();

    const rows = await sql`
      SELECT id, type, title, body, payload, receipt_id, read_at, created_at
      FROM user_notifications
      WHERE username = ${username}
        AND type <> 'extra_hidden_cost'
        AND type <> 'receipt_ready_to_claim'
      ORDER BY created_at DESC
      LIMIT ${LIMIT}
    `;

    const list = (Array.isArray(rows) ? rows : []) as UserNotificationRow[];
    const unreadCount = list.filter((n) => !n.read_at).length;

    const notifications = list.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title ?? undefined,
      body: n.body ?? undefined,
      payload: n.payload ?? {},
      receiptId: n.receipt_id ?? undefined,
      readAt: n.read_at ?? undefined,
      createdAt: n.created_at,
    }));

    return NextResponse.json(
      { notifications, unreadCount },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[api/user/notifications] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load notifications", notifications: [], unreadCount: 0 },
      { status: 500 }
    );
  }
}

/** PATCH: delete one notification by id, or mark all as read. Body: { id?: number, markAll?: boolean }. */
export async function PATCH(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, markAll } = body;

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ success: false }, { status: 503 });
    }

    await warmUpConnection();

    if (markAll === true) {
      await sql`
        UPDATE user_notifications
        SET read_at = now()
        WHERE username = ${username} AND read_at IS NULL
      `;
      return NextResponse.json({ success: true });
    }

    if (typeof id === "number" && Number.isInteger(id)) {
      await sql`
        DELETE FROM user_notifications
        WHERE username = ${username} AND id = ${id}
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Provide id or markAll" }, { status: 400 });
  } catch (err) {
    console.error("[api/user/notifications] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
