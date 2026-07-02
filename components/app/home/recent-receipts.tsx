"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeCard } from "@/components/app/theme-card";
import { useAppLocale } from "@/lib/i18n/app-context";
import { ReceiptText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { readCachedReceipts } from "@/lib/offline/cache";
import { getDeletedReceiptIdsFilter } from "@/lib/receipt/deleted-receipt-tombstones";
import { subscribeLocalDbChanges } from "@/lib/local-db";

interface ReceiptItem {
  receiptId: string;
  totalPaid: number;
  hiddenTotal: number;
  merchantName: string | null;
  createdAt: string | null;
  currency: string;
  status: string;
}

interface RecentReceiptsProps {
  accountLevel?: number;
  limit?: number;
  className?: string;
}

export function RecentReceipts({ accountLevel = 1, limit = 5, className }: RecentReceiptsProps) {
  const { t, locale } = useAppLocale();
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const tf = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const byLocale = (labels: { tr: string; en: string; ru?: string; th?: string; es?: string; zh?: string }) =>
    labels[locale as keyof typeof labels] || labels.en || labels.tr;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        await loadBootstrapSnapshot().catch(() => {});
        const tomb = getDeletedReceiptIdsFilter();
        const records = (await readCachedReceipts()).filter((r) => !tomb.has(r.receiptId)).slice(0, limit);
        if (cancelled) return;
        setReceipts(
          records.map((record) => ({
            receiptId: record.receiptId,
            totalPaid: record.totalPaid,
            hiddenTotal: record.hiddenTotal,
            merchantName: record.merchantName,
            createdAt: record.createdAt,
            currency: record.currency,
            status: record.status,
          }))
        );
      } catch {
        if (!cancelled) setFetchError(true);
        // Mevcut veriyi koruyoruz — listeyi silmiyoruz
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribeLocalDbChanges((stores) => {
      if (stores.includes("receipts")) {
        void load();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [limit]);

  if (loading) {
    return (
      <ThemeCard accountLevel={accountLevel} className={cn("animate-pulse", className)}>
        <div className="p-4 h-24 rounded bg-muted/50" />
      </ThemeCard>
    );
  }

  if (receipts.length === 0) {
    return (
      <ThemeCard accountLevel={accountLevel} className={className}>
        <div className="p-4 flex flex-col items-center justify-center py-6 gap-2">
          <ReceiptText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {fetchError
              ? tf(
                  "home.receiptsLoadError",
                  byLocale({
                    tr: "Fişler yüklenemedi",
                    en: "Failed to load receipts",
                    ru: "Не удалось загрузить чеки",
                    th: "โหลดใบเสร็จไม่สำเร็จ",
                    es: "No se pudieron cargar los recibos",
                    zh: "加载收据失败",
                  }),
                )
              : tf(
                  "home.receiptsEmpty",
                  byLocale({
                    tr: "Henüz fiş yok",
                    en: "No receipts yet",
                    ru: "Пока нет чеков",
                    th: "ยังไม่มีใบเสร็จ",
                    es: "Aún no hay recibos",
                    zh: "还没有收据",
                  }),
                )}
          </p>
          <Link
            href="/app/mine"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("home.addWithScan")}
          </Link>
        </div>
      </ThemeCard>
    );
  }

  return (
    <ThemeCard accountLevel={accountLevel} className={className}>
      {fetchError && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--app-text-muted)" }}>
          <span style={{ color: "#ef4444" }}>⚠</span>
          {tf(
            "home.receiptsStaleWarning",
            byLocale({
              tr: "Önbellek verisi gösteriliyor, yenileme başarısız",
              en: "Showing cached data, refresh failed",
              ru: "Показываются кэшированные данные, обновление не удалось",
              th: "กำลังแสดงข้อมูลแคช การรีเฟรชล้มเหลว",
              es: "Mostrando datos en caché, la actualización falló",
              zh: "正在显示缓存数据，刷新失败",
            }),
          )}
        </div>
      )}
      <div className="p-4 flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t("home.recentReceipts")}</h3>
        <Link
          href="/app/receipts"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          {t("home.viewAll")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="space-y-2 px-4 pb-4">
        {receipts.map((r) => (
          <li key={r.receiptId}>
            <Link
              href={`/app/receipts/${r.receiptId}`}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {r.merchantName ??
                    tf(
                      "home.receiptFallbackName",
                      byLocale({
                        tr: "Fiş",
                        en: "Receipt",
                        ru: "Чек",
                        th: "ใบเสร็จ",
                        es: "Recibo",
                        zh: "收据",
                      }),
                    )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.totalPaid != null ? `${r.totalPaid.toFixed(0)} ${r.currency ?? "TRY"}` : ""}
                  {r.hiddenTotal > 0 && (
                    <span className="ml-1 text-primary">
                      +{r.hiddenTotal.toFixed(0)}{" "}
                      {tf(
                        "home.hiddenShort",
                        byLocale({
                          tr: "gizli",
                          en: "hidden",
                          ru: "скрыто",
                          th: "ซ่อนอยู่",
                          es: "oculto",
                          zh: "隐藏",
                        }),
                      )}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </ThemeCard>
  );
}
