"use client";

/**
 * Deep Insights panel (account-level-10 unlock) — an extra analysis layer on top
 * of the free Deep tab. Below the unlock level it shows a locked teaser; at level
 * 10+ it renders two real, on-device computations: a month-end spend forecast and
 * per-category momentum. All numbers come from lib/insights/deep-insights.ts.
 */

import { useEffect, useState } from "react";
import { Lock, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAppProfile } from "@/lib/app/profile-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import { getCountryByCode, normalizeCountryCode } from "@/lib/shared/countries";
import { DEEP_INSIGHTS_LEVEL } from "@/config/account-unlocks";
import { pickText } from "@/lib/product-architecture/dashboard-contract";
import {
  fetchSpendForecast,
  fetchCategoryMomentum,
  type SpendForecast,
  type CategoryMomentum,
} from "@/lib/insights/deep-insights";

const GOLD = "#F5A623";

function money(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: currency || "TRY",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

function cardStyle(): React.CSSProperties {
  return {
    background: "linear-gradient(160deg, var(--app-bg-elevated, #161B29), var(--app-bg-surface, #0F1117))",
    border: "1px solid var(--app-border, rgba(255,255,255,0.1))",
    borderRadius: 16,
  };
}

export function DeepInsightsPanel() {
  const { profile } = useAppProfile();
  const { locale } = useAppLocale();
  const tr = locale === "tr";
  const accountLevel = profile?.accountLevel ?? 1;
  const unlocked = accountLevel >= DEEP_INSIGHTS_LEVEL;

  const [forecast, setForecast] = useState<SpendForecast | null>(null);
  const [momentum, setMomentum] = useState<CategoryMomentum[]>([]);
  const [loaded, setLoaded] = useState(false);

  const homeCurrency = getCountryByCode(normalizeCountryCode(profile?.country) ?? "")?.currency ?? null;

  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    Promise.all([fetchSpendForecast(homeCurrency), fetchCategoryMomentum(homeCurrency)])
      .then(([f, m]) => {
        if (!alive) return;
        setForecast(f);
        setMomentum(m);
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [unlocked, homeCurrency]);

  const header = (
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4" style={{ color: GOLD }} />
      <h3 className="text-[15px] font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
        {tr ? "Derin Insights" : "Deep Insights"}
      </h3>
      <span
        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
        style={{ background: `${GOLD}1f`, color: GOLD, border: `1px solid ${GOLD}44` }}
      >
        Lv.{DEEP_INSIGHTS_LEVEL}
      </span>
    </div>
  );

  // ── Locked teaser ──────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="p-4" style={cardStyle()}>
        {header}
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}33` }}
          >
            <Lock className="h-4 w-4" style={{ color: GOLD }} />
          </span>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
              {tr ? `Seviye ${DEEP_INSIGHTS_LEVEL}'te açılır` : `Unlocks at level ${DEEP_INSIGHTS_LEVEL}`}
            </p>
            <p className="mt-0.5 text-[12px] leading-5" style={{ color: "var(--app-text-muted)" }}>
              {tr
                ? "Ay sonu harcama tahmini ve kategori momentumu — harcamalarından hesaplanan derin katman."
                : "A month-end spend forecast and category momentum — a deep layer computed from your own spending."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Unlocked ───────────────────────────────────────────────────────────────
  const hasForecast = forecast != null;
  const hasMomentum = momentum.length > 0;

  return (
    <div className="p-4" style={cardStyle()}>
      {header}

      {!loaded ? (
        <p className="text-[12px]" style={{ color: "var(--app-text-muted)" }}>
          {tr ? "Hesaplanıyor…" : "Computing…"}
        </p>
      ) : !hasForecast && !hasMomentum ? (
        <p className="text-[12px] leading-5" style={{ color: "var(--app-text-muted)" }}>
          {tr
            ? "Tahmin için yeterli fiş yok. Bu ay ve önceki aylarda fiş yükledikçe burası dolar."
            : "Not enough receipts yet. This fills in as you add receipts across months."}
        </p>
      ) : (
        <div className="space-y-4">
          {/* Forecast */}
          {hasForecast && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
                {tr ? "Ay sonu tahmini" : "Projected month-end"}
              </p>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-mono text-2xl font-black tabular-nums" style={{ color: "var(--app-text-primary)" }}>
                  {money(forecast!.projectedTotal, forecast!.currency, locale)}
                </span>
                {forecast!.deltaPct != null && (
                  <span
                    className="mb-1 flex items-center gap-0.5 text-[12px] font-bold tabular-nums"
                    style={{ color: forecast!.deltaPct > 0 ? "#fb7185" : "#34d399" }}
                  >
                    {forecast!.deltaPct > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {tr ? `%${Math.abs(forecast!.deltaPct)}` : `${Math.abs(forecast!.deltaPct)}%`}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px]" style={{ color: "var(--app-text-muted)" }}>
                {tr
                  ? `Şu ana kadar ${money(forecast!.currentSoFar, forecast!.currency, locale)} · ${forecast!.daysElapsed}/${forecast!.daysInMonth} gün`
                  : `${money(forecast!.currentSoFar, forecast!.currency, locale)} so far · day ${forecast!.daysElapsed}/${forecast!.daysInMonth}`}
                {forecast!.priorMonthTotal != null && (
                  <>
                    {" · "}
                    {tr ? "geçen ay " : "last month "}
                    {money(forecast!.priorMonthTotal, forecast!.currency, locale)}
                  </>
                )}
              </p>
              {forecast!.lowConfidence && (
                <p className="mt-1 text-[11px]" style={{ color: "var(--app-text-muted)", opacity: 0.8 }}>
                  {tr ? "Ay erken — tahmin veri arttıkça netleşir." : "Early in the month — the estimate sharpens with more data."}
                </p>
              )}
            </div>
          )}

          {/* Category momentum */}
          {hasMomentum && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--app-text-muted)" }}>
                {tr ? "Kategori momentumu" : "Category momentum"}
              </p>
              <div className="space-y-1.5">
                {momentum.map((m) => {
                  const color = m.direction === "up" ? "#fb7185" : m.direction === "down" ? "#34d399" : "var(--app-text-muted)";
                  const Icon = m.direction === "up" ? TrendingUp : m.direction === "down" ? TrendingDown : Minus;
                  return (
                    <div key={m.key} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-[13px] font-medium" style={{ color: "var(--app-text-secondary)" }}>
                        {pickText(m.label, locale)}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-[12px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                          {money(m.current, m.currency, locale)}
                        </span>
                        <span className="flex items-center gap-0.5 text-[12px] font-bold tabular-nums" style={{ color, minWidth: 52, justifyContent: "flex-end" }}>
                          <Icon className="h-3.5 w-3.5" />
                          {m.direction === "flat" ? "≈" : tr ? `%${Math.abs(m.changePct)}` : `${Math.abs(m.changePct)}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px]" style={{ color: "var(--app-text-muted)", opacity: 0.8 }}>
                {tr ? "Bu ay, son 3 ayın ortalamasına göre." : "This month vs your trailing 3-month average."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
