# ขั้นตอนที่ 6 — การเขียน

## 2.9 ขั้นตอนที่ 6 — การเขียนผลลัพธ์

ธุรกรรม Postgres รายเดียวเขียน:

```
INSERT INTO receipts (...) VALUES (...);
INSERT INTO receipt_line_items (...) VALUES (...);
INSERT INTO price_observations (...) VALUES (...);
INSERT INTO events (event_type, payload) VALUES ('receipt.verified', {...});
```

แถว `events` กระตุ้นผู้บริโภคดาวน์สตรีมสองราย:

- **ตัวให้คะแนนความน่าเชื่อถือ** (03) — รับเหตุการณ์ คำนวณคะแนนความน่าเชื่อถือ เขียนลงใน `trust_scores`
- **ตัวประมวลผลการชำระ** — จัดคิวเครดิต `bINT.pending` การมินต์บนเชนจริงเกิดขึ้นในชั้นอะซิงโครนัส (01 เฟส B)

ธุรกรรมนี้เป็น idempotent บนคีย์การเขียนภายใน (internal write key): ปลอดภัยต่อการเล่นซ้ำในกรณีที่ตัวประมวลผลลองใหม่

---
