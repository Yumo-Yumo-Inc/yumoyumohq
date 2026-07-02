/**
 * Spending Tribe — the community layer of the Patterns page.
 *
 * A "tribe" is everyone who shares the viewer's primary trait (their class).
 * We surface real cohort counts, a class-based leaderboard, and places the
 * tribe frequents — but ONLY once the cohort is large enough to be meaningful.
 *
 * Honesty rules (CLAUDE.md):
 *   - No fabricated counts. Every number is a real row count — we show the real
 *     cohort even when it is tiny (1-2 people), never a made-up community.
 *   - No distance / "nearby" — merchant coordinates do not exist, so discovery
 *     is city + class based, never km-based.
 *   - All queries are defensive: if the identity columns are missing (migration
 *     097 not applied) every aggregate degrades to empty, never throws.
 */

import { db } from "@/lib/db/client";
import type { TraitKey } from "./identity-types";
import { getSpendingIdentity } from "./compute-identity";

const LEADERBOARD_LIMIT = 6;
const DISCOVERY_LIMIT = 6;

export interface TribeMember {
  displayName: string | null;
  explorer: number | null;
  isYou: boolean;
}

export interface DiscoveryPlace {
  merchant: string;
  /** Distinct cohort members who have a receipt from this merchant. */
  visitors: number;
}

export interface TribeData {
  /** True when there is at least one same-city peer in the cohort (besides you);
   *  the UI shows the social layer with real counts, however small. */
  enough: boolean;
  /** Viewer's class (primary, secondary), or null when their identity is unread. */
  classKeys: [TraitKey, TraitKey] | null;
  city: string | null;
  /** Same-city peers who share the viewer's primary trait (excludes viewer). */
  cityClassCohort: number;
  /** Everyone who shares the viewer's primary trait, any city (excludes viewer). */
  globalClassCohort: number;
  /** All same-city users with any identity (excludes viewer). */
  cityPeers: number;
  leaderboard: TribeMember[];
  discovery: DiscoveryPlace[];
}

const EMPTY: Omit<TribeData, "classKeys" | "city"> = {
  enough: false,
  cityClassCohort: 0,
  globalClassCohort: 0,
  cityPeers: 0,
  leaderboard: [],
  discovery: [],
};

/**
 * CTE that derives each user's dominant city from their receipts (merchant_city),
 * normalized. The tribe's city signal comes from where people actually shop, not
 * the rarely-filled profile field. Downstream queries fall back to the profile
 * city only when no receipt carries one: COALESCE(uc.city, lower(btrim(up.city))).
 */
const CITY_CTE = `
WITH city_counts AS (
  SELECT username, lower(btrim(merchant_city)) AS city, count(*) AS n
  FROM receipts
  WHERE status IN ('completed','verified','scanned') AND btrim(coalesce(merchant_city,'')) <> ''
    AND (expense_type = 'personal' OR expense_type IS NULL)
  GROUP BY username, lower(btrim(merchant_city))
),
user_city AS (
  SELECT DISTINCT ON (username) username, city FROM city_counts ORDER BY username, n DESC
)`;

/** Normalize a city string to the form the SQL matches on. */
function normCity(city: string): string {
  return city.trim().toLocaleLowerCase("tr-TR");
}

/** Profile city as a fallback when the user's receipts carry no city. */
async function getProfileCity(username: string): Promise<string | null> {
  try {
    const { rows } = await db.query<{ city: string | null }>(
      `SELECT city FROM user_profiles WHERE username = $1 LIMIT 1`,
      [username],
    );
    const city = rows[0]?.city?.trim();
    return city && city.length > 0 ? city : null;
  } catch {
    return null;
  }
}

