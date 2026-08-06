# Fiyat gözlemi (bağlayıcı)

## 5.6 Fiyat gözlemi (bağlayıcı)

Açık fiyat kaydı `price_epoch_observations` tablosunda yaşar. Bir satır, bir **kimliksiz** gözlemdir ve günlük bir epoch'un Merkle ağacına yaprak olarak taahhüt edilir (bkz. 5.9). Alanlar, yaprak ön-görüntüsüne (*preimage*) girdikleri haliyle normalize edilmiş olarak saklanır; böylece yaprak hash'i ve yayımlanan manifest satırı bayt bayt yeniden türetilebilir.

```text
// price_epoch_observations satırı (etiketli düz metin; pipe-ayrımlı manifest satırı olarak yayımlanır)
epoch_number:         214
leaf_index:           1082
leaf_hash:            0x9a01...            // keccak256 of the observation preimage
canonical_product_id: 3f6a...-...          // catalog id; name/brand/pack travel with it
category_path:        food.dairy.milk
country:              TR
city:                 Istanbul
merchant:             Migros               // brand string — brand + city + country only
obs_date:             2026-05-17           // date only, deliberately no time of day
unit_price:           23.50                // canonical decimal string, 2 dp
currency:             TRY
unit_type:            piece
pack_size:            1 L
```

Bu biçimin taşıdığı tasarım kararları:

- **Yalnızca tarih, gün içi saat yok.** Satıcı ve tarihin yanında bir zaman damgası yayımlamak, herkese tek bir alışveriş sepetinin satırlarını yeniden gruplama imkânı verirdi; bu da isim olmadan bile bir alışveriş profilini yeniden kurar. Saatin düşürülmesi defterin bir gizlilik değişmezidir, veri eksiği sayılmaz.
- **Satıcı, marka + şehir + ülke olarak.** Gözlem, şehir ayrıntı düzeyinde bir marka dizesi adlandırır; mağaza ve adres düzeyi kimlik hiçbir zaman yayımlanmaz.
- **Kullanıcı bağlantısı yok.** Satır; kullanıcı adı, cüzdan, fiş id'si veya satır başına güven puanı taşımaz. Kalite kontrolü yukarı akışta olur: epoch inşasına yalnızca doğrulanmış fişlerin satırları girer, bu nedenle yayımlanan kümenin gözlem başına puana ihtiyacı yoktur.
- **Ürün kimliği kendini tanımlar.** Yaprak ön-görüntüsü ürün adını, markayı ve ambalaj boyutunu içerir; böylece üçüncü bir taraf kaydı bir arama servisine gerek duymadan kullanabilir.

Bu kayıt şunları besler:

1. **Kullanıcı fiyat hafızası** — "Migros'ta Pınar süt için 23,50 TL ödedin; yakın dönem medyanı 22,10 TL."
2. **Açık fiyat geçmişi** — herkes yayımlanan manifestlerden veri kümesini yeniden kurabilir ve marka + şehir + ülke fiyat serilerini sorgulayabilir.
3. **Toplam indeksler** — anonimleştirilmiş toplam katman (5.8) aynı gözlemler üzerinden hesaplanır.

---
