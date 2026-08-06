"use client";

/**
 * Weekly Ledger — the long-form closed-week document. One reading column,
 * hairline-separated numbered sections, typographic charts; no card stacking.
 * Sections render only when their data exists (empty inputs are skipped, never
 * fabricated). Motion is the showcase register: in-view reveals + count-ups,
 * fully quiet under prefers-reduced-motion.
 */

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { StaggerReveal, Reveal } from "@/components/ui/stagger-reveal";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useTier } from "@/lib/theme/theme-context";
import {
  addDays,
  isClosedWeekStart,
  type WeeklyLedgerReport,
  type WeeklyLedgerResponse,
} from "@/lib/weekly-report/types";

async function fetchLedger(week: string): Promise<WeeklyLedgerResponse> {
  const res = await fetch(`/api/weekly-report?week=${encodeURIComponent(week)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("weekly-report failed");
  return res.json();
}

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

function formatMoneyExact(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDay(dateStr: string, locale: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(new Date(dateStr + "T00:00:00Z"));
}

/** Count-up that waits until the number scrolls into view. */
function InViewAmount({ value, format, className, style }: {
  value: number;
  format: (v: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const eased = useCountUp(value, { durationMs: 1100, start: inView });
  return (
    <span ref={ref} className={className} style={style}>
      {format(inView ? eased : 0)}
    </span>
  );
}

/** Hairline-topped numbered section — the document's only structural motif. */
function LedgerSection({ index, label, children }: { index: string; label: string; children: React.ReactNode }) {
  return (
    <StaggerReveal whileInView className="border-t pt-5" style={{ borderColor: "var(--app-border)" }}>
      <Reveal className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>{index}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--app-text-muted)" }}>{label}</span>
      </Reveal>
      <div className="mt-4 space-y-4">{children}</div>
    </StaggerReveal>
  );
}

function DailyStrip({ report, locale }: { report: WeeklyLedgerReport; locale: string }) {
  const max = Math.max(...report.dailyTotals, 1);
  const maxIdx = report.dailyTotals.indexOf(Math.max(...report.dailyTotals));
  return (
    <div className="flex items-end gap-2" aria-hidden>
      {report.dailyTotals.map((v, i) => {
        const h = v > 0 ? Math.max(8, Math.round((v / max) * 56)) : 2;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-full"
              style={{
                height: `${h}px`,
                maxWidth: "18px",
                background: i === maxIdx && v > 0
                  ? "linear-gradient(180deg, var(--wl-accent), color-mix(in srgb, var(--wl-accent) 45%, transparent))"
                  : "color-mix(in srgb, var(--app-text-muted) 26%, transparent)",
              }}
            />
            <span className="font-mono text-[10px] uppercase" style={{ color: "var(--app-text-muted)" }}>
              {formatDay(addDays(report.weekStart, i), locale, { weekday: "narrow" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Four small bars: the three prior weeks + this one, oldest first. */
function PriorWeeksStrip({ report, locale, t }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string }) {
  const prior = report.priorWeekTotals ?? [];
  if (!prior.some((v) => v > 0)) return null;
  const bars = [...prior, report.total];
  const max = Math.max(...bars, 1);
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--app-text-muted)" }}>
        {t("weeklyLedger.volume.priorWeeks")}
      </p>
      <div className="mt-2 flex items-end gap-3">
        {bars.map((v, i) => {
          const isCurrent = i === bars.length - 1;
          const h = v > 0 ? Math.max(6, Math.round((v / max) * 44)) : 2;
          return (
            <div key={i} className="flex flex-col items-start gap-1.5">
              <div
                className="w-9 rounded-full"
                style={{
                  height: `${h}px`,
                  background: isCurrent
                    ? "linear-gradient(180deg, var(--wl-accent), color-mix(in srgb, var(--wl-accent) 45%, transparent))"
                    : "color-mix(in srgb, var(--app-text-muted) 24%, transparent)",
                }}
              />
              <span className="font-mono text-[10px] tabular-nums" style={{ color: isCurrent ? "var(--app-text-secondary)" : "var(--app-text-muted)" }}>
                {v > 0 ? formatMoney(v, report.currency, locale) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VolumeSection({ report, locale, t, index }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  const pace = useMemo(() => {
    if (report.trailingAvg == null || report.trailingAvg <= 0) return t("weeklyLedger.volume.noBaseline");
    const delta = (report.total - report.trailingAvg) / report.trailingAvg;
    if (Math.abs(delta) < 0.05) return t("weeklyLedger.volume.onPace");
    const pct = Math.round(Math.abs(delta) * 100);
    return delta > 0 ? t("weeklyLedger.volume.aboveAvg", { pct }) : t("weeklyLedger.volume.belowAvg", { pct });
  }, [report, t]);

  return (
    <LedgerSection index={index} label={t("weeklyLedger.section.volume")}>
      <Reveal>
        <p className="font-mono text-4xl font-black tabular-nums tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--app-text-primary)" }}>
          <InViewAmount value={report.total} format={(v) => formatMoney(v, report.currency, locale)} />
        </p>
        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>
          {t("weeklyLedger.volume.receipts", { count: report.receiptCount })} · {t("weeklyLedger.volume.places", { count: report.distinctMerchants })} — {t("weeklyLedger.volume.captured")}
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--app-text-muted)" }}>{pace}</p>
      </Reveal>
      <Reveal><DailyStrip report={report} locale={locale} /></Reveal>
      <Reveal><PriorWeeksStrip report={report} locale={locale} t={t} /></Reveal>
      {report.categories.length > 0 ? (
        <Reveal>
          <p className="text-[13px] font-semibold leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
            {report.categories.map((c, i) => (
              <span key={c.key}>
                {i > 0 ? <span className="mx-1.5 opacity-60">·</span> : null}
                {t(`weeklyLedger.category.${c.key}`)}{" "}
                <span className="font-mono tabular-nums" style={{ color: "var(--app-text-secondary)" }}>
                  {formatMoney(c.total, report.currency, locale)}
                </span>
              </span>
            ))}
          </p>
        </Reveal>
      ) : null}
    </LedgerSection>
  );
}

/** The week's receipts, chronological — the ledger's actual entries. */
function EntriesSection({ report, locale, t, index }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  const entries = report.entries ?? [];
  if (entries.length < 2) return null;
  const shown = entries.slice(0, 14);
  const rest = entries.length - shown.length;
  return (
    <LedgerSection index={index} label={t("weeklyLedger.section.entries")}>
      <Reveal>
        <ul>
          {shown.map((e) => (
            <li
              key={e.receiptId}
              className="flex items-baseline gap-3 border-t py-2.5 first:border-t-0"
              style={{ borderColor: "color-mix(in srgb, var(--app-border) 60%, transparent)" }}
            >
              <span className="w-[86px] shrink-0 font-mono text-[12px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                {formatDay(e.date, locale, { weekday: "short", day: "numeric" })}
                {e.time ? ` ${e.time}` : ""}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>{e.merchant}</span>
              <span className="shrink-0 font-mono text-sm tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                {formatMoneyExact(e.total, report.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
        {rest > 0 ? (
          <p className="mt-2 font-mono text-[12px]" style={{ color: "var(--app-text-muted)" }}>{t("weeklyLedger.entries.more", { count: rest })}</p>
        ) : null}
      </Reveal>
    </LedgerSection>
  );
}

function RevealSection({ report, locale, t, index }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  if (report.hiddenTotal <= 0 || report.hiddenShare == null) return null;
  const pct = Math.round(report.hiddenShare * 100);
  return (
    <LedgerSection index={index} label={t("weeklyLedger.section.reveal")}>
      <Reveal>
        <p className="text-base font-semibold" style={{ color: "var(--app-text-secondary)" }}>
          {t("weeklyLedger.reveal.lead", { total: formatMoney(report.total, report.currency, locale) })}
        </p>
        <p className="mt-1 font-mono text-4xl font-black tabular-nums tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--wl-accent)" }}>
          <InViewAmount value={report.hiddenTotal} format={(v) => formatMoney(v, report.currency, locale)} />
        </p>
        <p className="mt-1 text-base font-semibold" style={{ color: "var(--app-text-secondary)" }}>{t("weeklyLedger.reveal.trail")}</p>
      </Reveal>
      <Reveal>
        <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--app-text-muted) 18%, transparent)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(2, pct))}%`,
              background: "linear-gradient(90deg, var(--wl-accent), color-mix(in srgb, var(--wl-accent) 55%, transparent))",
            }}
          />
        </div>
        <p className="mt-2 flex items-baseline justify-between text-[12px] font-semibold" style={{ color: "var(--app-text-muted)" }}>
          <span>{t("weeklyLedger.reveal.note")}</span>
          <span className="font-mono tabular-nums" style={{ color: "var(--app-text-secondary)" }}>%{pct}</span>
        </p>
        {(report.vatTotal ?? 0) > 0 ? (
          <p className="mt-3 font-mono text-[13px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
            {t("weeklyLedger.reveal.vat", { vat: formatMoney(report.vatTotal, report.currency, locale) })}
          </p>
        ) : null}
      </Reveal>
    </LedgerSection>
  );
}

