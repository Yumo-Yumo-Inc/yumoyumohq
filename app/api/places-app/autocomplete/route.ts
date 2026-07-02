import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { autocomplete } from "@/lib/google/placesNewClient";

export const dynamic = "force-dynamic";

/**
 * In-app autocomplete proxy.
 * Backend: Places API (New) via lib/google/placesNewClient.
 * Session required — billable Google Places proxy. The per-IP rate limit in
 * proxy.ts is defense-in-depth; auth is the primary guard against billing abuse.
 */
export async function GET(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_PLACES_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    const data = await autocomplete(q, { types: ["establishment"] });

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: `Places API error: ${data.status}`, details: data.error_message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      suggestions: data.predictions || [],
    });
  } catch (error: any) {
    console.error("[api/places-app/autocomplete] error:", error);
    return NextResponse.json(
      { error: "Failed to process autocomplete request" },
      { status: 500 }
    );
  }
}
