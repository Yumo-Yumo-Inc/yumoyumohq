# Risk sınıflandırması

## 8.20 Açık risk sınıfları

Bu sayfa risk bölümünü tek bakışta sınıflandırır. Matris; açık teknik belge içinde açıklanan risk sınıfını, etkilediği protokol alanını ve kontrol ilkesini gösterir.

| Risk sınıfı | Etkilediği alan | Açık kontrol ilkesi | Bağlantı |
|---|---|---|---|
| Düzenleyici veri işleme | Kullanıcı verisi, B2B veri ürünü | Veri minimizasyonu ve aggregate yayın disiplini | §8.2 |
| Düzenleyici token sınıflandırması | INT dağıtımı, staking, BBB | Kullanım ve katkı odaklı ekonomik mekanik | §8.2, 04 |
| Piyasa oynaklığı | Kullanıcı ödülleri, staking, likidite | Formül tabanlı emisyon ve açık hak ediş | §8.5, 04 |
| Akıllı kontrat güvenliği | Token mint/burn, staking, hazine | Sürümlü dağıtım, bağımsız inceleme, yetki ayrıştırma | §8.8, 04 |
| Boru hattı kalitesi | OCR, LLM, kural katmanı, kanonik kayıt | Şema doğrulama ve sağlayıcıdan bağımsız adaptör | §8.11, 02 |
| Boru hattı istismarı | Sahte, tekrar veya manipüle edilmiş fiş | Güven katmanı geri beslemesi ve karar durumu | §8.11, 03 |
| Gizlilik ve aggregate veri | Fiş içeriği, kullanıcı geçmişi, B2B veri | Zincir dışı içerik, k-anonimlik, görev kapsamlı erişim | §8.14, 05 |
| Operasyonel yetki | Hazine, program yetkileri, olay yönetimi | Çoklu onay sınıfı, denetlenebilir iz, aşamalı yönetişim | §8.17, 00 |
| Dış servis sürekliliği | Belge işleme, veri düzlemi, zincir erişimi | Kuyruk durumu ve kullanıcıya görünen işlem hali | §8.17, 02 |

## 8.21 Yayın kapsamı

Bu sınıflandırma, açık dokümanda paylaşılacak teknik risk yüzeylerini toplar. Alarm kuralları, eşikler, sağlayıcı sıralaması, imza düzeni ve olay müdahale adımları iç operasyon katmanında yönetilir.

---

## Çapraz referanslar

- Operasyonel model evrimi → 00 §0.2.
- Boru hattı yapısı → 02 Fiş İşleme Boru Hattı.
- Güven katmanı detayları → 03 Güven Katmanı.
- Tokenomik mekanikleri → 04 Tokenomik Mekanikleri.
- Veri katmanları ve B2B ürün → 05 §5.7, §5.8.
- Sözlük girişleri → 09 Sözlük.
