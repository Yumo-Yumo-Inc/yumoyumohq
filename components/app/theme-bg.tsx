"use client";

import { useTheme } from "@/lib/theme/theme-context";

/**
 * App background. The base tone is driven by `--app-bg-shell` so it tracks the
 * active theme with zero flash: the `.dark.app-theme-light` rule in globals.css
 * sets that variable the moment ThemeInitScript adds the class (no JS frame).
 * In dark mode the variable is unset, so we fall back to the slate DS value.
 *
 * The corner glows are softened in light mode — a dark gold/brown radial over a
 * warm-light shell would read as muddy, so light mode uses a faint warm accent.
 */
export function ThemeBg({ accountLevel: _accountLevel, className }: { accountLevel?: number; className?: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className ?? ""}`}
      style={{ background: "var(--app-bg-shell, #0F1117)" }}
    >
      {/* Gold glow — top-left corner */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "55%",
          height: "45%",
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(ellipse at center, rgba(201,168,76,0.10) 0%, transparent 70%)"
            : "radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Muted glow — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "-8%",
          right: "-5%",
          width: "45%",
          height: "40%",
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)"
            : "radial-gradient(ellipse at center, rgba(100,60,8,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
