# บันทึกใบเสร็จ (normative)

## 5.3 บันทึกใบเสร็จ (normative)

JSON วงจรชีวิตเต็มรูปแบบ นี่คือสิ่งที่การอ่าน `/v1/receipts/{id}` ส่งคืน

```json
// Receipt
{
  "receipt_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
  "user_id": "01HXY8K3F9A2QZ0M1B7N4PQR00",
  "wallet_address": "5Hg2...8fpA",
  "uploaded_at": "2026-05-17T14:23:11Z",
  "captured_at": "2026-05-17T14:21:00Z",
  "currency": "TRY",
  "merchant": {
    "merchant_id": "01HXY...",
    "chain_id": "chain.migros",
    "name_raw": "MIGROS T.A.S. ŞUBE 4521",
    "city": "Istanbul",
    "tax_id_hash": "sha256:7f3a..."
  },
  "totals": {
    "subtotal_minor": 23450,
    "tax_total_minor": 4221,
    "grand_total_minor": 27671,
    "currency": "TRY"
  },
  "tax_lines": [
    { "rate_pct": 18.0, "base_minor": 20000, "amount_minor": 3600 },
    { "rate_pct": 8.0,  "base_minor": 7750,  "amount_minor": 620  }
  ],
  "payment_method": "credit_card",
  "line_items": [
    {
      "line_item_id": "01HXY...01",
      "raw_text": "SUT 1L PINAR",
      "canonical_product_id": "cp.pinar.milk.1l",
      "qty": 2.0,
      "unit_price_minor": 2350,
      "line_total_minor": 4700,
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
    "bint_minor_credited": 12500,
    "bint_settled_at": null,
    "epoints_minor_recorded": 845,
    "statistics_only": false
  },
  "status": "verified",
  "schema_version": "1.0.0"
}
```

ค่าความเชื่อมั่นและคะแนนความน่าเชื่อถือแสดงเป็นตัวยึดตำแหน่ง ช่วงการผลิต ขอบเขตวง และน้ำหนักสัญญาณจัดการอยู่ในชั้นปฏิบัติการภายใน

### ข้อตกลงฟิลด์

| ข้อตกลง | กฎ |
|---|---|
| IDs | ULID (Crockford base-32, 26 ตัวอักษร) เรียงตามเวลา จัดเรียงได้ |
| จำนวนเงิน | หน่วยย่อย (kuruş สำหรับ TRY, cents สำหรับ USD) หลีกเลี่ยง float drift |
| เวลาประทับ | ISO 8601 พร้อมคำต่อท้าย `Z` UTC เสมอ |
| แฮช | คำนำหน้า `sha256:` ตามด้วยเลขฐานสิบหกตัวพิมพ์เล็ก |
| Nullable | ฟิลด์ที่ขาดหายใช้ `null` อย่างชัดเจน |
| สถานะ enum | `pending`, `verified`, `rejected`, `statistics_only`, `under_review` |

### การเปลี่ยนผ่านสถานะ

```
pending
   │
   ├──► verified  (ผ่านประตูความน่าเชื่อถือ)
   ├──► statistics_only  (เช่น ใบเสร็จหน้าคำสั่งซื้อที่มีหลักฐานการชำระเงินจำกัด)
   ├──► under_review  (ความน่าเชื่อถือชายแดน คิวอุทธรณ์)
   └──► rejected  (ปฏิเสธแข็ง: สัญญาณต้านการละเมิด เขียนด้วยมือ ภาพสังเคราะห์)
```

ใบเสร็จ `verified` ได้รับ bINT ใบเสร็จ `statistics_only` ถูกนับในความจำราคาและสถิติครัวเรือนของผู้ใช้ การจัดการข้อมูลสรุปและรางวัลปฏิบัติตามกฎ 5.8

---
