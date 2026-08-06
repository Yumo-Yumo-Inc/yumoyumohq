import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin-users";
import { getUserProfile, saveUserProfile } from "@/lib/storage/user-profile-storage";
import { getUserCountry } from "@/lib/storage/user-country-storage";
import { sql, warmUpConnection } from "@/lib/db/client";
import { reconcileQuestXpForUser } from "@/lib/quests/reconcile-quest-xp";
import { getAccountLevelFromXp } from "@/config/account-level-config";
import { getSeasonLevelFromXp } from "@/config/season-level-config";
import { normalizeCountryCode } from "@/lib/shared/countries";
import { normalizeIncomeBandKey } from "@/config/income-bands";
import { normalizeNameColorKey } from "@/config/name-colors";
import { normalizeProfileFrameKey } from "@/config/profile-frames";
import { normalizeThemeAccentKey } from "@/config/theme-accents";
import { normalizeProfileBgKey } from "@/config/profile-backgrounds";
import { normalizeAvatarStickerKey } from "@/config/avatar-stickers";
import { normalizeSealKey } from "@/config/proof-seals";
import { getSeasonPassGrants, syncSeasonPassGrants } from "@/lib/season/pass-grants";
import { getCurrentSeasonNumber } from "@/lib/oracle/account-season-level";
import { isAdultBirthDate } from "@/lib/legal/age";
import { getUserLocalTodayStr } from "@/lib/streak/record-check-in";
import { formatDateOnly } from "@/lib/shared/date-only";

function toRows(r: unknown): unknown[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows))
    return (r as { rows: unknown[] }).rows;
  return [];
}

