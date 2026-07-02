/**
 * POST /api/user/locale
 *
 * Persists the user's preferred locale to the database.
 * Called by the frontend when the user changes language in the app panel.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export async function POST(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const locale = (body as Record<string, unknown>)?.locale;
  const VALID_LOCALES = ["en", "tr", "ru", "th", "es", "zh"] as const;
  if (typeof locale !== "string" || !(VALID_LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json(
      { success: false, error: "Invalid locale. Must be one of: en, tr, ru, th, es, zh." },
      { status: 400 }
    );
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Database unavailable" },
      { status: 503 }
    );
  }

  try {
    const result = await sql`
      UPDATE users
      SET preferred_locale = ${locale}
      WHERE username = ${username}
      RETURNING username
    `;
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, locale });
  } catch (err) {
    console.error("[UserLocale] Update failed:", err);
    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500 }
    );
  }
}
