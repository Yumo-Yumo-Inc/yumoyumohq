"use client";

/**
 * ProductPriceDetail — bottom sheet that opens when a user taps a tracked
 * product in the PriceTrackSection. Shows the full purchase history with a
 * price chart, summary statistics, and a chronological list of every purchase
 * instance (date, merchant, quantity, unit price, line total).
 *
 * Data comes from GET /api/analysis/product-history?key=<productKey>.
 * Empty / error states are handled inline — no fabricated values.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ProductHistoryResponse } from "@/lib/analysis/types";
import { NUM_FEAT } from "@/components/insights/typography";

interface ProductPriceDetailProps {
  productKey: string;
  money: (n: number, digits?: number) => string;
  tr: boolean;
  locale: string;
  onClose: () => void;
}

function fmtPct(ratio: number, locale: string): string {
  const pct = Math.round(Math.abs(ratio) * 1000) / 10;
  const sign = ratio > 0 ? "+" : ratio < 0 ? "−" : "";
  return locale === "tr" ? `${sign}%${pct}` : `${sign}${pct}%`;
}

function useProductHistory(productKey: string): {
  data: ProductHistoryResponse | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<ProductHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/analysis/product-history?key=${encodeURIComponent(productKey)}`,
          { cache: "no-store" },
        );
        if (!alive) return;
        if (res.ok) {
          const json = (await res.json()) as ProductHistoryResponse;
          setData(json);
        } else {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "Failed to load");
        }
      } catch {
        if (alive) setError("Network error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [productKey]);

  return { data, loading, error };
}

/** Sparkline chart — same logic as the analysis page, but taller. */
function DetailSparkline({ points, rising }: { points: number[]; rising: boolean }) {
  const reduced = useReducedMotion();
  const path = useMemo(() => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const coords = points.map((v, i) => {
      const x = (i / (points.length - 1)) * 400;
      const y = 120 - ((v - min) / span) * 96;
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
    });
    return { coords, d: coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") };
  }, [points]);

  if (!path) return null;
  const last = path.coords[path.coords.length - 1];

  return (
    <svg viewBox="0 0 400 128" className="block w-full" role="img" aria-hidden>
      <defs>
        <linearGradient id="detail-spark-up" x1="0" x2="1">
          <stop offset="0" stopColor="var(--app-gold-dim)" />
          <stop offset="1" stopColor="var(--app-gold-light)" />
        </linearGradient>
        <linearGradient id="detail-spark-down" x1="0" x2="1">
          <stop offset="0" stopColor="#0d9488" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="detail-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(201,168,76,0.14)" />
          <stop offset="1" stopColor="rgba(201,168,76,0)" />
        </linearGradient>
      </defs>
      <path d={`${path.d} L400,128 L0,128 Z`} fill={rising ? "url(#detail-spark-fill)" : "none"} opacity={0.7} />
      <motion.path
        d={path.d}
        fill="none"
        stroke={rising ? "url(#detail-spark-up)" : "url(#detail-spark-down)"}
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <circle cx={last[0]} cy={last[1]} r={5} fill={rising ? "var(--app-gold-light)" : "#34D399"} />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-xl border px-3 py-2.5"
      style={{
        borderColor: "var(--app-border)",
        background: "var(--app-bg-surface)",
      }}
    >
      <span className="text-[10.5px] font-medium text-app-text-muted">{label}</span>
      <span className="mt-0.5 font-mono text-[15px] font-bold text-app-text-primary" style={NUM_FEAT}>
        {value}
      </span>
      {sub && (
        <span className="mt-0.5 text-[10px] text-app-text-muted">{sub}</span>
      )}
    </div>
  );
}

