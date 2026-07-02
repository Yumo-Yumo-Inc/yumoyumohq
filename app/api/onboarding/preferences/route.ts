import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { saveOnboardingPreferences } from "@/lib/onboarding/preferences";

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Validation
  if (!body.display_name || body.display_name.trim().length < 2) {
    return NextResponse.json({ error: "display_name required" }, { status: 400 });
  }

  if (body.display_name.trim().length > 50) {
    return NextResponse.json({ error: "display_name too long" }, { status: 400 });
  }

  if (body.age != null && (typeof body.age !== "number" || body.age < 13 || body.age > 99)) {
    return NextResponse.json({ error: "invalid age" }, { status: 400 });
  }

  await saveOnboardingPreferences(username, {
    display_name: body.display_name,
    age: body.age ?? null,
    gender: body.gender ?? null,
    country: body.country ?? null,
    monthly_income_range: body.monthly_income_range ?? null,
    why_yumo_reasons: Array.isArray(body.why_yumo_reasons) ? body.why_yumo_reasons : [],
    tone_preference: body.tone_preference ?? "warm",
    notification_frequency: body.notification_frequency ?? "daily",
    onboarding_language: body.onboarding_language ?? "tr",
  });

  // Cookie sil
  const response = NextResponse.json({ success: true });
  response.cookies.set("onboarding_pending", "", { maxAge: 0, path: "/" });
  return response;
}
