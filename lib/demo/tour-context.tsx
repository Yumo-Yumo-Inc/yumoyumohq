"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  DEMO_PREVIEW_COOKIE,
  DEMO_TOUR_STEP_KEY,
  readTourActiveFlag,
  writeTourActiveFlag,
} from "./constants";
import { getTourSnapshot, type TourSnapshot } from "./tour-snapshot";

export type TourStepId =
  | "welcome"
  | "receipts"
  | "month"
  | "nav-analysis"
  | "analysis-price"
  | "analysis-inflation"
  | "nav-season"
  | "season"
  | "nav-scan";

export type TourRoute = "/app/dashboard" | "/app/analysis" | "/app/season";

export const TOUR_STEP_IDS: readonly TourStepId[] = [
  "welcome",
  "receipts",
  "month",
  "nav-analysis",
  "analysis-price",
  "analysis-inflation",
  "nav-season",
  "season",
  "nav-scan",
];

const STEP_ROUTE: Record<TourStepId, TourRoute> = {
  welcome: "/app/dashboard",
  receipts: "/app/dashboard",
  month: "/app/dashboard",
  "nav-analysis": "/app/dashboard",
  "analysis-price": "/app/analysis",
  "analysis-inflation": "/app/analysis",
  "nav-season": "/app/analysis",
  season: "/app/season",
  "nav-scan": "/app/season",
};

export function routeForStep(id: TourStepId): TourRoute {
  return STEP_ROUTE[id];
}

export function isTourLauncherPath(pathname: string): boolean {
  return pathname.startsWith("/app/demo") || pathname.startsWith("/app/login");
}

/** Lowest step that belongs on this path. Used so a remount cannot yank the tour back. */
export function floorStepForPath(pathname: string): TourStepId | null {
  if (pathname.startsWith("/app/analysis")) return "analysis-price";
  if (pathname.startsWith("/app/season")) return "season";
  return null;
}

export function readStoredStep(): TourStepId {
  if (typeof window === "undefined") return "welcome";
  try {
    const raw = sessionStorage.getItem(DEMO_TOUR_STEP_KEY);
    return TOUR_STEP_IDS.includes(raw as TourStepId) ? (raw as TourStepId) : "welcome";
  } catch {
    return "welcome";
  }
}

type DemoTourContextValue = {
  active: boolean;
  snapshot: TourSnapshot;
  stepId: TourStepId;
  setStepId: (id: TourStepId) => void;
};

const DemoTourContext = createContext<DemoTourContextValue>({
  active: false,
  snapshot: getTourSnapshot(),
  stepId: "welcome",
  setStepId: () => {},
});

const activeListeners = new Set<() => void>();
const stepListeners = new Set<() => void>();

function subscribeActive(listener: () => void) {
  activeListeners.add(listener);
  return () => {
    activeListeners.delete(listener);
  };
}

function subscribeStep(listener: () => void) {
  stepListeners.add(listener);
  return () => {
    stepListeners.delete(listener);
  };
}

export function notifyDemoTourChanged() {
  activeListeners.forEach((fn) => fn());
  stepListeners.forEach((fn) => fn());
}

/** @deprecated use notifyDemoTourChanged */
export function notifyDemoTourCookieChanged() {
  notifyDemoTourChanged();
}

export function beginDemoTour() {
  writeTourActiveFlag(true);
  try {
    sessionStorage.setItem(DEMO_TOUR_STEP_KEY, "welcome");
  } catch {
    // sessionStorage may be blocked
  }
  notifyDemoTourChanged();
}

export function endDemoTour() {
  writeTourActiveFlag(false);
  notifyDemoTourChanged();
}

export function DemoTourProvider({ children }: { children: ReactNode }) {
  const active = useSyncExternalStore(subscribeActive, readTourActiveFlag, () => false);
  const stepId = useSyncExternalStore(subscribeStep, readStoredStep, () => "welcome" as TourStepId);
  const snapshot = useMemo(() => getTourSnapshot(), []);

  const setStepId = useCallback((id: TourStepId) => {
    try {
      sessionStorage.setItem(DEMO_TOUR_STEP_KEY, id);
    } catch {
      // sessionStorage may be blocked
    }
    stepListeners.forEach((fn) => fn());
  }, []);

  const value = useMemo(
    () => ({ active, snapshot, stepId, setStepId }),
    [active, snapshot, stepId, setStepId],
  );
  return <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>;
}

export function useDemoTour() {
  return useContext(DemoTourContext);
}

export function readDemoTourCookieName() {
  return DEMO_PREVIEW_COOKIE;
}
