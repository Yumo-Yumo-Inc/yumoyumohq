# Stage 6 — Write

## 2.9 Stage 6 — Output write

A single Postgres transaction writes:

```
INSERT INTO receipts (...) VALUES (...);
INSERT INTO receipt_line_items (...) VALUES (...);
INSERT INTO price_observations (...) VALUES (...);
INSERT INTO events (event_type, payload) VALUES ('receipt.verified', {...});
```

The `events` row triggers two downstream consumers:

- **Trust scorer** (03) — picks up the event, computes the trust score, writes to `trust_scores`.
- **Settlement worker** — queues a `bINT.pending` credit. The actual on-chain mint happens in the asynchronous tier (01 Phase B).

The transaction is idempotent on an internal write key: replay-safe in case the worker retries.

---
