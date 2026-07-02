/**
 * Places API (New) client wrapper.
 *
 * Adapts `places.googleapis.com/v1/*` responses to the legacy
 * `maps.googleapis.com/maps/api/place/*` shape so that existing callers
 * (places-service, app/api/places, app/api/places-app/*, contextFactors)
 * continue to parse responses the same way.
 *
 * Why: Legacy Places API enters sunset; Places API (New) gives broader
 * international coverage and supports FieldMask for cost control.
 * See: memory/decisions/2026-05-11-places-api-new-migrasyonu.md
 */

const NEW_BASE = "https://places.googleapis.com/v1";

// ─── Legacy-shaped response types ──────────────────────────────────────────

export interface LegacyAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface LegacyPlace {
  place_id: string;
  name: string;
  types: string[];
  address_components: LegacyAddressComponent[];
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
  price_level?: number;
  website?: string;
  business_status?: string;
}

export interface LegacyPlacesSearchResponse {
  status: "OK" | "ZERO_RESULTS" | "REQUEST_DENIED" | "INVALID_REQUEST" | "OVER_QUERY_LIMIT" | "UNKNOWN_ERROR";
  results: LegacyPlace[];
  error_message?: string;
}

export interface LegacyPlaceDetailsResponse {
  status: "OK" | "NOT_FOUND" | "REQUEST_DENIED" | "INVALID_REQUEST" | "OVER_QUERY_LIMIT" | "UNKNOWN_ERROR";
  result?: LegacyPlace;
  error_message?: string;
}

export interface LegacyAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text?: string };
  types?: string[];
}

export interface LegacyAutocompleteResponse {
  status: "OK" | "ZERO_RESULTS" | "REQUEST_DENIED" | "INVALID_REQUEST" | "OVER_QUERY_LIMIT" | "UNKNOWN_ERROR";
  predictions: LegacyAutocompletePrediction[];
  error_message?: string;
}

// ─── New API response types (internal) ─────────────────────────────────────

interface NewAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface NewPlace {
  id?: string;
  displayName?: { text?: string };
  types?: string[];
  addressComponents?: NewAddressComponent[];
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  priceLevel?: string; // PRICE_LEVEL_INEXPENSIVE | _MODERATE | _EXPENSIVE | _VERY_EXPENSIVE
  websiteUri?: string;
  businessStatus?: string;
}

interface NewSearchTextResponse {
  places?: NewPlace[];
}

interface NewAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      types?: string[];
    };
  }>;
}

// ─── Field mask presets (cost control) ─────────────────────────────────────

const SEARCH_TEXT_FIELDS = [
  "places.id",
  "places.displayName",
  "places.types",
  "places.addressComponents",
  "places.formattedAddress",
  "places.location",
  "places.priceLevel",
  "places.websiteUri",
  "places.businessStatus",
].join(",");

const DETAILS_FIELDS_DEFAULT = [
  "id",
  "displayName",
  "types",
  "addressComponents",
  "formattedAddress",
  "location",
  "priceLevel",
  "websiteUri",
  "businessStatus",
].join(",");

const AUTOCOMPLETE_FIELDS = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.text",
  "suggestions.placePrediction.structuredFormat",
  "suggestions.placePrediction.types",
].join(",");

// ─── Helpers ───────────────────────────────────────────────────────────────

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

function adaptPlace(p: NewPlace): LegacyPlace {
  return {
    place_id: p.id || "",
    name: p.displayName?.text || "",
    types: p.types || [],
    address_components: (p.addressComponents || []).map(c => ({
      long_name: c.longText || "",
      short_name: c.shortText || "",
      types: c.types || [],
    })),
    formatted_address: p.formattedAddress,
    geometry: p.location
      ? { location: { lat: p.location.latitude, lng: p.location.longitude } }
      : undefined,
    price_level: p.priceLevel ? PRICE_LEVEL_MAP[p.priceLevel] : undefined,
    website: p.websiteUri,
    business_status: p.businessStatus,
  };
}

function mapHttpToLegacyStatus(httpStatus: number): "OK" | "REQUEST_DENIED" | "INVALID_REQUEST" | "OVER_QUERY_LIMIT" | "UNKNOWN_ERROR" {
  if (httpStatus === 200) return "OK";
  if (httpStatus === 401 || httpStatus === 403) return "REQUEST_DENIED";
  if (httpStatus === 400) return "INVALID_REQUEST";
  if (httpStatus === 429) return "OVER_QUERY_LIMIT";
  return "UNKNOWN_ERROR";
}

// ─── Public functions ──────────────────────────────────────────────────────

export interface TextSearchOptions {
  region?: string;        // 2-letter ISO country code (lower-case OK)
  location?: { lat: number; lng: number };
  radius?: number;        // meters
  signal?: AbortSignal;
  maxResultCount?: number;
}

/**
 * Equivalent of: GET /maps/api/place/textsearch/json?query=...
 */
