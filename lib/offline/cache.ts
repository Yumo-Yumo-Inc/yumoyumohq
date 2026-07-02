"use client";

import { localDb, getMetaValue, setMetaValue } from "@/lib/local-db";
import type {
  BootstrapPayload,
  BootstrapSnapshot,
  CachedAppConfigRecord,
  CachedBudgetRecord,
  CachedDashboardSummaryRecord,
  CachedFinancialGoalRecord,
  CachedInsightsRecord,
  CachedLeaderboardRecord,
  CachedLeaderboardType,
  CachedNotificationRecord,
  CachedProgressRecord,
  CachedCommitmentRecord,
  CachedInsightEventRecord,
  CachedQuestRecord,
  CachedReceiptLineItem,
  CachedReceiptRecord,
  CachedSubscriptionRecord,
  CachedUserProfileRecord,
  CachedWalletRecord,
  LocalStoreName,
  LocalStoreSchema,
  SyncPayload,
} from "@/lib/offline/types";
import {
  CURRENT_APP_CONFIG_ID,
  CURRENT_INSIGHTS_ID,
  CURRENT_PROFILE_ID,
  CURRENT_PROGRESS_ID,
  CURRENT_WALLET_ID,
  LAST_SYNC_META_ID,
  MONTHLY_DASHBOARD_ID,
  RECEIPTS_HISTORY_COMPLETE_META_ID,
  RECEIPTS_HISTORY_HYDRATED_AT_META_ID,
  RECEIPTS_HISTORY_NEXT_PAGE_META_ID,
} from "@/lib/offline/types";

/** Compared when server payload has version <= IndexedDB profile (e.g. after local avatar cache bump). */
const USER_PROFILE_MERGE_FIELDS: Array<
  keyof Pick<
    CachedUserProfileRecord,
    | "username"
    | "displayName"
    | "avatarUrl"
    | "gender"
    | "birthDate"
    | "occupation"
    | "city"
    | "country"
    | "website"
    | "bio"
    | "declaredMonthlyIncomeBand"
    | "honor"
    | "isAdmin"
  >
> = [
  "username",
  "displayName",
  "avatarUrl",
  "gender",
  "birthDate",
  "occupation",
  "city",
  "country",
  "website",
  "bio",
  "declaredMonthlyIncomeBand",
  "honor",
  "isAdmin",
];

function syncedUserProfileSubsetDiffers(
  stored: CachedUserProfileRecord,
  incoming: CachedUserProfileRecord
): boolean {
  return USER_PROFILE_MERGE_FIELDS.some((field) => stored[field] !== incoming[field]);
}

async function applyVersionedRecord<K extends LocalStoreName>(
  storeName: K,
  record: LocalStoreSchema[K] | null
): Promise<void> {
  if (!record) return;
  const existing = await localDb.get(storeName, record.id);
  if (!existing || record.version > existing.version) {
    await localDb.set(storeName, record);
  }
}

function mergeUserProfileRecords(
  existing: CachedUserProfileRecord,
  incoming: CachedUserProfileRecord
): CachedUserProfileRecord {
  const merged: CachedUserProfileRecord = { ...existing, ...incoming };
  for (const field of USER_PROFILE_MERGE_FIELDS) {
    if (incoming[field] == null && existing[field] != null) {
      merged[field] = existing[field] as never;
    }
  }
  return merged;
}

/** One IndexedDB notify per store batch — avoids spamming invalidateQueries on every row. */
/** When IndexedDB profile version is artificially ahead (e.g. optimistic avatar bump), merge server fields so birth date and other profile edits are not skipped. */
async function applyUserProfileRecord(record: CachedUserProfileRecord | null): Promise<void> {
  if (!record) return;

  const existing = await localDb.get("user_profile", record.id);
  if (!existing || record.version > existing.version) {
    await localDb.set("user_profile", record);
    return;
  }

  if (syncedUserProfileSubsetDiffers(existing, record)) {
    await localDb.set("user_profile", {
      ...mergeUserProfileRecords(existing, record),
      version: existing.version + 1,
    });
  }
}

