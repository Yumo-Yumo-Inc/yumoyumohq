"use client";

import { forwardRef } from "react";
import type { SpendingIdentity, TraitKey } from "@/lib/insights/identity/identity-types";
import { className as classNameOf, classTagline, TRAIT_ACCENT, tx, UI } from "../identity-copy";
import { IdentityRadar } from "./identity-radar";

/**
 * The branded, theme-independent card that gets rasterized into the shared image.
 * It mirrors the on-screen identity hero (class name + tagline + radar) but drops
 * the interactive controls (period pills, share button) and pins a fixed dark
 * palette so the exported PNG looks the same regardless of the user's theme.
 *
 * The `--app-*` custom properties are set inline so the radar (which reads them
 * via `var()`) resolves to dark values inside this subtree even in light mode —
 * and so the screenshot engine sees concrete colors, not unresolved variables.
 */

const DARK_TOKENS: Record<string, string> = {
  "--app-border": "rgba(255,255,255,0.07)",
  "--app-border-strong": "rgba(255,255,255,0.12)",
  "--app-text-primary": "#F0F0FF",
  "--app-text-secondary": "#9BA8C0",
  "--app-text-muted": "#5A6680",
  "--app-bg-surface": "#1E2537",
};

interface Props {
  identity: SpendingIdentity;
  classKeys: [TraitKey, TraitKey];
  locale: string;
}

export const IdentityShareCard = forwardRef<HTMLDivElement, Props>(function IdentityShareCard(
  { identity, classKeys, locale },
  ref,
) {
  const accent = TRAIT_ACCENT[classKeys[0]];

  return (
    <div
      ref={ref}
      style={{
        ...DARK_TOKENS,
        width: 380,
        padding: 28,
        borderRadius: 28,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(165deg,#1E2537,#0D1018)",
        border: "1px solid rgba(255,255,255,0.10)",
        fontFamily:
          'var(--font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      {/* accent glow */}
      <div
        style={{
          position: "absolute",
          right: -56,
          top: -56,
          width: 200,
          height: 200,
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${accent}55, transparent 70%)`,
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#5A6680",
          textAlign: "center",
        }}
      >
        {tx(locale, UI.eyebrow)}
      </p>

      <h1
        style={{
          margin: "10px 0 0",
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.05,
          textAlign: "center",
          background: `linear-gradient(120deg, ${accent}, #E8C97A 85%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {classNameOf(classKeys, locale)}
      </h1>

      <p
        style={{
          margin: "8px auto 0",
          maxWidth: 300,
          fontSize: 12.5,
          lineHeight: 1.55,
          textAlign: "center",
          color: "#9BA8C0",
        }}
      >
        {classTagline(classKeys, locale)}
      </p>

      <div style={{ display: "grid", placeItems: "center", marginTop: 4 }}>
        <IdentityRadar
          traits={identity.traits}
          selected={null}
          onSelect={() => {}}
          locale={locale}
          primaryAccent={accent}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 4,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F0FF" }}>
          Yumo<span style={{ color: accent }}> Yumo</span>
        </span>
        <span style={{ fontSize: 11, color: "#5A6680" }}>· yumoyumo.com</span>
      </div>
    </div>
  );
});
