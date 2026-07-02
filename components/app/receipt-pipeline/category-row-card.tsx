"use client";

import type { LucideIcon } from "lucide-react";

interface CategoryRowCardProps {
  label: string;
  description: string;
  amount: string;
  percentage: string;
  color: string;
  icon: LucideIcon;
  estimated?: boolean;
  estimatedLabel?: string;
  fishtenLabel?: string;
}

export function CategoryRowCard({
  label,
  description,
  amount,
  percentage,
  color,
  icon: Icon,
  estimated = false,
  estimatedLabel,
  fishtenLabel,
}: CategoryRowCardProps) {
  const badge = fishtenLabel ?? (estimated ? estimatedLabel : undefined);

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3.5"
      style={{
        background: "var(--receipt-card-bg, var(--app-bg-surface))",
        border: "1px solid var(--receipt-card-border, var(--app-border))",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}22`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
            {label}
          </p>
          {badge ? (
            <span
              className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{
                background: "var(--app-bg-elevated)",
                color: "var(--app-text-muted)",
                border: "1px solid var(--app-border)",
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
          {description}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
          {amount}
        </p>
        <p className="text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
          {percentage}
        </p>
      </div>
    </div>
  );
}
