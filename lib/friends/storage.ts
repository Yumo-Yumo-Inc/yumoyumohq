/**
 * Friendships — a bidirectional friend graph with request/accept semantics.
 * SERVER-ONLY. One directed row per pair (requester → addressee) carries the
 * status; a pair is friends when an accepted row exists in EITHER direction.
 * The table self-heals (CREATE IF NOT EXISTS) so no migration runbook is needed
 * (mirrors the user_profiles column pattern).
 */
if (typeof window !== "undefined") {
  throw new Error("friends/storage is server-only.");
}

import { sql } from "@/lib/db/client";

let ensured = false;
async function ensureTable(): Promise<void> {
  if (ensured || !sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      requester_username VARCHAR(255) NOT NULL,
      addressee_username VARCHAR(255) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT friendships_not_self CHECK (requester_username <> addressee_username),
      CONSTRAINT friendships_pair_unique UNIQUE (requester_username, addressee_username)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_username, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_username, status)`;
  ensured = true;
}

export interface FriendUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  nameColor: string | null;
  profileFrame: string | null;
  avatarSticker: string | null;
  accountLevel: number;
  streak: number;
  receiptsVerified: number;
  hiddenCostUncovered: number;
}

export interface FriendRequestUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  nameColor: string | null;
  profileFrame: string | null;
  avatarSticker: string | null;
}

export type FriendshipStatus = "none" | "friends" | "incoming" | "outgoing";

function toRows<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) return (r as { rows: T[] }).rows;
  return [];
}

/** Existing edge (either direction) between me and other, or null. */
async function edge(me: string, other: string) {
  const rows = toRows<{ requester_username: string; addressee_username: string; status: string }>(await sql`
    SELECT requester_username, addressee_username, status FROM friendships
    WHERE (requester_username = ${me} AND addressee_username = ${other})
       OR (requester_username = ${other} AND addressee_username = ${me})
    LIMIT 1`);
  return rows[0] ?? null;
}

/** Friendship status of `other` relative to `me`. */
export async function statusOf(me: string, other: string): Promise<FriendshipStatus> {
  if (me === other || !sql) return "none";
  await ensureTable();
  const e = await edge(me, other);
  if (!e) return "none";
  if (e.status === "accepted") return "friends";
  return e.requester_username === me ? "outgoing" : "incoming";
}

/** Send a friend request me → other. Returns the resulting status. */
export async function sendRequest(me: string, other: string): Promise<{ ok: boolean; status: FriendshipStatus; error?: string }> {
  if (!sql) return { ok: false, status: "none", error: "db" };
  if (me === other) return { ok: false, status: "none", error: "self" };
  await ensureTable();
  const existing = await edge(me, other);
  if (existing) {
    if (existing.status === "accepted") return { ok: false, status: "friends", error: "already_friends" };
    // If THEY already requested ME, accept it instead of creating a reverse row.
    if (existing.requester_username === other) {
      await sql`UPDATE friendships SET status='accepted', updated_at=now()
                WHERE requester_username=${other} AND addressee_username=${me}`;
      return { ok: true, status: "friends" };
    }
    return { ok: false, status: "outgoing", error: "already_requested" };
  }
  await sql`INSERT INTO friendships (requester_username, addressee_username, status)
            VALUES (${me}, ${other}, 'pending')`;
  return { ok: true, status: "outgoing" };
}

/** Accept an incoming request from `other`. */
export async function acceptRequest(me: string, other: string): Promise<boolean> {
  if (!sql) return false;
  await ensureTable();
  const res = await sql`UPDATE friendships SET status='accepted', updated_at=now()
    WHERE requester_username=${other} AND addressee_username=${me} AND status='pending'`;
  return true;
}

/** Reject an incoming request OR cancel an outgoing one (delete the pending edge). */
export async function removeEdge(me: string, other: string): Promise<boolean> {
  if (!sql) return false;
  await ensureTable();
  await sql`DELETE FROM friendships
    WHERE (requester_username=${me} AND addressee_username=${other})
       OR (requester_username=${other} AND addressee_username=${me})`;
  return true;
}

/** Full friends view for `me`: accepted friends (with stats) + pending in/out. */
export async function getFriendsData(me: string): Promise<{
  friends: FriendUser[];
  incoming: FriendRequestUser[];
  outgoing: FriendRequestUser[];
}> {
  if (!sql) return { friends: [], incoming: [], outgoing: [] };
  await ensureTable();

  const accepted = toRows<{ requester_username: string; addressee_username: string }>(await sql`
    SELECT requester_username, addressee_username FROM friendships
    WHERE status='accepted' AND (requester_username=${me} OR addressee_username=${me})`);
  const friendUsernames = accepted.map((r) => (r.requester_username === me ? r.addressee_username : r.requester_username));

  const incomingRows = toRows<{ requester_username: string }>(await sql`
    SELECT requester_username FROM friendships WHERE addressee_username=${me} AND status='pending' ORDER BY created_at DESC`);
  const outgoingRows = toRows<{ addressee_username: string }>(await sql`
    SELECT addressee_username FROM friendships WHERE requester_username=${me} AND status='pending' ORDER BY created_at DESC`);

  const profileOf = async (usernames: string[]): Promise<Map<string, FriendRequestUser>> => {
    const m = new Map<string, FriendRequestUser>();
    if (usernames.length === 0) return m;
    const rows = toRows<Record<string, unknown>>(await sql`
      SELECT username, display_name, avatar_url, name_color, profile_frame, avatar_sticker
      FROM user_profiles WHERE username = ANY(${usernames})`);
    for (const r of rows) m.set(String(r.username), {
      username: String(r.username),
      displayName: (r.display_name as string) ?? null,
      avatarUrl: (r.avatar_url as string) ?? null,
      nameColor: (r.name_color as string) ?? null,
      profileFrame: (r.profile_frame as string) ?? null,
      avatarSticker: (r.avatar_sticker as string) ?? null,
    });
    return m;
  };

  let friends: FriendUser[] = [];
  if (friendUsernames.length > 0) {
    const rows = toRows<Record<string, unknown>>(await sql`
      SELECT up.username, up.display_name, up.avatar_url, up.name_color, up.profile_frame, up.avatar_sticker,
             COALESCE(up.account_level, 1) AS account_level, COALESCE(up.streak, 0) AS streak,
             COUNT(r.*) FILTER (WHERE r.status IN ('analyzed','verified')) AS receipts,
             COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status IN ('analyzed','verified')), 0) AS hidden_cost
      FROM user_profiles up
      LEFT JOIN receipts r ON r.username = up.username
      WHERE up.username = ANY(${friendUsernames})
      GROUP BY up.username, up.display_name, up.avatar_url, up.name_color, up.profile_frame, up.avatar_sticker, up.account_level, up.streak
      ORDER BY hidden_cost DESC`);
    friends = rows.map((r) => ({
      username: String(r.username),
      displayName: (r.display_name as string) ?? null,
      avatarUrl: (r.avatar_url as string) ?? null,
      nameColor: (r.name_color as string) ?? null,
      profileFrame: (r.profile_frame as string) ?? null,
      avatarSticker: (r.avatar_sticker as string) ?? null,
      accountLevel: Number(r.account_level) || 1,
      streak: Number(r.streak) || 0,
      receiptsVerified: Number(r.receipts) || 0,
      hiddenCostUncovered: Number(r.hidden_cost) || 0,
    }));
  }

  const inMap = await profileOf(incomingRows.map((r) => r.requester_username));
  const outMap = await profileOf(outgoingRows.map((r) => r.addressee_username));
  const incoming = incomingRows.map((r) => inMap.get(r.requester_username)).filter(Boolean) as FriendRequestUser[];
  const outgoing = outgoingRows.map((r) => outMap.get(r.addressee_username)).filter(Boolean) as FriendRequestUser[];

  return { friends, incoming, outgoing };
}

/** Search users by username / display name; annotate each with friendship status. */
export async function searchUsers(me: string, q: string, limit = 12): Promise<Array<FriendRequestUser & { status: FriendshipStatus }>> {
  if (!sql) return [];
  const term = q.trim();
  if (term.length < 2) return [];
  await ensureTable();
  const like = `%${term.replace(/[%_]/g, (m) => "\\" + m)}%`;
  const rows = toRows<Record<string, unknown>>(await sql`
    SELECT username, display_name, avatar_url, name_color, profile_frame, avatar_sticker
    FROM user_profiles
    WHERE username <> ${me} AND (username ILIKE ${like} OR display_name ILIKE ${like})
    ORDER BY (username ILIKE ${term + "%"}) DESC, username ASC
    LIMIT ${limit}`);

  // one query for all edges involving me + these users
  const usernames = rows.map((r) => String(r.username));
  const edges = usernames.length === 0 ? [] : toRows<{ requester_username: string; addressee_username: string; status: string }>(await sql`
    SELECT requester_username, addressee_username, status FROM friendships
    WHERE (requester_username=${me} AND addressee_username = ANY(${usernames}))
       OR (addressee_username=${me} AND requester_username = ANY(${usernames}))`);
  const statusFor = (u: string): FriendshipStatus => {
    const e = edges.find((x) => x.requester_username === u || x.addressee_username === u);
    if (!e) return "none";
    if (e.status === "accepted") return "friends";
    return e.requester_username === me ? "outgoing" : "incoming";
  };

  return rows.map((r) => ({
    username: String(r.username),
    displayName: (r.display_name as string) ?? null,
    avatarUrl: (r.avatar_url as string) ?? null,
    nameColor: (r.name_color as string) ?? null,
    profileFrame: (r.profile_frame as string) ?? null,
    avatarSticker: (r.avatar_sticker as string) ?? null,
    status: statusFor(String(r.username)),
  }));
}
