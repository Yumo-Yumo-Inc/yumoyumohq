/**
 * Repair Gemini ISO dates that put the day in the month slot
 * ("2026-14-08" for 14 Aug 2026). Month 14 is not a calendar month.
 */

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;

export function repairIsoDate(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  const m = ISO_DAY.exec(raw);
  if (!m) return null;
  let year = Number(m[1]);
  let month = Number(m[2]);
  let day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month > 12 && month <= 31 && day >= 1 && day <= 12) {
    const swapped = month;
    month = day;
    day = swapped;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
