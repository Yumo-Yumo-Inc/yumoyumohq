"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Receipt as ReceiptIcon, ScanLine } from "lucide-react";
import { ReceiptDetailModal } from "@/components/app/receipt-detail/receipt-detail-modal";
import { convertReceiptAnalysisToReceipt } from "@/lib/receipt/receipt-converter";
import { displayHiddenCost } from "@/lib/receipt/display-hidden-cost";
import { normalizeReceiptCategory } from "@/lib/receipt/categories";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
import type { Receipt } from "@/lib/mock/types";
import type { YumoLocale } from "@/lib/product-architecture/dashboard-contract";

/** Recent receipts on the dashboard; the header links to the full list. */
const RECENT_LIMIT = 10;

/** Harmonious accent set — each merchant keyed to one, so its receipt icon has a stable color. */
const MERCHANT_HUES = [
  "#fb923c", "#f59e0b", "#f43f5e", "#38bdf8", "#34d399", "#60a5fa",
  "#c084fc", "#e879f9", "#2dd4bf", "#a78bfa", "#fbbf24", "#22d3ee",
];

function merchantHue(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MERCHANT_HUES[h % MERCHANT_HUES.length];
}

interface RecentReceiptRow {
  id: string;
  merchantName: string;
  category: string;
  date: string;
  total: number;
  currency: string;
  status: string;
  hidden: number;
  reward: number;
}

function byLocale(
  locale: YumoLocale,
  tr: string,
  en: string,
  ru: string,
  th: string,
  es: string,
  zh: string,
): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

function intlLocaleTag(locale: YumoLocale): string {
  switch (locale) {
    case "tr": return "tr-TR";
    case "ru": return "ru-RU";
    case "th": return "th-TH";
    case "es": return "es-ES";
    case "zh": return "zh-CN";
    default:   return "en-US";
  }
}

function statusTone(locale: YumoLocale, status: string): { dot: string; label: string } {
  const normalized = status.toLowerCase();
  if (normalized === "verified" || normalized === "analyzed" || normalized === "rewarded_other") {
    return {
      dot: "#4ade80",
      label: byLocale(locale, "Doğrulandı", "Verified", "Подтвержден", "ยืนยันแล้ว", "Verificado", "已验证"),
    };
  }
  if (normalized === "rejected") {
    return {
      dot: "#f87171",
      label: byLocale(locale, "Reddedildi", "Rejected", "Отклонен", "ถูกปฏิเสธ", "Rechazado", "已拒绝"),
    };
  }
  // A scanned receipt is recorded — not mid-pipeline. Matches StatusBadge ("Tarandı").
  if (normalized === "scanned") {
    return {
      dot: "#a78bfa",
      label: byLocale(locale, "Tarandı", "Scanned", "Отсканирован", "สแกนแล้ว", "Escaneado", "已扫描"),
    };
  }
  return {
    dot: "#fbbf24",
    label: byLocale(locale, "İşleniyor", "Processing", "Обработка", "กำลังประมวลผล", "Procesando", "处理中"),
  };
}

