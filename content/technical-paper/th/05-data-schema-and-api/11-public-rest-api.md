# REST API สาธารณะ

## 5.10 REST API สาธารณะ

```
Base: https://api.yumo.io/v1
Auth: OAuth 2.0 PKCE (public client) · Bearer token
Rate limit: จำกัดตามผู้ใช้และตามแอปพลิเคชัน; โควต้าปัจจุบันดูได้จากเอกสารอ้างอิง SDK
```

| Method | Path | วัตถุประสงค์ | Auth |
|---|---|---|---|
| POST | `/receipts/upload` | รับ URL อัปโหลดที่ลงนามล่วงหน้า | User |
| POST | `/receipts/{id}/process` | เริ่มการประมวลผลไปป์ไลน์ | User |
| GET  | `/receipts/{id}` | ดึงบันทึกใบเสร็จ | User (ของตนเองเท่านั้น) |
| GET  | `/receipts` | แสดงรายการใบเสร็จของผู้ใช้ | User (เฉพาะของตนเอง) |
| GET  | `/users/me/price-memory` | ความจำราคาส่วนบุคคล | User |
| GET  | `/users/me/bint` | ยอดคงเหลือและประวัติ bINT | User |
| POST | `/conversions/bint-to-int` | แปลง bINT → INT (เตรียม TX) | User |
| GET  | `/users/me/level` | ระดับ + สแน็ปช็อตสุขภาพ | User |
| GET  | `/canonical-products/{id}` | รายละเอียดสาธารณะของสินค้ามาตรฐาน | Public |
| GET  | `/merchants/{id}` | รายละเอียดสาธารณะของผู้ค้า | Public |

### Webhooks

แอปพลิเคชันสามารถสมัครรับเหตุการณ์ที่ผูกกับขอบเขตของผู้ใช้ได้:

```json
// receipt.verified
{
  "event_type": "receipt.verified",
  "event_id": "01HXY...",
  "occurred_at": "2026-05-17T14:23:13Z",
  "data": {
    "receipt_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
    "user_id": "01HXY...",
    "trust_score": "0.XX",
    "bint_credited_minor": 12500
  }
}
```

ประเภทเหตุการณ์ที่ v1: `receipt.verified`, `receipt.rejected`, `bint.credited`, `bint.settled`, `conversion.completed`, `level.advanced`.

---
