import { foldForComparison } from "@/lib/receipt/name-normalization";

/**
 * Deterministic OCR typo fixes for well-known TR retail chains.
 * Applied before merchant matching so "ŞÜK MARKETLER" resolves like "ŞOK MARKETLER".
 */
export function correctKnownChainOcrTypos(name: string): string {
  if (!name?.trim()) return name;

  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;

  const firstFolded = foldForComparison(parts[0]).replace(/[^a-z0-9]/g, "");
  const secondFolded = foldForComparison(parts[1]).replace(/[^a-z0-9]/g, "");

  // ŞOK MARKETLER — Vision/OCR often reads O as Ü ("ŞÜK MARKETLER").
  if (
    (firstFolded === "suk" || firstFolded === "shuk") &&
    secondFolded.startsWith("market")
  ) {
    const hasTurkishSh = /[şŞ]/.test(parts[0] ?? "");
    parts[0] = hasTurkishSh ? "ŞOK" : "SOK";
    return parts.join(" ");
  }

  return name;
}