export async function textSearch(
  query: string,
  options: TextSearchOptions = {}
): Promise<LegacyPlacesSearchResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { status: "REQUEST_DENIED", results: [], error_message: "Google Places API key not set" };
  }

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: options.maxResultCount ?? 10,
  };
  if (options.region && /^[A-Z]{2}$/i.test(options.region)) {
    body.regionCode = options.region.toUpperCase();
  }
  if (options.location && options.radius) {
    body.locationBias = {
      circle: {
        center: { latitude: options.location.lat, longitude: options.location.lng },
        radius: options.radius,
      },
    };
  }

  let resp: Response;
  try {
    resp = await fetch(`${NEW_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": SEARCH_TEXT_FIELDS,
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (err) {
    return { status: "UNKNOWN_ERROR", results: [], error_message: String(err) };
  }

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return { status: mapHttpToLegacyStatus(resp.status), results: [], error_message: txt };
  }

  const data = (await resp.json()) as NewSearchTextResponse;
  const places = (data.places || []).map(adaptPlace);
  return {
    status: places.length > 0 ? "OK" : "ZERO_RESULTS",
    results: places,
  };
}

export interface PlaceDetailsOptions {
  fields?: string[];  // Legacy field names — translated to new field mask internally.
  signal?: AbortSignal;
}

/**
 * Equivalent of: GET /maps/api/place/details/json?place_id=...&fields=...
 */
export async function placeDetails(
  placeId: string,
  options: PlaceDetailsOptions = {}
): Promise<LegacyPlaceDetailsResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { status: "REQUEST_DENIED", error_message: "Google Places API key not set" };
  }

  // Map legacy field names to new API field mask.
  // Callers pass legacy fields like ['website', 'name', 'price_level'].
  const fieldMask = options.fields && options.fields.length > 0
    ? options.fields.map(legacyFieldToNew).join(",")
    : DETAILS_FIELDS_DEFAULT;

  let resp: Response;
  try {
    resp = await fetch(`${NEW_BASE}/places/${encodeURIComponent(placeId)}`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      signal: options.signal,
    });
  } catch (err) {
    return { status: "UNKNOWN_ERROR", error_message: String(err) };
  }

  if (resp.status === 404) {
    return { status: "NOT_FOUND" };
  }
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return { status: mapHttpToLegacyStatus(resp.status), error_message: txt };
  }

  const data = (await resp.json()) as NewPlace;
  return { status: "OK", result: adaptPlace(data) };
}

function legacyFieldToNew(legacy: string): string {
  switch (legacy) {
    case "name": return "displayName";
    case "place_id": return "id";
    case "address_components": return "addressComponents";
    case "formatted_address": return "formattedAddress";
    case "geometry": return "location";
    case "price_level": return "priceLevel";
    case "website": return "websiteUri";
    case "business_status": return "businessStatus";
    case "types": return "types";
    default: return legacy; // pass-through for already-new names
  }
}

export interface AutocompleteOptions {
  types?: string[];      // e.g. ['establishment']
  region?: string;
  location?: { lat: number; lng: number };
  radius?: number;
  signal?: AbortSignal;
}

/**
 * Equivalent of: GET /maps/api/place/autocomplete/json?input=...
 */
export async function autocomplete(
  input: string,
  options: AutocompleteOptions = {}
): Promise<LegacyAutocompleteResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { status: "REQUEST_DENIED", predictions: [], error_message: "Google Places API key not set" };
  }

  const body: Record<string, unknown> = { input };
  if (options.types && options.types.length > 0) {
    body.includedPrimaryTypes = options.types;
  }
  if (options.region && /^[A-Z]{2}$/i.test(options.region)) {
    body.regionCode = options.region.toUpperCase();
  }
  if (options.location && options.radius) {
    body.locationBias = {
      circle: {
        center: { latitude: options.location.lat, longitude: options.location.lng },
        radius: options.radius,
      },
    };
  }

  let resp: Response;
  try {
    resp = await fetch(`${NEW_BASE}/places:autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": AUTOCOMPLETE_FIELDS,
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (err) {
    return { status: "UNKNOWN_ERROR", predictions: [], error_message: String(err) };
  }

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return { status: mapHttpToLegacyStatus(resp.status), predictions: [], error_message: txt };
  }

  const data = (await resp.json()) as NewAutocompleteResponse;
  const predictions: LegacyAutocompletePrediction[] = (data.suggestions || [])
    .map(s => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(p => ({
      place_id: p.placeId,
      description: p.text?.text || "",
      structured_formatting: p.structuredFormat
        ? {
            main_text: p.structuredFormat.mainText?.text || "",
            secondary_text: p.structuredFormat.secondaryText?.text,
          }
        : undefined,
      types: p.types,
    }));

  return {
    status: predictions.length > 0 ? "OK" : "ZERO_RESULTS",
    predictions,
  };
}
