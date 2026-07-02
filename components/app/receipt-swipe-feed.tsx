"use client";

/**
 * Full-screen swipeable receipt feed (replaces the old paginated list grid).
 *
 * Design ported from the standalone prototype (~/Downloads/yumo-receipts) but
 * bound to the real Receipt contract + app theme. Key fix vs. the prototype:
 * neighbours (index-1 / index+1) are always mounted (windowing), so swiping is
 * smooth instead of rendering a card only once it is touched.
 *
 * No invented data: payment method / POS / card number do not exist on Receipt,
 * so they are not shown. Hidden cost uses the real 4-layer model (productValue
 * is the real value, NOT hidden); only importSystem + retailBrand + state are
 * shown as the hidden breakdown. Line items are lazy-loaded from the local cache
 * for the active card; if absent the section is hidden (never faked).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { getCategorySchemaLabel } from "@/lib/receipt/cost-layer-display";
import { StatusBadge } from "@/components/app/status-badge";
import { displayHiddenCost, displayHiddenPercent } from "@/lib/receipt/display-hidden-cost";
import { readCachedReceiptById } from "@/lib/offline/cache";
import { convertCachedReceiptToReceipt } from "@/lib/offline/receipt-cache";
import type { Receipt, ReceiptLineItem } from "@/lib/mock/types";
import { ReceiptText, Trash2, MapPin, Calendar, Clock, Hand, ChevronsUp } from "lucide-react";

const SWIPE_HINT_KEY = "yumo:receipts:swipeHintSeen";

interface ReceiptSwipeFeedProps {
  receipts: Receipt[];
  accountLevel: number;
  isAdmin: boolean;
  isLocalDev: boolean;
  deletingId: string | null;
  statusUpdatingId: string | null;
  /** Changes whenever the underlying page/filter set changes → resets the index. */
  resetSignal: string;
  /** When arriving from the previous page (swipe-down at top), start at the last card. */
  startAtEnd: boolean;
  currentPage: number;
  totalPages: number;
  onOpen: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onVerify: (id: string) => void;
  onAdminStatusChange: (id: string, status: string, e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Active card is near the end of the loaded page — parent may prefetch next page. */
  onNearEnd: () => void;
  /** Swiped next past the last card — parent advances to the next page (if any). */
  onReachEnd: () => void;
  /** Swiped prev before the first card — parent goes to the previous page (if any). */
  onReachStart: () => void;
}

const SWIPE_EASE = "transform 0.32s cubic-bezier(0.32,0.72,0,1)";

