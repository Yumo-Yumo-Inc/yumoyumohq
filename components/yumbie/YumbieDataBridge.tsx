"use client";

/**
 * YumbieDataBridge (Phase 3) — wires the app's REAL data into Yumbie's stores.
 * Phase 1: daily message, categories, vitality. Phase 2: progress + weekly tour.
 * Phase 3: soft-cap persistence callbacks, grounded awareness card, lapse framing.
 * The one app-specific dependency is still `useYumbieSource`; no data is
 * fabricated. Renders nothing (null).
 */
import { useEffect, useRef, useState } from "react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useYumbieMessage } from "./useYumbieMessage";
import { hasSpokenToday, markSpokenToday, localDayKey } from "./yumbieRhythm";
import { useYumbieInsights, type YumbieCategory } from "./useYumbieInsights";
import { useYumbieVitality } from "./useYumbieVitality";
import { useYumbieProgress } from "./useYumbieProgress";
import { useYumbieTour } from "./useYumbieTour";
import { useYumbieGoals } from "./useYumbieGoals";
import { useYumbieInsight } from "./useYumbieInsight";
import { useYumbieSource } from "./useYumbieSource";
import { composeDailyLine } from "./dailyLine";
import { buildWeeklyTourBeats } from "./weeklyTour";

export function YumbieDataBridge() {
  const { t, locale } = useAppLocale();
  const src = useYumbieSource();
  const tourActive = useYumbieTour((s) => s.active);

  // Once-a-day rule: Yumbie says everything on the FIRST dashboard entry of the
  // day, then stays silent the rest of the day — across every channel (daily
  // line, awareness insight, weekly tour).
  //
  // Two layers gate this:
  //  • localStorage (instant, same-browser): handles reloads with zero latency.
  //  • server, keyed by username: the AUTHORITY. localStorage is empty in a fresh
  //    / incognito session, so without the server Yumbie speaks again there. The
  //    server day survives any new session for the same user.
  // We snapshot localStorage once per mount, and fetch the server day once. While
  // the server answer is pending (and local says "not spoken"), Yumbie waits —
  // it must not speak and then discover the server already logged today.
  const localSpokeRef = useRef<boolean | null>(null);
  if (localSpokeRef.current === null) localSpokeRef.current = hasSpokenToday();
  const localSpoke = localSpokeRef.current;

  const [serverSpoke, setServerSpoke] = useState<boolean | null>(localSpoke ? true : null);
  const postedRef = useRef(false);

  // Fetch the server's last-spoke day once. Skip if localStorage already knows
  // Yumbie spoke today (no point hitting the network — same browser, same day).
  useEffect(() => {
    if (localSpoke) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/yumbie/daily-state", { cache: "no-store" });
        const json = res.ok ? ((await res.json()) as { spokeDay?: string | null }) : null;
        const day = typeof json?.spokeDay === "string" ? json.spokeDay : null;
        if (alive) setServerSpoke(day === localDayKey());
      } catch {
        // Server unknown (offline/dev) → fall back to local-only gating.
        if (alive) setServerSpoke(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [localSpoke]);

  // Already spoke today (local OR server) → stay silent. Server answer pending →
  // hold (don't speak yet). Once we speak, persist to BOTH layers.
  const alreadySpoke = localSpoke || serverSpoke === true;
  const awaitingServer = !localSpoke && serverSpoke === null;
  const markSpoke = () => {
    markSpokenToday();
    if (postedRef.current) return;
    postedRef.current = true;
    void fetch("/api/yumbie/daily-state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day: localDayKey() }),
    }).catch(() => {
      // Best effort — localStorage already silences this browser for the day.
    });
  };

  // Phase 3 — wire persistence callbacks (save cap, mark awareness seen)
  useEffect(() => {
    useYumbieGoals.getState().configure(src.persistCap ?? null);
    useYumbieInsight.getState().configure(src.markInsightSeen ?? null);
  }, [src.persistCap, src.markInsightSeen]);

  // (a) Daily one-liner → useYumbieMessage. Don't touch it while the tour is
  // active. When the tour ends NATURALLY, don't re-speak the daily line: the
  // closing line ("See you tomorrow") should remain Yumbie's last word — product
  // rule. On a normal initial load or real data changes, the daily line speaks
  // as usual.
  const prevTourActive = useRef(tourActive);
  useEffect(() => {
    const wasTour = prevTourActive.current;
    prevTourActive.current = tourActive;
    if (tourActive) return;
    if (wasTour) return; // tour just ended → don't overwrite the closing line
    // Already spoke today → stay silent for the rest of the day (every channel). Also clear any remaining message.
    if (alreadySpoke) {
      useYumbieMessage.getState().say(null);
      return;
    }
    // Don't speak while the server answer is pending — otherwise we might speak
    // and then discover we'd "already spoken today".
    if (awaitingServer) {
      useYumbieMessage.getState().say(null);
      return;
    }
    if (!src.ready) {
      useYumbieMessage.getState().say(null);
      return;
    }
    useYumbieMessage.getState().say(composeDailyLine(src, { t }));
    markSpoke(); // first entry is today's one utterance → mark local + server
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tourActive,
    alreadySpoke,
    awaitingServer,
    src.ready,
    src.newMonth,
    src.lastMonthCapWin,
    src.streakLapsed,
    src.streakMilestone,
    src.yesterdayReceipts,
    src.yesterdayPoints,
    src.streak,
    src.categories,
    locale,
  ]);

  // (c) Category ratios → useYumbieInsights (read by the patterns scene)
  useEffect(() => {
    const cats: YumbieCategory[] = src.categories ?? [];
    useYumbieInsights.getState().setCategories(cats);
  }, [src.categories]);

  // Phase 2 — progress sync (wallet reads cPoints, today reads bond)
  useEffect(() => {
    useYumbieProgress.getState().set({
      cPoints: src.cPoints,
      streak: src.streak,
      bond: src.bond,
      recentReceipts: src.recentReceipts,
    });
  }, [src.cPoints, src.streak, src.bond, src.recentReceipts]);

  // Phase 3 — load the user's existing soft caps (server truth)
  useEffect(() => {
    if (src.softCaps) useYumbieGoals.getState().hydrate(src.softCaps);
  }, [src.softCaps]);

  // Phase 3 — grounded awareness card (for the pill + sheet). Don't show it if
  // already spoke today or while the server answer is pending — stay-silent rule.
  useEffect(() => {
    const silent = alreadySpoke || awaitingServer;
    useYumbieInsight.getState().setInsight(silent ? null : (src.awareness ?? null));
  }, [src.awareness, alreadySpoke, awaitingServer]);

  // (b) Vitality: today's real check-in → small bump
  useEffect(() => {
    if (src.activeToday) useYumbieVitality.getState().bump(0.4);
  }, [src.activeToday]);

  // Phase 2 — streak milestone → noticeable vitality bump
  useEffect(() => {
    if (src.streakMilestone) useYumbieVitality.getState().bump(0.6);
  }, [src.streakMilestone]);

  // Phase 2 — if the weekly tour is ready, build the beats and offer them as a
  // pill (autonomy). Don't offer it if already spoke today or while the server
  // answer is pending — stay-silent rule.
  useEffect(() => {
    if (!alreadySpoke && !awaitingServer && src.weeklyReviewReady) {
      useYumbieTour.getState().setPending(buildWeeklyTourBeats(src, { t }));
    } else {
      useYumbieTour.getState().setPending(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src.weeklyReviewReady, src.categories, src.weekPointsEarned, src.streak, locale, alreadySpoke, awaitingServer]);

  return null;
}
