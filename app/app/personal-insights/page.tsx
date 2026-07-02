"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { ThemeCard } from "@/components/app/theme-card";
import { useAppProfile } from "@/lib/app/profile-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { Sparkles, RefreshCw, TrendingUp, ShoppingBag, Brain, Target, Zap } from "lucide-react";

type BehaviorProfile = {
  username: string;
  preferredCategories: string[];
  preferredMerchants: string[];
  avgBasketSize: number | null;
  avgReceiptFrequencyDays: number | null;
  shoppingDayOfWeek: number | null;
  shoppingTimeOfDay: string | null;
  priceSensitivityScore: number;
  brandLoyaltyScore: number;
  impulseScore: number;
  healthConsciousScore: number;
  planningScore: number;
  topCategoryPath: string | null;
  topCategoryShare: number | null;
  totalReceipts: number;
  totalSpendLifetime: number;
  behaviorArchetype: string | null;
};

type InsightEvent = {
  id: string;
  kind: string;
  state: string;
  title: string;
  summary: string | null;
  confidence: number;
  monetaryImpact: number | null;
  currency: string | null;
  detectedAt: string;
};

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const ARCHETYPE_LABELS: Record<string, string> = {
  impulsive_explorer: "Dürtüsel Kaşif",
  methodical_planner: "Metodik Planlayıcı",
  brand_loyalist: "Marka Sadık",
  price_hunter: "Fiyat Avcısı",
  health_seeker: "Sağlık Arayıcı",
  balanced_adaptive: "Dengeli Adaptif",
  casual_shopper: "Gündelik Alışverişçi",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--app-text-secondary)" }}>{label}</span>
        <span className="font-semibold" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function PersonalInsightsPage() {
  const { t } = useAppLocale();
  const { profile } = useAppProfile();
  const accountLevel = profile?.accountLevel ?? 1;

  const [behaviorProfile, setBehaviorProfile] = useState<BehaviorProfile | null>(null);
  const [insights, setInsights] = useState<InsightEvent[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/user/behavior-profile", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setBehaviorProfile(data.profile);
      }
    } catch (e) {
      console.error("Failed to load behavior profile:", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/insights/generate?limit=20", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setInsights(data.events ?? []);
      }
    } catch (e) {
      console.error("Failed to load insights:", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setInsights(data.insights ?? []);
      }
    } catch (e) {
      console.error("Failed to generate insights:", e);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
    void fetchInsights();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 pb-24 lg:pb-8">
        {/* Hero */}
        <ThemeCard accountLevel={accountLevel} className="overflow-hidden">
          <div
            className="p-6 xl:p-7"
            style={{
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(22,27,39,0.96) 35%, rgba(15,17,23,0.98) 100%)",
            }}
          >
            <div className="space-y-3">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--app-purple, #a78bfa)",
                }}
              >
                <Brain className="h-3.5 w-3.5" />
                Kişiselleştirilmiş Analiz
              </div>
              <h1
                className="text-3xl font-semibold tracking-[-0.04em]"
                style={{ color: "var(--app-text-primary)" }}
              >
                Senin Alışveriş Davranışın
              </h1>
              <p className="max-w-3xl text-sm leading-7" style={{ color: "var(--app-text-secondary)" }}>
                Fiş geçmişinden çıkarılan davranış kalıpları ve kişiselleştirilmiş insight&apos;lar.
              </p>
            </div>
          </div>
        </ThemeCard>

        {/* Profile Card */}
        <ThemeCard accountLevel={accountLevel} className="p-5 xl:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(139,92,246,0.12)" }}
              >
                <Target className="h-5 w-5" style={{ color: "var(--app-purple, #a78bfa)" }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
                  Davranış Profili
                </h2>
                <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                  {behaviorProfile?.totalReceipts ?? 0} fiş analiz edildi
                </p>
              </div>
            </div>
            {behaviorProfile?.behaviorArchetype && (
              <div
                className="rounded-full px-4 py-1.5 text-sm font-semibold"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  color: "var(--app-purple, #a78bfa)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              >
                {ARCHETYPE_LABELS[behaviorProfile.behaviorArchetype] ?? behaviorProfile.behaviorArchetype}
              </div>
            )}
          </div>

          {loadingProfile ? (
            <div className="mt-5 grid gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }} />
              ))}
            </div>
          ) : behaviorProfile ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <ScoreBar label="Fiyat Hassasiyeti" value={behaviorProfile.priceSensitivityScore} color="#f59e0b" />
                <ScoreBar label="Marka Sadakati" value={behaviorProfile.brandLoyaltyScore} color="#3b82f6" />
                <ScoreBar label="Dürtüsellük" value={behaviorProfile.impulseScore} color="#ef4444" />
              </div>
              <div className="space-y-4">
                <ScoreBar label="Sağlık Bilinci" value={behaviorProfile.healthConsciousScore} color="#22c55e" />
                <ScoreBar label="Planlama" value={behaviorProfile.planningScore} color="#8b5cf6" />
                <div className="flex flex-wrap gap-2 pt-1">
                  {behaviorProfile.preferredCategories.slice(0, 5).map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "var(--app-text-secondary)",
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm" style={{ color: "var(--app-text-secondary)" }}>
              Henüz yeterli fiş verisi yok.
            </p>
          )}
        </ThemeCard>

        {/* Insights Feed */}
        <ThemeCard accountLevel={accountLevel} className="p-5 xl:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(59,130,246,0.12)" }}
              >
                <Sparkles className="h-5 w-5" style={{ color: "var(--app-blue)" }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
                  Kişiselleştirilmiş Insight&apos;lar
                </h2>
                <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                  Davranış motorları tarafından üretildi
                </p>
              </div>
            </div>
            <button
              onClick={generateInsights}
              disabled={generating}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#11131d] transition hover:bg-white/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Üretiliyor..." : "Yenile"}
            </button>
          </div>

          {loadingInsights ? (
            <div className="mt-5 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }} />
              ))}
            </div>
          ) : insights.length > 0 ? (
            <div className="mt-5 space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-2xl border p-4 transition hover:border-white/10"
                  style={{
                    borderColor: "var(--app-border)",
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            background:
                              insight.kind === "own_price_track"
                                ? "rgba(245,158,11,0.12)"
                                : insight.kind === "category_drift"
                                  ? "rgba(59,130,246,0.12)"
                                  : insight.kind === "impulse_fingerprint"
                                    ? "rgba(239,68,68,0.12)"
                                    : "rgba(139,92,246,0.12)",
                            color:
                              insight.kind === "own_price_track"
                                ? "#f59e0b"
                                : insight.kind === "category_drift"
                                  ? "#60a5fa"
                                  : insight.kind === "impulse_fingerprint"
                                    ? "#ef4444"
                                    : "#a78bfa",
                          }}
                        >
                          {insight.kind.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--app-text-muted)" }}>
                          Güven: {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
                        {insight.title}
                      </h3>
                      {insight.summary && (
                        <p className="mt-1 text-xs leading-5" style={{ color: "var(--app-text-secondary)" }}>
                          {insight.summary}
                        </p>
                      )}
                      {insight.monetaryImpact != null && (
                        <p className="mt-2 text-xs font-medium" style={{ color: "var(--app-warn)" }}>
                          Etki: {insight.monetaryImpact.toFixed(2)} {insight.currency}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 text-center py-10">
              <Zap className="mx-auto h-8 w-8 opacity-30" style={{ color: "var(--app-text-muted)" }} />
              <p className="mt-3 text-sm" style={{ color: "var(--app-text-secondary)" }}>
                Henüz insight üretilmemiş. Yenile butonuna tıklayarak ilk analizi başlatabilirsiniz.
              </p>
            </div>
          )}
        </ThemeCard>
      </div>
    </AppShell>
  );
}
