"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { useAppProfile } from "@/lib/app/profile-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { TrustResponse } from "@/app/api/goals/trust/route";
import { deleteGoal as deleteFinancialGoalApi, upsertGoal } from "@/lib/goals/client";
import { formatCurrency } from "@/lib/insights/format";
import type { CachedFinancialGoalRecord } from "@/lib/offline/types";
import {
  Shield,
  Flame,
  ChevronRight,
  TrendingUp,
  CircleCheck,
  CircleAlert,
  Circle,
  Plus,
  Construction,
  Target,
  Trash2,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Fetch functions ──────────────────────────────────────────────────────────

async function fetchTrust(): Promise<TrustResponse> {
  const res = await fetch("/api/goals/trust");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchFinancialGoals(): Promise<CachedFinancialGoalRecord[]> {
  const res = await fetch("/api/goals", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { goals?: CachedFinancialGoalRecord[] };
  return Array.isArray(data.goals) ? data.goals : [];
}

type QuestRow = {
  id: number;
  type: string;
  title: string;
  progress: number;
  target: number;
  status: string;
  tier: string;
};

async function fetchDailyQuestsPack(): Promise<{ quests: QuestRow[] }> {
  const res = await fetch("/api/quests/daily", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { quests?: QuestRow[] };
  return { quests: Array.isArray(data.quests) ? data.quests : [] };
}

async function fetchWeeklyQuestsPack(): Promise<{ weeklyQuests: QuestRow[] }> {
  const res = await fetch("/api/quests/weekly", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { weeklyQuests?: QuestRow[] };
  return { weeklyQuests: Array.isArray(data.weeklyQuests) ? data.weeklyQuests : [] };
}

function defaultGoalCurrency(locale: string): string {
  if (locale === "tr") return "TRY";
  if (locale === "th") return "THB";
  if (locale === "ru") return "RUB";
  if (locale === "es") return "EUR";
  return "USD";
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CheckIcon({ pass, warn }: { pass: boolean; warn: boolean }) {
  if (pass) return <CircleCheck size={12} className="text-[var(--app-success)] flex-shrink-0" />;
  if (warn) return <CircleAlert size={12} className="text-[var(--app-warn)] flex-shrink-0" />;
  return <Circle size={12} className="text-[var(--app-text-muted)] flex-shrink-0" />;
}

function TrustCard({ trust, onImprove }: { trust: TrustResponse; onImprove: () => void }) {
  const { t } = useAppLocale();
  const score = trust.score;
  const barWidth = `${score}%`;
  const barColor =
    score >= 70
      ? "from-[var(--app-success)] to-[var(--app-success)]"
      : score >= 40
        ? "from-[var(--app-gold)] to-[var(--app-gold-light)]"
        : "from-[var(--app-danger)] to-[var(--app-warn)]";

  return (
    <div
      className="rounded-[var(--app-radius-lg)] border p-4 cursor-pointer"
      style={{
        background: "var(--app-bg-elevated)",
        borderColor: "var(--app-border)",
      }}
      onClick={onImprove}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.1)" }}
          >
            <Shield size={14} style={{ color: "var(--app-gold)" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
            {t("goals.trustCard.title")}
          </span>
        </div>
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.2)",
            color: "var(--app-gold)",
          }}
        >
          {score} / 100
        </span>
      </div>

      <p className="text-[11px] mb-2.5" style={{ color: "var(--app-text-muted)" }}>
        {t("goals.trustCard.desc")}
      </p>

      <div
        className="h-1 rounded-full mb-3"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", barColor)}
          style={{ width: barWidth }}
        />
      </div>

      <div className="grid grid-cols-2 gap-1 mb-3">
        {trust.checks.map((c) => (
          <div key={c.key} className="flex items-center gap-1.5">
            <CheckIcon pass={c.pass} warn={c.warn} />
            <span className="text-[10px]" style={{ color: "var(--app-text-muted)" }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5" style={{ color: "var(--app-gold)" }}>
        <span className="text-[11px] font-medium">{t("goals.trustCard.improve")}</span>
        <ChevronRight size={12} />
      </div>
    </div>
  );
}

function TrustImproveSheet({ onClose }: { onClose: () => void }) {
  const { t } = useAppLocale();
  const tips = [
    { n: 1, text: t("goals.trustSheet.tip1") },
    { n: 2, text: t("goals.trustSheet.tip2") },
    { n: 3, text: t("goals.trustSheet.tip3") },
    { n: 4, text: t("goals.trustSheet.tip4") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-[430px] mx-auto rounded-t-[20px] border-t border-x p-5 pb-10"
        style={{
          background: "var(--app-bg-base)",
          borderColor: "var(--app-border-strong)",
        }}
      >
        <div className="w-8 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.15)" }} />
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--app-text-primary)" }}>
          {t("goals.trustSheet.title")}
        </h3>
        <div className="flex flex-col gap-2.5">
          {tips.map((t) => (
            <div
              key={t.n}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{
                background: "var(--app-bg-elevated)",
                border: "1px solid var(--app-border)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-medium"
                style={{
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "var(--app-gold)",
                }}
              >
                {t.n}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
                {t.text}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-xl text-sm font-medium"
          style={{
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.2)",
            color: "var(--app-gold)",
          }}
        >
          {t("goals.trustSheet.understood")}
        </button>
      </div>
    </div>
  );
}

function FinancialGoalSheet({
  currency,
  onClose,
  onSaved,
}: {
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useAppLocale();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const titleVal = title.trim();
    const amount = Number(String(target).replace(",", "."));
    if (!titleVal) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await upsertGoal({
        title: titleVal,
        targetAmount: amount,
        currency,
        deadline: deadline.trim() || null,
      });
      onSaved();
      onClose();
    } catch {
      setError(t("goals.financialSheet.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-[430px] mx-auto rounded-t-[20px] border-t border-x p-5 pb-10"
        style={{
          background: "var(--app-bg-base)",
          borderColor: "var(--app-border-strong)",
        }}
      >
        <div className="w-8 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.15)" }} />
        <h3 className="text-sm font-medium mb-1" style={{ color: "var(--app-text-primary)" }}>
          {t("goals.financialSheet.title")}
        </h3>
        <p className="text-[11px] mb-4" style={{ color: "var(--app-text-muted)" }}>
          {t("goals.financialSheet.desc")}
        </p>

        <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--app-text-muted)" }}>
          {t("goals.financialSheet.titleLabel")}
        </label>
        <input
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          className="w-full mb-3 rounded-xl px-3 py-2.5 text-sm border bg-transparent outline-none focus:ring-1 focus:ring-[var(--app-gold)]"
          style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
          placeholder={t("goals.financialSheet.titlePlaceholder")}
        />

        <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--app-text-muted)" }}>
          {t("goals.financialSheet.amountLabel", { currency })}
        </label>
        <input
          inputMode="decimal"
          value={target}
          onChange={(ev) => setTarget(ev.target.value)}
          className="w-full mb-3 rounded-xl px-3 py-2.5 text-sm border bg-transparent outline-none focus:ring-1 focus:ring-[var(--app-gold)]"
          style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
          placeholder="15000"
        />

        <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--app-text-muted)" }}>
          {t("goals.financialSheet.deadlineLabel")}
        </label>
        <input
          value={deadline}
          onChange={(ev) => setDeadline(ev.target.value)}
          className="w-full mb-2 rounded-xl px-3 py-2.5 text-sm border bg-transparent outline-none focus:ring-1 focus:ring-[var(--app-gold)]"
          style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
          placeholder="2027-06-01"
        />

        {error && (
          <p className="text-[11px] mb-2" style={{ color: "var(--app-danger)" }}>
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium"
            style={{
              border: "1px solid var(--app-border)",
              color: "var(--app-text-secondary)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {t("goals.financialSheet.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{
              background: "rgba(201,168,76,0.12)",
              border: "1px solid rgba(201,168,76,0.25)",
              color: "var(--app-gold)",
            }}
          >
            {saving ? t("goals.financialSheet.saving") : t("goals.financialSheet.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

const PLAN_ICONS = [Flame, TrendingUp, Target] as const;

// ── Main Page ────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { profile } = useAppProfile();
  const { locale, t } = useAppLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const goalCurrency = useMemo(() => defaultGoalCurrency(locale), [locale]);

  const [improveOpen, setImproveOpen] = useState(false);
  const [financialSheetOpen, setFinancialSheetOpen] = useState(false);
  const [questTab, setQuestTab] = useState<"all" | "daily" | "weekly">("all");

  const { data: trust, isLoading: trustLoading } = useQuery<TrustResponse>({
    queryKey: ["goals-trust"],
    queryFn: fetchTrust,
    staleTime: 60_000,
  });

  const { data: financialGoals = [], isLoading: financialLoading } = useQuery({
    queryKey: ["goals-financial"],
    queryFn: fetchFinancialGoals,
    staleTime: 30_000,
  });

  const { data: dailyPack, isLoading: dailyLoading } = useQuery({
    queryKey: ["goals-daily-quests", locale],
    queryFn: fetchDailyQuestsPack,
    staleTime: 45_000,
  });

  const { data: weeklyPack, isLoading: weeklyLoading } = useQuery({
    queryKey: ["goals-weekly-quests", locale],
    queryFn: fetchWeeklyQuestsPack,
    staleTime: 45_000,
  });

  const streak = profile?.streak ?? 0;

  const dailyQuests = dailyPack?.quests ?? [];
  const weeklyQuests = weeklyPack?.weeklyQuests ?? [];

  const incompleteDaily = useMemo(
    () => dailyQuests.filter((q) => q.status !== "completed"),
    [dailyQuests],
  );
  const incompleteWeekly = useMemo(
    () => weeklyQuests.filter((q) => q.status !== "completed"),
    [weeklyQuests],
  );

  const plannedActions = useMemo(() => {
    const out: { quest: QuestRow; scope: "daily" | "weekly"; iconIndex: number }[] = [];
    let i = 0;
    for (const q of incompleteDaily.slice(0, 3)) {
      out.push({ quest: q, scope: "daily", iconIndex: i % PLAN_ICONS.length });
      i++;
    }
    for (const q of incompleteWeekly) {
      if (out.length >= 3) break;
      out.push({ quest: q, scope: "weekly", iconIndex: i % PLAN_ICONS.length });
      i++;
    }
    return out;
  }, [incompleteDaily, incompleteWeekly]);

  const questsForTab = useMemo(() => {
    const openDaily = incompleteDaily;
    const openWeekly = incompleteWeekly;
    if (questTab === "daily") return openDaily.map((q) => ({ ...q, _scope: "daily" as const }));
    if (questTab === "weekly") return openWeekly.map((q) => ({ ...q, _scope: "weekly" as const }));
    return [
      ...openDaily.map((q) => ({ ...q, _scope: "daily" as const })),
      ...openWeekly.map((q) => ({ ...q, _scope: "weekly" as const })),
    ];
  }, [questTab, incompleteDaily, incompleteWeekly]);

  const activeFinancial = useMemo(
    () => financialGoals.filter((g) => g.status === "active"),
    [financialGoals],
  );

  function invalidateFinancial() {
    void queryClient.invalidateQueries({ queryKey: ["goals-financial"] });
  }

  async function removeFinancial(id: string) {
    await deleteFinancialGoalApi(id);
    invalidateFinancial();
  }

  return (
    <AppShell>
      <div
        className="min-h-screen pb-24"
        style={{ background: "var(--app-bg-base)", color: "var(--app-text-primary)" }}
      >
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div>
            <h1
              className="text-[26px] font-medium tracking-tight"
              style={{ color: "var(--app-text-primary)" }}
            >
              {t("goals.title")}
            </h1>
            {streak > 0 && (
              <div
                className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  color: "var(--app-success)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--app-success)", animation: "pulse 2s infinite" }}
                />
                {t("goals.streak", { count: streak })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFinancialSheetOpen(true)}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.2)",
            }}
            aria-label={t("goals.addFinancialGoal")}
          >
            <Plus size={14} style={{ color: "var(--app-gold)" }} />
          </button>
        </div>

        <div className="px-3.5 flex flex-col gap-3">
          {/* ── Today’s plan ── */}
          <div
            className="rounded-[var(--app-radius-lg)] border p-4"
            style={{ background: "var(--app-bg-elevated)", borderColor: "var(--app-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
                {t("goals.todaysPlan")}
              </span>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  color: "var(--app-gold)",
                }}
              >
                {t("goals.actions", { count: plannedActions.length })}
              </span>
            </div>
            {dailyLoading ? (
              <div
                className="h-24 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ) : plannedActions.length === 0 ? (
              <p className="text-[13px] py-2" style={{ color: "var(--app-text-muted)" }}>
                {t("goals.noActions")}
              </p>
            ) : (
              plannedActions.map((row, i) => {
                const Icon = PLAN_ICONS[row.iconIndex]!;
                const sub =
                  row.scope === "daily"
                    ? `${t("goals.daily")} · ${row.quest.progress}/${row.quest.target}`
                    : `${t("goals.weekly")} · ${row.quest.progress}/${row.quest.target}`;
                return (
                  <button
                    key={`${row.scope}-${row.quest.id}-${row.quest.type}`}
                    type="button"
                    onClick={() => router.push("/app/tasks")}
                    className="w-full flex items-center gap-2.5 py-2 text-left"
                    style={{
                      borderTop: i > 0 ? "1px solid var(--app-border)" : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          row.iconIndex === 0
                            ? "rgba(52,211,153,0.1)"
                            : row.iconIndex === 1
                              ? "rgba(96,165,250,0.1)"
                              : "rgba(167,139,250,0.1)",
                      }}
                    >
                      <Icon
                        size={13}
                        style={{
                          color:
                            row.iconIndex === 0
                              ? "var(--app-success)"
                              : row.iconIndex === 1
                                ? "#60A5FA"
                                : "#A78BFA",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[13px] leading-snug" style={{ color: "var(--app-text-primary)" }}>
                        {row.quest.title}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--app-text-muted)" }}>
                        {sub}
                      </span>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--app-text-muted)" }} />
                  </button>
                );
              })
            )}
          </div>

          {/* ── Receipt trust ── */}
          <div>
            <p
              className="text-[11px] font-medium tracking-wider uppercase mb-2"
              style={{ color: "var(--app-text-muted)" }}
            >
              {t("goals.receiptTrust")}
            </p>
            {trustLoading ? (
              <div
                className="rounded-[var(--app-radius-lg)] border p-4 h-36 animate-pulse"
                style={{ background: "var(--app-bg-elevated)", borderColor: "var(--app-border)" }}
              />
            ) : trust ? (
              <TrustCard trust={trust} onImprove={() => setImproveOpen(true)} />
            ) : null}
          </div>

          {/* ── Quests (real API) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-[11px] font-medium tracking-wider uppercase"
                style={{ color: "var(--app-text-muted)" }}
              >
                {t("goals.quests")}
              </p>
              <button
                type="button"
                className="text-[11px] font-medium"
                style={{ color: "var(--app-gold)" }}
                onClick={() => router.push("/app/tasks")}
              >
                {t("goals.complete")}
              </button>
            </div>

            <div
              className="flex rounded-[10px] p-0.5 mb-3"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {(["all", "daily", "weekly"] as const).map((tabId) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setQuestTab(tabId)}
                  className="flex-1 py-1.5 rounded-[8px] text-[10px] font-medium transition-all"
                  style={{
                    background: questTab === tabId ? "var(--app-bg-surface)" : "transparent",
                    color:
                      questTab === tabId ? "var(--app-text-primary)" : "var(--app-text-muted)",
                  }}
                >
                  {tabId === "all" ? t("goals.questsAll") : tabId === "daily" ? t("goals.questsDaily") : t("goals.questsWeekly")}
                </button>
              ))}
            </div>

            {dailyLoading || weeklyLoading ? (
              <div
                className="rounded-[var(--app-radius-lg)] border p-4 h-28 animate-pulse"
                style={{ background: "var(--app-bg-elevated)", borderColor: "var(--app-border)" }}
              />
            ) : questsForTab.length === 0 ? (
              <p
                className="text-[12px] rounded-[var(--app-radius-lg)] border p-4"
                style={{
                  background: "var(--app-bg-elevated)",
                  borderColor: "var(--app-border)",
                  color: "var(--app-text-muted)",
                }}
              >
                {t("goals.noQuests")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {questsForTab.map((goal) => {
                  const scope = goal._scope;
                  const pct =
                    goal.target > 0 ? Math.min(100, Math.round((goal.progress / goal.target) * 100)) : 0;
                  const done = goal.status === "completed";
                  return (
                    <button
                      key={`${scope}-${goal.id}-${goal.type}`}
                      type="button"
                      onClick={() => router.push("/app/tasks")}
                      className="rounded-[var(--app-radius-lg)] border p-3.5 text-left w-full"
                      style={{
                        background: "var(--app-bg-elevated)",
                        borderColor: "var(--app-border)",
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="text-[9px] font-medium tracking-wider uppercase"
                          style={{ color: "var(--app-text-muted)" }}
                        >
                          {scope === "daily" ? t("goals.dailyQuest") : t("goals.weeklyQuest")}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium leading-snug flex-1" style={{ color: "var(--app-text-primary)" }}>
                          {goal.title}
                        </p>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: done ? "rgba(52,211,153,0.1)" : "rgba(201,168,76,0.1)",
                            color: done ? "var(--app-success)" : "var(--app-gold)",
                          }}
                        >
                          {done ? t("goals.questDone") : t("goals.questOngoing")}
                        </span>
                      </div>
                      <p className="text-[11px] mb-2" style={{ color: "var(--app-text-muted)" }}>
                        {t("goals.questProgress", { current: goal.progress, target: goal.target })} · {goal.tier}
                      </p>
                      {!done && (
                        <div
                          className="h-[3px] rounded-full mb-1"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: "var(--app-gold-light)" }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Patterns (coming soon) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-[11px] font-medium tracking-wider uppercase"
                style={{ color: "var(--app-text-muted)" }}
              >
                {t("goals.patterns")}
              </p>
            </div>
            <div
              className="rounded-[var(--app-radius-lg)] border p-4 flex flex-col items-center text-center gap-2"
              style={{
                background: "var(--app-bg-elevated)",
                borderColor: "var(--app-border)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--app-border)",
                }}
              >
                <Construction size={20} style={{ color: "var(--app-text-muted)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
                {t("comingSoon.title")}
              </p>
              <p className="text-[11px] leading-relaxed px-1" style={{ color: "var(--app-text-muted)" }}>
                {t("comingSoon.description")}
              </p>
            </div>
          </div>

          {/* ── Financial goals (API) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-[11px] font-medium tracking-wider uppercase"
                style={{ color: "var(--app-text-muted)" }}
              >
                {t("goals.financialGoals")}
              </p>
              <button
                type="button"
                className="text-[11px] font-medium"
                style={{ color: "var(--app-gold)" }}
                onClick={() => setFinancialSheetOpen(true)}
              >
                {t("goals.add")}
              </button>
            </div>
            <div
              className="rounded-[var(--app-radius-lg)] border p-3.5"
              style={{ background: "var(--app-bg-elevated)", borderColor: "var(--app-border)" }}
            >
              {financialLoading ? (
                <div className="h-20 animate-pulse rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
              ) : activeFinancial.length === 0 ? (
                <div className="flex items-center gap-2 py-2" style={{ color: "var(--app-text-muted)" }}>
                  <ListTodo size={16} className="flex-shrink-0 opacity-60" />
                  <p className="text-xs">{t("goals.noFinancialGoals")}</p>
                </div>
              ) : (
                activeFinancial.map((fin, i) => {
                  const pct =
                    fin.targetAmount > 0
                      ? Math.min(100, Math.round((fin.progressAmount / fin.targetAmount) * 100))
                      : 0;
                  const tone =
                    pct >= 90 ? "var(--app-success)" : pct >= 40 ? "var(--app-gold)" : "var(--app-warn)";
                  return (
                    <div
                      key={fin.id}
                      className="py-2.5"
                      style={{
                        borderTop: i > 0 ? "1px solid var(--app-border)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium truncate" style={{ color: "var(--app-text-primary)" }}>
                          {fin.title}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs font-medium" style={{ color: tone }}>
                            {formatCurrency(fin.progressAmount, fin.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => void removeFinancial(fin.id)}
                            className="p-1 rounded-lg hover:bg-white/5"
                            aria-label={t("goals.deleteGoal")}
                          >
                            <Trash2 size={14} style={{ color: "var(--app-text-muted)" }} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] mb-1.5" style={{ color: "var(--app-text-muted)" }}>
                        {t("goals.goalTarget", { amount: formatCurrency(fin.targetAmount, fin.currency) })}
                        {fin.deadline ? ` · ${fin.deadline}` : ""} · %{pct}
                      </p>
                      <div
                        className="h-[3px] rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: tone }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              type="button"
              onClick={() => setFinancialSheetOpen(true)}
              className="mt-2 w-full py-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
              style={{
                border: "1px dashed rgba(255,255,255,0.12)",
                color: "var(--app-text-muted)",
              }}
            >
              <Plus size={12} />
              {t("goals.addGoalButton")}
            </button>
          </div>
        </div>
      </div>

      {improveOpen && <TrustImproveSheet onClose={() => setImproveOpen(false)} />}
      {financialSheetOpen && (
        <FinancialGoalSheet
          currency={goalCurrency}
          onClose={() => setFinancialSheetOpen(false)}
          onSaved={invalidateFinancial}
        />
      )}
    </AppShell>
  );
}
