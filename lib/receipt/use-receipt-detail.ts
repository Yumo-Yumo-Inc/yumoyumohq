"use client";

import { useCallback, useEffect, useState } from "react";

import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { readCachedReceiptById, readReceiptHistorySyncState } from "@/lib/offline/cache";
import { convertCachedReceiptToReceipt } from "@/lib/offline/receipt-cache";
import { convertReceiptAnalysisToReceipt } from "@/lib/receipt/receipt-converter";
import { hydrateReceiptHistoryInBackground } from "@/lib/sync";

export function useReceiptDetail(receiptId: string | undefined) {
  const { t } = useAppLocale();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReceipt = useCallback(
    async (id: string) => {
      const idTrimmed = id.trim();
      try {
        setIsLoading(true);
        setError(null);
        setReceipt(null);
        await loadBootstrapSnapshot().catch(() => {});

        // Server-first for every logged-in user. The endpoint is ownership-scoped
        // (admin bypasses), so it works for the receipt's owner too. This keeps the
        // detail view consistent with the feed, which also reads from the live API —
        // a newly uploaded receipt that hasn't been written into the offline cache
        // would otherwise 404 here even though it shows in the feed. The local cache
        // below stays as an offline / API-failure fallback only.
        try {
          const res = await fetch(`/api/receipts/${encodeURIComponent(idTrimmed)}`, {
            credentials: "include",
          });
          if (res.ok) {
            const analysis = await res.json();
            setReceipt(convertReceiptAnalysisToReceipt(analysis));
            return;
          }
          if (res.status === 404) {
            setError(t("errors.receiptDetail.notFound"));
            return;
          }
          // 401/5xx: fall through to the offline cache fallback below.
        } catch (apiErr) {
          console.error("[useReceiptDetail] API fetch failed, falling back to cache:", apiErr);
        }

        const cached = await readCachedReceiptById(idTrimmed);
        const data = cached ? convertCachedReceiptToReceipt(cached) : null;
        if (!data) {
          const historyState = await readReceiptHistorySyncState();
          if (!historyState.complete) {
            try {
              await hydrateReceiptHistoryInBackground();
              const hydrated = await readCachedReceiptById(idTrimmed);
              const hydratedReceipt = hydrated ? convertCachedReceiptToReceipt(hydrated) : null;
              if (hydratedReceipt) {
                setReceipt(hydratedReceipt);
              } else {
                const refreshedHistoryState = await readReceiptHistorySyncState();
                setError(
                  refreshedHistoryState.complete
                    ? t("errors.receiptDetail.notFound")
                    : t("errors.receiptDetail.historySyncing") || "Fiş geçmişi senkronize ediliyor"
                );
              }
            } catch (historyError) {
              console.error("[useReceiptDetail] Failed to hydrate receipt history:", historyError);
              setError(t("errors.receiptDetail.syncFailed") || "Fiş geçmişi senkronize edilemedi");
            }
            return;
          }
          setError(t("errors.receiptDetail.notFound"));
        } else {
          setReceipt(data);
        }
      } catch (err) {
        setError(t("errors.receiptDetail.loadFailed") || "Fiş yüklenemedi");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const reload = useCallback(() => {
    if (receiptId) {
      void loadReceipt(receiptId);
    }
  }, [loadReceipt, receiptId]);

  useEffect(() => {
    if (receiptId) {
      void loadReceipt(receiptId);
    }
  }, [loadReceipt, receiptId]);

  return { receipt, isLoading, error, reload };
}
