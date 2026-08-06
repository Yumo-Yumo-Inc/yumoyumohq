# Stage 6 — Write

## 2.9 Stage 6 — Output write

The write is split between the synchronous flow and the background post-process worker.

**Synchronous write.** When the receipt clears validation, the synchronous flow inserts the `receipts` row together with the raw vision-extraction record. This is the state the verified preview is served from: the user's receipt exists in the database the moment the preview appears.

**Asynchronous write.** The background post-process worker then completes the record:

- `receipt_line_items` — line items are written after canonical product resolution (2.7), so each row carries its canonical reference.
- `receipt_rewards` — the reward accounting entry, including the point breakdown shown to the user.
- `receipt_quality` — the quality assessment the trust layer (03) reads.

**Price observations.** Price observations are produced by a separate daily price-epoch flow that reads verified receipts, aggregates observations per epoch, and commits the epoch root on-chain in the asynchronous tier (01 Phase B). They are derived from receipt rows rather than written by the receipt pipeline itself.

Downstream flows — trust scoring, reward settlement, the price ledger — read the receipt and quality rows directly. Writes are idempotent on the receipt identifier: replay-safe in case the worker retries.

---
