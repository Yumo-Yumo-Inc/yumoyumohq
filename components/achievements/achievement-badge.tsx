"use client";

/**
 * AchievementBadge — one tier badge in the Yumo Yumo visual language: squircle
 * body + receipt tear-line + teal→gold tier color + rank pips. EVERY badge is
 * unique: its own icon (badge-icons.ts), its own tier color position, its own pip
 * count. No two badges in the catalog are interchangeable.
 *
 *  - earned: full tier color, own icon, filled pips, glow at the top of a track.
 *  - locked: same identity (own icon + color + pips) but ghosted — dashed ring,
 *    dimmed icon (discovery-reveal). A locked tier-1 still differs from a locked
 *    tier-6 AND from every other badge.
 */

import { useId } from "react";
import { Award } from "lucide-react";
import { squirclePath, tierPalette } from "@/lib/achievements/badge-art";
import { BADGE_TIER_ICON } from "@/components/achievements/badge-icons";

const RECEIPT_MOTIF = "M30 64 q3 -4 6 0 t6 0 t6 0 t6 0 t6 0 t6 0";

function Pips({
  tierIndex,
  tierCount,
  color,
  ghost,
}: {
  tierIndex: number;
  tierCount: number;
  color: string;
  ghost: boolean;
}) {
  const w = 4.4;
  const gap = 2.4;
  const full = (w + gap) * tierCount;
  const x0 = -full / 2 + w / 2;
  return (
    <g transform="translate(48,76)">
      {Array.from({ length: tierCount }).map((_, k) => {
        const on = k < tierIndex;
        return (
          <rect
            key={k}
            x={Number((x0 + k * (w + gap) - w / 2).toFixed(2))}
            y={-2}
            width={w}
            height={4}
            rx={1.4}
            fill={on ? color : "none"}
            stroke={color}
            strokeWidth={on ? 0 : 1}
            opacity={ghost ? (on ? 0.42 : 0.22) : on ? 1 : 0.4}
          />
        );
      })}
    </g>
  );
}

export function AchievementBadge({
  badgeKey,
  tierIndex,
  tierCount,
  earned,
  size = 96,
}: {
  badgeKey: string;
  tierIndex: number;
  tierCount: number;
  earned: boolean;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const Icon = BADGE_TIER_ICON[badgeKey] ?? Award;
  const pal = tierPalette(tierIndex, tierCount);

  const body = squirclePath(96, 4.2, 4);
  const inner = squirclePath(96, 4.2, 13);

  // Icon sits centered above the pip row (the inner svg renders at translate origin).
  const iconSize = 40;

  if (!earned) {
    return (
      <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label="Locked achievement">
        <path d={body} fill="#0F1A18" stroke={pal.ring[0]} strokeOpacity={0.4} strokeWidth={1.4} strokeDasharray="3 4" />
        <path d={inner} fill="none" stroke={pal.ring[0]} strokeWidth={1} opacity={0.14} />
        <g opacity={0.12} stroke={pal.ring[0]} strokeWidth={1.4} strokeLinecap="round" fill="none">
          <path d={RECEIPT_MOTIF} />
        </g>
        <g transform="translate(28,20)" opacity={0.34}>
          <Icon width={iconSize} height={iconSize} color={pal.iconColor} strokeWidth={1.7} absoluteStrokeWidth />
        </g>
        <Pips tierIndex={tierIndex} tierCount={tierCount} color={pal.iconColor} ghost />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label="Achievement earned">
      <defs>
        <linearGradient id={`f${uid}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={pal.fillA} />
          <stop offset="1" stopColor={pal.fillB} />
        </linearGradient>
        <linearGradient id={`r${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pal.ring[0]} />
          <stop offset="1" stopColor={pal.ring[1]} />
        </linearGradient>
        <radialGradient id={`h${uid}`} cx="50%" cy="42%" r="58%">
          <stop offset="0" stopColor={pal.gold ? "#FFD888" : "#74F0DC"} stopOpacity="0.9" />
          <stop offset="1" stopColor={pal.gold ? "#F2B33D" : "#2BC4AE"} stopOpacity="0" />
        </radialGradient>
      </defs>

      {pal.glow && <path d={squirclePath(96, 4.2, 1)} fill={`url(#h${uid})`} opacity="0.55" />}
      <path d={body} fill={`url(#f${uid})`} stroke={`url(#r${uid})`} strokeWidth={1.6} />
      <path d={inner} fill="none" stroke={pal.ring[0]} strokeWidth={1} opacity="0.35" />

      <g opacity="0.16" stroke={pal.ring[0]} strokeWidth={1.4} strokeLinecap="round" fill="none">
        <path d={RECEIPT_MOTIF} />
      </g>

      <g transform="translate(28,20)">
        <Icon width={iconSize} height={iconSize} color={pal.iconColor} strokeWidth={1.7} absoluteStrokeWidth />
      </g>

      <Pips tierIndex={tierIndex} tierCount={tierCount} color={pal.iconColor} ghost={false} />
    </svg>
  );
}
