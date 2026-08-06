/**
 * POST /api/user/cosmetic-equip — equip a single owned cosmetic in place.
 *
 * Lets the season pass (and any surface) equip one cosmetic without sending the
 * whole profile payload (which POST /api/user/profile requires and would risk
 * clobbering). Ownership is enforced the same way as the profile PATCH: the
 * account level OR a season-pass grant, via the same normalize functions.
 *
 * Body: { field: "nameColor"|"profileFrame"|"themeAccent"|"profileBg"|"avatarSticker", key: string }
 * A null/empty/"default" key clears the slot.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { getAccountLevelFromXp } from "@/config/account-level-config";
import { getSeasonPassGrants, syncSeasonPassGrants } from "@/lib/season/pass-grants";
import { getCurrentSeasonNumber } from "@/lib/oracle/account-season-level";
import { normalizeNameColorKey } from "@/config/name-colors";
import { normalizeProfileFrameKey } from "@/config/profile-frames";
import { normalizeThemeAccentKey } from "@/config/theme-accents";
import { normalizeProfileBgKey } from "@/config/profile-backgrounds";
import { normalizeAvatarStickerKey } from "@/config/avatar-stickers";
import { normalizeSealKey } from "@/config/proof-seals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FIELDS = {
  nameColor: { normalize: normalizeNameColorKey },
  profileFrame: { normalize: normalizeProfileFrameKey },
  themeAccent: { normalize: normalizeThemeAccentKey },
  profileBg: { normalize: normalizeProfileBgKey },
  avatarSticker: { normalize: normalizeAvatarStickerKey },
  seal: { normalize: normalizeSealKey },
} as const;

type FieldName = keyof typeof FIELDS;

/** Write the value to the field's column with a fixed tagged-template query. */
async function writeField(field: FieldName, username: string, key: string | null): Promise<void> {
  switch (field) {
    case "nameColor":
      await sql`UPDATE user_profiles SET name_color = ${key}, updated_at = CURRENT_TIMESTAMP WHERE username = ${username}`;
      return;
    case "profileFrame":
      await sql`UPDATE user_profiles SET profile_frame = ${key}, updated_at = CURRENT_TIMESTAMP WHERE username = ${username}`;
      return;
    case "themeAccent":
      await sql`UPDATE user_profiles SET theme_accent = ${key}, updated_at = CURRENT_TIMESTAMP WHERE username = ${username}`;
      return;
    case "profileBg":
      await sql`UPDATE user_profiles SET profile_bg = ${key}, updated_at = CURRENT_TIMESTAMP WHERE username = ${username}`;
      return;
    case "avatarSticker":
      await sql`UPDATE user_profiles SET avatar_sticker = ${key}, updated_at = CURRENT_TIMESTAMP WHERE username = ${username}`;
      return;
    case "seal":
      await sql`UPDATE user_profiles SET proof_seal = ${key}, updated_at = CURRENT_TIMESTAMP WHERE username = ${username}`;
      return;
  }
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { field?: string; key?: unknown } | null;
  const field = body?.field as FieldName | undefined;
  if (!field || !(field in FIELDS)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }
  const spec = FIELDS[field];

  const rows = await sql`
    SELECT COALESCE(account_xp, 0) AS account_xp, COALESCE(season_level, 1) AS season_level
    FROM user_profiles WHERE username = ${username} LIMIT 1
  `;
  const row = (rows as Array<{ account_xp?: number; season_level?: number }>)[0];
  const level = getAccountLevelFromXp(Number(row?.account_xp ?? 0) || 0);
  const seasonNumber = getCurrentSeasonNumber();
  // Catch-up: grants are written on XP gain, but users who already passed a
  // level before that path existed (or missed a write) stay empty until sync.
  await syncSeasonPassGrants(username, seasonNumber, Number(row?.season_level ?? 1) || 1);
  const grants = await getSeasonPassGrants(username);

  const key = spec.normalize(body?.key, level, grants); // null = clear (or not owned)
  const raw = typeof body?.key === "string" ? body.key.trim().toLowerCase() : "";
  const isClear = !raw || raw === "default" || raw === "none";
  if (!key && !isClear) {
    return NextResponse.json({ error: "Not owned" }, { status: 403 });
  }

  await writeField(field, username, key);
  return NextResponse.json({ ok: true, field, key });
}
