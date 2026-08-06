/**
 * Turkish tax-identifier validation (VKN / TCKN).
 *
 * Both identifiers carry a check digit, so a single misread digit is detectable.
 * This matters for merchant identity: an OCR error turns one company's tax number
 * into a number that belongs to nobody, and storing it creates a phantom merchant
 * that the text-matching layers can never merge away. Rejecting an invalid number
 * costs one merge opportunity; accepting one splits a merchant permanently.
 *
 * Observed in production: LC Waikiki was stored under both 8370071817 (valid) and
 * 8370071617 (check digit fails — an 8 read as a 6), as two separate merchants.
 */

/**
 * VKN (10 digits): for each of the first 9 digits, tmp = (digit + 10 - position) mod 10;
 * when tmp is non-zero its contribution is (tmp * 2^(10-position)) mod 9, using 9 in place
 * of a zero result. The check digit is (10 - sum mod 10) mod 10.
 */
function isValidVkn(digits: string): boolean {
  if (digits.length !== 10) return false;
  const d = [...digits].map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const tmp = (d[i] + (9 - i)) % 10;
    if (tmp === 0) continue;
    const p = (tmp * 2 ** (9 - i)) % 9;
    sum += p === 0 ? 9 : p;
  }
  return (10 - (sum % 10)) % 10 === d[9];
}

/**
 * TCKN (11 digits): first digit non-zero; digit 10 = ((odd positions × 7) − even positions)
 * mod 10; digit 11 = (sum of first 10) mod 10.
 */
function isValidTckn(digits: string): boolean {
  if (digits.length !== 11 || digits[0] === "0") return false;
  const d = [...digits].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((odd * 7 - even + 100) % 10 !== d[9]) return false;
  const total = d.slice(0, 10).reduce((a, b) => a + b, 0);
  return total % 10 === d[10];
}

/**
 * Normalizes a raw tax-number reading and returns it only when its check digit holds.
 * Returns null for anything unverifiable — a wrong number is worse than none, because
 * merchant identity is keyed on it.
 *
 * Non-Turkish receipts are out of scope: `countryCode` other than TR returns the
 * digits unvalidated (other countries' formats have their own rules), and an absent
 * country is treated as TR since the check is what makes the number trustworthy.
 */
export function validateTurkishTaxId(
  raw: string | null | undefined,
  countryCode?: string | null
): { value: string | null; rejected: boolean } {
  const digits = raw?.trim().replace(/\D/g, "") ?? "";
  if (!digits) return { value: null, rejected: false };

  const country = countryCode?.trim().toUpperCase().slice(0, 2) ?? null;
  if (country && country !== "TR") {
    // Length guard only — the column is VARCHAR(11) and other formats vary.
    return { value: digits.length <= 11 ? digits : null, rejected: digits.length > 11 };
  }

  if (digits.length === 10) {
    return isValidVkn(digits) ? { value: digits, rejected: false } : { value: null, rejected: true };
  }
  if (digits.length === 11) {
    return isValidTckn(digits) ? { value: digits, rejected: false } : { value: null, rejected: true };
  }
  return { value: null, rejected: true };
}
