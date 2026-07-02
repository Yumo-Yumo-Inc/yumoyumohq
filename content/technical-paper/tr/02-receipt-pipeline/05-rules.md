# Aşama 3 — Kurallar

## 2.6 Aşama 3 — Regex ve kural katmanı

Regex katmanı LLM'den sonra **her zaman** çalışır. LLM hızlı bir desen tanıyıcıdır; regex deterministik bir doğrulayıcıdır.

### Regex'in yakaladığı, LLM'in kaçırdığı kategoriler

Kural katmanı dört kategoride deterministik doğrulama ekler:

1. **Toplam mutabakatı.** LLM bazen genel toplamı yuvarlar veya normalleştirir. Kural katmanı basılı toplamı OCR metninden yeniden çıkarır ve uyumsuzlukta LLM değerini geçersiz kılar.
2. **Tarih normalleştirmesi.** Fişlerde birden fazla bölgesel tarih biçimi ve yerele özgü ay adı kullanılır. Tüm varyantlar ISO 8601'e yakınsar.
3. **Para birimi ayrıştırması.** Karışık para birimi token'ları sıklık ve satıcı yereliyle çözülür.
4. **Vergi satırı tespiti.** Yerele özgü vergi oranı satırları (örn. Türkiye'de KDV) basılı metin üzerinden tespit edilir.

### Kural kataloğu

Katalog kategoriye göre düzenlenir: toplamlar, vergiler, tarihler, para birimi ve satıcı tanımlayıcıları. Her kategori, çalıştığımız diller için yerele özgü kural ailelerini içerir. Özel desenler ve kural başına ağırlıklar iç operasyon katmanında yönetilir.

### Güven artışı

Her doğrulanmış kural eşleşmesi regex katmanı güven puanını yükseltir. Temiz uzlaşan fişler daha yüksek puan alır; toplamları uzlaştırılamayan fişler bir uzlaşma boşluğu taşır ve güven puanlayıcı bunu girdilerinden biri olarak okur. Bu girdiye atanan ağırlık iç operasyon katmanında yönetilir.
