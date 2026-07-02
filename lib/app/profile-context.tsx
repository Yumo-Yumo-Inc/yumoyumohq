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
import { readCachedProfile } from "@/lib/offline/cache";
import { PROFILE_QUERY_KEY } from "./query-keys";
import { syncMobileData } from "@/lib/sync";
import { LevelUpPopup, type LevelUpEvent } from "@/components/app/level-up-popup";
import type { MobileLevelEvent } from "@/lib/mobile/action-result-types";

export interface AppProfile {
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
  declaredMonthlyIncomeBand?: string | null;
  isAdmin?: boolean;
  honor: number;
  accountLevel: number;
  accountXp: number;
  seasonLevel: number;
  seasonXp: number;
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
  await loadBootstrapSnapshot().catch(() => {});
  const { profile, progress, wallet } = await readCachedProfile();
  if (!profile || !progress || !wallet) {
    throw new Error("Profile cache not ready");
  }
  return {
    username: profile.username,
    displayName: profile.displayName ?? undefined,
    avatarUrl: profile.avatarUrl ?? null,
    gender: profile.gender ?? null,
    birthDate: profile.birthDate ?? null,
    occupation: profile.occupation ?? null,
    city: profile.city ?? null,
    country: profile.country ?? null,
    website: profile.website ?? null,
    bio: profile.bio ?? null,
    declaredMonthlyIncomeBand: profile.declaredMonthlyIncomeBand ?? null,
    isAdmin: profile.isAdmin === true,
    honor: Math.max(0, Math.min(100, Number(profile.honor ?? 50) || 0)),
    accountLevel: progress.accountLevel ?? 1,
    accountXp: progress.accountXp ?? 0,
    seasonLevel: progress.seasonLevel ?? 1,
    seasonXp: progress.seasonXp ?? 0,
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

  const { data: profile, isLoading: loading, isError } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfileData,
    refetchInterval: 60_000,
    enabled: !isPublicAuthPath,
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("levelUpPreview") !== "1") return;
    window.setTimeout(() => {
      setLevelUpEvent({
        id: Date.now(),
        account: { from: 6, to: 7 },
        season: { from: 2, to: 3 },
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
    if (!event.account && !event.season) return;
    const key = [
      event.account ? `a:${event.account.from}-${event.account.to}` : "",
      event.season ? `s:${event.season.from}-${event.season.to}` : "",
    ].join("|");
    if (lastLevelEventKeyRef.current === key) return;
    lastLevelEventKeyRef.current = key;
    // The celebration (shockwave + glow + count-up + haptic) lives in LevelUpPopup
    // now — no confetti. Showing the event immediately IS the reward moment.
    window.setTimeout(() => setLevelUpEvent(event), 0);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const prev = prevLevelsRef.current;
    if (
      prev !== null &&
      (profile.accountLevel > prev.account || profile.seasonLevel > prev.season)
    ) {
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

  const refresh = useCallback(async () => {
    await syncMobileData().catch(() => {});
    await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  }, [queryClient]);

  return (
    <ProfileContext.Provider
      value={{ profile: profile ?? null, loading, error: isError, refresh, announceLevelUp }}
    >
      {children}
      {levelUpEvent ? (
        <LevelUpPopup event={levelUpEvent} onDismiss={() => setLevelUpEvent(null)} />
      ) : null}
    </ProfileContext.Provider>
  );
}
