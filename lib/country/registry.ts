/**
 * Country configuration registry
 * Provides access to country configs, country detection, and extraction strategies.
 */

import type { CountryCode, CountryConfig, CountryProfile } from "./base";
import { extractVATRobust } from "@/lib/extractors/robust/extract-vat-robust";
import { extractMerchant as extractMerchantGeneric } from "@/lib/receipt/ocr/extract-merchant";
import { extractAddress as extractAddressGeneric } from "@/lib/receipt/ocr/extract-address";
import { extractDate as extractDateGeneric } from "@/lib/receipt/ocr/extract-date";
import { extractTime as extractTimeGeneric } from "@/lib/receipt/ocr/extract-time";
import { TR_CONFIG } from "./TR.config";
import { TH_CONFIG } from "./TH.config";
import { ID_CONFIG } from "./ID.config";
import { TW_CONFIG } from "./TW.config";
import { AE_CONFIG } from "./AE.config";
import { IN_CONFIG } from "./IN.config";
import { US_CONFIG } from "./US.config";
import { CA_CONFIG } from "./CA.config";
import { MX_CONFIG } from "./MX.config";
import { BR_CONFIG } from "./BR.config";
import { PH_CONFIG } from "./PH.config";
import { VN_CONFIG } from "./VN.config";
import { SG_CONFIG } from "./SG.config";
import { MY_CONFIG } from "./MY.config";
import { ZA_CONFIG } from "./ZA.config";
import { NG_CONFIG } from "./NG.config";
import { RU_CONFIG } from "./RU.config";
import { UA_CONFIG } from "./UA.config";
import { KZ_CONFIG } from "./KZ.config";
import { CN_CONFIG } from "./CN.config";
import { GENERIC_CONFIG } from "./GENERIC.config";
import { extractTurkishVAT } from "./TR/vat";
import { extractThaiVAT } from "./TH/vat";
import { extractIndonesianVAT } from "./ID/vat";
import { extractMalaysiaSST } from "./MY/vat";
import { selectTurkishTotalCandidate } from "./TR/total";
import { extractTurkishDate, extractTurkishTime } from "./TR/date-time";
import { selectUsTotalCandidate } from "./US/total";
import { extractUsMerchant } from "./US/merchant";
import { extractUsAddress } from "./US/address";
import { extractUsDate, extractUsTime } from "./US/date-time";
import { extractUsVAT } from "./US/vat";
import { extractUsServiceCharge } from "./US/service-charge";
import { extractIndonesianMerchant } from "./ID/merchant";
import { extractIndonesianAddress } from "./ID/address";
import { extractIndonesianDate, extractIndonesianTime } from "./ID/date-time";
import { resolveTurkishDocumentProfile } from "./TR/document-profile";
import {
  extractTurkishMerchant,
  postProcessTurkishExtraction,
  shouldUseTurkishTemplateTotalVat,
} from "./TR/base-extraction";
import { extractTurkishAddress } from "./TR/address";
import { extractThaiDate, extractThaiTime } from "./TH/date-time";

const countryConfigs: Record<CountryCode, CountryConfig> = {
  TR: TR_CONFIG,
  TH: TH_CONFIG,
  ID: ID_CONFIG,
  TW: TW_CONFIG,
  AE: AE_CONFIG,
  IN: IN_CONFIG,
  US: US_CONFIG,
  CA: CA_CONFIG,
  MX: MX_CONFIG,
  BR: BR_CONFIG,
  PH: PH_CONFIG,
  VN: VN_CONFIG,
  SG: SG_CONFIG,
  MY: MY_CONFIG,
  ZA: ZA_CONFIG,
  NG: NG_CONFIG,
  RU: RU_CONFIG,
  UA: UA_CONFIG,
  KZ: KZ_CONFIG,
  CN: CN_CONFIG,
  GENERIC: GENERIC_CONFIG,
};

const detectionOrder: CountryCode[] = [
  "TR",
  "TH",
  "ID",
  "TW",
  "AE",
  "IN",
  "US",
  "CA",
  "MX",
  "BR",
  "PH",
  "VN",
  "SG",
  "MY",
  "ZA",
  "NG",
  "RU",
  "UA",
  "KZ",
  "CN",
];

/** Kept in sync with US_CONFIG: state postal line is a strong address signal. */
const US_STATE_ZIP_ADDRESS_PATTERN =
  /\b(?:AL|AK|AZ|AR|CA|CO|CT|DC|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\s+\d{5}(?:-\d{4})?\b/i;

const CA_POSTAL_ADDRESS_PATTERN =
  /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][\s-]?\d[ABCEGHJ-NPRSTV-Z]\d\b/i;

const TR_ADDRESS_HINT_PATTERN =
  /\b(?:mahallesi|mah\.|cadde|cad\.|sokak|sok\.|sokağı|bulvar|blv\.)\b|\bvergi\s+dairesi\b/i;

/**
 * Vietnamese address tokens — very distinctive (Phường, Quận, Nguyễn, Trần, etc.)
 * Check before US/CA to prevent false matches on common 2-letter abbreviations.
 */
