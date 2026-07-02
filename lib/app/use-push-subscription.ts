"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isPushSubscribed,
  pushPermission,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  type PushSubscribeResult,
} from "@/lib/app/push-subscribe";

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

interface PushSubscriptionState {
  permission: PushPermissionState;
  subscribed: boolean;
  subscribe: () => Promise<PushSubscribeResult>;
  unsubscribe: () => Promise<void>;
  loading: boolean;
}

export function usePushSubscription(): PushSubscriptionState {
  const [permission, setPermission] = useState<PushPermissionState>("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!pushSupported()) {
      setPermission("unsupported");
      setSubscribed(false);
      return;
    }
    setPermission(pushPermission() as PushPermissionState);
    setSubscribed(await isPushSubscribed());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      const result = await subscribeToPush();
      await refresh();
      return result;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return { permission, subscribed, subscribe, unsubscribe, loading };
}
