"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { patchCachedProfileFields, readCachedProfile } from "@/lib/offline/cache";
import { PROFILE_QUERY_KEY } from "./query-keys";
import { syncMobileData } from "@/lib/sync";
import { LevelUpPopup, type LevelUpEvent } from "@/components/app/level-up-popup";
import { UnlockRevealModal } from "@/components/app/journey/unlock-reveal-modal";
import { SeasonCompleteGate } from "@/components/app/season/season-complete-gate";
import { getUnlocksBetween, type AccountUnlock } from "@/config/account-unlocks";
import { setThemeAccentKey } from "@/lib/theme/accent-store";
import type { MobileLevelEvent } from "@/lib/mobile/action-result-types";
import { fetchAccountCountryWithRetry } from "@/lib/auth/account-country";
import { useDemoTour } from "@/lib/demo/tour-context";

interface AppProfile {
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  occupation?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  bio?: string | null;
  /** Name-color cosmetic palette key (account-level-4 unlock). null = no override. */
  nameColor?: string | null;
  /** Profile-frame cosmetic key (avatar-ring unlocks). null = no frame. */
  profileFrame?: string | null;
  /** Theme-accent cosmetic key (app accent override, L9+). null = brand accent. */
  themeAccent?: string | null;
  /** Profile-background cosmetic key (identity hero backdrop, L40). null = default. */
  profileBg?: string | null;
  /** Avatar-sticker cosmetic key (emoji on avatar corner, L14). null = none. */
  avatarSticker?: string | null;
  seal?: string | null;
  declaredMonthlyIncomeBand?: string | null;
  isAdmin?: boolean;
  honor: number;
  accountLevel: number;
  accountXp: number;
  seasonLevel: number;
  seasonXp: number;
  /** bINT balance — the user-facing "points" total. */
  pointsBalance: number;
  contributionPoints: {
    total: number;
    fromReceipts: number;
    fromQuests: number;
    contributionReceipts: number;
    lastContributionAt: string | null;
  };
  streak: number;
  checkedInToday: boolean;
  accountXpNext?: number;
  accountXpPrev?: number;
  currentSeason?: {
    id: number;
    seasonNumber: number;
    name: string;
    startAt: string;
    endAt: string;
  } | null;
}

async function fetchProfileData(): Promise<AppProfile> {
  const country = await fetchAccountCountryWithRetry();
  await loadBootstrapSnapshot().catch(() => {});
  const { profile, progress, wallet } = await readCachedProfile();
  if (!profile || !progress || !wallet) {
    throw new Error("Profile cache not ready");
  }
  if (country && country !== profile.country) {
    await patchCachedProfileFields({ country });
  }
  return {
    username: profile.username,
    displayName: profile.displayName ?? undefined,
    avatarUrl: profile.avatarUrl ?? null,
    gender: profile.gender ?? null,
    birthDate: profile.birthDate ?? null,
    occupation: profile.occupation ?? null,
    city: profile.city ?? null,
    country: country ?? null,
    website: profile.website ?? null,
    bio: profile.bio ?? null,
    nameColor: profile.nameColor ?? null,
    profileFrame: profile.profileFrame ?? null,
    themeAccent: profile.themeAccent ?? null,
    profileBg: profile.profileBg ?? null,
    avatarSticker: profile.avatarSticker ?? null,
    seal: profile.seal ?? null,
    declaredMonthlyIncomeBand: profile.declaredMonthlyIncomeBand ?? null,
    isAdmin: profile.isAdmin === true,
    honor: Math.max(0, Math.min(100, Number(profile.honor ?? 50) || 0)),
    accountLevel: progress.accountLevel ?? 1,
    accountXp: progress.accountXp ?? 0,
    seasonLevel: progress.seasonLevel ?? 1,
    seasonXp: progress.seasonXp ?? 0,
    pointsBalance: Number(wallet.pointsBalance ?? 0) || 0,
    contributionPoints: {
      total: Number(wallet.contributionTotal ?? 0) || 0,
      fromReceipts: Number(wallet.contributionFromReceipts ?? 0) || 0,
      fromQuests: Number(wallet.contributionFromQuests ?? 0) || 0,
      contributionReceipts: Number(wallet.contributionReceipts ?? 0) || 0,
      lastContributionAt:
        typeof wallet.lastContributionAt === "string" && wallet.lastContributionAt.trim()
          ? wallet.lastContributionAt
          : null,
    },
    streak: progress.streak ?? 0,
    checkedInToday: progress.checkedInToday ?? false,
    currentSeason: progress.currentSeason ?? null,
  };
}

