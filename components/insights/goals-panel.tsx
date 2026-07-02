"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { ThemeCard } from "@/components/app/theme-card";
import {
  deleteGoal,
  fetchGoalsFromServer,
  listGoalsLocal,
  upsertGoal,
} from "@/lib/goals/client";
import { formatCurrency } from "@/lib/insights/format";
import { useAppLocale } from "@/lib/i18n/app-context";
import { subscribeLocalDbChanges } from "@/lib/local-db";
import type { CachedFinancialGoalRecord } from "@/lib/offline/types";

interface GoalsPanelProps {
  currency: string;
  /**
   * Current monthly savings capacity (e.g. income - projected spend).
   * Used to estimate success probability and ETA for each goal.
   */
  monthlySavingsCapacity?: number;
  accountLevel?: number;
}

interface GoalProjection {
  progressPct: number;
  monthsToDeadline: number | null;
  monthsAtCurrentPace: number | null;
  requiredPerMonth: number | null;
  onTrack: boolean;
  successProbability: number;
  shortfallPerMonth: number;
}

function monthsBetween(nowIso: string, deadline: string): number {
  const start = new Date(nowIso);
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return 0;
  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  );
}

function projectGoal(
  goal: CachedFinancialGoalRecord,
  monthlyCapacity: number
): GoalProjection {
  const remaining = Math.max(0, goal.targetAmount - goal.progressAmount);
  const progressPct = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.progressAmount / goal.targetAmount) * 100))
    : 0;
  const nowIso = new Date().toISOString();
  const monthsToDeadline = goal.deadline ? monthsBetween(nowIso, goal.deadline) : null;
  const monthsAtCurrentPace =
    monthlyCapacity > 0 ? Math.ceil(remaining / monthlyCapacity) : null;
  const requiredPerMonth =
    monthsToDeadline && monthsToDeadline > 0 ? remaining / monthsToDeadline : null;

  let onTrack = true;
  let successProbability = 1;
  let shortfallPerMonth = 0;
  if (requiredPerMonth != null) {
    onTrack = monthlyCapacity >= requiredPerMonth;
    if (requiredPerMonth > 0) {
      const ratio = monthlyCapacity / requiredPerMonth;
      successProbability = Math.max(0, Math.min(1, ratio));
    } else {
      successProbability = 1;
    }
    if (!onTrack) shortfallPerMonth = requiredPerMonth - monthlyCapacity;
  }
  if (remaining <= 0) {
    successProbability = 1;
    onTrack = true;
  }
  return {
    progressPct,
    monthsToDeadline,
    monthsAtCurrentPace,
    requiredPerMonth,
    onTrack,
    successProbability,
    shortfallPerMonth,
  };
}

