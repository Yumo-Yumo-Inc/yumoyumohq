"use client";

/**
 * BudgetPanel — Budget Management OS.
 *
 * This is not a data-entry form. It is a management surface that:
 *   - auto-discovers categories from cached receipts,
 *   - auto-suggests a monthly limit per category from income band + 50/30/20,
 *   - renders each category as a "health row" (SAFE / WATCH / OVER / UNSET),
 *   - offers one-tap actions (accept suggestion, ±10%, freeze, remove),
 *   - shows a health summary and a smart action bar at the top.
 *
 * The user never types a category name. Categories come from the user's own
 * spending history. Manual custom categories can be added under an advanced
 * expander with a constrained list, not a free-text field.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from "lucide-react";
import { ThemeCard } from "@/components/app/theme-card";
import {
  deleteBudget,
  fetchBudgetsFromServer,
  listBudgetsLocal,
  upsertBudget,
} from "@/lib/budgets/client";
import {
  categoryBucket,
  computeBudgetUsage,
  suggestBudgets,
} from "@/lib/budgets/compute";
import { formatCurrency } from "@/lib/insights/format";
import { useAppLocale, type AppLocale } from "@/lib/i18n/app-context";
import { type UserFacingText } from "@/lib/product-architecture/dashboard-contract";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import { subscribeLocalDbChanges } from "@/lib/local-db";
import type { CachedBudgetRecord } from "@/lib/offline/types";
import type { ReceiptSummary, InsightsAggregate } from "@/lib/insights/types";

interface BudgetPanelProps {
  receipts: ReceiptSummary[];
  aggregate: InsightsAggregate;
  currency: string;
  incomeBandKey: string | null | undefined;
  accountLevel?: number;
  /**
   * Pinned reference date provided by the page. Keeps current-month math
   * deterministic across re-renders; without this, each render would call
   * `new Date()` and the minute/hour drift would shift burn rate + usage %.
   */
  referenceDate?: Date;
}

type HealthState = "safe" | "watch" | "over" | "unset";

interface CategoryRow {
  category: string;
  bucket: "needs" | "wants" | "other";
  currentMonthSpend: number;
  threeMonthAvg: number;
  suggestedLimit: number;
  suggestionReason: string | null;
  budget: CachedBudgetRecord | null;
  spent: number;
  limit: number | null;
  pct: number;
  projectedOverrunDays: number | null;
  health: HealthState;
  receiptCount: number;
}

const BUCKET_LABELS: Record<"needs" | "wants" | "other", UserFacingText> = {
  needs: { tr: "İhtiyaç", en: "Needs", ru: "Нужды", th: "ความจำเป็น", es: "Necesidades", zh: "必需" },
  wants: { tr: "İstek", en: "Wants", ru: "Желания", th: "ความต้องการ", es: "Deseos", zh: "想要" },
  other: { tr: "Diğer", en: "Other", ru: "Прочее", th: "อื่นๆ", es: "Otros", zh: "其他" },
};

function pickBudget(
  locale: AppLocale,
  tr: string,
  en: string,
  ru: string,
  th: string,
  es: string,
  zh: string,
): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function computeHealth(pct: number, hasBudget: boolean): HealthState {
  if (!hasBudget) return "unset";
  if (pct >= 1) return "over";
  if (pct >= 0.8) return "watch";
  return "safe";
}

function toneForHealth(health: HealthState): string {
  if (health === "over") return "var(--app-danger, #F87171)";
  if (health === "watch") return "var(--app-warn)";
  if (health === "safe") return "var(--app-success)";
  return "var(--app-text-muted)";
}

