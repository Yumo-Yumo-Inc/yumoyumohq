"use client";

/**
 * ConstellationMap — the Behavior tab's signature visualization.
 *
 * Renders the last 30 days of receipts as a star-field where:
 *   X  = day-of-month (1–31), mapped to horizontal position
 *   Y  = category bucket (needs / wants / savings / other)
 *   ●  = one receipt; size ∝ sqrt(totalPaid); color = category bucket
 *
 * Receipts that repeat the same (day-of-week, category) pattern across
 * multiple weeks are connected with faint lines — these are "ritual"
 * patterns. The constellation metaphor makes the visual shareable and
 * gives the Behavior tab a distinctive identity no other fintech app has.
 *
 * Interaction: tap/hover a dot → popover with merchant, amount, date.
 */

import { useMemo, useRef, useState } from "react";
import { ThemeCard } from "@/components/app/theme-card";
import { formatCurrency } from "@/lib/insights/format";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import type { ReceiptSummary } from "@/lib/insights/types";

// ─── Category → bucket ───────────────────────────────────────────────────────

type Bucket = "needs" | "wants" | "savings" | "other";

const NEEDS_CATS = new Set([
  "grocery", "groceries", "supermarket", "market", "pharmacy", "health",
  "utilities", "transport", "fuel", "gas", "electricity", "water",
  "insurance", "rent", "housing", "education",
]);
const WANTS_CATS = new Set([
  "dining", "restaurant", "cafe", "coffee", "bar", "alcohol",
  "entertainment", "delivery", "food_delivery", "snack", "dessert",
  "bakery", "gaming", "streaming", "shopping", "clothing", "beauty",
  "personal_care",
]);

function categoryBucket(category: string | null | undefined): Bucket {
  if (!category) return "other";
  const lower = category.toLowerCase();
  if (NEEDS_CATS.has(lower)) return "needs";
  if (WANTS_CATS.has(lower)) return "wants";
  return "other";
}

// ─── Colours per bucket ───────────────────────────────────────────────────────

const BUCKET_COLOR: Record<Bucket, string> = {
  needs:   "#60A5FA",
  wants:   "#F87171",
  savings: "#34D399",
  other:   "#D6B75B",
};

type ConstellationLocale = "tr" | "en" | "ru" | "th" | "es" | "zh";

const BUCKET_LABELS: Record<Bucket, Record<ConstellationLocale, string>> = {
  needs:   { tr: "İhtiyaçlar", en: "Needs",   ru: "Нужды",     th: "ความจำเป็น", es: "Necesidades", zh: "必需" },
  wants:   { tr: "İstekler",   en: "Wants",   ru: "Желания",   th: "ความต้องการ", es: "Deseos",      zh: "想要" },
  savings: { tr: "Tasarruf",   en: "Savings", ru: "Сбережения", th: "เงินออม",     es: "Ahorros",     zh: "储蓄" },
  other:   { tr: "Diğer",      en: "Other",   ru: "Прочее",    th: "อื่นๆ",       es: "Otros",       zh: "其他" },
};

