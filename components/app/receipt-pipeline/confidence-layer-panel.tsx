"use client";

import type { LucideIcon } from "lucide-react";

export interface ConfidenceField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  icon: LucideIcon;
}

interface ConfidenceLayerPanelProps {
  title: string;
  fields: ConfidenceField[];
}

function confidenceTone(value: number): string {
  if (value >= 90) return "var(--app-success)";
  if (value >= 70) return "var(--app-gold)";
  if (value > 0) return "var(--app-warn)";
  return "var(--app-text-muted)";
}

export function ConfidenceLayerPanel({ title, fields }: ConfidenceLayerPanelProps) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--receipt-card-bg, var(--app-bg-surface))",
        border: "1px solid var(--receipt-card-border, var(--app-border))",
      }}
    >
      <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
        {title}
      </h2>
      <div className="space-y-3">
        {fields.map((field) => {
          const Icon = field.icon;
          const pct = Math.max(0, Math.min(100, Math.round(field.confidence)));
          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--app-text-muted)" }} />
                  <span className="truncate text-sm" style={{ color: "var(--app-text-secondary)" }}>
                    {field.label}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                  {field.value}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--app-bg-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: confidenceTone(pct) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
