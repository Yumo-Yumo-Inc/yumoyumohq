"use client";

import { useState } from "react";

type ActionKey = "convert" | "stake" | "transfer";

const ACTIONS: { key: ActionKey; label: string; color: string }[] = [
  { key: "convert",  label: "Convert",  color: "#C9A84C" },
  { key: "stake",    label: "Stake",    color: "#34D399" },
  { key: "transfer", label: "Transfer", color: "#60A5FA" },
];

function ActionIcon({ name, color }: { name: ActionKey; color: string }) {
  const p = { fill: "none" as const, stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<ActionKey, React.ReactElement> = {
    convert:  <svg width={21} height={21} viewBox="0 0 24 24"><path {...p} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>,
    stake:    <svg width={21} height={21} viewBox="0 0 24 24"><path {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    transfer: <svg width={21} height={21} viewBox="0 0 24 24"><path {...p} d="M5 12h14M12 5l7 7-7 7"/></svg>,
  };
  return icons[name];
}

export function QuickActions() {
  const [pressed, setPressed] = useState<ActionKey | null>(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
      {ACTIONS.map(a => (
        <button
          key={a.key}
          type="button"
          onPointerDown={() => setPressed(a.key)}
          onPointerUp={() => setPressed(null)}
          onPointerLeave={() => setPressed(null)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 4px 4px",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 9,
            transform: pressed === a.key ? "scale(0.93)" : "scale(1)",
            transition: "transform 0.12s ease",
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "var(--app-bg-elevated)",
            border: "1px solid var(--app-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: pressed === a.key
              ? `0 0 20px ${a.color}30, inset 0 0 0 1px ${a.color}40`
              : "0 2px 8px rgba(0,0,0,0.3)",
            transition: "box-shadow 0.12s ease",
          }}>
            <ActionIcon name={a.key} color={a.color} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: "var(--app-text-secondary)", letterSpacing: "0.01em",
          }}>
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}
