# İndeksleme ve bölümleme

## 5.12 İndeksleme ve bölümleme

`receipts` ve `receipt_line_items` `uploaded_at` alanına göre aylık bölümlendirilir. Aktif ürün penceresi sıcak veri katmanında tutulur; eski bölümler daha düşük maliyetli analitik katmana taşınır. Etkin indeks sınıfları:

| Tablo | İndeks | Kullanım |
|---|---|---|
| `receipts` | `(user_id, uploaded_at DESC)` | Kullanıcının fişlerini listele |
| `receipts` | `(merchant_id, uploaded_at DESC)` | Satıcı kuyruğu |
| `receipt_line_items` | `(canonical_product_id, uploaded_at DESC)` | Fiyat gözlemleri |
| `price_observations` | `(canonical_product_id, observed_at)` | Enflasyon nabzı |
| `canonical_products` | `embedding_vector` (yaklaşık en yakın komşu) | Aşama 4 eşleşme |
| `bint_ledger` | `(user_id, created_at DESC)` | Bakiye sorguları |

Vektör indeksi yeniden inşası en yüksek maliyetli indekstir ve kanonik katalog büyümesinin sınırlayıcı faktörüdür — 02 2.7 bunu maliyet kaldıracı olarak listeler. Spesifik indeksleme motoru ve ayar parametreleri iç operasyon katmanında yönetilir.

---
