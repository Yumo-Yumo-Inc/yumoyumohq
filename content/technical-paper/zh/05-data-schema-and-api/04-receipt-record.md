# 收据记录（规范）

## 5.3 收据记录（规范）

收据记录以应用自身 API 返回的形态呈现（`/api/receipts` 下经会话鉴权的读取）。所示字段名代表存储记录的形态。

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

置信值与信任分数以占位符表示。生产范围、级距边界与信号权重由内部运营层管理。

### 字段惯例

| 惯例 | 规则 |
|---|---|
| ID | 收据与商家使用 UUID 主键；事件与账本表使用自增整数 id。 |
| 币种金额 | 十进制数值，序列化为规范的十进制字符串（货币保留 2 位小数）。 |
| 时间戳 | ISO 8601 并附 `Z` 后缀。一律 UTC。 |
| 哈希 | 小写十六进制，算法由字段上下文命名。 |
| 可空 | 缺失字段使用明确的 `null`。 |
| 状态枚举 | `verified`、`saved`、`analyzed`。 |

### 状态与付款证明处理

上线中的状态值：

```
analyzed  — 管线已产出结果，尚未持久化为保留记录
saved     — 由用户保留
verified  — 通过验证闸门；可获得奖励并进入聚合层
```

付款证明有限的文档（例如订单页面）由**一对独立字段**处理，而非状态值：`proof_status` 将记录标记为等待付款证明，`linked_receipt_id` 指向用户随后上传的、用于解决它的付款证明文档。此类记录计入用户自身统计，但不产生奖励，也不进入匿名化聚合。

针对边界案例的人工审查流程属于规划项；它不在上线状态集合之中。

`verified` 收据可赚取 bINT。非 verified 记录的聚合处理遵循 5.8 规则。

---
