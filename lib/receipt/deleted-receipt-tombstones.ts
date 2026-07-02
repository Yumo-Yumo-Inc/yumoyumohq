/**
 * Client-only: deleted receipt IDs (sessionStorage).
 * Keeps the list clean even if a background hydrate/sync writes the same record back to IndexedDB.
 */

import type { QueryClient } from "@tanstack/react-query";

const KEY = "yumo_deleted_receipt_ids_v1";

/** Drops an ID from all React Query receipt list caches (including page/filter variants). */
export function stripReceiptIdFromAllReceiptQueries(queryClient: QueryClient, receiptId: string) {
  queryClient.setQueriesData({ queryKey: ["receipts"] }, (old: unknown) => {
    if (!old || typeof old !== "object" || !("receipts" in old)) return old;
    const o = old as {
      receipts: { id: string }[];
      pagination: { totalPages: number; total: number; page: number };
    };
    const next = o.receipts.filter((r) => r.id !== receiptId);
    if (next.length === o.receipts.length) return old;
    return {
      ...o,
      receipts: next,
      pagination: {
        ...o.pagination,
        total: Math.max(0, o.pagination.total - 1),
      },
    };
  });
}

export function rememberDeletedReceiptId(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const raw = sessionStorage.getItem(KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      sessionStorage.setItem(KEY, JSON.stringify(arr.slice(-300)));
    }
  } catch {
    /* ignore */
  }
}

export function getDeletedReceiptIdsFilter(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return new Set<string>(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}
