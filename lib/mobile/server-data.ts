import { getAccountLevelFromXp } from "@/config/account-level-config";
import { getSeasonLevelFromXp } from "@/config/season-level-config";
import { getPrimaryAdmin, isAdminUser } from "@/lib/auth/admin-users";
import { cacheRead } from "@/lib/cache/redis";
import { sql, warmUpConnection } from "@/lib/db/client";
import { buildOfflineInsightsRecord } from "@/lib/insights/offline-summary";
import type { ReceiptSummary } from "@/lib/insights/types";
import type { LeaderboardEntry } from "@/lib/mock/types";
import {
  CURRENT_APP_CONFIG_ID,
  CURRENT_PROFILE_ID,
  CURRENT_PROGRESS_ID,
  CURRENT_WALLET_ID,
  MONTHLY_DASHBOARD_ID,
  type BootstrapPayload,
  type CachedAppConfigRecord,
  type CachedDashboardSummaryRecord,
  type DeletionRecord,
  type CachedProgressRecord,
  type CachedQuestRecord,
  type CachedReceiptRecord,
  type CachedLeaderboardRecord,
  type CachedLeaderboardType,
  type CachedNotificationRecord,
  type CachedUserProfileRecord,
  type CachedWalletRecord,
  type SyncPayload,
} from "@/lib/offline/types";
import { autoCompleteEligibleDailyQuests } from "@/lib/quests/auto-complete-daily";
import { ensureDailyQuestsForUser } from "@/lib/quests/daily-generator";
import { withDailyEnsureCache, withWeeklyEnsureCache } from "@/lib/quests/ensure-cache";
import { ensureWeeklyQuestsForUser } from "@/lib/quests/weekly-generator";
import type { WeeklyQuestType } from "@/lib/quests/schema";
import { getWeekBounds, getWeeklyQuestSelectionState, syncWeeklyQuestProgress } from "@/lib/quests/weekly-progress";
import { getReceiptsForInsights } from "@/lib/receipt/storage-db";
import { getUserCountry } from "@/lib/storage/user-country-storage";
import { getUserProfile } from "@/lib/storage/user-profile-storage";
import type { MobileActionResult, MobileLevelEvent } from "@/lib/mobile/action-result-types";
import { normalizeCountryCode } from "@/lib/shared/countries";
import { formatDateOnly } from "@/lib/shared/date-only";
import { getLocalDateStringForCountry } from "@/lib/streak/timezone";

function toRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "rows" in value && Array.isArray((value as { rows?: unknown[] }).rows)) {
    return ((value as { rows: unknown[] }).rows ?? []) as T[];
  }
  return [];
}

function toIso(value: unknown, fallback: string): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return fallback;
}

function toVersion(updatedAt: string): number {
  const value = Date.parse(updatedAt);
  return Number.isFinite(value) ? value : Date.now();
}

type MobileProfileBundle = {
  profile: CachedUserProfileRecord | null;
  progress: CachedProgressRecord | null;
  wallet: CachedWalletRecord | null;
};

async function resolveWithFallback<T>(
  label: string,
  task: Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await task;
  } catch (error) {
    console.warn(`[mobile/server-data] ${label} failed, using fallback:`, error);
    return fallback;
  }
}

const MOBILE_SYNC_TIMING_ENABLED =
  process.env.NODE_ENV !== "production" || process.env.MOBILE_SYNC_TIMING === "1";

async function measureSyncStep<T>(label: string, task: Promise<T>): Promise<T> {
  if (!MOBILE_SYNC_TIMING_ENABLED) {
    return task;
  }

  const startedAt = Date.now();
  try {
    return await task;
  } finally {
    const elapsed = Date.now() - startedAt;
    console.info(`[mobile/sync] ${label} took ${elapsed}ms`);
  }
}

