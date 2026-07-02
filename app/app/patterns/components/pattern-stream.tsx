"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, ScanLine, Sparkles } from "lucide-react";
import type { CachedInsightEventRecord, InsightEventKind } from "@/lib/offline/types";
import { PatternCard, SkeletonCard } from "../pattern-card";
import { getLocalizedPatternMeta } from "../pattern-config";
import { useAppLocale } from "@/lib/i18n/app-context";

type Filter = "all" | "new" | "tracked";

export interface PatternStreamProps {
  patternItems: Array<{ kind: InsightEventKind; event: CachedInsightEventRecord | null }>;
  liveEvents: CachedInsightEventRecord[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  loading: boolean;
  onCardTap: (kind: InsightEventKind, event: CachedInsightEventRecord | null) => void;
}

function filterItems(
  items: Array<{ kind: InsightEventKind; event: CachedInsightEventRecord | null }>,
  filter: Filter
) {
  if (filter === "new") return items.filter((item) => item.event?.state === "detected");
  if (filter === "tracked") return items.filter((item) => item.event?.state === "committed");
  return items;
}

export function PatternStream({
  patternItems,
  liveEvents,
  filter,
  onFilterChange,
  loading,
  onCardTap,
}: PatternStreamProps) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const filteredItems = filterItems(patternItems, filter);
  const [showDormant, setShowDormant] = useState(false);
  const activeItems = filteredItems.filter((item) => Boolean(item.event));
  const dormantItems = patternItems.filter((item) => !item.event);
  const showDormantBlock = !loading && filter === "all" && dormantItems.length > 0 && liveEvents.length > 0;

  return (
    <section className="patterns-stream">
      <div className="patterns-note">
        <Sparkles size={15} />
        <p>
          {l(
            "Burada yalnızca veri oluşmuş sinyalleri gösteriyoruz. Henüz açılmayan lensler aşağıda ayrı durur.",
            "We only show signals with enough data here. Lenses that are not ready yet stay grouped below.",
            "Здесь мы показываем только сигналы, для которых уже хватает данных. Линзы, которые еще не готовы, собраны ниже.",
            "ที่นี่เราจะแสดงเฉพาะสัญญาณที่มีข้อมูลเพียงพอ ส่วนเลนส์ที่ยังไม่พร้อมจะถูกรวมไว้ด้านล่าง",
            "Aquí solo mostramos señales con datos suficientes. Las lentes que aún no están listas quedan agrupadas abajo.",
            "这里只展示数据已足够的信号。尚未就绪的视角会单独归在下方。",
          )}
        </p>
      </div>

      <div className="patterns-tabs" role="tablist" aria-label={l("Sinyal filtresi", "Signal filter", "Фильтр сигналов", "ตัวกรองสัญญาณ", "Filtro de señales", "信号筛选")}>
        {[
          ["all", l("Hepsi", "All", "Все", "ทั้งหมด", "Todo", "全部")],
          ["new", l("Yeni", "New", "Новые", "ใหม่", "Nuevos", "新")],
          ["tracked", l("Takipte", "Tracked", "В отслеживании", "กำลังติดตาม", "En seguimiento", "跟踪中")],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={filter === id ? "is-active" : ""}
            onClick={() => onFilterChange(id as Filter)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

      {!loading && liveEvents.length === 0 && (
        <div className="patterns-empty">
          <ScanLine size={18} />
          <h2>{l("Henüz seni okumaya yetecek kadar fiş yok", "Not enough receipts yet to read your patterns", "Пока недостаточно чеков, чтобы увидеть твои паттерны", "ยังมีใบเสร็จไม่พอสำหรับวิเคราะห์รูปแบบของคุณ", "Aún no hay suficientes recibos para leer tus patrones", "目前收据还不足以分析你的模式")}</h2>
          <p>
            {l(
              "Birkaç farklı gün, saat ve marketten fiş geldikçe burada gerçek davranış kalıpları açılacak.",
              "As receipts come in across different days, times, and stores, real behavior patterns will appear here.",
              "Когда появятся чеки из разных дней, часов и магазинов, здесь проявятся реальные поведенческие паттерны.",
              "เมื่อมีใบเสร็จจากหลายวัน หลายเวลา และหลายร้าน รูปแบบพฤติกรรมจริงจะปรากฏที่นี่",
              "Cuando lleguen recibos de distintos días, horas y tiendas, aquí aparecerán patrones reales de comportamiento.",
              "当来自不同日期、时段和商家的收据增多时，这里会出现真实行为模式。",
            )}
          </p>
          <div className="patterns-empty-actions">
            <Link href="/app/mine" className="patterns-link-button is-primary">
              {l("Fiş tara", "Scan a receipt", "Сканировать чек", "สแกนใบเสร็จ", "Escanear recibo", "扫描收据")}
            </Link>
          </div>
        </div>
      )}

      {!loading &&
        activeItems.map(({ kind, event }) => (
          <PatternCard key={kind} kind={kind} event={event} onTap={onCardTap} />
        ))}

      {showDormantBlock && (
        <section className="patterns-lenses">
          <button
            type="button"
            className="patterns-lenses-toggle"
            onClick={() => setShowDormant((current) => !current)}
            aria-expanded={showDormant}
          >
            <span>
              <strong>{dormantItems.length}</strong>
              {l(
                " henüz açılmayan lens",
                " dormant lenses",
                " неактивных линз",
                " เลนส์ที่ยังไม่เปิด",
                " lentes inactivas",
                " 个未激活视角",
              )}
            </span>
            {showDormant ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDormant && (
            <div className="patterns-lenses-list">
              {dormantItems.map(({ kind }) => {
                const meta = getLocalizedPatternMeta(kind, locale);
                return (
                  <div key={kind} className="patterns-lens-row">
                    <strong>{meta.label}</strong>
                    <span>{meta.emptyHint}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!loading && activeItems.length === 0 && liveEvents.length > 0 && (
        <div className="patterns-filter-empty">{l("Bu filtrede sinyal yok.", "No signals in this filter.", "В этом фильтре нет сигналов.", "ไม่มีสัญญาณในตัวกรองนี้", "No hay señales en este filtro.", "该筛选下没有信号。")}</div>
      )}
    </section>
  );
}
