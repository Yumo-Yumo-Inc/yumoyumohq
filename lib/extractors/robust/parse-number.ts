import type { CountryConfig } from "@/lib/country/base";

export function parseLooseNumber(token: string, countryConfig?: CountryConfig): number | null {
  let s = (token ?? "").trim();
  if (!s) return null;

  // Remove asterisks (Turkish receipt convention: *43,50)
  s = s.replace(/^\*+|\*+$/g, "");

  // Remove spaces used as thousand separators
  s = s.replace(/\s+/g, "");


  const format = countryConfig?.numberFormat;

  // 1) Country-specific parseFunction has highest priority
  if (format?.parseFunction) {
    const result = format.parseFunction(s);
    if (result !== null) {
      return result;
    }
    // If parseFunction returns null, fall through to generic logic
  }

  // 2) Special case: Multiple dots (e.g., "8.566.00" from Turkish fuel receipts)
  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount >= 2) {
    // Handle weird format like "8.566.00" (multiple dots)
    const parts = s.split('.');
    const lastPart = parts.pop() || '';
    
    // If last part is 2 digits, it's likely decimal (e.g., "8.566.00" -> 8566.00)
    if (lastPart.length === 2 && /^\d+$/.test(lastPart)) {
      // Combine all parts except last as integer, then add last as decimal
      const integerPart = parts.join('');
      s = integerPart + '.' + lastPart;
      const result = parseFloat(s);
      if (!isNaN(result) && result > 0) {
        return result;
      }
    }
    
    // If last part is 1-3 digits, treat as decimal
    if (lastPart.length <= 3 && /^\d+$/.test(lastPart)) {
      const integerPart = parts.join('');
      s = integerPart + '.' + lastPart;
      const result = parseFloat(s);
      if (!isNaN(result) && result > 0) {
        return result;
      }
    }
  }

  // 3) Generic logic using decimalSeparators / thousandSeparators if provided
  if (format) {
    const { decimalSeparators = [], thousandSeparators = [] } = format;
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      if (decimalSeparators.includes(".") && thousandSeparators.includes(",")) {
        // "1,234.56" format
        s = s.replace(/,/g, "");
      } else if (decimalSeparators.includes(",") && thousandSeparators.includes(".")) {
        // "1.234,56" format
        s = s.replace(/\./g, "").replace(/,/g, ".");
      } else {
        // Fallback based on position: last separator is decimal
        if (lastDot > lastComma) {
          s = s.replace(/,/g, "");
        } else {
          s = s.replace(/\./g, "").replace(/,/g, ".");
        }
      }
    } else if (hasComma && !hasDot) {
      if (decimalSeparators.includes(",") && !thousandSeparators.includes(",")) {
        // Comma is decimal
        const parts = s.split(",");
        if (parts.length === 2 && parts[1].length <= 2) {
          s = s.replace(/,/g, ".");
        } else {
          s = s.replace(/,/g, "");
        }
      } else if (thousandSeparators.includes(",") && !decimalSeparators.includes(",")) {
        // Comma is thousand
        s = s.replace(/,/g, "");
      } else {
        // Ambiguous - use heuristic
        const parts = s.split(",");
        if (parts.length === 2 && parts[1].length === 2) {
          s = s.replace(/,/g, ".");
        } else {
          s = s.replace(/,/g, "");
        }
      }
    } else if (!hasComma && hasDot) {
      if (decimalSeparators.includes(".") && !thousandSeparators.includes(".")) {
        // Dot is decimal - keep as is
      } else if (thousandSeparators.includes(".") && !decimalSeparators.includes(".")) {
        // Dot is thousand
        s = s.replace(/\./g, "");
      }
      // Otherwise keep as is
    }
  } else {
    // 3) Existing fallback logic (for countries without numberFormat config)
    // If both comma and dot exist, decide thousand vs decimal:
    // "1,234.56" => comma thousands, dot decimal
    // "1.234,56" => dot thousands, comma decimal
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      if (lastDot > lastComma) {
        // dot is decimal separator, commas are thousand separators
        s = s.replace(/,/g, "");
      } else {
        // comma is decimal separator, dots are thousand separators
        s = s.replace(/\./g, "");
        s = s.replace(/,/g, ".");
      }
    } else if (hasComma && !hasDot) {
      // Could be decimal (200,00) or thousands (1,234)
      const parts = s.split(",");
      if (parts.length === 2 && parts[1].length === 2) {
        s = s.replace(/,/g, ".");
      } else {
        s = s.replace(/,/g, "");
      }
    }
    // only dot or only digits: keep as-is
  }

  const v = parseFloat(s);
  if (!isFinite(v)) return null;

  // Turkish 100x heuristic: "1.700,00" -> OCR "170000" (missing thousand separator)
  // ONLY for Turkish receipts. Do NOT apply for currencies where large integer amounts
  // are normal: VND (Vietnam), IDR (Indonesia), KRW (Korea), JPY (Japan), etc.
  // VN: 450.000 VND ≈ $18 — perfectly valid large integer, must NOT be halved.
  const countryCode = String(countryConfig?.code ?? "");
  const isHighValueIntegerCurrency =
    countryCode === "VN" ||
    countryCode === "ID" ||
    countryCode === "KR" ||
    countryCode === "JP";
  if (!isHighValueIntegerCurrency && v > 10_000 && v % 100 === 0) {
    const corrected = v / 100;
    if (corrected >= 1 && corrected <= 1_000_000) {
      return corrected;
    }
  }
  return v;
}

export function tokenHasTwoDecimals(token: string): boolean {
  const s = token.replace(/\s+/g, "");
  // Accept both "." and "," as decimal separator in token (before normalization)
  return /[.,]\d{2}\b/.test(s);
}