function MomentSection({ report, locale, t, index }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  const m = report.biggestReceipt;
  if (!m || report.receiptCount < 2) return null;
  return (
    <LedgerSection index={index} label={t("weeklyLedger.section.moment")}>
      <Reveal>
        <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--app-text-muted)" }}>{t("weeklyLedger.moment.title")}</p>
        <p className="mt-2 text-2xl font-black tracking-[-0.02em] sm:text-3xl" style={{ color: "var(--app-text-primary)" }}>{m.merchant}</p>
        <p className="mt-1 font-mono text-sm tabular-nums" style={{ color: "var(--app-text-muted)" }}>
          {formatDay(m.date, locale, { weekday: "long", day: "numeric", month: "long" })}
          {m.time ? ` · ${m.time}` : ""}
        </p>
        <p className="mt-3 font-mono text-3xl font-black tabular-nums tracking-[-0.02em]" style={{ color: "var(--app-text-primary)" }}>
          <InViewAmount value={m.total} format={(v) => formatMoneyExact(v, report.currency, locale)} />
        </p>
      </Reveal>
    </LedgerSection>
  );
}

function WildcardSection({ report, locale, t, index }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  const w = report.wildcard;
  if (!w) return null;
  const money = (v: number) => formatMoneyExact(v, report.currency, locale);

  let headline: string | null = null;
  let line = "";
  if (w.kind === "price_repeat") {
    const up = w.thisPrice > w.prevPrice;
    line = t(up ? "weeklyLedger.wildcard.price_repeat_up" : "weeklyLedger.wildcard.price_repeat_down", {
      item: w.item,
      prev: money(w.prevPrice),
      now: money(w.thisPrice),
      date: formatDay(w.prevDate, locale, { day: "numeric", month: "long" }),
    });
    const pct = Math.round((Math.abs(w.thisPrice - w.prevPrice) / w.prevPrice) * 100);
    headline = `${up ? "+" : "−"}%${pct}`;
  } else if (w.kind === "night_share") {
    headline = `%${Math.round(w.share * 100)}`;
    line = t("weeklyLedger.wildcard.night_share", { count: w.count });
  } else if (w.kind === "loyalty") {
    headline = `${w.visits}×`;
    line = t("weeklyLedger.wildcard.loyalty", { merchant: w.merchant, visits: w.visits, total: formatMoney(w.total, report.currency, locale) });
  } else {
    const up = w.total > w.trailingAvg;
    headline = `${up ? "+" : "−"}%${Math.round((Math.abs(w.total - w.trailingAvg) / w.trailingAvg) * 100)}`;
    line = t(up ? "weeklyLedger.wildcard.category_pulse_up" : "weeklyLedger.wildcard.category_pulse_down", {
      category: t(`weeklyLedger.category.${w.categoryKey}`),
    });
  }

  return (
    <LedgerSection index={index} label={t("weeklyLedger.section.wildcard")}>
      <Reveal>
        {headline ? (
          <p className="font-mono text-4xl font-black tabular-nums tracking-[-0.03em]" style={{ color: "var(--app-text-primary)" }}>{headline}</p>
        ) : null}
        <p className="mt-2 max-w-[46ch] text-base font-semibold leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>{line}</p>
      </Reveal>
    </LedgerSection>
  );
}

