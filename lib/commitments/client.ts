"use client";

/**
 * Commitment client helpers — optimistic UI around /api/commitments.
 *
 * The Personal Finance OS loop is Insight → Commitment → Proof. When the user
 * accepts an insight card we call `upsertCommitmentClient` with the originating
 * `sourceEventId`, which both writes the commitment row and lets the caller
 * transition the insight event to `committed`. The functions keep the local
 * IndexedDB in sync so the UI doesn't flicker during the round-trip.
 */

import { localDb } from "@/lib/local-db";
import {
  readCachedCommitments,
  writeCachedCommitments,
} from "@/lib/offline/cache";
import type {
  CachedCommitmentRecord,
  CommitmentKind,
  CommitmentStatus,
} from "@/lib/offline/types";

export interface CommitmentUpsertClientInput {
  id?: string;
  kind: CommitmentKind;
  status?: CommitmentStatus;
  sourceEventId?: string | null;
  title: string;
  description?: string | null;
  params?: Record<string, unknown>;
  progress?: number;
  target?: number | null;
  currency?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

function newVersion(): number {
  return Date.now();
}

function randomLocalId(kind: CommitmentKind): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `local:cmt:${kind}:${Date.now().toString(36)}:${rnd}`;
}

export async function fetchCommitmentsFromServer(): Promise<CachedCommitmentRecord[] | null> {
  try {
    const res = await fetch("/api/commitments", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { commitments: CachedCommitmentRecord[] };
    if (Array.isArray(data.commitments)) {
      await writeCachedCommitments(data.commitments);
      return data.commitments;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listCommitmentsLocal(): Promise<CachedCommitmentRecord[]> {
  return readCachedCommitments();
}

export async function upsertCommitmentClient(
  input: CommitmentUpsertClientInput
): Promise<CachedCommitmentRecord> {
  const nowIso = new Date().toISOString();
  const optimistic: CachedCommitmentRecord = {
    id: input.id ?? randomLocalId(input.kind),
    commitmentId: input.id ?? randomLocalId(input.kind),
    kind: input.kind,
    status: input.status ?? "active",
    sourceEventId: input.sourceEventId ?? null,
    title: input.title,
    description: input.description ?? null,
    params: input.params ?? {},
    progress: input.progress ?? 0,
    target: input.target ?? null,
    currency: input.currency ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    lastEvaluatedAt: null,
    updated_at: nowIso,
    version: newVersion(),
  };
  await localDb.set("commitments", optimistic);

  try {
    const res = await fetch("/api/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = (await res.json()) as { commitment: CachedCommitmentRecord };
      if (data.commitment) {
        if (data.commitment.id !== optimistic.id) {
          await localDb.delete("commitments", optimistic.id);
        }
        await localDb.set("commitments", data.commitment);
        return data.commitment;
      }
    }
  } catch (error) {
    console.warn("[commitments] POST failed, keeping local optimistic record", error);
  }
  return optimistic;
}

export async function setCommitmentStatusClient(
  id: string,
  status: CommitmentStatus
): Promise<CachedCommitmentRecord | null> {
  const current = await localDb.get("commitments", id);
  if (current) {
    const nowIso = new Date().toISOString();
    await localDb.set("commitments", {
      ...current,
      status,
      updated_at: nowIso,
      version: newVersion(),
    });
  }
  try {
    const res = await fetch("/api/commitments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const data = (await res.json()) as { commitment: CachedCommitmentRecord };
      if (data.commitment) {
        await localDb.set("commitments", data.commitment);
        return data.commitment;
      }
    }
  } catch (error) {
    console.warn("[commitments] PATCH failed, keeping local optimistic update", error);
  }
  return (await localDb.get("commitments", id)) ?? null;
}

export async function deleteCommitmentClient(id: string): Promise<void> {
  await localDb.delete("commitments", id);
  try {
    await fetch(`/api/commitments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    console.warn("[commitments] DELETE failed, record removed locally", error);
  }
}
