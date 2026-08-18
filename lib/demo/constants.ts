/** Dedicated sample account shown during onboarding. Not a real person. */
export const DEMO_USERNAME = "yumo_demo";
export const DEMO_PASSWORD = "YumoDemo-2026";
export const DEMO_DISPLAY_NAME = "Deniz Yılmaz";
export const DEMO_EMAIL = "yumo_demo@test.local";
export const DEMO_CITY = "İstanbul";
export const DEMO_COUNTRY = "TR";
/** Tour flag only. Never swaps the signed-in username. */
export const DEMO_PREVIEW_COOKIE = "yy_demo_preview";
export const DEMO_TOUR_STEP_KEY = "yy_demo_tour_step";
export const DEMO_TOUR_ACTIVE_KEY = "yy_demo_tour_on";

function cookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return null;
}

export function hasDemoTourCookie(): boolean {
  return cookieValue(DEMO_PREVIEW_COOKIE) === "1";
}

export function setDemoTourCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_PREVIEW_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearDemoTourCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_PREVIEW_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function readTourActiveFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(DEMO_TOUR_ACTIVE_KEY) === "1") return true;
  } catch {
    // sessionStorage may be blocked
  }
  return hasDemoTourCookie();
}

export function writeTourActiveFlag(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) sessionStorage.setItem(DEMO_TOUR_ACTIVE_KEY, "1");
    else {
      sessionStorage.removeItem(DEMO_TOUR_ACTIVE_KEY);
      sessionStorage.removeItem(DEMO_TOUR_STEP_KEY);
    }
  } catch {
    // sessionStorage may be blocked
  }
  if (on) setDemoTourCookie();
  else clearDemoTourCookie();
}

/** Current-calendar-month spend the onboarding account must show. */
export const DEMO_MONTH_SPEND_TRY = 60_000;

/** History window so price-track / inflation / shrink layers can fire. */
export const DEMO_WINDOW_DAYS = 180;

export const DEMO_LINE_SOURCE = "demo_seed";

export const DEMO_PREVIEW_MUTATION_ALLOWLIST = [
  "/api/onboarding/preferences",
  "/api/demo/preview",
  "/api/auth/logout",
  "/api/auth/refresh",
] as const;