/** One IndexedDB notify per store batch avoids spamming invalidateQueries on every row. */
async function applyVersionedRecordsBulk<K extends LocalStoreName>(
  storeName: K,
  records: LocalStoreSchema[K][]
): Promise<void> {
  if (records.length === 0) return;
  const toWrite: LocalStoreSchema[K][] = [];
  for (const record of records) {
    const existing = await localDb.get(storeName, record.id);
    if (!existing || record.version > existing.version) {
      toWrite.push(record);
    }
  }
  if (toWrite.length > 0) {
    await localDb.bulkSet(storeName, toWrite);
  }
}

async function persistPayload(payload: BootstrapPayload | SyncPayload): Promise<void> {
  await Promise.all([
    applyUserProfileRecord(payload.profile),
    applyVersionedRecord("wallet", payload.wallet),
    applyVersionedRecord("progress", payload.progress),
    applyVersionedRecord("dashboard_summary", payload.dashboard_summary),
    applyVersionedRecord("app_config", payload.app_config),
    applyVersionedRecord("insights", payload.insights),
    applyVersionedRecordsBulk("receipts", payload.receipts),
    applyVersionedRecordsBulk("quests", payload.quests),
    applyVersionedRecordsBulk("notifications", payload.notifications),
    applyVersionedRecordsBulk("leaderboard", payload.leaderboards),
    applyVersionedRecordsBulk("budgets", payload.budgets ?? []),
    applyVersionedRecordsBulk("subscriptions", payload.subscriptions ?? []),
    applyVersionedRecordsBulk("financial_goals", payload.financial_goals ?? []),
    applyVersionedRecordsBulk("receipt_line_items", payload.receipt_line_items ?? []),
    applyVersionedRecordsBulk("commitments", payload.commitments ?? []),
    applyVersionedRecordsBulk("insight_events", payload.insight_events ?? []),
  ]);

  if ("deletions" in payload && Array.isArray(payload.deletions)) {
    await Promise.all(
      payload.deletions.map((deletion) => localDb.delete(deletion.store, deletion.id))
    );
  }

  await setMetaValue(LAST_SYNC_META_ID, payload.server_time);
}

export async function writeBootstrapPayload(payload: BootstrapPayload): Promise<void> {
  await persistPayload(payload);
}

export async function applySyncPayload(payload: SyncPayload): Promise<void> {
  await persistPayload(payload);
}

export type CachedProfilePatch = Partial<
  Pick<
    CachedUserProfileRecord,
    | "displayName"
    | "avatarUrl"
    | "gender"
    | "birthDate"
    | "occupation"
    | "city"
    | "country"
    | "website"
    | "bio"
    | "declaredMonthlyIncomeBand"
  >
>;

export async function patchCachedProfile(patch: CachedProfilePatch): Promise<void> {
  const current = await localDb.get("user_profile", CURRENT_PROFILE_ID);
  if (!current) return;

  const nowIso = new Date().toISOString();
  await localDb.set("user_profile", {
    ...current,
    ...patch,
    updated_at: nowIso,
    version: current.version + 1,
  });
}

export async function patchCachedProfileAvatar(avatarUrl: string | null): Promise<void> {
  await patchCachedProfile({ avatarUrl });
}

/** Backward-compatible alias — some dev bundles still import this name after HMR. */
export async function patchCachedProfileFields(patch: CachedProfilePatch): Promise<void> {
  return patchCachedProfile(patch);
}

