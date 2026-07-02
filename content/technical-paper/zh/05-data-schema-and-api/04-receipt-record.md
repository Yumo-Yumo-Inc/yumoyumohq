# 收據記錄（規範）

## 5.3 收據記錄（規範）

完整的生命週期 JSON。這是 `/v1/receipts/{id}` 讀取所回傳的內容。

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

信心值與信任分數以佔位符表示。生產範圍、級距邊界與訊號權重由內部營運層管理。

### 欄位慣例

| 慣例 | 規則 |
|---|---|
| ID | ULID（Crockford base-32，26 字元）。按時間排序，可排序。 |
| 幣別金額 | 最小單位（TRY 為 kuruş，USD 為 cents）。避免浮點漂移。 |
| 時間戳 | ISO 8601 並附 `Z` 後綴。一律 UTC。 |
| 雜湊 | `sha256:` 前綴後接小寫十六進位。 |
| 可空 | 缺失欄位使用明確的 `null`。 |
| 狀態列舉 | `pending`、`verified`、`rejected`、`statistics_only`、`under_review`。 |

### 狀態轉換

```
pending
   │
   ├──► verified  （通過信任閘門）
   ├──► statistics_only  （例如：訂單頁面收據，付款證明有限）
   ├──► under_review  （邊界信任，申訴佇列）
   └──► rejected  （硬性拒絕：反濫用訊號、手寫、合成圖像）
```

`verified` 收據可賺取 bINT。`statistics_only` 收據計入使用者的價格記憶與家庭統計；彙總與獎勵處理遵循 5.8 規則。

---
