"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AppShell } from "@/components/app/app-shell";
import { AvatarImage } from "@/components/app/avatar-image";
import { ErrorState } from "@/components/app/error-state";
import { ThemeCard } from "@/components/app/theme-card";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { subscribeLocalDbChanges } from "@/lib/local-db";
import { readCachedLeaderboard } from "@/lib/offline/cache";
import type { CachedLeaderboardType } from "@/lib/offline/types";
import { syncMobileData } from "@/lib/sync";
import { useTier } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/mock/types";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";

const TAB_OPTIONS: { value: "season" | "global" | "weekly" | "daily"; labelKey: string }[] = [
  { value: "season", labelKey: "leaderboard.season" },
  { value: "global", labelKey: "leaderboard.global" },
  { value: "weekly", labelKey: "leaderboard.weekly" },
  { value: "daily", labelKey: "leaderboard.daily" },
];

function formatHiddenCost(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

function LeaderboardAvatar({
  entry,
  className,
  style,
}: {
  entry: LeaderboardEntry;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("overflow-hidden", className)} style={style}>
      {entry.avatarUrl ? (
        <AvatarImage src={entry.avatarUrl} className="h-full w-full object-cover" />
      ) : (
        entry.displayName.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { t } = useAppLocale();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<CachedLeaderboardType>("season");
  const [isAdmin, setIsAdmin] = useState(false);
  const { profile } = useAppProfile();
  const accountLevel = profile?.accountLevel ?? 1;
  const currentUsername = profile?.username ?? null;
  const tier = useTier(accountLevel);
  const acc = tier.accent;
  const [orb1, orb2] = tier.orbBg.split(",");

  useEffect(() => {
    setIsAdmin(!!profile?.isAdmin);
  }, [profile?.isAdmin]);

  const loadLeaderboard = async (nextType: CachedLeaderboardType) => {
    try {
      setIsLoading(true);
      setError(null);
      await loadBootstrapSnapshot().catch(() => {});
      const data = await readCachedLeaderboard(nextType);
      setLeaderboard(data?.entries ?? []);
    } catch (err) {
      setError(t("leaderboard.error"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaderboard(type);
    const unsubscribe = subscribeLocalDbChanges((stores) => {
      if (stores.includes("leaderboard")) {
        void loadLeaderboard(type);
      }
    });
    return unsubscribe;
  }, [type, t]);

  useEffect(() => {
    void syncMobileData().catch(() => null);
  }, [type]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const myEntry = currentUsername
    ? leaderboard.find((e) => e.username === currentUsername)
    : null;
  const myRank = myEntry?.rank ?? null;

  if (error) {
    return (
      <AppShell>
        <ErrorState message={error} onRetry={() => void loadLeaderboard(type)} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-24 lg:pb-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-1">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
            style={{
              background: `linear-gradient(135deg,${orb1},${orb2})`,
              border: `2px solid ${acc}66`,
              boxShadow: `0 0 28px ${acc}40`,
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4h12v6a6 6 0 01-12 0V4z" />
              <path d="M6 7H3v2a3 3 0 003 3M18 7h3v2a3 3 0 01-3 3" />
              <path d="M12 16v4M8 21h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
            {t("leaderboard.title")}
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            {t("leaderboard.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--app-bg-elevated)", border: `1px solid ${tier.cardBorder}` }}>
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setType(tab.value)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                type === tab.value
                  ? "text-black shadow-md"
                  : "text-white/60 hover:text-white/80 hover:bg-white/[0.06]"
              )}
              style={
                type === tab.value
                  ? { background: `linear-gradient(135deg,${acc},${tier.accent2})`, boxShadow: `0 0 16px ${acc}50` }
                  : {}
              }
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <>
            <div className="flex items-end justify-center gap-3 h-44 px-2">
              <div className="w-[28%] h-24 rounded-t-xl animate-pulse bg-white/10" />
              <div className="w-[28%] h-32 rounded-t-xl animate-pulse bg-white/10" />
              <div className="w-[28%] h-20 rounded-t-xl animate-pulse bg-white/10" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse bg-white/10" />
              ))}
            </div>
          </>
        ) : leaderboard.length === 0 ? (
          <ThemeCard accountLevel={accountLevel} className="p-8 text-center">
            <p className="text-white/60">{t("leaderboard.empty")}</p>
            <p className="text-xs text-white/40 mt-2">{t("leaderboard.uploadToRank")}</p>
          </ThemeCard>
        ) : (
          <>
            {/* Podium — Top 3 */}
            <div className="flex items-end justify-center gap-2 sm:gap-3 px-1">
              {/* 2nd */}
              {top3[1] && (
                <div
                  className="flex flex-col items-center flex-1 max-w-[28%] animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: "100ms" }}
                >
                  <LeaderboardAvatar
                    entry={top3[1]}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 border-2 shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #94a3b8, #64748b)",
                      borderColor: "rgba(148,163,184,0.6)",
                      color: "#1e293b",
                    }}
                  />
                  <p className="text-[11px] sm:text-xs font-medium text-white/90 truncate w-full text-center px-0.5">
                    {top3[1].displayName}
                  </p>
                  <p className="text-[10px] text-white/50">{formatHiddenCost(top3[1].hiddenCostUncovered)}</p>
                  {isAdmin && (top3[1].totalAyumo != null || top3[1].totalRyumo != null) && (
                    <p className="text-[9px] text-white/40 mt-0.5">
                      a {Number(top3[1].totalAyumo ?? 0).toFixed(0)} · r {Number(top3[1].totalRyumo ?? 0).toFixed(0)}
                    </p>
                  )}
                  <div
                    className="w-full mt-2 rounded-t-xl flex flex-col items-center justify-end pt-2 pb-1"
                    style={{
                      height: 88,
                      background: "linear-gradient(180deg, rgba(148,163,184,0.25) 0%, rgba(100,116,139,0.35) 100%)",
                      border: "1px solid rgba(148,163,184,0.3)",
                      borderBottom: "none",
                    }}
                  >
                    <span className="text-lg font-black text-slate-300">2</span>
                  </div>
                </div>
              )}

              {/* 1st */}
              {top3[0] && (
                <div
                  className="flex flex-col items-center flex-1 max-w-[32%] animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: "0ms" }}
                >
                  <LeaderboardAvatar
                    entry={top3[0]}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base font-bold mb-1.5 border-2 shrink-0 ring-4"
                    style={{
                      background: "linear-gradient(135deg, #fcd34d, #f59e0b)",
                      borderColor: "rgba(252,211,77,0.8)",
                      color: "#422006",
                      boxShadow: `0 0 0 2px rgba(0,0,0,0.2), 0 0 24px ${acc}60`,
                    }}
                  />
                  <p className="text-xs sm:text-sm font-semibold text-white truncate w-full text-center px-0.5">
                    {top3[0].displayName}
                  </p>
                  <p className="text-[11px] font-medium" style={{ color: acc }}>
                    {formatHiddenCost(top3[0].hiddenCostUncovered)}
                  </p>
                  {isAdmin && (top3[0].totalAyumo != null || top3[0].totalRyumo != null) && (
                    <p className="text-[9px] text-white/50 mt-0.5">
                      a {Number(top3[0].totalAyumo ?? 0).toFixed(0)} · r {Number(top3[0].totalRyumo ?? 0).toFixed(0)}
                    </p>
                  )}
                  <div
                    className="w-full mt-2 rounded-t-xl flex flex-col items-center justify-end pt-2 pb-1"
                    style={{
                      height: 112,
                      background: `linear-gradient(180deg, ${acc}40 0%, ${acc}25 100%)`,
                      border: `1px solid ${acc}60`,
                      borderBottom: "none",
                      boxShadow: `0 -4px 20px ${acc}30`,
                    }}
                  >
                    <span className="text-2xl font-black" style={{ color: acc }}>1</span>
                  </div>
                </div>
              )}

              {/* 3rd */}
              {top3[2] && (
                <div
                  className="flex flex-col items-center flex-1 max-w-[28%] animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: "200ms" }}
                >
                  <LeaderboardAvatar
                    entry={top3[2]}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 border-2 shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #d97706, #b45309)",
                      borderColor: "rgba(217,119,6,0.6)",
                      color: "#1c1917",
                    }}
                  />
                  <p className="text-[11px] sm:text-xs font-medium text-white/90 truncate w-full text-center px-0.5">
                    {top3[2].displayName}
                  </p>
                  <p className="text-[10px] text-white/50">{formatHiddenCost(top3[2].hiddenCostUncovered)}</p>
                  {isAdmin && (top3[2].totalAyumo != null || top3[2].totalRyumo != null) && (
                    <p className="text-[9px] text-white/40 mt-0.5">
                      a {Number(top3[2].totalAyumo ?? 0).toFixed(0)} · r {Number(top3[2].totalRyumo ?? 0).toFixed(0)}
                    </p>
                  )}
                  <div
                    className="w-full mt-2 rounded-t-xl flex flex-col items-center justify-end pt-2 pb-1"
                    style={{
                      height: 72,
                      background: "linear-gradient(180deg, rgba(217,119,6,0.25) 0%, rgba(180,83,9,0.35) 100%)",
                      border: "1px solid rgba(217,119,6,0.3)",
                      borderBottom: "none",
                    }}
                  >
                    <span className="text-lg font-black text-amber-700">3</span>
                  </div>
                </div>
              )}
            </div>

            {/* List 4+ */}
            <div className="space-y-2">
              {rest.map((entry) => {
                const rank = entry.rank;
                const isMe = currentUsername && entry.username === currentUsername;
                return (
                  <ThemeCard
                    key={`${entry.rank}-${entry.displayName}`}
                    accountLevel={accountLevel}
                    className={cn(
                      "p-3 sm:p-4 transition-all duration-200",
                      isMe && "ring-2"
                    )}
                    style={isMe ? { boxShadow: `0 0 0 2px ${acc}88, 0 0 20px ${acc}30` } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: "var(--app-bg-elevated)",
                          border: `1px solid ${tier.cardBorder}`,
                          color: "var(--app-text-secondary)",
                        }}
                      >
                        #{rank}
                      </span>
                      <LeaderboardAvatar
                        entry={entry}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{
                          background: `linear-gradient(135deg,${orb1},${orb2})`,
                          border: `1px solid ${acc}44`,
                          color: acc,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white/95 truncate">{entry.displayName}</p>
                          {isMe && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: `${acc}22`, color: acc, border: `1px solid ${acc}44` }}
                            >
                              {t("leaderboard.you")}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/45">
                          {t("leaderboard.receiptsAndStreak", { receipts: String(entry.receiptsVerified), days: String(entry.streakDays) })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                        <p className="font-mono text-sm font-bold tabular-nums" style={{ color: acc }}>
                          {formatHiddenCost(entry.hiddenCostUncovered)}
                        </p>
                        <p className="text-[10px] text-white/40">{t("leaderboard.hiddenCostLabel")}</p>
                        {isAdmin && (entry.totalAyumo != null || entry.totalRyumo != null) && (
                          <p className="text-[10px] text-white/45 font-mono tabular-nums mt-1">
                            a {Number(entry.totalAyumo ?? 0).toFixed(0)} · r {Number(entry.totalRyumo ?? 0).toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>
                  </ThemeCard>
                );
              })}
            </div>

            {/* Your-rank card — shown when the user isn't in the list or ranks too low */}
            {currentUsername && myRank != null && myRank > 10 && myEntry && (
              <ThemeCard accountLevel={accountLevel} className="p-4 ring-2" style={{ boxShadow: `0 0 0 2px ${acc}88` }}>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">{t("leaderboard.yourRank")}</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold" style={{ color: acc }}>#{myRank}</span>
                  <LeaderboardAvatar
                    entry={myEntry}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: `linear-gradient(135deg,${orb1},${orb2})`, border: `1px solid ${acc}44`, color: acc }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white/90">{myEntry.displayName}</p>
                    <p className="text-xs text-white/45">{t("leaderboard.receiptsAndDays", { receipts: String(myEntry.receiptsVerified), days: String(myEntry.streakDays) })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold tabular-nums" style={{ color: acc }}>
                      {formatHiddenCost(myEntry.hiddenCostUncovered)}
                    </p>
                    {isAdmin && (myEntry.totalAyumo != null || myEntry.totalRyumo != null) && (
                      <p className="text-[11px] text-white/50 font-mono tabular-nums mt-0.5">
                        a {Number(myEntry.totalAyumo ?? 0).toFixed(0)} · r {Number(myEntry.totalRyumo ?? 0).toFixed(0)}
                      </p>
                    )}
                  </div>
                </div>
              </ThemeCard>
            )}

            {isAdmin && leaderboard.length > 0 && (
              <p className="text-[10px] text-white/40 text-center">
                Admin debug: a = hidden-cost total, r = reward total
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