function fmtAmount(value: number, currency: string, numLocale: string): string {
  if (!currency) return Math.round(value).toLocaleString(numLocale);
  try {
    return new Intl.NumberFormat(numLocale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString(numLocale)} ${currency}`;
  }
}

function fmtDate(isoDate: string, numLocale: string): string {
  if (!isoDate) return "";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat(numLocale, { day: "numeric", month: "short" }).format(parsed);
}

async function fetchRecentReceipts(): Promise<RecentReceiptRow[]> {
  const res = await fetch(`/api/receipts?page=1&pageSize=${RECENT_LIMIT}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return ((data.receipts ?? []) as ReceiptAnalysis[])
    .map((raw) => {
      const receipt: Receipt = convertReceiptAnalysisToReceipt(raw);
      return {
        id: receipt.id,
        merchantName: (receipt.merchantName || "").trim(),
        category: normalizeReceiptCategory(receipt.category) ?? "other",
        date: receipt.date || receipt.createdAt?.slice(0, 10) || "",
        total: receipt.total,
        currency: receipt.currency || "",
        status: receipt.status,
        hidden: displayHiddenCost(receipt),
        reward: receipt.reward?.amount ?? 0,
      };
    })
    .slice(0, RECENT_LIMIT);
}

/**
 * One receipt ticket — merchant-forward: a brand-hued receipt icon anchors it,
 * the business name is the hero, category is demoted to muted meta.
 * Frameless: the ticket sits on the dashboard surface, no card fill or border.
 */
function ReceiptTicket({
  row,
  index,
  locale,
  numLocale,
  reducedMotion,
  hiddenChipLabel,
  onOpen,
}: {
  row: RecentReceiptRow;
  index: number;
  locale: YumoLocale;
  numLocale: string;
  reducedMotion: boolean | null;
  hiddenChipLabel: string;
  onOpen: () => void;
}) {
  const isUnknown = !row.merchantName || row.merchantName.startsWith("[");
  const merchantLabel = isUnknown
    ? byLocale(locale, "Bilinmeyen satıcı", "Unknown merchant", "Неизвестный продавец", "ร้านค้าไม่ทราบชื่อ", "Comercio desconocido", "未知商家")
    : row.merchantName;
  const hue = isUnknown ? "#94a3b8" : merchantHue(row.merchantName);
  const tone = statusTone(locale, row.status);

  return (
    <motion.button
      type="button"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05, ease: [0.32, 0.72, 0, 1] }}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      onClick={onOpen}
      className="group flex h-[176px] w-[150px] shrink-0 snap-start flex-col justify-between text-left"
    >
      <div className="min-w-0">
        {/* Receipt icon + status */}
        <div className="flex items-start justify-between gap-1.5">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]"
            style={{
              background: `linear-gradient(150deg, ${hue}33, ${hue}0f)`,
              border: `1px solid ${hue}4a`,
              boxShadow: `0 7px 18px -10px ${hue}99`,
            }}
          >
            <ReceiptIcon className="h-[22px] w-[22px]" style={{ color: hue }} strokeWidth={2.1} />
          </span>

          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-[var(--app-text-muted)]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: tone.dot, boxShadow: `0 0 6px ${tone.dot}99` }}
            />
            {tone.label}
          </span>
        </div>

        {/* Business name — the hero */}
        <p className="mt-2.5 line-clamp-2 text-[14px] font-extrabold leading-[1.15] tracking-tight text-[var(--app-text-primary)]">
          {merchantLabel}
        </p>

        {/* Demoted meta: date · category */}
        <p className="mt-1 truncate text-[10px] font-semibold text-[var(--app-text-muted)]">
          {row.date ? `${fmtDate(row.date, numLocale)} · ` : ""}
          {categoryLabel(row.category, locale)}
        </p>
      </div>

      {/* Amount anchored to the base, on a hairline tear line */}
      <div>
        <div className="mb-1.5 h-px w-full bg-[var(--app-border)]" />
        <p className="font-mono text-[15px] font-bold leading-none tabular-nums text-[var(--app-text-primary)]">
          {fmtAmount(row.total, row.currency, numLocale)}
        </p>
        {row.reward > 0 ? (
          <p className="mt-1.5 font-mono text-[10px] font-bold tabular-nums text-[var(--app-gold-light,#e7c169)]">
            +{row.reward.toLocaleString(numLocale, { maximumFractionDigits: 2 })} cP
          </p>
        ) : row.hidden > 0 ? (
          <p className="mt-1.5 font-mono text-[10px] font-semibold tabular-nums text-[#ef6a43]">
            {fmtAmount(row.hidden, row.currency, numLocale)} {hiddenChipLabel}
          </p>
        ) : (
          <p className="mt-1.5 select-none text-[10px] font-semibold text-transparent">·</p>
        )}
      </div>
    </motion.button>
  );
}

