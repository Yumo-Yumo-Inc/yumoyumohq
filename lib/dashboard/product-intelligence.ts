export type DashboardProductSource = {
  rawName: string | null;
  canonicalName: string | null;
  brand: string | null;
  categoryLvl1: string | null;
  categoryLvl2: string | null;
  merchantCategory?: string | null;
  purchasedAt: string | null;
  updatedAt: string | null;
};

export type DashboardProductKind =
  | "prepared_meal"
  | "ready_drink"
  | "pantry_item"
  | "fresh_ingredient"
  | "snack"
  | "household_supply"
  | "baby_supply"
  | "personal_care"
  | "apparel"
  | "other";

export type DashboardProductGroup = "meal" | "drink" | "product" | "home" | "care" | "wear" | "other";

export type DashboardProductHeroMode = "recipe_search" | "none";

export type DashboardShoppingProduct = {
  name: string;
  count: number;
  lastSeenAt: string | null;
  category: string | null;
  kind: DashboardProductKind;
  group: DashboardProductGroup;
  heroEligible: boolean;
  heroMode: DashboardProductHeroMode;
  heroQuery: string | null;
};

const PRODUCT_CODE_STOP_WORDS = new Set(["tr", "en", "th", "ru", "null", "undefined", "nan"]);

const DISPLAY_RULES: Array<{ label: string; keywords: string[] }> = [
  { label: "Pirinç", keywords: ["pirinc", "baldo pirinc", "rice"] },
  { label: "Yoğurt", keywords: ["yogurt"] },
  { label: "Kahve", keywords: ["kahve", "coffee"] },
  { label: "Süt", keywords: ["sut", "milk"] },
  { label: "Ekmek", keywords: ["ekmek", "bread"] },
  { label: "Yumurta", keywords: ["yumurta", "egg"] },
  { label: "Makarna", keywords: ["makarna", "pasta"] },
  { label: "Peynir", keywords: ["peynir", "cheese"] },
  { label: "Deterjan", keywords: ["deterjan", "detergent"] },
  { label: "Bebek bezi", keywords: ["bebek bezi", "diaper"] },
];

const HOUSEHOLD_KEYWORDS = ["deterjan", "sabun", "sampuan", "kagit", "havlu", "temizlik", "softener"];
const BABY_KEYWORDS = ["bebek", "diaper", "mama", "islak mendil"];
const PERSONAL_CARE_KEYWORDS = ["sampuan", "deodorant", "dis macunu", "parfum", "kozmetik", "bakim", "soap"];
const APPAREL_KEYWORDS = ["mont", "ceket", "pantolon", "kazak", "elbise", "ayakkabi", "shirt", "jacket", "coat"];
const SNACK_KEYWORDS = ["cips", "cikolata", "biskuvi", "kraker", "wafer", "dondurma", "dessert", "snack"];
const DRINK_KEYWORDS = ["kahve", "cay", "latte", "americano", "cappuccino", "espresso", "icecek", "içecek"];
const PREPARED_MEAL_KEYWORDS = [
  "burger",
  "hamburger",
  "pizza",
  "doner",
  "döner",
  "tost",
  "sandvic",
  "sandwich",
  "makarna",
  "pilav",
  "corba",
  "çorba",
  "salata",
  "wrap",
];
const PANTRY_KEYWORDS = [
  "pirinc",
  "bulgur",
  "makarna",
  "un",
  "yag",
  "yağ",
  "tuz",
  "seker",
  "şeker",
  "salca",
  "çay",
  "cay",
  "kahve",
  "su",
];
const FRESH_INGREDIENT_KEYWORDS = [
  "domates",
  "salatalik",
  "salatalık",
  "biber",
  "patates",
  "sogan",
  "soğan",
  "elma",
  "muz",
  "portakal",
  "limon",
  "uzum",
  "üzüm",
  "sut",
  "süt",
  "yogurt",
  "peynir",
  "yumurta",
  "tavuk",
  "kiyma",
  "kıyma",
  "balik",
  "balık",
];

