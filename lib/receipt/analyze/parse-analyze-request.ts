import type { ReceiptContext } from "@/app/api/receipt/analyze/types";

export type AnalyzeRequestBody = {
  receiptId?: unknown;
  hash?: unknown;
  perceptualHash?: unknown;
  filename?: unknown;
  location?: unknown;
  marginViolation?: unknown;
  blobUrl?: unknown;
  originalFileSizeBytes?: unknown;
  ocrJson?: unknown;
  stream?: unknown;
  expenseType?: unknown;
  completeSlipReceiptId?: unknown;
};

export type ReceiptExpenseType = "personal" | "other";

export type ParsedAnalyzeRequest = {
  receiptId: string;
  hash?: string;
  perceptualHash?: string;
  filename?: string;
  location?: { lat: number; lng: number };
  marginViolation?: unknown;
  blobUrl?: string;
  originalFileSizeBytes?: number;
  ocrJson?: unknown;
  stream: boolean;
  expenseType: ReceiptExpenseType;
  completeSlipReceiptId?: string;
};

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asLocation(value: unknown): { lat: number; lng: number } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as { lat?: unknown; lng?: unknown };
  if (typeof candidate.lat !== "number" || typeof candidate.lng !== "number") return undefined;
  return { lat: candidate.lat, lng: candidate.lng };
}

export async function parseAnalyzeRequest(req: Request): Promise<ParsedAnalyzeRequest | null> {
  const body = (await req.json().catch(() => null)) as AnalyzeRequestBody | null;
  if (!body) return null;

  const ocrJson = body.ocrJson != null ? body.ocrJson : undefined;
  const explicitReceiptId = asString(body.receiptId);
  const receiptId =
    explicitReceiptId ??
    (ocrJson != null ? `json-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` : null);
  if (!receiptId) return null;

  return {
    receiptId,
    hash: asString(body.hash),
    perceptualHash: asString(body.perceptualHash),
    filename: asString(body.filename),
    location: asLocation(body.location),
    marginViolation: body.marginViolation,
    blobUrl: asString(body.blobUrl),
    originalFileSizeBytes:
      typeof body.originalFileSizeBytes === "number" && body.originalFileSizeBytes > 0
        ? body.originalFileSizeBytes
        : undefined,
    ocrJson,
    stream: body.stream === true,
    // Whitelist: only the literal string "other" survives; anything else
    // (undefined, "personal", null, garbage) falls back to "personal".
    expenseType: body.expenseType === "other" ? "other" : "personal",
    completeSlipReceiptId: asString(body.completeSlipReceiptId),
  };
}

export function createAnalyzeContext(
  input: Pick<
    ParsedAnalyzeRequest,
    | "receiptId"
    | "hash"
    | "perceptualHash"
    | "filename"
    | "location"
    | "expenseType"
    | "completeSlipReceiptId"
  >,
  startTime: number
): ReceiptContext {
  const ctx: ReceiptContext = {
    receiptId: input.receiptId,
    username: "",
    userCountry: "",
    isAdmin: false,
    hash: input.hash,
    perceptualHash: input.perceptualHash,
    filename: input.filename,
    location: input.location,
    expenseType: input.expenseType,
    ocrLines: [],
    fullText: "",
    totalPaid: 0,
    vatAmount: 0,
    currency: "TRY",
    currencySymbol: "â‚º",
    startTime,
  };
  if (input.completeSlipReceiptId) {
    (ctx as any).completeSlipReceiptId = input.completeSlipReceiptId;
  }
  return ctx;
}