export async function GET() {
  try {
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [profile, storedCountry] = await Promise.all([
      getUserProfile(username),
      getUserCountry(username),
    ]);

    const base = {
      username,
      displayName: profile?.displayName || null,
      gender: profile?.gender || null,
      birthDate: formatDateOnly(profile?.birthDate),
      honor: profile?.honor ?? 50,
      occupation: profile?.occupation || null,
      city: profile?.city || null,
      country: normalizeCountryCode(storedCountry) || normalizeCountryCode(profile?.country) || null,
      website: profile?.website || null,
      bio: profile?.bio || null,
      nameColor: normalizeNameColorKey(profile?.nameColor),
      profileFrame: normalizeProfileFrameKey(profile?.profileFrame),
      themeAccent: normalizeThemeAccentKey(profile?.themeAccent),
      profileBg: normalizeProfileBgKey(profile?.profileBg),
      avatarSticker: normalizeAvatarStickerKey(profile?.avatarSticker),
      seal: normalizeSealKey(profile?.seal),
    };

    if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
      return NextResponse.json({
        ...base,
        accountLevel: 1,
        accountXp: 0,
        seasonLevel: 1,
        seasonXp: 0,
        streak: 0,
        checkedInToday: false,
        declaredMonthlyIncomeBand: null,
        currentSeason: null,
      });
    }

    await warmUpConnection();

    const todayStr = await getUserLocalTodayStr(
      username,
      normalizeCountryCode(storedCountry) || normalizeCountryCode(profile?.country) || null
    );
    const [profileRow, seasonRow, checkInResult, contributionRow, recentPointEvents] = await Promise.all([
      sql`
        SELECT account_level, account_xp, season_level, season_xp, streak, current_season_number,
               declared_monthly_income_band
        FROM user_profiles
        WHERE username = ${username}
      `.then((r) => toRows(r)[0] ?? null),
      sql`
        SELECT id, season_number, name, start_at, end_at
        FROM seasons
        WHERE status = 'active'
        ORDER BY start_at DESC
        LIMIT 1
      `.then((r) => toRows(r)[0] ?? null),
      sql`
        SELECT 1 FROM check_ins WHERE username = ${username} AND check_in_date = ${todayStr}::date LIMIT 1
      `.then((r) => toRows(r).length > 0).catch(() => false),
      // Contribution points — user_contribution_totals view
      sql`
        SELECT
          COALESCE(contribution_points, 0)::float AS total_contribution_points,
          COALESCE(receipt_contribution_points, 0)::float AS receipt_contribution_points,
          COALESCE(quest_contribution_points, 0)::float AS quest_contribution_points,
          COALESCE(contribution_receipts, 0)::int AS contribution_receipts,
          last_contribution_at
        FROM user_contribution_totals
        WHERE username = ${username}
        LIMIT 1
      `.then((r) => toRows(r)[0] ?? null).catch(() => null),
      // Last 10 point events — for the activity feed
      sql`
        SELECT id, points_delta::float AS points_delta, source_type, reference_id,
               season_number, metadata, created_at
        FROM contribution_point_events
        WHERE username = ${username}
        ORDER BY created_at DESC
        LIMIT 10
      `.then((r) => toRows(r)).catch(() => []),
    ]);

    const p = profileRow as { account_level?: number; account_xp?: number; season_level?: number; season_xp?: number; streak?: number; declared_monthly_income_band?: string | null } | null;
    const checkedInToday = checkInResult === true;

    // Contribution points
    const cp = contributionRow as {
      total_contribution_points?: number | string;
      receipt_contribution_points?: number | string;
      quest_contribution_points?: number | string;
      contribution_receipts?: number | string;
      last_contribution_at?: string | null;
    } | null;
    const totalContributionPoints = Number(cp?.total_contribution_points ?? 0) || 0;
    const receiptContributionPoints = Number(cp?.receipt_contribution_points ?? 0) || 0;
    const questContributionPoints = Number(cp?.quest_contribution_points ?? 0) || 0;
    const contributionReceipts = Number(cp?.contribution_receipts ?? 0) || 0;
    const lastContributionAt = cp?.last_contribution_at ?? null;

    const pointEvents = (recentPointEvents as any[]).map((e) => ({
      id: String(e.id),
      pointsDelta: Number(e.points_delta) || 0,
      sourceType: e.source_type as string,
      referenceId: e.reference_id as string,
      seasonNumber: e.season_number as number | null,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
      createdAt: e.created_at as string,
    }));
    const season = seasonRow as { id?: number; season_number?: number; name?: string; start_at?: string; end_at?: string } | null;

    // Always derive level from XP — do not trust the stale value in the DB
    const accountXp = p?.account_xp ?? 0;
    const seasonXp = p?.season_xp ?? 0;

    // Reconcile: only for users whose XP was never written (new signup / data migration gap)
    // Non-blocking — does not delay the response; the corrected XP arrives on the next poll
    if (accountXp === 0) {
      reconcileQuestXpForUser(username).catch(() => {});
    }
    const accountLevel = getAccountLevelFromXp(accountXp);
    const seasonLevel = getSeasonLevelFromXp(seasonXp);

    // Silently updates if the level is stale in the DB (self-healing)
    const storedAccountLevel = p?.account_level ?? 1;
    const storedSeasonLevel = p?.season_level ?? 1;
    if (storedAccountLevel !== accountLevel || storedSeasonLevel !== seasonLevel) {
      sql`
        UPDATE user_profiles
        SET account_level = ${accountLevel}, season_level = ${seasonLevel}, updated_at = now()
        WHERE username = ${username}
      `.catch((e) => console.warn("[api/user/profile] level heal failed:", e));
    }

    return NextResponse.json(
      {
        ...base,
        isAdmin: isAdminUser(username),
        accountLevel,
        accountXp,
        seasonLevel,
        seasonXp,
        streak: p?.streak ?? 0,
        checkedInToday: checkedInToday ?? false,
        declaredMonthlyIncomeBand: normalizeIncomeBandKey(p?.declared_monthly_income_band ?? null) || null,
        recentPointEvents: pointEvents,
        currentSeason: season
          ? {
              id: season.id,
              seasonNumber: season.season_number,
              name: season.name,
              startAt: season.start_at,
              endAt: season.end_at,
            }
          : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("[api/user/profile] GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to get user profile",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Get username from cookie
    const username = await getSessionUsername();

    if (!username) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      displayName,
      gender,
      birthDate,
      occupation,
      declaredMonthlyIncomeBand,
      city,
      country,
      website,
      bio,
      nameColor,
      profileFrame,
      themeAccent,
      profileBg,
      avatarSticker,
      seal,
    } = body;
    // Only touch the cosmetic columns when the client explicitly sends the field
    // — partial profile saves that omit them must not wipe the stored cosmetic.
    const hasNameColor = Object.prototype.hasOwnProperty.call(body, "nameColor");
    const normalizedNameColor = normalizeNameColorKey(nameColor); // null = default/invalid
    const hasProfileFrame = Object.prototype.hasOwnProperty.call(body, "profileFrame");
    const hasThemeAccent = Object.prototype.hasOwnProperty.call(body, "themeAccent");
    const hasProfileBg = Object.prototype.hasOwnProperty.call(body, "profileBg");
    const hasAvatarSticker = Object.prototype.hasOwnProperty.call(body, "avatarSticker");
    const hasSeal = Object.prototype.hasOwnProperty.call(body, "seal");

    // Validate displayName
    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    let normalizedCountry = normalizeCountryCode(country);

    // Country is IMMUTABLE after registration: the account country chosen at
    // signup can never be changed from settings (it anchors reward eligibility,
    // hidden-cost model, and the check-in calendar day). Once a country is set,
    // any attempt to change it is silently ignored — the existing value is kept
    // so the rest of the profile still saves. First-set (no existing value) is
    // allowed for legacy accounts that never had one.
    {
      const currentCountry = normalizeCountryCode(await getUserCountry(username));
      if (currentCountry) {
        if (normalizedCountry && normalizedCountry !== currentCountry) {
          console.warn(`[user/profile] country change rejected for ${username}: immutable, keeping ${currentCountry}`);
        }
        normalizedCountry = currentCountry;
      }
    }

    const normalizedIncomeBand = normalizeIncomeBandKey(declaredMonthlyIncomeBand) || null;
    const normalizedBirthDate = typeof birthDate === "string" && birthDate.trim()
      ? birthDate.trim().slice(0, 10)
      : null;

    if (normalizedBirthDate && !isAdultBirthDate(normalizedBirthDate)) {
      return NextResponse.json(
        { error: "Yumo Yumo is available only to users 18 or older" },
        { status: 400 }
      );
    }

    // Save profile (storage + optional DB income band)
    await saveUserProfile({
      username,
      displayName: displayName.trim(),
      gender: gender || undefined,
      birthDate: normalizedBirthDate || undefined,
      occupation: occupation != null && occupation !== "" ? String(occupation).trim() : undefined,
      city: city != null && city !== "" ? String(city).trim() : undefined,
      country: normalizedCountry ?? undefined,
      website: website != null && website !== "" ? String(website).trim() : undefined,
      bio: bio != null && bio !== "" ? String(bio).trim() : undefined,
    });
    if ((process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) && sql) {
      await warmUpConnection();
      await sql`
        UPDATE user_profiles
        SET declared_monthly_income_band = ${normalizedIncomeBand}, updated_at = CURRENT_TIMESTAMP
        WHERE username = ${username}
      `;

      // Cosmetic unlocks (name color L4, profile frame L2+). Server-gated:
      // clearing to default is always allowed, but setting a cosmetic requires
      // the unlock level derived from XP — never trust a client-claimed level.
      // Level is resolved once and reused by both cosmetics.
      if (hasNameColor || hasProfileFrame || hasThemeAccent || hasProfileBg || hasAvatarSticker || hasSeal) {
        const xpRow = await sql`
          SELECT account_xp FROM user_profiles WHERE username = ${username}
        `.then((r) => toRows(r)[0] as { account_xp?: number } | undefined);
        const level = getAccountLevelFromXp(Number(xpRow?.account_xp ?? 0) || 0);
        // Season-pass cosmetics are owned via a grant row, not the account level;
        // fetch them once and OR them into every cosmetic gate below.
        // Catch-up first so users who already earned levels before the grant
        // writer existed can equip from profile settings too.
        const seasonNumber = getCurrentSeasonNumber();
        const seasonRow = await sql`
          SELECT COALESCE(season_level, 1) AS season_level FROM user_profiles WHERE username = ${username} LIMIT 1
        `.then((r) => toRows(r)[0] as { season_level?: number } | undefined);
        await syncSeasonPassGrants(username, seasonNumber, Number(seasonRow?.season_level ?? 1) || 1);
        const grants = await getSeasonPassGrants(username);

        if (hasNameColor) {
          const nameKey = normalizeNameColorKey(normalizedNameColor, level, grants);
          if (normalizedNameColor === null) {
            await sql`
              UPDATE user_profiles
              SET name_color = NULL, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else if (nameKey) {
            await sql`
              UPDATE user_profiles
              SET name_color = ${nameKey}, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else {
            console.warn(`[user/profile] name_color rejected for ${username}: not owned at level ${level}`);
          }
        }

        if (hasProfileFrame) {
          const rawFrame = typeof profileFrame === "string" ? profileFrame.trim().toLowerCase() : "";
          const isExplicitDefault = profileFrame == null || rawFrame === "" || rawFrame === "none";
          const frameKey = normalizeProfileFrameKey(profileFrame, level, grants); // null when default/unknown/not owned
          if (frameKey) {
            await sql`
              UPDATE user_profiles
              SET profile_frame = ${frameKey}, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else if (isExplicitDefault) {
            await sql`
              UPDATE user_profiles
              SET profile_frame = NULL, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else {
            console.warn(`[user/profile] profile_frame rejected for ${username}: invalid or above account level ${level}`);
          }
        }

        if (hasThemeAccent) {
          const rawAccent = typeof themeAccent === "string" ? themeAccent.trim().toLowerCase() : "";
          const isExplicitDefault = themeAccent == null || rawAccent === "" || rawAccent === "default";
          const accentKey = normalizeThemeAccentKey(themeAccent, level, grants); // null when default/unknown/not owned
          if (accentKey) {
            await sql`
              UPDATE user_profiles
              SET theme_accent = ${accentKey}, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else if (isExplicitDefault) {
            await sql`
              UPDATE user_profiles
              SET theme_accent = NULL, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else {
            console.warn(`[user/profile] theme_accent rejected for ${username}: invalid or above account level ${level}`);
          }
        }

        if (hasProfileBg) {
          const rawBg = typeof profileBg === "string" ? profileBg.trim().toLowerCase() : "";
          const isExplicitDefault = profileBg == null || rawBg === "" || rawBg === "default";
          const bgKey = normalizeProfileBgKey(profileBg, level, grants); // null when default/unknown/not owned
          if (bgKey) {
            await sql`
              UPDATE user_profiles
              SET profile_bg = ${bgKey}, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else if (isExplicitDefault) {
            await sql`
              UPDATE user_profiles
              SET profile_bg = NULL, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else {
            console.warn(`[user/profile] profile_bg rejected for ${username}: invalid or above account level ${level}`);
          }
        }

        if (hasAvatarSticker) {
          const rawSticker = typeof avatarSticker === "string" ? avatarSticker.trim().toLowerCase() : "";
          const isExplicitDefault = avatarSticker == null || rawSticker === "" || rawSticker === "none";
          const stickerKey = normalizeAvatarStickerKey(avatarSticker, level, grants); // null when default/unknown/not owned
          if (stickerKey) {
            await sql`
              UPDATE user_profiles
              SET avatar_sticker = ${stickerKey}, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else if (isExplicitDefault) {
            await sql`
              UPDATE user_profiles
              SET avatar_sticker = NULL, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else {
            console.warn(`[user/profile] avatar_sticker rejected for ${username}: invalid or above account level ${level}`);
          }
        }

        if (hasSeal) {
          const rawSeal = typeof seal === "string" ? seal.trim().toLowerCase() : "";
          const isExplicitDefault = seal == null || rawSeal === "" || rawSeal === "none";
          const sealKey = normalizeSealKey(seal, level, grants); // null when default/unknown/not owned
          if (sealKey) {
            await sql`
              UPDATE user_profiles
              SET proof_seal = ${sealKey}, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else if (isExplicitDefault) {
            await sql`
              UPDATE user_profiles
              SET proof_seal = NULL, updated_at = CURRENT_TIMESTAMP
              WHERE username = ${username}
            `;
          } else {
            console.warn(`[user/profile] proof_seal rejected for ${username}: not owned`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      birthDate: normalizedBirthDate,
    });
  } catch (error: any) {
    console.error("[api/user/profile] POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to update user profile",
      },
      { status: 500 }
    );
  }
}
