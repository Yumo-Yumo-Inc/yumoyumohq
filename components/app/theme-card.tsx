"use client";

import { useTier } from "@/lib/theme/theme-context";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  accountLevel?: number;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * ThemeCard — tier-accented surface used across the app shell (dashboard cards,
 * home widgets, …). Delegates its material to the shared <Surface> primitive
 * (layered gradient ground + soft shadow + inner glow) while keeping its
 * signature gold/tier top accent line. Same prop surface as before, so its ~35
 * call sites are unchanged.
 */
export function ThemeCard({ accountLevel = 1, children, className, onClick, style }: ThemeCardProps) {
  const tier = useTier(accountLevel);

  return (
    <Surface
      variant="elevated"
      accent="tier"
      radius="md"
      hairline={false}
      onClick={onClick}
      className={cn("transition-all duration-[.6s]", className)}
      style={{ ...style, cursor: onClick ? "pointer" : "default" }}
    >
      {/* Tier accent — signature thin top edge line (gold/tier tinted). */}
      <div className="absolute left-0 right-0 top-0 h-px" style={{ background: tier.topLine }} />
      {children}
    </Surface>
  );
}
