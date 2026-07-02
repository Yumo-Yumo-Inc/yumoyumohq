"use client";

import { useTier } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  accountLevel?: number;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function ThemeCard({ accountLevel = 1, children, className, onClick, style }: ThemeCardProps) {
  const tier = useTier(accountLevel);

  return (
    <div
      onClick={onClick}
      className={cn("relative overflow-hidden transition-all duration-[.6s]", className)}
      style={{
        ...style,
        background: "var(--app-bg-elevated)",
        border: `1px solid ${tier.cardBorder}`,
        borderRadius: 12,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* Tier accent — thin top edge line */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{ background: tier.topLine }}
      />
      {children}
    </div>
  );
}
