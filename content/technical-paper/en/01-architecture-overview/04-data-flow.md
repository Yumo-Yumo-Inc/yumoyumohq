# Data flow: from receipt to bINT

## 1.3 Data flow: from receipt to bINT

A receipt's journey runs in two phases.

**Phase A — Synchronous (the user is waiting):**

1. The client compresses the image, strips EXIF, and requests a presigned upload URL.
2. The image lands in object storage. The server checks a perceptual-hash deduplication index.
3. The OCR layer (02 Stage 1) extracts text + bounding boxes.
4. The LLM router (02 Stage 2) extracts a structured `ReceiptExtraction` JSON.
5. The regex/rule layer (02 Stage 3) reconciles totals and validates dates.
6. The canonical matcher (02 Stage 4) resolves each line item to a canonical product ID.
7. The merchant resolver (02 Stage 5) attaches a merchant identity.
8. The trust scorer (03) emits a trust score in [0, 1] and the system shows the user a verified preview.

**Phase B — Asynchronous (background settlement):**

9. If the trust score clears the threshold, a `bINT.pending` row is written to the ledger.
10. The settlement worker hourly batch aggregates pending credits, computes daily ceilings (03), and mints bINT on Solana to the user's frozen ATA.
11. The indexer picks up the on-chain mint event and confirms back to the off-chain ledger.

The user sees Phase A in seconds. Phase B finalises invisibly. The contract between the two phases is: **the off-chain ledger is the source of truth until on-chain settlement**, after which the on-chain state is the source of truth and the ledger is a fast-read mirror.

---
