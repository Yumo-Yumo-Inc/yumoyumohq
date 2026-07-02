import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";

export const SESSION_COOKIE_NAME = "app_session";
export const REFRESH_COOKIE_NAME = "app_refresh";

const ALGORITHM = "HS256";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const SESSION_REFRESH_WINDOW_SECONDS = 60 * 60 * 24;
const REFRESH_ROTATE_WINDOW_SECONDS = 60 * 60 * 24 * 30;
const developmentSecret = randomBytes(32);

type TokenKind = "session" | "refresh";

export interface AppSessionPayload {
  username: string;
  emailVerified: boolean;
}

export interface VerifiedTokenPayload extends AppSessionPayload {
  kind: TokenKind;
  expiresAt: number;
  issuedAt: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    return developmentSecret;
  }
  return new TextEncoder().encode(secret);
}

async function signAuthToken(
  payload: AppSessionPayload,
  kind: TokenKind,
  maxAgeSeconds: number
): Promise<string> {
  return new SignJWT({ ev: payload.emailVerified, typ: kind })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(payload.username)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecret());
}

async function readAuthToken(raw: string, expectedKind: TokenKind): Promise<VerifiedTokenPayload | null> {
  try {
    if (!raw || raw.split(".").length !== 3) {
      return null;
    }

    const { payload } = await jwtVerify(raw, getSecret());
    const username = payload.sub;
    const kind = payload.typ;
    const exp = payload.exp;
    const iat = payload.iat;

    if (!username || typeof username !== "string") {
      return null;
    }
    if (kind !== expectedKind) {
      return null;
    }
    if (typeof exp !== "number" || typeof iat !== "number") {
      return null;
    }

    return {
      username,
      emailVerified: payload.ev === true,
      kind: expectedKind,
      expiresAt: exp,
      issuedAt: iat,
    };
  } catch {
    return null;
  }
}

function secondsUntilExpiration(expiresAt: number): number {
  return expiresAt - Math.floor(Date.now() / 1000);
}

function shouldUseSecureCookies(isProduction: boolean): boolean {
  return isProduction || process.env.NODE_ENV !== "development" || process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
}

function buildBaseCookieOptions(name: string, maxAge: number, isProduction: boolean) {
  return {
    name,
    path: "/",
    maxAge,
    httpOnly: true,
    // `lax` (not `strict`) so the session cookie is carried on top-level
    // cross-site GET navigations — e.g. when the user clicks the email
    // verification link from Gmail, the WAF allowlist sees the cookie and
    // lets the request through to /api/auth/verify-email. `strict` would
    // strip the cookie on that navigation and the WAF returns 403
    // (`X-Proxy-Error: blocked-by-allowlist`). CSRF defense is handled
    // separately by the `app_csrf` cookie which remains `SameSite=Strict`.
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(isProduction),
    ...(isProduction ? { domain: ".yumoyumo.com" } : {}),
  };
}

export async function signSessionToken(payload: AppSessionPayload): Promise<string> {
  return signAuthToken(payload, "session", SESSION_MAX_AGE_SECONDS);
}

export async function signRefreshToken(payload: AppSessionPayload): Promise<string> {
  return signAuthToken(payload, "refresh", REFRESH_MAX_AGE_SECONDS);
}

export async function readSessionToken(raw: string): Promise<VerifiedTokenPayload | null> {
  return readAuthToken(raw, "session");
}

export async function readRefreshToken(raw: string): Promise<VerifiedTokenPayload | null> {
  return readAuthToken(raw, "refresh");
}

export async function verifySessionToken(raw: string): Promise<AppSessionPayload | null> {
  const token = await readSessionToken(raw);
  return token
    ? {
        username: token.username,
        emailVerified: token.emailVerified,
      }
    : null;
}

export async function verifyRefreshToken(raw: string): Promise<AppSessionPayload | null> {
  const token = await readRefreshToken(raw);
  return token
    ? {
        username: token.username,
        emailVerified: token.emailVerified,
      }
    : null;
}

export function shouldRefreshSessionToken(token: Pick<VerifiedTokenPayload, "expiresAt">): boolean {
  return secondsUntilExpiration(token.expiresAt) <= SESSION_REFRESH_WINDOW_SECONDS;
}

export function shouldRotateRefreshToken(token: Pick<VerifiedTokenPayload, "expiresAt">): boolean {
  return secondsUntilExpiration(token.expiresAt) <= REFRESH_ROTATE_WINDOW_SECONDS;
}

export function buildCookieOptions(isProduction: boolean) {
  return buildBaseCookieOptions(SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, isProduction);
}

export function buildRefreshCookieOptions(isProduction: boolean) {
  return buildBaseCookieOptions(REFRESH_COOKIE_NAME, REFRESH_MAX_AGE_SECONDS, isProduction);
}
