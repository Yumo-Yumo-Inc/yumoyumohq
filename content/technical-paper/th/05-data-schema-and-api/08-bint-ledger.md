# บัญชีแยกประเภท bINT (normative)

## 5.7 บัญชีแยกประเภท bINT (normative)

กระจกนอกเชนของเครดิต bINT เพิ่มเท่านั้น

```json
// BintLedgerEntry
{
  "ledger_entry_id": "01HXY...",
  "user_id": "01HXY...",
  "wallet_address": "5Hg2...8fpA",
  "source": "receipt",
  "source_id": "01HXY8K3F9A2QZ0M1B7N4PQR5W",
  "amount_minor": 12500,
  "currency_code": "bINT",
  "trust_score_at_credit": "0.XX",
  "level_at_credit": "<L>",
  "health_at_credit": "0.XX",
  "daily_cap_band": "<band>",
  "created_at": "2026-05-17T14:23:12Z",
  "settlement_epoch": null,
  "distribution_root": null,
  "int_claim_tx_signature": null,
  "previous_entry_hash": "sha256:9a01...",
  "entry_hash": "sha256:b3f8..."
}
```

### เหตุใดจึงมีโซ่เข้ารหัส

`previous_entry_hash` + `entry_hash` สร้างโซ่แฮชของบัญชีแยกประเภท เมื่อเผยแพร่บันทึกและรากหลังปิด epoch แล้ว โซ่นี้ช่วยตรวจพบการแก้ไขที่เกิดขึ้นภายหลังได้ แต่ไม่ทดแทนการตรวจสอบการคำนวณหรือข้อมูลต้นทางโดยอิสระ

### การชำระเงิน

ตัวประมวลผลการชำระรวมแถว `BintLedgerEntry` ที่เข้าเกณฑ์และมี `settlement_epoch IS NULL` คำนวณจำนวนสิทธิ์เคลม INT และสร้างรากการแจกจ่ายของ epoch หลังจากผูกรากไว้บนเชน แถวที่เกี่ยวข้องจะได้รับ `settlement_epoch` และ `distribution_root` บัญชีแยกประเภท bINT ยังคงเป็นที่มาของความจริงนอกเชน และเมื่อผู้ใช้เคลม INT จะบันทึก `int_claim_tx_signature`

---
