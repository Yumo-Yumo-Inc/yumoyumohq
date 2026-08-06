"use client";

/**
 * YumbieMarketDock — the dashboard band that replaced the inline Yumbie room.
 * Left: a compact Yumbie companion whose face tracks the mood derived from the
 * user's real receipt activity; tapping it opens the full room in a modal
 * (YumbieRoomModal). Right: the market strip — SOL/USDC, SOL/BTC (Kraken spot)
 * and the annual CPI inflation of the user's account country, all from
 * /api/markets/pulse. Unavailable values render as an em dash, never invented.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { YumbieCompanion } from "@/components/app/home/yumbie-companion";
import type { YumbieMood } from "@/lib/app/use-yumbie-mood";
import { YumbieRoomModal } from "@/components/yumbie/YumbieRoomModal";
import { YumbieDataBridge } from "@/components/yumbie/YumbieDataBridge";
import { YumbieInsight } from "@/components/yumbie/YumbieInsight";
import { YumbieDeeplink } from "@/components/yumbie/YumbieDeeplink";
import { useYumbieProgress } from "@/components/yumbie/useYumbieProgress";
import { useYumbieMessage, yumbieToday } from "@/components/yumbie/useYumbieMessage";
import { useYumbieInsight } from "@/components/yumbie/useYumbieInsight";
import { useYumbieTour } from "@/components/yumbie/useYumbieTour";
import { cn } from "@/lib/utils";
import type { YumoLocale } from "@/lib/product-architecture/dashboard-contract";

interface PairQuote {
  price: number;
  changePct: number;
}

interface MarketPulse {
  solUsdc: PairQuote | null;
  solBtc: PairQuote | null;
  usdFiat: { currency: string; rate: number } | null;
  inflation: { country: string; yoyPct: number } | null;
}

async function fetchMarketPulse(): Promise<MarketPulse> {
  const res = await fetch("/api/markets/pulse", { cache: "no-store" });
  if (!res.ok) throw new Error("market pulse unavailable");
  return (await res.json()) as MarketPulse;
}

function inflationLabel(locale: YumoLocale, country: string | null): string {
  // Short forms — the cell is narrow on 430px phones (TÜFE = TR headline CPI).
  const base =
    locale === "tr" ? "TÜFE"
    : locale === "ru" ? "ИПЦ"
    : locale === "es" ? "IPC"
    : "CPI";
  return country ? `${base} · ${country}` : base;
}

function formatPercent(value: number, locale: YumoLocale): string {
  const n = value.toFixed(1);
  return locale === "tr" ? `%${n}` : `${n}%`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 1) return value.toFixed(2);
  // Sub-1 pairs (SOL/BTC) keep 4 significant digits.
  return value.toPrecision(4);
}

interface MarketItem {
  label: string;
  value: string;
  /** "warm" = the hidden-cost orange family (inflation eats money). */
  tone?: "warm";
}

/** Same visual DNA as the hero's StatBlock (monthly-summary-card): a colored
 *  left hairline + mono value + caps label — so the market row reads as a
 *  continuation of the summary stats, not a separate widget. */
function MarketStat({ item }: { item: MarketItem }) {
  const warm = item.tone === "warm";
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      className={cn(
        "min-w-0 border-l-2 pl-3",
        warm ? "border-l-[#ef6a43]/40" : "border-l-[var(--app-gold-border)]",
      )}
    >
      <p
        className={cn(
          "truncate font-mono text-[17px] font-bold tabular-nums leading-tight",
          warm ? "text-[#ef6a43]" : "text-[var(--app-text-primary)]",
        )}
      >
        {item.value}
      </p>
      <p className="mt-0.5 truncate text-[9px] font-extrabold uppercase tracking-[0.09em] text-[var(--app-text-muted)]">
        {item.label}
      </p>
    </motion.div>
  );
}