export function ProductPriceDetail({
  productKey,
  money,
  tr,
  locale,
  onClose,
}: ProductPriceDetailProps) {
  const reduced = useReducedMotion();
  const { data, loading, error } = useProductHistory(productKey);

  const unitLabel = data?.unitType ?? "";
  const packLabel =
    data?.packSize && unitLabel ? ` ${data.packSize}${unitLabel}` : "";

  // Compute price trend for the sparkline
  const pricePoints = useMemo(
    () => data?.history.map((h) => h.unitPrice).filter((p): p is number => p !== null && p > 0) ?? [],
    [data],
  );
  const rising =
    pricePoints.length >= 2
      ? pricePoints[pricePoints.length - 1] > pricePoints[0]
      : false;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
        role="dialog"
        aria-modal
        aria-label={tr ? "Ürün fiyat geçmişi" : "Product price history"}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(6,8,13,0.62)", backdropFilter: "blur(6px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.section
          className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col overflow-hidden border"
          style={{
            borderColor: "var(--app-border-strong, rgba(255,255,255,0.14))",
            borderRadius: "20px 20px 0 0",
            background: "linear-gradient(160deg, var(--app-bg-elevated, #181e2d), var(--app-bg-surface, #0f1117))",
          }}
          initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={tr ? "Kapat" : "Close"}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-5 pb-8 pt-5">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col gap-4 py-8">
                <div className="h-6 w-2/3 animate-pulse rounded bg-app-bg-elevated" />
                <div className="h-32 animate-pulse rounded-2xl bg-app-bg-elevated" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-app-bg-elevated" />
                  ))}
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-app-bg-elevated" />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="py-8 text-center">
                <p className="text-[14px] text-app-text-muted">
                  {tr ? "Yüklenemedi. Tekrar dene." : "Failed to load. Try again."}
                </p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && data && data.history.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[14px] text-app-text-muted">
                  {tr ? "Bu ürün için henüz yeterli veri yok." : "Not enough data for this product yet."}
                </p>
              </div>
            )}

            {/* Content */}
            {!loading && !error && data && data.history.length > 0 && (
              <>
                {/* Header */}
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold leading-tight text-app-text-primary">
                    {data.name}
                    {packLabel && (
                      <span className="ml-1.5 text-[14px] font-medium text-app-text-muted">
                        {packLabel}
                      </span>
                    )}
                  </h2>
                  {data.brand && (
                    <p className="mt-0.5 text-[13px] text-app-text-secondary">{data.brand}</p>
                  )}
                  <p className="mt-0.5 text-[11.5px] text-app-text-muted">
                    {data.stats.count} {tr ? "alım" : "purchases"}
                    {data.stats.spanDays > 0 && (
                      <>
                        {" · "}
                        {data.stats.spanDays} {tr ? "gün" : "days"}
                      </>
                    )}
                  </p>
                </div>

                {/* Price chart */}
                {pricePoints.length >= 2 && (
                  <div
                    className="mb-4 overflow-hidden rounded-2xl border px-3 pb-2 pt-3"
                    style={{
                      borderColor: "var(--app-border)",
                      background: "linear-gradient(160deg, var(--app-bg-surface), var(--app-bg-elevated) 75%)",
                    }}
                  >
                    <DetailSparkline points={pricePoints} rising={rising} />
                  </div>
                )}

                {/* Stats grid */}
                <div className="mb-5 grid grid-cols-3 gap-2">
                  <StatCard
                    label={tr ? "En düşük" : "Min"}
                    value={data.stats.min != null ? money(data.stats.min, 2) : "—"}
                    sub={`/${unitLabel || (tr ? "birim" : "unit")}`}
                  />
                  <StatCard
                    label={tr ? "Ortalama" : "Avg"}
                    value={data.stats.avg != null ? money(data.stats.avg, 2) : "—"}
                    sub={`/${unitLabel || (tr ? "birim" : "unit")}`}
                  />
                  <StatCard
                    label={tr ? "En yüksek" : "Max"}
                    value={data.stats.max != null ? money(data.stats.max, 2) : "—"}
                    sub={`/${unitLabel || (tr ? "birim" : "unit")}`}
                  />
                </div>

                {/* Trend indicator */}
                {data.stats.latest != null && data.stats.avg != null && data.stats.avg > 0 && (
                  <div className="mb-5 flex items-center gap-2">
                    {(() => {
                      const delta = (data.stats.latest - data.stats.avg) / data.stats.avg;
                      const Icon = delta > 0.02 ? TrendingUp : delta < -0.02 ? TrendingDown : Minus;
                      const color = delta > 0.02 ? "#F87171" : delta < -0.02 ? "#34D399" : "var(--app-text-muted)";
                      return (
                        <>
                          <Icon size={16} style={{ color }} />
                          <span className="text-[13px] font-medium" style={{ color: "var(--app-text-secondary)" }}>
                            {tr ? "Son fiyat: " : "Latest: "}
                            <span className="font-mono font-bold" style={{ ...NUM_FEAT, color: "var(--app-text-primary)" }}>
                              {money(data.stats.latest!, 2)}
                            </span>
                            <span className="ml-1 font-mono text-[12px]" style={{ color }}>
                              {fmtPct(delta, locale)} {tr ? "ortalamaya göre" : "vs avg"}
                            </span>
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Purchase history */}
                <h3 className="mb-2 text-[13px] font-semibold text-app-text-muted">
                  {tr ? "Satın alma geçmişi" : "Purchase history"}
                </h3>
                <div
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  {data.history.map((item, i) => (
                    <div
                      key={`${item.receiptId}-${i}`}
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{
                        borderTop: i > 0 ? "1px solid var(--app-border)" : undefined,
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-app-text-primary">
                          {item.date}
                        </div>
                        {item.merchantName && (
                          <div className="truncate text-[11px] text-app-text-muted">
                            {item.merchantName}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex shrink-0 items-baseline gap-3 text-right">
                        <span className="text-[11px] text-app-text-muted">
                          {item.quantity > 1 ? `×${item.quantity}` : ""}
                        </span>
                        <span className="font-mono text-[12.5px] font-semibold text-app-text-primary" style={NUM_FEAT}>
                          {item.unitPrice != null ? money(item.unitPrice, 2) : "—"}
                        </span>
                        {item.lineTotal != null && (
                          <span className="font-mono text-[11px] text-app-text-muted" style={NUM_FEAT}>
                            {money(item.lineTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.section>
      </div>
    </AnimatePresence>
  );
}