async function countScalar(text: string, params: unknown[]): Promise<number> {
  try {
    const { rows } = await db.query<{ n: string }>(text, params);
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

async function fetchLeaderboard(
  matchCity: string,
  primary: TraitKey,
  username: string,
): Promise<TribeMember[]> {
  try {
    const { rows } = await db.query<{
      username: string;
      display_name: string | null;
      explorer: string | null;
    }>(
      `
${CITY_CTE}
SELECT ubp.username,
       up.display_name,
       (ubp.identity_traits->>'explorer') AS explorer
FROM user_behavior_profile ubp
LEFT JOIN user_profiles up ON up.username = ubp.username
LEFT JOIN user_city uc ON uc.username = ubp.username
WHERE COALESCE(uc.city, lower(btrim(up.city))) = $1
  AND ubp.identity_primary = $2
ORDER BY (ubp.identity_traits->>'explorer')::numeric DESC NULLS LAST
LIMIT $3
`,
      [matchCity, primary, LEADERBOARD_LIMIT],
    );
    return rows.map((r) => ({
      displayName: r.display_name,
      explorer: r.explorer === null ? null : Number(r.explorer),
      isYou: r.username === username,
    }));
  } catch {
    return [];
  }
}

async function fetchDiscovery(
  matchCity: string,
  primary: TraitKey,
  username: string,
): Promise<DiscoveryPlace[]> {
  try {
    // Merchants frequented by the cohort (same city + class, excluding the
    // viewer), ranked by distinct visitors, excluding merchants the viewer has
    // already visited. Aggregate counts only — never per-user purchase data.
    const { rows } = await db.query<{ merchant: string; visitors: string }>(
      `
${CITY_CTE},
cohort AS (
  SELECT ubp.username
  FROM user_behavior_profile ubp
  LEFT JOIN user_profiles up ON up.username = ubp.username
  LEFT JOIN user_city uc ON uc.username = ubp.username
  WHERE COALESCE(uc.city, lower(btrim(up.city))) = $1
    AND ubp.identity_primary = $2
    AND ubp.username <> $3
),
visited AS (
  SELECT DISTINCT merchant_name FROM receipts
  WHERE username = $3 AND (expense_type = 'personal' OR expense_type IS NULL)
)
SELECT r.merchant_name AS merchant, COUNT(DISTINCT r.username) AS visitors
FROM receipts r
JOIN cohort c ON c.username = r.username
WHERE r.merchant_name IS NOT NULL
  AND (r.expense_type = 'personal' OR r.expense_type IS NULL)
  AND r.merchant_name NOT IN (SELECT merchant_name FROM visited)
GROUP BY r.merchant_name
ORDER BY visitors DESC, r.merchant_name ASC
LIMIT $4
`,
      [matchCity, primary, username, DISCOVERY_LIMIT],
    );
    return rows
      .map((r) => ({ merchant: r.merchant, visitors: Number(r.visitors) }))
      .filter((p) => p.visitors > 0);
  } catch {
    return [];
  }
}

/**
 * Compute the viewer's tribe. Computing the identity also persists their class
 * (best-effort), so cohorts grow as users open the page.
 */
export async function getTribe(username: string): Promise<TribeData> {
  const identity = await getSpendingIdentity(username);
  const classKeys = identity.classKeys;
  // City comes from where the user shops (receipts), profile field is fallback.
  const city = identity.homeCity ?? (await getProfileCity(username));

  // Without a class or a city we cannot place the user in a cohort.
  if (!classKeys || !city) {
    return { ...EMPTY, classKeys, city };
  }

  const primary = classKeys[0];
  const matchCity = normCity(city);
  const [cityClassCohort, globalClassCohort, cityPeers] = await Promise.all([
    countScalar(
      `
${CITY_CTE}
SELECT COUNT(*) AS n
FROM user_behavior_profile ubp
LEFT JOIN user_profiles up ON up.username = ubp.username
LEFT JOIN user_city uc ON uc.username = ubp.username
WHERE COALESCE(uc.city, lower(btrim(up.city))) = $1 AND ubp.identity_primary = $2 AND ubp.username <> $3
`,
      [matchCity, primary, username],
    ),
    countScalar(
      `SELECT COUNT(*) AS n FROM user_behavior_profile WHERE identity_primary = $1 AND username <> $2`,
      [primary, username],
    ),
    countScalar(
      `
${CITY_CTE}
SELECT COUNT(*) AS n
FROM user_behavior_profile ubp
LEFT JOIN user_profiles up ON up.username = ubp.username
LEFT JOIN user_city uc ON uc.username = ubp.username
WHERE COALESCE(uc.city, lower(btrim(up.city))) = $1 AND ubp.identity_primary IS NOT NULL AND ubp.username <> $2
`,
      [matchCity, username],
    ),
  ]);

  // Show the real cohort however small; only "alone" (no same-class peers in
  // the city) falls back to the empty state.
  const enough = cityClassCohort > 0;

  const [leaderboard, discovery] = await Promise.all([
    fetchLeaderboard(matchCity, primary, username),
    fetchDiscovery(matchCity, primary, username),
  ]);

  return {
    enough,
    classKeys,
    city,
    cityClassCohort,
    globalClassCohort,
    cityPeers,
    leaderboard,
    discovery,
  };
}
