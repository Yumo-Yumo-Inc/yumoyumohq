/**
 * Ledger date helpers for monthly spend bucketing.
 *
 * Invalid OCR/LLM dates (e.g. "2019-05-2026", "2026-06-null") must NEVER fall
 * through to "today's month" — that silently inflates the current month total.
 * Gemini YYYY-DD-MM ("2026-14-08") is repaired to a real calendar day first.
 */

import { repairIsoDate } from "@/lib/receipt/ocr/repair-iso-date";

/** Exact YYYY-MM-DD, or ISO datetime starting with a real calendar day. */
const LEDGER_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;

/** True when `value` is a real calendar YYYY-MM-DD (or ISO datetime). */
export function isValidLedgerDate(value: string | null | undefined): boolean {
  return monthKeyFromLedgerDate(value) != null;
}

/**
 * Calendar month key (YYYY-MM) for a ledger date string.
 * Returns null when the value is missing, malformed, or not a real calendar day.
 * Does not substitute "today".
 *
 * Gemini YYYY-DD-MM ("2026-14-08") is repaired to a real day before bucketing.
 */
export function monthKeyFromLedgerDate(value: string | null | undefined): string | null {
  const repaired = repairIsoDate(value);
  const raw = repaired ?? String(value ?? "").trim();
  const m = LEDGER_DATE_RE.exec(raw);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return `${m[1]}-${m[2]}`;
}

/**
 * Prefer a valid extraction date; otherwise a valid created_at day (YYYY-MM-DD).
 * Returns null only when neither is a real calendar date.
 */
export function resolveLedgerDate(
  extractionDate: string | null | undefined,
  createdAt: string | null | undefined
): string | null {
  const extracted = String(extractionDate ?? "").trim();
  if (monthKeyFromLedgerDate(extracted)) {
    return repairIsoDate(extracted) ?? extracted.slice(0, 10);
  }
  const created = String(createdAt ?? "").trim();
  if (monthKeyFromLedgerDate(created)) {
    const m = LEDGER_DATE_RE.exec(created);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }
  return null;
}
