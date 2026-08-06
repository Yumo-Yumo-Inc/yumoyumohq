import { NextResponse } from "next/server";
import { extractRefFromParams } from "@/lib/referral/referral-link";

/**
 * Short referral link: `/r/<username>` → `/app/register?ref=<username>`.
 * Keeps shared URLs clean for social posts. Invalid codes fall through to the
 * plain register page (no ref) rather than erroring.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  // Some share targets glue extra text onto the URL ("/r/mark Build price…").
  // Salvage the leading run of valid username characters so a mangled link
  // still carries its ref instead of falling back to a ref-less signup.
  const leading = (code ?? "").trim().match(/^[a-zA-Z0-9._-]+/)?.[0] ?? "";
  const ref = extractRefFromParams(new URLSearchParams([["ref", leading]]));

  const target = new URL("/app/register", req.url);
  if (ref) target.searchParams.set("ref", ref);
  return NextResponse.redirect(target);
}
