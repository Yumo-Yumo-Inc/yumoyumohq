# 商家（规范）

## 5.5 商家（规范）

```json
// Merchant
{
  "merchant_id": "f3b1c2d4-...",
  "display_name": "Migros",
  "name_aliases": ["MIGROS T.A.S.", "MIGROS A.S."],
  "tax_id": "6200278131",
  "city": "Istanbul",
  "country": "TR",
  "merchant_class": "supermarket",
  "first_seen_at": "2026-01-01T00:00:00Z",
  "last_seen_at": "2026-05-17T14:23:11Z",
  "receipt_count": 18432
}
```

`tax_id` 是商家的官方税务识别码（在土耳其为 10 位的 *Vergi Kimlik Numarası*）。它作为**经验证的字段**存储：提取值在被接受之前须通过校验位验证，因此 OCR 误读或幻觉数字会被丢弃而非写入。与 `country` 一起，经验证的税务识别码为商家在不同名称变体间提供稳定身份 —— 同一连锁打印为「MIGROS T.A.S.」与「MIGROS A.S.」时解析为同一条记录。

商家匹配叠加三种信号：**已识别品牌**（连锁的官方写法，在提取阶段解析）、**经验证的税务识别码**，以及标准化名称匹配。品牌存在时优先；名称嘈杂时由税务识别码确认或建立身份。

公开的商家身份为**品牌 + 城市 + 国家**。任何公开表面 —— 包括公开价格账本 —— 均恰以此粒度携带商家；门店级与地址级细节保留于运营层，从不公开。

---