function parsePageNumber(value: string | null): number {
  const numeric = Number.parseInt(value ?? "", 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

export async function readReceiptHistorySyncState(): Promise<{
  hydratedAt: string | null;
  nextPage: number;
  complete: boolean;
}> {
  const [hydratedAt, nextPageRaw, completeRaw] = await Promise.all([
    getMetaValue(RECEIPTS_HISTORY_HYDRATED_AT_META_ID),
    getMetaValue(RECEIPTS_HISTORY_NEXT_PAGE_META_ID),
    getMetaValue(RECEIPTS_HISTORY_COMPLETE_META_ID),
  ]);

  return {
    hydratedAt,
    nextPage: parsePageNumber(nextPageRaw),
    complete: completeRaw === "true",
  };
}

export async function writeReceiptHistorySyncState(input: {
  hydratedAt?: string | null;
  nextPage?: number;
  complete?: boolean;
}): Promise<void> {
  const writes: Promise<unknown>[] = [];

  if (input.hydratedAt !== undefined) {
    writes.push(setMetaValue(RECEIPTS_HISTORY_HYDRATED_AT_META_ID, input.hydratedAt));
  }
  if (input.nextPage !== undefined) {
    writes.push(setMetaValue(RECEIPTS_HISTORY_NEXT_PAGE_META_ID, String(Math.max(1, input.nextPage))));
  }
  if (input.complete !== undefined) {
    writes.push(setMetaValue(RECEIPTS_HISTORY_COMPLETE_META_ID, input.complete ? "true" : "false"));
  }

  await Promise.all(writes);
}

export async function readCachedProfile(): Promise<{
  profile: CachedUserProfileRecord | null;
  progress: CachedProgressRecord | null;
  wallet: CachedWalletRecord | null;
}> {
  const [profile, progress, wallet] = await Promise.all([
    localDb.get("user_profile", CURRENT_PROFILE_ID),
    localDb.get("progress", CURRENT_PROGRESS_ID),
    localDb.get("wallet", CURRENT_WALLET_ID),
  ]);
  return { profile, progress, wallet };
}

export async function readCachedDashboardSummary(): Promise<CachedDashboardSummaryRecord | null> {
  return localDb.get("dashboard_summary", MONTHLY_DASHBOARD_ID);
}

export async function readCachedReceipts(limit?: number): Promise<CachedReceiptRecord[]> {
  const records = await localDb.list("receipts");
  const sorted = records.sort((left, right) => {
    const leftKey = left.createdAt ?? left.updated_at;
    const rightKey = right.createdAt ?? right.updated_at;
    return rightKey.localeCompare(leftKey);
  });
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function readCachedReceiptById(id: string): Promise<CachedReceiptRecord | null> {
  return localDb.get("receipts", id);
}

export async function readCachedQuests(): Promise<CachedQuestRecord[]> {
  const quests = await localDb.list("quests");
  return quests.sort((left, right) => left.id.localeCompare(right.id));
}

export async function readCachedInsights(): Promise<CachedInsightsRecord | null> {
  return localDb.get("insights", CURRENT_INSIGHTS_ID);
}

export async function readCachedAppConfig(): Promise<CachedAppConfigRecord | null> {
  return localDb.get("app_config", CURRENT_APP_CONFIG_ID);
}

export async function readCachedNotifications(): Promise<CachedNotificationRecord[]> {
  const notifications = await localDb.list("notifications");
  return notifications.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function readCachedLeaderboard(
  type: CachedLeaderboardType
): Promise<CachedLeaderboardRecord | null> {
  return localDb.get("leaderboard", type);
}

export async function readBootstrapSnapshot(): Promise<BootstrapSnapshot> {
  const [
    { profile, progress, wallet },
    dashboardSummary,
    receipts,
    quests,
    insights,
    appConfig,
    notifications,
    leaderboards,
    lastSyncAt,
  ] = await Promise.all([
    readCachedProfile(),
    readCachedDashboardSummary(),
    readCachedReceipts(20),
    readCachedQuests(),
    readCachedInsights(),
    readCachedAppConfig(),
    readCachedNotifications(),
    localDb.list("leaderboard"),
    getMetaValue(LAST_SYNC_META_ID),
  ]);

  return {
    server_time: appConfig?.server_time ?? lastSyncAt ?? new Date(0).toISOString(),
    profile,
    wallet,
    progress,
    dashboard_summary: dashboardSummary,
    receipts,
    quests,
    app_config: appConfig,
    insights,
    notifications,
    leaderboards,
    last_sync_at: lastSyncAt,
  };
}

export async function readCachedBudgets(): Promise<CachedBudgetRecord[]> {
  const records = await localDb.list("budgets");
  return records.sort((left, right) => left.category.localeCompare(right.category));
}

export async function readCachedSubscriptions(): Promise<CachedSubscriptionRecord[]> {
  const records = await localDb.list("subscriptions");
  return records.sort((left, right) => left.merchantName.localeCompare(right.merchantName));
}

export async function readCachedFinancialGoals(): Promise<CachedFinancialGoalRecord[]> {
  const records = await localDb.list("financial_goals");
  return records.sort((left, right) => (left.deadline ?? "~").localeCompare(right.deadline ?? "~"));
}

/**
 * Line items consumed by the personal-behavior insight engines.
 *
 * Sorted by `purchasedAt` DESC to let callers slice recent windows cheaply
 * (e.g. last 90 days for own-price tracking). Returns at most `limit` rows
 * when provided, otherwise the full cached set.
 */
export async function readCachedReceiptLineItems(limit?: number): Promise<CachedReceiptLineItem[]> {
  const records = await localDb.list("receipt_line_items");
  const sorted = records.sort((left, right) => {
    const leftKey = left.purchasedAt ?? left.updated_at;
    const rightKey = right.purchasedAt ?? right.updated_at;
    return rightKey.localeCompare(leftKey);
  });
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

/**
 * Line items for a single receipt, in stable `lineIndex` order. Used by the
 * receipt detail screen and by certain diagnostic panels.
 */
export async function readCachedLineItemsForReceipt(
  receiptId: string
): Promise<CachedReceiptLineItem[]> {
  const records = await localDb.list("receipt_line_items");
  return records
    .filter((item) => item.receiptId === receiptId)
    .sort((left, right) => left.lineIndex - right.lineIndex);
}

export async function writeCachedBudgets(records: CachedBudgetRecord[]): Promise<void> {
  await localDb.clear("budgets");
  if (records.length > 0) await localDb.bulkSet("budgets", records);
}

export async function writeCachedSubscriptions(records: CachedSubscriptionRecord[]): Promise<void> {
  await localDb.clear("subscriptions");
  if (records.length > 0) await localDb.bulkSet("subscriptions", records);
}

export async function writeCachedFinancialGoals(records: CachedFinancialGoalRecord[]): Promise<void> {
  await localDb.clear("financial_goals");
  if (records.length > 0) await localDb.bulkSet("financial_goals", records);
}

export async function writeCachedReceiptLineItems(records: CachedReceiptLineItem[]): Promise<void> {
  await localDb.clear("receipt_line_items");
  if (records.length > 0) await localDb.bulkSet("receipt_line_items", records);
}

/**
 * Commitments — sorted with active first, then most recently updated. The UI
 * renders `active` and `paused` rows above `completed`/`dismissed` history.
 */
export async function readCachedCommitments(): Promise<CachedCommitmentRecord[]> {
  const records = await localDb.list("commitments");
  const statusRank = (status: string): number => {
    if (status === "active") return 0;
    if (status === "paused") return 1;
    if (status === "completed") return 2;
    return 3;
  };
  return records.sort((left, right) => {
    const statusDelta = statusRank(left.status) - statusRank(right.status);
    if (statusDelta !== 0) return statusDelta;
    return right.updated_at.localeCompare(left.updated_at);
  });
}

export async function writeCachedCommitments(records: CachedCommitmentRecord[]): Promise<void> {
  await localDb.clear("commitments");
  if (records.length > 0) await localDb.bulkSet("commitments", records);
}

/**
 * Insight events — ordered by `detectedAt` DESC so the signal stream feed can
 * slice the freshest items for the user without resorting client-side.
 */
export async function readCachedInsightEvents(
  options?: { limit?: number; stateFilter?: string[] }
): Promise<CachedInsightEventRecord[]> {
  const records = await localDb.list("insight_events");
  const filtered = options?.stateFilter
    ? records.filter((event) => options.stateFilter!.includes(event.state))
    : records;
  const sorted = filtered.sort((left, right) =>
    right.detectedAt.localeCompare(left.detectedAt)
  );
  return typeof options?.limit === "number" ? sorted.slice(0, options.limit) : sorted;
}

export async function writeCachedInsightEvents(
  records: CachedInsightEventRecord[]
): Promise<void> {
  await localDb.clear("insight_events");
  if (records.length > 0) await localDb.bulkSet("insight_events", records);
}

export async function hasBootstrapCache(): Promise<boolean> {
  const [profile, dashboard, receipts, insights] = await Promise.all([
    localDb.get("user_profile", CURRENT_PROFILE_ID),
    localDb.get("dashboard_summary", MONTHLY_DASHBOARD_ID),
    readCachedReceipts(1),
    localDb.get("insights", CURRENT_INSIGHTS_ID),
  ]);
  return Boolean(profile || dashboard || receipts.length > 0 || insights);
}

export async function clearOfflineSessionCache(): Promise<void> {
  await localDb.clearAll();
}
