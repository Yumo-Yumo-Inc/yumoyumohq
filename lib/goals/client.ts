"use client";

import { localDb } from "@/lib/local-db";
import {
  readCachedFinancialGoals,
  writeCachedFinancialGoals,
} from "@/lib/offline/cache";
import type {
  CachedFinancialGoalRecord,
  FinancialGoalStatus,
} from "@/lib/offline/types";

export interface GoalUpsertClientInput {
  id?: string;
  title: string;
  targetAmount: number;
  currency: string;
  deadline?: string | null;
  progressAmount?: number;
  status?: FinancialGoalStatus;
  note?: string | null;
}

function newVersion(): number {
  return Date.now();
}

export async function fetchGoalsFromServer(): Promise<CachedFinancialGoalRecord[] | null> {
  try {
    const res = await fetch("/api/goals", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { goals: CachedFinancialGoalRecord[] };
    if (Array.isArray(data.goals)) {
      await writeCachedFinancialGoals(data.goals);
      return data.goals;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listGoalsLocal(): Promise<CachedFinancialGoalRecord[]> {
  return readCachedFinancialGoals();
}

export async function upsertGoal(
  input: GoalUpsertClientInput
): Promise<CachedFinancialGoalRecord> {
  const nowIso = new Date().toISOString();
  const optimistic: CachedFinancialGoalRecord = {
    id: input.id ?? `local:${Date.now()}`,
    title: input.title,
    targetAmount: input.targetAmount,
    currency: input.currency,
    deadline: input.deadline ?? null,
    progressAmount: input.progressAmount ?? 0,
    status: input.status ?? "active",
    note: input.note ?? null,
    updated_at: nowIso,
    version: newVersion(),
  };
  await localDb.set("financial_goals", optimistic);

  try {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = (await res.json()) as { goal: CachedFinancialGoalRecord };
      if (data.goal) {
        if (data.goal.id !== optimistic.id) {
          await localDb.delete("financial_goals", optimistic.id);
        }
        await localDb.set("financial_goals", data.goal);
        return data.goal;
      }
    }
  } catch (error) {
    console.warn("[goals] POST failed, keeping local optimistic record", error);
  }
  return optimistic;
}

export async function deleteGoal(id: string): Promise<void> {
  await localDb.delete("financial_goals", id);
  try {
    await fetch(`/api/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    console.warn("[goals] DELETE failed, record removed locally", error);
  }
}
