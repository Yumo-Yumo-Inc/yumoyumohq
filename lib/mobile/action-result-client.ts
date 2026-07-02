"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  DASHBOARD_QUERY_KEY,
  NOTIFICATIONS_QUERY_KEY,
  PROFILE_QUERY_KEY,
  QUESTS_DAILY_QUERY_KEY,
} from "@/lib/app/query-keys";
import { localDb } from "@/lib/local-db";
import { applySyncPayload } from "@/lib/offline/cache";
import { CURRENT_WALLET_ID } from "@/lib/offline/types";
import { syncMobileData } from "@/lib/sync";
import type { MobileActionResult, MobileLevelEvent } from "@/lib/mobile/action-result-types";

async function applyLocalPatch(patch: NonNullable<MobileActionResult["localPatch"]>): Promise<void> {
  const writes: Promise<unknown>[] = [];

  if (patch.profile) writes.push(localDb.set("user_profile", patch.profile));
  if (patch.progress) writes.push(localDb.set("progress", patch.progress));
  if (patch.dashboardSummary) writes.push(localDb.set("dashboard_summary", patch.dashboardSummary));
  if (patch.insights) writes.push(localDb.set("insights", patch.insights));
  if (patch.receipts?.length) writes.push(localDb.bulkSet("receipts", patch.receipts));
  if (patch.quests?.length) writes.push(localDb.bulkSet("quests", patch.quests));
  if (patch.notifications?.length) writes.push(localDb.bulkSet("notifications", patch.notifications));

  if (patch.wallet || patch.walletDelta) {
    writes.push(
      (async () => {
        const current = await localDb.get("wallet", CURRENT_WALLET_ID);
        const base = patch.wallet ?? current;
        if (!base) return;

        const nowIso = new Date().toISOString();
        await localDb.set("wallet", {
          ...base,
          address: patch.wallet?.address ?? current?.address ?? null,
          contributionTotal: Math.max(
            current?.contributionTotal ?? 0,
            patch.wallet?.contributionTotal ?? 0,
            (current?.contributionTotal ?? 0) + (patch.walletDelta?.contributionTotal ?? 0)
          ),
          contributionFromReceipts:
            patch.wallet?.contributionFromReceipts ?? current?.contributionFromReceipts ?? 0,
          contributionFromQuests:
            patch.wallet?.contributionFromQuests ?? current?.contributionFromQuests ?? 0,
          contributionReceipts:
            patch.wallet?.contributionReceipts ?? current?.contributionReceipts ?? 0,
          lastContributionAt:
            patch.wallet?.lastContributionAt ?? current?.lastContributionAt ?? null,
          updated_at: patch.wallet?.updated_at ?? nowIso,
          version: Math.max(patch.wallet?.version ?? 0, current?.version ?? 0, Date.parse(nowIso)),
        });
      })()
    );
  }

  await Promise.all(writes);
}

export async function applyMobileActionResult(
  result: MobileActionResult | null | undefined,
  queryClient: QueryClient,
  options?: { onLevelEvent?: (event: MobileLevelEvent) => void }
): Promise<void> {
  if (!result) return;

  if (result.syncPayload) {
    await applySyncPayload(result.syncPayload);
  }
  if (result.localPatch) {
    await applyLocalPatch(result.localPatch);
  }

  if (result.levelEvent) {
    options?.onLevelEvent?.(result.levelEvent);
  }

  void Promise.all([
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY("monthly") }),
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY("mobile-home") }),
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (!Array.isArray(key)) return false;
        return key[0] === "receipts" || key[0] === "dashboard";
      },
    }),
  ]).catch((error) => {
    console.warn("[mobile-action] query invalidation failed:", error);
  });

  // Optimistic UI: server already returned `syncPayload` and/or `localPatch`,
  // which we just wrote to IndexedDB. React Query invalidation above causes
  // the UI to re-read from local cache → user sees the result instantly.
  //
  // The sync below is a *reconciliation* call that catches anything the server
  // didn't include in localPatch (rare). It's no longer `fullProfile: true`
  // because:
  //   1) a delta sync is enough — localPatch already covered explicit changes
  //   2) the syncMobileData throttle (15s) will block most of these anyway,
  //      so this is essentially free unless the user has been idle for a while.
  if (result.backgroundSync !== false) {
    void syncMobileData().catch((error) => {
      console.warn("[mobile-action] background sync failed:", error);
    });
  }
}
