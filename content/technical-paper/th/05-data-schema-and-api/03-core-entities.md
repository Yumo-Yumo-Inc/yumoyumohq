# เอนทิตีหลัก

## 5.2 เอนทิตีหลัก

```mermaid
erDiagram
    USER ||--o| WALLET : links
    USER ||--o{ RECEIPT : uploads
    USER ||--|| HEALTH_SNAPSHOT : has_current
    USER ||--|| LEVEL : has_current
    RECEIPT ||--o{ RECEIPT_LINE_ITEM : contains
    RECEIPT }o--|| MERCHANT : at
    RECEIPT_LINE_ITEM }o--o| CANONICAL_PRODUCT : resolves_to
    RECEIPT_LINE_ITEM ||--o| PRICE_EPOCH_OBSERVATION : emits
    RECEIPT ||--o| TRUST_SCORE : scored_by
    RECEIPT ||--o| RECEIPT_REWARD : earns
    RECEIPT ||--o{ CONTRIBUTION_POINT_EVENT : credits
    USER ||--o{ REWARD_EPOCH_LEAF : snapshotted_in
    REWARD_EPOCH_LEAF }o--|| REWARD_EPOCH : belongs_to

    CANONICAL_PRODUCT }o--|| BRAND : belongs_to
    CANONICAL_PRODUCT }o--|| CATEGORY : belongs_to
```

จำนวนเชิงการ์ดินัลมีความสำคัญ: **หนึ่งใบเสร็จมีหลายรายการ** **หนึ่งรายการแก้ไขได้มากที่สุดหนึ่งสินค้ามาตรฐาน** (หรือไม่มีหากตกอยู่ในคิวที่รอดำเนินการ) **หนึ่งใบเสร็จส่งออกมากที่สุดหนึ่งคะแนนความน่าเชื่อถือ** (สามารถให้คะแนนใหม่ได้ แต่แต่ละเวอร์ชันจะแทนที่เวอร์ชันก่อนหน้า) การบัญชีรางวัลไหลผ่านแถว `contribution_point_events` แบบเพิ่มได้อย่างเดียว (append-only) และใบสแนปช็อตราย epoch (5.7) ส่วนบัญชีแยกประเภทราคารับแถวการสังเกตที่ไม่ผูกกับตัวตน (5.6)

---