export function RecentReceiptsSection({ locale }: { locale: YumoLocale }) {
  const reducedMotion = useReducedMotion();
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: rows, isLoading } = useQuery({
    queryKey: ["dashboard-recent-receipts", RECENT_LIMIT],
    queryFn: fetchRecentReceipts,
    staleTime: 60_000,
  });

  const numLocale = intlLocaleTag(locale);
  const title = byLocale(locale, "Son Fişler", "Recent Receipts", "Последние чеки", "ใบเสร็จล่าสุด", "Recibos recientes", "最近的收据");
  const viewAllLabel = byLocale(locale, "Tümünü gör", "View all", "Все", "ดูทั้งหมด", "Ver todo", "查看全部");
  const hiddenChipLabel = byLocale(locale, "gizli", "hidden", "скрыто", "แฝง", "oculto", "隐藏");

  return (
    <section aria-label={title}>
      {/* Header — same typographic register as Spending Breakdown, no card frame */}
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-sm font-extrabold tracking-tight text-[var(--app-text-primary)]">
          {title}
        </h2>
        <Link
          href="/app/receipts"
          className="ml-auto flex items-center gap-0.5 text-[11.5px] font-bold text-[var(--app-text-secondary)] transition hover:text-[var(--app-text-primary)]"
        >
          {viewAllLabel}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading || rows === undefined ? (
        <div className="-mx-3 mt-3 flex gap-3 overflow-hidden px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[176px] w-[150px] shrink-0 animate-pulse">
              <div className="h-11 w-11 rounded-[14px] bg-[var(--app-text-muted)]/[0.10]" />
              <div className="mt-2.5 h-3 w-28 rounded-full bg-[var(--app-text-muted)]/12" />
              <div className="mt-1.5 h-2 w-16 rounded-full bg-[var(--app-text-muted)]/10" />
              <div className="mt-9 h-3.5 w-20 rounded-full bg-[var(--app-text-muted)]/12" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-[var(--app-border-strong)] px-5 py-7 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-[#d6a44c]/25 bg-[#d6a44c]/10">
            <ScanLine className="h-5 w-5 text-[#d6a44c]" />
          </span>
          <p className="max-w-[280px] text-[13px] font-bold leading-5 text-[var(--app-text-secondary)]">
            {byLocale(
              locale,
              "Henüz fiş yok. İlk fişini tarattığında burada görünecek.",
              "No receipts yet. Your first scanned receipt will show up here.",
              "Чеков пока нет. Первый отсканированный чек появится здесь.",
              "ยังไม่มีใบเสร็จ ใบเสร็จแรกที่สแกนจะแสดงที่นี่",
              "Aún no hay recibos. Tu primer recibo escaneado aparecerá aquí.",
              "还没有收据。你扫描的第一张收据会显示在这里。",
            )}
          </p>
        </div>
      ) : (
        // Horizontal, swipe-right rail of frameless merchant tickets.
        <div className="relative -mx-3 mt-3 sm:-mx-4 lg:mx-0">
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4 lg:px-0"
            style={{ overscrollBehaviorX: "contain" }}
          >
            {rows.map((row, index) => (
              <ReceiptTicket
                key={row.id}
                row={row}
                index={index}
                locale={locale}
                numLocale={numLocale}
                reducedMotion={reducedMotion}
                hiddenChipLabel={hiddenChipLabel}
                onOpen={() => setDetailId(row.id)}
              />
            ))}
          </div>

          {/* Right-edge fade — hints there is more to swipe */}
          {rows.length > 2 && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8 lg:hidden"
              style={{ background: "linear-gradient(270deg, var(--app-bg-dashboard, var(--app-bg-surface)) 0%, transparent 100%)" }}
            />
          )}
        </div>
      )}

      <ReceiptDetailModal receiptId={detailId} onClose={() => setDetailId(null)} />
    </section>
  );
}
