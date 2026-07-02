# เอนทิตีหลัก

## 5.2 เอนทิตีหลัก

```mermaid
erDiagram
    USER ||--o{ WALLET : owns
    USER ||--o{ RECEIPT : uploads
    USER ||--|| HEALTH_SNAPSHOT : has_current
    USER ||--|| LEVEL : has_current
    RECEIPT ||--o{ RECEIPT_LINE_ITEM : contains
    RECEIPT }o--|| MERCHANT : at
    RECEIPT_LINE_ITEM }o--o| CANONICAL_PRODUCT : resolves_to
    RECEIPT_LINE_ITEM ||--o| PRICE_OBSERVATION : emits
    RECEIPT ||--o| TRUST_SCORE : scored_by
    RECEIPT ||--o{ BINT_LEDGER_ENTRY : credits
    BINT_LEDGER_ENTRY }o--|| INT_ONCHAIN_EVENT : settles_to
    RECEIPT ||--o{ EPOINTS_RECORD : produces
    USER ||--|| FOUNDATION_NFT : has

    CANONICAL_PRODUCT }o--|| BRAND : belongs_to
    CANONICAL_PRODUCT }o--|| CATEGORY : belongs_to
    MERCHANT }o--o| CHAIN : member_of
```

จำนวนเชิงการ์ดินัลมีความสำคัญ: **หนึ่งใบเสร็จมีหลายรายการ** **หนึ่งรายการแก้ไขได้มากที่สุดหนึ่งสินค้ามาตรฐาน** (หรือไม่มีหากตกอยู่ในคิวที่รอดำเนินการ) **หนึ่งใบเสร็จส่งออกมากที่สุดหนึ่งคะแนนความน่าเชื่อถือ** (สามารถให้คะแนนใหม่ได้ แต่แต่ละเวอร์ชันจะแทนที่เวอร์ชันก่อนหน้า)

---
