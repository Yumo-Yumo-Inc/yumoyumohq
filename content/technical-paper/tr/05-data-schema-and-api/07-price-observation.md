# Fiyat gözlemi (bağlayıcı)

## 5.6 Fiyat gözlemi (bağlayıcı)

Fiyat hafızası tablosu. `(canonical_product_id, merchant_id, gözlem zaman damgası)` başına bir satır.

```json
// PriceObservation
{
  "observation_id": "01HXY...",
  "canonical_product_id": "cp.pinar.milk.1l",
  "merchant_id": "01HXY...",
  "chain_id": "chain.migros",
  "city": "Istanbul",
  "observed_at": "2026-05-17T14:23:11Z",
  "unit_price_minor": 2350,
  "currency": "TRY",
  "trust_score": "0.XX",
  "is_promotional": false
}
```

Bu tablo şunları besler:

1. **Kullanıcı fiyat hafızası** — "Migros'ta Pınar süt için 23,50 TL ödedin; bu haftanın medyanı 22,10 TL."
2. **B2B fiyat indeksi** — k-anonimlik eşiği uygulanarak `(canonical_product_id, bölge, hafta)` ile toplanır.
3. **Enflasyon nabzı** — gece hesaplanan yüksek frekanslı sepet indeksi.

Üretimde ayarlanmış kalite tabanının altındaki satırlar yazılır ancak indeks hesaplarına dahil edilmez.

---