export function YumbieMarketDock({ locale }: { locale: YumoLocale }) {
  const [roomOpen, setRoomOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const { data, isLoading } = useQuery({
    queryKey: ["market-pulse"],
    queryFn: fetchMarketPulse,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  // Mood from the user's real activity (synced into the store by the bridge).
  const activeToday = useYumbieProgress((s) => s.activeToday);
  const recentReceipts = useYumbieProgress((s) => s.recentReceipts);
  const mood: YumbieMood =
    activeToday ? "happy" : recentReceipts === 0 ? "asleep" : "idle";

  // "!" badge — same unseen logic as the room walker; the room itself shows the
  // full cue, so here it is just a pull into the modal.
  const message = useYumbieMessage((s) => s.message);
  const seenMessage = useYumbieMessage((s) => s.seenMessage);
  const seenDate = useYumbieMessage((s) => s.seenDate);
  const insightPending = useYumbieInsight((s) => s.pending);
  const tourPending = useYumbieTour((s) => s.pending);
  const tourActive = useYumbieTour((s) => s.active);
  const hasCue =
    insightPending ||
    !!tourPending ||
    (!!message && !(message === seenMessage && seenDate === yumbieToday()));

  // A notification deeplink can start the weekly tour before the room is open —
  // the tour plays inside the workspace, so pull the modal up.
  useEffect(() => {
    if (tourActive) setRoomOpen(true);
  }, [tourActive]);

  const roomAria =
    locale === "tr" ? "Yumbie'nin odasını aç" : "Open Yumbie's room";

  // Only real values render — a missing source simply leaves no stat behind.
  const items: MarketItem[] = [];
  if (data?.solUsdc) items.push({ label: "SOL/USDC", value: formatPrice(data.solUsdc.price) });
  if (data?.solBtc) items.push({ label: "SOL/BTC", value: formatPrice(data.solBtc.price) });
  if (data?.usdFiat) items.push({ label: `USD/${data.usdFiat.currency}`, value: formatPrice(data.usdFiat.rate) });
  if (data?.inflation) {
    items.push({
      label: inflationLabel(locale, data.inflation.country),
      value: formatPercent(data.inflation.yoyPct, locale),
      tone: "warm",
    });
  }

  return (
    // Boxless band in the hero's own stat language (StatBlock DNA): colored
    // left hairlines + mono values — a continuation of the summary, not a
    // separate widget.
    <div className="relative">
      {/* Yumbie's data plumbing stays mounted with the dashboard, not the modal. */}
      <YumbieDataBridge />
      <YumbieInsight />
      <YumbieDeeplink />

      <div className="flex items-center gap-4 sm:gap-5">
        {/* The character is the door to the room. Size is inline px on purpose:
            the SVG inside is h-full/w-full, so a missing (stale-SW) CSS class
            would blow it up to the full width — kritik-boyut-inline-px rule. */}
        <button
          type="button"
          aria-label={roomAria}
          onClick={() => setRoomOpen(true)}
          className="group relative shrink-0 rounded-full transition active:scale-95"
          style={{ width: 64, height: 64 }}
        >
          <YumbieCompanion
            mood={mood}
            auraOpacity={0.28}
            eyeStyle="round"
            className="transition group-hover:-translate-y-0.5"
            style={{ width: 64, height: 64 }}
          />
          {hasCue && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] ring-2 ring-[var(--app-bg-dashboard)]">
              <span className="text-[10px] font-black leading-none text-white">!</span>
            </span>
          )}
        </button>

        {isLoading ? (
          <div className="grid flex-1 animate-pulse grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-l-2 border-l-[var(--app-border)] pl-3">
                <div className="h-4 w-16 rounded-full bg-[var(--app-text-muted)]/15" />
                <div className="mt-1.5 h-2 w-12 rounded-full bg-[var(--app-text-muted)]/12" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="font-mono text-[15px] font-bold text-[var(--app-text-muted)]">—</p>
        ) : (
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-x-5"
          >
            {items.map((item) => (
              <MarketStat key={item.label} item={item} />
            ))}
          </motion.div>
        )}
      </div>

      <YumbieRoomModal open={roomOpen} onOpenChange={setRoomOpen} />
    </div>
  );
}
