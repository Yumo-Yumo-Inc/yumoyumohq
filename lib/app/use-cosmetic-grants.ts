"use client";

/**
 * useCosmeticGrants — the caller's owned season-pass grant keys, fetched once and
 * shared across the app (module cache) so any surface can gate a season capability
 * with hasCapability(grants, feature) without its own request.
 */

import { useEffect, useState } from "react";

let cache: string[] | null = null;
let inFlight: Promise<string[]> | null = null;

function load(): Promise<string[]> {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;
  inFlight = fetch("/api/user/cosmetic-grants", { cache: "no-store", credentials: "include" })
    .then((r) => (r.ok ? r.json() : { grants: [] }))
    .then((d): string[] => {
      const g = Array.isArray(d?.grants) ? (d.grants as string[]) : [];
      cache = g;
      return g;
    })
    .catch((): string[] => {
      cache = [];
      return [];
    });
  inFlight.finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function useCosmeticGrants(): string[] {
  const [grants, setGrants] = useState<string[]>(cache ?? []);
  useEffect(() => {
    let alive = true;
    load().then((g) => alive && setGrants(g));
    return () => {
      alive = false;
    };
  }, []);
  return grants;
}
