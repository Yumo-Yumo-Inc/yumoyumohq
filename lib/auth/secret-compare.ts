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
function safeCompareSecret(a: string, b: string): boolean {
  return timingSafeEqual(hashString(a), hashString(b));
}

type CronAuthFailure =
  | "secret-not-configured"
  | "authorization-header-missing"
  | "authorization-header-mismatch";

function requestPath(req: Request): string {
  try {
    return new URL(req.url).pathname;
  } catch {
    return "unknown";
  }
}

function logCronAuthFailure(req: Request, reason: CronAuthFailure): void {
  const source = (req.headers.get("user-agent") ?? "").startsWith("vercel-cron/")
    ? "vercel-cron"
    : "external";
  const message = `[cron/auth] rejected path=${requestPath(req)} reason=${reason} source=${source}`;

  if (reason === "secret-not-configured") {
    console.error(message);
    return;
  }
  console.warn(message);
}

/**
 * Validate a Bearer token from an Authorization header against an expected secret.
 * Returns false immediately if the secret is not configured.
 *
 * Failure logs contain only the route, reason category, and caller class.
 * Header and secret values are never logged.
 */
export function checkBearerSecret(
  req: Request,
  secret: string | undefined
): boolean {
  if (!secret) {
    logCronAuthFailure(req, "secret-not-configured");
    return false;
  }
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) {
    logCronAuthFailure(req, "authorization-header-missing");
    return false;
  }
  const matches = safeCompareSecret(authHeader, `Bearer ${secret}`);
  if (!matches) {
    logCronAuthFailure(req, "authorization-header-mismatch");
  }
  return matches;
}
