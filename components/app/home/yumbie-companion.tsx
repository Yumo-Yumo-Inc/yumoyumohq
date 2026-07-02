"use client";

import { cn } from "@/lib/utils";
import type { YumbieMood, YumbieExpression } from "@/lib/app/use-yumbie-mood";

interface YumbieCompanionProps {
  className?: string;
  /** Extra class passed to the SVG — for size/aspect overrides. */
  imageClassName?: string;
  /** Persistent state (derived from long-term user behavior). */
  mood?: YumbieMood;
  /** Transient reaction (plays for 1-2s on mount or when the prop changes). */
  expression?: YumbieExpression;
}

/**
 * Yumbie — cat-face companion (rounded yellow square face + black tie).
 *
 * Sharpness: the character is drawn directly as inline `<svg>` (no PNG/`<img>`),
 * so it stays mathematically sharp at every scale, including retina. The glow is
 * not a filter INSIDE the SVG — it is a separate blurred `div` BEHIND the SVG; no
 * CSS filter (`drop-shadow`/`blur`) is applied to the SVG itself. Size is set via
 * `width`/`height` (Tailwind px classes), NOT `transform: scale()`.
 *
 * Design language:
 *   • Soft rounded square face (#F2C14E), volume from two inner shadow ellipses
 *   • Large, bright eyes (black iris + white highlight) — expression comes from the eyes
 *   • Pink cheeks + cat mouth (ω) — the mouth stays a cat mouth in every mood
 *   • Black tie (at the chin), always visible
 *   • Blurred glow behind the character, color shifts with mood
 *
 * Mood mapping:
 *   idle     → open eyes + cat mouth + calm glow
 *   happy    → ^_^ smiling eyes + wide cat mouth + warm glow
 *   worried  → open eyes + inward-raised worried brows + small cat mouth + soft amber glow
 *   asleep   → closed ‿‿ eyes + zZz + small calm cat mouth + faint dim glow
 *
 * Expression (transient):
 *   celebrate → heart eyes + wide cat mouth + warm glow + rising gold specks from below
 */
