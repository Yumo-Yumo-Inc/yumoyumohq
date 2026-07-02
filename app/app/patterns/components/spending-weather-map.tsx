"use client";

import { CloudFog, CloudRain, Snowflake, Sun, Thermometer } from "lucide-react";
import type { ReceiptSummary } from "@/lib/insights/types";
import { useAppLocale } from "@/lib/i18n/app-context";

type WeatherKind = "clear" | "warm" | "pressure" | "fog" | "storm" | "cold";

interface WeatherReading {
  kind: WeatherKind;
  label: string;
  sub: string;
  tempDisplay: string; // daily avg spend
  icon: typeof Sun;
  gradient: string;
}

function getHour(receipt: ReceiptSummary): number {
  if (!receipt.time) return 12;
  const m = receipt.time.match(/^(\d{2}):/);
  return m ? Number(m[1]) : 12;
}

function analyzeWeather(receipts: ReceiptSummary[]): Omit<WeatherReading, "label" | "sub"> | null {
  if (receipts.length === 0) return null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recent = receipts.filter((r) => new Date(r.date) >= sevenDaysAgo);
  if (recent.length === 0) return null;

  const total = recent.reduce((s, r) => s + r.totalPaid, 0);
  const avgHidden =
    recent.reduce((s, r) => s + r.hiddenCostCore / Math.max(r.totalPaid, 0.01), 0) /
    recent.length;
  const eveningSpend = recent
    .filter((r) => {
      const h = getHour(r);
      return h >= 17 && h < 22;
    })
    .reduce((s, r) => s + r.totalPaid, 0);
  const eveningRatio = eveningSpend / Math.max(total, 0.01);

  const catMap = new Map<string, number>();
  for (const r of recent) {
    const c = r.category || "other";
    catMap.set(c, (catMap.get(c) || 0) + r.totalPaid);
  }
  const uniqueCategories = catMap.size;
  const maxCatShare =
    Math.max(...Array.from(catMap.values()), 0) / Math.max(total, 0.01);

  // ---- metaphor selection ----
  let kind: WeatherKind = "clear";
  if (recent.length >= 6 && uniqueCategories >= 5) kind = "storm";
  else if (eveningRatio >= 0.35) kind = "warm";
  else if (avgHidden >= 0.22) kind = "pressure";
  else if (uniqueCategories >= 4 && maxCatShare <= 0.4) kind = "fog";
  else if (recent.length <= 2) kind = "cold";

  const dailyAvg = total / 7;
  const currency = recent[0]?.currency || "";
  const tempDisplay = `${Math.round(dailyAvg).toLocaleString()} ${currency}`;

  const readings: Record<WeatherKind, { icon: typeof Sun; gradient: string }> = {
    clear: { icon: Sun, gradient: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(16,185,129,0.10) 100%)" },
    warm: { icon: Thermometer, gradient: "linear-gradient(135deg, rgba(248,113,113,0.18) 0%, rgba(245,158,11,0.12) 100%)" },
    pressure: { icon: Thermometer, gradient: "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(236,72,153,0.10) 100%)" },
    fog: { icon: CloudFog, gradient: "linear-gradient(135deg, rgba(148,163,184,0.18) 0%, rgba(99,102,241,0.08) 100%)" },
    storm: { icon: CloudRain, gradient: "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(147,51,234,0.12) 100%)" },
    cold: { icon: Snowflake, gradient: "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(99,102,241,0.10) 100%)" },
  };

  const base = readings[kind];
  return {
    kind,
    tempDisplay,
    icon: base.icon,
    gradient: base.gradient,
  };
}

/* ------------------------------------------------------------------ */

type Six = [string, string, string, string, string, string];

