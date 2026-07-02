/**
 * GET/POST /api/user/companion-locale
 *
 * Companion (Yumbie) language — separate from app UI locale (app_locale cookie).
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getSql, warmUpConnection } from "@/lib/db/client";

const VALID_LOCALES = ["en", "tr", "ru", "th", "es", "zh"] as const;
type ValidLocale = (typeof VALID_LOCALES)[number];

function isValidLocale(value: unknown): value is ValidLocale {
  return typeof value === "string" && (VALID_LOCALES as readonly string[]).includes(value);
}

function toRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "rows" in value && Array.isArray((value as { rows: unknown }).rows)) {
    return (value as { rows: unknown[] }).rows;
  }
  return [];
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json({ locale: "en" });
  }

  try {
    await warmUpConnection();
    const rows = toRows(
      await sql`
        SELECT u.preferred_locale, ucp.locale AS companion_locale
        FROM users u
        LEFT JOIN user_companion_preferences ucp ON ucp.username = u.username
        WHERE u.username = ${username}
        LIMIT 1
      `
    );
    const row = rows[0] as { preferred_locale?: string | null; companion_locale?: string | null } | undefined;
    const raw = row?.companion_locale || row?.preferred_locale || "en";
    const locale = isValidLocale(raw) ? raw : "en";
    return NextResponse.json({ locale });
  } catch (err) {
    console.error("[UserCompanionLocale] GET failed:", err);
    return NextResponse.json({ locale: "en" });
  }
}

export async function POST(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const locale = (body as Record<string, unknown>)?.locale;
  if (!isValidLocale(locale)) {
    return NextResponse.json(
      { success: false, error: "Invalid locale. Must be one of: en, tr, ru, th, es, zh." },
      { status: 400 }
    );
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  try {
    await warmUpConnection();
    const userRows = toRows(
      await sql`
        UPDATE users
        SET preferred_locale = ${locale}
        WHERE username = ${username}
        RETURNING username
      `
    );
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO user_companion_preferences (username, locale, updated_at, created_at)
      VALUES (${username}, ${locale}, NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET
        locale = EXCLUDED.locale,
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true, locale });
  } catch (err) {
    console.error("[UserCompanionLocale] POST failed:", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
