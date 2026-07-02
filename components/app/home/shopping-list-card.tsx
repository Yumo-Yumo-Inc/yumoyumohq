"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Plus, Sparkles, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_COPY,
  type YumoLocale,
} from "@/lib/product-architecture/dashboard-contract";
import type { ShoppingListItem } from "@/lib/shopping-list/server";

type Suggestion = {
  canonicalId: string;
  displayName: string;
  brand: string | null;
  source: "recent_purchase" | "fuzzy_match";
  score: number;
  purchaseCount: number;
  lastSeenAt: string | null;
  hint: string | null;
};

async function fetchItems(): Promise<ShoppingListItem[]> {
  const response = await fetch("/api/shopping-list", { credentials: "include" });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.items) ? (data.items as ShoppingListItem[]) : [];
}

async function fetchSuggestions(q: string): Promise<Suggestion[]> {
  const response = await fetch(
    `/api/shopping-list/suggestions?q=${encodeURIComponent(q)}`,
    { credentials: "include" },
  );
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.suggestions) ? (data.suggestions as Suggestion[]) : [];
}

const SUGGEST_LABEL: Record<YumoLocale, { recent: string; suggest: string }> = {
  tr: { recent: "Son aldıkların", suggest: "Öneriler" },
  en: { recent: "Recently purchased", suggest: "Suggestions" },
  ru: { recent: "Недавние покупки", suggest: "Предложения" },
  th: { recent: "ที่เพิ่งซื้อ", suggest: "ข้อเสนอแนะ" },
  es: { recent: "Compras recientes", suggest: "Sugerencias" },
  zh: { recent: "最近购买", suggest: "建议" },
};