export function BudgetPanel({
  receipts,
  aggregate,
  currency,
  incomeBandKey,
  accountLevel = 1,
  referenceDate,
}: BudgetPanelProps) {
  const pinnedNowRef = useRef<Date>(referenceDate ?? new Date());
  if (referenceDate) pinnedNowRef.current = referenceDate;
  const now = pinnedNowRef.current;
  const { locale } = useAppLocale();
  const [budgets, setBudgets] = useState<CachedBudgetRecord[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [expandedOther, setExpandedOther] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      const local = await listBudgetsLocal();
      if (!cancelled) setBudgets(local);
    };
    const refreshRemoteOnce = async () => {
      const remote = await fetchBudgetsFromServer();
      if (!cancelled && remote) setBudgets(remote);
    };
    void loadLocal();
    // Avoid a feedback loop: server refresh writes into IndexedDB, which
    // triggers the store subscription below. We only do remote refresh once.
    void refreshRemoteOnce();
    const unsub = subscribeLocalDbChanges((stores) => {
      if (stores.includes("budgets")) void loadLocal();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  /* ------------------------------------------------------------------
   * Compute per-category rows from receipts + budgets + suggestions.
   * ------------------------------------------------------------------ */
  const rows: CategoryRow[] = useMemo(() => {
    const currentMonth = monthKey(now);
    const threeMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const currentSpend = new Map<string, { sum: number; count: number }>();
    const threeMonthSpend = new Map<string, { sum: number; count: number }>();

    for (const r of receipts) {
      const date = new Date(r.date);
      if (Number.isNaN(date.getTime())) continue;
      const cat = (r.category ?? "other").toLowerCase().trim() || "other";
      if (r.date.startsWith(currentMonth)) {
        const e = currentSpend.get(cat) ?? { sum: 0, count: 0 };
        e.sum += r.totalPaid;
        e.count += 1;
        currentSpend.set(cat, e);
      }
      if (date >= threeMonthStart) {
        const e = threeMonthSpend.get(cat) ?? { sum: 0, count: 0 };
        e.sum += r.totalPaid;
        e.count += 1;
        threeMonthSpend.set(cat, e);
      }
    }

    const allCategories = new Set<string>();
    for (const cat of currentSpend.keys()) allCategories.add(cat);
    for (const cat of threeMonthSpend.keys()) allCategories.add(cat);
    for (const b of budgets) allCategories.add(b.category.toLowerCase().trim());

    const usage = computeBudgetUsage(receipts, budgets, now);
    const usageByCategory = new Map(usage.map((u) => [u.category.toLowerCase(), u]));

    const suggestionStats = Array.from(threeMonthSpend.entries()).map(([category, v]) => ({
      category,
      totalSpend: v.sum,
      receiptCount: v.count,
    }));
    const suggestions = suggestBudgets({
      incomeBandKey,
      currency,
      categoryStats: suggestionStats,
      limit: 50,
    });
    const suggestionByCategory = new Map(suggestions.map((s) => [s.category.toLowerCase(), s]));

    const result: CategoryRow[] = [];
    for (const category of allCategories) {
      const cs = currentSpend.get(category);
      const tms = threeMonthSpend.get(category);
      const currentMonthSpendVal = cs?.sum ?? 0;
      const threeMonthAvg = tms ? tms.sum / 3 : 0;
      const budget = budgets.find((b) => b.category.toLowerCase() === category) ?? null;
      const usageEntry = usageByCategory.get(category);
      const spent = usageEntry?.spent ?? currentMonthSpendVal;
      const limit = usageEntry?.limit ?? budget?.amount ?? null;
      const pct = limit ? spent / limit : 0;
      const projectedOverrunDays = usageEntry?.projectedOverrunDays ?? null;

      const suggestion = suggestionByCategory.get(category);
      const suggestedFromStats = suggestion?.amount ?? Math.round(threeMonthAvg * 1.1);
      const suggestedLimit = budget?.amount ?? suggestedFromStats;
      const suggestionReason = suggestion?.reason ?? null;

      result.push({
        category,
        bucket: categoryBucket(category),
        currentMonthSpend: currentMonthSpendVal,
        threeMonthAvg,
        suggestedLimit,
        suggestionReason,
        budget,
        spent,
        limit,
        pct,
        projectedOverrunDays,
        health: computeHealth(pct, Boolean(budget)),
        receiptCount: (cs?.count ?? 0) + (tms?.count ?? 0),
      });
    }

    const healthOrder: Record<HealthState, number> = { over: 0, watch: 1, unset: 2, safe: 3 };
    result.sort((a, b) => {
      if (healthOrder[a.health] !== healthOrder[b.health]) {
        return healthOrder[a.health] - healthOrder[b.health];
      }
      return b.currentMonthSpend - a.currentMonthSpend;
    });
    return result;
  }, [receipts, budgets, incomeBandKey, currency, now]);

  /* ------------------------------------------------------------------
   * Health score & smart actions.
   * ------------------------------------------------------------------ */
  const counts = useMemo(() => {
    const c = { safe: 0, watch: 0, over: 0, unset: 0, total: rows.length };
    for (const row of rows) c[row.health] += 1;
    return c;
  }, [rows]);

  const unsetCandidates = useMemo(
    () =>
      rows.filter(
        (r) => r.health === "unset" && r.receiptCount >= 2 && r.suggestedLimit > 0
      ),
    [rows]
  );

  const overBudgetRows = useMemo(() => rows.filter((r) => r.health === "over"), [rows]);

  /* ------------------------------------------------------------------
   * Actions.
   * ------------------------------------------------------------------ */
  const applyLimit = async (row: CategoryRow, nextAmount: number) => {
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) return;
    setPendingIds((prev) => new Set(prev).add(row.category));
    try {
      await upsertBudget({
        id: row.budget?.id,
        category: row.category,
        amount: Math.round(nextAmount),
        currency: row.budget?.currency ?? currency,
        period: "monthly",
        source: row.budget ? "manual" : "suggested",
        active: true,
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.category);
        return next;
      });
    }
  };

  const adjustLimit = (row: CategoryRow, delta: number) => {
    const current = row.limit ?? row.suggestedLimit;
    return applyLimit(row, current + delta);
  };

  const removeBudget = async (row: CategoryRow) => {
    if (!row.budget) return;
    setPendingIds((prev) => new Set(prev).add(row.category));
    try {
      await deleteBudget(row.budget.id);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.category);
        return next;
      });
    }
  };

  const applyAllSuggestions = async () => {
    for (const row of unsetCandidates) {
      await applyLimit(row, row.suggestedLimit);
    }
  };

  const rebalanceOverages = async () => {
    for (const row of overBudgetRows) {
      const nextLimit = Math.max(
        row.spent,
        Math.round((row.limit ?? row.suggestedLimit) * 1.15)
      );
      await applyLimit(row, nextLimit);
    }
  };

  const promptCustomLimit = (row: CategoryRow) => {
    const fallback = String(row.limit ?? row.suggestedLimit ?? row.currentMonthSpend ?? 0);
    const raw = window.prompt(
      locale === "tr"
        ? `${categoryLabel(row.category, locale)} için aylık limit (${currency})`
        : `Monthly limit for ${categoryLabel(row.category, locale)} (${currency})`,
      fallback
    );
    if (!raw) return;
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) void applyLimit(row, parsed);
  };

  /* ------------------------------------------------------------------
   * Render.
   * ------------------------------------------------------------------ */
  const mainRows = rows.filter((r) => r.bucket !== "other" || r.health !== "safe" || r.budget);
  const collapsedOther = rows.filter(
    (r) => r.bucket === "other" && r.health === "safe" && !r.budget
  );

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      {/* Header + health summary */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
            <h3
              className="text-sm font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--app-text-secondary)" }}
            >
              {pickBudget(locale, "Bütçe yönetim paneli", "Budget management", "Управление бюджетом", "การจัดการงบประมาณ", "Gestión de presupuesto", "预算管理")}
            </h3>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--app-text-muted)" }}>
            {pickBudget(
              locale,
              "Her kategori için öneri, durum ve hızlı aksiyon.",
              "Per-category health, suggestions and one-tap actions.",
              "Состояние, рекомендации и быстрые действия по каждой категории.",
              "สถานะ คำแนะนำ และการกระทำแบบแตะเดียวต่อหมวดหมู่",
              "Estado, sugerencias y acciones rápidas por categoría.",
              "每个类别的健康状况、建议和一键操作。",
            )}
          </p>
        </div>
        <HealthBadges counts={counts} locale={locale} />
      </header>

      {/* Smart action bar */}
      {(unsetCandidates.length > 0 || overBudgetRows.length > 0) && (
        <div
          className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border p-3"
          style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
        >
          <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: "var(--app-primary)" }} />
          <p className="mr-2 text-xs" style={{ color: "var(--app-text-secondary)" }}>
            {pickBudget(locale, "Akıllı aksiyonlar", "Smart actions", "Умные действия", "การกระทำอัจฉริยะ", "Acciones inteligentes", "智能操作")}
          </p>
          {unsetCandidates.length > 0 ? (
            <button
              type="button"
              onClick={() => void applyAllSuggestions()}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "var(--app-primary)",
                color: "var(--app-primary)",
                background: "rgba(214,183,91,0.08)",
              }}
            >
              <Wand2 className="h-3 w-3" />
              {locale === "tr"
                ? `${unsetCandidates.length} öneriyi uygula`
                : `Apply ${unsetCandidates.length} suggestions`}
            </button>
          ) : null}
          {overBudgetRows.length > 0 ? (
            <button
              type="button"
              onClick={() => void rebalanceOverages()}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "var(--app-warn)",
                color: "var(--app-warn)",
                background: "rgba(247,190,84,0.08)",
              }}
            >
              <AlertTriangle className="h-3 w-3" />
              {locale === "tr"
                ? `${overBudgetRows.length} aşımı dengele (+%15)`
                : `Rebalance ${overBudgetRows.length} overages (+15%)`}
            </button>
          ) : null}
        </div>
      )}

      {/* Category rows */}
      {rows.length === 0 ? (
        <div
          className="mt-5 rounded-xl border px-4 py-6 text-center text-sm"
          style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}
        >
          {locale === "tr"
            ? "Kategorileri keşfetmek için fiş yükleyin. Bütçe, harcama tarihçesinden otomatik üretilir."
            : "Upload receipts to discover categories. Budgets auto-generate from your history."}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {mainRows.map((row) => (
            <CategoryHealthRow
              key={String(row.category)}
              row={row}
              currency={currency}
              locale={locale}
              pending={pendingIds.has(row.category)}
              onAcceptSuggestion={() => void applyLimit(row, row.suggestedLimit)}
              onAdjust={(delta) => void adjustLimit(row, delta)}
              onPromptCustom={() => promptCustomLimit(row)}
              onRemove={() => void removeBudget(row)}
            />
          ))}
          {collapsedOther.length > 0 ? (
            <li className="pt-1">
              <button
                type="button"
                onClick={() => setExpandedOther((v) => !v)}
                className="text-xs underline"
                style={{ color: "var(--app-text-muted)" }}
              >
                {expandedOther
                  ? locale === "tr"
                    ? `Diğer ${collapsedOther.length} kategoriyi gizle`
                    : `Hide ${collapsedOther.length} other categories`
                  : locale === "tr"
                    ? `Diğer ${collapsedOther.length} kategoriyi göster`
                    : `Show ${collapsedOther.length} other categories`}
              </button>
              {expandedOther ? (
                <ul className="mt-2 space-y-2">
                  {collapsedOther.map((row) => (
                    <CategoryHealthRow
                      key={String(row.category)}
                      row={row}
                      currency={currency}
                      locale={locale}
                      pending={pendingIds.has(row.category)}
                      onAcceptSuggestion={() => void applyLimit(row, row.suggestedLimit)}
                      onAdjust={(delta) => void adjustLimit(row, delta)}
                      onPromptCustom={() => promptCustomLimit(row)}
                      onRemove={() => void removeBudget(row)}
                    />
                  ))}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
      )}
    </ThemeCard>
  );
}

/* ====================================================================
 * Sub-components
 * ================================================================== */

function HealthBadges({
  counts,
  locale,
}: {
  counts: { safe: number; watch: number; over: number; unset: number; total: number };
  locale: AppLocale;
}) {
  if (counts.total === 0) return null;
  const items: Array<{ key: string; tone: string; label: string; count: number; icon: React.ReactNode }> = [
    {
      key: "over",
      tone: "var(--app-danger, #F87171)",
      label: pickBudget(locale, "Aşım", "Over", "Превышение", "เกิน", "Excedido", "超支"),
      count: counts.over,
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    {
      key: "watch",
      tone: "var(--app-warn)",
      label: pickBudget(locale, "Riskli", "Watch", "Внимание", "เฝ้าระวัง", "Vigilar", "关注"),
      count: counts.watch,
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    {
      key: "safe",
      tone: "var(--app-success)",
      label: pickBudget(locale, "Güvenli", "Safe", "Стабильно", "ปลอดภัย", "Seguro", "安全"),
      count: counts.safe,
      icon: <Shield className="h-3 w-3" />,
    },
    {
      key: "unset",
      tone: "var(--app-text-muted)",
      label: pickBudget(locale, "Atansız", "Unset", "Не задано", "ยังไม่ตั้ง", "Sin asignar", "未设置"),
      count: counts.unset,
      icon: <Minus className="h-3 w-3" />,
    },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) =>
        item.count > 0 ? (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
            style={{ borderColor: item.tone, color: item.tone, background: "rgba(255,255,255,0.02)" }}
          >
            {item.icon}
            <span>{item.count}</span>
            <span className="opacity-70">{item.label}</span>
          </span>
        ) : null
      )}
    </div>
  );
}

