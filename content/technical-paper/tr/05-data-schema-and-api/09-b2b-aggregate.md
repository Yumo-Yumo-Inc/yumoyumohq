# Anonimleştirilmiş toplam ve B2B veri ürünü

## 5.8 Anonimleştirilmiş toplam ve B2B veri ürünü

B2B gelirinin üretildiği ve sıkı gizlilik garantileri altında çalışan yüzeydir.

### Dönüşüm kuralları

`receipts + line_items + price_observations` 'tan anonimleştirilmiş toplama geçiş **tek yönlü, yıkıcı** bir dönüşümdür:

1. **user_id ve wallet_address'i sil.** Herhangi bir kullanıcı tanımlayıcısına geri bağlamayan oturum kapsamlı bir hash ile değiştir.
2. **Coğrafyayı kabalaştır.** Yalnızca şehir seviyesi; koordinatlar kaydedildiyse silinir.
3. **Zamanı kabalaştır.** Yüksek frekanslı indeksler için günlük kova; kategori seviyesi raporlama için haftalık kova; demografik kohortlar için aylık.
4. **k-anonimlik uygula.** Yayınlanan her kayıt, yarı-tanımlayıcı alanlarda (`city`, `merchant_class`, `time_bucket`, `category_path`) sözleşmeyle tanımlanmış asgari sayıda farklı katkıcının olduğu bir hücreye ait olmalı. Eşik altındaki hücreler bastırılır veya geçene kadar kabalaştırılır.
5. **Kalibre edilmiş diferansiyel gizlilik gürültüsü ekle** sayım tabanlı çıktılara. Gürültü parametreleri iç operasyon katmanında yönetilir.
6. **Aggregate kapsamını doğrulanmış PoE ile kur.** Sipariş sayfası fişleri ve diğer doğrulama bekleyen kayıtlar hafıza katmanında kalır.

### Mevcut ürünler

| Ürün | Ayrıntı düzeyi | Yenileme | Gösterge fiyat |
|---|---|---|---|
| **TR Enflasyon Nabzı** | Kategori × bölge × hafta | Günlük | $X / ay (abonelik) |
| **Sepet Paneli** | Kanonik ürün × şehir × hafta | Günlük | $Y / ay |
| **Satıcı Karşılaştırmaları** | Zincir × kategori × ay | Haftalık | $Z / ay |
| **Özel Kohort Sorgusu** | API başına sorgu, k-anonimlik eşiği uygulanır | İstek üzerine | $Q / sorgu |

Fiyatlar ve tam ayrıntı düzeyleri yer tutucu; üretim kataloğu ticari lansman öncesi kesinleştirilir.

### Örnek B2B yanıt

```json
// GET /b2b/v1/inflation-pulse?region=istanbul&category=food.dairy&from=2026-05-01&to=2026-05-17
{
  "region": "istanbul",
  "category": "food.dairy",
  "series": [
    { "week_start": "2026-05-04", "index": 100.0, "n_observations": "<n>", "n_distinct_contributors": "<n>" },
    { "week_start": "2026-05-11", "index": 101.7, "n_observations": "<n>", "n_distinct_contributors": "<n>" }
  ],
  "k_anonymity_floor_met": true,
  "methodology_version": "1.0.0"
}
```

Her B2B yanıtı `n_distinct_contributors` taşır; alıcı k-anonimlik tabanının karşılandığını denetleyebilir. Tabanın altında kalacak hücreler `suppressed: true` ile değer olmadan döndürülür. Spesifik eşik değeri iç operasyon katmanında yönetilir.

### Veri ürününün kapsamı dışındaki alanlar

- Tek bir kullanıcıya bağlı herhangi bir alan.
- Sorgulanan hücre için k-anonimlik tabanının altındaki herhangi bir kayıt.
- Koordinatlar, adresler, telefon numaraları.
- Ödeme aracı metaverisi.
- Sorgular arası anonimleştirilmiş ama bağlanabilir ID'ler (her sorgu yeni bir oturum hash'i alır).

### Mevcut panellerle karşılaştırma

Yumo Yumo'nun B2B veri ürünü Nielsen, GfK, Kantar ve SimilarWeb ile aynı alıcılar için yarışır. O panellerle karşılaştırıldığında:

- **Fiş düzeyi** — anket hatırlama etkisiyle karşılaştırıldığında azaltılmış ölçüm hatası.
- **Daha yüksek yenileme sıklığı** — günlük vs. haftalık/aylık.
- **Gelişen pazar kapsamı** — TR öncelikli; mevcut oyuncuların TR kapsamı en dar olanıdır.
- **Kayıt başına daha düşük maliyet** — panel mevcut kullanıcı etkinliğinden inşa edilir.

Takas: Yumo Yumo'nun paneli lansmanda daha küçüktür ve erken benimseyen demografisine eğilir.

---
