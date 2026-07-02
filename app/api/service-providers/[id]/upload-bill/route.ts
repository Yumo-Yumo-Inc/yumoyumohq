/**
 * POST /api/service-providers/:id/upload-bill
 *
 * Uploads a bill/membership image for a service provider (Türk Telekom,
 * Netflix, BEDAŞ, etc.). Logic runs parallel to the receipt upload pipeline,
 * but validation is focused on "digital bill" — provider matching is
 * pre-linked, line item parsing is optional.
 *
 * Phase 1 (this PR): blob storage + receipts stub row (status=pending_bill_review)
 * Phase 2 (later): bill-mode GPT-4o prompt + amount/period extraction + auto-link
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID, createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { getSessionUsername } from "@/lib/auth/session";
import { getServiceProviderById } from "@/lib/service-providers/server";
import { insertDigitalBillStub } from "@/lib/service-providers/bills";

export const maxDuration = 30;

// Vercel serverless function body limit is 4.5MB; a higher value here makes
// the platform layer return 413 Payload Too Large, and since the body comes
// back as HTML, frontend's JSON.parse can't find `body.error` and falls back
// to `sample_upload_failed`. Kept equal to the real limit so the user sees a
// clear error.
const MAX_BYTES = 4.5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

function isBlobAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

const isVercel = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
const LOCAL_UPLOAD_DIR = isVercel
  ? path.join("/tmp", "uploads")
  : process.env.YUMO_UPLOAD_DIR?.trim() || path.join(os.homedir(), ".yumoyumo-data", "uploads");

function buildLocalUploadPath(filename: string): string {
  return `${LOCAL_UPLOAD_DIR}${path.sep}${filename}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const providerId = Number.parseInt(idParam, 10);
  if (!Number.isFinite(providerId) || providerId <= 0) {
    return NextResponse.json({ error: "invalid_provider_id" }, { status: 400 });
  }

  const provider = await getServiceProviderById(username, providerId);
  if (!provider) {
    return NextResponse.json({ error: "provider_not_found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "invalid_file_size" }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }

  // Hash computation — for duplicate detection
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const receiptHash = createHash("sha256").update(buffer).digest("hex");

  const receiptId = randomUUID();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const blobName = `bills/${receiptId}.${ext}`;

  let blobUrl: string | null = null;

  if (isBlobAvailable()) {
    try {
      const blob = await put(blobName, buffer, {
        access: "public",
        contentType: file.type || "application/octet-stream",
      });
      blobUrl = blob.url;
    } catch (error) {
      console.error("[bills/upload] blob storage failed", error);
      return NextResponse.json(
        { error: "blob_upload_failed" },
        { status: 502 },
      );
    }
  } else {
    try {
      await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
      await writeFile(buildLocalUploadPath(`${receiptId}.${ext}`), buffer);
    } catch (error) {
      console.error("[bills/upload] local file storage failed", error);
      return NextResponse.json(
        { error: "local_upload_failed" },
        { status: 502 },
      );
    }
  }

  try {
    const stub = await insertDigitalBillStub({
      receiptId,
      username,
      providerId,
      providerName: provider.name,
      blobUrl,
      receiptHash,
      imagePhash: null,
    });

    // NOTE: This used to call /api/receipt/analyze, but that pipeline is
    // designed for classic retail receipts (line items, VAT, hidden cost,
    // fraud, reward). Digital bill rules differ: no line items, provider is
    // pre-matched, the period matters, no reward/margin. Bill-mode extraction
    // will be written as a separate endpoint in Phase 2. For now, only store
    // the stub row and the blob; the user can manually enter amount/period
    // under the provider.
    return NextResponse.json({
      success: true,
      receiptId: stub.receiptId,
      providerId: stub.providerId,
      providerName: provider.name,
      providerCategory: provider.category,
      blobUrl: stub.blobUrl,
      status: stub.status,
      analyzed: false,
      extracted: null,
      provider: null,
      pollUrl: `/api/receipt/${stub.receiptId}`,
    });
  } catch (error) {
    console.error("[bills/upload] stub insert failed", error);
    return NextResponse.json({ error: "db_write_failed" }, { status: 500 });
  }
}
