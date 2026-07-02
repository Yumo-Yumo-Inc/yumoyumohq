import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_KEY = process.env.GOOGLE_PLACES_API_KEY;

describe("placesNewClient (adapter wrapper)", () => {
  beforeEach(() => {
    process.env.GOOGLE_PLACES_API_KEY = "test-key-xyz";
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    process.env.GOOGLE_PLACES_API_KEY = ORIGINAL_KEY;
  });

  // ─── textSearch ─────────────────────────────────────────────────────────

  it("textSearch posts to the New API endpoint with required headers", async () => {
    const mockFetch = vi.fn(async () => new Response(
      JSON.stringify({
        places: [{
          id: "ChIJabc",
          displayName: { text: "Bella Pasta" },
          types: ["restaurant"],
          addressComponents: [{ longText: "United States", shortText: "US", types: ["country"] }],
          formattedAddress: "223 Neuport Ave, Pawtucket, RI",
          location: { latitude: 41.87, longitude: -71.38 },
        }],
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));
    global.fetch = mockFetch as any;

    const { textSearch } = await import("../placesNewClient");
    const res = await textSearch("Bella Pasta Pawtucket");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:searchText");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Goog-Api-Key"]).toBe("test-key-xyz");
    expect(init.headers["X-Goog-FieldMask"]).toContain("places.id");
    expect(init.headers["X-Goog-FieldMask"]).toContain("places.displayName");

    const body = JSON.parse(init.body);
    expect(body.textQuery).toBe("Bella Pasta Pawtucket");
    expect(body.maxResultCount).toBe(10);

    // Adapter returns legacy shape
    expect(res.status).toBe("OK");
    expect(res.results).toHaveLength(1);
    expect(res.results[0].place_id).toBe("ChIJabc");
    expect(res.results[0].name).toBe("Bella Pasta");
    expect(res.results[0].address_components[0]).toEqual({
      long_name: "United States",
      short_name: "US",
      types: ["country"],
    });
    expect(res.results[0].geometry?.location).toEqual({ lat: 41.87, lng: -71.38 });
  });

  it("textSearch adds regionCode and locationBias when provided", async () => {
    const mockFetch = vi.fn(async () => new Response(
      JSON.stringify({ places: [] }),
      { status: 200 }
    ));
    global.fetch = mockFetch as any;

    const { textSearch } = await import("../placesNewClient");
    await textSearch("merchant", {
      region: "us",
      location: { lat: 41.87, lng: -71.38 },
      radius: 1000,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.regionCode).toBe("US");
    expect(body.locationBias).toEqual({
      circle: {
        center: { latitude: 41.87, longitude: -71.38 },
        radius: 1000,
      },
    });
  });

  it("textSearch returns ZERO_RESULTS when New API returns empty places", async () => {
    global.fetch = vi.fn(async () => new Response(
      JSON.stringify({ places: [] }),
      { status: 200 }
    )) as any;

    const { textSearch } = await import("../placesNewClient");
    const res = await textSearch("nonexistent");
    expect(res.status).toBe("ZERO_RESULTS");
    expect(res.results).toEqual([]);
  });

  it("textSearch maps HTTP 403 to REQUEST_DENIED", async () => {
    global.fetch = vi.fn(async () => new Response(
      "permission denied",
      { status: 403 }
    )) as any;

    const { textSearch } = await import("../placesNewClient");
    const res = await textSearch("merchant");
    expect(res.status).toBe("REQUEST_DENIED");
    expect(res.error_message).toContain("permission denied");
  });

  it("textSearch maps HTTP 429 to OVER_QUERY_LIMIT", async () => {
    global.fetch = vi.fn(async () => new Response("too many", { status: 429 })) as any;
    const { textSearch } = await import("../placesNewClient");
    const res = await textSearch("merchant");
    expect(res.status).toBe("OVER_QUERY_LIMIT");
  });

  it("textSearch returns REQUEST_DENIED when API key missing", async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
    global.fetch = vi.fn() as any;
    const { textSearch } = await import("../placesNewClient");
    const res = await textSearch("merchant");
    expect(res.status).toBe("REQUEST_DENIED");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ─── placeDetails ───────────────────────────────────────────────────────

  it("placeDetails GETs the New API places/{id} endpoint with translated field mask", async () => {
    const mockFetch = vi.fn(async () => new Response(
      JSON.stringify({
        id: "ChIJabc",
        displayName: { text: "Bella Pasta" },
        types: ["restaurant"],
        addressComponents: [],
        priceLevel: "PRICE_LEVEL_MODERATE",
        websiteUri: "https://example.com",
      }),
      { status: 200 }
    ));
    global.fetch = mockFetch as any;

    const { placeDetails } = await import("../placesNewClient");
    const res = await placeDetails("ChIJabc", { fields: ["website", "price_level", "name"] });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places/ChIJabc");
    expect(init.method).toBe("GET");
    expect(init.headers["X-Goog-Api-Key"]).toBe("test-key-xyz");
    // Legacy 'website' → 'websiteUri', 'price_level' → 'priceLevel', 'name' → 'displayName'
    expect(init.headers["X-Goog-FieldMask"]).toBe("websiteUri,priceLevel,displayName");

    expect(res.status).toBe("OK");
    expect(res.result?.place_id).toBe("ChIJabc");
    expect(res.result?.name).toBe("Bella Pasta");
    expect(res.result?.website).toBe("https://example.com");
    expect(res.result?.price_level).toBe(2); // MODERATE → 2
  });

  it("placeDetails maps HTTP 404 to NOT_FOUND", async () => {
    global.fetch = vi.fn(async () => new Response("not found", { status: 404 })) as any;
    const { placeDetails } = await import("../placesNewClient");
    const res = await placeDetails("ChIJmissing");
    expect(res.status).toBe("NOT_FOUND");
  });

  // ─── autocomplete ───────────────────────────────────────────────────────

  it("autocomplete posts to suggestions endpoint and maps predictions to legacy shape", async () => {
    const mockFetch = vi.fn(async () => new Response(
      JSON.stringify({
        suggestions: [
          {
            placePrediction: {
              placeId: "ChIJxyz",
              text: { text: "Migros, Istanbul" },
              structuredFormat: {
                mainText: { text: "Migros" },
                secondaryText: { text: "Istanbul" },
              },
              types: ["establishment"],
            },
          },
        ],
      }),
      { status: 200 }
    ));
    global.fetch = mockFetch as any;

    const { autocomplete } = await import("../placesNewClient");
    const res = await autocomplete("Migros", { types: ["establishment"] });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:autocomplete");
    const body = JSON.parse(init.body);
    expect(body.input).toBe("Migros");
    expect(body.includedPrimaryTypes).toEqual(["establishment"]);

    expect(res.status).toBe("OK");
    expect(res.predictions).toHaveLength(1);
    expect(res.predictions[0].place_id).toBe("ChIJxyz");
    expect(res.predictions[0].description).toBe("Migros, Istanbul");
    expect(res.predictions[0].structured_formatting).toEqual({
      main_text: "Migros",
      secondary_text: "Istanbul",
    });
  });
});
