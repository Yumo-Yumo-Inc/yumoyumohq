import type {
  ExternalHtmlValidationError,
  ParsedExternalHtmlPage,
  ParsedExternalProduct,
  ParsedPackage,
} from "./types";

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

function decodeHtml(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, entity: string) => {
    const lower = entity.toLowerCase();
    if (ENTITY_MAP[lower]) return ENTITY_MAP[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    return whole;
  });
}

function textContent(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? decodeHtml(match[1] ?? match[2] ?? "") : null;
}

function hasClasses(tag: string, required: string[]): boolean {
  const classes = (attribute(tag, "class") ?? "").split(/\s+/);
  return required.every((name) => classes.includes(name));
}

function findElementByClasses(
  html: string,
  tagName: string,
  required: string[]
): { openTag: string; inner: string } | null {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi");
  for (const match of html.matchAll(pattern)) {
    const openTag = match[0].match(new RegExp(`^<${tagName}\\b[^>]*>`, "i"))?.[0] ?? "";
    if (!hasClasses(openTag, required)) continue;
    return { openTag, inner: match[0].slice(openTag.length, -(`</${tagName}>`.length)) };
  }
  return null;
}

function findVoidTagByClasses(html: string, tagName: string, required: string[]): string | null {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  for (const match of html.matchAll(pattern)) {
    if (hasClasses(match[0], required)) return match[0];
  }
  return null;
}

