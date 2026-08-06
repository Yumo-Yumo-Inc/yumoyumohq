/**
 * Shared notification writer (previously every caller inlined the INSERT).
 * Writes a row to user_notifications and, when `push` is set, best-effort sends
 * a Web Push. SERVER-ONLY.
 */
import { sql } from "@/lib/db/client";
import { sendPushToUser } from "@/lib/push/web-push";

export async function createNotification(input: {
  username: string;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  /** Also fire a Web Push (best-effort; no-op when the user has no subscription). */
  push?: boolean;
}): Promise<void> {
  if (!sql) return;
  try {
    await sql`
      INSERT INTO user_notifications (username, type, title, body, payload)
      VALUES (${input.username}, ${input.type}, ${input.title}, ${input.body}, ${JSON.stringify(input.payload ?? {})}::jsonb)`;
  } catch (e) {
    console.warn("[notify] insert failed:", (e as Error)?.message);
  }
  if (input.push) {
    try {
      await sendPushToUser(input.username, { title: input.title, body: input.body, tag: input.type, data: input.payload });
    } catch { /* push is best-effort */ }
  }
}
