"use client";

/**
 * Client data hooks for the /app/account command center. Each hook is defensive:
 * it never throws, returns a `loading`/`error` flag, and yields typed data the
 * sections render directly. Endpoints are already built (season/status,
 * user/badges); these only consume them.
 */

import { useCallback, useEffect, useState } from "react";
import { useDemoTour } from "@/lib/demo/tour-context";

type SeasonTierRef = { index: number; key: string; cpointsReward: number };
type SeasonNextTier = SeasonTierRef & { minSeasonXp: number };

export type SeasonStatus = {
  active: {
    seasonNumber: number;
    name: string;
    key: string | null;
    startAt: string;
    endAt: string;
    daysLeft: number;
  } | null;
  progress: {
    seasonXp: number;
    seasonLevel: number;
    currentTier: SeasonTierRef | null;
    nextTier: SeasonNextTier | null;
  };
};

type EarnedBadge = {
  key: string;
  title: string | null;
  description: string | null;
  icon_url: string | null;
  earned_at: string;
};

type BadgeShowcase = { badges: string[]; unlocked: boolean; max: number };

export type BadgesData = {
  earnedBadges: EarnedBadge[];
  catalog: Array<{ key: string; title: string | null; description: string | null; icon_url: string | null }>;
  titles: { earned: string[]; active: string | null };
  showcase: BadgeShowcase;
};

const EMPTY_SEASON: SeasonStatus = {
  active: null,
  progress: { seasonXp: 0, seasonLevel: 1, currentTier: null, nextTier: null },
};

export function useSeasonStatus() {
  const tour = useDemoTour();
  const [data, setData] = useState<SeasonStatus | null>(null);
  const [loading, setLoading] = useState(!tour.active);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (tour.active) return;
    let alive = true;
    fetch("/api/season/status", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (!alive) return;
        setData({ active: d.active ?? null, progress: d.progress ?? EMPTY_SEASON.progress });
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tour.active]);

  if (tour.active) return { data: tour.snapshot.season, loading: false, error: false };
  return { data, loading, error };
}

export function useBadges() {
  const [data, setData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/user/badges", { cache: "no-store", credentials: "include" });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as BadgesData;
      setData({
        earnedBadges: Array.isArray(d.earnedBadges) ? d.earnedBadges : [],
        catalog: Array.isArray(d.catalog) ? d.catalog : [],
        titles: { earned: d.titles?.earned ?? [], active: d.titles?.active ?? null },
        showcase: {
          badges: Array.isArray(d.showcase?.badges) ? d.showcase.badges : [],
          unlocked: d.showcase?.unlocked === true,
          max: typeof d.showcase?.max === "number" ? d.showcase.max : 3,
        },
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    if (alive) void load();
    return () => {
      alive = false;
    };
  }, [load]);

  /** Persist the display title; optimistic, reverts on failure. Returns success. */
  const selectTitle = useCallback(
    async (nextTitle: string | null): Promise<boolean> => {
      if (!data) return false;
      const previous = data.titles.active;
      setData({ ...data, titles: { ...data.titles, active: nextTitle } });
      setSaving(true);
      try {
        const r = await fetch("/api/user/badges", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeTitle: nextTitle }),
        });
        if (!r.ok) throw new Error(String(r.status));
        return true;
      } catch {
        setData((cur) => (cur ? { ...cur, titles: { ...cur.titles, active: previous } } : cur));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [data],
  );

  /** Persist the pinned showcase badges; optimistic, reverts on failure. */
  const setShowcase = useCallback(
    async (nextBadges: string[]): Promise<boolean> => {
      if (!data) return false;
      const previous = data.showcase.badges;
      const capped = nextBadges.slice(0, data.showcase.max);
      setData({ ...data, showcase: { ...data.showcase, badges: capped } });
      setSaving(true);
      try {
        const r = await fetch("/api/user/badges", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showcasedBadges: capped }),
        });
        if (!r.ok) throw new Error(String(r.status));
        return true;
      } catch {
        setData((cur) => (cur ? { ...cur, showcase: { ...cur.showcase, badges: previous } } : cur));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [data],
  );

  return { data, loading, error, saving, selectTitle, setShowcase, reload: load };
}
