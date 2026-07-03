"use client";

import { patchCachedProfileFields } from "@/lib/offline/cache";
import { normalizeCountryCode } from "@/lib/shared/countries";

const COUNTRY_RETRY_ATTEMPTS = 5;
const COUNTRY_RETRY_BASE_MS = 200;

let sessionAccountCountry: string | null = null;

/** In-memory country for this browser session — wins over stale IndexedDB writes. */
export function getSessionAccountCountry(): string | null {
  return sessionAccountCountry;
}

export function resetSessionAccountCountry(): void {
  sessionAccountCountry = null;
}

export function setSessionAccountCountry(country: string | null): void {
  sessionAccountCountry = country ? normalizeCountryCode(country) : null;
}

/** Live account country from the server — never read from IndexedDB for this call. */
export async function fetchAccountCountryFromApi(): Promise<string | null> {
  const response = await fetch("/api/auth/country", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { country?: string | null };
  const country = normalizeCountryCode(data.country);
  if (country) {
    setSessionAccountCountry(country);
  }
  return country;
}

export async function fetchAccountCountryWithRetry(): Promise<string | null> {
  for (let attempt = 0; attempt < COUNTRY_RETRY_ATTEMPTS; attempt++) {
    const country = await fetchAccountCountryFromApi();
    if (country) {
      return country;
    }
    if (attempt < COUNTRY_RETRY_ATTEMPTS - 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, COUNTRY_RETRY_BASE_MS * (attempt + 1));
      });
    }
  }
  return null;
}

/** Fetch server country and force-write it into IndexedDB before profile UI reads cache. */
export async function syncSessionAccountCountryToCache(): Promise<string | null> {
  const country = await fetchAccountCountryWithRetry();
  if (country) {
    await patchCachedProfileFields({ country });
  }
  return country;
}
