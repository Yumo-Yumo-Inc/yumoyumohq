"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  /** Show the current theme name beside the icon (used in the side menu row). */
  showLabel?: boolean;
}

/**
 * Light/dark theme switch. Reads/writes the shared theme context
 * (lib/theme/theme-context.tsx), which persists the choice to localStorage and
 * toggles the `app-theme-light` class on <html>. ThemeInitScript applies the
 * stored class before hydration, so there is no flash on reload.
 */
export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useAppLocale();

  // Avoid hydration mismatch: server renders the dark-mode icon; after mount we
  // reflect the real stored theme. The label/icon swap only happens client-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isLight = mounted && theme === "light";
  const Icon = isLight ? Sun : Moon;
  const label = isLight ? t("settings.themeLight") : t("settings.themeDark");

  if (showLabel) {
    return (
      <button
        suppressHydrationWarning
        type="button"
        onClick={toggleTheme}
        aria-label={t("settings.themeSwitch")}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
          "hover:bg-white/[0.06] active:bg-white/[0.08]",
          className
        )}
        style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--app-bg-elevated)", color: "var(--app-primary)" }}
        >
          <Icon size={17} strokeWidth={2} />
        </span>
        <span className="flex-1 text-left text-[14px] font-semibold">{label}</span>
      </button>
    );
  }

  return (
    <button
      suppressHydrationWarning
      type="button"
      onClick={toggleTheme}
      aria-label={t("settings.themeSwitch")}
      title={label}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border transition-colors hover:opacity-90",
        className
      )}
      style={{
        background: "color-mix(in srgb, var(--app-header-nav-icon) 10%, transparent)",
        borderColor: "var(--app-header-nav-border)",
        color: "var(--app-header-nav-icon)",
      }}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}