const WEATHER_COPY: Record<WeatherKind, { label: Six; sub: Six }> = {
  clear: {
    label: ["Açık", "Clear", "Ясно", "ท้องฟ้าโปร่ง", "Despejado", "晴朗"],
    sub: [
      "Harcamaların dengeli ve öngörülebilir bir ritimde.",
      "Your spending holds a steady, predictable rhythm.",
      "Твои траты идут в ровном, предсказуемом ритме.",
      "การใช้จ่ายของคุณอยู่ในจังหวะที่คาดเดาได้และสมดุล",
      "Tu gasto sigue un ritmo estable y predecible.",
      "你的消费节奏稳定可预测。",
    ],
  },
  warm: {
    label: ["Sıcak Cephe", "Warm Front", "Тёплый фронт", "หน้าอากาศอุ่น", "Frente cálido", "暖锋"],
    sub: [
      "Akşam saatlerinde duygusal harcamalar artıyor gibi görünüyor.",
      "Evening hours seem to carry more emotional spending.",
      "Вечером всё чаще появляются эмоциональные траты.",
      "ดูเหมือนว่าการใช้จ่ายช่วงเย็นจะมาจากอารมณ์มากขึ้น",
      "Las noches parecen llevar más gasto emocional.",
      "夜间出现更多情绪化消费。",
    ],
  },
  pressure: {
    label: ["Basınç", "High Pressure", "Высокое давление", "ความกดอากาศสูง", "Alta presión", "高气压"],
    sub: [
      "Gizli maliyetlerin yüksek; harcamaların baskılı hissettirebilir.",
      "Hidden costs are elevated; spending may feel pressured.",
      "Скрытые расходы выросли — траты ощущаются под давлением.",
      "ค่าใช้จ่ายแฝงสูงขึ้น การใช้จ่ายอาจรู้สึกกดดัน",
      "Los costes ocultos están altos; el gasto puede sentirse presionado.",
      "隐性成本升高，消费有压力感。",
    ],
  },
  fog: {
    label: ["Sis", "Fog", "Туман", "หมอก", "Niebla", "雾"],
    sub: [
      "Kategoriler dağınık; harcama desenin net bir yön göstermiyor.",
      "Categories are scattered; no clear direction in your pattern.",
      "Категории разбросаны — чёткого направления нет.",
      "หมวดหมู่กระจัดกระจาย ไม่เห็นทิศทางที่ชัดเจน",
      "Las categorías están dispersas; no hay dirección clara.",
      "类别分散,没有明确方向。",
    ],
  },
  storm: {
    label: ["Fırtına", "Storm", "Шторм", "พายุ", "Tormenta", "风暴"],
    sub: [
      "Kısa sürede çok farklı alanlara harcama yapıyorsun.",
      "You are spending across many different areas in a short span.",
      "Ты тратишь во многих разных областях за короткое время.",
      "คุณกำลังใช้จ่ายในหลายหมวดในช่วงเวลาสั้น ๆ",
      "Estás gastando en muchas áreas distintas en poco tiempo.",
      "短时间内在许多不同领域消费。",
    ],
  },
  cold: {
    label: ["Soğuk Cephe", "Cold Front", "Холодный фронт", "หน้าอากาศหนาว", "Frente frío", "冷锋"],
    sub: [
      "Son günlerde harcama aktiviten düşük.",
      "Your spending activity has been low recently.",
      "В последние дни активность трат низкая.",
      "การใช้จ่ายในช่วงไม่กี่วันมานี้ต่ำ",
      "Tu actividad de gasto ha estado baja últimamente.",
      "近期消费活动较少。",
    ],
  },
};

type SixLang = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => string;

export function SpendingWeatherMap({ receipts }: { receipts: ReceiptSummary[] }) {
  const { locale } = useAppLocale();
  const l: SixLang = (tr, en, ru, th, es, zh) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const reading = analyzeWeather(receipts);

  if (!reading) {
    return (
      <div className="patterns-weather patterns-weather--empty">
        <p>
          {l(
            "Son 7 günde yeterli fiş yok — hava durumu ölçülemiyor.",
            "Not enough receipts in the last 7 days — weather can't be read.",
            "За 7 дней недостаточно чеков — погоду не прочитать.",
            "ใบเสร็จใน 7 วันไม่พอ ไม่สามารถอ่านสภาพอากาศได้",
            "No hay suficientes recibos en 7 días — no se puede leer el clima.",
            "近 7 天收据不足,无法判读天气。",
          )}
        </p>
      </div>
    );
  }

  const Icon = reading.icon;
  const copy = WEATHER_COPY[reading.kind];

  return (
    <div
      className="patterns-weather"
      style={{ background: reading.gradient }}
    >
      <div className="patterns-weather-heading">
        <span>{l("Finansal Hava Durumu", "Spending Weather", "Финансовая погода", "สภาพอากาศการเงิน", "Clima de gasto", "消费天气")}</span>
        <small>
          {reading.tempDisplay} / {l("günlük ort.", "daily avg", "ср./день", "เฉลี่ย/วัน", "prom. diario", "日均")}
        </small>
      </div>

      <div className="patterns-weather-body">
        <div className="patterns-weather-icon" aria-hidden="true">
          <Icon size={32} strokeWidth={1.4} />
        </div>
        <div className="patterns-weather-text">
          <strong>{l(copy.label[0], copy.label[1], copy.label[2], copy.label[3], copy.label[4], copy.label[5])}</strong>
          <p>{l(copy.sub[0], copy.sub[1], copy.sub[2], copy.sub[3], copy.sub[4], copy.sub[5])}</p>
        </div>
      </div>
    </div>
  );
}
