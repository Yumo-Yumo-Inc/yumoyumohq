"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, ReceiptText, ScanLine } from "lucide-react";
import { ThemeCard } from "@/components/app/theme-card";
import type { AppLocale } from "@/lib/i18n/app-context";

interface RecentReceiptRow {
  id: string;
  merchantName: string;
  date: string;
  total: number;
  currency: string;
  status: string;
}

interface ProfileRecentReceiptsProps {
  accountLevel: number;
  locale: AppLocale;
  numLocale: string;
}

const RECENT_LIMIT = 5;

function statusTone(status: string): { dot: string; label: [string, string, string, string, string, string] } {
  const normalized = status.toLowerCase();
  if (normalized === "verified" || normalized === "analyzed" || normalized === "rewarded_other") {
    return { dot: "#4ade80", label: ["Doğrulandı", "Verified", "Подтвержден", "ยืนยันแล้ว", "Verificado", "已验证"] };
  }
  if (normalized === "rejected") {
    return { dot: "#f87171", label: ["Reddedildi", "Rejected", "Отклонен", "ถูกปฏิเสธ", "Rechazado", "已拒绝"] };
  }
  return { dot: "#fbbf24", label: ["İşleniyor", "Processing", "Обработка", "กำลังประมวลผล", "Procesando", "处理中"] };
}

export function ProfileRecentReceipts({ accountLevel, locale, numLocale }: ProfileRecentReceiptsProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [rows, setRows] = useState<RecentReceiptRow[] | null>(null);
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/receipts?page=1&pageSize=${RECENT_LIMIT}`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const { convertReceiptAnalysisToReceipt } = await import("@/lib/receipt/receipt-converter");
        const list: RecentReceiptRow[] = (data.receipts ?? [])
          .map((raw: import("@/lib/receipt/types").ReceiptAnalysis) => {
            const receipt = convertReceiptAnalysisToReceipt(raw);
            return {
              id: receipt.id,
              merchantName: receipt.merchantName || "",
              date: receipt.date || receipt.createdAt?.slice(0, 10) || "",
              total: receipt.total,
              currency: receipt.currency || "",
              status: receipt.status,
            };
          })
          .slice(0, RECENT_LIMIT);
        if (!cancelled) setRows(list);
      } catch (error) {
        console.error("[profile-recent-receipts] fetch failed", error);
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatAmount = (value: number, currency: string) => {
    if (!currency) return value.toLocaleString(numLocale, { maximumFractionDigits: 2 });
    try {
      return new Intl.NumberFormat(numLocale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
    } catch {
      return `${value.toLocaleString(numLocale, { maximumFractionDigits: 2 })} ${currency}`;
    }
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return "";
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return new Intl.DateTimeFormat(numLocale, { day: "numeric", month: "short" }).format(parsed);
  };

  return (
    <ThemeCard accountLevel={accountLevel} className="rounded-[22px]" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6a44c]/35 bg-[#d6a44c]/10">
              <ReceiptText className="h-5 w-5 text-[#d6a44c]" />
            </span>
            <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-white">
              {l("Son fişler", "Recent receipts", "Последние чеки", "ใบเสร็จล่าสุด", "Recibos recientes", "最近的收据")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => router.push("/app/receipts")}
            className="flex items-center gap-1 text-[13px] font-semibold text-white/58 transition-colors hover:text-white/80"
          >
            {l("Tümü", "All", "Все", "ทั้งหมด", "Todos", "全部")}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {rows === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3.5">
                <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" />
                <span className="h-3 w-2/5 animate-pulse rounded-full bg-white/10" />
                <span className="ml-auto h-3 w-16 animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d6a44c]/25 bg-[#d6a44c]/8">
              <ScanLine className="h-5 w-5 text-[#d6a44c]" />
            </span>
            <p className="text-[13px] leading-6 text-white/58">
              {l(
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
          <div className="space-y-2">
            {rows.map((row, index) => {
              const tone = statusTone(row.status);
              return (
                <motion.button
                  key={row.id}
                  type="button"
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.04, ease: "easeOut" }}
                  onClick={() => router.push(`/app/receipts/${row.id}`)}
                  className="flex w-full items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d6a44c]/25 bg-[#d6a44c]/8 text-[13px] font-bold text-[#d6a44c]">
                    {(row.merchantName || "?").slice(0, 1).toLocaleUpperCase(numLocale)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-white">
                      {row.merchantName || l("Bilinmeyen satıcı", "Unknown merchant", "Неизвестный продавец", "ร้านค้าไม่ทราบชื่อ", "Comercio desconocido", "未知商家")}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[12px] text-white/58">
                      <span>{formatDate(row.date)}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
                        {l(...tone.label)}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[14px] font-semibold tabular-nums text-white/80">
                    {formatAmount(row.total, row.currency)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </ThemeCard>
  );
}