const PREPARED_MEAL_LEVEL1 = new Set(["food_delivery", "yemek"]);
const PREPARED_MEAL_LEVEL2 = new Set(["fast_food", "prepared_food"]);
const READY_DRINK_LEVEL2 = new Set(["hot_drinks"]);
const GROCERY_LEVEL1 = new Set(["groceries_fmcg", "gida", "gıda", "grocery", "groceries"]);
const FRESH_LEVEL2 = new Set(["vegetables", "fruits", "meat", "dairy"]);
const PANTRY_LEVEL2 = new Set(["bakery", "grains", "condiments", "oils", "beverages"]);
const GENERIC_PREPARED_MEAL_NAMES = new Set(["makarna", "pilav", "salata", "çorba", "corba", "wrap", "tost"]);

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[_./-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseTr(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .filter(Boolean)
    .map((part) =>
      part.length <= 2 ? part.toLocaleUpperCase("tr-TR") : part[0].toLocaleUpperCase("tr-TR") + part.slice(1)
    )
    .join(" ");
}

function scoreCandidate(value: string): number {
  if (!value.trim()) return -100;
  let score = 0;
  if (/\s/.test(value)) score += 8;
  if (/_/.test(value)) score -= 6;
  if (/[a-zA-Z]\d|\d[a-zA-Z]/.test(value)) score -= 5;
  if (value.length > 48) score -= 3;
  return score;
}

function cleanProductCandidate(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const tokens = normalized.split(" ").filter((token) => {
    if (PRODUCT_CODE_STOP_WORDS.has(token)) return false;
    if (/^\d+$/.test(token)) return false;
    if (/[a-z]\d|\d[a-z]/i.test(token)) return false;
    return true;
  });

  if (tokens.length === 0) return "";
  return titleCaseTr(tokens.join(" "));
}

function hasAnyKeyword(source: string, keywords: string[]): boolean {
  return keywords.some((keyword) => source.includes(normalizeText(keyword)));
}

function normalizeCategory(value: string | null | undefined): string {
  return normalizeText(value);
}

function isSpecificPreparedMealName(value: string): boolean {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  if (["pizza", "burger", "hamburger", "döner", "doner", "lahmacun", "kebap"].some((keyword) => normalized.includes(normalizeText(keyword)))) {
    return true;
  }
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length >= 2) return true;
  return !GENERIC_PREPARED_MEAL_NAMES.has(normalized);
}

export function getDashboardProductDisplayName(
  item: Pick<DashboardProductSource, "rawName" | "canonicalName" | "brand" | "categoryLvl1" | "categoryLvl2" | "merchantCategory">
): string {
  const candidates = [item.rawName, item.canonicalName, item.brand]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => ({ cleaned: cleanProductCandidate(value), score: scoreCandidate(value) }))
    .filter((candidate) => candidate.cleaned.length >= 2)
    .sort((left, right) => right.score - left.score || right.cleaned.length - left.cleaned.length);

  const best = candidates[0]?.cleaned ?? "";
  if (!best) return "";

  const lvl1 = normalizeCategory(item.categoryLvl1);
  const lvl2 = normalizeCategory(item.categoryLvl2);
  const merchantCategory = normalizeCategory(item.merchantCategory);
  const preparedContext =
    PREPARED_MEAL_LEVEL1.has(lvl1) ||
    PREPARED_MEAL_LEVEL2.has(lvl2) ||
    merchantCategory === "restaurant" ||
    merchantCategory === "restoran" ||
    merchantCategory === "cafe";

  if (preparedContext && normalizeText(best).split(" ").length >= 2) {
    return best;
  }

  const source = normalizeText(`${best} ${item.categoryLvl1 ?? ""} ${item.categoryLvl2 ?? ""}`);
  for (const rule of DISPLAY_RULES) {
    if (rule.keywords.some((keyword) => source.includes(normalizeText(keyword)))) {
      return rule.label;
    }
  }

  return best;
}