export function parseTurkishPrice(value: string): number | null {
  const cleaned = textContent(value)
    .replace(/₺/g, "")
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .match(/-?\d+(?:\.\d+)?/)?.[0];
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeUnit(value: string | null): string | null {
  const unit = (value ?? "").trim().toLocaleLowerCase("tr-TR").replace(/\./g, "");
  if (!unit) return null;
  if (["l", "lt", "litre", "liter"].includes(unit)) return "lt";
  if (["kg", "kilo", "kilogram"].includes(unit)) return "kg";
  if (["g", "gr", "gram"].includes(unit)) return "g";
  if (["ml", "mililitre", "milliliter"].includes(unit)) return "ml";
  if (["adet", "ad", "piece", "pcs"].includes(unit)) return "adet";
  return unit;
}

export const UNKNOWN_PACKAGE_SIGNATURE = "unknown";

export function parsePackage(rawName: string): ParsedPackage {
  const normalized = rawName.replace(/,/g, ".");
  const multi = normalized.match(/\b(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ml|lt|l|kg|gr|g|adet)\b/i);
  if (multi) {
    const count = Number(multi[1]);
    const size = Number(multi[2]);
    const unit = normalizeUnit(multi[3]);
    return { count, size, unit, signature: `${count}x${size}${unit}` };
  }
  const single = normalized.match(/\b(\d+(?:\.\d+)?)\s*(ml|lt|l|kg|gr|g|adet)\b/i);
  if (single) {
    const size = Number(single[1]);
    const unit = normalizeUnit(single[2]);
    return { count: 1, size, unit, signature: `1x${size}${unit}` };
  }
  return { count: 1, size: null, unit: null, signature: UNKNOWN_PACKAGE_SIGNATURE };
}

/** ml and g are the base units; lt/kg are folded into them so 1 lt and 1000 ml compare equal. */
const BASE_UNIT: Record<string, { unit: string; factor: number }> = {
  ml: { unit: "ml", factor: 1 },
  lt: { unit: "ml", factor: 1000 },
  g: { unit: "g", factor: 1 },
  kg: { unit: "g", factor: 1000 },
  adet: { unit: "adet", factor: 1 },
};

/**
 * Compare two packages as physical quantities rather than as strings.
 *
 * Returns 1 when they describe the same total quantity in the same base unit, 0 when they
 * describe different ones, and null when either side carries no size information — an
 * absent size is unknown, not a mismatch, and treating it as one blocked every suggestion.
 */
export function comparePackages(a: ParsedPackage, b: ParsedPackage): number | null {
  const left = baseQuantity(a);
  const right = baseQuantity(b);
  if (!left || !right) return null;
  if (left.unit !== right.unit) return 0;
  return Math.abs(left.total - right.total) <= left.total * 0.001 ? 1 : 0;
}

function baseQuantity(pkg: ParsedPackage): { unit: string; total: number } | null {
  if (pkg.size == null || !pkg.unit) return null;
  const base = BASE_UNIT[pkg.unit];
  if (!base) return null;
  return { unit: base.unit, total: pkg.count * pkg.size * base.factor };
}

function pageNumberFrom(html: string): number | null {
  const opening = html.match(/<([a-z0-9]+)\b[^>]+class=["'][^"']*\bpagination\b[^"']*["'][^>]*>/i);
  if (!opening || opening.index == null) return null;
  const closing = new RegExp(`<\\/${opening[1]}\\s*>`, "i");
  const tail = html.slice(opening.index + opening[0].length);
  const end = tail.search(closing);
  const pagination = end >= 0 ? tail.slice(0, end) : tail;
  const active = pagination.match(/<[^>]+class=["'][^"']*active[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1];
  const parsed = Number.parseInt(textContent(active ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function cardChunks(html: string): string[] {
  const starts = [...html.matchAll(/<[^>]+class=["'][^"']*\bproduct-summary\b[^"']*["'][^>]*>/gi)]
    .map((match) => match.index ?? 0);
  return starts.map((start, index) => html.slice(start, starts[index + 1] ?? html.length));
}

function sourceProductId(card: string): string | null {
  for (const anchor of card.matchAll(/<a\b[^>]*>/gi)) {
    const href = attribute(anchor[0], "href");
    const id = href?.match(/^\/detay\/([^/?#]+)/i)?.[1];
    if (id) return id;
  }
  return null;
}

function merchantFrom(card: string): string | null {
  const logo = findVoidTagByClasses(card, "img", ["depot-logo"]);
  const alt = logo ? attribute(logo, "alt") : null;
  const merchant = alt?.replace(/^\s*en\s+ucuz\s+market\s+/i, "").trim();
  return merchant || null;
}

function parseUnitPrice(value: string): { price: number | null; unit: string | null } {
  const text = textContent(value);
  const price = parseTurkishPrice(text);
  const unit = normalizeUnit(text.match(/\/\s*([\p{L}.]+)/u)?.[1] ?? null);
  return { price, unit };
}

export function parseMarketFiyatiHtml(html: string, suppliedPageNumber?: number | null): ParsedExternalHtmlPage {
  const pageNumber = suppliedPageNumber ?? pageNumberFrom(html);
  const products: ParsedExternalProduct[] = [];
  const errors: ExternalHtmlValidationError[] = [];

  cardChunks(html).forEach((card, cardIndex) => {
    const nameElement = findElementByClasses(card, "h2", ["product-name"]);
    const rawName = nameElement
      ? (attribute(nameElement.openTag, "title") || textContent(nameElement.inner)).trim()
      : "";
    const id = sourceProductId(card);
    const merchantLabel = merchantFrom(card);
    const current = findElementByClasses(card, "span", ["fw-bold", "caption-16"]);
    const priceTl = current ? parseTurkishPrice(current.inner) : null;

    const invalid: ExternalHtmlValidationError["code"] | null = !rawName
      ? "missing_name"
      : !id
        ? "missing_source_product_id"
        : !merchantLabel
          ? "missing_merchant"
          : !priceTl
            ? "missing_price"
            : null;
    if (invalid) {
      errors.push({
        cardIndex,
        pageNumber,
        code: invalid,
        message: `Product card ${cardIndex + 1} failed validation: ${invalid}`,
      });
      return;
    }

    const old = findElementByClasses(card, "span", ["text-decoration-line-through"]);
    const unit = findElementByClasses(card, "span", ["fw-normal", "caption-12"]);
    const unitParsed = unit ? parseUnitPrice(unit.inner) : { price: null, unit: null };
    products.push({
      sourceProductId: id as string,
      rawName,
      merchantLabel: merchantLabel as string,
      priceTl: priceTl as number,
      oldPriceTl: old ? parseTurkishPrice(old.inner) : null,
      unitPriceTl: unitParsed.price,
      unitType: unitParsed.unit,
      package: parsePackage(rawName),
      pageNumber,
    });
  });

  return { pageNumber, products, errors };
}
