# API surface

## 5.10 API surface

### Current: application routes

The live API is the application's own route surface: **session-authenticated routes under `/api/*` on `yumoyumo.com`**, served by the same Next.js deployment as the product. Authentication is the user's session; there is no separate developer credential today.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/receipt/upload` | Upload a receipt image | Session |
| POST | `/api/receipt/analyze` | Run the pipeline on an upload | Session |
| GET  | `/api/receipts` | List the user's receipts | Session (own only) |
| GET  | `/api/receipts/{id}` | Fetch a receipt record | Session (own only) |
| GET  | `/api/wallet/summary` | Points balance and history | Session |
| GET  | `/api/prices/epoch/{epoch}` | Public price-epoch data: epoch metadata, observation pages, and Merkle inclusion proofs (`?proof=<leaf_hash>`) | Public |
| GET  | `/api/prices/product/{productId}` | Public price history for a catalog product | Public |

The price-ledger routes are the public read surface today: anyone can fetch a sealed epoch, pull its observations, and request an inclusion proof that folds to the on-chain root. The published Arweave manifests provide the same data independently of these routes.

### Planned: versioned public REST API

A versioned public REST API for third-party applications is **planned future work**. The design sketch: a `/v1` base on `yumoyumo.com`, standards-based delegated authorization for third-party clients, resource-style receipt and reward endpoints, and event subscriptions for state changes (receipt verified, reward credited, epoch sealed). The concrete surface will be specified when the developer program opens; the application routes above are the contract until then.

---