export function ShoppingListCard({ locale }: { locale: YumoLocale }) {
  const completedLabel =
    locale === "tr"
      ? "tamamlandı, 24 saat içinde otomatik temizlenir."
      : locale === "ru"
        ? "выполнено, автоматически очищается через 24 часа."
        : locale === "th"
          ? "เสร็จแล้ว และจะล้างอัตโนมัติภายใน 24 ชั่วโมง"
          : locale === "es"
            ? "completado, se elimina automáticamente en 24 horas."
            : locale === "zh"
              ? "已完成，24 小时后将自动清除。"
              : "completed, auto-cleared in 24 hours.";
  const copy = DASHBOARD_COPY[locale];
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["shopping-list"],
    queryFn: fetchItems,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      canonicalId?: string | null;
      suggestedBrand?: string | null;
      rawInput?: string | null;
      source?: "manual" | "suggestion" | "recent_purchase" | "favorite";
    }) => {
      const response = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("add_failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      setDraft("");
      setAdding(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await fetch(`/api/shopping-list/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("toggle_failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/shopping-list/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("delete_failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });

  const openItems = items.filter((item) => !item.completedAt);
  const completedCount = items.length - openItems.length;

  // Debounced query — waits 220ms while the user types before hitting the suggestions endpoint.
  const [debouncedDraft, setDebouncedDraft] = useState(draft);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedDraft(draft), 220);
    return () => window.clearTimeout(handle);
  }, [draft]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["shopping-list-suggestions", debouncedDraft],
    queryFn: () => fetchSuggestions(debouncedDraft),
    enabled: adding,
    staleTime: 60_000,
  });

  // Filter out items already in the list — avoid suggesting the same canonical twice.
  const existingCanonicalIds = useMemo(
    () => new Set(openItems.map((item) => item.canonicalId).filter(Boolean) as string[]),
    [openItems],
  );

  const filteredSuggestions = useMemo(
    () => suggestions.filter((s) => !existingCanonicalIds.has(s.canonicalId)),
    [suggestions, existingCanonicalIds],
  );

  const recentSuggestions = filteredSuggestions.filter((s) => s.source === "recent_purchase");
  const fuzzySuggestions = filteredSuggestions.filter((s) => s.source === "fuzzy_match");

  const suggestLabel = SUGGEST_LABEL[locale];

  const submitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed.length < 1) return;
    addMutation.mutate({ name: trimmed, source: "manual", rawInput: trimmed });
  };

  const acceptSuggestion = (suggestion: Suggestion) => {
    addMutation.mutate({
      name: suggestion.displayName,
      canonicalId: suggestion.canonicalId,
      suggestedBrand: suggestion.brand,
      rawInput: draft.trim() || suggestion.displayName,
      source: suggestion.source === "recent_purchase" ? "recent_purchase" : "suggestion",
    });
  };

  return (
    <section className="rounded-[28px] border border-white/[0.06] bg-[#151720]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/38">
            {copy.shoppingEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-white">
            {copy.shoppingTitle}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-white/[0.10]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
          {copy.shoppingListAdd}
        </button>
      </div>

      {adding && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitDraft();
                if (event.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              maxLength={80}
              placeholder={copy.shoppingItemPlaceholder}
              className="flex-1 rounded-full border border-[#ff7a1a]/35 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:border-[#ff7a1a]"
            />
            <button
              type="button"
              onClick={submitDraft}
              disabled={draft.trim().length < 1 || addMutation.isPending}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-black transition",
                draft.trim().length >= 1 && !addMutation.isPending
                  ? "bg-[#ff7a1a] text-[#170b05] active:scale-[0.98]"
                  : "cursor-not-allowed bg-white/[0.08] text-white/40"
              )}
            >
              {copy.shoppingItemSave}
            </button>
          </div>

          {filteredSuggestions.length > 0 && (
            <div className="mt-2 rounded-[16px] border border-white/8 bg-white/[0.04] p-2">
              {recentSuggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                    <History className="h-2.5 w-2.5" strokeWidth={2.5} />
                    {suggestLabel.recent}
                  </div>
                  <div className="flex flex-col">
                    {recentSuggestions.map((s) => (
                      <button
                        key={s.canonicalId}
                        type="button"
                        disabled={addMutation.isPending}
                        onClick={() => acceptSuggestion(s)}
                        className="flex items-center justify-between rounded-[12px] px-2 py-1.5 text-left transition hover:bg-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-black text-white">
                            {s.displayName}
                          </p>
                          {s.hint && (
                            <p className="truncate text-[10px] font-bold text-white/45">{s.hint}</p>
                          )}
                        </div>
                        <span className="ml-2 shrink-0 rounded-full bg-[#22c55e]/16 px-2 py-0.5 text-[9px] font-black text-[#86efac]">
                          ×{s.purchaseCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {fuzzySuggestions.length > 0 && (
                <div className={cn(recentSuggestions.length > 0 && "mt-2 border-t border-white/5 pt-2")}>
                  <div className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                    <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                    {suggestLabel.suggest}
                  </div>
                  <div className="flex flex-col">
                    {fuzzySuggestions.map((s) => (
                      <button
                        key={s.canonicalId}
                        type="button"
                        disabled={addMutation.isPending}
                        onClick={() => acceptSuggestion(s)}
                        className="flex items-center justify-between rounded-[12px] px-2 py-1.5 text-left transition hover:bg-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-bold text-white/85">
                            {s.displayName}
                          </p>
                          {s.brand && (
                            <p className="truncate text-[10px] font-bold text-white/40">{s.brand}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {items.length > 0 ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {items.map((item) => {
              const isCompleted = !!item.completedAt;
              return (
                <span
                  key={item.id}
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    isCompleted
                      ? "border-white/8 bg-white/[0.03] text-white/40 line-through"
                      : "border-white/8 bg-white/[0.07] text-white/82"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: item.id, completed: !isCompleted })}
                    aria-label="toggle"
                    className="-ml-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-white/22"
                  >
                    {isCompleted && <span className="h-1.5 w-1.5 rounded-full bg-white/40" />}
                  </button>
                  {item.name}
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    aria-label="delete"
                    className="-mr-1 ml-0.5 grid h-3.5 w-3.5 place-items-center rounded-full text-white/40 hover:text-white/80"
                  >
                    <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-[#3b82f6]/12 p-2.5">
            <Zap className="h-3.5 w-3.5 shrink-0 text-[#93c5fd]" strokeWidth={2.2} />
            <span className="text-[10.5px] font-bold leading-tight text-white/75">
              {copy.shoppingHintMatch}
            </span>
          </div>
          {completedCount > 0 && (
            <p className="mt-2 text-[10px] font-bold text-white/35">
              {`${completedCount} ${completedLabel}`}
            </p>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-sm font-black text-white">{copy.shoppingEmptyTitle}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/52">
            {copy.shoppingEmptyBody}
          </p>
        </div>
      )}
    </section>
  );
}
