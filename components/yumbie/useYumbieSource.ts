"use client";

/**
 * useYumbieSource — the single adapter that turns the app's REAL data into the
 * shape Yumbie renders. Anything genuinely unavailable stays null/false → Yumbie
 * shows a neutral state and NEVER fabricates.
 *
 * Phase 1: daily summary, category ratios, vitality.
 * Phase 2: real cPoint balance, bond, weekly recap, monthly fresh-start, streak.
 * Phase 3: grounded weekly awareness, user-set soft caps (device-local), gentle
 * lapse framing, active window, last-month cap win.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppProfile } from "@/lib/app/profile-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { readCachedReceipts } from "@/lib/offline/cache";
import { fetchCategorySpending, fetchNamedCategoryTotals } from "@/lib/insights/category-spending";
import {
  isNewMonth,
  isReviewDue,
  markMonthSeen,
  dueStreakMilestone,
  markStreakMilestone,
  streakLapsedSince,
  rememberStreak,
  loadCaps,
  saveCap,
  saveAllCaps,
  isInsightSeen,
  markInsightSeenId,
  isoWeekKey,
} from "./yumbieRhythm";
import type { YumbieCategory } from "./useYumbieInsights";
import type { YumbieAwareness } from "./useYumbieInsight";

export interface YumbieSource {
  ready: boolean;
  activeToday: boolean;
  yesterdayReceipts: number | null;
  /** Real receipt count over the last 7 days — drives Yumbie's action replay. */
  recentReceipts: number | null;
  yesterdayPoints: number | null;
  streak: number | null;
  categories: YumbieCategory[] | null;
  // ── Phase 2 ──
  cPoints: number | null;
  weekPointsEarned: number | null;
  bond: number | null;
  weeklyReviewReady: boolean;
  newMonth: boolean;
  lastMonthTopLabel: string | null;
  streakMilestone: number | null;
  // ── Phase 3 ──
  awareness: YumbieAwareness | null;
  softCaps: Record<string, number> | null;
  streakLapsed: boolean;
  activeWindow: "morning" | "evening" | null;
  lastMonthCapWin: string | null;
  persistCap?: (categoryKey: string, amount: number) => void;
  markInsightSeen?: (id: string) => void;
}

function daysAgoKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function lastMonthRange(): { sinceStr: string; untilStr: string } {
  const now = new Date();
  const firstThis = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastEnd = new Date(firstThis.getTime() - 86_400_000);
  const lastStart = new Date(Date.UTC(lastEnd.getUTCFullYear(), lastEnd.getUTCMonth(), 1));
  return { sinceStr: lastStart.toISOString().slice(0, 10), untilStr: lastEnd.toISOString().slice(0, 10) };
}

