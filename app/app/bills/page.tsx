"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SERVICE_PROVIDER_CATEGORIES,
  type ServiceProvider,
  type ServiceProviderCategory,
  type UpcomingPayment,
} from "@/lib/service-providers/types";
import { CATEGORY_COLOR, CATEGORY_ICON } from "@/lib/service-providers/icons";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { currencyForCountry, formatMoney } from "@/lib/format/money";
import { AppShell } from "@/components/app/app-shell";
import { PushOptInBanner } from "@/components/app/push-opt-in-banner";

/* ─────────────────────────────────────────────── */
/*  Categories — bill vs subscription split        */
/* ─────────────────────────────────────────────── */

const SUBSCRIPTION_CATEGORIES: readonly ServiceProviderCategory[] = [
  "streaming",
  "entertainment",
  "digital_subscription",
] as const;

const BILL_CATEGORIES: readonly ServiceProviderCategory[] =
  SERVICE_PROVIDER_CATEGORIES.filter(
    (c): c is ServiceProviderCategory =>
      !(SUBSCRIPTION_CATEGORIES as readonly string[]).includes(c)
  );

type Tab = "bills" | "subscriptions";

function categoriesForTab(tab: Tab): readonly ServiceProviderCategory[] {
  return tab === "subscriptions" ? SUBSCRIPTION_CATEGORIES : BILL_CATEGORIES;
}

function tabForCategory(category: ServiceProviderCategory): Tab {
  return (SUBSCRIPTION_CATEGORIES as readonly string[]).includes(category)
    ? "subscriptions"
    : "bills";
}

/* ─────────────────────────────────────────────── */
/*  Fetch helpers                                  */
/* ─────────────────────────────────────────────── */

async function fetchProviders(): Promise<ServiceProvider[]> {
  const res = await fetch("/api/service-providers", { credentials: "include" });
  if (!res.ok) throw new Error("providers_failed");
  const data = await res.json();
  return Array.isArray(data.providers) ? data.providers : [];
}

