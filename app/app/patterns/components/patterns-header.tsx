"use client";

import { RefreshCw } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";

export interface PatternsHeaderProps {
  generating: boolean;
  onRefresh: () => void;
}

export function PatternsHeader({ generating, onRefresh }: PatternsHeaderProps) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  return (
    <header className="patterns-header">
      <div>
        <p className="patterns-kicker">{l("Yaşam", "Life", "Жизнь", "ชีวิต", "Vida", "生活")}</p>
        <h1>{l("Harcama davranışın", "Your spending behavior", "Твое поведение в тратах", "พฤติกรรมการใช้จ่ายของคุณ", "Tu comportamiento de gasto", "你的消费行为")}</h1>
        <p>
          {l(
            "Fişlerdeki rakamları, günün ritmi ve alışkanlıklarınla birlikte okuyoruz.",
            "We read your receipts together with your daily rhythm and habits.",
            "Мы читаем цифры в чеках вместе с твоим ритмом дня и привычками.",
            "เราอ่านข้อมูลจากใบเสร็จร่วมกับจังหวะชีวิตและนิสัยของคุณ",
            "Leemos los números de tus recibos junto con tu ritmo diario y hábitos.",
            "我们会结合你的日常节奏和习惯来解读收据数据。",
          )}
        </p>
      </div>
      <button
        type="button"
        className="patterns-refresh"
        onClick={onRefresh}
        disabled={generating}
        aria-label={l("Analizi yenile", "Refresh analysis", "Обновить анализ", "รีเฟรชการวิเคราะห์", "Actualizar análisis", "刷新分析")}
      >
        <RefreshCw size={16} className={generating ? "is-spinning" : ""} />
      </button>
    </header>
  );
}
