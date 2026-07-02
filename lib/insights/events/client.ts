"use client";

/**
 * InsightEvent client helpers — mirror of /api/insights/events.
 *
 * Events are detected server-side (or in the worker, in future phases) and
 * mutated by the UI when the user interacts: opening a card marks it
 * `viewed`; accepting spawns a commitment (`committed`); `dismissed` /
 * `snoozed` remove it from the feed for a while. All mutations are
 * optimistic against the local IndexedDB copy.
 */

import { localDb } from "@/lib/local-db";
import {
  readCachedInsightEvents,
  writeCachedInsightEvents,
} from "@/lib/offline/cache";
import type {
  CachedInsightEventRecord,
  InsightEventKind,
  InsightEventState,
} from "@/lib/offline/types";

export interface InsightEventUpsertClientInput {
  id?: string;
  kind: InsightEventKind;
  state?: InsightEventState;
  title: string;
  summary?: string | null;
  confidence?: number;
  monetaryImpact?: number | null;
  currency?: string | null;
  payload?: Record<string, unknown>;
  detectedAt?: string | null;
}

function newVersion(): number {
  return Date.now();
}

export async function fetchInsightEventsFromServer(
  since?: string | null
): Promise<CachedInsightEventRecord[] | null> {
  try {
    const url = since
      ? `/api/insights/events?since=${encodeURIComponent(since)}`
      : "/api/insights/events";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { events: CachedInsightEventRecord[] };
    if (Array.isArray(data.events)) {
      if (!since) await writeCachedInsightEvents(data.events);
      else {
        for (const event of data.events) {
          await localDb.set("insight_events", event);
        }
      }
      return data.events;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listInsightEventsLocal(
  options?: { limit?: number; stateFilter?: InsightEventState[] }
): Promise<CachedInsightEventRecord[]> {
  return readCachedInsightEvents(options);
}

/**
 * Persist a freshly-detected event. The orchestrator uses this when running
 * engines locally; the server also has a bulk endpoint for the same effect.
 */
export async function upsertInsightEventClient(
  input: InsightEventUpsertClientInput
): Promise<CachedInsightEventRecord | null> {
  try {
    const res = await fetch("/api/insights/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: input }),
    });
    if (res.ok) {
      const data = (await res.json()) as { event: CachedInsightEventRecord };
      if (data.event) {
        await localDb.set("insight_events", data.event);
        return data.event;
      }
    }
  } catch (error) {
    console.warn("[insight_events] POST failed", error);
  }
  return null;
}

/**
 * Transition helper used by the Signal Stream UI.
 *
 * When committing, the caller first creates the commitment via
 * `upsertCommitmentClient` and passes the resulting id here so the event row
 * references the downstream commitment.
 */
export async function setInsightEventStateClient(
  id: string,
  state: InsightEventState,
  options?: { spawnedCommitmentId?: string | null }
): Promise<CachedInsightEventRecord | null> {
  const current = await localDb.get("insight_events", id);
  if (current) {
    const nowIso = new Date().toISOString();
    const next: CachedInsightEventRecord = {
      ...current,
      state,
      viewedAt: state === "viewed" ? nowIso : current.viewedAt,
      resolvedAt:
        state === "committed" || state === "dismissed" || state === "snoozed"
          ? nowIso
          : current.resolvedAt,
      spawnedCommitmentId: options?.spawnedCommitmentId ?? current.spawnedCommitmentId,
      updated_at: nowIso,
      version: newVersion(),
    };
    await localDb.set("insight_events", next);
  }
  try {
    const res = await fetch("/api/insights/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        state,
        spawnedCommitmentId: options?.spawnedCommitmentId ?? null,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { event: CachedInsightEventRecord };
      if (data.event) {
        await localDb.set("insight_events", data.event);
        return data.event;
      }
    }
  } catch (error) {
    console.warn("[insight_events] PATCH failed, keeping local state", error);
  }
  return (await localDb.get("insight_events", id)) ?? null;
}