export function GoalsPanel({
  currency,
  monthlySavingsCapacity = 0,
  accountLevel = 1,
}: GoalsPanelProps) {
  const { locale } = useAppLocale();
  const [goals, setGoals] = useState<CachedFinancialGoalRecord[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      const local = await listGoalsLocal();
      if (!cancelled) setGoals(local);
    };
    const refreshRemoteOnce = async () => {
      const remote = await fetchGoalsFromServer();
      if (!cancelled && remote) setGoals(remote);
    };
    void loadLocal();
    // Avoid ping-pong loop: remote fetch updates IndexedDB, which emits
    // `financial_goals` store changes and would re-trigger remote fetch.
    void refreshRemoteOnce();
    const unsub = subscribeLocalDbChanges((stores) => {
      if (stores.includes("financial_goals")) void loadLocal();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);

  const projections = useMemo(() => {
    const map = new Map<string, GoalProjection>();
    for (const goal of activeGoals) {
      map.set(goal.id, projectGoal(goal, monthlySavingsCapacity));
    }
    return map;
  }, [activeGoals, monthlySavingsCapacity]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    const amount = Number(newTarget);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await upsertGoal({
        title: newTitle.trim(),
        targetAmount: amount,
        currency,
        deadline: newDeadline || null,
      });
      setNewTitle("");
      setNewTarget("");
      setNewDeadline("");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProgress = async (goal: CachedFinancialGoalRecord, delta: number) => {
    const next = Math.max(0, goal.progressAmount + delta);
    await upsertGoal({
      id: goal.id,
      title: goal.title,
      targetAmount: goal.targetAmount,
      currency: goal.currency,
      deadline: goal.deadline,
      progressAmount: next,
      status: next >= goal.targetAmount ? "achieved" : "active",
      note: goal.note,
    });
  };

  const handleRemove = async (id: string) => {
    await deleteGoal(id);
  };

  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
              {l("Finansal hedefler", "Financial goals", "Финансовые цели", "เป้าหมายทางการเงิน", "Metas financieras", "财务目标")}
            </h3>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--app-text-muted)" }}>
            {l(
              "Mevcut tasarruf hızıyla başarı olasılığını görün.",
              "See success probability at your current savings pace.",
              "Узнайте вероятность успеха при текущем темпе накоплений.",
              "ดูโอกาสสำเร็จด้วยอัตราการออมปัจจุบันของคุณ",
              "Mira la probabilidad de éxito al ritmo de ahorro actual.",
              "查看当前储蓄速度下的成功概率。",
            )}
          </p>
        </div>

        {activeGoals.length === 0 ? (
          <div
            className="rounded-xl border px-4 py-6 text-sm text-center"
            style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}
          >
            {l(
              "Henüz hedef yok. Aşağıdan ekleyin.",
              "No goals yet. Add one below.",
              "Целей пока нет. Добавьте ниже.",
              "ยังไม่มีเป้าหมาย เพิ่มด้านล่าง",
              "Aún no hay metas. Agrega una abajo.",
              "暂无目标，请在下面添加。",
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {activeGoals.map((goal) => {
              const projection = projections.get(goal.id);
              if (!projection) return null;
              const tone =
                projection.successProbability >= 0.9
                  ? "var(--app-success)"
                  : projection.successProbability >= 0.5
                    ? "var(--app-warn)"
                    : "var(--app-danger, #F87171)";
              return (
                <li
                  key={goal.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--app-border)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--app-text-primary)" }}>
                        {goal.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                        {formatCurrency(goal.progressAmount, goal.currency)} /{" "}
                        {formatCurrency(goal.targetAmount, goal.currency)}
                        {goal.deadline ? ` • ${goal.deadline}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(goal.id)}
                      className="p-1 rounded hover:bg-white/5"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" style={{ color: "var(--app-text-muted)" }} />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div
                      className="h-2 w-full rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${projection.progressPct}%`,
                          background: tone,
                          transition: "width 200ms ease",
                        }}
                      />
                    </div>
                    <div
                      className="mt-2 flex items-center justify-between text-xs"
                      style={{ color: "var(--app-text-muted)" }}
                    >
                      <span>
                        {projection.progressPct}%
                        {projection.monthsAtCurrentPace != null
                          ? ` • ${l("hızla", "at pace", "темп", "อัตรา", "ritmo", "速度")}: ${projection.monthsAtCurrentPace} ${l("ay", "mo", "мес.", "เดือน", "mes", "月")}`
                          : ""}
                      </span>
                      <span style={{ color: tone }}>
                        {Math.round(projection.successProbability * 100)}%
                        {l(" başarı şansı", " success", " шанс успеха", " โอกาสสำเร็จ", " éxito", " 成功率")}
                      </span>
                    </div>
                    {projection.shortfallPerMonth > 0 && projection.requiredPerMonth != null ? (
                      <p className="mt-1 text-xs" style={{ color: "var(--app-warn)" }}>
                        {locale === "tr"
                          ? `Ayda ${formatCurrency(projection.shortfallPerMonth, goal.currency)} daha gerekli.`
                          : `Need ${formatCurrency(projection.shortfallPerMonth, goal.currency)} more per month.`}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddProgress(goal, goal.targetAmount * 0.05)}
                      className="flex-1 py-1.5 px-3 text-xs rounded-lg border"
                      style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
                    >
                      + 5%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddProgress(goal, goal.targetAmount * 0.1)}
                      className="flex-1 py-1.5 px-3 text-xs rounded-lg border"
                      style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
                    >
                      + 10%
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form
          onSubmit={handleCreate}
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: "var(--app-border)" }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
              {l("Yeni hedef", "New goal", "Новая цель", "เป้าหมายใหม่", "Nueva meta", "新目标")}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              placeholder={l("Başlık", "Title", "Название", "ชื่อ", "Título", "标题")}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--app-bg-elevated)",
                border: "1px solid var(--app-border)",
                color: "var(--app-text-primary)",
              }}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={l("Hedef tutar", "Target amount", "Целевая сумма", "จำนวนเป้าหมาย", "Monto objetivo", "目标金额")}
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--app-bg-elevated)",
                border: "1px solid var(--app-border)",
                color: "var(--app-text-primary)",
              }}
            />
            <input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--app-bg-elevated)",
                border: "1px solid var(--app-border)",
                color: "var(--app-text-primary)",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--app-primary)", color: "#0a0a0a" }}
          >
            <Plus className="h-4 w-4" />
            {l("Hedef ekle", "Add goal", "Добавить цель", "เพิ่มเป้าหมาย", "Agregar meta", "添加目标")}
          </button>
        </form>
      </div>
    </ThemeCard>
  );
}
