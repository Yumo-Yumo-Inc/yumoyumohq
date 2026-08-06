# Data layers (Vision recap)

## 5.1 Data layers (Vision recap)

The Vision Paper defines the data layers; this section maps each to concrete storage and shows what is queryable from what.

| Layer | What lives here | User access | Operations access | B2B access |
|---|---|---|---|---|
| **Device** | Original receipt image | Own data | Device scope | Device scope |
| **System of record** | Receipt records, line items, reward events — single managed Postgres (Neon) | Own data | Operational | Aggregate layer |
| **Anonymised aggregate** | k-anonymous panels and indices | Aggregate view | Operational | Aggregate view |
| **On-chain summary** | Epoch Merkle roots (reward + price), INT events | Public | Public | Public |

Age-based hot/warm tiering of the system of record is a **scaling option**, planned for when volume warrants it; today one Postgres instance holds the full history.

The strict rule: **the anonymised aggregate is separated from single-user records**. 5.8 specifies the transformation.

---
