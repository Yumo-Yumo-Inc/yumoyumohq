import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { buildReferralLink } from "@/lib/referral/referral-link";

export async function GET() {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve canonical app URL. NEXT_PUBLIC_APP_URL / APP_BASE_URL must be set in
    // production; we fall back to the canonical production domain rather than the
    // deployment-specific *.vercel.app URL, which is unstable across deploys and
    // would break shared links the moment a new deploy lands. We also actively
    // ignore any localhost-shaped value when running in production so that a
    // misconfigured env var (e.g. `NEXT_PUBLIC_APP_URL=http://localhost:3000`
    // copy-pasted from .env.example) cannot leak localhost links to real users.
    const isProd = process.env.NODE_ENV === "production";
    const isLocalhostUrl = (u: string): boolean =>
      /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?:[:/]|$)/i.test(
        u.trim(),
      );
    const acceptable = (u: string | undefined): string | null => {
      const v = u?.trim();
      if (!v) return null;
      if (isProd && isLocalhostUrl(v)) return null;
      return v;
    };
    const envBase =
      acceptable(process.env.NEXT_PUBLIC_APP_URL) ||
      acceptable(process.env.APP_BASE_URL) ||
      acceptable(
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
          : undefined,
      );
    const baseUrl =
      envBase || (isProd ? "https://app.yumoyumo.com" : "http://localhost:3000");

    const link = buildReferralLink(username, baseUrl);
    return NextResponse.json({ link, username });
  } catch (err) {
    console.error("[api/referral/link] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
