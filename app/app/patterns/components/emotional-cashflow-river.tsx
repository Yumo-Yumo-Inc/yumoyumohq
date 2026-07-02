"use client";

import type { ReceiptSummary } from "@/lib/insights/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface Bucket {
  label: string;
  total: number;
  count: number;
  avgHiddenRatio: number; // 0-1
}

function getHour(receipt: ReceiptSummary): number {
  if (!receipt.time) return 12;
  const m = receipt.time.match(/^(\d{2}):/);
  return m ? Number(m[1]) : 12;
}

function getBucketIndex(hour: number): number {
  if (hour >= 5 && hour < 11) return 0; // morning
  if (hour >= 11 && hour < 17) return 1; // afternoon
  if (hour >= 17 && hour < 22) return 2; // evening
  return 3; // night
}

function buildBuckets(receipts: ReceiptSummary[]): Bucket[] {
  const raw = [
    { labelKey: "morning", total: 0, count: 0, hiddenSum: 0 },
    { labelKey: "afternoon", total: 0, count: 0, hiddenSum: 0 },
    { labelKey: "evening", total: 0, count: 0, hiddenSum: 0 },
    { labelKey: "night", total: 0, count: 0, hiddenSum: 0 },
  ];

  for (const r of receipts) {
    const idx = getBucketIndex(getHour(r));
    raw[idx].total += r.totalPaid;
    raw[idx].count += 1;
    raw[idx].hiddenSum += r.hiddenCostCore / Math.max(r.totalPaid, 0.01);
  }

  return raw.map((b) => ({
    label: b.labelKey,
    total: b.total,
    count: b.count,
    avgHiddenRatio: b.count > 0 ? b.hiddenSum / b.count : 0,
  }));
}

/* ------------------------------------------------------------------ */
/*  SVG helpers                                                        */
/* ------------------------------------------------------------------ */

const CX = [50, 150, 250, 350]; // center x for 4 buckets (viewBox 0 0 400 120)
const CY = 56;

function buildFlowPath(buckets: Bucket[]): string {
  const maxSpend = Math.max(...buckets.map((b) => b.total), 1);

  // thickness per bucket (px)
  const thickness = buckets.map((b) => 10 + (b.total / maxSpend) * 38);

  // -- top border (left to right)
  let d = `M ${CX[0] - 40},${CY - thickness[0] / 2}`;
  for (let i = 0; i < buckets.length; i++) {
    const x = CX[i];
    const yTop = CY - thickness[i] / 2;
    if (i === 0) {
      d = `M ${x - 40},${yTop}`;
    } else {
      const px = CX[i - 1];
      const pyTop = CY - thickness[i - 1] / 2;
      const cp1x = px + 35;
      const cp2x = x - 35;
      d += ` C ${cp1x},${pyTop} ${cp2x},${yTop} ${x},${yTop}`;
    }
  }
  const lastX = CX[buckets.length - 1];
  d += ` L ${lastX + 40},${CY - thickness[buckets.length - 1] / 2}`;

  // -- bottom border (right to left)
  for (let i = buckets.length - 1; i >= 0; i--) {
    const x = CX[i];
    const yBot = CY + thickness[i] / 2;
    if (i === buckets.length - 1) {
      d += ` L ${x + 40},${yBot}`;
    } else {
      const nx = CX[i + 1];
      const nyBot = CY + thickness[i + 1] / 2;
      const cp1x = nx - 35;
      const cp2x = x + 35;
      d += ` C ${cp1x},${nyBot} ${cp2x},${yBot} ${x},${yBot}`;
    }
  }
  d += ` L ${CX[0] - 40},${CY + thickness[0] / 2} Z`;
  return d;
}

function bucketColor(
  label: string,
  hiddenRatio: number,
  isDark: boolean
): string {
  // base hue per bucket
  const hue: Record<string, number> = {
    morning: 35,   // warm amber
    afternoon: 190, // cool teal
    evening: 265,  // violet
    night: 220,    // deep blue
  };
  const h = hue[label] ?? 200;
  // hidden cost pushes toward warmer / more saturated
  const s = 40 + hiddenRatio * 50; // 40% -> 90%
  const l = isDark ? 35 + hiddenRatio * 15 : 55 + hiddenRatio * 10;
  return `hsl(${h} ${Math.round(s)}% ${Math.round(l)}%)`;
}

type SixLang = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => string;

