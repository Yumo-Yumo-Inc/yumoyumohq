import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { mapPlacesTypesToCategory } from "@/lib/receipt/calculations";
import { placeDetails } from "@/lib/google/placesNewClient";

export const dynamic = "force-dynamic";

/**
 * In-app place details proxy.
 * Backend: Places API (New) via lib/google/placesNewClient.
 * Session required — this is a billable Google Places proxy; anonymous access
 * would allow an unbounded billing-abuse loop.
 */
export async function GET(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return NextResponse.json(
        { error: "placeId parameter is required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_PLACES_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    const data = await placeDetails(placeId, {
      fields: ["name", "place_id", "types", "address_components", "formatted_address", "price_level"],
    });

    if (data.status !== "OK" || !data.result) {
      return NextResponse.json(
        { error: `Places API error: ${data.status}`, details: data.error_message },
        { status: 400 }
      );
    }

    const result = data.result;
    const category = mapPlacesTypesToCategory(result.types || []);

    let countryCode: string | undefined;
    const countryComponent = result.address_components?.find(
      (comp) => comp.types && comp.types.includes("country")
    );
    if (countryComponent) {
      countryCode = countryComponent.short_name;
    }

    return NextResponse.json({
      name: result.name,
      placeId: result.place_id,
      types: result.types || [],
      category,
      country: countryCode,
      formattedAddress: result.formatted_address,
      priceLevel: result.price_level,
    });
  } catch (error: any) {
    console.error("[api/places-app/details] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