async function fetchUpcoming(days: number): Promise<UpcomingPayment[]> {
  const res = await fetch(`/api/service-providers/upcoming?within=${days}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("upcoming_failed");
  const data = await res.json();
  return Array.isArray(data.upcoming) ? data.upcoming : [];
}

async function createProvider(input: {
  category: ServiceProviderCategory;
  name: string;
  paymentDay: number;
  reminderDaysBefore: number[];
  reminderSameDay: boolean;
  reminderHour: number;
  expectedAmount: number | null;
}): Promise<ServiceProvider> {
  const res = await fetch("/api/service-providers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "create_failed");
  }
  const data = await res.json();
  return data.provider as ServiceProvider;
}

const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

async function resizeForBillUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 1.5 * 1024 * 1024) return file;
  try {
    const { resizeImageIfNeeded } = await import("@/lib/utils/client-resize-image");
    return await resizeImageIfNeeded(file);
  } catch {
    return file;
  }
}

async function uploadProviderExampleDocument(
  providerId: number,
  file: File
): Promise<{ analyzed?: boolean }> {
  const resized = await resizeForBillUpload(file);
  if (resized.size > MAX_UPLOAD_BYTES) {
    throw new Error("dosya_cok_buyuk_4_5mb");
  }
  const fd = new FormData();
  fd.append("file", resized);
  const res = await fetch(`/api/service-providers/${providerId}/upload-bill`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.error) throw new Error(body.error);
    if (res.status === 413) throw new Error("dosya_cok_buyuk_4_5mb");
    throw new Error(`sample_upload_failed_${res.status}`);
  }
  return res.json();
}

/* ─────────────────────────────────────────────── */
/*  Helpers                                        */
/* ─────────────────────────────────────────────── */

function daysUntil(target: string): number {
  const t = new Date(target).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((t - now) / (1000 * 60 * 60 * 24)));
}

function nextPaymentDate(paymentDay: number): Date {
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth(), paymentDay);
  if (next.getTime() < today.getTime()) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

function formatShortDate(date: Date, locale = "tr-TR"): string {
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
}

type Urgency = "soon" | "warn" | "calm";
function urgencyFor(days: number): Urgency {
  if (days <= 2) return "soon";
  if (days <= 7) return "warn";
  return "calm";
}
/* Apple-Wallet-style card surfaces — each category has a deep base + accent ramp.
 * Cards render as filled gradient panels (not flat cards), giving each provider its
 * own physical-card identity. Text always sits on the deep base for AAA contrast.
 */
type CardSurface = {
  base: string;        // gradient stops for the panel itself
  edge: string;        // border color
  accentSoft: string;  // soft top-right glow color
  ink: string;         // primary text color on panel
  inkMuted: string;    // muted text on panel
  accent: string;      // hero/icon highlight
};
const CARD_SURFACE: Record<ServiceProviderCategory, CardSurface> = {
  electricity: {
    base: "linear-gradient(140deg, #2A1F0F 0%, #1B160E 55%, #14110A 100%)",
    edge: "rgba(250,199,117,0.22)",
    accentSoft: "rgba(250,199,117,0.32)",
    ink: "#FBEFD5",
    inkMuted: "#A89476",
    accent: "#FAC775",
  },
  water: {
    base: "linear-gradient(140deg, #0F1F2A 0%, #0D1820 55%, #0A1318 100%)",
    edge: "rgba(133,183,235,0.20)",
    accentSoft: "rgba(56,138,221,0.32)",
    ink: "#E2EEFA",
    inkMuted: "#7E9CB8",
    accent: "#85B7EB",
  },
  gas: {
    base: "linear-gradient(140deg, #2A150F 0%, #1F100C 55%, #15090A 100%)",
    edge: "rgba(255,138,107,0.22)",
    accentSoft: "rgba(232,90,60,0.32)",
    ink: "#FBE6DE",
    inkMuted: "#B58A7C",
    accent: "#FF8A6B",
  },
  phone: {
    base: "linear-gradient(140deg, #1E1E1F 0%, #161617 55%, #101012 100%)",
    edge: "rgba(180,178,169,0.18)",
    accentSoft: "rgba(180,178,169,0.20)",
    ink: "var(--app-text-primary)",
    inkMuted: "var(--app-text-muted)",
    accent: "#C5C3BB",
  },
  internet: {
    base: "linear-gradient(140deg, #102023 0%, #0D181B 55%, #091113 100%)",
    edge: "rgba(130,173,179,0.22)",
    accentSoft: "rgba(94,138,144,0.32)",
    ink: "#E2EFEF",
    inkMuted: "#85A1A4",
    accent: "#82ADB3",
  },
  streaming: {
    base: "linear-gradient(140deg, #271320 0%, #1B0F18 55%, #130A11 100%)",
    edge: "rgba(237,147,177,0.22)",
    accentSoft: "rgba(212,83,126,0.32)",
    ink: "#FBE5EE",
    inkMuted: "#B68498",
    accent: "#ED93B1",
  },
  entertainment: {
    base: "linear-gradient(140deg, #1B1A2D 0%, #131322 55%, #0D0D18 100%)",
    edge: "rgba(175,169,236,0.20)",
    accentSoft: "rgba(127,119,221,0.30)",
    ink: "#ECEAFB",
    inkMuted: "#8E89B9",
    accent: "#AFA9EC",
  },
  digital_subscription: {
    base: "linear-gradient(140deg, #15201A 0%, #101813 55%, #0B110E 100%)",
    edge: "rgba(151,196,89,0.22)",
    accentSoft: "rgba(99,153,34,0.32)",
    ink: "#EAF3DE",
    inkMuted: "#849B6C",
    accent: "#97C459",
  },
  other: {
    base: "linear-gradient(140deg, var(--app-bg-elevated) 0%, var(--app-bg-elevated) 55%, var(--app-bg-base) 100%)",
    edge: "rgba(255,255,255,0.10)",
    accentSoft: "rgba(255,255,255,0.10)",
    ink: "var(--app-text-primary)",
    inkMuted: "var(--app-text-muted)",
    accent: "var(--app-text-secondary)",
  },
};

const URGENCY_TOKEN: Record<Urgency, { text: string; ring: string; bg: string; label: string }> = {
  soon: {
    text: "#FF8A6B",
    ring: "rgba(232,90,60,0.35)",
    bg: "rgba(232,90,60,0.14)",
    label: "#FFB196",
  },
  warn: {
    text: "#FAC775",
    ring: "rgba(250,199,117,0.3)",
    bg: "rgba(250,199,117,0.11)",
    label: "#FFD89A",
  },
  calm: {
    text: "#9C9890",
    ring: "rgba(255,255,255,0.08)",
    bg: "rgba(255,255,255,0.04)",
    label: "var(--app-text-secondary)",
  },
};

// Safe translation with sane fallback when key is missing.
function withFallback(
  t: (key: string, params?: Record<string, string | number>) => string,
  key: string,
  fallback: string,
  params?: Record<string, string | number>
): string {
  const v = t(key, params);
  // Our t() returns the raw key when missing; treat that as missing.
  if (v === key) {
    if (params) {
      let r = fallback;
      Object.entries(params).forEach(([k, val]) => {
        r = r.replace(`{${k}}`, String(val));
      });
      return r;
    }
    return fallback;
  }
  return v;
}

/* ─────────────────────────────────────────────── */
/*  Page                                           */
/* ─────────────────────────────────────────────── */

export default function BillsPage() {
  const { t, locale } = useAppLocale();
  const { profile } = useAppProfile();
  const country = profile?.country ?? null;
  const { currency, symbol: currencySymbol } = currencyForCountry(country);
  const fmt = useCallback(
    (amount: number, opts?: Parameters<typeof formatMoney>[3]) =>
      formatMoney(amount, currency, locale, opts),
    [currency, locale]
  );
  const [tab, setTab] = useState<Tab>("bills");
  const [showAdd, setShowAdd] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const queryClient = useQueryClient();

  const requestPushPrompt = useCallback(() => {
    setShowPushPrompt(true);
  }, []);

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["service-providers"],
    queryFn: fetchProviders,
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["service-providers-upcoming", 7],
    queryFn: () => fetchUpcoming(7),
  });

  const billProviders = useMemo(
    () => providers.filter((p) => tabForCategory(p.category) === "bills"),
    [providers]
  );
  const subscriptionProviders = useMemo(
    () => providers.filter((p) => tabForCategory(p.category) === "subscriptions"),
    [providers]
  );

  const visibleProviders = tab === "subscriptions" ? subscriptionProviders : billProviders;

  // ───────── Hero metrics — split into paid / pending / next ─────────
  const heroStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    ).getTime();

    const pool = tab === "subscriptions" ? subscriptionProviders : billProviders;

    let paidCount = 0;
    let paidAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let nextProvider: { name: string; date: Date } | null = null;

    for (const p of pool) {
      const expected = p.expectedAmount ?? 0;
      const lastPaid = p.lastPaidAt ? new Date(p.lastPaidAt).getTime() : null;
      const paidThisMonth =
        lastPaid !== null && lastPaid >= monthStart && lastPaid <= monthEnd;

      if (paidThisMonth) {
        paidCount += 1;
        paidAmount += expected;
      } else {
        pendingCount += 1;
        pendingAmount += expected;
      }

      const next = nextPaymentDate(p.paymentDay);
      if (!nextProvider || next.getTime() < nextProvider.date.getTime()) {
        nextProvider = { name: p.name, date: next };
      }
    }

    return {
      paidCount,
      paidAmount,
      pendingCount,
      pendingAmount,
      totalCount: pool.length,
      nextProvider,
    };
  }, [tab, billProviders, subscriptionProviders]);

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["service-providers"] });
    queryClient.invalidateQueries({ queryKey: ["service-providers-upcoming", 7] });
    setShowAdd(false);
    requestPushPrompt();
  };

  const tx = (k: string, fb: string, p?: Record<string, string | number>) =>
    withFallback(t, k, fb, p);

  return (
    <AppShell topbarShowBack className="!p-0">
      {/* ───────── Ambient background glow ───────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(232,90,60,0.18) 0%, rgba(250,199,117,0.06) 35%, rgba(11,11,13,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -left-32 top-40 z-0 h-[360px] w-[360px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(250,199,117,0.10) 0%, rgba(11,11,13,0) 65%)",
          filter: "blur(20px)",
        }}
      />

      {/* ───────── Page header (under the app topbar) ───────── */}
      <header
        className="relative z-30 border-b border-white/[0.05]"
        style={{
          background: "var(--app-nav-bg)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
        }}
      >
        <div className="relative mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[13px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(232,90,60,0.28) 0%, rgba(250,199,117,0.14) 100%)",
                border: "1px solid rgba(250,199,117,0.32)",
                boxShadow:
                  "0 8px 22px rgba(232,90,60,0.18), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <Wallet size={17} stroke="#FAC775" strokeWidth={2} />
              <div
                aria-hidden
                className="absolute inset-0 rounded-[13px] opacity-60"
                style={{
                  background:
                    "radial-gradient(80% 80% at 30% 20%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 60%)",
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] font-semibold leading-tight tracking-[-0.015em] text-[var(--app-text-primary)]">
                {tx("bills.title", "Faturalarım")}
              </h1>
              <p className="mt-0.5 truncate text-[11.5px] text-[var(--app-text-muted)]">
                {tx("bills.headerSubtitle", "{count} takipte · fatura ve üyelik", {
                  count: providers.length,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="relative mx-auto max-w-3xl px-4 pb-3.5 sm:px-6">
          <SegmentedTabs
            tab={tab}
            onChange={setTab}
            billsCount={billProviders.length}
            subsCount={subscriptionProviders.length}
            billsLabel={tx("bills.tabBills", "Faturalar")}
            subsLabel={tx("bills.tabSubscriptions", "Üyelikler")}
          />
        </div>
      </header>

      {/* ───────── Main ───────── */}
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-5 sm:px-6">
        {/* Hero summary */}
        <HeroSummary
          stats={heroStats}
          tab={tab}
          tx={tx}
          locale={locale}
          currencySymbol={currencySymbol}
          fmt={fmt}
        />

        {/* Upcoming payments */}
        {tab === "bills" && upcoming.length > 0 && (
          <section
            className="mb-6 overflow-hidden rounded-[18px] border border-[#E85A3C]/22"
            style={{
              background:
                "linear-gradient(135deg, rgba(232,90,60,0.10) 0%, rgba(250,199,117,0.04) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px rgba(232,90,60,0.08)",
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E85A3C]/15 px-5 py-3">
              <div className="flex items-center gap-2">
                <div
                  className="grid h-7 w-7 place-items-center rounded-full"
                  style={{
                    background: "rgba(232,90,60,0.18)",
                    border: "1px solid rgba(232,90,60,0.3)",
                  }}
                >
                  <CalendarClock size={13} className="text-[#FF8A6B]" strokeWidth={2.2} />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#FFB196]">
                  {tx("bills.upcomingTitle", "Yaklaşan — 7 gün")}
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#FFD89A]"
                style={{
                  background: "rgba(250,199,117,0.10)",
                  border: "1px solid rgba(250,199,117,0.24)",
                }}
              >
                <Bell size={10} strokeWidth={2.4} />
                {tx("bills.reminderActive", "Hatırlatıcı aktif")}
              </span>
            </div>
            <div className="divide-y divide-[#E85A3C]/10">
              {upcoming.slice(0, 4).map((p) => {
                const days = daysUntil(p.dueDate);
                const u = urgencyFor(days);
                const tok = URGENCY_TOKEN[u];
                const dateStr = formatShortDate(new Date(p.dueDate), locale);
                return (
                  <div
                    key={p.providerId}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[var(--app-text-primary)]">
                        {p.name}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--app-text-muted)]">
                        {tx(
                          `bills.categoryLabel.${p.category}`,
                          p.category
                        )}{" "}
                        · {dateStr}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                        style={{
                          color: tok.label,
                          background: tok.bg,
                          border: `1px solid ${tok.ring}`,
                        }}
                      >
                        {days === 0
                          ? tx("bills.today", "Bugün")
                          : tx("bills.daysShort", "{days} gün", { days })}
                      </span>
                      <div
                        className="text-[14px] font-semibold tabular-nums"
                        style={{ color: tok.text }}
                      >
                        {p.expectedAmount != null
                          ? `≈${fmt(p.expectedAmount)}`
                          : "~"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section header */}
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[1.6px] text-[var(--app-text-muted)]">
              {tab === "subscriptions"
                ? tx("bills.allSubscriptions", "Tüm üyelikler")
                : tx("bills.allProviders", "Tüm sağlayıcılar")}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">
              {visibleProviders.length}{" "}
              {tab === "subscriptions"
                ? tx("bills.itemSubscription", "üyelik")
                : tx("bills.itemBill", "fatura")}
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11.5px] font-semibold text-white transition-all active:scale-[0.97]"
            style={{
              background:
                "linear-gradient(135deg, #E85A3C 0%, #FF6B47 60%, #FAC775 200%)",
              boxShadow:
                "0 8px 22px rgba(232,90,60,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <Plus size={13} strokeWidth={2.6} className="transition-transform group-hover:rotate-90" />
            {tab === "subscriptions"
              ? tx("bills.addSubscription", "Ekle")
              : tx("bills.add", "Ekle")}
          </button>
        </div>

        {loadingProviders ? (
          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#FAC775]" />
            <div className="text-[12.5px] text-[var(--app-text-muted)]">
              {tx("bills.loading", "Yükleniyor…")}
            </div>
          </div>
        ) : visibleProviders.length === 0 ? (
          <EmptyState tab={tab} onAdd={() => setShowAdd(true)} tx={tx} />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visibleProviders.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                tx={tx}
                locale={locale}
                currencySymbol={currencySymbol}
                fmt={fmt}
                onBillUploaded={requestPushPrompt}
              />
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <AddProviderSheet
          defaultTab={tab}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
          tx={tx}
          currencySymbol={currencySymbol}
          fmt={fmt}
        />
      )}

      <PushOptInBanner
        open={showPushPrompt}
        onDismiss={() => setShowPushPrompt(false)}
        onSubscribed={() => setShowPushPrompt(false)}
      />
    </AppShell>
  );
}

/* ─────────────────────────────────────────────── */
/*  Segmented tabs                                 */
/* ─────────────────────────────────────────────── */

function SegmentedTabs({
  tab,
  onChange,
  billsCount,
  subsCount,
  billsLabel,
  subsLabel,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  billsCount: number;
  subsCount: number;
  billsLabel: string;
  subsLabel: string;
}) {
  return (
    <div
      className="relative grid grid-cols-2 gap-1 rounded-full p-1"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 1px rgba(0,0,0,0.18)",
      }}
    >
      <SegmentButton
        active={tab === "bills"}
        onClick={() => onChange("bills")}
        icon={<Receipt size={13} strokeWidth={2.4} />}
        label={billsLabel}
        count={billsCount}
      />
      <SegmentButton
        active={tab === "subscriptions"}
        onClick={() => onChange("subscriptions")}
        icon={<Sparkles size={13} strokeWidth={2.4} />}
        label={subsLabel}
        count={subsCount}
      />
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition-all"
      style={
        active
          ? {
              background: "linear-gradient(180deg, #FBEFD5 0%, #F5F1E8 100%)",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
              color: "#1A1A1C",
            }
          : { color: "var(--app-text-secondary)" }
      }
    >
      {icon}
      <span>{label}</span>
      <span
        className="ml-0.5 min-w-[20px] rounded-full px-1.5 text-center text-[10px] font-bold tabular-nums"
        style={
          active
            ? { background: "rgba(11,11,13,0.16)", color: "#1A1A1C" }
            : { background: "rgba(255,255,255,0.08)", color: "var(--app-text-secondary)" }
        }
      >
        {count}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────── */
/*  Hero summary                                   */
/* ─────────────────────────────────────────────── */

type HeroStats = {
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  totalCount: number;
  nextProvider: { name: string; date: Date } | null;
};

function HeroSummary({
  stats,
  tab,
  tx,
  locale,
  currencySymbol,
  fmt,
}: {
  stats: HeroStats;
  tab: Tab;
  tx: (k: string, fb: string, p?: Record<string, string | number>) => string;
  locale: string;
  currencySymbol: string;
  fmt: (amount: number, opts?: { maximumFractionDigits?: number }) => string;
}) {
  // Intl tag for the user's app locale — needed for the big "1.234" readout
  // that intentionally renders without a currency symbol (the symbol sits in
  // its own visual slot to keep the typography hierarchy).
  const intlLocale =
    ({ en: "en-US", tr: "tr-TR", ru: "ru-RU", th: "th-TH", es: "es-ES", zh: "zh-CN" } as Record<string, string>)[locale] ??
    "en-US";
  const { paidCount, paidAmount, pendingCount, pendingAmount, totalCount, nextProvider } = stats;
  const hasAny = totalCount > 0;
  const progressPct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const nextDays = nextProvider ? daysUntil(nextProvider.date.toISOString()) : null;
  const nextDateStr = nextProvider ? formatShortDate(nextProvider.date, locale) : null;

  if (!hasAny) {
    return (
      <section className="relative mb-7 px-2 pt-3">
        <div className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--app-text-muted)]">
          {tab === "subscriptions"
            ? tx("bills.heroSubsTitle", "Üyelikler")
            : tx("bills.heroTitle", "Bu ayki durum")}
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-text-secondary)]">
          {tx(
            "bills.heroEmpty",
            "İlk kaydını ekleyince burada ödeme durumunu göstereyim."
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="relative mb-7 px-2 pt-2">
      {/* Tiny eyebrow label */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[2px] text-[var(--app-text-muted)]">
          {tab === "subscriptions"
            ? tx("bills.heroSubsTitle", "Üyelikler")
            : tx("bills.heroTitle", "Bu ayki durum")}
        </div>
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10.5px] font-semibold tabular-nums"
          style={{
            color: paidCount === totalCount ? "var(--app-success-text)" : "var(--app-warn-text)",
            background:
              paidCount === totalCount
                ? "rgba(34,197,94,0.10)"
                : "rgba(250,199,117,0.08)",
            border: `1px solid ${
              paidCount === totalCount
                ? "rgba(134,239,172,0.28)"
                : "rgba(250,199,117,0.24)"
            }`,
          }}
        >
          <Check size={10} strokeWidth={2.6} />
          {tx("bills.heroProgress", "{paid} / {total} ödendi", {
            paid: paidCount,
            total: totalCount,
          })}
        </div>
      </div>

      {/* Devasa rakam */}
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-[56px] font-semibold leading-none tracking-[-0.035em] text-[var(--app-text-primary)]"
          style={{ textShadow: "0 4px 24px rgba(250,199,117,0.16)" }}
        >
          {pendingAmount > 0
            ? pendingAmount.toLocaleString(intlLocale, { maximumFractionDigits: 0 })
            : pendingCount === 0
              ? "0"
              : "—"}
        </span>
        <span className="text-[20px] font-medium text-[#FAC775]/85">
          {currencySymbol}
        </span>
      </div>

      {/* Status line */}
      <div className="mt-1.5 text-[12.5px] font-medium text-[var(--app-text-muted)]">
        {pendingCount === 0
          ? tx("bills.heroAllPaid", "bu ay her şey ödendi 🎉")
          : pendingAmount > 0
            ? tx("bills.heroPendingLabel", "bekleyen · {count} fatura", {
                count: pendingCount,
              })
            : tx("bills.heroPendingNoAmount", "{count} fatura bekliyor", {
                count: pendingCount,
              })}
      </div>

      {/* Slim progress + meta */}
      <div className="mt-5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background:
                "linear-gradient(90deg, #22C55E 0%, #4ADE80 60%, #86EFAC 100%)",
              boxShadow: "0 0 10px rgba(74,222,128,0.45)",
            }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 text-[var(--app-success-text)]">
            <Check size={11} strokeWidth={2.6} />
            <span className="font-medium">
              {tx("bills.heroPaidLabel", "Bu ay ödendi")}
            </span>
            <span className="tabular-nums font-semibold">
              {paidAmount > 0 ? fmt(paidAmount) : `${paidCount}`}
            </span>
          </div>
          {nextProvider && nextDateStr && (
            <div className="flex items-center gap-1.5 text-[var(--app-text-secondary)]">
              <CalendarClock size={11} strokeWidth={2.2} className="text-[var(--app-text-muted)]" />
              <span>
                {nextProvider.name} ·{" "}
                <span
                  style={{
                    color:
                      nextDays != null && nextDays <= 2
                        ? "#FF8A6B"
                        : nextDays != null && nextDays <= 7
                          ? "#FAC775"
                          : "var(--app-text-secondary)",
                  }}
                  className="font-semibold tabular-nums"
                >
                  {nextDays === 0
                    ? tx("bills.today", "Bugün")
                    : `${nextDateStr} · ${nextDays}${tx("bills.dayLetter", "g")}`}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle divider */}
      <div
        aria-hidden
        className="mt-6 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
        }}
      />
    </section>
  );
}

function HeroMetric({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "warm" | "amber" | "good" | "muted";
}) {
  const accent =
    tone === "warm"
      ? "#FF8A6B"
      : tone === "amber"
      ? "#FAC775"
      : tone === "good"
      ? "var(--app-success-text)"
      : "var(--app-text-primary)";
  return (
    <div
      className="rounded-[12px] border border-white/[0.05] px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.025)",
      }}
    >
      <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[1.3px] text-[var(--app-text-muted)]">
        <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div
        className="mt-0.5 text-[15px] font-semibold leading-tight tabular-nums tracking-[-0.015em]"
        style={{ color: accent }}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 truncate text-[10.5px] text-[var(--app-text-muted)]">{sub}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Empty state                                    */
/* ─────────────────────────────────────────────── */

function EmptyState({
  tab,
  onAdd,
  tx,
}: {
  tab: Tab;
  onAdd: () => void;
  tx: (k: string, fb: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-white/[0.06] p-10 text-center"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-2 h-40 w-40 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(250,199,117,0.18) 0%, rgba(250,199,117,0) 65%)",
          filter: "blur(8px)",
        }}
      />
      <div className="relative">
        <div
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[18px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(232,90,60,0.20) 0%, rgba(250,199,117,0.08) 100%)",
            border: "1px solid rgba(250,199,117,0.22)",
            boxShadow:
              "0 12px 30px rgba(232,90,60,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {tab === "subscriptions" ? (
            <Sparkles size={20} className="text-[#FAC775]" strokeWidth={2} />
          ) : (
            <Receipt size={20} className="text-[#FAC775]" strokeWidth={2} />
          )}
        </div>
        <p className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--app-text-primary)]">
          {tab === "subscriptions"
            ? tx("bills.emptySubscriptions", "Henüz üyelik yok")
            : tx("bills.empty", "Henüz sağlayıcı yok")}
        </p>
        <p className="mx-auto mt-1.5 max-w-[300px] text-[12px] leading-relaxed text-[var(--app-text-muted)]">
          {tab === "subscriptions"
            ? tx(
                "bills.emptySubscriptionsDesc",
                "Netflix, Spotify ya da herhangi bir dijital üyeliğini ekle, hepsini tek yerde tut."
              )
            : tx(
                "bills.emptyDesc",
                "Faturalarını ekle, vakti gelince hatırlatırım."
              )}
        </p>
        <button
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white transition-transform active:scale-[0.97]"
          style={{
            background:
              "linear-gradient(135deg, #E85A3C 0%, #FF6B47 60%, #FAC775 200%)",
            boxShadow:
              "0 10px 28px rgba(232,90,60,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          <Plus size={13} strokeWidth={2.6} />
          {tab === "subscriptions"
            ? tx("bills.emptyAddSubscription", "İlk üyeliğini ekle")
            : tx("bills.emptyAdd", "İlk sağlayıcını ekle")}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Provider card                                  */
/* ─────────────────────────────────────────────── */

/* ─────────────────────────────────────────────── */
/*  Card popover — theme-aware, no Radix dropdown  */
/* ─────────────────────────────────────────────── */

/**
 * Portal-rendered popover anchored to a trigger element.
 *
 * Why a portal: ProviderCards use `overflow:hidden` for their gradient/glow
 * containment, which clips any absolutely-positioned dropdown inside them.
 * Rendering into document.body breaks out of every parent overflow + z-index
 * stacking context, so the menu always sits on top regardless of sibling cards.
 */
function CardPopover({
  open,
  onClose,
  anchorRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const POPOVER_WIDTH = 220;
  const POPOVER_GAP = 8;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const compute = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Anchor right edge of popover to right edge of trigger,
      // but clamp to viewport so it never overflows on the right.
      const desiredLeft = rect.right - POPOVER_WIDTH;
      const left = Math.max(
        12,
        Math.min(window.innerWidth - POPOVER_WIDTH - 12, desiredLeft)
      );
      const top = rect.bottom + POPOVER_GAP;
      setPos({ top, left });
    };

    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted || !pos) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed overflow-hidden rounded-[14px]"
        style={{
          top: pos.top,
          left: pos.left,
          width: POPOVER_WIDTH,
          zIndex: 9999,
          background: "linear-gradient(180deg, var(--app-bg-surface) 0%, var(--app-bg-elevated) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.04) inset",
        }}
        onClick={(e) => e.stopPropagation()}
        role="menu"
      >
        {children}
      </div>
    </>,
    document.body
  );
}

function PopoverItem({
  icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  const color = tone === "danger" ? "#FF8A6B" : "var(--app-text-primary)";
  const hover =
    tone === "danger" ? "rgba(232,90,60,0.12)" : "rgba(255,255,255,0.06)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors"
      style={{ color }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span className="opacity-80">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Generic placeholder names — auto-renamed when OCR finds the real merchant name.
const GENERIC_NAME_PATTERNS = [
  /^elektrik/i,
  /^su/i,
  /^do[gğ]al ?gaz/i,
  /^gaz/i,
  /^telefon/i,
  /^i?nternet/i,
  /^yay[ıi]n/i,
  /^üyelik/i,
  /^fatura/i,
  /^bill/i,
  /^subscription/i,
  /^streaming/i,
  /^other/i,
  /^di[gğ]er/i,
];
function isGenericName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 4) return true;
  return GENERIC_NAME_PATTERNS.some((re) => re.test(trimmed));
}

function ProviderCard({
  provider,
  tx,
  locale,
  currencySymbol,
  fmt,
  onBillUploaded,
}: {
  provider: ServiceProvider;
  tx: (k: string, fb: string, p?: Record<string, string | number>) => string;
  locale: string;
  currencySymbol: string;
  fmt: (amount: number, opts?: { maximumFractionDigits?: number }) => string;
  onBillUploaded?: () => void;
}) {
  const Icon = CATEGORY_ICON[provider.category];
  const surface = CARD_SURFACE[provider.category];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const [justPaid, setJustPaid] = useState(false);
  const [justRenamed, setJustRenamed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  const next = nextPaymentDate(provider.paymentDay);
  const days = daysUntil(next.toISOString());
  const u = urgencyFor(days);
  const tok = URGENCY_TOKEN[u];
  const dateStr = formatShortDate(next, locale);

  // Was this provider paid for the current period already?
  const paidThisPeriod = useMemo(() => {
    if (!provider.lastPaidAt) return false;
    const lastPaid = new Date(provider.lastPaidAt);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return lastPaid.getTime() >= monthStart.getTime();
  }, [provider.lastPaidAt]);

  /* ───────── Mutations ───────── */

  const renameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch(`/api/service-providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("rename_failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      setJustRenamed(true);
      setTimeout(() => setJustRenamed(false), 2400);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (mark: boolean) => {
      const res = await fetch(`/api/service-providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          lastPaidAt: mark ? new Date().toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("mark_paid_failed");
      return res.json();
    },
    onSuccess: (_, mark) => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      queryClient.invalidateQueries({ queryKey: ["service-providers-upcoming", 7] });
      if (mark) {
        setJustPaid(true);
        setTimeout(() => setJustPaid(false), 1400);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/service-providers/${provider.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("delete_failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      queryClient.invalidateQueries({ queryKey: ["service-providers-upcoming", 7] });
      toast.success(tx("bills.deleted", "{name} silindi", { name: provider.name }));
    },
    onError: () => {
      toast.error(tx("bills.deleteFailed", "Silinemedi"));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const resized = await resizeForBillUpload(file);
      if (resized.size > MAX_UPLOAD_BYTES) throw new Error("dosya_cok_buyuk_4_5mb");
      const fd = new FormData();
      fd.append("file", resized);
      const res = await fetch(`/api/service-providers/${provider.id}/upload-bill`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error) throw new Error(body.error);
        if (res.status === 413) throw new Error("dosya_cok_buyuk_4_5mb");
        throw new Error(`upload_failed_${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      queryClient.invalidateQueries({ queryKey: ["service-providers-upcoming", 7] });
      onBillUploaded?.();

      // Auto-rename if OCR found a better merchant name AND current name is generic.
      const merchantName: string | undefined = data?.extracted?.merchantName?.trim();
      if (
        merchantName &&
        merchantName.length >= 3 &&
        merchantName.length <= 60 &&
        isGenericName(provider.name) &&
        merchantName.toLowerCase() !== provider.name.toLowerCase()
      ) {
        renameMutation.mutate(merchantName);
        toast.success(
          tx("bills.providerRenamed", "Sağlayıcı güncellendi: {name}", {
            name: merchantName,
          })
        );
      }
    },
    onError: () => {
      toast.error(tx("bills.uploadFailed", "Yükleme başarısız"));
    },
  });

  const handleUploadClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    event.target.value = "";
  };

  const handleRename = () => {
    const newName = window.prompt(
      tx("bills.renamePrompt", "Yeni sağlayıcı adı"),
      provider.name
    );
    if (newName && newName.trim().length >= 1 && newName.trim() !== provider.name) {
      renameMutation.mutate(newName.trim());
    }
  };

  const categoryLabel = tx(
    `bills.categoryLabel.${provider.category}`,
    provider.category
  );

  return (
    <div
      className="group relative overflow-hidden rounded-[20px] transition-all hover:-translate-y-[2px]"
      style={{
        background: surface.base,
        border: `1px solid ${paidThisPeriod ? "rgba(134,239,172,0.28)" : surface.edge}`,
        boxShadow: paidThisPeriod
          ? "0 20px 40px rgba(0,0,0,0.40), 0 0 0 1px rgba(134,239,172,0.06), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 20px 40px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Top-right accent glow — physical-card identity */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
        style={{
          background: `radial-gradient(circle, ${surface.accentSoft} 0%, transparent 65%)`,
          filter: "blur(2px)",
          opacity: 0.85,
        }}
      />
      {/* Subtle bottom-left fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full"
        style={{
          background: `radial-gradient(circle, ${surface.accentSoft} 0%, transparent 70%)`,
          filter: "blur(8px)",
          opacity: 0.25,
        }}
      />
      {/* Diagonal sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${surface.accent}66 50%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      {justPaid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            animation: "yumoPulse 1.4s ease-out forwards",
            background:
              "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.28) 0%, rgba(34,197,94,0) 70%)",
          }}
        />
      )}
      <style>{`@keyframes yumoPulse { 0% { opacity: 0; transform: scale(0.9); } 30% { opacity: 1; } 100% { opacity: 0; transform: scale(1.05); } }`}</style>

      {/* ───────── Top row: category + amount ───────── */}
      <div className="relative flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]"
            style={{
              background: `${surface.accent}1A`,
              border: `1px solid ${surface.accent}38`,
            }}
          >
            <Icon size={15} stroke={surface.accent} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[1.4px]"
              style={{ color: surface.inkMuted }}
            >
              {categoryLabel}
            </div>
            <div
              className="mt-0.5 text-[10.5px] font-medium"
              style={{ color: surface.inkMuted, opacity: 0.7 }}
            >
              {tx("bills.everyDay", "her ayın {day}'i", {
                day: provider.paymentDay,
              })}
            </div>
          </div>
        </div>

        {/* Big amount */}
        <div className="flex shrink-0 flex-col items-end">
          {provider.expectedAmount != null ? (
            <>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[24px] font-semibold tabular-nums leading-none tracking-[-0.025em]"
                  style={{ color: surface.ink }}
                >
                  {provider.expectedAmount.toLocaleString(locale, {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span
                  className="text-[12px] font-medium"
                  style={{ color: surface.accent, opacity: 0.85 }}
                >
                  {currencySymbol}
                </span>
              </div>
              <div
                className="mt-1 text-[9.5px] font-semibold uppercase tracking-[1.2px]"
                style={{ color: surface.inkMuted, opacity: 0.7 }}
              >
                {tx("bills.estimated", "tahmini")}
              </div>
            </>
          ) : (
            <div
              className="text-[11px] font-medium"
              style={{ color: surface.inkMuted }}
            >
              {tx("bills.noAmount", "tutar yok")}
            </div>
          )}
        </div>
      </div>

      {/* ───────── Middle: provider name ───────── */}
      <div className="relative px-5 pt-4">
        <div className="flex items-center gap-2">
          <div
            className="truncate text-[19px] font-semibold leading-tight tracking-[-0.020em]"
            style={{ color: surface.ink }}
          >
            {provider.name}
          </div>
          {justRenamed && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.5px]"
              style={{
                color: "#86EFAC",
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.32)",
              }}
            >
              <Sparkles size={9} strokeWidth={2.4} />
              {tx("bills.renamedBadge", "güncellendi")}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          {paidThisPeriod ? (
            <>
              <div
                className="grid h-4 w-4 place-items-center rounded-full"
                style={{
                  background: "linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)",
                  boxShadow: "0 2px 6px rgba(34,197,94,0.45)",
                }}
              >
                <Check size={9} className="text-white" strokeWidth={3} />
              </div>
              <span
                className="text-[11.5px] font-medium"
                style={{ color: "#86EFAC" }}
              >
                {tx("bills.paidJustNow", "Ödendi · {date}", { date: dateStr })}
              </span>
            </>
          ) : (
            <>
              <CalendarClock
                size={12}
                strokeWidth={2.2}
                style={{ color: surface.inkMuted, opacity: 0.7 }}
              />
              <span
                className="text-[11.5px] font-medium"
                style={{ color: surface.inkMuted }}
              >
                {tx("bills.nextOn", "Sonraki")} {dateStr}
              </span>
              <span
                className="ml-1 inline-flex items-center rounded-full px-1.5 py-[1px] text-[10px] font-bold tabular-nums"
                style={{
                  color: tok.label,
                  background: tok.bg,
                  border: `1px solid ${tok.ring}`,
                }}
              >
                {days === 0
                  ? tx("bills.today", "Bugün")
                  : tx("bills.daysLeft", "{days}g", { days })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ───────── Bottom: actions bar ───────── */}
      <div
        className="relative mt-4 flex items-center gap-2 px-3 py-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Primary CTA — toggles paid */}
        <button
          type="button"
          onClick={() => markPaidMutation.mutate(!paidThisPeriod)}
          disabled={markPaidMutation.isPending}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-[12px] px-3 py-2.5 text-[12.5px] font-semibold transition-all active:scale-[0.98]"
          )}
          style={
            paidThisPeriod
              ? {
                  color: "#A89476",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }
              : {
                  color: "#0B1A0E",
                  background:
                    "linear-gradient(135deg, #4ADE80 0%, #22C55E 60%, #16A34A 100%)",
                  boxShadow:
                    "0 8px 20px rgba(34,197,94,0.30), inset 0 1px 0 rgba(255,255,255,0.22)",
                }
          }
        >
          {markPaidMutation.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : paidThisPeriod ? (
            <>
              <X size={12} strokeWidth={2.4} />
              {tx("bills.undoPaidShort", "Geri al")}
            </>
          ) : (
            <>
              <Check size={13} strokeWidth={2.8} />
              {tx("bills.markPaid", "Ödendi olarak işaretle")}
            </>
          )}
        </button>

        {/* Upload */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploadMutation.isPending}
          title={tx("bills.uploadBill", "Faturayı yükle")}
          aria-label={tx("bills.uploadBill", "Faturayı yükle")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] transition-all active:scale-[0.94]"
          style={{
            color: surface.ink,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {uploadMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" style={{ color: surface.accent }} />
          ) : (
            <Camera size={15} strokeWidth={2.2} />
          )}
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={tx("bills.menu", "Menü")}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] transition-all active:scale-[0.94]"
            style={{
              color: surface.ink,
              background: menuOpen ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ChevronRight
              size={15}
              strokeWidth={2.2}
              className={cn("transition-transform", menuOpen && "rotate-90")}
            />
          </button>

          <CardPopover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            anchorRef={menuTriggerRef}
          >
            <PopoverItem
              icon={<Pencil size={13} strokeWidth={2.2} />}
              label={tx("bills.editName", "Adı düzenle")}
              onClick={() => {
                setMenuOpen(false);
                handleRename();
              }}
            />
            <PopoverItem
              icon={
                paidThisPeriod ? (
                  <X size={13} strokeWidth={2.2} />
                ) : (
                  <Check size={13} strokeWidth={2.2} />
                )
              }
              label={
                paidThisPeriod
                  ? tx("bills.undoPaid", "Ödendi işaretini kaldır")
                  : tx("bills.markPaid", "Ödendi olarak işaretle")
              }
              onClick={() => {
                setMenuOpen(false);
                markPaidMutation.mutate(!paidThisPeriod);
              }}
            />
            <div
              className="my-1 h-px"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <PopoverItem
              icon={<Trash2 size={13} strokeWidth={2.2} />}
              label={tx("bills.delete", "Sil")}
              tone="danger"
              onClick={() => {
                setMenuOpen(false);
                setConfirmDelete(true);
              }}
            />
          </CardPopover>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-[20px] p-4 text-center"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,11,13,0.94) 0%, rgba(11,11,13,0.97) 100%)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div className="text-[13.5px] font-semibold text-[#F5F1E8]">
            {tx("bills.deleteConfirm", "{name} silinsin mi?", {
              name: provider.name,
            })}
          </div>
          <div className="text-[11px] text-[#8A867E]">
            {tx("bills.deleteConfirmDesc", "Hatırlatıcılar da iptal olur.")}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-[11.5px] font-medium text-[#B5B1A8] hover:bg-white/[0.08]"
            >
              {tx("bills.cancel", "Vazgeç")}
            </button>
            <button
              type="button"
              onClick={() => {
                deleteMutation.mutate();
                setConfirmDelete(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11.5px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #E24B4A 0%, #E85A3C 100%)",
                boxShadow: "0 6px 16px rgba(232,90,60,0.32)",
              }}
            >
              <Trash2 size={12} strokeWidth={2.4} />
              {tx("bills.deleteConfirmYes", "Sil")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Add provider bottom sheet                      */
/* ─────────────────────────────────────────────── */

function AddProviderSheet({
  defaultTab,
  onClose,
  onSaved,
  tx,
  currencySymbol,
  fmt,
}: {
  defaultTab: Tab;
  onClose: () => void;
  onSaved: () => void;
  tx: (k: string, fb: string, p?: Record<string, string | number>) => string;
  currencySymbol: string;
  fmt: (amount: number, opts?: { maximumFractionDigits?: number }) => string;
}) {
  const [category, setCategory] = useState<ServiceProviderCategory | null>(null);
  const [name, setName] = useState("");
  const [paymentDay, setPaymentDay] = useState(15);
  const [reminderT3, setReminderT3] = useState(true);
  const [reminderT1, setReminderT1] = useState(true);
  const [reminderSameDay, setReminderSameDay] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);
  const [expectedAmount, setExpectedAmount] = useState<string>("");
  const [sampleDocument, setSampleDocument] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sampleInputRef = useRef<HTMLInputElement | null>(null);

  const availableCategories = categoriesForTab(defaultTab);

  // Lock body scroll while sheet is open. Without this, mobile Safari lets the
  // underlying page scroll and the sheet's 100dvh container ends up clipped
  // because the layout viewport shifts under it.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Compensate for the scrollbar disappearing so the page doesn't jump.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (input: {
      category: ServiceProviderCategory;
      name: string;
      paymentDay: number;
      reminderDaysBefore: number[];
      reminderSameDay: boolean;
      reminderHour: number;
      expectedAmount: number | null;
    }) => {
      const provider = await createProvider(input);
      if (!sampleDocument) return provider;
      await uploadProviderExampleDocument(provider.id, sampleDocument);
      toast.success(tx("bills.savedWithDoc", "Sağlayıcı kaydedildi, döküman arşivlendi"));
      return provider;
    },
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  });

  const canSubmit = category !== null && name.trim().length >= 1;

  const handleSubmit = () => {
    if (!canSubmit || !category) return;
    setError(null);
    const reminders: number[] = [];
    if (reminderT3) reminders.push(3);
    if (reminderT1) reminders.push(1);
    const expected = expectedAmount.trim() === "" ? null : Number(expectedAmount);
    mutation.mutate({
      category,
      name: name.trim(),
      paymentDay,
      reminderDaysBefore: reminders,
      reminderSameDay,
      reminderHour,
      expectedAmount: Number.isFinite(expected!) ? expected : null,
    });
  };

  const surfacePreview = category ? CARD_SURFACE[category] : null;
  const PreviewIcon = category ? CATEGORY_ICON[category] : null;
  const reminderCount = (reminderT3 ? 1 : 0) + (reminderT1 ? 1 : 0) + (reminderSameDay ? 1 : 0);
  const expectedNum = expectedAmount.trim() === "" ? null : Number(expectedAmount);
  const previewAmount =
    expectedNum != null && Number.isFinite(expectedNum) && expectedNum > 0
      ? expectedNum
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-md sm:p-4"
      onClick={onClose}
      style={{
        // Dynamic viewport height: shrinks with iOS Safari URL bar to prevent clipping
        height: "100dvh",
      }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-white/[0.08] text-[var(--app-text-primary)] shadow-[0_-30px_80px_rgba(0,0,0,0.65)] sm:rounded-[28px]"
        style={{
          background:
            "linear-gradient(180deg, var(--app-bg-elevated) 0%, var(--app-bg-base) 60%, var(--app-bg-base) 100%)",
          // 100dvh follows the visible viewport (URL bar collapse, on-screen keyboard).
          // Cap so it never grows past the screen on desktop either.
          height: "min(94dvh, 880px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ───────── Sticky header ───────── */}
        <div
          className="shrink-0 px-5 pb-3"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          }}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/[0.14]" />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] text-[var(--app-text-secondary)] transition-colors hover:bg-white/[0.10] hover:text-[var(--app-text-primary)]"
              aria-label={tx("bills.closeSheet", "Kapat")}
            >
              <X size={15} />
            </button>
            <div className="text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-[2px] text-[var(--app-text-muted)]">
                {defaultTab === "subscriptions"
                  ? tx("bills.tabSubscriptions", "Üyelikler")
                  : tx("bills.tabBills", "Faturalar")}
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold tracking-[-0.015em] text-[var(--app-text-primary)]">
                {defaultTab === "subscriptions"
                  ? tx("bills.newSubscription", "Yeni Üyelik")
                  : tx("bills.newProvider", "Yeni Sağlayıcı")}
              </div>
            </div>
            <div className="w-9" />
          </div>
        </div>

        {/* ───────── Scrollable body ───────── */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-6"
          style={{
            // Prevent the sheet's scroll from chaining to the page underneath
            // (the page is locked anyway, but this also stops the iOS rubber-band).
            overscrollBehavior: "contain",
            // Tap-and-scroll inertia
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Live Wallet card preview */}
          <PreviewCard
            surface={surfacePreview}
            Icon={PreviewIcon}
            categoryLabel={
              category
                ? tx(`bills.categoryLabel.${category}`, category)
                : tx("bills.choosePlaceholder", "kategori seç")
            }
            name={name.trim() || tx("bills.namePreview", "Sağlayıcı adı")}
            paymentDay={paymentDay}
            amount={previewAmount}
            tx={tx}
            currencySymbol={currencySymbol}
            fmt={fmt}
          />

          {/* ───────── Step 1 — Category ───────── */}
          <StepBlock
            step={1}
            label={tx("bills.stepCategory", "Kategori seç")}
            done={category !== null}
            tx={tx}
          >
            <div className="grid grid-cols-3 gap-2">
              {availableCategories.map((c) => {
                const cs = CARD_SURFACE[c];
                const CIcon = CATEGORY_ICON[c];
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[14px] px-2 py-3 transition-all active:scale-[0.96]"
                    )}
                    style={{
                      background: active ? cs.base : "rgba(255,255,255,0.025)",
                      border: `1px solid ${
                        active ? cs.edge : "rgba(255,255,255,0.06)"
                      }`,
                      boxShadow: active
                        ? `0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`
                        : "none",
                    }}
                  >
                    {active && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${cs.accentSoft} 0%, transparent 65%)`,
                          filter: "blur(4px)",
                        }}
                      />
                    )}
                    <div
                      className="relative grid h-9 w-9 place-items-center rounded-[10px]"
                      style={{
                        background: active ? `${cs.accent}1A` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? `${cs.accent}38` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <CIcon
                        size={16}
                        stroke={active ? cs.accent : "var(--app-text-muted)"}
                        strokeWidth={2.2}
                      />
                    </div>
                    <div
                      className="relative text-center text-[10.5px] font-semibold leading-tight tracking-tight"
                      style={{
                        color: active ? cs.ink : "var(--app-text-secondary)",
                      }}
                    >
                      {tx(`bills.categoryLabel.${c}`, c)}
                    </div>
                  </button>
                );
              })}
            </div>
          </StepBlock>

          {/* ───────── Step 2 — Name ───────── */}
          <StepBlock
            step={2}
            label={tx("bills.stepName", "Sağlayıcı adı")}
            done={name.trim().length >= 1}
            tx={tx}
          >
            <div
              className="relative rounded-[14px] transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  surfacePreview
                    ? surfacePreview.edge
                    : "rgba(255,255,255,0.07)"
                }`,
                boxShadow: name
                  ? `0 0 0 3px ${
                      surfacePreview
                        ? surfacePreview.accent + "18"
                        : "rgba(250,199,117,0.10)"
                    }`
                  : "none",
              }}
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tx("bills.namePlaceholder", "örn. BEDAŞ, Netflix, Spotify…")}
                maxLength={80}
                className="w-full bg-transparent px-4 py-3.5 text-[15px] font-medium tracking-tight text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none"
              />
              {name && (
                <button
                  type="button"
                  onClick={() => setName("")}
                  className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white/[0.06] text-[var(--app-text-muted)] hover:bg-white/[0.10] hover:text-[var(--app-text-primary)]"
                  aria-label={tx("bills.clear", "Temizle")}
                >
                  <X size={12} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </StepBlock>

          {/* ───────── Step 3 — Payment day ───────── */}
          <StepBlock
            step={3}
            label={tx("bills.stepDay", "Ödeme günü")}
            done
            tx={tx}
            hint={tx("bills.paymentDayHint", "Ay 31 günden kısaysa son güne kayar")}
          >
            <DayWheel value={paymentDay} onChange={setPaymentDay} accent={surfacePreview?.accent ?? "#FAC775"} />
          </StepBlock>

          {/* ───────── Step 4 — Amount + Hour ───────── */}
          <StepBlock
            step={4}
            label={tx("bills.stepAmountTime", "Tutar ve saat")}
            done
            tx={tx}
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className="relative rounded-[14px] px-3.5 py-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="text-[9.5px] font-semibold uppercase tracking-[1.4px] text-[var(--app-text-muted)]">
                  {tx("bills.amountSection", "Tahmini tutar")}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-[20px] font-semibold tabular-nums tracking-tight text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none"
                  />
                  <span className="shrink-0 text-[13px] font-medium text-[var(--app-text-muted)]">
                    {currencySymbol}
                  </span>
                </div>
              </div>
              <div
                className="relative rounded-[14px] px-3.5 py-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="text-[9.5px] font-semibold uppercase tracking-[1.4px] text-[var(--app-text-muted)]">
                  {tx("bills.timeSection", "Saat")}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={reminderHour}
                    onChange={(e) => setReminderHour(Number(e.target.value))}
                    className="w-full appearance-none bg-transparent text-[20px] font-semibold tabular-nums tracking-tight text-[var(--app-text-primary)] focus:outline-none"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option
                        key={h}
                        value={h}
                        style={{ background: "var(--app-bg-elevated)", color: "var(--app-text-primary)" }}
                      >
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </StepBlock>

          {/* ───────── Step 5 — Reminders ───────── */}
          <StepBlock
            step={5}
            label={tx("bills.stepReminders", "Hatırlatma")}
            done
            tx={tx}
            hint={
              reminderCount === 0
                ? tx("bills.reminderHintOff", "Hiçbir hatırlatıcı seçilmedi")
                : tx("bills.reminderHintOn", "{n} hatırlatıcı aktif", { n: reminderCount })
            }
          >
            <div className="grid grid-cols-3 gap-2">
              <ReminderPill
                active={reminderT3}
                onClick={() => setReminderT3(!reminderT3)}
                primary={tx("bills.reminder3Short", "3 gün")}
                secondary={tx("bills.before", "önce")}
              />
              <ReminderPill
                active={reminderT1}
                onClick={() => setReminderT1(!reminderT1)}
                primary={tx("bills.reminder1Short", "1 gün")}
                secondary={tx("bills.before", "önce")}
              />
              <ReminderPill
                active={reminderSameDay}
                onClick={() => setReminderSameDay(!reminderSameDay)}
                primary={tx("bills.sameDay", "Aynı gün")}
                secondary={tx("bills.morning", "sabah")}
              />
            </div>
          </StepBlock>

          {/* ───────── Step 6 — Sample doc (optional) ───────── */}
          <StepBlock
            step={6}
            label={tx("bills.stepSample", "Örnek döküman")}
            done
            tx={tx}
            optional
          >
            <input
              ref={sampleInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSampleDocument(file);
                e.target.value = "";
              }}
            />
            {sampleDocument ? (
              <div
                className="flex items-center gap-3 rounded-[14px] px-3.5 py-3"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(250,199,117,0.08) 0%, rgba(250,199,117,0.02) 100%)",
                  border: "1px solid rgba(250,199,117,0.30)",
                }}
              >
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                  style={{
                    background: "rgba(250,199,117,0.14)",
                    border: "1px solid rgba(250,199,117,0.28)",
                  }}
                >
                  <FileText size={14} className="text-[#FAC775]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-[var(--app-text-primary)]">
                    {sampleDocument.name}
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-[var(--app-text-muted)]">
                    {(sampleDocument.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSampleDocument(null)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[#FF8A6B] hover:bg-white/[0.10]"
                  aria-label={tx("bills.sampleRemove", "Kaldır")}
                >
                  <X size={12} strokeWidth={2.4} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => sampleInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed px-3.5 py-3.5 text-[12.5px] font-medium text-[var(--app-text-secondary)] transition-colors hover:bg-white/[0.03] hover:text-[var(--app-text-primary)]"
                style={{ borderColor: "rgba(250,199,117,0.30)" }}
              >
                <FileText size={14} className="text-[#FAC775]" />
                {tx("bills.sampleUpload", "PDF / görsel yükle")}
                <span className="ml-1 text-[10px] text-[var(--app-text-muted)]">
                  ({tx("bills.optional", "opsiyonel")})
                </span>
              </button>
            )}
          </StepBlock>

          {error && (
            <div className="mt-2 rounded-[12px] border border-[#E24B4A]/40 bg-[#E24B4A]/[0.10] px-3.5 py-2.5 text-[11.5px] text-[#F09595]">
              {tx("bills.saveFailed", "Kaydedilemedi: {error}", { error })}
            </div>
          )}
        </div>

        {/* ───────── Sticky footer ───────── */}
        <div
          className="shrink-0 border-t border-white/[0.06] px-5 pt-4"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, var(--app-bg-base) 40%)",
            // Home-bar / gesture indicator on iPhones takes ~34px; respect it.
            paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] border border-white/[0.10] bg-white/[0.04] px-5 py-3.5 text-[12.5px] font-semibold text-[var(--app-text-secondary)] hover:bg-white/[0.08] hover:text-[var(--app-text-primary)]"
            >
              {tx("bills.cancel", "Vazgeç")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || mutation.isPending}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3.5 text-[13px] font-semibold transition-all active:scale-[0.98]",
                canSubmit && !mutation.isPending
                  ? "text-white"
                  : "cursor-not-allowed bg-white/[0.04] text-[var(--app-text-muted)]"
              )}
              style={
                canSubmit && !mutation.isPending
                  ? {
                      background:
                        "linear-gradient(135deg, #E85A3C 0%, #FF6B47 60%, #FAC775 200%)",
                      boxShadow:
                        "0 12px 28px rgba(232,90,60,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                    }
                  : undefined
              }
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {sampleDocument
                    ? tx("bills.savingWithDoc", "Kaydediliyor…")
                    : tx("bills.saving", "Kaydediliyor…")}
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={2.6} />
                  {tx("bills.submit", "Sağlayıcıyı Kaydet")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Add-sheet sub-components                       */
/* ─────────────────────────────────────────────── */

function PreviewCard({
  surface,
  Icon,
  categoryLabel,
  name,
  paymentDay,
  amount,
  tx,
  currencySymbol,
}: {
  surface: CardSurface | null;
  Icon: typeof Wallet | null;
  categoryLabel: string;
  name: string;
  paymentDay: number;
  amount: number | null;
  tx: (k: string, fb: string, p?: Record<string, string | number>) => string;
  currencySymbol: string;
  fmt: (amount: number, opts?: { maximumFractionDigits?: number }) => string;
}) {
  // Neutral preview while no category is selected
  const s: CardSurface =
    surface ?? {
      base: "linear-gradient(140deg, var(--app-bg-elevated) 0%, var(--app-bg-elevated) 55%, var(--app-bg-base) 100%)",
      edge: "rgba(255,255,255,0.10)",
      accentSoft: "rgba(255,255,255,0.10)",
      ink: "var(--app-text-primary)",
      inkMuted: "var(--app-text-muted)",
      accent: "var(--app-text-secondary)",
    };

  const IconComp = Icon ?? Wallet;

  return (
    <div
      className="relative mb-5 mt-1 overflow-hidden rounded-[20px]"
      style={{
        background: s.base,
        border: `1px solid ${s.edge}`,
        boxShadow:
          "0 20px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
        style={{
          background: `radial-gradient(circle, ${s.accentSoft} 0%, transparent 65%)`,
          filter: "blur(2px)",
          opacity: 0.85,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${s.accent}66 50%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      <div className="relative px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-8 w-8 place-items-center rounded-[10px]"
              style={{
                background: `${s.accent}1A`,
                border: `1px solid ${s.accent}38`,
              }}
            >
              <IconComp size={15} stroke={s.accent} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[1.4px]"
                style={{ color: s.inkMuted }}
              >
                {categoryLabel}
              </div>
              <div
                className="mt-0.5 text-[10.5px] font-medium"
                style={{ color: s.inkMuted, opacity: 0.7 }}
              >
                {tx("bills.everyDay", "her ayın {day}'i", { day: paymentDay })}
              </div>
            </div>
          </div>
          {amount != null ? (
            <div className="flex items-baseline gap-1">
              <span
                className="text-[22px] font-semibold tabular-nums leading-none tracking-[-0.025em]"
                style={{ color: s.ink }}
              >
                {amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span
                className="text-[12px] font-medium"
                style={{ color: s.accent, opacity: 0.85 }}
              >
                {currencySymbol}
              </span>
            </div>
          ) : (
            <span
              className="text-[10px] font-medium"
              style={{ color: s.inkMuted, opacity: 0.6 }}
            >
              {tx("bills.noAmountPreview", "tutar yok")}
            </span>
          )}
        </div>
        <div
          className="mt-4 text-[18px] font-semibold leading-tight tracking-[-0.020em]"
          style={{ color: s.ink }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}

function StepBlock({
  step,
  label,
  done,
  optional,
  hint,
  children,
  tx,
}: {
  step: number;
  label: string;
  done: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
  tx: (k: string, fb: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div
          className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold tabular-nums"
          style={
            done
              ? {
                  background:
                    "linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)",
                  color: "#0B1A0E",
                  boxShadow: "0 0 0 1px rgba(34,197,94,0.40)",
                }
              : {
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--app-text-muted)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }
          }
        >
          {done ? <Check size={10} strokeWidth={3} /> : step}
        </div>
        <div className="text-[11.5px] font-semibold uppercase tracking-[1.5px] text-[var(--app-text-secondary)]">
          {label}
        </div>
        {optional && (
          <span className="ml-1 rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.5px] text-[var(--app-text-muted)]">
            {tx("bills.optional", "opsiyonel")}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <div className="mt-2 px-1 text-[10.5px] text-[var(--app-text-muted)]">{hint}</div>
      )}
    </div>
  );
}

function ReminderPill({
  active,
  onClick,
  primary,
  secondary,
}: {
  active: boolean;
  onClick: () => void;
  primary: string;
  secondary: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[14px] py-3 transition-all active:scale-[0.96]"
      style={
        active
          ? {
              background:
                "linear-gradient(140deg, rgba(250,199,117,0.18) 0%, rgba(232,90,60,0.10) 100%)",
              border: "1px solid rgba(250,199,117,0.42)",
              boxShadow:
                "0 8px 20px rgba(250,199,117,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
            }
          : {
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }
      }
    >
      {active && (
        <div
          className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)",
            boxShadow: "0 2px 6px rgba(34,197,94,0.45)",
          }}
        >
          <Check size={9} className="text-white" strokeWidth={3} />
        </div>
      )}
      <span
        className="text-[12.5px] font-semibold tracking-tight"
        style={{ color: active ? "#FAC775" : "var(--app-text-primary)" }}
      >
        {primary}
      </span>
      <span
        className="text-[9.5px] font-medium uppercase tracking-[1px]"
        style={{ color: active ? "#FFD89A" : "var(--app-text-muted)", opacity: active ? 0.85 : 1 }}
      >
        {secondary}
      </span>
    </button>
  );
}

function DayWheel({
  value,
  onChange,
  accent,
}: {
  value: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div
      className="rounded-[14px] p-3"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Selected day big readout */}
      <div className="mb-3 flex items-baseline justify-center gap-2">
        <span
          className="text-[40px] font-semibold leading-none tabular-nums tracking-[-0.03em]"
          style={{
            color: "var(--app-text-primary)",
            textShadow: `0 2px 16px ${accent}33`,
          }}
        >
          {value}
        </span>
        <span className="text-[12px] font-medium text-[var(--app-text-muted)]">.</span>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const active = d === value;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              className="h-9 rounded-[9px] text-[12px] font-semibold tabular-nums transition-all active:scale-[0.92]"
              style={
                active
                  ? {
                      color: "#0B0B0D",
                      background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                      boxShadow: `0 4px 12px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
                    }
                  : {
                      color: "var(--app-text-secondary)",
                      background: "rgba(255,255,255,0.03)",
                    }
              }
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

