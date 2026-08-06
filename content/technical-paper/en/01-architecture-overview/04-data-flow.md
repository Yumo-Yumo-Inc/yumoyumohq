# Data flow: from receipt to bINT

## 1.3 Data flow: from receipt to bINT

A receipt's journey runs in two phases.

**Phase A — Synchronous (the user is waiting):**

1. The client sends the file to the upload endpoint. The server compresses the image, strips EXIF metadata, and stores the result in object storage. A perceptual-hash deduplication index is checked before analysis.
2. For image input, the vision LLM (02 Stage 2) reads the receipt directly from the image in a single call. For PDF input, an OCR layer (02 Stage 1) first extracts the text, which then feeds the same LLM stage.
3. The LLM returns **labeled plain text**: a block of `FIELD: value` lines for merchant, date, totals, and payment fields, plus a pipe-separated table for line items. Parsing is defensive — a missing or malformed line leaves that field `null` and the pipeline continues.
4. The regex/rule layer (02 Stage 3) reconciles totals and validates dates.
5. The merchant resolver (02 Stage 5) attaches a merchant identity.
6. The trust layer (03) classifies the receipt's quality, and the reward is computed within the same request, so the user sees the verified preview and the reward together.

**Phase B — Asynchronous (background settlement):**

7. A background post-process worker resolves each line item to a canonical product ID (02 Stage 4) using database-side fuzzy matching with an LLM fallback, and folds the receipt's quality classification into the user's cumulative trust score.
8. The settlement worker aggregates eligible bINT credits, applies daily ceilings, and produces an epoch distribution root for the corresponding INT claims.
9. The distribution root is committed on-chain. The indexer confirms INT claim transfers from the distributor back to the off-chain ledger.

The user sees Phase A in seconds. Phase B finalises asynchronously. The off-chain bINT ledger remains the source of truth for contribution credits; the on-chain root and claim transfers record the corresponding INT distribution.

---
