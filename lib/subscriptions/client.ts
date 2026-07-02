"use client";

import { localDb } from "@/lib/local-db";
import {
  readCachedSubscriptions,
  writeCachedSubscriptions,
} from "@/lib/offline/cache";
import type {
  CachedSubscriptionRecord,
  SubscriptionCadence,
  SubscriptionStatus,
} from "@/lib/offline/types";

export interface SubscriptionUpsertClientInput {
  id?: string;
  merchantName: string;
  category?: string | null;
  amount: number;
  currency: string;
  cadence?: SubscriptionCadence;
  nextChargeAt?: string | null;
  source?: "manual" | "auto_detected";
  confidence?: number;
  status?: SubscriptionStatus;
  lastSeenAt?: string | null;
}

function newVersion(): number {
  return Date.now();
}

export async function fetchSubscriptionsFromServer(): Promise<CachedSubscriptionRecord[] | null> {
  try {
    const res = await fetch("/api/subscriptions", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { subscriptions: CachedSubscriptionRecord[] };
    if (Array.isArray(data.subscriptions)) {
      await writeCachedSubscriptions(data.subscriptions);
      return data.subscriptions;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listSubscriptionsLocal(): Promise<CachedSubscriptionRecord[]> {
  return readCachedSubscriptions();
}

export async function upsertSubscription(
  input: SubscriptionUpsertClientInput
): Promise<CachedSubscriptionRecord> {
  const nowIso = new Date().toISOString();
  const optimistic: CachedSubscriptionRecord = {
    id: input.id ?? `local:${input.merchantName}:${input.cadence ?? "monthly"}`,
    merchantName: input.merchantName,
    category: input.category ?? null,
    amount: input.amount,
    currency: input.currency,
    cadence: input.cadence ?? "monthly",
    nextChargeAt: input.nextChargeAt ?? null,
    source: input.source ?? "manual",
    confidence: input.confidence ?? 1,
    status: input.status ?? "active",
    lastSeenAt: input.lastSeenAt ?? null,
    updated_at: nowIso,
    version: newVersion(),
  };
  await localDb.set("subscriptions", optimistic);

  try {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = (await res.json()) as { subscription: CachedSubscriptionRecord };
      if (data.subscription) {
        if (data.subscription.id !== optimistic.id) {
          await localDb.delete("subscriptions", optimistic.id);
        }
        await localDb.set("subscriptions", data.subscription);
        return data.subscription;
      }
    }
  } catch (error) {
    console.warn("[subscriptions] POST failed, keeping local optimistic record", error);
  }
  return optimistic;
}

export async function deleteSubscription(id: string): Promise<void> {
  await localDb.delete("subscriptions", id);
  try {
    await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    console.warn("[subscriptions] DELETE failed, record removed locally", error);
  }
}
