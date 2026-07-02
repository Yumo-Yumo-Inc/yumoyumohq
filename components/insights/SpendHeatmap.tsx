/**
 * Spending rhythm heatmap — 7 days × 12 two-hour buckets. Gold intensity reflects
 * how concentrated spending is in each slot. Lives on the Life (patterns) page;
 * honest by design — empty slots stay light, nothing is fabricated.
 */

const HEAT_COLORS = [
  "rgba(255,255,255,0.025)",
  "rgba(201, 168, 76, 0.16)",
  "rgba(201, 168, 76, 0.32)",
  "rgba(201, 168, 76, 0.52)",
  "rgba(232, 201, 122, 0.78)",
  "#E8C97A",
];

const DAY_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_BUCKETS_12 = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

/** Collapse a 24-hour row into 12 two-hour buckets, keeping the busier hour. */
function compressTo12(row: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < 24; i += 2) out.push(Math.max(row[i] ?? 0, row[i + 1] ?? 0));
  return out;
}

export function SpendHeatmap({ matrix, locale }: { matrix: number[][]; locale: string }) {
  const dayLabels = locale === "tr" ? DAY_TR : DAY_EN;
  // Defensive: always render 7 rows so the grid never collapses on partial data.
  const rows = matrix.length === 7 ? matrix : Array.from({ length: 7 }, () => new Array(24).fill(0));
  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "36px repeat(12, minmax(0, 1fr))" }}>
        <div />
        {HOUR_BUCKETS_12.map((h, i) => (
          <div key={"hh-" + i} className="text-center text-[10px] font-medium uppercase tracking-wide text-app-text-muted" style={{ paddingBottom: 6 }}>
            {i % 2 === 0 ? String(h).padStart(2, "0") : ""}
          </div>
        ))}
        {rows.map((row, di) => (
          <HeatRow key={"r-" + di} dayLabel={dayLabels[di]} cells={compressTo12(row)} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em] text-app-text-muted">
          <span>{locale === "tr" ? "az" : "less"}</span>
          {HEAT_COLORS.map((bg, i) => (
            <span key={i} style={{ display: "inline-block", width: 14, height: 14, borderRadius: 4, background: bg }} />
          ))}
          <span>{locale === "tr" ? "çok" : "more"}</span>
        </div>
        <div className="text-[11px] text-app-text-muted">{locale === "tr" ? "her hücre 2 saat" : "each cell = 2h"}</div>
      </div>
    </div>
  );
}

function HeatRow({ dayLabel, cells }: { dayLabel: string; cells: number[] }) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 text-[11.5px] font-medium uppercase tracking-[0.04em] text-app-text-muted">
        {dayLabel}
      </div>
      {cells.map((v, hi) => {
        const idx = Math.max(0, Math.min(5, v));
        const peak = idx === 5;
        const startHour = hi * 2;
        return (
          <div
            key={hi}
            style={{ aspectRatio: "1 / 1", background: HEAT_COLORS[idx], borderRadius: 6, boxShadow: peak ? "0 0 12px rgba(232, 201, 122, 0.45)" : undefined }}
            title={dayLabel + " " + String(startHour).padStart(2, "0") + ":00-" + String(startHour + 2).padStart(2, "0") + ":00"}
          />
        );
      })}
    </>
  );
}
