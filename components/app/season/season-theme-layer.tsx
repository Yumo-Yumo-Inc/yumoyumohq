"use client";

/**
 * SeasonThemeLayer — a real, app-wide theme skin, not just an accent swap.
 *
 * When the user equips a season "theme" cosmetic (e.g. Genesis Heat, L24), this
 * lays a warm forge ambiance over the whole app: molten ember + gold radial
 * glows and a faint warm vignette on top of the base ThemeBg. The accent is
 * already applied through the accent store; this adds the atmosphere that makes
 * it feel like a designed theme. Renders nothing when no season theme is equipped.
 */

import { useEffect } from "react";
import { useAppProfile } from "@/lib/app/profile-context";
import { useTheme } from "@/lib/theme/theme-context";
import { getSeasonCosmetic } from "@/config/season-cosmetics";

export function SeasonThemeLayer() {
  const { profile } = useAppProfile();
  const { theme } = useTheme();
  const key = profile?.themeAccent ?? null;
  const cosmetic = key ? getSeasonCosmetic(key) : null;
  const active = !!cosmetic && cosmetic.kind === "theme";
  const isLight = theme === "light";

  // Warm the app canvas itself (not just the accent) — a real theme, not a swatch.
  // Overrides the shell base tone so the whole background reads warm forge, then
  // restores it when the theme is unequipped or the layer unmounts.
  useEffect(() => {
    const root = document.documentElement;
    if (!active) return;
    const warm = isLight ? "#F5EEE6" : "#141009";
    const prev = root.style.getPropertyValue("--app-bg-shell");
    root.style.setProperty("--app-bg-shell", warm);
    return () => {
      if (prev) root.style.setProperty("--app-bg-shell", prev);
      else root.style.removeProperty("--app-bg-shell");
    };
  }, [active, isLight]);

  if (!active) return null;

  // Warm forge palette — stronger in dark, restrained in light so text stays legible.
  const a = isLight ? 0.12 : 0.26; // ember
  const g = isLight ? 0.1 : 0.2; // gold

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* a warm base wash so the whole app reads "forge mode", not just the corners */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(150deg, rgba(255,93,59,${isLight ? 0.04 : 0.07}), transparent 45%, rgba(255,157,71,${isLight ? 0.03 : 0.06}))`,
        }}
      />
      {/* molten ember — top right */}
      <div
        style={{
          position: "absolute", top: "-16%", right: "-10%", width: "72%", height: "60%", borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(255,93,59,${a}) 0%, transparent 66%)`,
          filter: "blur(10px)",
        }}
      />
      {/* forge gold — bottom left */}
      <div
        style={{
          position: "absolute", bottom: "-14%", left: "-10%", width: "68%", height: "58%", borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(255,157,71,${g}) 0%, transparent 68%)`,
          filter: "blur(10px)",
        }}
      />
      {/* faint warm vignette from the base to tie it together */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(130% 90% at 50% 130%, rgba(180,83,9,${isLight ? 0.06 : 0.13}) 0%, transparent 62%)`,
        }}
      />
    </div>
  );
}
