/**
 * Admin panel step-up authentication ("second door").
 *
 * Being a logged-in admin is not enough to enter the admin panel: the user must
 * re-authenticate with a dedicated panel password (`ADMIN_PANEL_PASSWORD`). On
 * success a short-lived, signed unlock token is stored in an httpOnly cookie.
 * The server layout (page area) and the middleware (`/api/admin/*` data layer)
 * both require a valid unlock token, so a stolen session alone cannot open the
 * panel or call its APIs.
 *
 * This module is edge-safe: it only depends on `jose` and pure functions so it
 * can be imported from middleware. Node-only primitives (constant-time compare)
 * live in the unlock route, which runs in the Node runtime.
 */
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_UNLOCK_COOKIE = "admin_unlock";
export const ADMIN_UNLOCK_TTL_SECONDS = 30 * 60; // 30 minutes

const ALGORITHM = "HS256";
const TOKEN_KIND = "admin_unlock";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  // Development-only fallback; never used in production (throws above).
  return new TextEncoder().encode("dev-insecure-admin-unlock-secret");
}

/** Issue a signed unlock token bound to the admin username. */
export async function signAdminUnlockToken(username: string): Promise<string> {
  return new SignJWT({ typ: TOKEN_KIND })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_UNLOCK_TTL_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verify an unlock token. Returns the bound username, or null if the token is
 * missing, malformed, expired, of the wrong kind, or (when `expectedUsername`
 * is given) bound to a different user.
 */
export async function verifyAdminUnlockToken(
  raw: string | undefined | null,
  expectedUsername?: string
): Promise<{ username: string } | null> {
  if (!raw || raw.split(".").length !== 3) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(raw, getSecret());
    const username = payload.sub;
    if (typeof username !== "string" || !username) {
      return null;
    }
    if (payload.typ !== TOKEN_KIND) {
      return null;
    }
    if (expectedUsername && username !== expectedUsername) {
      return null;
    }
    return { username };
  } catch {
    return null;
  }
}

/** Whether the panel password is configured at all (fail-closed if not). */
export function isAdminPanelPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PANEL_PASSWORD);
}

function shouldUseSecureCookies(): boolean {
  return (
    process.env.NODE_ENV !== "development" ||
    process.env.VERCEL === "1" ||
    !!process.env.VERCEL_ENV
  );
}

/** Cookie options for the unlock cookie (mirrors session cookie domain handling). */
export function buildAdminUnlockCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: ADMIN_UNLOCK_COOKIE,
    path: "/",
    maxAge: ADMIN_UNLOCK_TTL_SECONDS,
    httpOnly: true,
    // Admin panel is never reached via cross-site navigation, so the strictest
    // policy applies here (unlike the session cookie which must be `lax`).
    sameSite: "strict" as const,
    secure: shouldUseSecureCookies(),
    ...(isProduction ? { domain: ".yumoyumo.com" } : {}),
  };
}
