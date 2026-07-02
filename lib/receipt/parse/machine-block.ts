/**
 * Machine block parser.
 *
 * Reads the tagged plain-text blocks Gemini emits (T1-compliant — no JSON):
 *   <YUMO_MACHINE_DATA>...</YUMO_MACHINE_DATA>
 *   <YUMO_LINE_ITEMS>...</YUMO_LINE_ITEMS>
 *
 * Contract:
 *   - Never throws. A malformed line yields `null` for that field, nothing else.
 *   - Returns a partial structure; the caller decides what counts as missing.
 *   - All numeric/boolean/list parsing is defensive: bad input → null, not exception.
 *
 * The output is the raw, parsed shape — not the downstream GeminiReceiptResult.
 * Mapping to GeminiReceiptResult happens in a separate step so the parser stays
 * a pure text-to-typed-fields function.
 */

export interface MachineBlockData {
  document_type: string | null;
  document_subtype: string | null;
  document_confidence: number | null;
  rejection_reason: string | null;
  merchant_legal_name: string | null;
  merchant_display_name: string | null;
  merchant_category: string | null;
  merchant_address: string | null;
  branch_info: string | null;
  address_city: string | null;
  address_district: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  tax_office: string | null;
  tax_number: string | null;
  receipt_date: string | null;
  /** Date EXACTLY as printed on the receipt (verbatim), pre-normalization. */
  receipt_date_raw: string | null;
  receipt_time: string | null;
  receipt_no: string | null;
  country_code: string | null;
  currency: string | null;
  items_count: number | null;
  total_vat: number | null;
  total_paid: number | null;
  total_raw: string | null;
  vat_raw: string | null;
  vat_rate: number | null;
  payment_method: string | null;
  payment_amount: number | null;
  payment_proven: boolean | null;
  pos_provider: string | null;
  card_last4: string | null;
  category: string | null;
  utility_type: string | null;
  confidence: number | null;
  integrity_is_complete: boolean | null;
  integrity_has_handwriting: boolean | null;
  integrity_has_tampering: boolean | null;
  integrity_is_photo_of_screen: boolean | null;
  integrity_is_crumpled: boolean | null;
  integrity_alteration_notes: string[] | null;
  low_confidence_fields: string[] | null;
  reasoning: string | null;
  /** Any keys returned by the model that we didn't expect. Logged, not used. */
  unknown_keys: Record<string, string>;
}

export interface MachineLineItem {
  line: number | null;
  name: string | null;
  brand: string | null;
  qty: number | null;
  unit: "adet" | "kg" | "g" | "l" | "ml" | null;
  unit_price: number | null;
  total: number | null;
  vat_rate: number | null;
  category: string | null;
  subcategory: string | null;
}

export interface ParsedMachineOutput {
  /** Markdown text that appears BEFORE the machine blocks. May be empty. */
  markdown_report: string;
  /** Parsed <YUMO_MACHINE_DATA> block. null if the block was missing entirely. */
  data: MachineBlockData | null;
  /** Parsed <YUMO_LINE_ITEMS> rows. Empty array if missing or unparseable. */
  line_items: MachineLineItem[];
  /** Non-fatal issues encountered while parsing — for logging/observability. */
  warnings: string[];
}

const KNOWN_DATA_KEYS: ReadonlySet<keyof MachineBlockData> = new Set([
  "document_type",
  "document_subtype",
  "document_confidence",
  "rejection_reason",
  "merchant_legal_name",
  "merchant_display_name",
  "merchant_category",
  "merchant_address",
  "branch_info",
  "address_city",
  "address_district",
  "address_neighborhood",
  "address_street",
  "tax_office",
  "tax_number",
  "receipt_date",
  "receipt_date_raw",
  "receipt_time",
  "receipt_no",
  "country_code",
  "currency",
  "items_count",
  "total_vat",
  "total_paid",
  "total_raw",
  "vat_raw",
  "vat_rate",
  "payment_method",
  "payment_amount",
  "payment_proven",
  "pos_provider",
  "card_last4",
  "category",
  "utility_type",
  "confidence",
  "integrity_is_complete",
  "integrity_has_handwriting",
  "integrity_has_tampering",
  "integrity_is_photo_of_screen",
  "integrity_is_crumpled",
  "integrity_alteration_notes",
  "low_confidence_fields",
  "reasoning",
]);

const NUMERIC_KEYS: ReadonlySet<keyof MachineBlockData> = new Set([
  "document_confidence",
  "items_count",
  "total_vat",
  "total_paid",
  "vat_rate",
  "payment_amount",
  "confidence",
]);