/** Top line items of the week, repeat purchases folded together. */
function ItemsSection({ report, locale, t, index }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  const items = report.topItems ?? [];
  if (items.length === 0 || report.receiptCount < 2) return null;
  return (
    <LedgerSection index={index} label={t("weeklyLedger.section.items")}>
      <Reveal>
        <ul>
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-baseline gap-3 border-t py-2.5 first:border-t-0"
              style={{ borderColor: "color-mix(in srgb, var(--app-border) 60%, transparent)" }}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>
                {it.name}
                {it.occurrences > 1 ? (
                  <span className="ml-1.5 font-mono text-[12px]" style={{ color: "var(--wl-accent)" }}>
                    {t("weeklyLedger.items.times", { count: it.occurrences })}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                {formatMoneyExact(it.total, report.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </LedgerSection>
  );
}

function SingleReceiptSection({ report, locale, t }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string }) {
  const s = report.singleReceipt;
  if (!s) return null;
  return (
    <LedgerSection index="01" label={t("weeklyLedger.section.moment")}>
      <Reveal>
        <p className="max-w-[46ch] text-base font-semibold leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>{t("weeklyLedger.single.intro")}</p>
        <p className="mt-4 text-2xl font-black tracking-[-0.02em] sm:text-3xl" style={{ color: "var(--app-text-primary)" }}>{s.merchant}</p>
        <p className="mt-1 font-mono text-sm tabular-nums" style={{ color: "var(--app-text-muted)" }}>
          {formatDay(s.date, locale, { weekday: "long", day: "numeric", month: "long" })}
          {s.time ? ` · ${s.time}` : ""}
        </p>
        <p className="mt-3 font-mono text-4xl font-black tabular-nums tracking-[-0.03em]" style={{ color: "var(--app-text-primary)" }}>
          <InViewAmount value={s.total} format={(v) => formatMoneyExact(v, report.currency, locale)} />
        </p>
      </Reveal>
      {s.items.length > 0 ? (
        <Reveal>
          <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--app-text-muted)" }}>{t("weeklyLedger.single.items")}</p>
          <ul className="mt-2">
            {s.items.map((it, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 border-t py-2 first:border-t-0"
                style={{ borderColor: "color-mix(in srgb, var(--app-border) 60%, transparent)" }}
              >
                <span className="min-w-0 truncate text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>
                  {it.name}
                  {it.quantity && it.quantity > 1 ? <span className="font-mono text-[12px]" style={{ color: "var(--app-text-muted)" }}> ×{it.quantity}</span> : null}
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                  {formatMoneyExact(it.lineTotal, report.currency, locale)}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}
      {s.hidden > 0 ? (
        <Reveal>
          <p className="text-base font-semibold" style={{ color: "var(--app-text-secondary)" }}>
            {t("weeklyLedger.single.hiddenLead", { total: formatMoney(s.total, report.currency, locale) })}{" "}
            <span className="font-mono font-black tabular-nums" style={{ color: "var(--wl-accent)" }}>{formatMoney(s.hidden, report.currency, locale)}</span>{" "}
            {t("weeklyLedger.single.hiddenTrail")}
          </p>
        </Reveal>
      ) : null}
    </LedgerSection>
  );
}

function RewardsSection({ report, t, index }: { report: WeeklyLedgerReport; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  if (report.points <= 0 && report.seasonXpGained <= 0 && report.questsCompleted <= 0) return null;
  return (
    <StaggerReveal whileInView className="border-t pt-5" style={{ borderColor: "var(--app-gold-border)" }}>
      <Reveal className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--app-gold)" }}>{index}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--app-gold)" }}>{t("weeklyLedger.section.rewards")}</span>
      </Reveal>
      <div className="mt-4 space-y-3">
        {report.points > 0 ? (
          <Reveal>
            <p className="font-mono text-4xl font-black tabular-nums tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--app-gold)" }}>
              <InViewAmount value={report.points} format={(v) => `+${Math.round(v).toLocaleString()}`} />{" "}
              <span className="text-lg font-bold tracking-normal">{t("weeklyLedger.rewards.points")}</span>
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>{t("weeklyLedger.rewards.pointsLine")}</p>
          </Reveal>
        ) : null}
        <Reveal>
          <p className="font-mono text-[13px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
            {[
              report.seasonXpGained > 0 ? t("weeklyLedger.rewards.xp", { xp: report.seasonXpGained }) : null,
              report.questsCompleted > 0 ? t("weeklyLedger.rewards.quests", { count: report.questsCompleted }) : null,
              report.seasonLevel != null ? t("weeklyLedger.rewards.level", { level: report.seasonLevel }) : null,
            ].filter(Boolean).join("  ·  ")}
          </p>
        </Reveal>
      </div>
    </StaggerReveal>
  );
}

function OutlookSection({ report, locale, t, index }: { report: WeeklyLedgerReport; locale: string; t: (k: string, p?: Record<string, string | number>) => string; index: string }) {
  const f = report.forecast;
  if (!f) return null;
  return (
    <LedgerSection index={index} label={t("weeklyLedger.section.outlook")}>
      <Reveal>
        <p className="text-base font-semibold" style={{ color: "var(--app-text-secondary)" }}>{t("weeklyLedger.outlook.line")}</p>
        <p className="mt-1 font-mono text-3xl font-black tabular-nums tracking-[-0.02em] sm:text-4xl" style={{ color: "var(--app-text-primary)" }}>
          <InViewAmount value={f.monthProjected} format={(v) => `~${formatMoney(v, report.currency, locale)}`} />
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--app-text-muted)" }}>
          {t("weeklyLedger.outlook.soFar", { amount: formatMoney(f.monthSoFar, report.currency, locale) })}
        </p>
      </Reveal>
      <Reveal>
        <Link
          href="/app/analysis"
          className="inline-flex items-center gap-1.5 text-sm font-black transition-opacity hover:opacity-75"
          style={{ color: "var(--wl-accent)" }}
        >
          {t("weeklyLedger.outlook.cta")}
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </Reveal>
    </LedgerSection>
  );
}

export function WeeklyLedgerPage({ week }: { week: string }) {
  const { t, locale } = useAppLocale();
  const tier = useTier();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weekly-ledger", week],
    queryFn: () => fetchLedger(week),
    staleTime: 10 * 60_000,
  });

  const report = data?.report ?? null;
  const weekStart = data?.weekStart ?? week;
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const nextIsClosed = isClosedWeekStart(nextWeek);

  const rangeLabel = `${formatDay(weekStart, locale, { day: "numeric", month: "short" })} – ${formatDay(addDays(weekStart, 6), locale, { day: "numeric", month: "short" })}`;

  const archetypeKey = report ? `weeklyLedger.archetype.${report.archetype}` : null;
  const archetypeTitle = report
    ? t(`${archetypeKey}.title`, report.archetypeCategory ? { category: t(`weeklyLedger.category.${report.archetypeCategory}`) } : undefined)
    : null;

  return (
    <AppShell className="max-w-[430px] lg:max-w-[680px]" topbarShowBack>
      {/* The tier accent is a hook value, not a CSS token — expose it once here. */}
      <article className="pb-16 pt-2" style={{ "--wl-accent": tier.accent } as React.CSSProperties}>
        {/* Masthead */}
        <header>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "var(--app-text-muted)" }}>
              {t("weeklyLedger.eyebrow")}
            </p>
            <p className="flex items-center gap-2 font-mono text-[12px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
              <Link href={`/app/weekly/${prevWeek}`} aria-label={t("weeklyLedger.nav.prev")} className="transition-opacity hover:opacity-70">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
              <span>{rangeLabel}</span>
              {nextIsClosed ? (
                <Link href={`/app/weekly/${nextWeek}`} aria-label={t("weeklyLedger.nav.next")} className="transition-opacity hover:opacity-70">
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </Link>
              ) : (
                <ArrowRight className="h-3.5 w-3.5 opacity-25" strokeWidth={2.5} />
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="mt-6 space-y-3 animate-pulse" aria-label={t("weeklyLedger.loading")}>
              <div className="h-10 w-3/4 rounded-full" style={{ background: "color-mix(in srgb, var(--app-text-muted) 14%, transparent)" }} />
              <div className="h-4 w-1/2 rounded-full" style={{ background: "color-mix(in srgb, var(--app-text-muted) 10%, transparent)" }} />
            </div>
          ) : null}

          {report && archetypeKey ? (
            <StaggerReveal>
              <Reveal>
                <h1
                  className="mt-5 bg-clip-text text-4xl font-black leading-[1.05] tracking-[-0.04em] text-transparent sm:text-5xl"
                  style={{ backgroundImage: "linear-gradient(105deg, var(--app-text-primary) 55%, var(--wl-accent))" }}
                >
                  {archetypeTitle}
                </h1>
              </Reveal>
              <Reveal>
                <p className="mt-3 max-w-[46ch] text-base font-semibold leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
                  {t(`${archetypeKey}.line`)}
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--app-text-muted)" }}>
                  {t("weeklyLedger.closed")}
                </p>
              </Reveal>
            </StaggerReveal>
          ) : null}
        </header>

        {/* Locked / empty / error states */}
        {!isLoading && data?.locked ? (
          <div className="mt-10 border-t pt-6" style={{ borderColor: "var(--app-border)" }}>
            <h1 className="text-2xl font-black tracking-[-0.02em]" style={{ color: "var(--app-text-primary)" }}>
              {t("weeklyLedger.locked.title", { level: data.requiredLevel ?? 15 })}
            </h1>
            <p className="mt-3 max-w-[52ch] text-base font-semibold leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
              {t("weeklyLedger.locked.body", { level: data.requiredLevel ?? 15, current: data.accountLevel ?? 1 })}
            </p>
            <Link href="/app/rewards/journey" className="mt-4 inline-flex items-center gap-1.5 text-sm font-black" style={{ color: "var(--wl-accent)" }}>
              {t("weeklyLedger.locked.cta")}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        ) : null}

        {!isLoading && !data?.locked && (data?.empty || (!report && !isError)) ? (
          <div className="mt-10 border-t pt-6" style={{ borderColor: "var(--app-border)" }}>
            <h1 className="text-2xl font-black tracking-[-0.02em]" style={{ color: "var(--app-text-primary)" }}>{t("weeklyLedger.empty.title")}</h1>
            <p className="mt-3 max-w-[52ch] text-base font-semibold leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>{t("weeklyLedger.empty.body")}</p>
          </div>
        ) : null}

        {isError ? (
          <p className="mt-10 text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>{t("weeklyLedger.error")}</p>
        ) : null}

        {/* The document */}
        {report ? (
          <div className="mt-10 space-y-10">
            {report.mode === "single" ? (
              <>
                <SingleReceiptSection report={report} locale={locale} t={t} />
                <RewardsSection report={report} t={t} index="02" />
                <OutlookSection report={report} locale={locale} t={t} index="03" />
              </>
            ) : (
              (() => {
                // Sections appear only when their data exists — number them in
                // render order so the document never shows a gap in the count.
                const visible = {
                  volume: true,
                  entries: (report.entries?.length ?? 0) >= 2,
                  reveal: report.hiddenTotal > 0 && report.hiddenShare != null,
                  moment: !!report.biggestReceipt && report.receiptCount >= 2,
                  wildcard: !!report.wildcard,
                  items: (report.topItems?.length ?? 0) > 0 && report.receiptCount >= 2,
                  rewards: report.points > 0 || report.seasonXpGained > 0 || report.questsCompleted > 0,
                  outlook: !!report.forecast,
                };
                let n = 0;
                const next = (on: boolean) => (on ? String(++n).padStart(2, "0") : "");
                const idx = {
                  volume: next(visible.volume),
                  entries: next(visible.entries),
                  reveal: next(visible.reveal),
                  moment: next(visible.moment),
                  wildcard: next(visible.wildcard),
                  items: next(visible.items),
                  rewards: next(visible.rewards),
                  outlook: next(visible.outlook),
                };
                return (
                  <>
                    <VolumeSection report={report} locale={locale} t={t} index={idx.volume} />
                    <EntriesSection report={report} locale={locale} t={t} index={idx.entries} />
                    <RevealSection report={report} locale={locale} t={t} index={idx.reveal} />
                    <MomentSection report={report} locale={locale} t={t} index={idx.moment} />
                    <WildcardSection report={report} locale={locale} t={t} index={idx.wildcard} />
                    <ItemsSection report={report} locale={locale} t={t} index={idx.items} />
                    <RewardsSection report={report} t={t} index={idx.rewards} />
                    <OutlookSection report={report} locale={locale} t={t} index={idx.outlook} />
                  </>
                );
              })()
            )}
          </div>
        ) : null}
      </article>
    </AppShell>
  );
}
