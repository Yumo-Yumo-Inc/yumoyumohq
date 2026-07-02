"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import {
  NOTIFICATIONS_QUERY_KEY,
  PROFILE_QUERY_KEY,
  QUESTS_DAILY_QUERY_KEY,
} from "@/lib/app/query-keys";
import { subscribeLocalDbChanges } from "@/lib/local-db";
import { hydrateReceiptHistoryInBackground, syncMobileData } from "@/lib/sync";

// Periodic background sync. With optimistic UI in place, the user already sees
// up-to-date local state from IndexedDB after every action. Background sync
// only needs to reconcile silently on a low cadence — going below 60s burns
// Neon compute and Vercel function time without UX benefit.
const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const AUTH_PUBLIC_PATHS = new Set([
  "/app/login",
  "/app/register",
  "/app/verify-email",
  "/app/forgot-password",
  "/app/reset-password",
]);

/** On IndexedDB change, refresh only queries backed by the local cache — do not trigger the admin API receipt list. */
function invalidateOfflineBackedQueries(queryClient: QueryClient): Promise<unknown[]> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY }),
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (!Array.isArray(key) || key[0] !== "receipts") {
          return false;
        }
        const params = key[1] as { isAdmin?: boolean } | undefined;
        return params?.isAdmin !== true;
      },
    }),
  ]);
}

export function OfflineBootstrapManager() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isPublicAuthPath = AUTH_PUBLIC_PATHS.has(pathname);
  const shouldHydrateHistory = pathname.startsWith("/app/receipts");

  useEffect(() => {
    if (isPublicAuthPath) {
      return;
    }

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    /** Batches rapid IndexedDB writes (sync/hydration) so we do not refetch the whole app on every row. */
    const invalidate = () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (!cancelled) {
          void invalidateOfflineBackedQueries(queryClient).catch(() => {});
        }
      }, 1_000);
    };

    void loadBootstrapSnapshot()
      .then(() => {
        invalidate();
        void syncMobileData().catch((error) => {
          console.warn("[offline-bootstrap] initial sync failed:", error);
        });
        void fetch("/api/check-in", { method: "POST", credentials: "include" })
          .then(() => invalidate())
          .catch((error) => {
            console.warn("[offline-bootstrap] daily check-in failed:", error);
          });
        if (shouldHydrateHistory) {
          void hydrateReceiptHistoryInBackground().catch((error) => {
            console.warn("[offline-bootstrap] initial history hydration failed:", error);
          });
        }
      })
      .catch((error) => {
        console.warn("[offline-bootstrap] bootstrap failed:", error);
      });

    const unsubscribe = subscribeLocalDbChanges(() => invalidate());
    const intervalId = window.setInterval(() => {
      void syncMobileData().catch((error) => {
        console.warn("[offline-bootstrap] scheduled sync failed:", error);
      });
      if (shouldHydrateHistory) {
        void hydrateReceiptHistoryInBackground().catch((error) => {
          console.warn("[offline-bootstrap] scheduled history hydration failed:", error);
        });
      }
    }, SYNC_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncMobileData().catch((error) => {
          console.warn("[offline-bootstrap] visibility sync failed:", error);
        });
        if (shouldHydrateHistory) {
          void hydrateReceiptHistoryInBackground().catch((error) => {
            console.warn("[offline-bootstrap] visibility history hydration failed:", error);
          });
        }
      }
    };

    const handleOnline = () => {
      void syncMobileData().catch((error) => {
        console.warn("[offline-bootstrap] online sync failed:", error);
      });
      if (shouldHydrateHistory) {
        void hydrateReceiptHistoryInBackground().catch((error) => {
          console.warn("[offline-bootstrap] online history hydration failed:", error);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      unsubscribe();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient, shouldHydrateHistory, isPublicAuthPath]);

  return null;
}