const BOOLEAN_KEYS: ReadonlySet<keyof MachineBlockData> = new Set([
  "payment_proven",
  "integrity_is_complete",
  "integrity_has_handwriting",
  "integrity_has_tampering",
  "integrity_is_photo_of_screen",
  "integrity_is_crumpled",
]);

const LIST_KEYS: ReadonlySet<keyof MachineBlockData> = new Set([
  "integrity_alteration_notes",
  "low_confidence_fields",
]);

const NULL_TOKENS = new Set(["null", "none", "n/a", "na", "-", ""]);

/**
 * Currencies whose minor unit has THREE decimal places (ISO 4217). For these a
 * trailing ".XXX" is a genuine decimal and must NOT be treated as a thousands
 * separator.
 */
const THREE_DECIMAL_CURRENCIES = new Set([
  "KWD", "BHD", "OMR", "TND", "JOD", "LYD", "IQD",
]);

/**
 * Decide whether a numeric token's single dot is a THOUSANDS separator that the
 * model left in (e.g. Indonesian "85.325" meaning 85325) rather than a decimal.
 *
 * Deterministic rule (no value invention, only ambiguity resolution):
 *   - Only applies when the token has exactly ONE dot, no comma, and that dot is
 *     followed by EXACTLY three digits at the END of the token ("85.325").
 *   - Real decimal money is written with 1-2 fraction digits, so a lone ".XXX"
 *     3-digit group is the signature of a thousands separator.
 *   - Skipped entirely for 3-decimal currencies (KWD/BHD/...), where ".XXX" is a
 *     legitimate decimal.
 * Returns the de-separated string ("85325") when the rule fires, else null.
 */
function thousandsDotFix(token: string, currencyHint?: string | null): string | null {
  const cur = (currencyHint ?? "").trim().toUpperCase();
  // ONLY applied to MONETARY fields that carry a currency hint. Without a
  // currency we cannot know the locale, and non-monetary fields (qty/weight like
  // "1.350" kg, "2.88" m2) must never be de-separated. So no hint → no fix.
  if (!cur) return null;
  // 3-decimal currencies (KWD/BHD/...) write a real ".XXX" decimal — leave it.
  if (THREE_DECIMAL_CURRENCIES.has(cur)) return null;
  // One dot, no comma, sign optional, integer part 1-3 digits with a NON-ZERO
  // leading digit, dot followed by EXACTLY three digits at the end ("85.325").
  // Leading-zero fractions ("0.696") are excluded, so this only de-separates
  // true thousands groups in dot-thousands locales (e.g. IDR).
  if (/^-?[1-9]\d{0,2}\.\d{3}$/.test(token)) {
    return token.replace(".", "");
  }
  return null;
}

/**
 * Parse a string that *might* be a number. Returns null on anything ambiguous.
 *
 * currencyHint lets us resolve the dot-as-thousands ambiguity for locales that
 * print "85.325" to mean 85325 (e.g. IDR). The model's value is not changed;
 * only the separator interpretation is corrected deterministically.
 */
function parseNumberDefensive(
  raw: string,
  currencyHint?: string | null
): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || NULL_TOKENS.has(t.toLowerCase())) return null;
  const cleaned = t.replace(/[*\s]/g, "");

  // Thousands-dot correction BEFORE the plain Number() read, because
  // Number("85.325") would otherwise succeed as 85.325 and hide the bug.
  const fixed = thousandsDotFix(cleaned, currencyHint);
  if (fixed !== null) {
    const fn = Number(fixed);
    if (Number.isFinite(fn)) return fn;
  }

  const n = Number(cleaned);
  if (Number.isFinite(n)) return n;
  // Fallback: try replacing a single trailing comma-decimal with a dot.
  if (/^-?\d+(\.\d+)*,\d+$/.test(cleaned)) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const f = Number(normalized);
    if (Number.isFinite(f)) return f;
  }
  return null;
}

function parseBooleanDefensive(raw: string): boolean | null {
  if (raw == null) return null;
  const t = raw.trim().toLowerCase();
  if (NULL_TOKENS.has(t)) return null;
  if (t === "true" || t === "yes" || t === "1") return true;
  if (t === "false" || t === "no" || t === "0") return false;
  return null;
}

