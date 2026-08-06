# Fiş kaydı (bağlayıcı)

## 5.3 Fiş kaydı (bağlayıcı)

Fiş kaydı, uygulamanın kendi API'sinin döndürdüğü haliyle (`/api/receipts` altındaki oturum kimlikli okumalar). Gösterilen alan adları saklanan kaydı temsil eder.

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

Güven değerleri ve güven puanı yer tutucu olarak gösterilir. Üretim aralıkları, bant sınırları ve sinyal ağırlıkları iç operasyon katmanında yönetilir.

### Alan kuralları

| Kural | Anlamı |
|---|---|
| ID'ler | Fişler ve satıcılar için UUID birincil anahtar; olay ve defter tablolarında seri tamsayı id. |
| Para tutarları | Ondalık değerler, kanonik ondalık dize olarak serileştirilir (para için 2 basamak). |
| Zaman damgaları | ISO 8601, `Z` soneki. Her zaman UTC. |
| Hash'ler | Küçük harf hex; algoritma, alanın bağlamıyla adlandırılır. |
| Boş değerler | Eksik alanlar açık `null` ile gösterilir. |
| Durum enum | `verified`, `saved`, `analyzed`. |

### Durum ve ödeme kanıtı ele alınışı

Canlı durum değerleri:

```
analyzed  — boru hattı çıktısı üretildi, henüz tutulan kayıt olarak kalıcılaşmadı
saved     — kullanıcı tarafından tutuldu
verified  — doğrulama kapılarını geçti; ödüle ve toplam katmana uygun
```

Ödeme kanıtı sınırlı belgeler (örneğin bir sipariş sayfası) bir durum değeriyle değil, **ayrı bir alan çiftiyle** ele alınır: `proof_status` kaydı ödeme kanıtı bekliyor olarak işaretler, `linked_receipt_id` ise kullanıcı bir tane yüklediğinde bu bekleyişi çözen ödeme kanıtı belgesine işaret eder. Bu kayıtlar kullanıcının kendi istatistiklerine hesaplanır ancak ödül kazanmaz ve anonimleştirilmiş toplamın dışında kalır.

Sınır durumlar için manuel inceleme akışı planlanmıştır; canlı durum kümesinin parçası değildir.

`verified` bir fiş bINT kazanır. Doğrulanmamış kayıtların toplam katmanındaki ele alınışı 5.8 kurallarını izler.

---