function pickC(locale: ConstellationLocale, tr: string, en: string, ru: string, th: string, es: string, zh: string): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlottedReceipt {
  id: string;
  cx: number;
  cy: number;
  r: number;
  bucket: Bucket;
  color: string;
  receipt: ReceiptSummary;
  dayOfMonth: number;
  dayOfWeek: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConstellationMapProps {
  receipts: ReceiptSummary[];
  currency?: string;
  locale?: ConstellationLocale;
  accountLevel?: number;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConstellationMap({
  receipts,
  currency = "TRY",
  locale = "tr",
  accountLevel = 1,
}: ConstellationMapProps) {
  const [hovered, setHovered] = useState<PlottedReceipt | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 560;
  const H = 220;
  const PADDING = { left: 32, right: 16, top: 20, bottom: 28 };

  // Compute inner dimensions
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  // ── Filter last 30 days ──
  const now = useMemo(() => new Date(), []);
  const cutoff = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }, [now]);

  const recent = useMemo(
    () =>
      receipts.filter((r) => {
        if (!r.date) return false;
        return new Date(r.date) >= cutoff;
      }),
    [receipts, cutoff]
  );

  // ── Scale helpers ──
  const maxAmount = useMemo(
    () => Math.max(1, ...recent.map((r) => r.totalPaid ?? 0)),
    [recent]
  );

  // X: day of month 1–31
  const xScale = (day: number) =>
    PADDING.left + ((day - 1) / 30) * innerW;

  // Y: bucket row — split inner height into 4 lanes
  const BUCKETS: Bucket[] = ["needs", "wants", "savings", "other"];
  const yScale = (bucket: Bucket) => {
    const idx = BUCKETS.indexOf(bucket);
    const laneH = innerH / BUCKETS.length;
    return PADDING.top + idx * laneH + laneH / 2;
  };

  // Radius: proportional to sqrt(amount), capped
  const rScale = (amount: number) =>
    Math.max(3, Math.min(14, 3 + Math.sqrt(amount / maxAmount) * 11));

  // ── Plot receipts ──
  const plotted = useMemo<PlottedReceipt[]>(() => {
    return recent.map((r) => {
      const d = new Date(r.date);
      const bucket = categoryBucket(r.category);
      const amount = r.totalPaid ?? 0;
      // Slight jitter on Y to avoid overlap within same bucket
      const jitter = ((r.id.charCodeAt(0) % 5) - 2) * 3;
      return {
        id: r.id,
        cx: xScale(d.getDate()),
        cy: yScale(bucket) + jitter,
        r: rScale(amount),
        bucket,
        color: BUCKET_COLOR[bucket],
        receipt: r,
        dayOfMonth: d.getDate(),
        dayOfWeek: d.getDay(),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent, maxAmount]);

  // ── Ritual connections: same dayOfWeek × bucket, ≥2 weeks apart ──
  const ritualLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }> = [];
    const grouped = new Map<string, PlottedReceipt[]>();

    for (const p of plotted) {
      const key = `${p.dayOfWeek}:${p.bucket}`;
      const arr = grouped.get(key) ?? [];
      arr.push(p);
      grouped.set(key, arr);
    }

    for (const group of grouped.values()) {
      if (group.length < 2) continue;
      // Sort by cx (day)
      group.sort((a, b) => a.cx - b.cx);
      for (let i = 0; i < group.length - 1; i++) {
        const a = group[i];
        const b = group[i + 1];
        // Connect only if at least 6 days apart (rituals are weekly-ish)
        if (b.dayOfMonth - a.dayOfMonth >= 6) {
          lines.push({ x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy, color: a.color });
        }
      }
    }
    return lines;
  }, [plotted]);

  if (recent.length === 0) {
    return (
      <ThemeCard accountLevel={accountLevel} className="p-6">
        <p className="text-sm text-center py-8" style={{ color: "var(--app-text-muted)" }}>
          {locale === "tr"
            ? "Takımyıldız haritası için son 30 gün verisi gerekiyor."
            : "Need 30 days of data to render the constellation map."}
        </p>
      </ThemeCard>
    );
  }

  return (
    <ThemeCard accountLevel={accountLevel} className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-sm font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--app-text-primary)" }}
          >
            {pickC(locale, "Harcama Takımyıldızı", "Spending Constellation", "Созвездие расходов", "กลุ่มดาวการใช้จ่าย", "Constelación de gastos", "支出星图")}
          </h3>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--app-text-muted)" }}>
            {locale === "tr"
              ? "Son 30 gün · Her nokta bir alışveriş · Boyut = tutar"
              : "Last 30 days · Each dot = one receipt · Size = amount"}
          </p>
        </div>
        <p
          className="text-xs tabular-nums font-semibold"
          style={{ color: "var(--app-primary)" }}
        >
          {recent.length} {pickC(locale, "fiş", "receipts", "чеков", "ใบเสร็จ", "recibos", "张收据")}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {BUCKETS.map((b) => (
          <div key={b} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: BUCKET_COLOR[b] }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ color: "var(--app-text-muted)" }}
            >
              {BUCKET_LABELS[b][locale]}
            </span>
          </div>
        ))}
      </div>

      {/* SVG map */}
      <div className="relative w-full overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 320 }}
          aria-label={pickC(locale, "Harcama takımyıldızı haritası", "Spending constellation map", "Карта созвездия расходов", "แผนที่กลุ่มดาวการใช้จ่าย", "Mapa de constelación de gastos", "支出星图")}
        >
          {/* Y-axis lane dividers */}
          {BUCKETS.map((b, i) => {
            const laneH = innerH / BUCKETS.length;
            const y = PADDING.top + i * laneH;
            return (
              <g key={b}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={W - PADDING.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 4}
                  y={y + laneH / 2 + 4}
                  textAnchor="end"
                  fontSize={8}
                  fill={BUCKET_COLOR[b]}
                  opacity={0.6}
                >
                  {BUCKET_LABELS[b][locale].slice(0, 4)}
                </text>
              </g>
            );
          })}

          {/* X-axis day ticks (every 5 days) */}
          {[1, 5, 10, 15, 20, 25, 30].map((day) => (
            <g key={day}>
              <line
                x1={xScale(day)}
                y1={PADDING.top}
                x2={xScale(day)}
                y2={H - PADDING.bottom}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={1}
              />
              <text
                x={xScale(day)}
                y={H - PADDING.bottom + 12}
                textAnchor="middle"
                fontSize={8}
                fill="rgba(255,255,255,0.25)"
              >
                {day}
              </text>
            </g>
          ))}

          {/* Ritual connection lines */}
          {ritualLines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth={1}
              strokeOpacity={0.2}
              strokeDasharray="3 4"
            />
          ))}

          {/* Receipt dots */}
          {plotted.map((p) => (
            <circle
              key={p.id}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={p.color}
              fillOpacity={hovered?.id === p.id ? 1 : 0.65}
              stroke={hovered?.id === p.id ? "rgba(255,255,255,0.8)" : "transparent"}
              strokeWidth={1.5}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(p)}
              onTouchEnd={() => setHovered(null)}
            />
          ))}
        </svg>

        {/* Hover popover */}
        {hovered ? (
          <div
            className="pointer-events-none absolute z-10 max-w-[180px] rounded-xl border px-3 py-2 text-xs shadow-xl"
            style={{
              left: Math.min(
                (hovered.cx / W) * 100,
                70
              ) + "%",
              top: (hovered.cy / H) * 100 - 30 + "%",
              borderColor: "rgba(255,255,255,0.1)",
              background: "rgba(15,17,23,0.95)",
              backdropFilter: "blur(8px)",
            }}
          >
            <p className="font-semibold truncate" style={{ color: "var(--app-text-primary)" }}>
              {hovered.receipt.merchantName}
            </p>
            <p className="mt-0.5 tabular-nums font-semibold" style={{ color: hovered.color }}>
              {formatCurrency(hovered.receipt.totalPaid ?? 0, currency)}
            </p>
            <p className="mt-0.5" style={{ color: "var(--app-text-muted)" }}>
              {hovered.receipt.date}
            </p>
            <p className="mt-0.5 text-[10px]" style={{ color: "var(--app-text-muted)" }}>
              {categoryLabel(hovered.receipt.category ?? "", locale)}
            </p>
          </div>
        ) : null}
      </div>
    </ThemeCard>
  );
}
