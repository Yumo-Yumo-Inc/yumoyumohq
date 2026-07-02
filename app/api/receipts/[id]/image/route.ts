import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin-users";
import { getReceiptById } from "@/lib/receipt/storage-db";
import { resolveReceiptImageBuffer } from "@/lib/receipt/resolve-receipt-image";

/**
 * GET /api/receipts/[id]/image
 * Serves the original receipt image. Scoped to the receipt owner OR an admin —
 * the image is the user's own upload, so the owner may view it too.
 *
 * The image is resolved from wherever it actually lives, in order: the blob URL
 * embedded in receipt_data, Vercel Blob (by receipts/<id>.<ext>), the Neon
 * upload fallback table, then local disk. This makes images viewable even for
 * receipts scanned on the local dev server (no Vercel Blob, file only on disk).
 *
 * Served inline so it can back an <img>; pass `?download=1` for an attachment.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idTrimmed = id?.trim() ?? id;
    if (!idTrimmed) {
      return NextResponse.json({ error: "Receipt ID required" }, { status: 400 });
    }

    const isAdmin = isAdminUser(username);

    // Ownership check (admin bypasses). getReceiptById returns null when the
    // receipt does not exist or does not belong to the caller — same 404 either
    // way so we never leak which receipt ids exist.
    const receipt = await getReceiptById(idTrimmed, username, isAdmin);
    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found", receiptId: idTrimmed },
        { status: 404 }
      );
    }

    const dbBlobUrl = (receipt as { blobUrl?: string | null }).blobUrl ?? null;
    const resolved = await resolveReceiptImageBuffer({
      receiptId: idTrimmed,
      receiptData: receipt,
      dbBlobUrl,
    });

    if (!resolved) {
      return NextResponse.json(
        {
          error: "No image available for this receipt",
          receiptId: idTrimmed,
          // Diagnostic hint for admins: a locally-scanned receipt (no Vercel Blob)
          // only has its file on the machine that ran the upload.
          hint: isAdmin ? "Blob/Neon/local disk'te görsel bulunamadı." : undefined,
        },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const asDownload = url.searchParams.get("download") === "1";
    // Sniff content type from the magic bytes; default to jpeg.
    const buf = resolved.buffer;
    let contentType = "image/jpeg";
    if (buf.length > 3 && buf[0] === 0x89 && buf[1] === 0x50) contentType = "image/png";
    else if (buf.length > 11 && buf[8] === 0x57 && buf[9] === 0x45) contentType = "image/webp";
    else if (buf.length > 2 && buf[0] === 0x47 && buf[1] === 0x49) contentType = "image/gif";

    const ext = contentType.split("/")[1] === "png" ? "png" : contentType.split("/")[1];
    const filename = `receipt-${idTrimmed.slice(0, 8)}.${ext}`;
    const disposition = asDownload
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=60",
        "X-Image-Source": resolved.source,
      },
    });
  } catch (error: unknown) {
    console.error("[api/receipts/[id]/image] GET error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch image", details: msg },
      { status: 500 }
    );
  }
}
