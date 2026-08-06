# Runtime tiers

## 1.5 Runtime tiers

Yumo Yumo has three runtime tiers, each with a different budget.

| Tier | What runs here | Latency budget | Cost budget | Failure mode |
|---|---|---|---|---|
| Synchronous (request) | Vision LLM (OCR for PDFs) → regex validation → merchant resolution → reward computation | P95 < ~5 s end-to-end | < $0.02 / receipt | Show degraded preview + retry |
| Async (settlement) | Canonical product resolution, trust score update, epoch distribution root, INT claim settlement, NFT level updates | < 1 hour from verification | Solana fees | Defer to next batch |
| Daily batch | Canonical re-clustering, health-score recompute, anonymized export, BBB queue | Overnight window | Compute pool budget | Operate on yesterday's snapshot |

Splitting these tiers lets the user-facing experience stay fast even when the underlying systems are expensive or slow. The Solana mint cost (the bottleneck for sub-second on-chain UX) is amortised across batches.

---