async function getProfileBundle(username: string, serverTime: string) {
  const [profile, storedCountry] = await Promise.all([getUserProfile(username), getUserCountry(username)]);
  const fallbackUpdatedAt = serverTime;

  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
    const fallbackProfile: CachedUserProfileRecord = {
      id: CURRENT_PROFILE_ID,
      username,
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      gender: profile?.gender ?? null,
      birthDate: formatDateOnly(profile?.birthDate) ?? null,
      occupation: profile?.occupation ?? null,
      city: profile?.city ?? null,
      country: storedCountry ?? profile?.country ?? null,
      website: profile?.website ?? null,
      bio: profile?.bio ?? null,
      declaredMonthlyIncomeBand: null,
      honor: profile?.honor ?? 50,
      isAdmin: isAdminUser(username),
      updated_at: fallbackUpdatedAt,
      version: toVersion(fallbackUpdatedAt),
    };
    const fallbackProgress: CachedProgressRecord = {
      id: CURRENT_PROGRESS_ID,
      accountLevel: 1,
      accountXp: 0,
      seasonLevel: 1,
      seasonXp: 0,
      streak: 0,
      checkedInToday: false,
      currentSeason: null,
      updated_at: fallbackUpdatedAt,
      version: toVersion(fallbackUpdatedAt),
    };
    const fallbackWallet: CachedWalletRecord = {
      id: CURRENT_WALLET_ID,
      address: null,
      contributionTotal: 0,
      contributionFromReceipts: 0,
      contributionFromQuests: 0,
      contributionReceipts: 0,
      lastContributionAt: null,
      updated_at: fallbackUpdatedAt,
      version: toVersion(fallbackUpdatedAt),
    };
    return {
      profile: fallbackProfile,
      progress: fallbackProgress,
      wallet: fallbackWallet,
    };
  }

  await warmUpConnection();
  const todayStr = getLocalDateStringForCountry(
    normalizeCountryCode(storedCountry) || normalizeCountryCode(profile?.country) || null
  );
  const [profileRow, seasonRow, checkedInRow, walletRow, contributionRow] = await Promise.all([
    sql`
      SELECT
        account_level,
        account_xp,
        season_level,
        season_xp,
        streak,
        display_name,
        avatar_url,
        gender,
        birth_date,
        occupation,
        city,
        country,
        website,
        bio,
        declared_monthly_income_band,
        honor,
        updated_at
      FROM user_profiles
      WHERE username = ${username}
      LIMIT 1
    `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null),
    sql`
      SELECT id, season_number, name, start_at, end_at
      FROM seasons
      WHERE status = 'active'
      ORDER BY start_at DESC
      LIMIT 1
    `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null),
    sql`
      SELECT 1
      FROM check_ins
      WHERE username = ${username}
        AND check_in_date = ${todayStr}::date
      LIMIT 1
    `.then((result) => toRows(result).length > 0).catch(() => false),
    sql`
      SELECT wallet_address, COALESCE(updated_at, created_at) AS updated_at
      FROM receipts
      WHERE username = ${username}
        AND wallet_address IS NOT NULL
        AND trim(wallet_address) != ''
      ORDER BY COALESCE(updated_at, created_at) DESC
      LIMIT 1
    `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null).catch(() => null),
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
    `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null).catch(() => null),
  ]);

  const accountXp = Number(profileRow?.account_xp ?? 0) || 0;
  const seasonXp = Number(profileRow?.season_xp ?? 0) || 0;
  const accountLevel = getAccountLevelFromXp(accountXp);
  const seasonLevel = getSeasonLevelFromXp(seasonXp);
  const updatedAt = toIso(profileRow?.updated_at, fallbackUpdatedAt);
  const canonicalCountry =
    normalizeCountryCode(storedCountry) ||
    normalizeCountryCode(profileRow?.country as string | null) ||
    normalizeCountryCode(profile?.country) ||
    null;

  const profileRecord: CachedUserProfileRecord = {
    id: CURRENT_PROFILE_ID,
    username,
    displayName: (profileRow?.display_name as string | null) ?? profile?.displayName ?? null,
    avatarUrl: (profileRow?.avatar_url as string | null) ?? profile?.avatarUrl ?? null,
    gender: (profileRow?.gender as string | null) ?? profile?.gender ?? null,
    birthDate:
      formatDateOnly(profileRow?.birth_date) ??
      formatDateOnly(profile?.birthDate) ??
      null,
    occupation: (profileRow?.occupation as string | null) ?? profile?.occupation ?? null,
    city: (profileRow?.city as string | null) ?? profile?.city ?? null,
    country: canonicalCountry,
    website: (profileRow?.website as string | null) ?? profile?.website ?? null,
    bio: (profileRow?.bio as string | null) ?? profile?.bio ?? null,
    declaredMonthlyIncomeBand: (profileRow?.declared_monthly_income_band as string | null) ?? null,
    honor: Number(profileRow?.honor ?? profile?.honor ?? 50) || 50,
    isAdmin: isAdminUser(username),
    updated_at: serverTime,
    // Key off sync moment (like wallet) so every bootstrap/sync can replace a stale
    // IndexedDB country when users.country was updated server-side.
    version: toVersion(serverTime),
  };

  const progressRecord: CachedProgressRecord = {
    id: CURRENT_PROGRESS_ID,
    accountLevel,
    accountXp,
    seasonLevel,
    seasonXp,
    streak: Number(profileRow?.streak ?? 0) || 0,
    checkedInToday: checkedInRow === true,
    currentSeason: seasonRow
      ? {
          id: Number(seasonRow.id ?? 0),
          seasonNumber: Number(seasonRow.season_number ?? 1),
          name: String(seasonRow.name ?? ""),
          startAt: toIso(seasonRow.start_at, serverTime),
          endAt: toIso(seasonRow.end_at, serverTime),
        }
      : null,
    updated_at: updatedAt,
    version: toVersion(updatedAt),
  };

  const walletUpdatedAt = toIso(walletRow?.updated_at ?? profileRow?.updated_at, updatedAt);
  const contribution = contributionRow as {
    total_contribution_points?: number | string;
    receipt_contribution_points?: number | string;
    quest_contribution_points?: number | string;
    contribution_receipts?: number | string;
    last_contribution_at?: string | null;
  } | null;
  const walletRecord: CachedWalletRecord = {
    id: CURRENT_WALLET_ID,
    address: (walletRow?.wallet_address as string | null) ?? null,
    contributionTotal: Number(contribution?.total_contribution_points ?? 0) || 0,
    contributionFromReceipts: Number(contribution?.receipt_contribution_points ?? 0) || 0,
    contributionFromQuests: Number(contribution?.quest_contribution_points ?? 0) || 0,
    contributionReceipts: Number(contribution?.contribution_receipts ?? 0) || 0,
    lastContributionAt: contribution?.last_contribution_at ?? null,
    updated_at: walletUpdatedAt,
    // Version is keyed off the sync moment (serverTime), not a profile/receipt
    // timestamp. cPoints can change (receipt verified, quest) without bumping
    // user_profiles.updated_at; keying the wallet version off serverTime makes
    // every successful sync strictly newer so a fresh contributionTotal always
    // wins the versioned write guard (was: header cPoints frozen for days).
    version: toVersion(serverTime),
  };

  return {
    profile: profileRecord,
    progress: progressRecord,
    wallet: walletRecord,
  };
}

async function getReceiptRecords(
  username: string,
  options?: { limit?: number; since?: string | null }
): Promise<CachedReceiptRecord[]> {
  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
    return [];
  }

  await warmUpConnection();
  const since = options?.since?.trim() ? options.since.trim() : null;
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 200));

  const rows = toRows<Record<string, unknown>>(
    since
      ? await sql`
          SELECT
            r.receipt_id,
            r.username,
            r.status,
            r.created_at,
            r.updated_at,
            r.wallet_address,
            r.merchant_name,
            r.merchant_country,
            r.merchant_category,
            r.merchant_place_id,
            r.extraction_date_value,
            r.extraction_time_value,
            r.pricing_total_paid,
            r.pricing_vat_amount,
            r.pricing_paid_ex_tax,
            r.pricing_currency,
            r.hidden_cost_core,
            r.hidden_cost_breakdown_import_system,
            r.hidden_cost_breakdown_retail_hidden,
            r.hidden_cost_reference_price,
            cpe.points_delta AS contribution_points
          FROM receipts r
          LEFT JOIN contribution_point_events cpe
            ON cpe.reference_id = r.receipt_id AND cpe.source_type = 'receipt_verified'
          WHERE r.username = ${username}
            AND COALESCE(r.updated_at, r.created_at) > ${since}
          ORDER BY COALESCE(r.updated_at, r.created_at) DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            r.receipt_id,
            r.username,
            r.status,
            r.created_at,
            r.updated_at,
            r.wallet_address,
            r.merchant_name,
            r.merchant_country,
            r.merchant_category,
            r.merchant_place_id,
            r.extraction_date_value,
            r.extraction_time_value,
            r.pricing_total_paid,
            r.pricing_vat_amount,
            r.pricing_paid_ex_tax,
            r.pricing_currency,
            r.hidden_cost_core,
            r.hidden_cost_breakdown_import_system,
            r.hidden_cost_breakdown_retail_hidden,
            r.hidden_cost_reference_price,
            cpe.points_delta AS contribution_points
          FROM receipts r
          LEFT JOIN contribution_point_events cpe
            ON cpe.reference_id = r.receipt_id AND cpe.source_type = 'receipt_verified'
          WHERE r.username = ${username}
          ORDER BY COALESCE(r.updated_at, r.created_at) DESC
          LIMIT ${limit}
        `
  );
  return rows.map((row) => {
    const updatedAt = toIso(row.updated_at ?? row.created_at, new Date().toISOString());
    const hiddenCostCore = Number(row.hidden_cost_core ?? 0) || 0;
    const totalPaid = Number(row.pricing_total_paid ?? 0) || 0;
    // import/retail breakdown columns are slices of core — not additive (was doubling hidden in UI)
    const hiddenTotal =
      totalPaid > 0 ? Math.min(hiddenCostCore, totalPaid) : hiddenCostCore;
    return {
      id: String(row.receipt_id ?? ""),
      receiptId: String(row.receipt_id ?? ""),
      status: String(row.status ?? "pending"),
      createdAt: row.created_at ? toIso(row.created_at, updatedAt) : null,
      merchantName: (row.merchant_name as string | null) ?? null,
      merchantCountry: (row.merchant_country as string | null) ?? null,
      merchantCategory: (row.merchant_category as string | null) ?? null,
      merchantPlaceId: (row.merchant_place_id as string | null) ?? null,
      totalPaid,
      vatAmount: Number(row.pricing_vat_amount ?? 0) || 0,
      paidExTax: Number(row.pricing_paid_ex_tax ?? 0) || 0,
      currency: String(row.pricing_currency ?? "USD"),
      hiddenCostCore,
      hiddenTotal,
      contributionPoints: Number(row.contribution_points ?? 0) || 0,
      extractionDate: (row.extraction_date_value as string | null) ?? null,
      extractionTime: (row.extraction_time_value as string | null) ?? null,
      walletAddress: (row.wallet_address as string | null) ?? null,
      username: (row.username as string | null) ?? null,
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    } satisfies CachedReceiptRecord;
  });
}

/**
 * Line-item delta for on-device insight engines.
 *
 * Scope:
 *   • Only this user's receipts (joined via `receipts.username`).
 *   • Last 6 months — plenty of runway for own-price tracking and category
 *     drift without blowing up IndexedDB.
 *   • When `since` is provided, returns line items whose parent receipt or
 *     the line item itself has been updated after that cursor. This keeps
 *     incremental sync cheap.
 */
async function getReceiptLineItemRecords(
  username: string,
  options?: { since?: string | null; limit?: number }
): Promise<import("@/lib/offline/types").CachedReceiptLineItem[]> {
  if (!process.env.DATABASE_URL || !sql) return [];
  await warmUpConnection();

  const since = options?.since?.trim() ? options!.since!.trim() : null;
  const limit = Math.max(1, Math.min(options?.limit ?? 2000, 5000));

  // 6-month window cutoff — applied regardless of `since` to cap the worst case.
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  const cutoffIso = cutoff.toISOString();

  let rows: Record<string, unknown>[] = [];
  try {
    rows = toRows<Record<string, unknown>>(
      since
        ? await sql`
            SELECT
              rli.id,
              rli.receipt_id,
              rli.raw_name,
              rli.canonical_name,
              rli.brand,
              rli.category_lvl1,
              rli.category_lvl2,
              rli.pack_size,
              rli.unit_type,
              rli.quantity,
              rli.unit_price_gross,
              rli.line_total_gross,
              rli.discount_amount,
              rli.observed_at AS rli_observed_at,
              r.extraction_date_value,
              r.extraction_time_value,
              r.created_at AS receipt_created_at,
              r.updated_at AS receipt_updated_at,
              r.pricing_currency
            FROM receipt_line_items rli
            JOIN receipts r ON r.receipt_id = rli.receipt_id
            WHERE r.username = ${username}
              AND COALESCE(r.updated_at, r.created_at) > ${cutoffIso}
              AND (
                COALESCE(rli.observed_at, r.updated_at, r.created_at) > ${since}
                OR COALESCE(r.updated_at, r.created_at) > ${since}
              )
            ORDER BY COALESCE(r.updated_at, r.created_at) DESC, rli.id ASC
            LIMIT ${limit}
          `
        : await sql`
            SELECT
              rli.id,
              rli.receipt_id,
              rli.raw_name,
              rli.canonical_name,
              rli.brand,
              rli.category_lvl1,
              rli.category_lvl2,
              rli.pack_size,
              rli.unit_type,
              rli.quantity,
              rli.unit_price_gross,
              rli.line_total_gross,
              rli.discount_amount,
              rli.observed_at AS rli_observed_at,
              r.extraction_date_value,
              r.extraction_time_value,
              r.created_at AS receipt_created_at,
              r.updated_at AS receipt_updated_at,
              r.pricing_currency
            FROM receipt_line_items rli
            JOIN receipts r ON r.receipt_id = rli.receipt_id
            WHERE r.username = ${username}
              AND COALESCE(r.updated_at, r.created_at) > ${cutoffIso}
            ORDER BY COALESCE(r.updated_at, r.created_at) DESC, rli.id ASC
            LIMIT ${limit}
          `
    );
  } catch (error) {
    // The `receipt_line_items` table may not exist in dev environments that
    // predate the canonical pipeline. Degrade gracefully instead of failing
    // the entire bootstrap/sync.
    console.warn("[server-data] getReceiptLineItemRecords failed — returning empty set:", error);
    return [];
  }

  // Assign a stable lineIndex per receipt based on order.
  const lineIndexByReceipt = new Map<string, number>();

  return rows.map((row) => {
    const receiptId = String(row.receipt_id ?? "");
    const nextIndex = lineIndexByReceipt.get(receiptId) ?? 0;
    lineIndexByReceipt.set(receiptId, nextIndex + 1);

    const purchasedAtRaw =
      (row.extraction_date_value as string | null) ||
      (row.receipt_created_at as string | null) ||
      null;
    // If extraction_time_value exists, combine it; otherwise keep ISO date.
    let purchasedAt: string | null = null;
    if (purchasedAtRaw) {
      const time = (row.extraction_time_value as string | null) ?? null;
      if (time && /^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
        purchasedAt = `${purchasedAtRaw.slice(0, 10)}T${time.length === 5 ? `${time}:00` : time}Z`;
      } else {
        purchasedAt = toIso(purchasedAtRaw, new Date(0).toISOString());
      }
    }

    const updatedAt = toIso(
      row.rli_observed_at ?? row.receipt_updated_at ?? row.receipt_created_at,
      new Date().toISOString()
    );

    return {
      id: String(row.id ?? `${receiptId}:${nextIndex}`),
      receiptLineItemId: String(row.id ?? `${receiptId}:${nextIndex}`),
      receiptId,
      lineIndex: nextIndex,
      purchasedAt,
      rawName: (row.raw_name as string | null) ?? null,
      canonicalName: (row.canonical_name as string | null) ?? null,
      brand: (row.brand as string | null) ?? null,
      categoryLvl1: (row.category_lvl1 as string | null) ?? null,
      categoryLvl2: (row.category_lvl2 as string | null) ?? null,
      packSize: row.pack_size !== null && row.pack_size !== undefined ? Number(row.pack_size) : null,
      unitType: (row.unit_type as string | null) ?? null,
      quantity: Number(row.quantity ?? 1) || 1,
      unitPriceGross:
        row.unit_price_gross !== null && row.unit_price_gross !== undefined
          ? Number(row.unit_price_gross)
          : null,
      lineTotalGross:
        row.line_total_gross !== null && row.line_total_gross !== undefined
          ? Number(row.line_total_gross)
          : null,
      discountAmount: Number(row.discount_amount ?? 0) || 0,
      currency: String(row.pricing_currency ?? "USD"),
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    };
  });
}

async function getDashboardSummary(username: string, serverTime: string): Promise<CachedDashboardSummaryRecord> {
  const end = new Date(serverTime);
  end.setHours(23, 59, 59, 999);
  const start = new Date(serverTime);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
    return {
      id: MONTHLY_DASHBOARD_ID,
      period: "monthly",
      totalReceiptCount: 0,
      receiptCount: 0,
      totalSpent: 0,
      hiddenCostTotal: 0,
      currency: process.env.DEFAULT_CURRENCY?.trim() || "USD",
      updated_at: serverTime,
      version: toVersion(serverTime),
    };
  }

  await warmUpConnection();

  const [monthlyRows, countRow] = await Promise.all([
    sql`
      SELECT
        COALESCE(SUM(pricing_total_paid), 0)::float AS total_spent,
        COALESCE(SUM(hidden_cost_core), 0)::float AS hidden_cost_total,
        COUNT(*)::int AS receipt_count,
        MIN(pricing_currency) AS currency
      FROM receipts
      WHERE username = ${username}
        AND COALESCE(expense_type, 'personal') = 'personal'
        AND (
          (extraction_date_value IS NOT NULL AND extraction_date_value != ''
            AND extraction_date_value >= ${startStr} AND extraction_date_value <= ${endStr})
          OR
          ((extraction_date_value IS NULL OR extraction_date_value = '')
            AND created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()})
        )
    `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null),
    sql`
      SELECT COUNT(*)::int AS count
      FROM receipts
      WHERE username = ${username}
    `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null),
  ]);

  const currency =
    (monthlyRows?.currency as string | null)?.trim() ||
    (process.env.DEFAULT_CURRENCY?.trim() || "USD");

  return {
    id: MONTHLY_DASHBOARD_ID,
    period: "monthly",
    totalReceiptCount: Number(countRow?.count ?? 0) || 0,
    receiptCount: Number(monthlyRows?.receipt_count ?? 0) || 0,
    totalSpent: Number(monthlyRows?.total_spent ?? 0) || 0,
    hiddenCostTotal: Number(monthlyRows?.hidden_cost_total ?? 0) || 0,
    currency,
    updated_at: serverTime,
    version: toVersion(serverTime),
  };
}

async function getQuestRecords(username: string, serverTime: string): Promise<CachedQuestRecord[]> {
  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
    return [];
  }

  await warmUpConnection();
  const todayStr = serverTime.slice(0, 10);
  const seasonRow = await measureSyncStep(
    "quests.load-season",
    sql`
      SELECT id, season_number
      FROM seasons
      WHERE status = 'active'
      ORDER BY start_at DESC
      LIMIT 1
    `
  );
  const seasonNumber = Number((toRows<Record<string, unknown>>(seasonRow)[0] ?? {}).season_number ?? 1) || 1;

  // Ensure quests exist — wrapped in try/catch so failures don't kill the whole bootstrap.
  // Idempotent ensure operations are deduped via in-memory cache (5min TTL) so
  // repeat sync calls within the same warm function instance don't re-run the
  // existence-check SQL on every request. Using the canonical week-start
  // string from getWeekBounds keeps the cache key aligned with the weekly API.
  const { start: weekKey } = getWeekBounds(todayStr);
  await Promise.all([
    (async () => {
      try {
        await measureSyncStep(
          "quests.ensure-daily",
          withDailyEnsureCache(username, todayStr, () =>
            ensureDailyQuestsForUser(username, todayStr, seasonNumber)
          )
        );
      } catch (e) {
        console.error("[server-data] ensureDailyQuestsForUser failed:", e);
      }
    })(),
    (async () => {
      try {
        await measureSyncStep(
          "quests.ensure-weekly",
          withWeeklyEnsureCache(username, weekKey, () =>
            ensureWeeklyQuestsForUser(username, todayStr, seasonNumber)
          )
        );
      } catch (e) {
        console.error("[server-data] ensureWeeklyQuestsForUser failed:", e);
      }
    })(),
    (async () => {
      try {
        await measureSyncStep("quests.auto-complete-daily", autoCompleteEligibleDailyQuests(username, todayStr));
      } catch (e) {
        console.error("[server-data] autoCompleteEligibleDailyQuests failed:", e);
      }
    })(),
    (async () => {
      try {
        await measureSyncStep("quests.sync-weekly-progress", syncWeeklyQuestProgress(username, todayStr));
      } catch (e) {
        console.error("[server-data] syncWeeklyQuestProgress failed:", e);
      }
    })(),
  ]);

  // V2 query: fetch all daily quest types (new + legacy)
  // Falls back to old query if frequency column doesn't exist
  let dailyRows: Record<string, unknown>[];
  try {
    dailyRows = toRows<Record<string, unknown>>(
      await sql`
        SELECT
          uq.id, uq.progress, uq.target, uq.status,
          uq.completed_at, uq.updated_at,
          qt.type, qt.title, qt.reward_bint, qt.reward_season_xp
        FROM user_quests uq
        JOIN quest_templates qt ON uq.quest_template_id = qt.id
        WHERE uq.username = ${username}
          AND (
            qt.frequency = 'daily'
            OR qt.type IN ('D1','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','D14','D15','D16','D17','D_ADMIN_FREE_300XP')
            OR qt.type LIKE 'DD%' OR qt.type LIKE 'DS%' OR qt.type LIKE 'DC%'
          )
          AND qt.type NOT LIKE 'W%'
          AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
        ORDER BY qt.type, uq.id DESC
      `
    );
  } catch (e) {
    console.warn("[server-data] V2 daily query failed, using legacy:", e);
    try {
      dailyRows = toRows<Record<string, unknown>>(
        await sql`
          SELECT
            uq.id, uq.progress, uq.target, uq.status,
            uq.completed_at, uq.updated_at,
            qt.type, qt.title, qt.reward_bint, qt.reward_season_xp
          FROM user_quests uq
          JOIN quest_templates qt ON uq.quest_template_id = qt.id
          WHERE uq.username = ${username}
            AND qt.type IN ('D1','D3','D4','D5','D6','D7','D8','D9','D_ADMIN_FREE_300XP')
            AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
          ORDER BY qt.type, uq.id DESC
        `
      );
    } catch (legacyErr) {
      console.warn("[server-data] legacy daily query failed:", legacyErr);
      dailyRows = [];
    }
  }

  const dailyByType = new Map<string, CachedQuestRecord>();
  for (const row of dailyRows) {
    const updatedAt = toIso(row.updated_at ?? row.completed_at, serverTime);
    const record: CachedQuestRecord = {
      id: `daily:${row.id}`,
      questKind: "daily",
      questDate: todayStr,
      weekStart: null,
      weekEnd: null,
      type: String(row.type ?? ""),
      title: String(row.title ?? ""),
      progress: Number(row.progress ?? 0) || 0,
      target: Number(row.target ?? 1) || 1,
      status: String(row.status ?? "active"),
      completedAt: row.completed_at ? toIso(row.completed_at, updatedAt) : null,
      rewardRyumo: Number(row.reward_bint ?? 0) || 0,
      rewardSeasonXp: Number(row.reward_season_xp ?? 0) || 0,
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    };
    const existing = dailyByType.get(record.type);
    if (!existing || record.version > existing.version) {
      dailyByType.set(record.type, record);
    }
  }

  let selectionState: any = null;
  const weekBounds = getWeekBounds(todayStr);
  const start = weekBounds.start;
  const end = weekBounds.end;

  // V2 weekly query: all weekly types. Falls back to legacy if frequency column missing.
  let weeklyRows: Record<string, unknown>[];
  try {
    weeklyRows = toRows<Record<string, unknown>>(
      await sql`
        SELECT
          uq.id, uq.progress, uq.target, uq.status,
          uq.completed_at, uq.updated_at,
          qt.type, qt.title, qt.reward_bint, qt.reward_season_xp
        FROM user_quests uq
        JOIN quest_templates qt ON uq.quest_template_id = qt.id
        WHERE uq.username = ${username}
          AND (
            qt.frequency = 'weekly'
            OR qt.type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12')
            OR qt.type LIKE 'WD%' OR qt.type LIKE 'WS%' OR qt.type LIKE 'WC%'
          )
          AND qt.type NOT LIKE 'D%'
          AND uq.expires_at >= ${start}::date
          AND uq.expires_at < (${end}::date + INTERVAL '1 day')
        ORDER BY uq.created_at DESC
      `
    );
  } catch (e) {
    console.warn("[server-data] V2 weekly query failed, using legacy:", e);
    try {
      weeklyRows = toRows<Record<string, unknown>>(
        await sql`
          SELECT
            uq.id, uq.progress, uq.target, uq.status,
            uq.completed_at, uq.updated_at,
            qt.type, qt.title, qt.reward_bint, qt.reward_season_xp
          FROM user_quests uq
          JOIN quest_templates qt ON uq.quest_template_id = qt.id
          WHERE uq.username = ${username}
            AND qt.type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6')
            AND uq.expires_at >= ${start}::date
            AND uq.expires_at < (${end}::date + INTERVAL '1 day')
          ORDER BY uq.created_at DESC
          LIMIT 1
        `
      );
    } catch (legacyErr) {
      console.warn("[server-data] legacy weekly query failed:", legacyErr);
      weeklyRows = [];
    }
  }

  const questRecords = Array.from(dailyByType.values());
  if (weeklyRows.length > 0) {
    // V2: push ALL weekly quests (up to 4), not just the first one
    for (const row of weeklyRows) {
      const updatedAt = toIso(row.updated_at ?? row.completed_at, serverTime);
      questRecords.push({
        id: `weekly:${row.id}`,
        questKind: "weekly",
        questDate: null,
        weekStart: start,
        weekEnd: end,
        type: String(row.type ?? ""),
        title: String(row.title ?? ""),
        progress: Number(row.progress ?? 0) || 0,
        target: Number(row.target ?? 1) || 1,
        status: String(row.status ?? "active"),
        completedAt: row.completed_at ? toIso(row.completed_at, updatedAt) : null,
        rewardRyumo: Number(row.reward_bint ?? 0) || 0,
        rewardSeasonXp: Number(row.reward_season_xp ?? 0) || 0,
        updated_at: updatedAt,
        version: toVersion(updatedAt),
      });
    }
  } else {
    try {
      selectionState = await getWeeklyQuestSelectionState(username, todayStr);
    } catch (e) {
      console.warn("[server-data] getWeeklyQuestSelectionState failed, using empty weekly option progress:", e);
    }

    const optionRows = toRows<Record<string, unknown>>(
      await sql`
        SELECT id, type, title, reward_bint, reward_season_xp
        FROM quest_templates
        WHERE type IN ('W1A','W1B','W1C','W2','W3','W4','W5','W6')
      `
    );
    for (const row of optionRows) {
      const type = String(row.type ?? "") as WeeklyQuestType;
      questRecords.push({
        id: `weekly_option:${type}`,
        questKind: "weekly_option",
        questDate: null,
        weekStart: start,
        weekEnd: end,
        type,
        title: String(row.title ?? ""),
        progress: selectionState?.progressByType?.[type] ?? 0,
        target: selectionState?.targetsByType?.[type] ?? 1,
        status: "available",
        completedAt: null,
        rewardRyumo: Number(row.reward_bint ?? 0) || 0,
        rewardSeasonXp: Number(row.reward_season_xp ?? 0) || 0,
        updated_at: serverTime,
        version: toVersion(serverTime),
      });
    }
  }

  return questRecords;
}

async function getReceiptXpByMonth(username: string): Promise<Record<string, number>> {
  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
    return {};
  }
  await warmUpConnection();
  try {
    const rows = toRows<Record<string, unknown>>(
      await sql`
        SELECT
          to_char(created_at, 'YYYY-MM') AS month_key,
          COALESCE(SUM(xp_delta), 0)::int AS xp_total
        FROM account_xp_events
        WHERE username = ${username}
          AND source_type = 'receipt_verified'
        GROUP BY 1
      `
    );
    return rows.reduce<Record<string, number>>((accumulator, row) => {
      const key = String(row.month_key ?? "");
      if (key) {
        accumulator[key] = Number(row.xp_total ?? 0) || 0;
      }
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

async function getInsightsRecord(username: string, serverTime: string, _since?: string | null) {
  const limit = 2000;
  const hasDb = !!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) && !!sql;

  // Cheap freshness probe first: the latest receipt mutation timestamp. The sync
  // builder only ships the insights record when its version (this timestamp) is
  // newer than the client's last sync, so if nothing changed we can skip the
  // expensive 2000-row fetch + monthly-xp + totals entirely instead of building
  // a record that would be discarded.
  const latestReceiptRow = await measureSyncStep(
    "insights.load-latest-receipt",
    hasDb && sql
      ? sql`
          SELECT COALESCE(MAX(updated_at), MAX(created_at)) AS updated_at
          FROM receipts
          WHERE username = ${username}
        `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null)
      : Promise.resolve(null)
  );
  const latestUpdatedAt = toIso(latestReceiptRow?.updated_at, serverTime);

  if (_since && toVersion(latestUpdatedAt) <= toVersion(_since)) {
    return null;
  }

  const [receipts, xpByMonth, totalsRow] = await Promise.all([
    measureSyncStep("insights.load-receipts", getReceiptsForInsights(username, limit, 0)),
    measureSyncStep("insights.monthly-xp", getReceiptXpByMonth(username)),
    measureSyncStep(
      "insights.totals",
      hasDb && sql
        ? sql`
            SELECT
              COALESCE(SUM(pricing_total_paid), 0)::float AS total_spend,
              COALESCE(SUM(hidden_cost_core), 0)::float AS total_hidden_cost,
              COUNT(*)::int AS total_receipt_count
            FROM receipts
            WHERE username = ${username}
              AND (status = 'analyzed' OR status = 'verified' OR status = 'saved')
          `.then((result) => toRows<Record<string, unknown>>(result)[0] ?? null)
        : Promise.resolve(null)
    ),
  ]);
  const record = buildOfflineInsightsRecord({
    receipts: receipts as ReceiptSummary[],
    xpByMonth,
    updatedAt: latestUpdatedAt,
    version: toVersion(latestUpdatedAt),
  });

  if (totalsRow) {
    record.totalSpend = Number(totalsRow.total_spend) || 0;
    record.totalHiddenCost = Number(totalsRow.total_hidden_cost) || 0;
    record.totalReceiptCount = Number(totalsRow.total_receipt_count) || 0;
  }

  return record;
}

async function getNotificationRecords(
  username: string,
  serverTime: string,
  since?: string | null
): Promise<CachedNotificationRecord[]> {
  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
    return [];
  }

  await warmUpConnection();
  const rows = toRows<Record<string, unknown>>(
    since
      ? await sql`
          SELECT id, type, title, body, payload, receipt_id, read_at, created_at, COALESCE(read_at, created_at) AS updated_at
          FROM user_notifications
          WHERE username = ${username}
            AND type <> 'extra_hidden_cost'
            AND type <> 'receipt_ready_to_claim'
            AND COALESCE(read_at, created_at) > ${since}
          ORDER BY created_at DESC
          LIMIT 100
        `
      : await sql`
          SELECT id, type, title, body, payload, receipt_id, read_at, created_at, COALESCE(read_at, created_at) AS updated_at
          FROM user_notifications
          WHERE username = ${username}
            AND type <> 'extra_hidden_cost'
            AND type <> 'receipt_ready_to_claim'
          ORDER BY created_at DESC
          LIMIT 100
        `
  );

  return rows.map((row) => {
    const updatedAt = toIso(row.updated_at ?? row.created_at, serverTime);
    return {
      id: String(row.id ?? ""),
      notificationId: Number(row.id ?? 0) || 0,
      type: String(row.type ?? ""),
      title: (row.title as string | null) ?? null,
      body: (row.body as string | null) ?? null,
      payload: (row.payload as Record<string, unknown> | null) ?? {},
      receiptId: (row.receipt_id as string | null) ?? null,
      readAt: row.read_at ? toIso(row.read_at, updatedAt) : null,
      createdAt: toIso(row.created_at, updatedAt),
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    } satisfies CachedNotificationRecord;
  });
}

async function getReceiptDeletionRecords(
  username: string,
  since?: string | null
): Promise<DeletionRecord[]> {
  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql || !since?.trim()) {
    return [];
  }

  await warmUpConnection();
  const rows = toRows<Record<string, unknown>>(
    await sql`
      SELECT receipt_id
      FROM receipt_sync_deletions
      WHERE username = ${username}
        AND deleted_at > ${since.trim()}
      ORDER BY deleted_at DESC
      LIMIT 200
    `
  );

  return rows
    .map((row) => String(row.receipt_id ?? "").trim())
    .filter(Boolean)
    .map((receiptId) => ({
      store: "receipts",
      id: receiptId,
    }));
}

async function fetchLeaderboardEntries(
  type: CachedLeaderboardType,
  viewerUsername: string | null
): Promise<LeaderboardEntry[]> {
  if (!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) || !sql) {
    return [];
  }

  await warmUpConnection();
  const isAdmin = viewerUsername !== null && isAdminUser(viewerUsername);
  const dbSql = sql;
  let cutoffDate: Date | null = null;
  const now = new Date();

  if (type === "daily") {
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    cutoffDate.setHours(0, 0, 0, 0);
  } else if (type === "weekly") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - now.getDay());
    cutoffDate.setHours(0, 0, 0, 0);
  }

  const honorFilter = dbSql`AND (up.honor IS NULL OR up.honor > 0)`;
  let rows: Record<string, unknown>[] = [];

  if (type === "season") {
    rows = toRows<Record<string, unknown>>(await dbSql`
      SELECT 
        up.username,
        COALESCE(MAX(r.wallet_address), '') as address,
        COALESCE(up.display_name, up.username) as display_name,
        up.avatar_url as avatar_url,
        COALESCE(up.season_xp, 0)::int as season_xp,
        COALESCE(up.streak, 0)::int as streak,
        COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified'), 0) as hidden_cost_uncovered,
        COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') as receipts_verified,
        up.honor as honor
      FROM user_profiles up
      LEFT JOIN receipts r ON r.username = up.username
      WHERE up.username IS NOT NULL
        AND up.username != ${getPrimaryAdmin()}
        ${honorFilter}
      GROUP BY up.username, up.display_name, up.avatar_url, up.season_xp, up.streak, up.honor
      HAVING COALESCE(up.season_xp, 0) > 0 OR COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') > 0
      ORDER BY COALESCE(up.season_xp, 0) DESC, up.streak DESC, hidden_cost_uncovered DESC
      LIMIT 100
    `);
  } else if (cutoffDate) {
    rows = toRows<Record<string, unknown>>(await dbSql`
      SELECT 
        r.username,
        COALESCE(r.wallet_address, '') as address,
        COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') as receipts_verified,
        COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified'), 0) as hidden_cost_uncovered,
        COALESCE(up.display_name, r.username) as display_name,
        up.avatar_url as avatar_url,
        up.honor as honor
      FROM receipts r
      LEFT JOIN user_profiles up ON r.username = up.username
      WHERE r.username IS NOT NULL
        AND r.username != ${getPrimaryAdmin()}
        AND r.created_at >= ${cutoffDate.toISOString()}
        AND (r.status = 'analyzed' OR r.status = 'verified')
        ${honorFilter}
      GROUP BY r.username, r.wallet_address, up.display_name, up.avatar_url, up.honor
      HAVING COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') > 0
      ORDER BY hidden_cost_uncovered DESC, receipts_verified DESC
      LIMIT 100
    `);
  } else {
    rows = toRows<Record<string, unknown>>(await dbSql`
      SELECT 
        r.username,
        COALESCE(r.wallet_address, '') as address,
        COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') as receipts_verified,
        COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified'), 0) as hidden_cost_uncovered,
        COALESCE(up.display_name, r.username) as display_name,
        up.avatar_url as avatar_url,
        up.honor as honor
      FROM receipts r
      LEFT JOIN user_profiles up ON r.username = up.username
      WHERE r.username IS NOT NULL
        AND r.username != ${getPrimaryAdmin()}
        AND (r.status = 'analyzed' OR r.status = 'verified')
        ${honorFilter}
      GROUP BY r.username, r.wallet_address, up.display_name, up.avatar_url, up.honor
      HAVING COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') > 0
      ORDER BY hidden_cost_uncovered DESC, receipts_verified DESC
      LIMIT 100
    `);
  }

  const usernames = rows.map((row) => String(row.username ?? "")).filter(Boolean);
  const receiptDatesByUser: Record<string, Set<string>> = {};
  for (const username of usernames) {
    receiptDatesByUser[username] = new Set();
  }

  if (usernames.length > 0) {
    const dateRows = toRows<Record<string, unknown>>(await dbSql`
      SELECT DISTINCT
        r.username,
        DATE(r.created_at)::text as receipt_date
      FROM receipts r
      WHERE r.username = ANY(${usernames}::text[])
        AND (r.status = 'analyzed' OR r.status = 'verified')
        AND r.created_at >= NOW() - INTERVAL '400 days'
      ORDER BY r.username, receipt_date DESC
    `);

    for (const dateRow of dateRows) {
      const username = String(dateRow.username ?? "");
      const receiptDate = String(dateRow.receipt_date ?? "").split("T")[0].split(" ")[0];
      if (username && receiptDate) {
        receiptDatesByUser[username]?.add(receiptDate);
      }
    }
  }

  const calculateStreak = (username: string): number => {
    const receiptDates = receiptDatesByUser[username];
    if (!receiptDates || receiptDates.size === 0) return 0;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const startDate = receiptDates.has(todayStr)
      ? today
      : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
    const startStr = startDate.toISOString().split("T")[0];
    if (!receiptDates.has(startStr)) return 0;

    let streak = 1;
    const cursor = new Date(startDate);
    while (streak < 365) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      const dateStr = cursor.toISOString().split("T")[0];
      if (!receiptDates.has(dateStr)) break;
      streak += 1;
    }
    return streak;
  };

  const entries: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: index + 1,
    username: String(row.username ?? ""),
    address: String(row.address ?? ""),
    displayName: String(row.display_name ?? row.username ?? "Unknown"),
    avatarUrl: row.avatar_url != null ? String(row.avatar_url) : null,
    receiptsVerified: Number(row.receipts_verified ?? 0) || 0,
    hiddenCostUncovered: Number(row.hidden_cost_uncovered ?? 0) || 0,
    streakDays:
      type === "season"
        ? Number(row.streak ?? 0) || 0
        : calculateStreak(String(row.username ?? "")),
    badges: [
      ...(Number(row.receipts_verified ?? 0) >= 100 ? ["TROPHY"] : []),
      ...(Number(row.receipts_verified ?? 0) >= 50 ? ["STAR"] : []),
      ...(Number(row.receipts_verified ?? 0) >= 10 ? ["FIRE"] : []),
      ...(Number(row.hidden_cost_uncovered ?? 0) >= 10000 ? ["MONEY"] : []),
    ],
    honor: row.honor != null ? Number(row.honor) || 50 : 50,
  }));

  if (isAdmin && usernames.length > 0) {
    const totalAyumoByUser: Record<string, number> = Object.fromEntries(usernames.map((u) => [u, 0]));
    const totalRyumoByUser: Record<string, number> = Object.fromEntries(usernames.map((u) => [u, 0]));

    const ayumoRows = toRows<Record<string, unknown>>(await dbSql`
      SELECT r.username, COALESCE(SUM(r.hidden_cost_core), 0)::float as total_ayumo
      FROM receipts r
      WHERE r.username = ANY(${usernames}::text[])
        AND (r.status = 'analyzed' OR r.status = 'verified')
      GROUP BY r.username
    `);
    for (const row of ayumoRows) {
      if (row.username != null) totalAyumoByUser[String(row.username)] = Number(row.total_ayumo ?? 0) || 0;
    }

    const ryumoBalanceRows = toRows<Record<string, unknown>>(await dbSql`
      SELECT username, COALESCE(bint_balance, 0)::float as val
      FROM user_profiles
      WHERE username = ANY(${usernames}::text[])
    `);
    for (const row of ryumoBalanceRows) {
      if (row.username != null) totalRyumoByUser[String(row.username)] += Number(row.val ?? 0) || 0;
    }
    const ryumoBonusRows = toRows<Record<string, unknown>>(await dbSql`
      SELECT r.username, COALESCE(SUM(rr.bint_bonus_amount), 0)::float as val
      FROM receipts r
      LEFT JOIN receipt_rewards rr ON r.receipt_id = rr.receipt_id
      WHERE r.username = ANY(${usernames}::text[])
        AND (r.status = 'analyzed' OR r.status = 'verified')
      GROUP BY r.username
    `);
    for (const row of ryumoBonusRows) {
      if (row.username != null) totalRyumoByUser[String(row.username)] += Number(row.val ?? 0) || 0;
    }

    entries.forEach((entry) => {
      const username = entry.username ?? "";
      entry.totalAyumo = totalAyumoByUser[username] ?? 0;
      entry.totalRyumo = totalRyumoByUser[username] ?? 0;
    });
  }

  return entries;
}

/**
 * Cache TTL for the read-through leaderboard cache. 45 seconds is short enough
 * that a freshly-uploaded receipt shows up on the next sync after at most one
 * cycle, but long enough that the heavy aggregation query is amortized across
 * dozens of sync calls per user. The leaderboard is not real-time data and a
 * sub-minute lag is invisible to users.
 */
const LEADERBOARD_CACHE_TTL_SECONDS = 45;

async function fetchLeaderboardEntriesWithCache(
  type: CachedLeaderboardType,
  viewerUsername: string
): Promise<LeaderboardEntry[]> {
  // Admin users get extra columns (totalAyumo, totalRyumo) that aren't in the
  // shared cache shape — bypass cache for them. They're rare so cost is minimal.
  if (isAdminUser(viewerUsername)) {
    return fetchLeaderboardEntries(type, viewerUsername);
  }
  // The base leaderboard query is identical for all non-admin viewers, so we
  // share a single cache key per type. The function still receives `viewerUsername`
  // for any future per-viewer logic, but currently the response is shared.
  return cacheRead<LeaderboardEntry[]>(
    `lb:${type}`,
    LEADERBOARD_CACHE_TTL_SECONDS,
    () => fetchLeaderboardEntries(type, viewerUsername)
  );
}

// Leaderboards are disabled for now: no UI surface navigates to them, yet every
// sync ran four full-table aggregate queries (season/global/weekly/daily) against
// Neon — a large slice of per-sync compute. Flip to `true` to re-enable once a
// leaderboard screen exists and the queries are cached.
const LEADERBOARDS_ENABLED = false;

async function getLeaderboardRecords(
  username: string,
  serverTime: string
): Promise<CachedLeaderboardRecord[]> {
  if (!LEADERBOARDS_ENABLED) return [];
  const types: CachedLeaderboardType[] = ["season", "global", "weekly", "daily"];
  const versions = toVersion(serverTime);
  const results = await Promise.all(
    types.map((type) =>
      measureSyncStep(`leaderboards.${type}`, fetchLeaderboardEntriesWithCache(type, username))
    )
  );
  return types.map((type, index) => ({
    id: type,
    leaderboardType: type,
    entries: results[index],
    updated_at: serverTime,
    version: versions,
  }));
}

function buildAppConfigRecord(serverTime: string): CachedAppConfigRecord {
  return {
    id: CURRENT_APP_CONFIG_ID,
    server_time: serverTime,
    supportedInsightWindowMonths: 6,
    offlineFirstEnabled: true,
    updated_at: serverTime,
    version: toVersion(serverTime),
  };
}

export async function buildBootstrapPayloadForUser(username: string): Promise<BootstrapPayload> {
  const serverTime = new Date().toISOString();
  const emptyProfileBundle: MobileProfileBundle = {
    profile: null,
    progress: null,
    wallet: null,
  };
  const { listBudgets } = await import("@/lib/budgets/server");
  const { listSubscriptions } = await import("@/lib/subscriptions/server");
  const { listGoals } = await import("@/lib/goals/server");
  const { listCommitments } = await import("@/lib/commitments/server");
  const { listInsightEvents } = await import("@/lib/insights/events/server");
  const [
    profileBundle,
    dashboardSummary,
    receipts,
    quests,
    insights,
    notifications,
    leaderboards,
    budgets,
    subscriptions,
    financialGoals,
    lineItems,
    commitments,
    insightEvents,
  ] = await Promise.all([
    resolveWithFallback<MobileProfileBundle>(
      "profile bundle",
      getProfileBundle(username, serverTime),
      emptyProfileBundle
    ),
    resolveWithFallback("dashboard summary", getDashboardSummary(username, serverTime), null),
    resolveWithFallback("receipts", getReceiptRecords(username, { limit: 20 }), []),
    resolveWithFallback("quests", getQuestRecords(username, serverTime), []),
    resolveWithFallback("insights", getInsightsRecord(username, serverTime), null),
    resolveWithFallback("notifications", getNotificationRecords(username, serverTime), []),
    resolveWithFallback("leaderboards", getLeaderboardRecords(username, serverTime), []),
    resolveWithFallback("budgets", listBudgets(username), []),
    resolveWithFallback("subscriptions", listSubscriptions(username), []),
    resolveWithFallback("financial goals", listGoals(username), []),
    resolveWithFallback(
      "receipt line items",
      getReceiptLineItemRecords(username, { limit: 2000 }),
      []
    ),
    resolveWithFallback("commitments", listCommitments(username), []),
    resolveWithFallback("insight events", listInsightEvents(username, { limit: 200 }), []),
  ]);

  return {
    server_time: serverTime,
    profile: profileBundle.profile,
    wallet: profileBundle.wallet,
    progress: profileBundle.progress,
    dashboard_summary: dashboardSummary,
    receipts,
    quests,
    app_config: buildAppConfigRecord(serverTime),
    insights,
    notifications,
    leaderboards,
    budgets,
    subscriptions,
    financial_goals: financialGoals,
    receipt_line_items: lineItems,
    commitments,
    insight_events: insightEvents,
  };
}

export async function buildSyncPayloadForUser(username: string, lastSyncAt: string | null): Promise<SyncPayload> {
  const serverTime = new Date().toISOString();
  const lastSyncVersion = lastSyncAt ? toVersion(lastSyncAt) : 0;
  const emptyProfileBundle: MobileProfileBundle = {
    profile: null,
    progress: null,
    wallet: null,
  };
  const { listBudgets } = await import("@/lib/budgets/server");
  const { listSubscriptions } = await import("@/lib/subscriptions/server");
  const { listGoals } = await import("@/lib/goals/server");
  const { listCommitments } = await import("@/lib/commitments/server");
  const { listInsightEvents } = await import("@/lib/insights/events/server");
  const startedAt = Date.now();
  const [
    profileBundle,
    dashboardSummary,
    receipts,
    quests,
    insights,
    notifications,
    leaderboards,
    deletions,
    budgets,
    subscriptions,
    financialGoals,
    lineItems,
    commitments,
    insightEvents,
  ] = await Promise.all([
    measureSyncStep(
      "profile.bundle",
      resolveWithFallback<MobileProfileBundle>(
        "profile bundle",
        getProfileBundle(username, serverTime),
        emptyProfileBundle
      )
    ),
    measureSyncStep("dashboard.summary", resolveWithFallback("dashboard summary", getDashboardSummary(username, serverTime), null)),
    measureSyncStep("receipts", resolveWithFallback("receipts", getReceiptRecords(username, { since: lastSyncAt, limit: 200 }), [])),
    measureSyncStep("quests", resolveWithFallback("quests", getQuestRecords(username, serverTime), [])),
    measureSyncStep("insights", resolveWithFallback("insights", getInsightsRecord(username, serverTime, lastSyncAt), null)),
    measureSyncStep("notifications", resolveWithFallback("notifications", getNotificationRecords(username, serverTime, lastSyncAt), [])),
    measureSyncStep("leaderboards", resolveWithFallback("leaderboards", getLeaderboardRecords(username, serverTime), [])),
    measureSyncStep("receipt.deletions", resolveWithFallback("receipt deletions", getReceiptDeletionRecords(username, lastSyncAt), [])),
    measureSyncStep("budgets", resolveWithFallback("budgets", listBudgets(username), [])),
    measureSyncStep("subscriptions", resolveWithFallback("subscriptions", listSubscriptions(username), [])),
    measureSyncStep("financial.goals", resolveWithFallback("financial goals", listGoals(username), [])),
    measureSyncStep(
      "receipt.line-items",
      resolveWithFallback(
        "receipt line items",
        getReceiptLineItemRecords(username, { since: lastSyncAt, limit: 2000 }),
        []
      )
    ),
    measureSyncStep("commitments", resolveWithFallback("commitments", listCommitments(username), [])),
    measureSyncStep(
      "insight.events",
      resolveWithFallback(
        "insight events",
        listInsightEvents(username, { since: lastSyncAt, limit: 200 }),
        []
      )
    ),
  ]);

  if (MOBILE_SYNC_TIMING_ENABLED) {
    console.info(`[mobile/sync] payload for ${username} built in ${Date.now() - startedAt}ms`);
  }

  return {
    server_time: serverTime,
    profile:
      profileBundle.profile && (!lastSyncAt || profileBundle.profile.version > toVersion(lastSyncAt))
        ? profileBundle.profile
        : null,
    wallet:
      profileBundle.wallet && (!lastSyncAt || profileBundle.wallet.version > toVersion(lastSyncAt))
        ? profileBundle.wallet
        : null,
    progress:
      profileBundle.progress && (!lastSyncAt || profileBundle.progress.version > lastSyncVersion)
        ? profileBundle.progress
        : null,
    dashboard_summary:
      dashboardSummary && (!lastSyncAt || dashboardSummary.version > lastSyncVersion)
        ? dashboardSummary
        : null,
    receipts,
    quests: !lastSyncAt ? quests : quests.filter((record) => record.version > lastSyncVersion),
    app_config: buildAppConfigRecord(serverTime),
    insights: insights && (!lastSyncAt || insights.version > lastSyncVersion) ? insights : null,
    notifications,
    leaderboards,
    deletions,
    budgets: lastSyncAt
      ? budgets.filter((record) => record.version > lastSyncVersion)
      : budgets,
    subscriptions: lastSyncAt
      ? subscriptions.filter((record) => record.version > lastSyncVersion)
      : subscriptions,
    financial_goals: lastSyncAt
      ? financialGoals.filter((record) => record.version > lastSyncVersion)
      : financialGoals,
    receipt_line_items: lastSyncAt
      ? lineItems.filter((record) => record.version > lastSyncVersion)
      : lineItems,
    commitments: lastSyncAt
      ? commitments.filter((record) => record.version > lastSyncVersion)
      : commitments,
    insight_events: lastSyncAt
      ? insightEvents.filter((record) => record.version > lastSyncVersion)
      : insightEvents,
  };
}

export interface MobileLevelSnapshot {
  accountLevel: number;
  seasonLevel: number;
}

export async function getMobileLevelSnapshot(username: string): Promise<MobileLevelSnapshot> {
  if (!process.env.DATABASE_URL || !sql) {
    return { accountLevel: 1, seasonLevel: 1 };
  }

  await warmUpConnection();
  const result = await sql`
    SELECT COALESCE(account_level, 1)::int AS account_level,
           COALESCE(season_level, 1)::int AS season_level
    FROM user_profiles
    WHERE username = ${username}
    LIMIT 1
  `;
  const row = toRows<Record<string, unknown>>(result)[0] ?? null;
  return {
    accountLevel: Number(row?.account_level ?? 1) || 1,
    seasonLevel: Number(row?.season_level ?? 1) || 1,
  };
}

export function createMobileLevelEvent(
  before: MobileLevelSnapshot,
  after: MobileLevelSnapshot
): MobileLevelEvent | null {
  const account =
    after.accountLevel > before.accountLevel
      ? { from: before.accountLevel, to: after.accountLevel }
      : undefined;
  const season =
    after.seasonLevel > before.seasonLevel
      ? { from: before.seasonLevel, to: after.seasonLevel }
      : undefined;

  if (!account && !season) return null;
  return {
    id: Date.now(),
    account,
    season,
  };
}

function getActionWeekBounds(dateStr: string): { start: string; end: string } {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

async function getActionQuestRecords(username: string, serverTime: string): Promise<CachedQuestRecord[]> {
  if (!process.env.DATABASE_URL || !sql) {
    return [];
  }

  await warmUpConnection();
  const todayStr = serverTime.slice(0, 10);
  const week = getActionWeekBounds(todayStr);
  const [dailyResult, weeklyResult] = await Promise.all([
    sql`
      SELECT
        uq.id, uq.progress, uq.target, uq.status,
        uq.completed_at, uq.updated_at,
        qt.type, qt.title, qt.reward_bint, qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND qt.type NOT LIKE 'W%'
        AND (uq.expires_at AT TIME ZONE 'UTC')::date = ${todayStr}::date
      ORDER BY qt.type, uq.id DESC
    `,
    sql`
      SELECT
        uq.id, uq.progress, uq.target, uq.status,
        uq.completed_at, uq.updated_at,
        qt.type, qt.title, qt.reward_bint, qt.reward_season_xp
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.username = ${username}
        AND qt.type LIKE 'W%'
        AND uq.expires_at >= ${week.start}::date
        AND uq.expires_at < (${week.end}::date + INTERVAL '1 day')
      ORDER BY uq.created_at DESC
    `,
  ]);

  const records: CachedQuestRecord[] = [];
  const dailyByType = new Map<string, CachedQuestRecord>();
  for (const row of toRows<Record<string, unknown>>(dailyResult)) {
    const updatedAt = toIso(row.updated_at ?? row.completed_at, serverTime);
    const record: CachedQuestRecord = {
      id: `daily:${row.id}`,
      questKind: "daily",
      questDate: todayStr,
      weekStart: null,
      weekEnd: null,
      type: String(row.type ?? ""),
      title: String(row.title ?? ""),
      progress: Number(row.progress ?? 0) || 0,
      target: Number(row.target ?? 1) || 1,
      status: String(row.status ?? "active"),
      completedAt: row.completed_at ? toIso(row.completed_at, updatedAt) : null,
      rewardRyumo: Number(row.reward_bint ?? 0) || 0,
      rewardSeasonXp: Number(row.reward_season_xp ?? 0) || 0,
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    };
    const existing = dailyByType.get(record.type);
    if (!existing || record.version > existing.version) {
      dailyByType.set(record.type, record);
    }
  }

  records.push(...dailyByType.values());
  for (const row of toRows<Record<string, unknown>>(weeklyResult)) {
    const updatedAt = toIso(row.updated_at ?? row.completed_at, serverTime);
    records.push({
      id: `weekly:${row.id}`,
      questKind: "weekly",
      questDate: null,
      weekStart: week.start,
      weekEnd: week.end,
      type: String(row.type ?? ""),
      title: String(row.title ?? ""),
      progress: Number(row.progress ?? 0) || 0,
      target: Number(row.target ?? 1) || 1,
      status: String(row.status ?? "active"),
      completedAt: row.completed_at ? toIso(row.completed_at, updatedAt) : null,
      rewardRyumo: Number(row.reward_bint ?? 0) || 0,
      rewardSeasonXp: Number(row.reward_season_xp ?? 0) || 0,
      updated_at: updatedAt,
      version: toVersion(updatedAt),
    });
  }

  return records;
}

export async function buildMobileActionResultForUser(
  username: string,
  options?: { levelEvent?: MobileLevelEvent | null }
): Promise<MobileActionResult> {
  if (!process.env.DATABASE_URL || !sql) {
    return {
      levelEvent: options?.levelEvent ?? null,
      backgroundSync: true,
    };
  }

  await warmUpConnection();
  const serverTime = new Date().toISOString();
  const emptyProfileBundle: MobileProfileBundle = {
    profile: null,
    progress: null,
    wallet: null,
  };
  const [profileBundle, quests] = await Promise.all([
    resolveWithFallback<MobileProfileBundle>(
      "action profile bundle",
      getProfileBundle(username, serverTime),
      emptyProfileBundle
    ),
    resolveWithFallback("action quests", getActionQuestRecords(username, serverTime), []),
  ]);

  return {
    localPatch: {
      profile: profileBundle.profile,
      progress: profileBundle.progress,
      wallet: profileBundle.wallet,
      quests,
    },
    levelEvent: options?.levelEvent ?? null,
    backgroundSync: true,
  };
}
