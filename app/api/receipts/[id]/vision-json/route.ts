import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { promises as fs } from "fs";
import path from "path";
import { getSql } from "@/lib/db/client";

const UPLOAD_DIR = process.env.VERCEL === "1"
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), ".data", "uploads");

import { isAdminUser } from "@/lib/auth/admin-users";

/** Call Google Vision DOCUMENT_TEXT_DETECTION; content is base64 image string. */
async function runVisionWithBase64(imageBase64: string): Promise<unknown> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_VISION_API_KEY not set");
  const clean = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate`;
  const visionResponse = await fetch(visionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify({
      requests: [{
        image: { content: clean },
        features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
        imageContext: { languageHints: ["tr", "en", "th"] },
      }],
    }),
  });
  if (!visionResponse.ok) {
    const errText = await visionResponse.text();
    throw new Error(`Vision API error: ${visionResponse.status} ${errText.slice(0, 200)}`);
  }
  const data = await visionResponse.json();
  return data.responses?.[0] ?? null;
}

/** Fetch image from URL, then run Vision; returns responses[0]. */
async function fetchVisionJson(imageUrl: string): Promise<unknown> {
  const imageResponse = await fetch(imageUrl, { redirect: "error" });
  if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.status}`);
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageContent = Buffer.from(imageBuffer).toString("base64");
  return runVisionWithBase64(imageContent);
}

/**
 * GET /api/receipts/[id]/vision-json
 * Returns Google Vision raw JSON (admin only).
 * 1) receipt_data.visionRawJson 2) receipts.vision_json 3) receipt_vision_raw 4) on-demand from DB blob_url.
 */
