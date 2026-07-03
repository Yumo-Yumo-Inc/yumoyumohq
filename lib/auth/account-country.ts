"use client";

import { normalizeCountryCode } from "@/lib/shared/countries";

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
  return normalizeCountryCode(data.country);
}
