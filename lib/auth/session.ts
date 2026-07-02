import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  buildCookieOptions,
  buildRefreshCookieOptions,
  readRefreshToken,
  readSessionToken,
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  shouldRefreshSessionToken,
  shouldRotateRefreshToken,
  signRefreshToken,
  signSessionToken,
} from "@/lib/auth/session-token";
import { getPasswordChangedAtEpoch } from "@/lib/storage/user-auth-storage";

export interface AppSessionState {
  username: string;
  emailVerified: boolean;
}

export interface SessionResolution {
  session: AppSessionState | null;
  source: "session" | "refresh" | null;
  shouldRefreshSession: boolean;
  shouldRotateRefresh: boolean;
}

function toSessionState(
  payload: { username: string; emailVerified: boolean } | null
): AppSessionState | null {
  if (!payload) return null;
  return {
    username: payload.username,
    emailVerified: payload.emailVerified,
  };
}

export async function getSessionResolution(): Promise<SessionResolution> {
  try {
    const cookieStore = await cookies();
    const sessionRaw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const refreshRaw = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    let sessionToken = sessionRaw ? await readSessionToken(sessionRaw) : null;
    let refreshToken = refreshRaw ? await readRefreshToken(refreshRaw) : null;

    // Invalidate any token issued before the user's last password change.
    // One lookup per request (PK-indexed, fail-open) covers both cookies.
    const probe = sessionToken ?? refreshToken;
    if (probe) {
      const changedAt = await getPasswordChangedAtEpoch(probe.username);
      if (changedAt != null) {
        if (sessionToken && sessionToken.issuedAt < changedAt - 1) sessionToken = null;
        if (refreshToken && refreshToken.issuedAt < changedAt - 1) refreshToken = null;
      }
    }

    if (sessionToken) {
      return {
        session: toSessionState(sessionToken),
        source: "session",
        shouldRefreshSession: shouldRefreshSessionToken(sessionToken),
        shouldRotateRefresh: refreshToken ? shouldRotateRefreshToken(refreshToken) : false,
      };
    }

    if (refreshToken) {
      return {
        session: toSessionState(refreshToken),
        source: "refresh",
        shouldRefreshSession: true,
        shouldRotateRefresh: true,
      };
    }

    return {
      session: null,
      source: null,
      shouldRefreshSession: false,
      shouldRotateRefresh: false,
    };
  } catch {
    return {
      session: null,
      source: null,
      shouldRefreshSession: false,
      shouldRotateRefresh: false,
    };
  }
}

export async function getSessionState(): Promise<AppSessionState | null> {
  const resolution = await getSessionResolution();
  return resolution.session;
}

export async function getSessionUsername(): Promise<string | null> {
  const session = await getSessionState();
  return session?.username ?? null;
}

export async function applySessionCookies(
  response: NextResponse,
  session: AppSessionState,
  options?: { issueRefresh?: boolean }
): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionToken = await signSessionToken(session);
  response.cookies.set({ ...buildCookieOptions(isProduction), value: sessionToken });

  if (options?.issueRefresh !== false) {
    const refreshToken = await signRefreshToken(session);
    response.cookies.set({ ...buildRefreshCookieOptions(isProduction), value: refreshToken });
  }
}

export function clearSessionCookies(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({ ...buildCookieOptions(isProduction), value: "", maxAge: 0 });
  response.cookies.set({ ...buildRefreshCookieOptions(isProduction), value: "", maxAge: 0 });
}

export { buildCookieOptions, buildRefreshCookieOptions };
