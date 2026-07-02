"use client";

interface StreakRowProps {
  streak?: number;
}

export function StreakRow({ streak = 0 }: StreakRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "2px 2px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>🔥</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--app-text-primary)" }}>Streak</span>
        <span style={{ fontSize: 11, color: "var(--app-text-muted)" }}>Treasure</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontFamily: "monospace",
            color: "var(--app-gold)",
          }}
        >
          {streak}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--app-text-muted)" }}>days</span>
      </div>
    </div>
  );
}
