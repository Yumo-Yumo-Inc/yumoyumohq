# Risk modeli

Bu bölüm Yumo Yumo'nun açık teknik belge içinde açıklanan risk sınıflarını, her sınıfın protokol yüzeyini ve açık kontrol ilkesini tanımlar. Amaç, teknik okura riskin sistem tasarımında nerede oluştuğunu göstermek ve ilgili mekanik referansını vermektir.

İç *runbook*'lar, alarm mantığı, imzacı düzeni, sağlayıcı sıralaması, eşikler ve olay müdahalesi adımları operasyon güvenliği kapsamında ayrı tutulur. Açık metin; mimari yönelimi, veri minimizasyonu ilkesini, yetki ayrışmasını ve kullanıcıya görünen durum modelini verir.

## 8.0 Risk sınıfları

| Sınıf | Protokol yüzeyi | Açık kontrol ilkesi |
|---|---|---|
| Düzenleyici | Veri işleme, token sınıflandırması, vergi ve bölgesel kayıt | Veri minimizasyonu, aggregate yayın politikası, yetki alanına göre hukuk süreci |
| Token ve piyasa | Emisyon, hak ediş, staking, BBB ve ikincil piyasa likiditesi | Formül tabanlı arz akışı, açık hak ediş, gelir bağlantılı yakım |
| Akıllı kontrat | Program yetkileri, token mint/burn, staking ve hazine hareketleri | Sürümlü dağıtım, bağımsız inceleme, yetki ayrıştırma |
| Ürün ve boru hattı | Belge okuma, yapılandırılmış çıkarım, kural katmanı ve kayıt yazımı | Şema doğrulama, sağlayıcıdan bağımsız adaptörler, durum görünürlüğü |
| Gizlilik ve veri | Fiş içeriği, kullanıcı geçmişi, aggregate veri ürünü | Zincir dışı içerik, k-anonimlik, görev kapsamlı erişim |
| Operasyonel | Yetki saklama, dış servis sürekliliği, ağ canlılığı ve olay yönetimi | Çoklu onay sınıfı, denetlenebilir iz, aşamalı yönetişim |

§8.2-§8.19 her risk sınıfını teknik etki ve açık kontrol modeli üzerinden açıklar. §8.20-§8.21 bu sınıfları tek bakışta özetler. Kontrol ilkeleri teknik belge içinde paylaşılır; uygulama ayrıntıları, güvenlik operasyonunun kendi dokümantasyonunda yönetilir.

---

## Çapraz referanslar

- Operasyonel model ve aşamalı yerelleşme → 00 §0.2.
- Boru hattı durum modeli → 02 §2.9.
- Güven katmanı sinyal seti → 03 Güven Katmanı.
- Hazine yönetişimi ve yetki taşıma → 04 §4.10.
- Veri ürünü gizlilik modeli → 05 §5.8.
- Sözlük girişleri: MiCA, k-anonimlik, sağlık skoru → 09 Sözlük.
