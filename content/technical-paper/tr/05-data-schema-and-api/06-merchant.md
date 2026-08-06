# Satıcı (bağlayıcı)

## 5.5 Satıcı (bağlayıcı)

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

`tax_id`, satıcının resmî vergi tanımlayıcısıdır (Türkiye'de 10 haneli *Vergi Kimlik Numarası*). **Doğrulanmış alan** olarak saklanır: çıkarılan bir değer kabul edilmeden önce kontrol hanesi doğrulamasından geçer; böylece OCR yanlış okuması veya halüsinasyon ürünü bir numara yazılmak yerine atılır. `country` ile birlikte doğrulanmış bir vergi tanımlayıcısı, satıcıya isim varyantları arasında sabit bir kimlik verir — "MIGROS T.A.S." ve "MIGROS A.S." olarak basılan aynı zincir tek kayda çözülür.

Satıcı eşleştirmesi üç sinyali katmanlar: **tanınan marka** (zincirin resmî yazımı, çıkarım sırasında çözülür), **doğrulanmış vergi tanımlayıcısı** ve normalize edilmiş isim eşleştirmesi. Marka varsa öncelik alır; isim gürültülü olduğunda vergi tanımlayıcısı kimliği teyit eder veya kurar.

Açık satıcı kimliği **marka + şehir + ülkedir**. Açık fiyat defteri dahil yayımlanan her yüzey, satıcıyı tam olarak bu ayrıntı düzeyinde taşır; mağaza ve adres düzeyi detay operasyon katmanında kalır ve hiçbir zaman yayımlanmaz.

---
