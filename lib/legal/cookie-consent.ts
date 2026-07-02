export const COOKIE_CONSENT_KEY = "yumo-cookie-consent";
export const COOKIE_CONSENT_VERSION = "2026-04-20";
export const COOKIE_CONSENT_CHANGE_EVENT = "yumo-cookie-consent-change";
export const COOKIE_CONSENT_OPEN_EVENT = "yumo-cookie-consent-open";

/**
 * Mirror of the analytics consent decision into a cookie so the server can
 * read it (consent itself lives in localStorage, which the server cannot see).
 * Value is "1" when analytics consent is granted, "0" otherwise.
 */
export const ANALYTICS_CONSENT_COOKIE = "yumo-analytics-consent";

export type CookieConsentStatus = "accepted" | "rejected" | "customized";

export type CookieConsentPreferences = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

export type CookieConsent = {
  version: string;
  status: CookieConsentStatus;
  preferences: CookieConsentPreferences;
  updatedAt: string;
};

const NECESSARY_ONLY: CookieConsentPreferences = {
  necessary: true,
  functional: false,
  analytics: false,
};

export function isGlobalPrivacyControlEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function normalizeCookiePreferences(preferences: Partial<CookieConsentPreferences>): CookieConsentPreferences {
  return {
    necessary: true,
    functional: preferences.functional === true,
    analytics: isGlobalPrivacyControlEnabled() ? false : preferences.analytics === true,
  };
}

export function buildCookieConsent(
  status: CookieConsentStatus,
  preferences: Partial<CookieConsentPreferences>
): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    status,
    preferences: normalizeCookiePreferences(preferences),
    updatedAt: new Date().toISOString(),
  };
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.version !== COOKIE_CONSENT_VERSION || !parsed.preferences) {
      return null;
    }

    return {
      version: COOKIE_CONSENT_VERSION,
      status: parsed.status === "accepted" || parsed.status === "rejected" || parsed.status === "customized"
        ? parsed.status
        : "rejected",
      preferences: normalizeCookiePreferences(parsed.preferences),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
    return null;
  }
}

export function saveCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;
  const normalized = {
    ...consent,
    preferences: normalizeCookiePreferences(consent.preferences),
    updatedAt: consent.updatedAt || new Date().toISOString(),
  };
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(normalized));
  writeAnalyticsConsentCookie(normalized.preferences.analytics);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: normalized }));
}

/**
 * Writes the server-readable analytics consent cookie. SameSite=Lax, 1-year
 * lifetime, not HttpOnly (it must be set from client-side JS).
 */
function writeAnalyticsConsentCookie(granted: boolean): void {
  if (typeof document === "undefined") return;
  const maxAge = granted ? 60 * 60 * 24 * 365 : 0;
  const value = granted ? "1" : "0";
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.preferences.analytics === true;
}

/**
 * Server-safe analytics consent check. Parses the request Cookie header for the
 * mirrored {@link ANALYTICS_CONSENT_COOKIE}. Returns false when the cookie is
 * absent, so the default (no decision yet, or consent withdrawn) is "no analytics".
 */
export function analyticsConsentFromCookieHeader(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(";")
    .some((part) => part.trim() === `${ANALYTICS_CONSENT_COOKIE}=1`);
}

export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}

export function getNecessaryOnlyCookieConsent(status: CookieConsentStatus = "rejected"): CookieConsent {
  return buildCookieConsent(status, NECESSARY_ONLY);
}

