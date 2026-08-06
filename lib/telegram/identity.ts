/**
 * Telegram identity link.
 *
 * Maps a signature-verified Telegram user to a Yumo Yumo account. There is no
 * separate anonymous-guest concept — the whole app keys off `users.username`
 * (the primary key) — so the first Telegram sign-in mints a real but lightweight
 * account with username `telegram_<id>`, no email, and an unusable password. The
 * user can later upgrade it to a full account (email + password) WITHOUT losing
 * identity or resetting their daily quota, because the username (the usage
 * subject) never changes.
 *
 * SERVER-ONLY — never import from a client component.
 */

if (typeof window !== "undefined") {
  throw new Error("telegram/identity is a server-only module.");
}

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import { getSql } from "@/lib/db/client";
import { ensureUsersSchema } from "@/lib/storage/user-auth-storage";

/**
 * Minimal trusted Telegram user shape. In the bot-in-chat model this comes from
 * a webhook update's `from` object (authenticated by the webhook secret token),
 * so `id` is trusted without an initData signature.
 */
export interface TelegramUser {
  id: string; // numeric id kept as string to stay safe above JS integer range
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  languageCode?: string | null;
}

/** Deterministic username for a Telegram-only account. */
function telegramUsername(telegramId: string): string {
  return `telegram_${telegramId}`;
}

/**
 * Home country for a Telegram-only account. The receipt pipeline requires the
 * user to have a country (validateCountry), but the bot has no country-picker
 * step, so we seed one: map from the Telegram UI language where it clearly
 * implies a country, else fall back to TELEGRAM_DEFAULT_COUNTRY (TR — the
 * primary market). Users can change it later once account settings are wired.
 */
const LANG_TO_COUNTRY: Record<string, string> = {
  tr: "TR", ru: "RU", th: "TH", es: "ES", zh: "CN", uk: "UA", de: "DE", fr: "FR", it: "IT", pt: "PT",
};
function telegramDefaultCountry(languageCode?: string | null): string {
  const mapped = languageCode ? LANG_TO_COUNTRY[languageCode.toLowerCase().slice(0, 2)] : undefined;
  return mapped || process.env.TELEGRAM_DEFAULT_COUNTRY || "TR";
}

export interface TelegramIdentity {
  username: string;
  /** True when this call created the account (first contact). */
  created: boolean;
}

/**
 * Find the Yumo account linked to `tgUser`, creating a lightweight one on first
 * contact. Idempotent: a race between two first contacts resolves to the same
 * row via the unique telegram_id index. Returns the resolved username, which is
 * the identity/usage subject everywhere in the app.
 *
 * A Telegram-only account has no email, so it is treated as effectively verified
 * (there is nothing to verify) — matching isEffectivelyVerified() for null-email
 * users — should it later be surfaced through a session.
 */
export async function getOrCreateTelegramUser(
  tgUser: TelegramUser,
  meta?: { signupIp?: string | null }
): Promise<TelegramIdentity> {
  const sql = await ensureUsersSchema();
  const username = telegramUsername(tgUser.id);

  if (!sql) {
    // No DB (dev without a database) — return the identity so the flow can
    // still proceed; downstream storage is a no-op in that mode.
    return { username, created: false };
  }

  const country = telegramDefaultCountry(tgUser.languageCode);

  // 1) Already linked?
  const existing = await sql`
    SELECT username FROM users WHERE telegram_id = ${tgUser.id} LIMIT 1
  `;
  if (existing[0]?.username) {
    const linkedUsername = String(existing[0].username);
    // Self-heal: earlier accounts were created without a country, which makes the
    // pipeline reject every receipt (validateCountry). Seed it if still empty.
    await sql`
      UPDATE users SET country = ${country}, updated_at = now()
      WHERE username = ${linkedUsername} AND (country IS NULL OR country = '')
    `.catch(() => {});
    return { username: linkedUsername, created: false };
  }

  // 2) Create a lightweight account. Unusable random password (login is via
  //    Telegram until the user sets a real one). ON CONFLICT keeps this
  //    idempotent under concurrent first sign-ins.
  const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 12);
  const now = new Date();
  try {
    await sql`
      INSERT INTO users (
        username, email, country, password_hash,
        email_verified_at, telegram_id, source_channel,
        signup_ip, created_at, updated_at
      )
      VALUES (
        ${username}, ${null}, ${country}, ${passwordHash},
        ${null}, ${tgUser.id}, ${"telegram"},
        ${meta?.signupIp ?? null}, ${now}, ${now}
      )
      ON CONFLICT (username) DO NOTHING
    `;
  } catch (error) {
    // A concurrent insert may win the unique telegram_id index; fall through
    // to re-read below rather than failing the sign-in.
    console.warn("[telegram/identity] insert race or error, re-reading:", error instanceof Error ? error.message : error);
  }

  // 3) Re-read to get the canonical row (covers ON CONFLICT DO NOTHING and races).
  const linked = await sql`
    SELECT username FROM users WHERE telegram_id = ${tgUser.id} OR username = ${username} LIMIT 1
  `;
  const finalUsername = linked[0]?.username ? String(linked[0].username) : username;
  return { username: finalUsername, created: true };
}
