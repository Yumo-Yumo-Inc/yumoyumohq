/**
 * Public merchant seed file loader.
 * Reads and validates data/seeds/{country}-*.json files.
 */

import { readFileSync } from "fs";
import type {
  SeedFile,
  SeedMerchant,
  SeedTier,
  SeedMerchantKind,
} from "../../../data/seeds/_schema";

const VALID_TIERS: SeedTier[] = ["verified", "candidate", "unverified"];
const VALID_KINDS: SeedMerchantKind[] = [
  "brand",
  "legal_entity",
  "franchise",
  "subsidiary",
  "location",
  "rebrand_old",
  "duplicate",
];

export interface ValidationIssue {
  index: number;
  id?: string;
  field: string;
  message: string;
}

export interface LoadedSeedFile {
  file: SeedFile;
  issues: ValidationIssue[];
  totalMerchants: number;
}

/**
 * Load a JSON file and validate it against the schema.
 * Does not throw — returns an issues list; the caller decides.
 */
export function loadSeedFile(path: string): LoadedSeedFile {
  const raw = readFileSync(path, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${path}: ${(e as Error).message}`);
  }

  const issues: ValidationIssue[] = [];

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Seed file must be a JSON object: ${path}`);
  }

  const obj = parsed as Record<string, unknown>;

  // Top-level required
  if (typeof obj.country_code !== "string" || obj.country_code.length !== 2) {
    issues.push({
      index: -1,
      field: "country_code",
      message: "country_code must be a 2-letter ISO code",
    });
  }
  if (typeof obj.version !== "string" || !obj.version) {
    issues.push({
      index: -1,
      field: "version",
      message: "version (string) required",
    });
  }
  if (!Array.isArray(obj.merchants)) {
    throw new Error(`merchants must be an array in ${path}`);
  }

  // Defaults
  const defaults =
    obj.defaults && typeof obj.defaults === "object" && !Array.isArray(obj.defaults)
      ? (obj.defaults as { tier?: SeedTier; merchant_kind?: SeedMerchantKind })
      : {};
  const defaultTier = defaults.tier ?? "verified";
  const defaultKind = defaults.merchant_kind ?? "brand";

  // Validate each merchant
  const seenIds = new Set<string>();
  const merchants: SeedMerchant[] = [];
  for (let i = 0; i < (obj.merchants as unknown[]).length; i++) {
    const m = (obj.merchants as unknown[])[i];
    if (!m || typeof m !== "object" || Array.isArray(m)) {
      issues.push({ index: i, field: "merchant", message: "must be an object" });
      continue;
    }
    const o = m as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    if (!id) {
      issues.push({ index: i, field: "id", message: "id (string) required" });
      continue;
    }
    if (seenIds.has(id)) {
      issues.push({ index: i, id, field: "id", message: `duplicate id: ${id}` });
      continue;
    }
    seenIds.add(id);

    const canonical = typeof o.canonical_name === "string" ? o.canonical_name.trim() : "";
    if (!canonical) {
      issues.push({ index: i, id, field: "canonical_name", message: "required" });
      continue;
    }

    if (!o.display_names || typeof o.display_names !== "object" || Array.isArray(o.display_names)) {
      issues.push({
        index: i,
        id,
        field: "display_names",
        message: "must be a non-empty object {<lang>: <name>}",
      });
      continue;
    }
    const displayNames = o.display_names as Record<string, string>;
    if (Object.keys(displayNames).length === 0) {
      issues.push({
        index: i,
        id,
        field: "display_names",
        message: "must contain at least one language",
      });
      continue;
    }

    const category = typeof o.category === "string" ? o.category.trim() : "";
    if (!category) {
      issues.push({ index: i, id, field: "category", message: "required" });
      continue;
    }

    const tier =
      typeof o.tier === "string" && VALID_TIERS.includes(o.tier as SeedTier)
        ? (o.tier as SeedTier)
        : defaultTier;
    const merchantKind =
      typeof o.merchant_kind === "string" &&
      VALID_KINDS.includes(o.merchant_kind as SeedMerchantKind)
        ? (o.merchant_kind as SeedMerchantKind)
        : defaultKind;

    const aliases = Array.isArray(o.aliases)
      ? o.aliases.filter((a): a is string => typeof a === "string" && a.length > 0)
      : undefined;

    const vkn = typeof o.vkn === "string" && o.vkn.trim() ? o.vkn.trim() : null;

    merchants.push({
      id,
      canonical_name: canonical,
      display_names: displayNames,
      category,
      tier,
      merchant_kind: merchantKind,
      aliases,
      vkn,
      tax_office: typeof o.tax_office === "string" ? o.tax_office : undefined,
      logo_url: typeof o.logo_url === "string" ? o.logo_url : undefined,
      website: typeof o.website === "string" ? o.website : undefined,
      founded_year: typeof o.founded_year === "number" ? o.founded_year : undefined,
      notes: typeof o.notes === "string" ? o.notes : undefined,
    });
  }

  const file: SeedFile = {
    country_code: typeof obj.country_code === "string" ? obj.country_code : "",
    version: typeof obj.version === "string" ? obj.version : "",
    description: typeof obj.description === "string" ? obj.description : undefined,
    last_edited_by:
      typeof obj.last_edited_by === "string" ? obj.last_edited_by : undefined,
    defaults: { tier: defaultTier, merchant_kind: defaultKind },
    merchants,
  };

  return { file, issues, totalMerchants: merchants.length };
}