const VN_ADDRESS_HINT_PATTERN =
  /\b(?:Phường|Phuong|Quận|Huyện|Huyen|Thành\s*phố|Thanh\s*pho|TP\.?\s*HCM|Đà\s*Nẵng|Da\s*Nang|Hà\s*Nội|Ha\s*Noi|Hồ\s*Chí\s*Minh|Ho\s*Chi\s*Minh|Nguyễn|Tran|Nguyen|MST\s*:)\b/i;

function detectCountryFromAddressHints(text: string): CountryCode | null {
  // Turkish address tokens first — VN hint regex includes short ASCII tokens (e.g. Tran, MST:)
  // that can false-positive on Turkish OCR; TR receipts often contain Mah./cadde/etc.
  if (TR_ADDRESS_HINT_PATTERN.test(text)) return "TR";
  // Vietnamese address tokens — check before US/CA abbreviation patterns
  if (VN_ADDRESS_HINT_PATTERN.test(text)) return "VN";
  if (US_STATE_ZIP_ADDRESS_PATTERN.test(text)) return "US";
  if (CA_POSTAL_ADDRESS_PATTERN.test(text)) return "CA";
  return null;
}

/** For tier-2 currency scan: exclude TH patterns that are locale/brand hints, not money. */
function isThCurrencyOnlyPattern(pattern: RegExp): boolean {
  const s = pattern.source;
  if (/\bthai\b/i.test(s) && !/baht|thb|฿/i.test(s)) return false;
  if (/\bthailand\b/i.test(s)) return false;
  if (/\bpattaya\b|\bbangkok\b|\bphuket\b|\bchiang\s*mai\b/i.test(s)) return false;
  if (/starbucks/i.test(s)) return false;
  if (/tax\s+id/i.test(s)) return false;
  return true;
}

/** For tier-2: TR fiscal/label patterns belong in the indicator pass, not currency. */
function isTrCurrencyOnlyPattern(pattern: RegExp): boolean {
  const s = pattern.source;
  return /₺|try|tl|türk|lira/i.test(s);
}

function detectCountryFromCurrencyHints(text: string): CountryCode | null {
  const lowerText = text.toLowerCase();
  for (const code of detectionOrder) {
    const config = countryConfigs[code];
    for (const pattern of config.detection.currencyIndicators) {
      if (code === "TH" && !isThCurrencyOnlyPattern(pattern)) continue;
      if (code === "TR" && !isTrCurrencyOnlyPattern(pattern)) continue;
      if (pattern.test(lowerText)) {
        return code;
      }
    }
  }
  return null;
}

function detectCountryFromOrderedIndicators(text: string): CountryCode {
  const lowerText = text.toLowerCase();
  for (const code of detectionOrder) {
    const config = countryConfigs[code];
    for (const pattern of config.detection.countryIndicators) {
      if (pattern.test(lowerText)) {
        return code;
      }
    }
  }
  return "GENERIC";
}

/** True when OCR text clearly describes a Turkish fiscal receipt (override false CA/US). */
function hasStrongTurkishReceiptSignals(text: string): boolean {
  const lower = text.toLowerCase();
  for (const pattern of TR_CONFIG.detection.countryIndicators) {
    if (pattern.test(lower)) return true;
  }
  if (/₺/.test(text)) return true;
  if (/\btry\b/i.test(lower)) return true;
  if (/\d[.,]\d{2}\s*tl\b/i.test(lower)) return true;
  return false;
}

function createDefaultProfile(config: CountryConfig): CountryProfile {
  const getMerchantOptions = (context: Parameters<NonNullable<CountryProfile["strategies"]["getMerchantOptions"]>>[0]) => {
    const documentProfile = (context as any).documentProfile;
    return {
      isPosSlip: documentProfile === "pos-slip" || !!(context as any).isPosSlip,
      isEfatura: documentProfile === "efatura" || !!(context as any).isEcommerceEfatura,
    };
  };

  return {
    config,
    strategies: {
      extractVat: (context) => {
        const vatExtraction = extractVATRobust(context.ocrLines, context.totalPaid, config);
        return {
          amount: vatExtraction.value || 0,
          rate: vatExtraction.rate,
        };
      },
      getMerchantOptions,
      extractMerchant: (context) => extractMerchantGeneric(context.ocrLines, getMerchantOptions(context)),
      extractAddress: (context) => extractAddressGeneric(context.ocrLines),
      extractDate: (context) => extractDateGeneric(context.ocrLines, config),
      extractTime: (context, dateExtraction) => {
        const dateLineIndex =
          dateExtraction.sourceLine != null
            ? context.ocrLines.findIndex((line) => line.lineNo === dateExtraction.sourceLine)
            : undefined;
        return extractTimeGeneric(
          context.ocrLines,
          config,
          typeof dateLineIndex === "number" && dateLineIndex >= 0 ? dateLineIndex : undefined,
          dateExtraction.confidence > 0.3 ? dateExtraction.value : undefined
        );
      },
      documentProfileResolver: () => "receipt",
      postProcessExtraction: () => {},
    },
  };
}

