/**
 * Resolve a user's preferred companion/content locale.
 *
 * Reads `users.preferred_locale`. Falls back to "tr" when the column is
 * unavailable or the user is unknown. Only "tr" and "en" are distinguished
 * here; callers that need finer locales read them elsewhere.
 */

import { getSql } from "@/lib/db/client";

export type UserLocale = "tr" | "en";

export async function getUserLocale(username: string): Promise<UserLocale> {
  const sql = getSql();
  if (!sql) return "tr";

  let rows: unknown[];
  try {
    rows = await sql`
      SELECT preferred_locale FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
  } catch (err) {
    console.warn("[i18n] preferred_locale unavailable; defaulting to tr", err);
    return "tr";
  }

  if (rows.length === 0) return "tr";
  const locale = (rows[0] as Record<string, unknown>).preferred_locale;
  return locale === "en" ? "en" : "tr";
}
