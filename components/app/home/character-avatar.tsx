"use client";

import { useTier } from "@/lib/theme/theme-context";

interface CharacterAvatarProps {
  level: number;
  size?: number;
  className?: string;
}

/**
 * SVG character that evolves with level (stages 1–4).
 * Uses tier accent for color; visual complexity increases at 25, 50, 75.
 */
export function CharacterAvatar({ level, size = 110, className }: CharacterAvatarProps) {
  const tier = useTier(level);
  const accent = tier.accent;
  const stage = level >= 75 ? 4 : level >= 50 ? 3 : level >= 25 ? 2 : 1;
  const body = tier.base ?? "#1a2a2a";

  const hasShoulders = stage >= 2;
  const hasCrown = stage >= 3;
  const hasAura = stage >= 3;
  const hasWings = stage >= 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 110 110"
      className={className}
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id={`aura-${level}-${stage}`} cx="50%" cy="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${level}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Aura ground glow */}
      {hasAura && (
        <ellipse cx="55" cy="95" rx="32" ry="10" fill={`url(#aura-${level}-${stage})`} />
      )}

      {/* Wings */}
      {hasWings && (
        <>
          <path
            d="M20 65 Q5 45 15 30 Q25 50 30 65"
            fill={accent}
            opacity="0.3"
          />
          <path
            d="M90 65 Q105 45 95 30 Q85 50 80 65"
            fill={accent}
            opacity="0.3"
          />
          <path
            d="M22 63 Q8 44 17 31 Q26 49 31 63"
            fill="none"
            stroke={accent}
            strokeWidth="1"
            opacity="0.6"
          />
          <path
            d="M88 63 Q102 44 93 31 Q84 49 79 63"
            fill="none"
            stroke={accent}
            strokeWidth="1"
            opacity="0.6"
          />
        </>
      )}

      {/* Body */}
      <ellipse
        cx="55"
        cy="75"
        rx="16"
        ry="18"
        fill={body}
        stroke={accent}
        strokeWidth="1.5"
      />

      {/* Shoulder armor */}
      {hasShoulders && (
        <>
          <ellipse
            cx="34"
            cy="68"
            rx="8"
            ry="5"
            fill={body}
            stroke={accent}
            strokeWidth="1.5"
            transform="rotate(-20,34,68)"
          />
          <ellipse
            cx="76"
            cy="68"
            rx="8"
            ry="5"
            fill={body}
            stroke={accent}
            strokeWidth="1.5"
            transform="rotate(20,76,68)"
          />
          <line x1="34" y1="65" x2="41" y2="67" stroke={accent} strokeWidth="1" opacity="0.6" />
          <line x1="76" y1="65" x2="69" y2="67" stroke={accent} strokeWidth="1" opacity="0.6" />
        </>
      )}

      {/* Chest emblem */}
      <circle cx="55" cy="73" r="4" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.8" />
      <circle cx="55" cy="73" r="1.5" fill={accent} opacity="0.9" />

      {/* Neck */}
      <rect x="50" y="54" width="10" height="8" rx="3" fill={body} stroke={accent} strokeWidth="1" />

      {/* Head */}
      <circle cx="55" cy="46" r="18" fill={body} stroke={accent} strokeWidth="1.5" />

      {/* Eyes */}
      <ellipse cx="48" cy="44" rx="4" ry="4.5" fill="#000" />
      <ellipse cx="62" cy="44" rx="4" ry="4.5" fill="#000" />
      <circle cx="49" cy="43" r="2.5" fill={accent} filter={`url(#glow-${level})`} opacity="0.9" />
      <circle cx="63" cy="43" r="2.5" fill={accent} filter={`url(#glow-${level})`} opacity="0.9" />
      <circle cx="50" cy="42" r="1" fill="#fff" opacity="0.6" />
      <circle cx="64" cy="42" r="1" fill="#fff" opacity="0.6" />

      {/* Mouth */}
      <path
        d="M49 52 Q55 57 61 52"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Crown */}
      {hasCrown && (
        <>
          <path
            d="M37 30 L40 22 L47 28 L55 18 L63 28 L70 22 L73 30 Z"
            fill={accent}
            opacity="0.9"
          />
          <circle cx="55" cy="20" r="2.5" fill="#fff" opacity="0.8" />
          <circle cx="40" cy="23" r="1.5" fill="#fff" opacity="0.6" />
          <circle cx="70" cy="23" r="1.5" fill="#fff" opacity="0.6" />
        </>
      )}

      {/* Level badge */}
      <circle cx="82" cy="30" r="12" fill="#111" stroke={accent} strokeWidth="1.5" />
      <text
        x="82"
        y="35"
        textAnchor="middle"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontWeight="800"
        fontSize="11"
        fill={accent}
      >
        {level}
      </text>

      {/* Scan lines on body */}
      <line x1="44" y1="72" x2="66" y2="72" stroke={accent} strokeWidth="0.5" opacity="0.3" />
      <line x1="46" y1="76" x2="64" y2="76" stroke={accent} strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}
