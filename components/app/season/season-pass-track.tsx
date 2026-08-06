"use client";

/**
 * SeasonPassTrack — the horizontal, Apex-style reward track for the season pass.
 *
 * Read-only for now: it visualizes the caller's real season progress (level, XP)
 * against the node track from config/season-pass.ts. Tier nodes show the real
 * cPoints reward credited at season close; cosmetic nodes render as "yakında"
 * until the reward economics land (karar 2026-07-09). No claim button yet.
 */

import { useMemo, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { SeasonPassNode } from "@/config/season-pass";
import { getSeasonCosmetic, RARITY_META, type SeasonCosmetic } from "@/config/season-cosmetics";
import { RewardArt, rewardArtFor } from "@/components/app/season/reward-art";

/** Gold tone for the tier "points" coin. */
/**
 * The reward tile's contents — a hand-drawn RewardArt illustration for every
 * reward, tinted with the reward's own colour. No geometric glyph fallback.
 */
function RewardPreview({ node, cosmetic }: { node: SeasonPassNode; cosmetic: SeasonCosmetic | null }) {
  if (node.tier) return <RewardArt name="coin" tint="#FFD66B" size={44} />;
  if (!cosmetic) return <RewardArt name="spark" tint="#FF9D47" size={44} />;
  return <RewardArt name={rewardArtFor(cosmetic.glyph, cosmetic.kind)} tint={cosmetic.dark} size={44} />;
}

/** Heat colors per tier zone (cool spark → molten forge). */
const HEAT: Record<string, string> = {
  spark: "#4FB4FF",
  ember: "#FF9D47",
  flame: "#FF5D3B",
  forge: "#FFD66B",
};
const HEAT_FALLBACK = "#FF9D47";

type NodeState = "reached" | "current" | "locked";

function stateFor(level: number, seasonLevel: number): NodeState {
  if (level < seasonLevel) return "reached";
  if (level === seasonLevel) return "current";
  return "locked";
}

export function SeasonPassTrack({
  nodes,
  seasonLevel,
  cosmeticLabels,
  onSelect,
}: {
  nodes: SeasonPassNode[];
  seasonLevel: number;
  /** Localized display name per cosmetic key (from the season cosmetic catalog). */
  cosmeticLabels: Record<string, string>;
  /** Tap a node to open its reward detail sheet. */
  onSelect?: (node: SeasonPassNode) => void;
}) {
  const { locale } = useAppLocale();
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const l = (tr: string, en: string) => (locale === "tr" ? tr : en);
  const fmt = (n: number) => n.toLocaleString(locale);

  // Fill the rail up to the current level's marker.
  const NODE_W = 128;
  const reachedCount = useMemo(
    () => nodes.filter((n) => n.level <= seasonLevel).length,
    [nodes, seasonLevel],
  );
  const fillWidth = Math.max(0, reachedCount - 0.5) * NODE_W + 8;

  // Center the current node into view on mount.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = nodes.findIndex((n) => n.level === seasonLevel);
    if (idx < 0) return;
    const target = idx * NODE_W - el.clientWidth / 2 + NODE_W / 2 + 8;
    el.scrollTo({ left: Math.max(0, target), behavior: reduced ? "auto" : "smooth" });
  }, [nodes, seasonLevel, reduced]);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto overflow-y-visible"
      style={{ padding: "30px 6px 18px", margin: "0 -6px" }}
    >
      <div className="relative flex" style={{ minWidth: "max-content", padding: "0 8px" }}>
        {/* rail track + fill, threaded through the markers */}
        <div
          aria-hidden
          className="absolute left-0 right-0 rounded-full"
          style={{ top: 97, height: 6, background: "rgba(255,255,255,0.06)" }}
        />
        <div
          aria-hidden
          className="absolute left-0 rounded-full"
          style={{
            top: 97,
            height: 6,
            width: fillWidth,
            background: "linear-gradient(90deg, #4FB4FF, #FF9D47 55%, #FF5D3B)",
            boxShadow: "0 0 18px rgba(255,93,59,0.4)",
          }}
        />

        {nodes.map((node, i) => {
          const state = stateFor(node.level, seasonLevel);
          const heat = HEAT[node.tierKey] ?? HEAT_FALLBACK;
          const isCurrent = state === "current";
          const isReached = state === "reached";

          const cosmetic = node.cosmeticKey ? getSeasonCosmetic(node.cosmeticKey) : null;
          const label = node.tier
            ? `${fmt(node.tier.cpoints)} ${l("puan", "points")}`
            : node.cosmeticKey
              ? (cosmeticLabels[node.cosmeticKey] ?? l("Sezon ödülü", "Season reward"))
              : l("Sezon ödülü", "Season reward");
          // Tier nodes note "at season close"; cosmetic nodes show their rarity in
          // its colour — the "worth grinding for" signal.
          const rarityMeta = cosmetic ? RARITY_META[cosmetic.rarity] : null;
          const rarityColor = rarityMeta?.color ?? heat;
          const isHighRarity = cosmetic?.rarity === "epic" || cosmetic?.rarity === "legendary";
          const sub = node.tier ? l("sezon sonu", "at season close") : "";
          const rarityLabel = rarityMeta ? (locale === "tr" ? rarityMeta.label.tr : rarityMeta.label.en) : "";

          return (
            <motion.div
              key={node.level}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduced ? 0 : Math.min(i * 0.02, 0.5) }}
              className="relative flex flex-col items-center"
              style={{ width: NODE_W, flex: `0 0 ${NODE_W}px`, gap: 10, zIndex: isCurrent ? 4 : 1, cursor: onSelect ? "pointer" : "default" }}
              onClick={onSelect ? () => onSelect(node) : undefined}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
            >
              {/* reward tile — previews the actual cosmetic; rarity drives the glow */}
              <div
                className="relative grid place-items-center"
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 18,
                  border: `1px solid ${
                    isCurrent ? heat : isReached && cosmetic ? `${rarityColor}55` : "var(--app-border, rgba(255,255,255,0.08))"
                  }`,
                  background: isCurrent
                    ? `linear-gradient(160deg, rgba(255,157,71,0.10), var(--app-bg-elevated, #1e2536))`
                    : "linear-gradient(160deg, var(--app-bg-elevated, #1e2536), var(--app-bg-surface, #141826))",
                  opacity: state === "locked" ? 0.72 : 1,
                  filter: state === "locked" ? "grayscale(0.15)" : "none",
                  boxShadow: isCurrent
                    ? `0 0 0 1.5px ${heat}, inset 0 0 0 3px rgba(11,13,20,0.9), 0 10px 30px -12px ${heat}`
                    : isReached && isHighRarity
                      ? `0 0 18px ${rarityColor}55, inset 0 0 0 1px ${rarityColor}66`
                      : state === "locked" && isHighRarity
                        ? `0 0 12px ${rarityColor}33`
                        : "none",
                }}
              >
                <RewardPreview node={node} cosmetic={cosmetic} />
                {isCurrent && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute"
                    style={{ inset: 3, borderRadius: 13, border: `1px solid ${heat}55` }}
                  />
                )}
                {state === "locked" && (
                  <span
                    aria-hidden
                    className="absolute grid place-items-center rounded-full"
                    style={{
                      right: -3,
                      bottom: -3,
                      width: 22,
                      height: 22,
                      background: "var(--app-bg-surface, #141826)",
                      border: "1px solid var(--app-border, rgba(255,255,255,0.1))",
                    }}
                  >
                    <Lock className="h-3 w-3" style={{ color: "var(--app-text-muted)" }} aria-hidden />
                  </span>
                )}
                {isReached && (
                  <span
                    aria-hidden
                    className="absolute grid place-items-center rounded-full"
                    style={{
                      right: -4,
                      bottom: -4,
                      width: 22,
                      height: 22,
                      background: "linear-gradient(150deg, #FFD66B, #B98F2E)",
                    }}
                  >
                    <Check className="h-3 w-3" style={{ color: "#1a1206" }} strokeWidth={3} aria-hidden />
                  </span>
                )}
              </div>

              {/* marker on the rail */}
              <span
                aria-hidden
                className="relative rounded-full"
                style={{
                  width: isCurrent ? 24 : 22,
                  height: isCurrent ? 24 : 22,
                  border: "2px solid var(--app-bg, #0b0d14)",
                  zIndex: 2,
                  background: isReached
                    ? "linear-gradient(150deg, #FFD66B, #B98F2E)"
                    : isCurrent
                      ? heat
                      : "var(--app-bg-elevated, #1e2536)",
                  boxShadow: isCurrent ? `0 0 0 4px ${heat}33` : "none",
                }}
              />

              {/* level + reward label */}
              <span
                className="font-mono text-[13px] font-semibold tabular-nums"
                style={{
                  color: isReached
                    ? "var(--app-gold, #F5A623)"
                    : isCurrent
                      ? heat
                      : "var(--app-text-muted)",
                  opacity: state === "locked" ? 0.6 : 1,
                }}
              >
                {l("Sv", "Lv")} {node.level}
              </span>
              <span
                className="px-1 text-center text-[11px] leading-tight"
                style={{
                  minHeight: 28,
                  color: isCurrent ? "var(--app-text-primary)" : "var(--app-text-muted)",
                  fontWeight: isCurrent ? 600 : 400,
                  opacity: state === "locked" ? 0.6 : 1,
                }}
              >
                {label}
                {sub && (
                  <>
                    <br />
                    <span style={{ opacity: 0.7 }}>{sub}</span>
                  </>
                )}
                {rarityMeta && (
                  <>
                    <br />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: rarityMeta.color, opacity: state === "locked" ? 0.75 : 1 }}
                    >
                      {rarityLabel}
                    </span>
                  </>
                )}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
