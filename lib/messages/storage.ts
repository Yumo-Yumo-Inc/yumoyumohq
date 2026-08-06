/**
 * Direct messages between friends. SERVER-ONLY. Self-healing table (no migration
 * runbook), friends-only send guard. Freshness is polling-based (client polls the
 * thread every few seconds) — no realtime infra, which suits this stack.
 */
if (typeof window !== "undefined") {
  throw new Error("messages/storage is server-only.");
}

import { sql } from "@/lib/db/client";
import { statusOf } from "@/lib/friends/storage";

const MAX_BODY = 2000;

let ensured = false;
async function ensureTable(): Promise<void> {
  if (ensured || !sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_username VARCHAR(255) NOT NULL,
      recipient_username VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      read_at TIMESTAMPTZ,
      CONSTRAINT messages_not_self CHECK (sender_username <> recipient_username)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_username, recipient_username, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_username, read_at)`;
  ensured = true;
}

function toRows<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) return (r as { rows: T[] }).rows;
  return [];
}

export interface Message {
  id: number;
  sender: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface ConversationPartner {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  nameColor: string | null;
  profileFrame: string | null;
  avatarSticker: string | null;
}

export interface Conversation extends ConversationPartner {
  lastBody: string;
  lastAt: string;
  lastFromMe: boolean;
  unread: number;
}

/** Send a message me → other. Only allowed between accepted friends. */
export async function sendMessage(me: string, other: string, bodyRaw: string): Promise<{ ok: boolean; error?: string; id?: number }> {
  if (!sql) return { ok: false, error: "db" };
  const body = String(bodyRaw ?? "").trim().slice(0, MAX_BODY);
  if (!body) return { ok: false, error: "empty" };
  if (me === other) return { ok: false, error: "self" };
  if ((await statusOf(me, other)) !== "friends") return { ok: false, error: "not_friends" };
  await ensureTable();
  const rows = toRows<{ id: number }>(await sql`
    INSERT INTO messages (sender_username, recipient_username, body) VALUES (${me}, ${other}, ${body}) RETURNING id`);
  return { ok: true, id: rows[0]?.id };
}

/** Thread between me and other (oldest → newest). Marks their messages read. */
export async function getThread(me: string, other: string, markRead = true): Promise<Message[]> {
  if (!sql) return [];
  await ensureTable();
  const rows = toRows<{ id: number; sender_username: string; body: string; created_at: string }>(await sql`
    SELECT id, sender_username, body, created_at FROM messages
    WHERE (sender_username=${me} AND recipient_username=${other})
       OR (sender_username=${other} AND recipient_username=${me})
    ORDER BY created_at ASC LIMIT 300`);
  if (markRead) {
    await sql`UPDATE messages SET read_at=now() WHERE recipient_username=${me} AND sender_username=${other} AND read_at IS NULL`;
  }
  return rows.map((r) => ({ id: r.id, sender: r.sender_username, body: r.body, createdAt: r.created_at, mine: r.sender_username === me }));
}

/** Mark all messages from `other` to me as read. */
async function markThreadRead(me: string, other: string): Promise<void> {
  if (!sql) return;
  await ensureTable();
  await sql`UPDATE messages SET read_at=now() WHERE recipient_username=${me} AND sender_username=${other} AND read_at IS NULL`;
}

/** Total unread messages for me (across all threads). */
async function unreadCount(me: string): Promise<number> {
  if (!sql) return 0;
  await ensureTable();
  const rows = toRows<{ n: number }>(await sql`SELECT COUNT(*)::int AS n FROM messages WHERE recipient_username=${me} AND read_at IS NULL`);
  return Number(rows[0]?.n ?? 0) || 0;
}

/** Conversation list for me: one row per partner, last message + unread count. */
export async function getConversations(me: string): Promise<Conversation[]> {
  if (!sql) return [];
  await ensureTable();
  const last = toRows<{ other: string; last_body: string; last_at: string; last_sender: string }>(await sql`
    WITH convos AS (
      SELECT CASE WHEN sender_username=${me} THEN recipient_username ELSE sender_username END AS other,
             body, created_at, sender_username
      FROM messages WHERE sender_username=${me} OR recipient_username=${me}
    )
    SELECT DISTINCT ON (other) other, body AS last_body, created_at AS last_at, sender_username AS last_sender
    FROM convos ORDER BY other, created_at DESC`);
  if (last.length === 0) return [];

  const unread = new Map<string, number>();
  for (const r of toRows<{ other: string; n: number }>(await sql`
    SELECT sender_username AS other, COUNT(*)::int AS n FROM messages
    WHERE recipient_username=${me} AND read_at IS NULL GROUP BY sender_username`)) {
    unread.set(r.other, Number(r.n) || 0);
  }

  const usernames = last.map((r) => r.other);
  const profiles = new Map<string, ConversationPartner>();
  for (const p of toRows<Record<string, unknown>>(await sql`
    SELECT username, display_name, avatar_url, name_color, profile_frame, avatar_sticker
    FROM user_profiles WHERE username = ANY(${usernames})`)) {
    profiles.set(String(p.username), {
      username: String(p.username),
      displayName: (p.display_name as string) ?? null,
      avatarUrl: (p.avatar_url as string) ?? null,
      nameColor: (p.name_color as string) ?? null,
      profileFrame: (p.profile_frame as string) ?? null,
      avatarSticker: (p.avatar_sticker as string) ?? null,
    });
  }

  return last
    .map((r) => {
      const prof = profiles.get(r.other);
      if (!prof) return null;
      return { ...prof, lastBody: r.last_body, lastAt: r.last_at, lastFromMe: r.last_sender === me, unread: unread.get(r.other) ?? 0 };
    })
    .filter(Boolean) as Conversation[];
}

/** Partner profile for the thread header (must be an accepted friend). */
export async function getPartner(me: string, other: string): Promise<ConversationPartner | null> {
  if (!sql) return null;
  if ((await statusOf(me, other)) !== "friends") return null;
  const rows = toRows<Record<string, unknown>>(await sql`
    SELECT username, display_name, avatar_url, name_color, profile_frame, avatar_sticker
    FROM user_profiles WHERE username=${other} LIMIT 1`);
  const p = rows[0];
  if (!p) return null;
  return {
    username: String(p.username),
    displayName: (p.display_name as string) ?? null,
    avatarUrl: (p.avatar_url as string) ?? null,
    nameColor: (p.name_color as string) ?? null,
    profileFrame: (p.profile_frame as string) ?? null,
    avatarSticker: (p.avatar_sticker as string) ?? null,
  };
}