export function classifyDashboardProduct(item: DashboardProductSource): {
  kind: DashboardProductKind;
  group: DashboardProductGroup;
  heroEligible: boolean;
  heroMode: DashboardProductHeroMode;
  heroQuery: string | null;
} {
  const name = normalizeText(getDashboardProductDisplayName(item));
  const lvl1 = normalizeCategory(item.categoryLvl1);
  const lvl2 = normalizeCategory(item.categoryLvl2);
  const merchantCategory = normalizeCategory(item.merchantCategory);
  const combined = normalizeText(
    [item.rawName, item.canonicalName, item.brand, item.categoryLvl1, item.categoryLvl2, item.merchantCategory].filter(Boolean).join(" ")
  );

  const mealLikeMerchant = merchantCategory === "restaurant" || merchantCategory === "restoran" || merchantCategory === "cafe";
  const preparedMeal =
    PREPARED_MEAL_LEVEL1.has(lvl1) ||
    PREPARED_MEAL_LEVEL2.has(lvl2) ||
    (mealLikeMerchant && hasAnyKeyword(combined, PREPARED_MEAL_KEYWORDS));

  if (preparedMeal) {
    const displayName = getDashboardProductDisplayName(item);
    const specificEnough = isSpecificPreparedMealName(displayName);
    const query = `${displayName} tarifi`;
    return {
      kind: "prepared_meal",
      group: "meal",
      heroEligible: specificEnough,
      heroMode: "recipe_search",
      heroQuery: specificEnough ? query : null,
    };
  }

  const readyDrink =
    READY_DRINK_LEVEL2.has(lvl2) ||
    ((mealLikeMerchant || merchantCategory === "cafe") && hasAnyKeyword(combined, DRINK_KEYWORDS));

  if (readyDrink) {
    return {
      kind: "ready_drink",
      group: "drink",
      heroEligible: false,
      heroMode: "none",
      heroQuery: null,
    };
  }

  if (hasAnyKeyword(combined, BABY_KEYWORDS)) {
    return { kind: "baby_supply", group: "home", heroEligible: false, heroMode: "none", heroQuery: null };
  }

  if (hasAnyKeyword(combined, HOUSEHOLD_KEYWORDS)) {
    return { kind: "household_supply", group: "home", heroEligible: false, heroMode: "none", heroQuery: null };
  }

  if (hasAnyKeyword(combined, PERSONAL_CARE_KEYWORDS)) {
    return { kind: "personal_care", group: "care", heroEligible: false, heroMode: "none", heroQuery: null };
  }

  if (hasAnyKeyword(combined, APPAREL_KEYWORDS)) {
    return { kind: "apparel", group: "wear", heroEligible: false, heroMode: "none", heroQuery: null };
  }

  if (hasAnyKeyword(combined, SNACK_KEYWORDS)) {
    return { kind: "snack", group: "product", heroEligible: false, heroMode: "none", heroQuery: null };
  }

  if (
    GROCERY_LEVEL1.has(lvl1) ||
    FRESH_LEVEL2.has(lvl2) ||
    PANTRY_LEVEL2.has(lvl2) ||
    hasAnyKeyword(combined, PANTRY_KEYWORDS) ||
    hasAnyKeyword(combined, FRESH_INGREDIENT_KEYWORDS)
  ) {
    const kind =
      FRESH_LEVEL2.has(lvl2) || hasAnyKeyword(combined, FRESH_INGREDIENT_KEYWORDS) ? "fresh_ingredient" : "pantry_item";
    return { kind, group: "product", heroEligible: false, heroMode: "none", heroQuery: null };
  }

  if (merchantCategory === "grocery" && hasAnyKeyword(name, PREPARED_MEAL_KEYWORDS)) {
    return { kind: "pantry_item", group: "product", heroEligible: false, heroMode: "none", heroQuery: null };
  }

  return { kind: "other", group: "other", heroEligible: false, heroMode: "none", heroQuery: null };
}

export function aggregateDashboardProducts(items: DashboardProductSource[], limit = 5): DashboardShoppingProduct[] {
  const grouped = new Map<string, DashboardShoppingProduct>();

  for (const item of items) {
    const name = getDashboardProductDisplayName(item);
    if (!name || name.length < 2) continue;

    const semantic = classifyDashboardProduct(item);
    if (semantic.kind === "other") continue;

    const key = `${semantic.kind}:${name}`;
    const category = item.categoryLvl2 || item.categoryLvl1 || null;
    const seenAt = item.purchasedAt ?? item.updatedAt ?? null;
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        name,
        count: 1,
        lastSeenAt: seenAt,
        category,
        kind: semantic.kind,
        group: semantic.group,
        heroEligible: semantic.heroEligible,
        heroMode: semantic.heroMode,
        heroQuery: semantic.heroQuery,
      });
      continue;
    }

    grouped.set(key, {
      ...current,
      count: current.count + 1,
      lastSeenAt: seenAt && (!current.lastSeenAt || seenAt.localeCompare(current.lastSeenAt) > 0) ? seenAt : current.lastSeenAt,
    });
  }

  const values = [...grouped.values()].sort(
    (left, right) => right.count - left.count || (right.lastSeenAt ?? "").localeCompare(left.lastSeenAt ?? "")
  );

  const recurring = values.filter((item) => item.count >= 2);
  return (recurring.length > 0 ? recurring : values).slice(0, limit);
}