export function useYumbieSource(): YumbieSource {
  const { profile } = useAppProfile();
  const { locale } = useAppLocale();

  const streak = typeof profile?.streak === "number" ? profile.streak : null;
  const activeToday = profile?.checkedInToday ?? false;
  const cPoints =
    typeof profile?.contributionPoints?.total === "number"
      ? Math.round(profile.contributionPoints.total)
      : null;
  const bond = streak; // product decision: bond is proxied by the tracking streak

  const hour = new Date().getHours();
  const activeWindow: "morning" | "evening" | null = hour < 12 ? "morning" : hour >= 17 ? "evening" : null;

  const [yesterdayReceipts, setYesterdayReceipts] = useState<number | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<number | null>(null);
  const [yesterdayPoints, setYesterdayPoints] = useState<number | null>(null);
  const [weekPointsEarned, setWeekPointsEarned] = useState<number | null>(null);
  const [categories, setCategories] = useState<YumbieCategory[] | null>(null);
  const [newMonth, setNewMonth] = useState(false);
  const [lastMonthTopLabel, setLastMonthTopLabel] = useState<string | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [awareness, setAwareness] = useState<YumbieAwareness | null>(null);
  const [softCaps, setSoftCaps] = useState<Record<string, number> | null>(null);
  const [streakLapsed, setStreakLapsed] = useState(false);
  const [lastMonthCapWin, setLastMonthCapWin] = useState<string | null>(null);

  // Yesterday + this-week receipts/points (local receipt cache).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const receipts = await readCachedReceipts();
        const yKey = daysAgoKey(1);
        const weekKey = daysAgoKey(6);
        const dayOf = (r: { createdAt?: string | null; updated_at?: string }) =>
          (r.createdAt ?? r.updated_at ?? "").slice(0, 10);
        if (!alive) return;
        setYesterdayReceipts(receipts.filter((r) => dayOf(r) === yKey).length);
        setRecentReceipts(receipts.filter((r) => dayOf(r) >= weekKey).length);
        setYesterdayPoints(
          Math.round(receipts.filter((r) => dayOf(r) === yKey).reduce((s, r) => s + (r.contributionPoints ?? 0), 0))
        );
        setWeekPointsEarned(
          Math.round(receipts.filter((r) => dayOf(r) >= weekKey).reduce((s, r) => s + (r.contributionPoints ?? 0), 0))
        );
      } catch {
        /* neutral */
      }
    })();
    return () => {
      alive = false;
    };
  }, [profile]);

  // Category breakdown (same source as the dashboard card).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const buckets = await fetchCategorySpending();
        const sum = buckets.reduce((s, b) => s + (b.total || 0), 0);
        const named = buckets.filter((b) => b.key !== "other" && b.total > 0);
        if (!alive) return;
        if (sum <= 0 || named.length === 0) {
          setCategories(null);
          return;
        }
        setCategories(
          named.map((b) => ({ label: b.label[locale] ?? b.label.en ?? b.key, ratio: b.total / sum, color: b.chartColor.dot }))
        );
      } catch {
        setCategories(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [profile, locale]);

  // Monthly fresh-start: once per calendar month (stable for the session).
  useEffect(() => {
    if (isNewMonth()) {
      setNewMonth(true);
      markMonthSeen();
    }
  }, []);

  // Last calendar month's biggest category — for the fresh-start line.
  useEffect(() => {
    if (!newMonth) {
      setLastMonthTopLabel(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const buckets = await fetchCategorySpending(lastMonthRange());
        const top = buckets.find((b) => b.key !== "other" && b.total > 0);
        if (alive) setLastMonthTopLabel(top ? top.label[locale] ?? top.label.en ?? null : null);
      } catch {
        if (alive) setLastMonthTopLabel(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [newMonth, locale]);

  // Streak milestone + lapse: fire once per crossed threshold / per drop.
  useEffect(() => {
    const m = dueStreakMilestone(streak);
    if (m) {
      setStreakMilestone(m);
      markStreakMilestone(m);
    }
    if (streak != null) {
      setStreakLapsed(streakLapsedSince(streak));
      rememberStreak(streak);
    }
  }, [streak]);

  // Soft caps — load from the server (the source of truth), mirror locally, and
  // fall back to the device-local cache when offline / unauthenticated (e.g. lab).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/yumbie/soft-caps", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { caps?: Record<string, number> };
          const caps = data.caps ?? {};
          if (alive) setSoftCaps(caps);
          saveAllCaps(caps);
          return;
        }
      } catch {
        /* offline / unauthenticated → fall back to the local cache */
      }
      if (alive) setSoftCaps(loadCaps());
    })();
    return () => {
      alive = false;
    };
  }, [profile]);

  // Grounded weekly awareness: compare each category's last-30d spend to its own
  // prior 30-day-equivalent average. Directional + soft magnitude (no exact %).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [recent, prior] = await Promise.all([
          fetchNamedCategoryTotals({ sinceStr: daysAgoKey(30) }),
          fetchNamedCategoryTotals({ sinceStr: daysAgoKey(90), untilStr: daysAgoKey(31) }),
        ]);
        const priorMap = new Map(prior.map((p) => [p.key, p.total]));
        const maxRecent = recent.reduce((m, r) => Math.max(m, r.total), 0);
        let best: { r: (typeof recent)[number]; avg: number; change: number } | null = null;
        for (const r of recent) {
          if (r.total < maxRecent * 0.1) continue; // ignore tiny categories (noise)
          const avg = (priorMap.get(r.key) ?? 0) / 2; // 60 prior days → per-30d average
          if (avg < 1) continue; // need history to compare
          const change = (r.total - avg) / avg;
          if (!best || Math.abs(change) > Math.abs(best.change)) best = { r, avg, change };
        }
        if (!alive) return;
        if (!best || Math.abs(best.change) < 0.15) {
          setAwareness(null);
          return;
        }
        const direction = best.change >= 0.15 ? "up" : "down";
        const magnitude = Math.abs(best.change) >= 0.35 ? "notable" : "slight";
        const id = `${isoWeekKey()}-${best.r.key}`;
        if (isInsightSeen(id)) {
          setAwareness(null);
          return;
        }
        setAwareness({
          id,
          categoryKey: best.r.key,
          label: best.r.label[locale] ?? best.r.label.en ?? best.r.key,
          direction,
          magnitude,
          recentMonthlyAvg: Math.round(best.avg),
          currency: best.r.currency,
        });
      } catch {
        if (alive) setAwareness(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [profile, locale]);

  // Last month: a capped category kept under its soft limit → monthly celebration.
  useEffect(() => {
    if (!softCaps || Object.keys(softCaps).length === 0) {
      setLastMonthCapWin(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const lm = await fetchNamedCategoryTotals(lastMonthRange());
        const byKey = new Map(lm.map((x) => [x.key, x]));
        let win: string | null = null;
        for (const [key, cap] of Object.entries(softCaps)) {
          const entry = byKey.get(key);
          const spent = entry?.total ?? 0;
          if (spent > 0 && spent <= cap) {
            win = entry ? entry.label[locale] ?? entry.label.en ?? key : key;
            break;
          }
        }
        if (alive) setLastMonthCapWin(win);
      } catch {
        if (alive) setLastMonthCapWin(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [softCaps, locale]);

  const capCurrency = awareness?.currency ?? "TRY";
  const persistCap = useCallback(
    (categoryKey: string, amount: number) => {
      // Optimistic local write (also the offline source of truth).
      saveCap(categoryKey, amount);
      setSoftCaps(loadCaps());
      // Persist to the server (best-effort; the local copy already updated).
      void fetch("/api/yumbie/soft-caps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ categoryKey, amount, currency: capCurrency }),
      }).catch(() => {});
    },
    [capCurrency]
  );
  const markInsightSeen = useCallback((id: string) => {
    markInsightSeenId(id);
    setAwareness(null);
  }, []);

  const ready = categories != null || yesterdayReceipts != null;
  const weeklyReviewReady = ready && isReviewDue();

  return useMemo<YumbieSource>(
    () => ({
      ready,
      activeToday,
      yesterdayReceipts,
      recentReceipts,
      yesterdayPoints,
      streak,
      categories,
      cPoints,
      weekPointsEarned,
      bond,
      weeklyReviewReady,
      newMonth,
      lastMonthTopLabel,
      streakMilestone,
      awareness,
      softCaps,
      streakLapsed,
      activeWindow,
      lastMonthCapWin,
      persistCap,
      markInsightSeen,
    }),
    [
      ready,
      activeToday,
      yesterdayReceipts,
      recentReceipts,
      yesterdayPoints,
      streak,
      categories,
      cPoints,
      weekPointsEarned,
      bond,
      weeklyReviewReady,
      newMonth,
      lastMonthTopLabel,
      streakMilestone,
      awareness,
      softCaps,
      streakLapsed,
      activeWindow,
      lastMonthCapWin,
      persistCap,
      markInsightSeen,
    ]
  );
}