export function ReceiptSwipeFeed(props: ReceiptSwipeFeedProps) {
  const {
    receipts,
    accountLevel,
    resetSignal,
    startAtEnd,
    currentPage,
    totalPages,
    onNearEnd,
    onReachEnd,
    onReachStart,
  } = props;

  const tier = useTier(accountLevel);
  const { locale } = useAppLocale();
  const byLocale = useCallback(
    (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
      if (locale === "tr") return tr;
      if (locale === "ru") return ru;
      if (locale === "th") return th;
      if (locale === "es") return es;
      if (locale === "zh") return zh;
      return en;
    },
    [locale]
  );

  const [index, setIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  // The live drag is driven imperatively on this single wrapper (the "track")
  // instead of through React state — re-rendering 3 full cards on every
  // touchmove frame is what made the swipe feel laggy. The track carries the
  // finger-follow offset; each card only carries its static stack offset.
  const trackRef = useRef<HTMLDivElement | null>(null);

  const last = receipts.length - 1;

  // One-time swipe tutorial: show a gesture hint on first open (per device),
  // auto-dismiss after a few seconds or on the first interaction.
  const dismissHint = useCallback(() => {
    setHintVisible(false);
    try {
      window.localStorage.setItem(SWIPE_HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (receipts.length < 2) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(SWIPE_HINT_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    setHintVisible(true);
    const t = window.setTimeout(() => dismissHint(), 4500);
    return () => window.clearTimeout(t);
  }, [receipts.length, dismissHint]);

  // Reset index whenever the page/filter set changes.
  useEffect(() => {
    setIndex(startAtEnd ? Math.max(0, receipts.length - 1) : 0);
    resetTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // Clamp if the array shrank (e.g. after delete).
  useEffect(() => {
    if (index > last && last >= 0) setIndex(last);
  }, [last, index]);

  // Notify parent for prefetch when the user nears the end of the loaded page.
  useEffect(() => {
    if (last >= 0 && index >= last - 2) onNearEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, last]);

  const goNext = useCallback(() => {
    if (index < last) setIndex((i) => i + 1);
    else if (currentPage < totalPages) onReachEnd();
  }, [index, last, currentPage, totalPages, onReachEnd]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
    else if (currentPage > 1) onReachStart();
  }, [index, currentPage, onReachStart]);

  // ── Touch swipe ────────────────────────────────────────────────
  // gestureMode locks per-gesture: "scroll" lets the card's inner content
  // scroll natively; "deck" moves the card stack. Decided on the first move
  // based on whether the active card can still scroll in that direction — this
  // prevents the content-scroll vs. swipe-to-next conflict.
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef(0);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const gestureMode = useRef<"scroll" | "deck" | null>(null);

  // Imperative helpers: move/settle the track without a React render.
  const setTrack = useCallback((y: number, animate: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? SWIPE_EASE : "none";
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  }, []);
  const resetTrack = useCallback(() => setTrack(0, false), [setTrack]);

  function onTouchStart(e: React.TouchEvent) {
    if (hintVisible) dismissHint();
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    gestureMode.current = null;
    scrollElRef.current = (e.target as HTMLElement).closest<HTMLElement>("[data-rcard-scroll]");
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    let dy = e.touches[0].clientY - touchStartY.current;

    // Decide the gesture mode once, on the first meaningful move.
    if (gestureMode.current === null) {
      if (Math.abs(dy) <= 6) return;
      const sc = scrollElRef.current;
      const canScrollUp = !!sc && sc.scrollTop > 0; // content can move down on drag-down
      const canScrollDown = !!sc && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1;
      if ((dy > 0 && canScrollUp) || (dy < 0 && canScrollDown)) {
        gestureMode.current = "scroll";
      } else {
        gestureMode.current = "deck";
      }
    }

    if (gestureMode.current !== "deck") return;
    // Rubber-band at the absolute edges (first page top / last page bottom).
    const atTop = index === 0 && currentPage === 1;
    const atBottom = index === last && currentPage >= totalPages;
    if ((atTop && dy > 0) || (atBottom && dy < 0)) dy *= 0.32;
    // Near-1:1 finger tracking feels direct; the slight damp keeps it premium.
    setTrack(dy * 0.92, false);
  }
  function onTouchEnd(e: React.TouchEvent) {
    const wasDeck = gestureMode.current === "deck";
    gestureMode.current = null;
    if (touchStartY.current === null || !wasDeck) {
      touchStartY.current = null;
      return;
    }
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dt = Math.max(1, Date.now() - touchStartTime.current);
    const vel = Math.abs(dy) / dt;
    const fired = vel > 0.3 || Math.abs(dy) > 60;
    // Settle the track back to rest with easing; the index change (if any)
    // animates the card stack over the same curve, so the two read as one move.
    setTrack(0, true);
    if (fired && dy < 0) goNext();
    else if (fired && dy > 0) goPrev();
    touchStartY.current = null;
  }

  // ── Wheel / trackpad swipe ─────────────────────────────────────
  const wheelLock = useRef(false);
  function onWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaY) < 18) return;
    if (hintVisible) dismissHint();
    if (wheelLock.current) return;
    wheelLock.current = true;
    if (e.deltaY > 0) goNext();
    else goPrev();
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 420);
  }

  if (receipts.length === 0) return null;

  // Window: keep neighbours mounted so swipes are seamless.
  const windowIndices: number[] = [];
  for (let i = index - 1; i <= index + 1; i++) {
    if (i >= 0 && i <= last) windowIndices.push(i);
  }

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden rounded-3xl select-none"
      style={{
        // Let the browser own vertical panning (native card-content scroll);
        // the deck swipe is layered on top in JS once the content hits its edge.
        touchAction: "pan-y",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      {/* Progress dots */}
      <div className="pointer-events-none absolute left-0 right-0 top-2.5 z-30 flex justify-center gap-1.5">
        {receipts.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full"
            style={{
              width: i === index ? 16 : 4,
              background: i === index ? tier.accent : "rgba(255,255,255,0.14)",
              transition: "all 0.25s",
            }}
          />
        ))}
      </div>

      {/* Track: the live drag offset is applied here (imperatively), so the
          cards inside never re-render mid-gesture. */}
      <div ref={trackRef} className="absolute inset-0" style={{ willChange: "transform" }}>
        {windowIndices.map((i) => {
          const offset = i - index;
          return (
            <div
              key={receipts[i].id}
              className="absolute inset-0"
              style={{
                transform: `translate3d(0, ${offset * 100}%, 0)`,
                transition: SWIPE_EASE,
                zIndex: offset === 0 ? 20 : 10,
              }}
            >
              <ReceiptFullCard
                receipt={receipts[i]}
                active={offset === 0}
                tier={tier}
                byLocale={byLocale}
                {...props}
              />
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {hintVisible && (
          <SwipeUpHint
            accent={tier.accent}
            label={byLocale("Yukarı kaydır", "Swipe up", "Листайте вверх", "ปัดขึ้น", "Desliza arriba", "向上滑动")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── One-time swipe tutorial (gesture coach mark) ──────────────────
function SwipeUpHint({ accent, label }: { accent: string; label: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* soft scrim so the gesture reads over any card */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 58%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 35%, transparent 65%)" }}
      />

      {/* rising chevrons */}
      <motion.div
        className="relative mb-2"
        animate={{ y: [4, -8, 4], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronsUp className="h-7 w-7" style={{ color: accent }} />
      </motion.div>

      {/* hand making the upward swipe */}
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: `${accent}1f`, border: `1px solid ${accent}55`, boxShadow: `0 0 28px ${accent}33` }}
        animate={{ y: [22, -22, 22], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Hand className="h-8 w-8" style={{ color: accent }} />
      </motion.div>

      <span
        className="relative mt-5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: "rgba(0,0,0,0.45)", color: "var(--app-text-primary)", border: "1px solid var(--app-border)" }}
      >
        {label}
      </span>
    </motion.div>
  );
}

// ── Single full-screen card ──────────────────────────────────────
interface CardProps extends ReceiptSwipeFeedProps {
  receipt: Receipt;
  active: boolean;
  tier: ReturnType<typeof useTier>;
  byLocale: (tr: string, en: string, ru: string, th: string, es: string, zh: string) => string;
}

function ReceiptFullCard(props: CardProps) {
  const {
    receipt: r,
    active,
    tier,
    byLocale,
    isAdmin,
    isLocalDev,
    deletingId,
    statusUpdatingId,
    onOpen,
    onDelete,
    onVerify,
    onAdminStatusChange,
  } = props;

  const acc = tier.accent;
  const { t, locale } = useAppLocale();
  const shownHidden = displayHiddenCost(r);
  const hiddenPct = displayHiddenPercent(r);
  const hasHidden = shownHidden > 0;
  const paidVisible = Math.max(0, r.total - shownHidden);

  // Real 3-layer hidden breakdown (productValue is the real value, not hidden).
  const layers = [
    {
      label: byLocale("İthalat & Sistem", "Import & System", "Импорт и система", "นำเข้า & ระบบ", "Importación y sistema", "进口与系统"),
      amount: r.hiddenCost?.importSystem ?? 0,
      color: "var(--receipt-category-supply)",
    },
    {
      label: byLocale("Perakende / Marka", "Retail / Brand", "Розница / бренд", "ค้าปลีก / แบรนด์", "Minorista / marca", "零售 / 品牌"),
      amount: r.hiddenCost?.retailBrand ?? 0,
      color: "var(--receipt-category-retail)",
    },
    {
      label: byLocale("Devlet (KDV)", "State (VAT)", "Государство (НДС)", "รัฐ (VAT)", "Estado (IVA)", "国家(增值税)"),
      amount: r.hiddenCost?.state ?? 0,
      color: "var(--receipt-category-tax)",
    },
  ].filter((l) => l.amount > 0);
  const layerMax = Math.max(1, ...layers.map((l) => l.amount));

  // Lazy line items for the active card (read-only local cache; never faked).
  const [items, setItems] = useState<ReceiptLineItem[] | null>(r.lineItems ?? null);
  useEffect(() => {
    if (!active) return;
    if (items && items.length > 0) return;
    if (r.lineItems && r.lineItems.length > 0) {
      setItems(r.lineItems);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cached = await readCachedReceiptById(r.id);
        if (cancelled || !cached) return;
        const full = convertCachedReceiptToReceipt(cached);
        if (full.lineItems && full.lineItems.length > 0) setItems(full.lineItems);
      } catch {
        /* read-only; ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, r.id]);

  const merchantName = (r.merchantName || "").trim();
  const merchantMissing = !merchantName || merchantName.startsWith("[");
  const merchantLabel = merchantMissing
    ? byLocale(
        "Satıcı bilgisi eksik",
        "Merchant info missing",
        "Нет данных о продавце",
        "ข้อมูลร้านค้าขาดหาย",
        "Falta info del comercio",
        "缺少商家信息"
      )
    : merchantName;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-3xl"
      style={{
        background: tier.cardBg ?? "var(--app-bg-surface)",
        border: `1px solid ${tier.cardBorder ?? "var(--app-border)"}`,
        boxShadow: "var(--app-shadow-card)",
      }}
    >
      {/* Accent stripe */}
      <div
        className="h-[3px] w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${acc} 0%, ${acc}55 55%, transparent 100%)` }}
      />

      <div
        data-rcard-scroll
        className="flex-1 overflow-y-auto px-5 pb-5 pt-4 [scrollbar-width:none]"
        style={{ overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              className="truncate text-2xl font-bold tracking-tight"
              style={{ color: "var(--app-text-primary)" }}
            >
              {merchantLabel}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]" style={{ color: "var(--app-text-muted)" }}>
              {r.category && r.category !== "other" && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {getCategorySchemaLabel(r.category, locale, r.merchantChannel)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {r.date}
              </span>
              {r.time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {r.time}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => onDelete(r.id, e)}
            disabled={deletingId === r.id}
            className="shrink-0 rounded-lg p-1.5 text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            title={t("receipts.delete") || "Sil"}
            aria-label={t("receipts.delete") || "Delete receipt"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Amounts */}
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
              {byLocale("Ödenen", "Total Paid", "Оплачено", "ยอดชำระ", "Total pagado", "实付")}
            </div>
            <div className="mt-1.5 text-[32px] font-extrabold leading-none tracking-tight" style={{ color: "var(--app-text-primary)" }}>
              {r.total.toFixed(2)}
              <span className="ml-1 text-sm font-normal" style={{ color: "var(--app-text-muted)" }}>{r.currency}</span>
            </div>
            <div className="mt-1.5 font-mono text-[11px]" style={{ color: "var(--app-text-muted)" }}>
              {byLocale("KDV", "VAT", "НДС", "VAT", "IVA", "增值税")} {r.vat.toFixed(2)} {r.currency}
            </div>
          </div>
          <div className="self-stretch pt-5">
            <div className="h-full w-px" style={{ background: "var(--app-border-strong)" }} />
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: hasHidden ? "var(--app-danger)" : "var(--app-success)" }}>
              {byLocale("Gizli Maliyet", "Hidden Cost", "Скрытая цена", "ต้นทุนแฝง", "Costo oculto", "隐藏成本")}
            </div>
            <div
              className="mt-1.5 text-[32px] font-extrabold leading-none tracking-tight"
              style={{ color: hasHidden ? "var(--app-danger)" : "var(--app-success)" }}
            >
              {shownHidden.toFixed(2)}
              <span className="ml-1 text-sm font-normal opacity-70">{r.currency}</span>
            </div>
            <div className="mt-1.5 font-mono text-[11px]" style={{ color: "var(--app-text-muted)" }}>
              {hasHidden
                ? `%${hiddenPct.toFixed(0)} ${byLocale("toplam", "of total", "от суммы", "ของยอด", "del total", "占比")}`
                : byLocale("gizli maliyet yok", "no hidden cost", "нет скрытой цены", "ไม่มีต้นทุนแฝง", "sin costo oculto", "无隐藏成本")}
            </div>
          </div>
        </div>

        {/* Ratio bar */}
        <div className="mt-4">
          <div className="relative h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="absolute left-0 top-0 h-full rounded-l-full"
              style={{ width: `${r.total > 0 ? (paidVisible / r.total) * 100 : 100}%`, background: "rgba(255,255,255,0.16)" }}
            />
            {hasHidden && (
              <div
                className="absolute right-0 top-0 h-full rounded-r-full"
                style={{ width: `${hiddenPct}%`, background: "linear-gradient(90deg, var(--app-danger), #ef4444)" }}
              />
            )}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px]" style={{ color: "var(--app-text-muted)" }}>
            <span>{byLocale("Net değer", "Net value", "Чистая цена", "มูลค่าสุทธิ", "Valor neto", "净值")} {paidVisible.toFixed(2)}</span>
            {hasHidden && <span style={{ color: "var(--app-danger)" }}>{byLocale("Gizli", "Hidden", "Скрыто", "แฝง", "Oculto", "隐藏")} {shownHidden.toFixed(2)}</span>}
          </div>
        </div>

        {/* Hidden breakdown */}
        {hasHidden && layers.length > 0 && (
          <div className="mt-4 space-y-2">
            {layers.map((row, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="flex-1 font-mono text-[11px]" style={{ color: "var(--app-text-secondary)" }}>{row.label}</div>
                <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(row.amount / layerMax) * 100}%`, background: row.color }} />
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums" style={{ color: "var(--app-text-secondary)" }}>
                  {row.amount.toFixed(2)} {r.currency}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Line items (lazy; hidden when unavailable) */}
        {items && items.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
                {byLocale("Kalemler", "Line Items", "Позиции", "รายการ", "Artículos", "明细")} · {items.length}
              </span>
              <div className="h-px flex-1" style={{ background: "var(--app-border)" }} />
            </div>
            <div className="space-y-0.5">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-2 py-1.5"
                  style={{ borderBottom: i < items.length - 1 ? "1px solid var(--app-border)" : "none" }}
                >
                  <span className="flex-1 truncate text-[13px]" style={{ color: "var(--app-text-secondary)" }}>
                    {it.displayName || it.rawName}
                  </span>
                  {it.quantity != null && (
                    <span className="shrink-0 font-mono text-[10px]" style={{ color: "var(--app-text-muted)" }}>
                      ×{it.quantity}
                      {it.unitType ? ` ${it.unitType}` : ""}
                    </span>
                  )}
                  {it.lineTotal != null && (
                    <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                      {it.lineTotal.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer: status + reward */}
        <div className="mt-5 flex items-end justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--app-border)" }}>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={r.status} />
              {r.status === "scanned" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerify(r.id);
                  }}
                  className="rounded-md border px-2 py-1 text-[11px]"
                  style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)", background: "var(--app-bg-elevated)" }}
                >
                  {byLocale("Fişi Onayla", "Verify Receipt", "Подтвердить чек", "ยืนยันใบเสร็จ", "Verificar recibo", "验证收据")}
                </button>
              )}
              {isAdmin && isLocalDev && (
                <select
                  value={dbStatus(r.status)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onAdminStatusChange(r.id, e.target.value, e)}
                  disabled={statusUpdatingId === r.id}
                  className="rounded-md border px-2 py-1 text-[11px]"
                  style={{ borderColor: "var(--app-border)", color: "var(--app-text-primary)", background: "var(--app-bg-elevated)", colorScheme: "dark" }}
                >
                  {["scanned", "pending", "analyzed", "verified", "rejected"].map((s) => (
                    <option key={s} value={s} style={{ background: "var(--app-bg-elevated)", color: "var(--app-text-primary)" }}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {isAdmin && (r.displayName || r.username) && (
              <span className="text-[10px]" style={{ color: "var(--app-text-muted)" }}>
                {r.displayName || `@${r.username}`}
              </span>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <div className="font-mono text-xl font-extrabold leading-none tabular-nums" style={{ color: tier.accent2 ?? acc }}>
              +{r.reward.amount.toFixed(2)}
            </div>
            <div className="mt-0.5 font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--app-text-muted)" }}>
              cPoints
            </div>
          </div>
        </div>

        {/* Open detail */}
        <button
          type="button"
          onClick={() => onOpen(r.id)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)", color: "var(--app-text-primary)" }}
        >
          <ReceiptText className="h-4 w-4" style={{ color: acc }} />
          {byLocale("Detayı aç", "Open detail", "Открыть детали", "เปิดรายละเอียด", "Abrir detalle", "查看详情")}
        </button>
      </div>
    </div>
  );
}

function dbStatus(status: Receipt["status"]): string {
  if (status === "VERIFIED") return "verified";
  if (status === "REJECTED") return "rejected";
  if (status === "PENDING") return "pending";
  return String(status).toLowerCase();
}
