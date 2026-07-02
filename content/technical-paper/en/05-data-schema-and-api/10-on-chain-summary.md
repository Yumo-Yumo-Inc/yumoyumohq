# On-chain data summary

## 5.9 On-chain data summary

What goes on-chain, by category:

| On-chain | Off-chain |
|---|---|
| INT mint events | Individual `BintLedgerEntry` rows |
| INT transfer events | bINT balances and accrual records |
| Per-epoch distribution root | ePoints individual records |
| Published-dataset hash (transparency commitment) | OCR raw text |
| NFT level transitions | Receipt images and line items |
| BBB burn TX signatures | Trust score signals |

The rule is: **on-chain stores commitments and aggregates; off-chain stores content.** A user can verify their off-chain balance against an on-chain commitment while receipt contents stay in the off-chain data layer.

---
