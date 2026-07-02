# Fiş kaydı (bağlayıcı)

## 5.3 Fiş kaydı (bağlayıcı)

Tam yaşam döngüsü JSON'u. `/v1/receipts/{id}` okumalarının döndürdüğü budur.

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

Güven değerleri ve güven puanı yer tutucu olarak gösterilir. Üretim aralıkları, bant sınırları ve sinyal ağırlıkları iç operasyon katmanında yönetilir.

### Alan kuralları

| Kural | Anlamı |
|---|---|
| ID'ler | ULID (Crockford base-32, 26 karakter). Zaman sıralı, sıralanabilir. |
| Para tutarları | Minör birim (TRY için kuruş, USD için cent). Float kaymasını önler. |
| Zaman damgaları | ISO 8601, `Z` soneki. Her zaman UTC. |
| Hash'ler | `sha256:` öneki, ardından küçük harf hex. |
| Boş değerler | Eksik alanlar açık `null` ile gösterilir. |
| Durum enum | `pending`, `verified`, `rejected`, `statistics_only`, `under_review`. |

### Durum geçişleri

```
pending
   │
   ├──► verified  (güven kapısını geçer)
   ├──► statistics_only  (örn. ödeme kanıtı sınırlı sipariş sayfası fişi)
   ├──► under_review  (sınır güven, itiraz kuyruğu)
   └──► rejected  (sert ret: anti-istismar sinyali, el yazısı, yapay zeka üretimi)
```

bINT kazanımı `verified` durumunda gerçekleşir. `statistics_only` fiş, kullanıcının fiyat hafızasında ve hane istatistiklerinde sayılır; aggregate ve ödül işlemi 5.8 kurallarını izler.

---