function parseListDefensive(raw: string): string[] | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || NULL_TOKENS.has(t.toLowerCase())) return null;
  // Items separated by " ;; " per the contract; we accept "; " as a fallback.
  const parts = t
    .split(/\s*;;\s*/)
    .flatMap((p) => p.split(/\s*;\s*/))
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !NULL_TOKENS.has(p.toLowerCase()));
  return parts.length ? parts : null;
}

function parseStringDefensive(raw: string): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || NULL_TOKENS.has(t.toLowerCase())) return null;
  return t;
}

function parseUnitDefensive(raw: string): MachineLineItem["unit"] {
  const s = parseStringDefensive(raw);
  if (!s) return null;
  const u = s.toLowerCase();
  if (u === "adet" || u === "kg" || u === "g" || u === "l" || u === "ml") return u;
  if (u === "lt") return "l";
  return null;
}

/**
 * Extract the content of a tagged block from text.
 * Returns null if the open or close tag is missing.
 * Matches case-insensitively and tolerates surrounding whitespace.
 */
function extractTaggedBlock(source: string, tag: string): string | null {
  const open = new RegExp(`<\\s*${tag}\\s*>`, "i");
  const close = new RegExp(`<\\s*/\\s*${tag}\\s*>`, "i");
  const openMatch = source.match(open);
  if (!openMatch || openMatch.index === undefined) return null;
  const afterOpen = source.slice(openMatch.index + openMatch[0].length);
  const closeMatch = afterOpen.match(close);
  if (!closeMatch || closeMatch.index === undefined) {
    // Open tag with no close — treat as everything to end of string.
    return afterOpen;
  }
  return afterOpen.slice(0, closeMatch.index);
}

function makeEmptyData(): MachineBlockData {
  return {
    document_type: null,
    document_subtype: null,
    document_confidence: null,
    rejection_reason: null,
    merchant_legal_name: null,
    merchant_display_name: null,
    merchant_category: null,
    merchant_address: null,
    branch_info: null,
    address_city: null,
    address_district: null,
    address_neighborhood: null,
    address_street: null,
    tax_office: null,
    tax_number: null,
    receipt_date: null,
    receipt_date_raw: null,
    receipt_time: null,
    receipt_no: null,
    country_code: null,
    currency: null,
    items_count: null,
    total_vat: null,
    total_paid: null,
    total_raw: null,
    vat_raw: null,
    vat_rate: null,
    payment_method: null,
    payment_amount: null,
    payment_proven: null,
    pos_provider: null,
    card_last4: null,
    category: null,
    utility_type: null,
    confidence: null,
    integrity_is_complete: null,
    integrity_has_handwriting: null,
    integrity_has_tampering: null,
    integrity_is_photo_of_screen: null,
    integrity_is_crumpled: null,
    integrity_alteration_notes: null,
    low_confidence_fields: null,
    reasoning: null,
    unknown_keys: {},
  };
}

/** Find the `currency:` value in raw machine-data lines without full parsing. */
function prescanCurrency(lines: string[]): string | null {
  for (const line of lines) {
    const t = line.trim();
    const colonAt = t.indexOf(":");
    if (colonAt <= 0) continue;
    if (t.slice(0, colonAt).trim().toLowerCase() === "currency") {
      const v = t.slice(colonAt + 1).trim();
      if (!v || NULL_TOKENS.has(v.toLowerCase())) return null;
      return v;
    }
  }
  return null;
}