function CategoryHealthRow({
  row,
  currency,
  locale,
  pending,
  onAcceptSuggestion,
  onAdjust,
  onPromptCustom,
  onRemove,
}: {
  row: CategoryRow;
  currency: string;
  locale: AppLocale;
  pending: boolean;
  onAcceptSuggestion: () => void;
  onAdjust: (delta: number) => void;
  onPromptCustom: () => void;
  onRemove: () => void;
}) {
  const tone = toneForHealth(row.health);
  const pctForBar = Math.min(1.25, row.pct);

  return (
    <li
      className="rounded-xl border p-3"
      style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className="truncate font-semibold capitalize"
              style={{ color: "var(--app-text-primary)" }}
            >
              {categoryLabel(row.category, locale)}
            </p>
            <span
              className="rounded-full border px-1.5 py-0 text-[10px] font-semibold uppercase"
              style={{
                borderColor: "var(--app-border)",
                color: "var(--app-text-muted)",
              }}
            >
              {BUCKET_LABELS[row.bucket][locale]}
            </span>
          </div>
          <p className="mt-0.5 text-xs" style={{ color: "var(--app-text-muted)" }}>
            {row.limit != null
              ? `${formatCurrency(row.spent, currency)} / ${formatCurrency(row.limit, currency)}`
              : locale === "tr"
                ? `Bu ay ${formatCurrency(row.currentMonthSpend, currency)} • 3 ay ort. ${formatCurrency(row.threeMonthAvg, currency)}`
                : `This month ${formatCurrency(row.currentMonthSpend, currency)} • 3-mo avg ${formatCurrency(row.threeMonthAvg, currency)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {row.limit != null ? (
            <p className="font-mono text-sm tabular-nums" style={{ color: tone }}>
              {formatPercent(row.pct)}
            </p>
          ) : null}
          {row.budget ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className="rounded-md p-1 disabled:opacity-40"
              style={{ color: "var(--app-text-muted)" }}
              aria-label={pickBudget(locale, "Bütçeyi kaldır", "Remove budget", "Удалить бюджет", "ลบงบประมาณ", "Eliminar presupuesto", "移除预算")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Progress bar (only when a limit exists) */}
      {row.limit != null ? (
        <div
          className="mt-2 h-2 overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, (pctForBar / 1.25) * 100)}%`, background: tone }}
          />
        </div>
      ) : null}

      {/* Status detail */}
      {row.limit != null && row.projectedOverrunDays !== null ? (
        <p className="mt-1 text-xs" style={{ color: tone }}>
          {locale === "tr"
            ? `Mevcut hızla ay içinde gün ${row.projectedOverrunDays}'de aşılır.`
            : `At current pace, overrun around day ${row.projectedOverrunDays}.`}
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {row.health === "unset" ? (
          <button
            type="button"
            onClick={onAcceptSuggestion}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-40"
            style={{ background: "var(--app-primary)", color: "#0B0F14" }}
          >
            <Check className="h-3 w-3" />
            {locale === "tr"
              ? `Öneri: ${formatCurrency(row.suggestedLimit, currency)}`
              : `Set ${formatCurrency(row.suggestedLimit, currency)}`}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onAdjust(-(row.limit ?? row.suggestedLimit) * 0.1)}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold disabled:opacity-40"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
            >
              <ArrowDown className="h-3 w-3" />
              -10%
            </button>
            <button
              type="button"
              onClick={() => onAdjust((row.limit ?? row.suggestedLimit) * 0.1)}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold disabled:opacity-40"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
            >
              <ArrowUp className="h-3 w-3" />
              +10%
            </button>
            <button
              type="button"
              onClick={onPromptCustom}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold disabled:opacity-40"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
            >
              <Plus className="h-3 w-3" />
              {pickBudget(locale, "Özel", "Custom", "Свой", "กำหนดเอง", "Personalizado", "自定义")}
            </button>
          </>
        )}
        {row.suggestionReason ? (
          <span className="text-[11px] italic" style={{ color: "var(--app-text-muted)" }}>
            {row.suggestionReason}
          </span>
        ) : null}
      </div>
    </li>
  );
}
