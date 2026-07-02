"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { getTier, type ThemeMode, type TierTheme } from "./tiers";

const STORAGE_KEY = "app-theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Theme level (e.g. URL ?level=40). When provided, all tier/color values are computed from this level. */
const ThemeLevelContext = createContext<number | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark",
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}

export function useThemeLevel(): number {
  const level = useContext(ThemeLevelContext);
  return level ?? 1;
}

export function ThemeLevelProvider({ level, children }: { level: number; children: ReactNode }) {
  return (
    <ThemeLevelContext.Provider value={level}>
      {children}
    </ThemeLevelContext.Provider>
  );
}

/**
 * Writes the tier accent color to a CSS variable.
 * Page background no longer changes with tier — a fixed DS slate is used.
 * Only the card border color is set per tier (for card accents).
 */
export function TierVarsInjector() {
  const level = useThemeLevel();
  const { theme } = useTheme();
  const tier = useMemo(() => getTier(level, theme), [level, theme]);

  useEffect(() => {
    const root = document.documentElement;
    const isLight = theme === "light";
    // Card border color per tier (for accents — bg does not change)
    const borderVal = isLight ? (tier.cardBorderLight ?? tier.cardBorder) : tier.cardBorder;
    root.style.setProperty("--app-border", borderVal);
    root.style.setProperty("--app-border-strong", borderVal);
    // Light theme: pull the background to the tier's light value
    if (isLight && tier.baseLight) {
      root.style.setProperty("--app-bg-shell", tier.baseLight);
      root.style.setProperty("--app-bg-base", tier.baseLight);
      root.style.setProperty("--app-bg-elevated", tier.cardBgLight ?? tier.cardBg);
      root.style.setProperty("--app-bg-surface", tier.cardBgLight ?? tier.cardBg);
    } else {
      // Dark: background is fixed slate, only the border follows the tier
      root.style.removeProperty("--app-bg-shell");
      root.style.removeProperty("--app-bg-base");
      root.style.removeProperty("--app-bg-elevated");
      root.style.removeProperty("--app-bg-surface");
    }
    return () => {
      root.style.removeProperty("--app-bg-shell");
      root.style.removeProperty("--app-bg-base");
      root.style.removeProperty("--app-bg-elevated");
      root.style.removeProperty("--app-bg-surface");
      root.style.removeProperty("--app-border");
      root.style.removeProperty("--app-border-strong");
    };
  }, [tier, theme]);

  return null;
}

/** Syncs the `app-theme-light` class on `<html>` and localStorage to the mode.
 *  Uses the same STORAGE_KEY and class name as ThemeInitScript → no double writes / flash. */
function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("app-theme-light", mode === "light");
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR/first render: defaults to dark (ThemeInitScript already adds the class before hydration).
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  // Read the stored preference after mount; invalid/empty → dark.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const mode: ThemeMode = stored === "light" ? "light" : "dark";
    setThemeState(mode);
    applyThemeMode(mode);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    applyThemeMode(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      applyThemeMode(next);
      return next;
    });
  }, []);

  const value: ThemeContextValue = { theme, setTheme, toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Returns tier colors together with the theme (dark/light).
 *  Milestone tier switching is currently disabled — always returns the Seed (gold) tier.
 *  To re-enable later: restore the `getTier(level, theme)` line. */
export function useTier(_accountLevel?: number): TierTheme {
  const { theme } = useTheme();
  return useMemo(() => getTier(1, theme), [theme]);
}
