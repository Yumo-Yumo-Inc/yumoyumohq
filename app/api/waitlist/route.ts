import { NextResponse } from "next/server";

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      country,
      referralSource,
      marketingConsent,
      consentVersion,
      consentedAt,
      locale,
    } = body;

    // Validation
    if (!email || !country || !referralSource) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Trim whitespace
    const trimmedEmail = email.trim();
    const trimmedCountry = country.trim();
    const trimmedReferralSource = referralSource.trim();
    const normalizedMarketingConsent = marketingConsent === true;
    const normalizedConsentVersion = typeof consentVersion === "string" ? consentVersion.trim() : "";
    const normalizedConsentedAt = typeof consentedAt === "string" ? consentedAt.trim() : "";
    const normalizedLocale = typeof locale === "string" ? locale.trim() : "";

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if Google Apps Script URL is configured
    if (!GOOGLE_APPS_SCRIPT_URL) {
      console.error("[api/waitlist] GOOGLE_APPS_SCRIPT_URL not configured");
      return NextResponse.json(
        { success: false, error: "Waitlist service not configured" },
        { status: 500 }
      );
    }

    // Send to Google Apps Script
    const scriptResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: trimmedEmail,
        country: trimmedCountry,
        referralSource: trimmedReferralSource,
        marketingConsent: normalizedMarketingConsent,
        consentVersion: normalizedConsentVersion,
        consentedAt: normalizedConsentedAt,
        locale: normalizedLocale,
        consentSource: "waitlist_modal",
      }),
    });

    if (!scriptResponse.ok) {
      const errorText = await scriptResponse.text();
      console.error("[api/waitlist] Google Apps Script error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to add to waitlist",
          details: errorText,
        },
        { status: 500 }
      );
    }

    const scriptData = await scriptResponse.json();

    if (!scriptData.success) {
      return NextResponse.json(
        {
          success: false,
          error: scriptData.error || "Failed to add to waitlist",
          details: scriptData.details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/waitlist] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.json(
    { message: "Waitlist API is running" },
    { status: 200 }
  );
}
