import { normalizeCountryCode } from "@/lib/shared/countries";

/** IANA timezone per supported country (user-selected country drives local day). */
const COUNTRY_IANA_TIMEZONE: Record<string, string> = {
  AE: "Asia/Dubai",
  AR: "America/Argentina/Buenos_Aires",
  AU: "Australia/Sydney",
  AT: "Europe/Vienna",
  BE: "Europe/Brussels",
  BR: "America/Sao_Paulo",
  CA: "America/Toronto",
  CL: "America/Santiago",
  CN: "Asia/Shanghai",
  CZ: "Europe/Prague",
  DK: "Europe/Copenhagen",
  EG: "Africa/Cairo",
  FI: "Europe/Helsinki",
  FR: "Europe/Paris",
  DE: "Europe/Berlin",
  GR: "Europe/Athens",
  GB: "Europe/London",
  HU: "Europe/Budapest",
  IN: "Asia/Kolkata",
  ID: "Asia/Jakarta",
  IE: "Europe/Dublin",
  IL: "Asia/Jerusalem",
  IT: "Europe/Rome",
  JP: "Asia/Tokyo",
  KR: "Asia/Seoul",
  MY: "Asia/Kuala_Lumpur",
  MX: "America/Mexico_City",
  NL: "Europe/Amsterdam",
  NZ: "Pacific/Auckland",
  NO: "Europe/Oslo",
  PH: "Asia/Manila",
  PL: "Europe/Warsaw",
  PT: "Europe/Lisbon",
  RO: "Europe/Bucharest",
  RU: "Europe/Moscow",
  SA: "Asia/Riyadh",
  SG: "Asia/Singapore",
  ZA: "Africa/Johannesburg",
  ES: "Europe/Madrid",
  SE: "Europe/Stockholm",
  CH: "Europe/Zurich",
  TW: "Asia/Taipei",
  TH: "Asia/Bangkok",
  TR: "Europe/Istanbul",
  US: "America/New_York",
  VN: "Asia/Ho_Chi_Minh",
};

export function getTimezoneForCountry(countryCode: string | null | undefined): string {
  const code = normalizeCountryCode(countryCode);
  if (!code) return "UTC";
  return COUNTRY_IANA_TIMEZONE[code] ?? "UTC";
}

/** Calendar date YYYY-MM-DD in the given IANA timezone. */
export function getLocalDateString(
  timeZone: string,
  now: Date = new Date()
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function getLocalDateStringForCountry(
  countryCode: string | null | undefined,
  now: Date = new Date()
): string {
  return getLocalDateString(getTimezoneForCountry(countryCode), now);
}
