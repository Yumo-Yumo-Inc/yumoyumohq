/**
 * Web Push layer. Restored with the `web-push` package; VAPID keys come from env
 * (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT). Degrades to a no-op
 * (skipped) when VAPID is not configured, so nothing breaks in envs without keys.
 */

import webpush from "web-push";
import { getSql } from "@/lib/db/client";

let vapidReady = false;
function ensureVapid(): boolean {
  if (vapidReady) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@yumoyumo.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function savePushSubscription(
  username: string,
  sub: PushSubscription
): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`
    INSERT INTO push_subscriptions (username, endpoint, p256dh, auth)
    VALUES (${username}, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET
      username = EXCLUDED.username,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      updated_at = NOW()
  `;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
}

export async function getPushSubscriptionsForUser(
  username: string
): Promise<PushSubscription[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE username = ${username}
  `;
  return rows.map((r) => ({
    endpoint: String((r as Record<string, unknown>).endpoint),
    keys: {
      p256dh: String((r as Record<string, unknown>).p256dh),
      auth: String((r as Record<string, unknown>).auth),
    },
  }));
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  scenarioId?: string;
  data?: Record<string, unknown>;
}

export async function hasRecentPush(username: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`
    SELECT 1 FROM push_deliveries
    WHERE username = ${username}
      AND sent_at > NOW() - INTERVAL '4 hours'
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function logPushDelivery(
  username: string,
  title: string,
  scenarioId?: string
): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`
    INSERT INTO push_deliveries (username, scenario_id, title, sent_at)
    VALUES (${username}, ${scenarioId ?? null}, ${title}, NOW())
  `;
}

export async function trackPushClick(scenarioId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`
    UPDATE push_deliveries
    SET clicked_at = NOW()
    WHERE id = (
      SELECT id FROM push_deliveries
      WHERE scenario_id = ${scenarioId}
        AND clicked_at IS NULL
      ORDER BY sent_at DESC
      LIMIT 1
    )
  `;
}

export async function sendPushToUser(
  username: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  if (!ensureVapid()) {
    console.warn("[Push] VAPID not configured — skipping send");
    return { sent: 0, failed: 0, skipped: true };
  }
  const subs = await getPushSubscriptionsForUser(username);
  if (subs.length === 0) return { sent: 0, failed: 0, skipped: true };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag ?? "yumbie",
    data: { ...(payload.data ?? {}), scenarioId: payload.scenarioId },
  });

  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, body);
        sent += 1;
      } catch (err) {
        failed += 1;
        const code = (err as { statusCode?: number })?.statusCode;
        // 404/410 = subscription gone → prune it so we don't retry forever.
        if (code === 404 || code === 410) {
          await deletePushSubscription(s.endpoint).catch(() => {});
        }
      }
    })
  );
  return { sent, failed, skipped: false };
}

export async function broadcastPushToUsers(
  usernames: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0, skipped: usernames.length };
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const username of usernames) {
    const r = await sendPushToUser(username, payload);
    sent += r.sent;
    failed += r.failed;
    if (r.skipped) skipped += 1;
  }
  return { sent, failed, skipped };
}
