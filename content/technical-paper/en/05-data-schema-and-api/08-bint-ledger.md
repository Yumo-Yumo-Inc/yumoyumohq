# Reward accounting (normative)

## 5.7 Reward accounting (normative)

bINT accounting is **event-based**. Three record families carry it:

- **`contribution_point_events`** — append-only event rows. Every credit is written as an event with its source (`receipt`, referral, quest, ...), the source record's id, the amount, and a creation timestamp. Balances are derived from events; events are never edited in place.
- **`receipt_rewards`** — the per-receipt reward record: what a specific verified receipt earned and how the amount was composed (the composition is stored as a breakdown alongside the amount).
- **User balance** — the running balance surfaced in the product, derived from the event history.

```text
// contribution_point_events row (representative)
id:          184223            // serial
user_id:     9c41...-...       // account id
source:      receipt
source_id:   6f2b...-...       // receipt UUID
amount:      125.00            // decimal
created_at:  2026-05-17T14:23:12Z
```

### Settlement: epoch snapshots

Settlement is periodic. The epoch engine builds a snapshot of every eligible account's accrued balance for the period, writes it as `reward_epochs` + `reward_epoch_leaves` (one leaf per account), folds the leaves into a **Merkle root**, and runs an independent verification step that recomputes the root from the stored leaves before the epoch is approved. The approved root is sealed on-chain in a memo transaction, and INT claim entitlements are read from the sealed epoch's leaves.

The epoch snapshot — rather than a per-entry chain — is the auditable unit: a published epoch's leaves, root, and verification method let anyone recompute the commitment and check that the sealed root matches the records. Corrections after sealing are handled as new entries in a later epoch; sealed history is never rewritten.

---
