/**
 * Referral link generation helpers.
 * Can be used server-side; link building is also safe client-side.
 */

/** sessionStorage key — persists ref across login/register navigation on mobile. */
export const REFERRAL_REF_STORAGE_KEY = "yumo_referral_ref";

/**
 * Build a referral registration URL for the given username.
 * @param username - The referrer's username
 * @param baseUrl  - Application base URL (e.g. https://app.yumoyumo.com)
 */
export function buildReferralLink(username: string, baseUrl: string): string {
  const url = new URL("/app/register", baseUrl);
  url.searchParams.set("ref", username);
  return url.toString();
}

/**
 * Extract the referrer username from a URL search params string (or URLSearchParams).
 * Returns null if no valid ref param is present.
 */
export function extractRefFromParams(
  params: URLSearchParams | string | null | undefined,
): string | null {
  if (!params) return null;
  const sp = typeof params === "string" ? new URLSearchParams(params) : params;
  const ref = sp.get("ref")?.trim();
  if (!ref || ref.length < 3 || ref.length > 32) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(ref)) return null;
  return ref;
}
