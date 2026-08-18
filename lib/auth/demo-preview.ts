import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { DEMO_PREVIEW_COOKIE, DEMO_USERNAME, DEMO_PREVIEW_MUTATION_ALLOWLIST } from "@/lib/demo/constants";

export { DEMO_PREVIEW_COOKIE, DEMO_USERNAME };

export async function isDemoPreview(): Promise<boolean> {
  try {
    const store = await cookies();
    return store.get(DEMO_PREVIEW_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}

export function applyDemoPreviewCookie(response: NextResponse, active: boolean): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: DEMO_PREVIEW_COOKIE,
    value: active ? "1" : "",
    path: "/",
    maxAge: active ? 60 * 60 * 24 * 7 : 0,
    sameSite: "lax",
    secure: isProduction,
    httpOnly: false,
  });
}

export function isDemoPreviewMutationAllowed(pathname: string): boolean {
  return (DEMO_PREVIEW_MUTATION_ALLOWLIST as readonly string[]).includes(pathname);
}
