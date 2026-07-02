/**
 * Base URL for links inside transactional emails (verify email, password reset).
 *
 * - Production: set `APP_BASE_URL` to your public site (e.g. on Vercel).
 * - Sending from a dev machine to a real inbox: set `VERIFICATION_EMAIL_BASE_URL`
 *   to the production URL so links work while `APP_BASE_URL` can stay localhost.
 */
export function getEmailLinkBaseUrl(): string {
  const raw =
    process.env.VERIFICATION_EMAIL_BASE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (!raw) {
    return "http://localhost:3000";
  }
  return raw.replace(/\/+$/, "");
}
