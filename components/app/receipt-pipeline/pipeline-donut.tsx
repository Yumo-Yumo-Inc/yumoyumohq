"use client";

import { useMemo } from "react";

export interface DonutSlice {
  key: string;
  name: string;
  amount: number;
  color: string;
  estimated?: boolean;
}

interface PipelineDonutProps {
  slices: DonutSlice[];
  totalLabel: string;
  totalAmount: string;
  hint?: string;
}

const SIZE = 200;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PipelineDonut({ slices, totalLabel, totalAmount, hint }: PipelineDonutProps) {
  const segments = useMemo(() => {
    const total = slices.reduce((sum, slice) => sum + slice.amount, 0) || 1;
    let offset = 0;
    return slices.map((slice) => {
      const fraction = slice.amount / total;
      const length = fraction * CIRCUMFERENCE;
      const segment = {
        ...slice,
        dashArray: `${length} ${CIRCUMFERENCE - length}`,
        dashOffset: -offset,
      };
      offset += length;
      return segment;
    });
  }, [slices]);

  return (
    <div
      className="flex flex-col items-center rounded-2xl p-5"
      style={{
        background: "var(--receipt-card-bg, var(--app-bg-surface))",
        border: "1px solid var(--receipt-card-border, var(--app-border))",
      }}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--app-border)"
            strokeWidth={STROKE}
          />
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wide" style={{ color: "var(--app-text-muted)" }}>
            {totalLabel}
          </span>
          <span className="mt-1 text-xl font-semibold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
            {totalAmount}
          </span>
        </div>
      </div>

      <div className="mt-4 flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
        {slices.map((slice) => (
          <div key={slice.key} className="flex items-center gap-2 text-xs" style={{ color: "var(--app-text-secondary)" }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
            <span>{slice.name}</span>
            {slice.estimated && hint ? (
              <span style={{ color: "var(--app-text-muted)" }}>({hint})</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