export function YumbieCompanion({
  className,
  imageClassName,
  mood = "idle",
  expression = null,
}: YumbieCompanionProps) {
  const visual: YumbieMood | "celebrate" =
    expression === "celebrate" ? "celebrate" : mood;

  const palette = getPalette(visual);
  const auraClass = getAuraClass(visual);
  const moodId = visual; // unique gradient ids per mood

  return (
    <div
      className={cn(
        "relative flex h-44 w-44 items-center justify-center overflow-visible sm:h-48 sm:w-48",
        className
      )}
      data-mood={mood}
      data-expression={expression ?? undefined}
    >
      {/* Glow — BEHIND the SVG, a separate blurred div. No filter is applied to the
          SVG, so the character stays sharp; softness lives only in this layer. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full blur-2xl",
          auraClass
        )}
        style={{
          opacity: 0.55,
          background: `radial-gradient(circle at 50% 50%, ${palette.auraInner} 0%, ${palette.auraOuter} 48%, transparent 74%)`,
        }}
      />

      <svg
        viewBox="14 2 172 172"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Yumbie (${mood})`}
        className={cn("relative z-10 h-full w-full select-none", imageClassName)}
      >
        <defs>
          {/* Clip that constrains the face's inner shadows to the face shape */}
          <clipPath id={`yb-face-clip-${moodId}`}>
            <rect x="30" y="22" width="140" height="132" rx="46" />
          </clipPath>
        </defs>

        {/* ── Face base ─────────────────────────────────────────── */}
        <rect
          x="30"
          y="22"
          width="140"
          height="132"
          rx="46"
          fill={palette.face}
        />
        <g clipPath={`url(#yb-face-clip-${moodId})`}>
          <ellipse cx="78" cy="40" rx="44" ry="17" fill={palette.faceHi} />
          <ellipse cx="106" cy="152" rx="62" ry="20" fill={palette.faceLo} />
        </g>

        {/* ── Accessory: black tie (always) ──────────────────── */}
        <BlackTie />

        {/* ── Face: eyes + cheeks + cat mouth per mood ────────────── */}
        <YumbieFace mood={visual} />

        {/* Mood-specific ambient effects — from the sides/below the body */}
        {visual === "celebrate" && <CelebrateParticles />}
        {visual === "happy" && <HappyParticles />}
        {visual === "asleep" && <SleepDust />}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Constants — eye positions (from the HTML reference)
 * ───────────────────────────────────────────────────────────────── */

const EYE_L = 67;
const EYE_R = 133;
const EYE_Y = 79;

/* ─────────────────────────────────────────────────────────────────
 * Accessory — black tie
 * ───────────────────────────────────────────────────────────────── */

/** Black tie — hangs at the chin, knot is a 45°-rotated square. */
function BlackTie() {
  return (
    <g>
      {/* Hanging blade — two tones left/right (volume) */}
      <path d="M100 131 L92 138 L100 151 L108 138 Z" fill="#1E1E24" />
      <path d="M100 131 L108 138 L100 151 Z" fill="#0E0E12" />
      {/* Thin left highlight — matte black material feel */}
      <path d="M100 133 L95 138 L100 148 Z" fill="#34343C" opacity="0.55" />
      {/* Knot — 45° square, dark bottom half */}
      <g transform="translate(100,126) rotate(45)">
        <rect x="-5.5" y="-5.5" width="11" height="11" rx="3" fill="#26262C" />
        <rect x="-5.5" y="0" width="11" height="5.5" rx="3" fill="#121216" />
      </g>
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Face — eye shape + cheeks + cat mouth per mood
 * ───────────────────────────────────────────────────────────────── */

function YumbieFace({ mood }: { mood: YumbieMood | "celebrate" }) {
  if (mood === "celebrate") return <CelebrateFace />;
  if (mood === "happy") return <HappyFace />;
  if (mood === "worried") return <WorriedFace />;
  if (mood === "asleep") return <SleepFace />;
  return <IdleFace />;
}

/* Open eye — black iris + large white highlight + small secondary speck.
   The group closes together via the blink animation (scaleY=0). */
function OpenEye({ cx }: { cx: number }) {
  return (
    <g
      className="animate-yk-blink"
      style={{
        transformOrigin: `${cx}px ${EYE_Y}px`,
        transformBox: "view-box",
      }}
    >
      <ellipse cx={cx} cy={EYE_Y} rx="15" ry="18" fill="#2B2118" />
      <circle
        cx={cx + 6}
        cy={EYE_Y - 8}
        r="5.5"
        fill="#FFF7E8"
        className="animate-yk-eye-shine"
      />
      <circle cx={cx - 5} cy={EYE_Y + 8} r="3" fill="#CDBDA6" />
    </g>
  );
}

/* Closed eye — downward curve ‿ (sleep) */
function ClosedEye({ cx }: { cx: number }) {
  return (
    <path
      d={`M${cx - 13} ${EYE_Y} Q${cx} ${EYE_Y + 9} ${cx + 13} ${EYE_Y}`}
      stroke="#2B2118"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
  );
}

/* Smiling eye — upward curve ^ (happy) */
function HappyEye({ cx }: { cx: number }) {
  return (
    <path
      d={`M${cx - 13} ${EYE_Y + 2} Q${cx} ${EYE_Y - 11} ${cx + 13} ${EYE_Y + 2}`}
      stroke="#2B2118"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
  );
}

/* Heart eye — celebration */
function HeartEye({ cx }: { cx: number }) {
  return (
    <path
      transform={`translate(${cx - 14},${EYE_Y - 14}) scale(2.3)`}
      d="M0 4 C0 0 6 0 6 4 C6 0 12 0 12 4 C12 8.5 6 12.5 6 12.5 C6 12.5 0 8.5 0 4 Z"
      fill="#E85D75"
    />
  );
}

/* Pink cheeks */
function Cheeks({ opacity = 1 }: { opacity?: number }) {
  return (
    <g opacity={opacity}>
      <ellipse cx="49" cy="98" rx="10" ry="5.5" fill="#EF8F74" />
      <ellipse cx="151" cy="98" rx="10" ry="5.5" fill="#EF8F74" />
    </g>
  );
}

/* Cat mouth (ω) — preserved across every mood, only size/position changes.
   variant: "base" (idle) · "big" (happy/celebrate) · "small" (worried/asleep) */
function CatMouth({
  variant = "base",
  opacity = 1,
}: {
  variant?: "base" | "big" | "small";
  opacity?: number;
}) {
  const d =
    variant === "big"
      ? "M82 101 Q92 113 100 103 Q108 113 118 101"
      : variant === "small"
        ? "M89 103 Q94.5 108.5 100 103.5 Q105.5 108.5 111 103"
        : "M86 102 Q93 110 100 102 Q107 110 114 102";
  return (
    <path
      d={d}
      stroke="#5B3210"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={opacity}
    />
  );
}

/* Idle — open eyes + cheeks + cat mouth. */
function IdleFace() {
  return (
    <g>
      <OpenEye cx={EYE_L} />
      <OpenEye cx={EYE_R} />
      <Cheeks />
      <CatMouth variant="base" />
    </g>
  );
}

/* Happy — ^_^ smiling eyes + wide cat mouth. */
function HappyFace() {
  return (
    <g>
      <HappyEye cx={EYE_L} />
      <HappyEye cx={EYE_R} />
      <Cheeks />
      <CatMouth variant="big" />
    </g>
  );
}

/* Worried — open eyes + inward-raised worried brows + small cat mouth.
   Worried FOR the user (not angry): the inner end of the brows is raised. */
function WorriedFace() {
  return (
    <g>
      {/* Worried brows — inner end (toward center) raised */}
      <path
        d="M52 60 Q66 53 80 53"
        stroke="#2B2118"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M148 60 Q134 53 120 53"
        stroke="#2B2118"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <OpenEye cx={EYE_L} />
      <OpenEye cx={EYE_R} />
      <Cheeks opacity={0.7} />
      <CatMouth variant="small" />
    </g>
  );
}

/* Asleep — closed ‿‿ eyes + zZz + small calm cat mouth. */
function SleepFace() {
  return (
    <g>
      <ClosedEye cx={EYE_L} />
      <ClosedEye cx={EYE_R} />
      <Cheeks opacity={0.45} />
      <CatMouth variant="small" opacity={0.75} />
      {/* zZz — sleep symbols rising at the top right */}
      <path
        d="M150 40 h11 l-11 11 h11"
        stroke="#9FB4C8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M166 26 h7 l-7 7 h7"
        stroke="#9FB4C8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

/* Celebrate — heart eyes + wide cat mouth. */
function CelebrateFace() {
  return (
    <g>
      <HeartEye cx={EYE_L} />
      <HeartEye cx={EYE_R} />
      <Cheeks />
      <CatMouth variant="big" />
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Ambient particles — from the sides/below the body
 * ───────────────────────────────────────────────────────────────── */

/** Celebrate — gold specks rise from below */
function CelebrateParticles() {
  return (
    <g>
      <circle cx="50" cy="160" r="2.4" fill="#FFD45C" className="animate-yk-rise-1" />
      <circle cx="150" cy="162" r="2.8" fill="#FFD45C" className="animate-yk-rise-2" />
      <circle cx="100" cy="168" r="2" fill="#FFA040" className="animate-yk-rise-3" />
    </g>
  );
}

/** Happy — small warm sparks from the sides */
function HappyParticles() {
  return (
    <g>
      <circle cx="34" cy="70" r="1.8" fill="#FFB084" className="animate-yk-rise-1" />
      <circle cx="166" cy="76" r="2" fill="#FFD4A8" className="animate-yk-rise-2" />
    </g>
  );
}

/** Asleep — faint dust specks to the side */
function SleepDust() {
  return (
    <g>
      <circle cx="40" cy="110" r="1.6" fill="#82ADB3" className="animate-yk-dust-1" />
      <circle cx="160" cy="106" r="1.6" fill="#82ADB3" className="animate-yk-dust-2" />
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Mood → palette / animation class map
 * ───────────────────────────────────────────────────────────────── */

interface YumbiePalette {
  face: string;
  faceHi: string;
  faceLo: string;
  auraInner: string;
  auraOuter: string;
}

/**
 * Yumbie palette — yellow cat face. Face tones stay fixed across moods
 * (identity), fading only for sleep. Glow color shifts with mood.
 */
function getPalette(mood: YumbieMood | "celebrate"): YumbiePalette {
  const yellowFace = {
    face: "#F2C14E",
    faceHi: "#FBD76E",
    faceLo: "#DCA22E",
  };

  switch (mood) {
    case "happy":
      return { ...yellowFace, auraInner: "#FFD466", auraOuter: "#FFA82B" };
    case "worried":
      return { ...yellowFace, auraInner: "#FFB084", auraOuter: "#E5683C" };
    case "asleep":
      return {
        face: "#D9AE47",
        faceHi: "#E6C25F",
        faceLo: "#B98C28",
        auraInner: "#C9A865",
        auraOuter: "#8E6E32",
      };
    case "celebrate":
      return { ...yellowFace, auraInner: "#FFE066", auraOuter: "#FFB52E" };
    case "idle":
    default:
      return { ...yellowFace, auraInner: "#FFD466", auraOuter: "#FFC847" };
  }
}

function getAuraClass(mood: YumbieMood | "celebrate"): string {
  switch (mood) {
    case "happy":
    case "celebrate":
      return "animate-yk-aura-warm";
    case "worried":
      return "animate-yk-aura-soft-warm";
    case "asleep":
      return "animate-yk-aura-dim";
    case "idle":
    default:
      return "animate-yk-aura";
  }
}
