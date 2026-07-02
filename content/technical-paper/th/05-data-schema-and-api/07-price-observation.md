# การสังเกตราคา (normative)

## 5.6 การสังเกตราคา (normative)

ตารางความจำราคา หนึ่งแถวต่อ `(canonical_product_id, merchant_id, เวลาสังเกต)`

```json
// PriceObservation
{
  "observation_id": "01HXY...",
  "canonical_product_id": "cp.pinar.milk.1l",
  "merchant_id": "01HXY...",
  "chain_id": "chain.migros",
  "city": "Istanbul",
  "observed_at": "2026-05-17T14:23:11Z",
  "unit_price_minor": 2350,
  "currency": "TRY",
  "trust_score": "0.XX",
  "is_promotional": false
}
```

นี่คือตารางที่ขับเคลื่อน:

1. **ความจำราคาผู้ใช้** — "คุณจ่าย 23.50 TL สำหรับ Pınar süt ที่ Migros ค่ามัธยฐานสัปดาห์นี้คือ 22.10 TL"
2. **ดัชนีราคา B2B** — รวมตาม `(canonical_product_id, region, week)` พร้อมบังคับใช้เกณฑ์ k-anonymity
3. **ชีพจรเงินเฟ้อ** — ดัชนีตะกร้าความถี่สูงคำนวณรายคืน

แถวที่ต่ำกว่าพื้นคุณภาพที่ปรับแต่งในระบบผลิตถูกเขียนแต่ถูกยกเว้นจากการคำนวณดัชนี

---
