# Stage 0 — Upload

## 2.3 Stage 0 — Upload and preprocessing

### Client side

The client resizes and applies lossy compression to the image — enough resolution for OCR while keeping upload sizes small on typical phones. Exact resolution and quality targets are managed in the internal operations layer. EXIF metadata is stripped before upload; geo-enrichment starts from explicit user opt-in.

Perceptual hashing for deduplication is performed server-side once the image is received (2.3.3).

### Server side

```json
// UploadRequest
{
  "user_id": "uuid",
  "content_type": "image/jpeg",
  "size_bytes": 524288,
  "captured_at": "2026-05-17T14:23:00Z"
}

// UploadResponse
{
  "receipt_id": "uuid",
  "upload_url": "https://...",
  "expires_at": "2026-05-17T14:24:00Z"
}
```

The server validates the upload size against a production-defined limit, allowlists the content type (`image/jpeg`, `image/png`, `application/pdf`), and issues a short-lived presigned URL. After the PUT succeeds, the client calls `POST /receipts/{id}/process` to enter Stage 1.

### Deduplication

A multi-signal perceptual similarity check runs before any expensive work starts. Two cases are distinguished:

1. **Same-user duplicate** — repeat uploads of the same receipt by the same user resolve to the existing record. This prevents accidental double-uploads.
2. **Cross-user collision** — receipts that appear to be shared between accounts are flagged for trust review (Stage 6 downgrades them). This is part of the anti-farming defense.

A same-user duplicate is a **soft success** — the user sees their previous result. A cross-user signal still proceeds through the pipeline; the trust scorer decides. The exact similarity thresholds and signals are tuned in production and managed in the internal operations layer.

---
