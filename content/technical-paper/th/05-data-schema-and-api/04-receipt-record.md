# บันทึกใบเสร็จ (normative)

## 5.3 บันทึกใบเสร็จ (normative)

บันทึกใบเสร็จตามที่ API ของแอปพลิเคชันเองส่งคืน (การอ่านที่ยืนยันตัวตนด้วย session ภายใต้ `/api/receipts`) ชื่อฟิลด์ที่แสดงเป็นตัวแทนของบันทึกที่จัดเก็บจริง

```json
// Receipt
{
  "receipt_id": "6f2b8c1e-4a7d-4f2b-9c41-0e5d8a3b7f10",
  "user": "yumo_user",
  "uploaded_at": "2026-05-17T14:23:11Z",
  "receipt_date": "2026-05-17",
  "currency": "TRY",
  "merchant": {
    "merchant_id": "f3b1c2d4-...",
    "display_name": "Migros",
    "city": "Istanbul",
    "tax_id": "6200278131"
  },
  "totals": {
    "subtotal": "234.50",
    "tax_total": "42.21",
    "grand_total": "276.71",
    "currency": "TRY"
  },
  "tax_lines": [
    { "rate_pct": 18.0, "base": "200.00", "amount": "36.00" },
    { "rate_pct": 8.0,  "base": "77.50",  "amount": "6.20"  }
  ],
  "payment_method": "credit_card",
  "document_type": "receipt",
  "is_payment_proof": true,
  "line_items": [
    {
      "raw_text": "SUT 1L PINAR",
      "canonical_product_id": "3f6a...-...",
      "qty": 2.0,
      "unit_price": "23.50",
      "line_total": "47.00",
      "tax_rate_pct": 8.0,
      "match_confidence": "0.XX"
    }
  ],
  "pipeline": {
    "document_reader_class": "receipt_ocr",
    "ocr_confidence": "0.XX",
    "extraction_route_class": "structured_receipt",
    "extraction_confidence": "0.XX",
    "rules_confidence": "0.XX",
    "self_consistency_check": false
  },
  "trust": {
    "score": "0.XX",
    "band": "<band>",
    "signals_present": ["total_reconciliation", "merchant_consistency"]
  },
  "rewards": {
    "bint_credited": "125.00",
    "reward_epoch": null
  },
  "status": "verified",
  "proof_status": null,
  "linked_receipt_id": null
}
```

ค่าความเชื่อมั่นและคะแนนความน่าเชื่อถือแสดงเป็นตัวยึดตำแหน่ง ช่วงการผลิต ขอบเขตวง และน้ำหนักสัญญาณจัดการอยู่ในชั้นปฏิบัติการภายใน

### ข้อตกลงฟิลด์

| ข้อตกลง | กฎ |
|---|---|
| IDs | คีย์หลักแบบ UUID สำหรับใบเสร็จและร้านค้า; id จำนวนเต็มแบบ serial บนตารางเหตุการณ์และบัญชีแยกประเภท |
| จำนวนเงิน | ค่าทศนิยม จัดรูปเป็นสตริงทศนิยมมาตรฐาน (ทศนิยม 2 ตำแหน่งสำหรับเงิน) |
| เวลาประทับ | ISO 8601 พร้อมคำต่อท้าย `Z` UTC เสมอ |
| แฮช | เลขฐานสิบหกตัวพิมพ์เล็ก อัลกอริทึมระบุตามบริบทของฟิลด์ |
| Nullable | ฟิลด์ที่ขาดหายใช้ `null` อย่างชัดเจน |
| สถานะ enum | `verified`, `saved`, `analyzed` |

### สถานะและการจัดการหลักฐานการชำระเงิน

ค่าสถานะที่ใช้งานจริง:

```
analyzed  — ไพพ์ไลน์ผลิตผลลัพธ์แล้ว แต่ยังไม่ถูกบันทึกเป็นรายการที่เก็บไว้
saved     — ผู้ใช้เก็บไว้
verified  — ผ่านประตูการตรวจสอบ; มีสิทธิ์รับรางวัลและเข้าชั้นข้อมูลสรุป
```

เอกสารที่มีหลักฐานการชำระเงินจำกัด (เช่น หน้าคำสั่งซื้อ) ถูกจัดการด้วย**คู่ฟิลด์แยกต่างหาก** ไม่ใช่ด้วยค่าสถานะ: `proof_status` ระบุว่าบันทึกกำลังรอหลักฐานการชำระเงิน และ `linked_receipt_id` ชี้ไปยังเอกสารหลักฐานการชำระเงินที่มาปิดรายการเมื่อผู้ใช้อัปโหลด บันทึกลักษณะนี้ถูกคำนวณเข้าสถิติของผู้ใช้เอง แต่ไม่ได้รับรางวัลและไม่เข้าชั้นข้อมูลสรุปที่ไม่ระบุตัวตน

โฟลว์ตรวจสอบด้วยมือสำหรับกรณีก้ำกึ่งอยู่ในแผนงาน ยังไม่เป็นส่วนหนึ่งของชุดสถานะที่ใช้งานจริง

ใบเสร็จ `verified` ได้รับ bINT การจัดการข้อมูลสรุปของบันทึกที่ไม่ผ่านการตรวจสอบปฏิบัติตามกฎ 5.8

---
