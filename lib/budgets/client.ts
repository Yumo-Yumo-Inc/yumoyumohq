"use client";

import { localDb } from "@/lib/local-db";
import {
  readCachedBudgets,
  writeCachedBudgets,
} from "@/lib/offline/cache";
import type { CachedBudgetRecord, BudgetPeriod } from "@/lib/offline/types";

export interface BudgetUpsertClientInput {
  id?: string;
  category: string;
  period?: BudgetPeriod;
  amount: number;
  currency: string;
  note?: string | null;
  source?: "manual" | "suggested";
  active?: boolean;
}

function newVersion(): number {
  return Date.now();
}

export async function fetchBudgetsFromServer(): Promise<CachedBudgetRecord[] | null> {
  try {
    const res = await fetch("/api/budgets", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { budgets: CachedBudgetRecord[] };
    if (Array.isArray(data.budgets)) {
      await writeCachedBudgets(data.budgets);
      return data.budgets;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listBudgetsLocal(): Promise<CachedBudgetRecord[]> {
  return readCachedBudgets();
}

export async function upsertBudget(
  input: BudgetUpsertClientInput
): Promise<CachedBudgetRecord> {
  const nowIso = new Date().toISOString();
  const optimistic: CachedBudgetRecord = {
    id: input.id ?? `local:${input.category}:${input.period ?? "monthly"}`,
    category: input.category,
    period: input.period ?? "monthly",
    amount: input.amount,
    currency: input.currency,
    note: input.note ?? null,
    source: input.source ?? "manual",
    active: input.active ?? true,
    updated_at: nowIso,
    version: newVersion(),
  };
  await localDb.set("budgets", optimistic);

  try {
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = (await res.json()) as { budget: CachedBudgetRecord };
      if (data.budget) {
        if (data.budget.id !== optimistic.id) {
          await localDb.delete("budgets", optimistic.id);
        }
        await localDb.set("budgets", data.budget);
        return data.budget;
      }
    }
  } catch (error) {
    console.warn("[budgets] POST failed, keeping local optimistic record", error);
  }
  return optimistic;
}

export async function deleteBudget(id: string): Promise<void> {
  await localDb.delete("budgets", id);
  try {
    await fetch(`/api/budgets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    console.warn("[budgets] DELETE failed, record removed locally", error);
  }
}