function parseMachineDataBlock(
  body: string,
  warnings: string[]
): MachineBlockData {
  const out = makeEmptyData();
  const lines = body.split(/\r?\n/);
  // Pre-scan currency so numeric fields (total_paid, etc.) can resolve the
  // dot-as-thousands ambiguity even when "currency:" appears after them.
  const currencyHint = prescanCurrency(lines);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Tolerate `key: value` and `key : value`. Split on the FIRST colon only —
    // the value may contain colons (URLs, times like 14:17:10).
    const colonAt = trimmed.indexOf(":");
    if (colonAt <= 0) {
      warnings.push(`machine_data line ${i + 1}: no colon, skipped — "${trimmed.slice(0, 80)}"`);
      continue;
    }
    const rawKey = trimmed.slice(0, colonAt).trim();
    const rawValue = trimmed.slice(colonAt + 1).trim();
    const key = rawKey.toLowerCase();

    if (!KNOWN_DATA_KEYS.has(key as keyof MachineBlockData)) {
      out.unknown_keys[rawKey] = rawValue;
      continue;
    }
    const k = key as keyof MachineBlockData;

    try {
      if (NUMERIC_KEYS.has(k)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out as any)[k] = parseNumberDefensive(rawValue, currencyHint);
      } else if (BOOLEAN_KEYS.has(k)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out as any)[k] = parseBooleanDefensive(rawValue);
      } else if (LIST_KEYS.has(k)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out as any)[k] = parseListDefensive(rawValue);
      } else {
        // String-typed field.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out as any)[k] = parseStringDefensive(rawValue);
      }
    } catch (err) {
      // Defensive: parseXxx functions don't throw, but if anything ever does,
      // we keep the field as null and move on.
      warnings.push(
        `machine_data line ${i + 1}: parse error for "${rawKey}" — ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
  return out;
}

/** Canonical line-item field keys, in the order MachineLineItem expects. */
type LineItemColumn =
  | "LINE"
  | "NAME"
  | "BRAND"
  | "QTY"
  | "UNIT"
  | "UNIT_PRICE"
  | "TOTAL"
  | "VAT_RATE"
  | "CATEGORY"
  | "SUBCATEGORY";

/** Header aliases → canonical column. Tolerates spacing/underscore variants. */
const LINE_ITEM_COLUMN_ALIASES: Record<string, LineItemColumn> = {
  LINE: "LINE",
  "#": "LINE",
  NAME: "NAME",
  PRODUCT: "NAME",
  ITEM: "NAME",
  BRAND: "BRAND",
  QTY: "QTY",
  QUANTITY: "QTY",
  UNIT: "UNIT",
  UNITTYPE: "UNIT",
  UNIT_PRICE: "UNIT_PRICE",
  UNITPRICE: "UNIT_PRICE",
  "UNIT PRICE": "UNIT_PRICE",
  PRICE: "UNIT_PRICE",
  TOTAL: "TOTAL",
  LINE_TOTAL: "TOTAL",
  AMOUNT: "TOTAL",
  VAT_RATE: "VAT_RATE",
  VATRATE: "VAT_RATE",
  "VAT RATE": "VAT_RATE",
  VAT: "VAT_RATE",
  KDV: "VAT_RATE",
  CATEGORY: "CATEGORY",
  SUBCATEGORY: "SUBCATEGORY",
};

/**
 * Default column order used when NO recognizable header row is present. Matches
 * the live <YUMO_LINE_ITEMS> prompt header (7 columns, no BRAND/CATEGORY):
 *   LINE | NAME | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
 * Header-driven mapping (below) overrides this whenever a header is found.
 */
const DEFAULT_LINE_ITEM_ORDER: LineItemColumn[] = [
  "LINE",
  "NAME",
  "QTY",
  "UNIT",
  "UNIT_PRICE",
  "TOTAL",
  "VAT_RATE",
];

/** Normalize a raw header cell to a canonical column key, or null if unknown. */
function canonicalizeHeaderCell(cell: string): LineItemColumn | null {
  const key = cell.trim().toUpperCase().replace(/\s+/g, " ");
  if (key in LINE_ITEM_COLUMN_ALIASES) return LINE_ITEM_COLUMN_ALIASES[key];
  const collapsed = key.replace(/[ _]/g, "");
  if (collapsed in LINE_ITEM_COLUMN_ALIASES) return LINE_ITEM_COLUMN_ALIASES[collapsed];
  return null;
}

/**
 * Try to read a row as a header. Returns a column→index map when the row looks
 * like a header (>= 3 recognizable canonical columns including NAME), else null.
 */
function parseHeaderRow(line: string): Partial<Record<LineItemColumn, number>> | null {
  const cells = line.split("|").map((c) => c.trim());
  const map: Partial<Record<LineItemColumn, number>> = {};
  let hits = 0;
  for (let i = 0; i < cells.length; i++) {
    const col = canonicalizeHeaderCell(cells[i]);
    if (col && map[col] === undefined) {
      map[col] = i;
      hits++;
    }
  }
  // A header must have NAME plus at least two more known columns.
  if (hits >= 3 && map.NAME !== undefined) return map;
  return null;
}

function parseLineItemsBlock(
  body: string,
  warnings: string[],
  currencyHint?: string | null
): MachineLineItem[] {
  const lines = body.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const items: MachineLineItem[] = [];

  // Build the column map from the header row when present; otherwise fall back
  // to the default order that matches the live prompt header. Mapping is by
  // COLUMN NAME, not fixed position, so a 7-column or 10-column emission (or any
  // reordering) maps each value to the correct field.
  let startIdx = 0;
  let columnMap: Partial<Record<LineItemColumn, number>>;
  const headerMap = lines.length > 0 ? parseHeaderRow(lines[0]) : null;
  if (headerMap) {
    columnMap = headerMap;
    startIdx = 1;
  } else {
    columnMap = {};
    DEFAULT_LINE_ITEM_ORDER.forEach((col, idx) => {
      columnMap[col] = idx;
    });
    if (lines.length > 0) {
      warnings.push(
        `line_items: header row not recognized, using default 7-column order — "${lines[0].slice(0, 80)}"`
      );
    }
  }

  // Some markdown renderers add a separator row like `|---|---|`. Skip it.
  if (startIdx < lines.length && /^[\|\-\s:]+$/.test(lines[startIdx])) {
    startIdx++;
  }

  const at = (cols: string[], col: LineItemColumn): string => {
    const idx = columnMap[col];
    if (idx === undefined) return "";
    return cols[idx] ?? "";
  };

  for (let i = startIdx; i < lines.length; i++) {
    const row = lines[i];
    const cols = row.split("|").map((c) => c.trim());
    if (cols.length < 2) {
      warnings.push(`line_items row ${i + 1}: too few columns (${cols.length}), skipped`);
      continue;
    }

    const item: MachineLineItem = {
      line: parseNumberDefensive(at(cols, "LINE")),
      name: parseStringDefensive(at(cols, "NAME")),
      brand: parseStringDefensive(at(cols, "BRAND")),
      qty: parseNumberDefensive(at(cols, "QTY")),
      unit: parseUnitDefensive(at(cols, "UNIT")),
      unit_price: parseNumberDefensive(at(cols, "UNIT_PRICE"), currencyHint),
      total: parseNumberDefensive(at(cols, "TOTAL"), currencyHint),
      vat_rate: parseNumberDefensive(at(cols, "VAT_RATE")),
      category: parseStringDefensive(at(cols, "CATEGORY")),
      subcategory: parseStringDefensive(at(cols, "SUBCATEGORY")),
    };

    // Drop fully empty rows.
    if (
      item.name == null &&
      item.qty == null &&
      item.unit_price == null &&
      item.total == null
    ) {
      continue;
    }
    items.push(item);
  }

  return items;
}

/**
 * Parse the full Gemini receipt output: Markdown report + machine blocks.
 *
 * Behavior:
 *   - Returns ParsedMachineOutput, never throws.
 *   - If <YUMO_MACHINE_DATA> is missing, data === null and warnings includes a note.
 *   - If <YUMO_LINE_ITEMS> is missing, line_items === [] and warnings includes a note.
 *   - Anything before the first machine block is treated as the markdown report.
 */
export function parseMachineOutput(rawText: string): ParsedMachineOutput {
  const warnings: string[] = [];
  const source = String(rawText ?? "");

  // Strip accidental markdown code fences around the whole payload, if any.
  const stripped = source
    .replace(/^\s*```[a-zA-Z]*\s*/, "")
    .replace(/\s*```\s*$/, "");

  // Markdown report = everything before the first machine block tag.
  let markdownEnd = stripped.length;
  const firstTagMatch = stripped.match(/<\s*YUMO_(MACHINE_DATA|LINE_ITEMS)\s*>/i);
  if (firstTagMatch && firstTagMatch.index !== undefined) {
    markdownEnd = firstTagMatch.index;
  }
  const markdown_report = stripped.slice(0, markdownEnd).trim();

  const dataBody = extractTaggedBlock(stripped, "YUMO_MACHINE_DATA");
  const lineItemsBody = extractTaggedBlock(stripped, "YUMO_LINE_ITEMS");

  let data: MachineBlockData | null = null;
  if (dataBody == null) {
    warnings.push("YUMO_MACHINE_DATA block not found in model output");
  } else {
    data = parseMachineDataBlock(dataBody, warnings);
    if (Object.keys(data.unknown_keys).length > 0) {
      warnings.push(
        `YUMO_MACHINE_DATA: ${Object.keys(data.unknown_keys).length} unknown key(s) ignored: ${Object.keys(data.unknown_keys).join(", ")}`
      );
    }
  }

  let line_items: MachineLineItem[] = [];
  if (lineItemsBody == null) {
    warnings.push("YUMO_LINE_ITEMS block not found in model output");
  } else {
    line_items = parseLineItemsBlock(
      lineItemsBody,
      warnings,
      data?.currency ?? null
    );
  }

  return { markdown_report, data, line_items, warnings };
}
