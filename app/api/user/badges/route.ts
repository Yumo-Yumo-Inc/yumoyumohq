/**
 * Badges + title selection for the signed-in user.
 *
 * GET   /api/user/badges  — earned badges, full catalog, earned/active titles,
 *                           and the pinned showcase (account-level-12 unlock).
 * PATCH /api/user/badges  — { activeTitle?: string | null,
 *                            showcasedBadges?: string[] } — partial: only the
 *                            fields present are written.
 *
 * Earned titles are DERIVED (not a separate table): from the user's highest
 * Genesis tier award + participation. The user picks ONE to display
 * (user_profiles.active_title). Showcased badges are the earned badge keys the
 * user pins to their profile (user_profiles.showcased_badges JSON, capped).
 * PATCH validates every choice is actually earned.
 */

import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { sql } from "@/lib/db/client";
import { GENESIS_SEASON, getEarnedTitleKeys } from "@/config/seasons";
import { getAccountLevelFromXp } from "@/config/account-level-config";
import { earnedAccountTitleKeys } from "@/config/account-titles";
import { BADGE_SHOWCASE_LEVEL, MAX_SHOWCASED_BADGES } from "@/config/account-unlocks";
import { getSeasonPassGrants } from "@/lib/season/pass-grants";
import { hasCapability } from "@/config/season-capabilities";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Self-healing column create (badges route runs its own SQL, no table ensure). */
let showcaseColumnEnsured = false;
async function ensureShowcaseColumn(): Promise<void> {
  if (showcaseColumnEnsured || !sql) return;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS showcased_badges TEXT`;
  showcaseColumnEnsured = true;
}

/** Parse the stored showcase JSON to a clean key array, filtered + capped at `max`. */
function parseShowcase(raw: string | null, earnedKeys: Set<string>, max: number): string[] {
  if (!raw) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (typeof v !== "string") continue;
    if (!earnedKeys.has(v) || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

/** Highest Genesis tier reached + whether the user participated in Genesis. */
async function getGenesisStanding(
  username: string,
): Promise<{ tierIndex: number | null; participated: boolean }> {
  if (!sql) return { tierIndex: null, participated: false };

  const awardRows = (await sql`
    SELECT tier_index FROM season_tier_awards
    WHERE season_number = ${GENESIS_SEASON.seasonNumber} AND username = ${username}
    LIMIT 1
  `) as Array<{ tier_index: number }>;
  const awardedTier = awardRows[0]?.tier_index ?? null;

  // Live participation: Genesis active and the user has season XP (award not written until close).
  const liveRows = (await sql`
    SELECT COALESCE(up.season_xp, 0)::int AS season_xp
    FROM user_profiles up
    JOIN seasons s ON s.season_number = ${GENESIS_SEASON.seasonNumber} AND s.status = 'active'
    WHERE up.username = ${username}
    LIMIT 1
  `) as Array<{ season_xp: number }>;
  const liveXp = Number(liveRows[0]?.season_xp ?? 0);

  return {
    tierIndex: awardedTier != null ? Number(awardedTier) : null,
    participated: awardedTier != null || liveXp > 0,
  };
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  await ensureShowcaseColumn();

  const earned = await sql`
    SELECT b.key, b.title, b.description, b.icon_url, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.username = ${username}
    ORDER BY ub.earned_at DESC
  `;
  const catalog = await sql`SELECT key, title, description, icon_url FROM badges ORDER BY id ASC`;

  const profileRows = (await sql`
    SELECT active_title, showcased_badges, COALESCE(account_xp, 0)::int AS account_xp
    FROM user_profiles WHERE username = ${username} LIMIT 1
  `) as Array<{ active_title: string | null; showcased_badges: string | null; account_xp: number }>;
  const activeTitle = profileRows[0]?.active_title ?? null;
  const accountLevel = getAccountLevelFromXp(Number(profileRows[0]?.account_xp ?? 0) || 0);

  const earnedKeys = new Set((earned as Array<{ key: string }>).map((b) => b.key));
  // Season "Extra Badge Slot" capability grants +1 showcase slot while held.
  const grants = await getSeasonPassGrants(username);
  const showcaseMax = MAX_SHOWCASED_BADGES + (hasCapability(grants, "showcase_slot") ? 1 : 0);
  const showcasedBadges = parseShowcase(profileRows[0]?.showcased_badges ?? null, earnedKeys, showcaseMax);

  const standing = await getGenesisStanding(username);
  // Two title sources feed the single active_title slot: season standing +
  // account level. Union both so account titles (L7/L18/L38) are selectable.
  const earnedTitles = [
    ...getEarnedTitleKeys(GENESIS_SEASON, standing.tierIndex, standing.participated),
    ...earnedAccountTitleKeys(accountLevel),
  ];

  return NextResponse.json({
    earnedBadges: earned,
    catalog,
    titles: { earned: earnedTitles, active: activeTitle },
    showcase: { badges: showcasedBadges, unlocked: accountLevel >= BADGE_SHOWCASE_LEVEL, max: showcaseMax },
  });
}

export async function PATCH(req: Request) {
  const username = await getSessionUsername();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  let body: { activeTitle?: unknown; showcasedBadges?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  await ensureShowcaseColumn();

  const hasTitle = Object.prototype.hasOwnProperty.call(body, "activeTitle");
  const hasShowcase = Object.prototype.hasOwnProperty.call(body, "showcasedBadges");
  if (!hasTitle && !hasShowcase) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const next = body.activeTitle;
  if (hasTitle && next !== null && typeof next !== "string") {
    return NextResponse.json({ error: "activeTitle must be a string or null" }, { status: 400 });
  }
  if (hasShowcase && body.showcasedBadges !== null && !Array.isArray(body.showcasedBadges)) {
    return NextResponse.json({ error: "showcasedBadges must be an array or null" }, { status: 400 });
  }

  // Level + earned sets are resolved once; both writes are gated server-side.
  const standing = await getGenesisStanding(username);
  const levelRows = (await sql`
    SELECT COALESCE(account_xp, 0)::int AS account_xp FROM user_profiles WHERE username = ${username} LIMIT 1
  `) as Array<{ account_xp: number }>;
  const accountLevel = getAccountLevelFromXp(Number(levelRows[0]?.account_xp ?? 0) || 0);

  if (hasTitle && next !== null) {
    const earnedTitles = [
      ...getEarnedTitleKeys(GENESIS_SEASON, standing.tierIndex, standing.participated),
      ...earnedAccountTitleKeys(accountLevel),
    ];
    if (!earnedTitles.includes(next as string)) {
      return NextResponse.json({ error: "title not earned" }, { status: 403 });
    }
    await sql`UPDATE user_profiles SET active_title = ${next as string}, updated_at = now() WHERE username = ${username}`;
  } else if (hasTitle && next === null) {
    await sql`UPDATE user_profiles SET active_title = NULL, updated_at = now() WHERE username = ${username}`;
  }

  let showcaseOut: string[] = [];
  if (hasShowcase) {
    // Clearing (null/empty) is always allowed; pinning requires the unlock level.
    const requested = Array.isArray(body.showcasedBadges) ? body.showcasedBadges : [];
    if (requested.length > 0 && accountLevel < BADGE_SHOWCASE_LEVEL) {
      return NextResponse.json({ error: "badge showcase not unlocked" }, { status: 403 });
    }
    const earnedRows = (await sql`
      SELECT b.key FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.username = ${username}
    `) as Array<{ key: string }>;
    const earnedKeys = new Set(earnedRows.map((r) => r.key));
    const grants = await getSeasonPassGrants(username);
    const writeMax = MAX_SHOWCASED_BADGES + (hasCapability(grants, "showcase_slot") ? 1 : 0);
    const seen = new Set<string>();
    for (const v of requested) {
      if (typeof v !== "string" || !earnedKeys.has(v) || seen.has(v)) continue;
      seen.add(v);
      showcaseOut.push(v);
      if (showcaseOut.length >= writeMax) break;
    }
    const stored = showcaseOut.length > 0 ? JSON.stringify(showcaseOut) : null;
    await sql`UPDATE user_profiles SET showcased_badges = ${stored}, updated_at = now() WHERE username = ${username}`;
  }

  return NextResponse.json({
    ok: true,
    ...(hasTitle ? { activeTitle: next } : {}),
    ...(hasShowcase ? { showcasedBadges: showcaseOut } : {}),
  });
}