function bucketLabel(label: string, l: SixLang): string {
  const map: Record<string, [string, string, string, string, string, string]> = {
    morning: ["Sabah", "Morning", "Утро", "เช้า", "Mañana", "上午"],
    afternoon: ["Öğlen", "Afternoon", "День", "บ่าย", "Tarde", "下午"],
    evening: ["Akşam", "Evening", "Вечер", "เย็น", "Noche", "傍晚"],
    night: ["Gece", "Night", "Ночь", "กลางคืน", "Madrugada", "深夜"],
  };
  const v = map[label] ?? [label, label, label, label, label, label];
  return l(v[0], v[1], v[2], v[3], v[4], v[5]);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EmotionalCashflowRiver({ receipts }: { receipts: ReceiptSummary[] }) {
  const { locale } = useAppLocale();
  const l: SixLang = (tr, en, ru, th, es, zh) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;

  const buckets = buildBuckets(receipts);
  const hasData = buckets.some((b) => b.count > 0);
  const maxSpend = Math.max(...buckets.map((b) => b.total), 1);

  if (!hasData) {
    return (
      <div className="patterns-river patterns-river--empty">
        <p className="patterns-river-caption">
          {l(
            "30 günde kayıtlı fiş yok — nehir kurudu.",
            "No receipts in 30 days — the riverbed is dry.",
            "За 30 дней нет чеков — река высохла.",
            "ไม่มีใบเสร็จใน 30 วัน — แม่น้ำแห้ง",
            "Sin recibos en 30 días — el río está seco.",
            "30 天内没有收据 — 河床干涸。",
          )}
        </p>
      </div>
    );
  }

  const pathD = buildFlowPath(buckets);

  // Per-bucket accent colours for the dots
  const dots = buckets.map((b, i) => ({
    cx: CX[i],
    cy: CY,
    r: 4 + (b.total / maxSpend) * 10,
    fill: bucketColor(b.label, b.avgHiddenRatio, true),
  }));

  return (
    <div className="patterns-river">
      <div className="patterns-river-heading">
        <span>{l("Duygusal Akış", "Emotional Flow", "Эмоциональный поток", "กระแสอารมณ์", "Flujo emocional", "情绪流")}</span>
        <small>
          {l(
            "Harcamalarının gün içi ritmi",
            "The daily rhythm of your spending",
            "Дневной ритм твоих трат",
            "จังหวะการใช้จ่ายระหว่างวันของคุณ",
            "El ritmo diario de tu gasto",
            "你日内消费的节奏",
          )}
        </small>
      </div>

      <svg
        viewBox="0 0 400 120"
        className="patterns-river-svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={l(
          "Günün dört dilimindeki harcama akışı",
          "Spending flow across four daily segments",
          "Поток трат по четырём частям дня",
          "กระแสค่าใช้จ่ายในสี่ช่วงของวัน",
          "Flujo de gasto en cuatro tramos del día",
          "一天四个时段的消费流",
        )}
      >
        <defs>
          <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={bucketColor("morning", buckets[0].avgHiddenRatio, true)} stopOpacity="0.35" />
            <stop offset="33%" stopColor={bucketColor("afternoon", buckets[1].avgHiddenRatio, true)} stopOpacity="0.35" />
            <stop offset="66%" stopColor={bucketColor("evening", buckets[2].avgHiddenRatio, true)} stopOpacity="0.35" />
            <stop offset="100%" stopColor={bucketColor("night", buckets[3].avgHiddenRatio, true)} stopOpacity="0.35" />
          </linearGradient>
          <filter id="riverGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Filled body */}
        <path d={pathD} fill="url(#riverGrad)" opacity="0.85" />

        {/* Soft centre stroke */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1.2}
          style={{ mixBlendMode: "overlay" }}
        />

        {/* Bucket dots */}
        {dots.map((d, i) => (
          <g key={i}>
            <circle
              cx={d.cx}
              cy={d.cy}
              r={d.r + 4}
              fill={d.fill}
              opacity="0.18"
              filter="url(#riverGlow)"
            />
            <circle cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} opacity="0.9" />
            <circle cx={d.cx} cy={d.cy} r={1.5} fill="white" opacity="0.7" />
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="patterns-river-legend">
        {buckets.map((b, i) => (
          <div key={i} className="patterns-river-legend-item">
            <span
              className="patterns-river-dot"
              style={{ backgroundColor: bucketColor(b.label, b.avgHiddenRatio, true) }}
            />
            <span className="patterns-river-label">{bucketLabel(b.label, l)}</span>
            <span className="patterns-river-value">
              {b.count > 0
                ? l(
                    `${b.count} fiş`,
                    `${b.count} receipt${b.count === 1 ? "" : "s"}`,
                    `${b.count} чек${b.count === 1 ? "" : "ов"}`,
                    `${b.count} ใบ`,
                    `${b.count} recibo${b.count === 1 ? "" : "s"}`,
                    `${b.count} 张`,
                  )
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
