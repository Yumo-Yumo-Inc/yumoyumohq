"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTier } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

/**
 * Surface — the single signature surface primitive for the /app product shell.
 *
 * Distilled from the three reference surfaces Uğur likes (IdentityShareCard,
 * the scanui scan flow, the dashboard hero level card). Their shared DNA:
 * a layered gradient ground (never a flat fill), a top light hairline, a soft
 * drop shadow + inner glow, an optional radial accent glow, and gold/tier accents.
 *
 * Design constitution rule: NO flat `1px solid` border. Edge definition comes
 * from ground contrast + hairline gradient + shadow/inset ring. Every colour
 * resolves from `--surface-*` / `--app-*` tokens so both themes stay correct
 * without `.text-white` override patches.
 */

type SurfaceVariant = "flat" | "elevated" | "glass" | "value";
type SurfaceAccent = "none" | "gold" | "tier";
type SurfaceRadius = "md" | "lg" | "xl";

const RADIUS: Record<SurfaceRadius, string> = {
  md: "var(--app-radius-md)",
  lg: "var(--app-radius-lg)",
  xl: "var(--app-radius-xl)",
};

const GRADIENT: Record<SurfaceVariant, string> = {
  flat: "var(--surface-grad-flat)",
  elevated: "var(--surface-grad-elevated)",
  glass: "var(--surface-grad-glass)",
  value: "var(--surface-grad-value)",
};

/** #RRGGBB (or shorthand) → rgba(r,g,b,alpha). Falls back to the input on miss. */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface SurfaceProps extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  variant?: SurfaceVariant;
  radius?: SurfaceRadius;
  accent?: SurfaceAccent;
  /** Adds framer-motion hover-lift + press micro-interaction (respects reduced-motion). */
  interactive?: boolean;
  /** Top light hairline (default true). */
  hairline?: boolean;
  /** Blurred radial accent glow in the top-right corner (identity/hero signature). */
  glow?: boolean;
  /** Polymorphic root — e.g. Link, "section", "button". Default "div". */
  as?: React.ElementType;
  /** Passed through when `as` is a link (next/link or "a"). */
  href?: string;
  target?: string;
  rel?: string;
  /** Passed through when `as` is "button". */
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(function Surface(
  {
    variant = "elevated",
    radius = "lg",
    accent = "none",
    interactive = false,
    hairline = true,
    glow = false,
    as,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const tier = useTier();
  const reduce = useReducedMotion();

  // Resolve accent colours (gold = fixed token; tier = active tier accent).
  const accentBorder =
    accent === "gold"
      ? "var(--app-gold-border)"
      : accent === "tier"
        ? tier.cardBorder
        : "var(--app-border)";
  const accentGlow =
    accent === "gold"
      ? hexToRgba("#C9A84C", 0.3)
      : accent === "tier"
        ? hexToRgba(tier.accent, 0.3)
        : "transparent";

  const depth = variant === "flat" ? "" : "var(--surface-shadow)";
  const ring = `inset 0 0 0 1px ${accentBorder}`;
  const halo = accent !== "none" ? `0 6px 26px ${accentGlow}` : "";
  const boxShadow = [depth, ring, "var(--surface-inner-glow)", halo]
    .filter(Boolean)
    .join(", ");

  const rootStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    borderRadius: RADIUS[radius],
    background: GRADIENT[variant],
    boxShadow,
    ...(variant === "glass"
      ? { backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }
      : null),
    ...style,
  };

  const decorations = (
    <>
      {hairline && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0"
          style={{ height: 1, background: "var(--surface-hairline)" }}
        />
      )}
      {glow && accent !== "none" && (
        <span
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            right: -56,
            top: -56,
            width: 200,
            height: 200,
            borderRadius: "9999px",
            background: `radial-gradient(circle, ${accentGlow}, transparent 70%)`,
            filter: "blur(28px)",
          }}
        />
      )}
    </>
  );

  const Comp = as ?? "div";

  // Memoize the motion-wrapped element so `as={Link}` doesn't recreate a fresh
  // component (and reset its state) on every render.
  const MotionComp = React.useMemo(
    () =>
      typeof Comp === "string"
        ? (motion as unknown as Record<string, React.ElementType>)[Comp]
        : motion(Comp as React.ComponentType<Record<string, unknown>>),
    [Comp],
  );

  if (interactive && !reduce) {
    return (
      <MotionComp
        ref={ref}
        className={cn(className)}
        style={rootStyle}
        whileHover={{ y: -2, scale: 1.005 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        {...rest}
      >
        {decorations}
        {children}
      </MotionComp>
    );
  }

  return (
    <Comp ref={ref} className={cn(className)} style={rootStyle} {...rest}>
      {decorations}
      {children}
    </Comp>
  );
});

/** Padded header row — token typography, matches shadcn CardHeader footprint. */
export function SurfaceHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 px-5 pt-5", className)} {...props} />;
}

export function SurfaceTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[15px] font-semibold leading-none", className)}
      style={{ color: "var(--app-text-primary)" }}
      {...props}
    />
  );
}

export function SurfaceBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

/** A single flex row inside a Surface (label ↔ value), tabular-friendly. */
function SurfaceRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 px-5 py-3", className)}
      {...props}
    />
  );
}
