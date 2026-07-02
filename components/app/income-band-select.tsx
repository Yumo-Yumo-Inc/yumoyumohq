"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  INCOME_BAND_KEYS,
  INCOME_BAND_USD_THRESHOLDS,
  normalizeIncomeBandKey,
  type IncomeBandKey,
} from "@/config/income-bands";
import { type AppLocale } from "@/lib/i18n/app-context";
import { normalizeCountryCode } from "@/lib/shared/countries";

type FxState = {
  currency: string;
  symbol: string;
  rateFromUsd: number;
  asOf: string;
} | null;

interface IncomeBandSelectProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  countryCode?: string | null;
  locale: AppLocale;
  className?: string;
  placeholder: string;
  includeUnset?: boolean;
}

function formatCurrency(amount: number, currency: string, locale: AppLocale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "ru" ? "ru-RU" : locale === "th" ? "th-TH" : locale === "es" ? "es-ES" : locale === "zh" ? "zh-CN" : "en-US";
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency,
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  }).format(amount);
}

function buildBandLabel(key: IncomeBandKey, fx: FxState, locale: AppLocale) {
  const band = INCOME_BAND_USD_THRESHOLDS[key];
  const usdLabel =
    band.max == null
      ? `${formatCurrency(band.min, "USD", locale)}+`
      : `${formatCurrency(band.min, "USD", locale)} - ${formatCurrency(band.max, "USD", locale)}`;

  if (!fx || fx.currency === "USD") {
    return usdLabel;
  }

  const localMin = formatCurrency(band.min * fx.rateFromUsd, fx.currency, locale);
  const localLabel = band.max == null ? `${localMin}+` : `${localMin} - ${formatCurrency(band.max * fx.rateFromUsd, fx.currency, locale)}`;
  return `${usdLabel} • ~${localLabel}`;
}

function formatAsOfDate(asOf: string, locale: AppLocale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "ru" ? "ru-RU" : locale === "th" ? "th-TH" : locale === "es" ? "es-ES" : locale === "zh" ? "zh-CN" : "en-US";
  return new Intl.DateTimeFormat(localeTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${asOf}T00:00:00Z`));
}

export function IncomeBandSelect({
  id,
  value,
  onValueChange,
  countryCode,
  locale,
  className,
  placeholder,
  includeUnset = true,
}: IncomeBandSelectProps) {
  const normalizedValue = normalizeIncomeBandKey(value);
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const normalizedCountryCode = normalizeCountryCode(countryCode) || "US";
  const [fx, setFx] = useState<FxState>(null);
  const selectValue = normalizedValue || (includeUnset ? "unset" : undefined);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/fx/latest?country=${normalizedCountryCode}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.currency && data?.rateFromUsd) {
          setFx({
            currency: data.currency,
            symbol: data.symbol,
            rateFromUsd: Number(data.rateFromUsd),
            asOf: data.asOf,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFx(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedCountryCode]);

  const helperText = useMemo(() => {
    if (!fx) {
      return l("Gelir bantları USD bazlıdır.", "Income bands are stored in USD.", "Диапазоны дохода хранятся в USD.", "ช่วงรายได้ถูกเก็บในสกุล USD", "Las bandas de ingreso se almacenan en USD.", "收入区间以美元存储。");
    }

    if (fx.currency === "USD") {
      return l(
        `Gelir bantları USD bazlıdır. Referans kur tarihi: ${formatAsOfDate(fx.asOf, locale)}.`,
        `Income bands are stored in USD. Reference date: ${formatAsOfDate(fx.asOf, locale)}.`,
        `Диапазоны дохода хранятся в USD. Дата курса: ${formatAsOfDate(fx.asOf, locale)}.`,
        `ช่วงรายได้เก็บใน USD วันที่อ้างอิงอัตราแลกเปลี่ยน: ${formatAsOfDate(fx.asOf, locale)}.`,
        `Las bandas de ingreso se almacenan en USD. Fecha de referencia: ${formatAsOfDate(fx.asOf, locale)}.`,
        `收入区间以美元存储。汇率参考日期：${formatAsOfDate(fx.asOf, locale)}。`,
      );
    }

    return l(
      `USD bandı seçersin, yaklaşık ${fx.currency} karşılıkları güncel ECB referans kuruna göre gösterilir. Tarih: ${formatAsOfDate(fx.asOf, locale)}.`,
      `You pick a USD band and see approximate ${fx.currency} values using the latest ECB reference rate. Date: ${formatAsOfDate(fx.asOf, locale)}.`,
      `Ты выбираешь диапазон в USD, а примерные значения в ${fx.currency} считаются по актуальному курсу ECB. Дата: ${formatAsOfDate(fx.asOf, locale)}.`,
      `คุณเลือกช่วงเป็น USD และดูมูลค่าโดยประมาณเป็น ${fx.currency} ตามอัตราอ้างอิงล่าสุดของ ECB วันที่: ${formatAsOfDate(fx.asOf, locale)}.`,
      `Eliges una banda en USD y ves valores aproximados en ${fx.currency} usando el tipo de referencia más reciente del BCE. Fecha: ${formatAsOfDate(fx.asOf, locale)}.`,
      `你选择美元区间，并按 ECB 最新参考汇率查看约 ${fx.currency} 数值。日期：${formatAsOfDate(fx.asOf, locale)}。`,
    );
  }, [fx, locale]);

  return (
    <div className="space-y-2">
      <Select value={selectValue} onValueChange={(next) => onValueChange(next === "unset" ? "" : next)}>
        <SelectTrigger id={id} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeUnset ? <SelectItem value="unset">{l("Seçilmedi", "Not selected", "Не выбрано", "ยังไม่เลือก", "No seleccionado", "未选择")}</SelectItem> : null}
          {INCOME_BAND_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {buildBandLabel(key, fx, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
        {helperText}
      </p>
    </div>
  );
}
