"use client";

import { useEffect, useMemo, useState } from "react";

type FxRate = {
  rateFromUsd: number;
  asOf?: string;
};

const fxCache = new Map<string, Promise<FxRate | null>>();

function normalizeCurrency(currency: string | null | undefined): string {
  const normalized = (currency || "USD").trim().toUpperCase();
  if (normalized === "TL") return "TRY";
  if (normalized === "RM") return "MYR";
  return normalized || "USD";
}

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency}`;
  }
}

function loadFxRate(currency: string): Promise<FxRate | null> {
  if (!fxCache.has(currency)) {
    fxCache.set(
      currency,
      fetch(`/api/fx/latest?currency=${encodeURIComponent(currency)}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const rateFromUsd = Number(data?.rateFromUsd);
          if (!Number.isFinite(rateFromUsd) || rateFromUsd <= 0) return null;
          return { rateFromUsd, asOf: data?.asOf };
        })
        .catch(() => null)
    );
  }

  return fxCache.get(currency)!;
}

interface CurrencyWithUsdProps {
  amount: number | null | undefined;
  currency: string | null | undefined;
  locale?: string;
  emptyLabel?: string;
}

export function CurrencyWithUsd({
  amount,
  currency,
  locale = "tr-TR",
  emptyLabel = "-",
}: CurrencyWithUsdProps) {
  const normalizedCurrency = useMemo(() => normalizeCurrency(currency), [currency]);
  const [fxState, setFxState] = useState<{ currency: string; rate: FxRate | null } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (
      amount == null ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      normalizedCurrency === "USD"
    ) {
      return;
    }

    loadFxRate(normalizedCurrency).then((rate) => {
      if (!cancelled) {
        setFxState({ currency: normalizedCurrency, rate });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [amount, normalizedCurrency]);

  if (amount == null || !Number.isFinite(amount)) {
    return <span>{emptyLabel}</span>;
  }

  const activeFxRate =
    normalizedCurrency === "USD"
      ? { rateFromUsd: 1 }
      : fxState?.currency === normalizedCurrency
        ? fxState.rate
        : null;
  const hasLoadedRate = normalizedCurrency === "USD" || fxState?.currency === normalizedCurrency;
  const usdAmount = activeFxRate?.rateFromUsd ? amount / activeFxRate.rateFromUsd : null;

  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="font-semibold">{formatMoney(amount, normalizedCurrency, locale)}</span>
      {usdAmount != null ? (
        <span className="mt-1 text-xs font-normal text-muted-foreground">
          ~{formatMoney(usdAmount, "USD", locale)}
        </span>
      ) : hasLoadedRate ? (
        <span className="mt-1 text-xs font-normal text-muted-foreground">USD kuru yok</span>
      ) : (
        <span className="mt-1 text-xs font-normal text-muted-foreground">USD hesaplaniyor</span>
      )}
    </span>
  );
}
