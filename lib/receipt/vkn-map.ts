/**
 * VKN (Vergi Kimlik No) to merchant_id map – in-memory only, never stored in DB.
 * Load from env (VKN_MERCHANT_MAP_JSON) or from file path (VKN_MERCHANT_MAP_PATH).
 * SERVER-ONLY.
 */

let cachedMap: Record<string, string> | null = null;

/**
 * Load VKN -> merchant_id map from env or file.
 * - VKN_MERCHANT_MAP_JSON: JSON string like {"1234567890":"uuid-merchant-id"}
 * - VKN_MERCHANT_MAP_PATH: path to JSON file (same structure)
 * Returns empty object if not configured.
 */
export async function loadVknMerchantMap(): Promise<Record<string, string>> {
  if (cachedMap !== null) return cachedMap;

  const fromEnv = process.env.VKN_MERCHANT_MAP_JSON;
  if (fromEnv && typeof fromEnv === "string") {
    try {
      const parsed = JSON.parse(fromEnv) as Record<string, string>;
      cachedMap = normalizeVknMap(parsed);
      return cachedMap;
    } catch (e) {
      console.warn("[vkn-map] Invalid VKN_MERCHANT_MAP_JSON, using empty map:", e);
      cachedMap = {};
      return cachedMap;
    }
  }

  const path = process.env.VKN_MERCHANT_MAP_PATH;
  if (path && typeof path === "string") {
    try {
      const fs = await import("fs/promises");
      const content = await fs.readFile(path, "utf-8");
      const parsed = JSON.parse(content) as Record<string, string>;
      cachedMap = normalizeVknMap(parsed);
      return cachedMap;
    } catch (e) {
      console.warn("[vkn-map] Could not load VKN_MERCHANT_MAP_PATH, using empty map:", e);
      cachedMap = {};
      return cachedMap;
    }
  }

  cachedMap = {};
  return cachedMap;
}

/**
 * Sync version: use after loadVknMerchantMap() has been called (e.g. at startup).
 * Otherwise returns empty object.
 */
export function getVknMerchantMap(): Record<string, string> {
  if (cachedMap !== null) return cachedMap;
  return {};
}

/**
 * Look up merchant_id by VKN. Returns undefined if not found or map not loaded.
 */
export function getMerchantIdByVkn(vkn: string): string | undefined {
  const normalized = String(vkn).trim().replace(/\D/g, "");
  if (!normalized) return undefined;
  return getVknMerchantMap()[normalized];
}

function normalizeVknMap(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const vkn = String(k).trim().replace(/\D/g, "");
    if (vkn && v && typeof v === "string") out[vkn] = v.trim();
  }
  return out;
}

/**
 * Clear cached map (e.g. for tests or reload).
 */
export function clearVknMapCache(): void {
  cachedMap = null;
}
