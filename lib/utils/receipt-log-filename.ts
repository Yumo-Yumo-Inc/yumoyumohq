/**
 * Format receipt log filename: total_kurus-DD-MM.YYYY-HH-MM
 * Kuruş uses underscore (e.g. 240.05 → 240_05).
 * Example: 240_05-24-01.2026-17-50
 */
export function formatReceiptLogFilename(
  totalPaid: number,
  date: string | null,
  time: string | null,
  fallbackId?: string
): string {
  const intPart = Math.floor(Math.max(0, totalPaid));
  const cents = Math.round((Math.max(0, totalPaid) - intPart) * 100) % 100;
  const amountPart = `${intPart}_${String(cents).padStart(2, "0")}`;

  let datePart = "00-00.0000";
  if (date && date.trim()) {
    const trimmed = date.trim();
    // ISO: YYYY-MM-DD or YYYY-MM-DDTHH...
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      datePart = `${isoMatch[3]}-${isoMatch[2]}.${isoMatch[1]}`;
    } else {
      // DD.MM.YYYY or DD/MM/YYYY
      const dmyMatch = trimmed.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
      if (dmyMatch) {
        const d = dmyMatch[1].padStart(2, "0");
        const m = dmyMatch[2].padStart(2, "0");
        datePart = `${d}-${m}.${dmyMatch[3]}`;
      }
    }
  }

  let timePart = "00-00";
  if (time && time.trim()) {
    const t = time.trim();
    const timeMatch = t.match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      timePart = `${timeMatch[1].padStart(2, "0")}-${timeMatch[2]}`;
    }
  }

  const base = `${amountPart}-${datePart}-${timePart}`;
  // Add fallbackId only when date/time are missing to avoid duplicate filenames
  if (
    fallbackId &&
    fallbackId.trim() &&
    (datePart === "00-00.0000" || timePart === "00-00")
  ) {
    return `${base}-${fallbackId.trim().slice(0, 8)}`;
  }
  return base;
}
