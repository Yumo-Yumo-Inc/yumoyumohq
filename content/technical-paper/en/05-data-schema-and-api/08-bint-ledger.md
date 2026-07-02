# bINT ledger (normative)

## 5.7 bINT ledger (normative)

The off-chain mirror of bINT credits. Append-only.

```json
// BintLedgerEntry
{
  "ledger_entry_id": "01HXY...",
  "user_id": "01HXY...",
  "wallet_address": "5Hg2...8fpA",
  "source": "receipt",
  "source_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
  "amount_minor": 12500,
  "currency_code": "bINT",
  "trust_score_at_credit": "0.XX",
  "level_at_credit": "<L>",
  "health_at_credit": "0.XX",
  "daily_cap_band": "<band>",
  "created_at": "2026-05-17T14:23:12Z",
  "settled_to_chain_at": null,
  "onchain_tx_signature": null,
  "previous_entry_hash": "sha256:9a01...",
  "entry_hash": "sha256:b3f8..."
}
```

### Why a cryptographic chain

`previous_entry_hash` + `entry_hash` form a hash chain over the ledger. This gives Yumo Yumo a **verifiable audit log**: even though the ledger is operationally a Postgres table, the hash chain means a tampering attempt is detectable. The latest `entry_hash` is published on-chain periodically (a Merkle root commitment) so external parties can verify ledger integrity.

### Settlement

The settlement worker batches `BintLedgerEntry` rows with `settled_to_chain_at IS NULL` and mints the aggregated bINT on Solana. After confirmation, `settled_to_chain_at` and `onchain_tx_signature` are populated. From that point on the on-chain state is the source of truth for that entry.

---
