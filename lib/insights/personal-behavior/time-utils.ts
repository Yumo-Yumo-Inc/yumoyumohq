/**
 * Time utilities for behavior engines.
 *
 * Receipts store `date` (YYYY-MM-DD) and `time` (HH:MM) in **local time**
 * (the timezone of the merchant / user at the moment of purchase).
 * To compare hours consistently we must convert that local time to UTC
 * before calling `getUTCHours()`.
 *
 * The original engines incorrectly used `setUTCHours(localHour)` which
 * treated the local hour as-if it were already UTC, causing a 3-hour
 * shift for Turkey (UTC+3).
 */

import type { ReceiptSummary } from "@/lib/insights/types";

/** Rough country-code → UTC offset in minutes. Expand as needed. */
const COUNTRY_OFFSET_MINUTES: Record<string, number> = {
  tr: 180, // Turkey UTC+3
  turkey: 180,
  gb: 0, // UK UTC+0 / BST handled loosely
  uk: 0,
  us: -300, // US Eastern (ET) — fallback
  usa: -300,
  de: 60, // Germany UTC+1 / CEST
  germany: 60,
  fr: 60,
  france: 60,
  nl: 60,
  netherlands: 60,
};

function getTimezoneOffsetMinutes(country: string | undefined): number {
  if (!country) return 180; // Default Turkey (primary market)
  return COUNTRY_OFFSET_MINUTES[country.toLowerCase().trim()] ?? 180;
}

/**
 * Convert a receipt's local date+time into a true UTC Date.
 *
 * Example (Turkey, UTC+3):
 *   receipt.date = "2026-05-06"
 *   receipt.time = "18:30"
 *   → returns Date corresponding to 2026-05-06T15:30:00Z
 *
 * If `time` is missing, midnight local time is assumed.
 */
export function extractTimestamp(receipt: ReceiptSummary): Date | null {
  if (!receipt.date) return null;
  const timeStr = receipt.time && /^\d{2}:\d{2}/.test(receipt.time)
    ? `${receipt.time}:00`
    : "00:00:00";

  const offsetMin = getTimezoneOffsetMinutes(receipt.country);
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const offsetHh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const offsetMm = String(absMin % 60).padStart(2, "0");

  const iso = `${receipt.date}T${timeStr}${sign}${offsetHh}:${offsetMm}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Extract the local hour from a receipt (0-23).
 *
 * The receipt stores time in local timezone (e.g. 18:30 Turkey time).
 * We return that hour directly so filters like "evening 17-22" work
 * against the user's local perception of the day, not UTC.
 */
export function extractLocalHour(receipt: ReceiptSummary): number | null {
  if (!receipt.time || !/^\d{2}:\d{2}/.test(receipt.time)) return null;
  return Number(receipt.time.slice(0, 2));
}

/**
 * Extract the local day-of-week from a receipt (0=Sunday).
 *
 * Uses the true UTC timestamp and adds back the timezone offset so
 * midnight-crossing receipts are attributed to the correct local day.
 */
export function extractLocalDayOfWeek(receipt: ReceiptSummary): number | null {
  const ts = extractTimestamp(receipt);
  if (!ts) return null;
  const offsetMin = getTimezoneOffsetMinutes(receipt.country);
  const localMs = ts.getTime() + offsetMin * 60 * 1000;
  return new Date(localMs).getUTCDay();
}

/** Hour bucket used by engines. Based on *local* perception of the day. */
export type HourBucket = "morning" | "afternoon" | "evening" | "night";

export function hourBucket(hour: number): HourBucket {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function dayOfWeekLabel(dow: number, locale: "tr" | "en"): string {
  const tr = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const en = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (locale === "tr" ? tr : en)[dow] ?? "";
}

export function bucketLabel(bucket: HourBucket, locale: "tr" | "en"): string {
  const map: Record<HourBucket, [string, string]> = {
    morning: ["sabah (05–11)", "morning (5–11)"],
    afternoon: ["öğleden sonra (11–17)", "afternoon (11–17)"],
    evening: ["akşam (17–22)", "evening (17–22)"],
    night: ["gece (22–05)", "night (22–5)"],
  };
  return locale === "tr" ? map[bucket][0] : map[bucket][1];
}
