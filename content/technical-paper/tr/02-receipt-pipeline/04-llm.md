# Aşama 2 — Yapılandırılmış çıkarım

## 2.5 Aşama 2 — Yapılandırılmış çıkarım

Bu aşama, belge okuma çıktısını `ReceiptExtraction` nesnesine dönüştürür. Açık sözleşme şema ve aşama davranışıdır; model sağlayıcıları, istem metinleri, yönlendirme politikası, token bütçesi ve tekrar deneme koşulları iç operasyon katmanında yönetilir.

### Model yönlendirme sınırı

Yumo Yumo, yapılandırılmış çıkarımı modelden bağımsız bir arayüz arkasında çalıştırır. Operasyonel politika; dil, belge karmaşıklığı, sağlık durumu ve kalite sinyallerine göre uygun motoru seçebilir. Bu politikanın ağırlıkları, sıralaması ve yedek davranışı iç operasyon katmanında kalır.

### Yapılandırılmış çıktı

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

Şema, model çıktısını kurallar katmanının doğrulayabileceği aday kayıt biçimine indirir. Toplam, tarih, para birimi, satır kalemleri ve vergi alanları sonraki aşamada tekrar kontrol edilir.

### Tutarlılık kontrolü

Çıkarım sonucu düşük kalite bandı taşıyorsa veya kural katmanı tutarsızlık bulursa, boru hattı sonucu inceleme/yeniden işleme akışına gönderebilir. Yol seçimi operasyonel parametrelerle yönetilir.
