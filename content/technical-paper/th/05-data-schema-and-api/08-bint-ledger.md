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
  "settled_to_chain_at": null,
  "onchain_tx_signature": null,
  "previous_entry_hash": "sha256:9a01...",
  "entry_hash": "sha256:b3f8..."
}
```

### เหตุใดจึงมีโซ่เข้ารหัส

`previous_entry_hash` + `entry_hash` สร้างโซ่แฮชผ่านบัญชีแยกประเภท สิ่งนี้ให้ **บันทึกการตรวจสอบที่สามารถตรวจสอบได้** แก่ Yumo Yumo: แม้ว่าบัญชีแยกประเภทจะเป็นตาราง Postgres ในเชิงปฏิบัติการ โซ่แฮชหมายความว่าความพยายามแก้ไขสามารถตรวจจับได้ `entry_hash` ล่าสุดถูกเผยแพร่บนเชนเป็นระยะ (คำมั่นสัญญารูท Merkle) เพื่อให้ฝ่ายภายนอกสามารถตรวจสอบความสมบูรณ์ของบัญชีแยกประเภท

### การชำระเงิน

ตัวประมวลผลการชำระรวมแถว `BintLedgerEntry` ที่มี `settled_to_chain_at IS NULL` และ mint bINT ที่รวมบน Solana หลังจากยืนยัน `settled_to_chain_at` และ `onchain_tx_signature` จะถูกเติม ตั้งแต่จุดนั้นเป็นต้นไป สถานะบนเชนคือที่มาของความจริงสำหรับรายการนั้น

---
