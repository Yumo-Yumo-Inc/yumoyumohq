/**
 * Country detection from GPS coordinates.
 *
 * Simple bounding-box approach — no external API, zero latency.
 * Supported countries are Yumo's active markets.
 * Not for scenarios requiring precise border detection; used as a tiebreaker
 * when OCR/LLM signals are missing or conflicting.
 */

interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface CountryBox {
  code: string;
  box: BoundingBox;
}

// Coordinate ranges are approximate — may be inaccurate in disputed border regions.
// Priority order: smaller countries come first (e.g. Singapore, TW).
const COUNTRY_BOXES: CountryBox[] = [
  // Taiwan (TW) — must be defined before China; bounding boxes overlap
  { code: "TW", box: { minLat: 21.9, maxLat: 25.4, minLng: 119.9, maxLng: 122.1 } },
  // Singapore
  { code: "SG", box: { minLat: 1.15, maxLat: 1.47, minLng: 103.6, maxLng: 104.1 } },
  // Turkey
  { code: "TR", box: { minLat: 35.8, maxLat: 42.2, minLng: 25.7, maxLng: 44.8 } },
  // Thailand
  { code: "TH", box: { minLat: 5.5, maxLat: 20.5, minLng: 97.3, maxLng: 105.7 } },
  // Malaysia
  { code: "MY", box: { minLat: 0.8, maxLat: 7.4, minLng: 99.6, maxLng: 119.3 } },
  // Indonesia
  { code: "ID", box: { minLat: -11.0, maxLat: 6.1, minLng: 94.8, maxLng: 141.1 } },
  // Japan
  { code: "JP", box: { minLat: 24.0, maxLat: 45.6, minLng: 122.9, maxLng: 153.9 } },
  // South Korea
  { code: "KR", box: { minLat: 33.0, maxLat: 38.7, minLng: 124.6, maxLng: 130.0 } },
  // China (mainland) — since the TW check is listed above, TW takes priority on overlap
  { code: "CN", box: { minLat: 15.0, maxLat: 53.6, minLng: 73.4, maxLng: 134.8 } },
  // India
  { code: "IN", box: { minLat: 6.4, maxLat: 35.7, minLng: 68.1, maxLng: 97.4 } },
  // Philippines
  { code: "PH", box: { minLat: 4.6, maxLat: 20.8, minLng: 116.9, maxLng: 126.6 } },
  // Vietnam
  { code: "VN", box: { minLat: 8.2, maxLat: 23.4, minLng: 102.1, maxLng: 109.5 } },
  // UAE
  { code: "AE", box: { minLat: 22.6, maxLat: 26.2, minLng: 51.4, maxLng: 56.4 } },
  // Saudi Arabia
  { code: "SA", box: { minLat: 16.0, maxLat: 32.2, minLng: 34.5, maxLng: 55.7 } },
  // United Kingdom
  { code: "GB", box: { minLat: 49.7, maxLat: 61.0, minLng: -8.7, maxLng: 1.8 } },
  // Germany
  { code: "DE", box: { minLat: 47.3, maxLat: 55.1, minLng: 5.9, maxLng: 15.0 } },
  // France
  { code: "FR", box: { minLat: 41.3, maxLat: 51.2, minLng: -5.2, maxLng: 9.6 } },
  // Netherlands
  { code: "NL", box: { minLat: 50.7, maxLat: 53.6, minLng: 3.3, maxLng: 7.2 } },
  // Poland
  { code: "PL", box: { minLat: 49.0, maxLat: 54.9, minLng: 14.1, maxLng: 24.2 } },
  // Switzerland
  { code: "CH", box: { minLat: 45.8, maxLat: 47.8, minLng: 5.9, maxLng: 10.5 } },
  // Australia
  { code: "AU", box: { minLat: -43.7, maxLat: -10.7, minLng: 113.2, maxLng: 153.7 } },
  // New Zealand
  { code: "NZ", box: { minLat: -46.6, maxLat: -34.1, minLng: 166.4, maxLng: 178.6 } },
  // Canada
  { code: "CA", box: { minLat: 41.7, maxLat: 83.1, minLng: -141.0, maxLng: -52.6 } },
  // Mexico
  { code: "MX", box: { minLat: 14.5, maxLat: 32.7, minLng: -117.1, maxLng: -86.7 } },
  // Brazil
  { code: "BR", box: { minLat: -33.8, maxLat: 5.3, minLng: -73.9, maxLng: -28.8 } },
  // South Africa
  { code: "ZA", box: { minLat: -34.8, maxLat: -22.1, minLng: 16.4, maxLng: 32.9 } },
  // Russia (European part + western Siberia)
  { code: "RU", box: { minLat: 41.2, maxLat: 77.7, minLng: 19.6, maxLng: 169.0 } },
  // United States (contiguous)
  { code: "US", box: { minLat: 24.4, maxLat: 49.4, minLng: -125.0, maxLng: -66.9 } },
  // Spain
  { code: "ES", box: { minLat: 27.6, maxLat: 43.8, minLng: -18.2, maxLng: 4.3 } },
  // Italy
  { code: "IT", box: { minLat: 35.5, maxLat: 47.1, minLng: 6.6, maxLng: 18.5 } },
  // Egypt
  { code: "EG", box: { minLat: 22.0, maxLat: 31.7, minLng: 24.7, maxLng: 37.0 } },
  // Israel
  { code: "IL", box: { minLat: 29.5, maxLat: 33.3, minLng: 34.2, maxLng: 35.9 } },
];

/**
 * Returns the country code for a GPS coordinate.
 * Returns null if no match is found.
 *
 * @param lat - Latitude (-90 to +90)
 * @param lng - Longitude (-180 to +180)
 * @returns 2-letter ISO country code, or null
 */
export function countryFromCoords(lat: number, lng: number): string | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  for (const { code, box } of COUNTRY_BOXES) {
    if (
      lat >= box.minLat &&
      lat <= box.maxLat &&
      lng >= box.minLng &&
      lng <= box.maxLng
    ) {
      return code;
    }
  }

  return null;
}
