# ผู้ค้า (normative)

## 5.5 ผู้ค้า (normative)

```json
// Merchant
{
  "merchant_id": "01HXY...",
  "name_canonical": "Migros",
  "name_aliases": ["MIGROS T.A.S.", "MIGROS A.S."],
  "tax_id_hash": "sha256:7f3a...",
  "chain_id": "chain.migros",
  "branch_code": "4521",
  "city": "Istanbul",
  "country": "TR",
  "merchant_class": "supermarket",
  "first_seen_at": "2026-01-01T00:00:00Z",
  "last_seen_at": "2026-05-17T14:23:11Z",
  "receipt_count": 18432
}
```

`tax_id_hash` แทน tax ID ดิบ — Yumo Yumo จัดการ tax ID ผู้ค้าผ่านกุญแจการสืบค้นที่แฮชเพื่อจำกัดรัศมีระเบิดหากฐานข้อมูลถูกบุกรุก

`branch_code` ถูกแยกโดยโอกาสนำ ไม่ใช่ทุกเครือข่ายที่ใช้

---
