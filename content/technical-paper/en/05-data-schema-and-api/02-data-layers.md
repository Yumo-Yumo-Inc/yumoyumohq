# Data layers (Vision recap)

## 5.1 Data layers (Vision recap)

The Vision Paper defines four data layers; this section maps each to concrete storage and shows what is queryable from what.

| Layer | What lives here | User access | Operations access | B2B access |
|---|---|---|---|---|
| **Device** | Original receipt image | Own data | Device scope | Device scope |
| **Hot system** | Receipt records, line items, last 90 days | Own data | Operational | Aggregate layer |
| **Warm system** | Same as hot, 91 days-3 years | Own data | Operational | Aggregate layer |
| **Anonymised aggregate** | k-anonymous panels and indices | Aggregate view | Operational | Aggregate view |
| **On-chain summary** | bINT credit hashes, INT events, NFT levels | Public | Public | Public |

The strict rule: **the anonymised aggregate is separated from single-user records**. 5.8 specifies the transformation.

---