type ProfileContextValue = {
  profile: AppProfile | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  announceLevelUp: (event: MobileLevelEvent) => void;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function useAppProfile() {
  const ctx = useContext(ProfileContext);
  return ctx ?? { profile: null, loading: false, error: false, refresh: async () => {}, announceLevelUp: () => {} };
}

export function AppProfileProvider({ children }: { children: ReactNode }) {
  const tour = useDemoTour();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isPublicAuthPath =
    pathname === "/app/login" ||
    pathname === "/app/register" ||
    pathname === "/app/verify-email" ||
    pathname === "/app/forgot-password" ||
    pathname === "/app/reset-password";
  const prevLevelsRef = useRef<{ account: number; season: number } | null>(null);
  const lastLevelEventKeyRef = useRef<string | null>(null);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [pendingUnlocks, setPendingUnlocks] = useState<{ level: number; unlocks: AccountUnlock[] } | null>(null);
  const [activeUnlockReveal, setActiveUnlockReveal] = useState<{ level: number; unlocks: AccountUnlock[] } | null>(null);

  // Unlock reveal plays once per unlock key — guarded via localStorage so a
  // profile refetch or another device session can't replay an already-seen reveal.
  const queueUnlockReveal = useCallback((fromLevel: number, toLevel: number) => {
    const seenKey = "yumo_unlock_reveal_seen";
    let seen: string[] = [];
    try {
      seen = JSON.parse(window.localStorage.getItem(seenKey) ?? "[]");
      if (!Array.isArray(seen)) seen = [];
    } catch { seen = []; }
    const fresh = getUnlocksBetween(fromLevel, toLevel).filter((u) => !seen.includes(u.key));
    if (fresh.length === 0) return;
    try {
      window.localStorage.setItem(seenKey, JSON.stringify([...seen, ...fresh.map((u) => u.key)]));
    } catch { /* localStorage unavailable — reveal still plays this once */ }
    setPendingUnlocks({ level: toLevel, unlocks: fresh });
  }, []);

  const { data: profile, isLoading: loading, isError } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfileData,
    refetchInterval: 60_000,
    enabled: !isPublicAuthPath && !tour.active,
  });

  // Mirror the chosen theme accent into the external store so useTier (mounted
  // above this provider) can override the app accent app-wide.
  useEffect(() => {
    setThemeAccentKey(profile?.themeAccent ?? null);
  }, [profile?.themeAccent]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("levelUpPreview") !== "1") return;
    window.setTimeout(() => {
      setLevelUpEvent({
        id: Date.now(),
        account: { from: 6, to: 7 },
      });
    }, 200);
  }, []);

  // Mount-time profile fetch was previously triggering its own syncMobileData()
  // call here, which fired in parallel with OfflineBootstrapManager's mount sync.
  // Even though both went through the in-flight dedup, they often ended up as
  // two separate network requests because profile-context's effect runs before
  // the bootstrap manager's IndexedDB load completes.
  //
  // OfflineBootstrapManager already covers this path:
  //   1) it runs the initial sync on mount, and
  //   2) its subscribeLocalDbChanges listener invalidates PROFILE_QUERY_KEY
  //      whenever IndexedDB writes happen (debounced 1s).
  //
  // Removing the duplicate sync here cuts dashboard mount from 2 syncs → 1.

  const announceLevelUp = useCallback((event: MobileLevelEvent) => {
    // Season level-ups no longer interrupt with a center-screen popup — they
    // flow into the season pass track ("Sezon Geçişi") instead. Only account
    // level-ups, which are rare and permanent, keep the celebration popup.
    if (!event.account) return;
    const key = `a:${event.account.from}-${event.account.to}`;
    if (lastLevelEventKeyRef.current === key) return;
    lastLevelEventKeyRef.current = key;
    // The celebration (shockwave + glow + count-up + haptic) lives in LevelUpPopup
    // now — no confetti. Showing the event immediately IS the reward moment.
    window.setTimeout(() => setLevelUpEvent({ id: event.id, account: event.account }), 0);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const prev = prevLevelsRef.current;
    if (
      prev !== null &&
      (profile.accountLevel > prev.account || profile.seasonLevel > prev.season)
    ) {
      if (profile.accountLevel > prev.account) {
        queueUnlockReveal(prev.account, profile.accountLevel);
      }
      announceLevelUp({
        id: Date.now(),
        account:
          profile.accountLevel > prev.account
            ? { from: prev.account, to: profile.accountLevel }
            : undefined,
        season:
          profile.seasonLevel > prev.season
            ? { from: prev.season, to: profile.seasonLevel }
            : undefined,
      });
    }
    prevLevelsRef.current = {
      account: profile.accountLevel,
      season: profile.seasonLevel,
    };
  }, [announceLevelUp, profile?.accountLevel, profile?.seasonLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!levelUpEvent) return;
    const timer = window.setTimeout(() => {
      setLevelUpEvent((current) => (current?.id === levelUpEvent.id ? null : current));
    }, 6_000);
    return () => window.clearTimeout(timer);
  }, [levelUpEvent]);

  // The unlock reveal waits for the level-up popup to leave the stage, then plays.
  useEffect(() => {
    if (levelUpEvent || !pendingUnlocks) return;
    setActiveUnlockReveal(pendingUnlocks);
    setPendingUnlocks(null);
  }, [levelUpEvent, pendingUnlocks]);

  // Dev preview: /app/...?unlockPreview=<level> plays the reveal for that level.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const params = new URLSearchParams(window.location.search);
    const lvl = Number(params.get("unlockPreview"));
    if (!Number.isFinite(lvl) || lvl < 1) return;
    const unlocks = getUnlocksBetween(lvl - 1, lvl);
    if (unlocks.length > 0) {
      window.setTimeout(() => setActiveUnlockReveal({ level: lvl, unlocks }), 300);
    }
  }, []);

  const refresh = useCallback(async () => {
    // force: bypass the 15s sync throttle — an explicit refresh (cosmetic equip,
    // pull-to-refresh) must hit the server, or the cache stays stale and the UI
    // shows the old value. fullProfile: pull the whole profile record, not a
    // timestamp-delta that could omit it.
    await syncMobileData({ force: true, fullProfile: true }).catch(() => {});
    await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  }, [queryClient]);

  return (
    <ProfileContext.Provider
      value={{
        profile: tour.active ? (tour.snapshot.profile as AppProfile) : profile ?? null,
        loading: tour.active ? false : loading,
        error: tour.active ? false : isError,
        refresh,
        announceLevelUp,
      }}
    >
      {children}
      {levelUpEvent ? (
        <LevelUpPopup event={levelUpEvent} onDismiss={() => setLevelUpEvent(null)} />
      ) : null}
      {!levelUpEvent && activeUnlockReveal ? (
        <UnlockRevealModal
          unlocks={activeUnlockReveal.unlocks}
          level={activeUnlockReveal.level}
          onDismiss={() => setActiveUnlockReveal(null)}
        />
      ) : null}
      {!isPublicAuthPath && !tour.active && !levelUpEvent && !activeUnlockReveal ? (
        <SeasonCompleteGate />
      ) : null}
    </ProfileContext.Provider>
  );
}
