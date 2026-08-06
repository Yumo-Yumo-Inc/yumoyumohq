# Stage 0 — Upload

## 2.3 Stage 0 — Upload and preprocessing

### Client side

The client submits the captured image or PDF directly to the application's upload endpoint as a multipart POST. Preprocessing is a server responsibility: keeping the client thin means every capture surface benefits from the same normalization without shipping image-processing code to each platform.

### Server side

The upload route validates the request before any storage work:

- **Size limit** — the upload size is checked against a production-defined limit.
- **Magic-byte sniffing** — the server inspects the leading bytes of the buffer to confirm the payload really is a raster image (`JPEG`, `PNG`, `WEBP`, `HEIC` and other supported formats) or a PDF, regardless of the client-supplied `Content-Type`. This blocks scripts or markup smuggled in under an `image/*` type.

Accepted uploads then pass through server-side preprocessing with `sharp`:

- **Orientation** — EXIF-based auto-rotation so the receipt is upright before the reading stage.
- **Compression** — the image is re-encoded to a size and quality profile tuned for the vision stage.
- **Storage** — the processed image is written to Vercel Blob object storage, with a database fallback path when Blob storage is unavailable. Stored images are scheduled for deletion according to retention policy.

The response returns a `receipt_id` and the stored image reference. The client then calls `POST /api/receipt/analyze` to enter Stage 1.

### Deduplication

An exact file-hash check runs before any expensive work starts: the SHA-256 of the uploaded bytes is compared against previously stored receipts. A perceptual-similarity check is deliberately deferred until after content extraction, where it can be cross-checked against a content hash; running visual comparison early would spend that work on uploads the exact check already resolves.

Both duplicate cases reject the upload with a duplicate error:

1. **Same-user duplicate** — the user is told they already uploaded this receipt. This prevents accidental double-uploads and repeat-reward attempts.
2. **Cross-user collision** — the user is told the receipt was uploaded by another account. This is part of the anti-farming defense.

The exact similarity signals are tuned in production and managed in the internal operations layer.

---