const countryProfiles: Record<CountryCode, CountryProfile> = {
  TR: {
    ...createDefaultProfile(TR_CONFIG),
    strategies: {
      ...createDefaultProfile(TR_CONFIG).strategies,
      extractVat: extractTurkishVAT,
      extractTotal: selectTurkishTotalCandidate,
      extractMerchant: extractTurkishMerchant,
      extractAddress: extractTurkishAddress,
      extractDate: extractTurkishDate,
      extractTime: extractTurkishTime,
      shouldUseTemplateTotalVat: shouldUseTurkishTemplateTotalVat,
      postProcessExtraction: postProcessTurkishExtraction,
      documentProfileResolver: resolveTurkishDocumentProfile,
    },
  },
  TH: {
    ...createDefaultProfile(TH_CONFIG),
    strategies: {
      ...createDefaultProfile(TH_CONFIG).strategies,
      extractVat: extractThaiVAT,
      extractDate: extractThaiDate,
      extractTime: extractThaiTime,
    },
  },
  ID: {
    ...createDefaultProfile(ID_CONFIG),
    strategies: {
      ...createDefaultProfile(ID_CONFIG).strategies,
      extractVat: extractIndonesianVAT,
      extractMerchant: extractIndonesianMerchant,
      extractAddress: extractIndonesianAddress,
      extractDate: extractIndonesianDate,
      extractTime: extractIndonesianTime,
    },
  },
  TW: createDefaultProfile(TW_CONFIG),
  AE: createDefaultProfile(AE_CONFIG),
  IN: createDefaultProfile(IN_CONFIG),
  US: {
    ...createDefaultProfile(US_CONFIG),
    strategies: {
      ...createDefaultProfile(US_CONFIG).strategies,
      extractVat: extractUsVAT,
      extractServiceCharge: extractUsServiceCharge,
      extractTotal: selectUsTotalCandidate,
      extractMerchant: extractUsMerchant,
      extractAddress: extractUsAddress,
      extractDate: extractUsDate,
      extractTime: extractUsTime,
    },
  },
  CA: createDefaultProfile(CA_CONFIG),
  MX: createDefaultProfile(MX_CONFIG),
  BR: createDefaultProfile(BR_CONFIG),
  PH: createDefaultProfile(PH_CONFIG),
  VN: createDefaultProfile(VN_CONFIG),
  SG: createDefaultProfile(SG_CONFIG),
  MY: {
    ...createDefaultProfile(MY_CONFIG),
    strategies: {
      ...createDefaultProfile(MY_CONFIG).strategies,
      extractVat: extractMalaysiaSST,
    },
  },
  ZA: createDefaultProfile(ZA_CONFIG),
  NG: createDefaultProfile(NG_CONFIG),
  RU: createDefaultProfile(RU_CONFIG),
  UA: createDefaultProfile(UA_CONFIG),
  KZ: createDefaultProfile(KZ_CONFIG),
  CN: createDefaultProfile(CN_CONFIG),
  GENERIC: createDefaultProfile(GENERIC_CONFIG),
};

export function isSupportedCountryCode(code: string): code is CountryCode {
  return code in countryProfiles;
}

export function resolveCountryCode(
  ocrDetectedCountry: CountryCode,
  userCountry: string | null | undefined
): CountryCode {
  if (ocrDetectedCountry !== "GENERIC") {
    return ocrDetectedCountry;
  }

  const normalizedUserCountry = (userCountry || "").trim().toUpperCase();
  if (isSupportedCountryCode(normalizedUserCountry)) {
    return normalizedUserCountry;
  }

  return "GENERIC";
}

/**
 * Backward-compatible accessor for config-only consumers.
 */
export function getCountryConfig(code: CountryCode): CountryConfig {
  const profile = countryProfiles[code];
  if (!profile) {
    throw new Error(
      `Unsupported country: ${code}. Only ${Object.keys(countryProfiles).join(", ")} are supported.`
    );
  }
  return profile.config;
}

export function getCountryProfile(code: CountryCode): CountryProfile {
  const profile = countryProfiles[code];
  if (!profile) {
    throw new Error(
      `Unsupported country: ${code}. Only ${Object.keys(countryProfiles).join(", ")} are supported.`
    );
  }
  return profile;
}

/**
 * Detect country from OCR text: (1) address-like signals, (2) currency indicators,
 * (3) configured countryIndicators in detection order. Falls back to GENERIC.
 */
export function detectCountryFromText(text: string): CountryCode {
  const fromAddress = detectCountryFromAddressHints(text);
  if (fromAddress) {
    if ((fromAddress === "CA" || fromAddress === "US") && hasStrongTurkishReceiptSignals(text)) return "TR";
    return fromAddress;
  }

  const fromCurrency = detectCountryFromCurrencyHints(text);
  if (fromCurrency) {
    if ((fromCurrency === "CA" || fromCurrency === "US") && hasStrongTurkishReceiptSignals(text)) return "TR";
    return fromCurrency;
  }

  const fromIndicators = detectCountryFromOrderedIndicators(text);
  if ((fromIndicators === "CA" || fromIndicators === "US") && hasStrongTurkishReceiptSignals(text)) return "TR";
  return fromIndicators;
}
