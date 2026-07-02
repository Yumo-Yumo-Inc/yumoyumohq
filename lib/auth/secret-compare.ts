/**
 * Timing-safe secret comparison for cron and internal endpoints.
 *
 * Uses SHA-256 hashing to normalize both inputs to the same length before
 * calling timingSafeEqual, preventing timing-based secret enumeration.
 */
import { timingSafeEqual, createHash } from "crypto";

function hashString(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Compare two strings in constant time.
 * Always safe to call even when `a` and `b` differ in length.
 */
export function safeCompareSecret(a: string, b: string): boolean {
  return timingSafeEqual(hashString(a), hashString(b));
}

/**
 * Validate a Bearer token from an Authorization header against an expected secret.
 * Returns false immediately if the secret is not configured.
 */
export function checkBearerSecret(
  req: Request,
  secret: string | undefined
): boolean {
  if (!secret) return false;
  const authHeader = req.headers.get("authorization") ?? "";
  return safeCompareSecret(authHeader, `Bearer ${secret}`);
}
