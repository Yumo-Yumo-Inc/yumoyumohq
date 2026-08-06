# On-chain data summary

## 5.9 On-chain data summary

What goes on-chain, by category:

| On-chain | Off-chain |
|---|---|
| Reward-epoch Merkle root (memo seal) | Individual `contribution_point_events` rows |
| Price-epoch Merkle root + manifest hash (memo seal) | bINT balances and accrual records |
| INT mint and transfer events (planned) | Per-user reward accrual records |
| NFT level transitions (planned) | OCR raw text |
| | Receipt images and line items |
| | Trust score signals |

The rule is: **on-chain stores commitments and aggregates; off-chain stores content.** A user can verify their off-chain balance against an on-chain commitment while receipt contents stay in the off-chain data layer.

The public price-ledger publication flow and private receipt-inclusion proof are specified in 06.

---
