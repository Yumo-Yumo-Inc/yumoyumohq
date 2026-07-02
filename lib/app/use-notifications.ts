"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { localDb } from "@/lib/local-db";
import { readCachedNotifications } from "@/lib/offline/cache";
import { NOTIFICATIONS_QUERY_KEY } from "./query-keys";
import { syncMobileData } from "@/lib/sync";

export interface AppNotification {
  id: number;
  type: string;
  title?: string;
  body?: string;
  payload: Record<string, unknown>;
  receiptId?: string;
  readAt?: string;
  createdAt: string;
}

interface NotificationsData {
  notifications: AppNotification[];
  unreadCount: number;
}

async function fetchNotificationsData(): Promise<NotificationsData> {
  await loadBootstrapSnapshot().catch(() => {});
  const notifications = await readCachedNotifications();
  return {
    notifications: notifications.map((notification) => ({
      id: notification.notificationId,
      type: notification.type,
      title: notification.title ?? undefined,
      body: notification.body ?? undefined,
      payload: notification.payload ?? {},
      receiptId: notification.receiptId ?? undefined,
      readAt: notification.readAt ?? undefined,
      createdAt: notification.createdAt,
    })),
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  };
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotificationsData,
    refetchInterval: 60_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const refetch = useCallback(async () => {
    await syncMobileData().catch(() => null);
    await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  }, [queryClient]);

  const markRead = useCallback(
    async (id: number) => {
      // Optimistic update: remove clicked notification from list.
      queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return old;
        const removed = old.notifications.find((n) => n.id === id);
        const wasUnread = Boolean(removed && !removed.readAt);
        return {
          notifications: old.notifications.filter((n) => n.id !== id),
          unreadCount: Math.max(0, old.unreadCount - (wasUnread ? 1 : 0)),
        };
      });
      try {
        const localId = String(id);
        await localDb.delete("notifications", localId);
        await fetch("/api/user/notifications", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        // On error, sync with server state.
        await syncMobileData().catch(() => null);
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      }
    },
    [queryClient]
  );

  const markAllRead = useCallback(async () => {
    queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (old) => {
      if (!old) return old;
      return {
        notifications: old.notifications.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
        unreadCount: 0,
      };
    });
    try {
      const notifications = await readCachedNotifications();
      const nowIso = new Date().toISOString();
      await Promise.all(
        notifications.map((notification) =>
          localDb.patch("notifications", notification.id, {
            readAt: notification.readAt ?? nowIso,
            updated_at: nowIso,
            version: Date.parse(nowIso),
          })
        )
      );
      await fetch("/api/user/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      await syncMobileData().catch(() => null);
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    loading,
    refetch,
    markRead,
    markAllRead,
  };
}
