import type {
  CachedDashboardSummaryRecord,
  CachedInsightsRecord,
  CachedNotificationRecord,
  CachedProgressRecord,
  CachedQuestRecord,
  CachedReceiptRecord,
  CachedUserProfileRecord,
  CachedWalletRecord,
  SyncPayload,
} from "@/lib/offline/types";

export interface MobileLevelEvent {
  id: number;
  account?: {
    from: number;
    to: number;
  };
  season?: {
    from: number;
    to: number;
  };
}

export interface MobileActionResult {
  syncPayload?: SyncPayload | null;
  localPatch?: {
    profile?: CachedUserProfileRecord | null;
    progress?: CachedProgressRecord | null;
    wallet?: CachedWalletRecord | null;
    walletDelta?: {
      contributionTotal?: number;
    };
    dashboardSummary?: CachedDashboardSummaryRecord | null;
    receipts?: CachedReceiptRecord[];
    quests?: CachedQuestRecord[];
    insights?: CachedInsightsRecord | null;
    notifications?: CachedNotificationRecord[];
  };
  levelEvent?: MobileLevelEvent | null;
  backgroundSync?: boolean;
}
