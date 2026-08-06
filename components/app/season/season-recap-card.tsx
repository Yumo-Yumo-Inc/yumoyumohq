"use client";

/**
 * SeasonRecapCard — a shareable "my season so far" card. The hero is the hidden
 * cost the user uncovered this season (Yumo Yumo's core value), with the season
 * tier, receipts, spend and rank beneath it. Fixed dark palette (not app theme
 * tokens) so a screenshot captures identically in any theme, matching the
 * IdentityShareCard / share-card approach. Purely visual — rasterized on share.
 */

import { forwardRef } from "react";

export type SeasonRecapStats = {
  receipts: number;
  hiddenCost: number;
  spend: number;
  points: number;
  rank: number | null;
};

const TIER_HEX: Record<string, string> = {
  spark: "#4FB4FF", ember: "#FF9D47", flame: "#FF5D3B", forge: "#FFD66B",
};

export const SeasonRecapCard = forwardRef<
  HTMLDivElement,
  {
    seasonName: string;
    tierKey: string;
    tierLabel: string;
    seasonLevel: number;
    maxLevel: number;
    stats: SeasonRecapStats;
    currency: string;
    displayName: string;
    locale: string;
  }
>(function SeasonRecapCard(
  { seasonName, tierKey, tierLabel, seasonLevel, maxLevel, stats, currency, displayName, locale },
  ref,
) {
  const l = (tr: string, en: string) => (locale === "tr" ? tr : en);
  const heat = TIER_HEX[tierKey] ?? TIER_HEX.ember;
  const fmt = (n: number) => n.toLocaleString(locale === "tr" ? "tr-TR" : "en-US");
  const money = (n: number) => `${currency}${fmt(n)}`;

  const chip = (label: string, value: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 20, fontWeight: 700, color: "#F0F0FF", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(240,240,255,0.45)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        width: 380,
        borderRadius: 22,
        overflow: "hidden",
        position: "relative",
        padding: "26px 24px 20px",
        color: "#F0F0FF",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        background:
          "radial-gradient(320px 200px at 82% -8%, rgba(255,157,71,0.28), transparent 62%), " +
          "radial-gradient(260px 160px at 8% 108%, rgba(255,214,107,0.14), transparent 60%), " +
          "linear-gradient(165deg, #141826, #0A0C12)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {/* eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: heat, boxShadow: `0 0 10px ${heat}` }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: heat }}>
          {seasonName} · {l("SEZONUM", "MY SEASON")}
        </span>
      </div>

      {/* hero — hidden cost uncovered */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 12.5, color: "rgba(240,240,255,0.6)", lineHeight: 1.4 }}>
          {l("Bu sezon gün ışığına çıkardığın gizli maliyet", "The hidden cost you uncovered this season")}
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            marginTop: 6,
            background: "linear-gradient(180deg, #FFE9B0, #E8C97A 55%, #C9A84C)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {money(stats.hiddenCost)}
        </div>
      </div>

      {/* tier + level */}
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999,
            border: `1px solid ${heat}66`, background: `${heat}18`, fontSize: 12, fontWeight: 700, color: "#F0F0FF",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: heat }} />
          {tierLabel}
        </span>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: "rgba(240,240,255,0.7)" }}>
          {l("Seviye", "Level")} {seasonLevel}/{maxLevel}
        </span>
      </div>

      {/* stat row */}
      <div
        style={{
          marginTop: 18, paddingTop: 16, display: "flex", gap: 12,
          borderTop: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        {chip(l("Fiş", "Receipts"), fmt(stats.receipts))}
        {chip(l("Harcama", "Spend"), money(stats.spend))}
        {chip(l("Sıra", "Rank"), stats.rank ? `#${fmt(stats.rank)}` : "—")}
      </div>

      {/* footer */}
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,240,255,0.9)" }}>{displayName}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: "rgba(240,240,255,0.5)" }}>
          Yumo Yumo · yumoyumo.com
        </span>
      </div>
    </div>
  );
});
