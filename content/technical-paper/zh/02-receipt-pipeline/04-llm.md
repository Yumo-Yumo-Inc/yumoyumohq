# 階段 2 — 結構化提取

## 2.5 階段 2 — 結構化提取

本階段將文件讀取輸出轉換為 `ReceiptExtraction` 物件。公開契約為綱要與階段行為；模型供應商、提示詞文字、路由策略、代幣預算與重試條件由內部營運層管理。

### 模型路由邊界

Yumo Yumo 在模型無關的介面背後執行結構化提取。營運策略可依語言、文件複雜度、健康狀態與品質訊號選擇適當的引擎。該策略的權重、排序與備援行為保持私有。

### 結構化輸出

```json
// ReceiptExtraction
{
  "merchant": {
    "name_raw": "MIGROS T.A.S.",
    "tax_id_raw": "1234567890",
    "address_raw": "...",
    "phone_raw": null
  },
  "captured_at_raw": "17/05/2026 14:23",
  "currency": "TRY",
  "totals": {
    "subtotal": 234.50,
    "tax_total": 42.21,
    "grand_total": 276.71
  },
  "tax_lines": [
    { "rate_pct": 18.0, "base": 200.0, "amount": 36.0 },
    { "rate_pct": 8.0, "base": 77.50, "amount": 6.20 }
  ],
  "payment_method": "credit_card",
  "line_items": [
    {
      "raw_text": "SUT 1L PINAR",
      "qty": 2,
      "unit_price": 23.50,
      "line_total": 47.00,
      "tax_rate_pct": 8.0
    }
  ],
  "quality_band": "medium",
  "extraction_notes": "tax_total reconstructed from tax_lines"
}
```

此綱要將模型輸出簡化為規則層可驗證的格式。總額、日期、幣別、品項與稅額欄位在下一階段再次檢查。

### 一致性處理

若提取的品質級距較低，或規則層發現不一致，管線可將結果轉入審查或重新處理。路徑選擇由營運參數管理。