const ALLOWED_URL_PREFIXES = [
  "https://public.blob.vercel-storage.com/",
  "https://storage.googleapis.com/",
];
function isAllowedImageUrl(url: string): boolean {
  return ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const username = await getSessionUsername();

    if (!username || !isAdminUser(username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const imageUrlFromQuery = searchParams.get("imageUrl");
    const debug = searchParams.get("debug") === "1";

    const { id } = await params;
    const idTrimmed = (id?.trim() ?? id)?.replace(/^\{|\}$/g, "") ?? "";
    if (!idTrimmed) {
      return NextResponse.json({ error: "Receipt ID required" }, { status: 400 });
    }
    const idLower = idTrimmed.toLowerCase();

    const sql = getSql();
    if (!sql) {
      return NextResponse.json(
        {
          error: "Database not available",
          hint: "DATABASE_URL is not set. Check .env.local and restart the dev server.",
        },
        { status: 503 }
      );
    }

    // Single query: receipt_data + blob_url + vision_json (same row, consistent).
    type ReceiptRow = { receipt_data: unknown; blob_url?: string | null; vision_json?: unknown };
    let rows: { receipt_data: unknown; blob_url?: string | null; vision_json?: unknown }[];
    try {
      let r = await sql`
        SELECT receipt_data, blob_url, vision_json
        FROM receipts
        WHERE receipt_id = ${idTrimmed}
        LIMIT 1
      `;
      if (r.length === 0) {
        r = await sql`
          SELECT receipt_data, blob_url, vision_json
          FROM receipts
          WHERE LOWER(TRIM(receipt_id::text)) = ${idLower}
          LIMIT 1
        `;
      }
      rows = r as ReceiptRow[];
    } catch {
      rows = [];
      try {
        let r = await sql`SELECT receipt_data FROM receipts WHERE receipt_id = ${idTrimmed} LIMIT 1`;
        if (r.length === 0) r = await sql`SELECT receipt_data FROM receipts WHERE LOWER(TRIM(receipt_id::text)) = ${idLower} LIMIT 1`;
        rows = (r as { receipt_data: unknown }[]).map((x) => ({ ...x, blob_url: null, vision_json: null }));
      } catch {
        rows = [];
      }
    }
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Vision JSON not found", receiptId: idTrimmed },
        { status: 404 }
      );
    }

    const row0 = rows[0] as ReceiptRow;
    const receiptData = row0.receipt_data;
    let parsed: Record<string, unknown> | null = null;
    if (receiptData != null) {
      try {
        parsed = typeof receiptData === "string" ? (JSON.parse(receiptData as string) as Record<string, unknown>) : (receiptData as Record<string, unknown>);
      } catch {
        parsed = null;
      }
    }

    // 1) From receipt_data.visionRawJson
    const visionFromData = parsed?.visionRawJson ?? null;
    if (visionFromData != null) {
      return NextResponse.json(visionFromData);
    }

    // 2) From receipts.vision_json (already in row0)
    if (row0.vision_json != null) {
      return NextResponse.json(row0.vision_json);
    }

    // 3) From receipt_vision_raw (populated when receipt saved with visionRawJson)
    try {
      let rawRows = await sql`
        SELECT vision_json FROM receipt_vision_raw WHERE receipt_id = ${idTrimmed} LIMIT 1
      `;
      if (rawRows.length === 0) {
        rawRows = await sql`
          SELECT vision_json FROM receipt_vision_raw WHERE LOWER(TRIM(receipt_id::text)) = ${idLower} LIMIT 1
        `;
      }
      if (rawRows.length > 0) {
        const v = (rawRows[0] as { vision_json: unknown }).vision_json;
        if (v != null) return NextResponse.json(v);
      }
    } catch {
      /* table may not exist */
    }

    // 4) From receipt_vision_pending (analyze-time persist; no FK, works before receipt saved)
    try {
      let pendingRows = await sql`
        SELECT vision_json FROM receipt_vision_pending WHERE receipt_id = ${idTrimmed} LIMIT 1
      `;
      if (pendingRows.length === 0) {
        pendingRows = await sql`
          SELECT vision_json FROM receipt_vision_pending WHERE LOWER(TRIM(receipt_id::text)) = ${idLower} LIMIT 1
        `;
      }
      if (pendingRows.length > 0) {
        const v = (pendingRows[0] as { vision_json: unknown }).vision_json;
        if (v != null) return NextResponse.json(v);
      }
    } catch {
      /* table may not exist */
    }

    // 5) On-demand Vision: use blob_url from row0 (try blob_url + blobUrl), receipt_data, or evidence
    const blobFromRowRaw = (row0 as Record<string, unknown>).blob_url ?? (row0 as Record<string, unknown>).blobUrl;
    const blobFromRow = blobFromRowRaw && typeof blobFromRowRaw === "string" && blobFromRowRaw.startsWith("http") ? blobFromRowRaw : null;
    const blobFromParsed = (parsed?.blobUrl ?? parsed?.blob_url ?? parsed?.fullBlobUrl ?? parsed?.imageUrl) as string | undefined;
    const blobFromEvidence = parsed?.evidence && typeof parsed.evidence === "object" && "imageUrl" in parsed.evidence
      ? (parsed.evidence as { imageUrl?: string }).imageUrl
      : null;
    let blobFromVercelList: string | null = null;
    if (!blobFromRow && !blobFromParsed && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { list } = await import("@vercel/blob");
        const { blobs } = await list({ prefix: `receipts/${idTrimmed}` });
        const blob = blobs.find((b) => !b.pathname?.includes(".full.")) ?? blobs[0];
        if (blob?.url) blobFromVercelList = blob.url;
      } catch {
        /* ignore */
      }
    }
    const imageUrl =
      imageUrlFromQuery ??
      blobFromRow ??
      (blobFromParsed && String(blobFromParsed).startsWith("http") ? blobFromParsed : null) ??
      (blobFromEvidence && String(blobFromEvidence).startsWith("http") ? blobFromEvidence : null) ??
      (blobFromVercelList && blobFromVercelList.startsWith("http") ? blobFromVercelList : null);

    // 6) Fallback: image in receipt_upload_fallback (when Blob failed; stores BYTEA)
    if (!imageUrl) {
      try {
        let fallbackRows = await sql`
          SELECT image_data FROM receipt_upload_fallback WHERE receipt_id = ${idTrimmed} LIMIT 1
        `;
        if (fallbackRows.length === 0) {
          fallbackRows = await sql`
            SELECT image_data FROM receipt_upload_fallback WHERE LOWER(TRIM(receipt_id::text)) = ${idLower} LIMIT 1
          `;
        }
        if (fallbackRows.length > 0) {
          const row = fallbackRows[0] as { image_data: Buffer | Uint8Array };
          const data = row.image_data;
          const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as Uint8Array);
          const base64 = buffer.toString("base64");
          const visionJson = await runVisionWithBase64(base64);
          if (visionJson != null) return NextResponse.json(visionJson);
        }
      } catch {
        /* table may not exist or Vision failed */
      }
      try {
        const files = await fs.readdir(UPLOAD_DIR).catch(() => []);
        const file = files.find((f) => f.startsWith(idTrimmed) && !f.includes(".full."));
        if (file) {
          const filePath = path.join(UPLOAD_DIR, file);
          const buffer = await fs.readFile(filePath);
          const base64 = buffer.toString("base64");
          const visionJson = await runVisionWithBase64(base64);
          if (visionJson != null) return NextResponse.json(visionJson);
        }
      } catch {
        /* local upload dir may not exist */
      }
    }

    if (debug) {
      const diag = {
        receiptFound: rows.length > 0,
        hasVisionFromData: visionFromData != null,
        hasVisionFromReceipts: row0.vision_json != null,
        blobFromRow: !!blobFromRow,
        blobFromParsed: !!blobFromParsed,
        blobFromVercelList: !!blobFromVercelList,
        blobFromVercelListPreview: blobFromVercelList ? blobFromVercelList.slice(0, 60) + "..." : null,
        imageUrl: !!imageUrl,
        imageUrlPreview: imageUrl ? String(imageUrl).slice(0, 80) + "..." : null,
        parsedKeys: parsed ? Object.keys(parsed).filter((k) => k.toLowerCase().includes("blob") || k.toLowerCase().includes("url") || k.toLowerCase().includes("image")) : [],
      };
      return NextResponse.json(diag);
    }

    if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("http")) {
      if (!isAllowedImageUrl(imageUrl)) {
        return NextResponse.json(
          { error: "imageUrl must point to an allowed storage domain" },
          { status: 400 }
        );
      }
      try {
        const visionJson = await fetchVisionJson(imageUrl);
        if (visionJson != null) {
          return NextResponse.json(visionJson);
        }
      } catch (onDemandErr: unknown) {
        console.error("[api/receipts/[id]/vision-json] on-demand Vision failed:", onDemandErr);
        const msg = onDemandErr instanceof Error ? onDemandErr.message : String(onDemandErr);
        return NextResponse.json(
          { error: "Vision API call failed (image URL found but request failed)", details: msg },
          { status: 502 }
        );
      }
    }

    // Receipt exists but no vision data (e.g. OCR-from-JSON, or old receipt) — return 200 so UI does not treat as error
    return NextResponse.json(
      { _noVision: true, message: "There is no Vision JSON for this receipt (it was analyzed from OCR JSON or no image is available).", receiptId: idTrimmed },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[api/receipts/[id]/vision-json] GET error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch vision JSON", details: msg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/receipts/[id]/vision-json
 * Body: { imageBase64: string } — run Vision on this image and return responses[0].
 * Use when GET 404 (e.g. page has only synthetic image; client sends blob as base64).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const username = await getSessionUsername();
    if (!username || !isAdminUser(username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Receipt ID required" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const imageBase64 = body?.imageBase64;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Body must include imageBase64 (base64 image string)" },
        { status: 400 }
      );
    }
    const visionJson = await runVisionWithBase64(imageBase64);
    if (visionJson == null) {
      return NextResponse.json(
        { error: "Vision returned no response" },
        { status: 502 }
      );
    }
    return NextResponse.json(visionJson);
  } catch (error: unknown) {
    console.error("[api/receipts/[id]/vision-json] POST error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Vision processing failed" },
      { status: 502 }
    );
  }
}
