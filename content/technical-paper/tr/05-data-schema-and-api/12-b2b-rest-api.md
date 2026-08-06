# B2B API (planlı)

## 5.11 B2B API (planlı)

B2B veri ürününün API'si **planlanan gelecek iştir**; bugün canlıda B2B uç noktası bulunmaz. B2B'ye dönük veri şu anda dış dünyaya açık fiyat defteri (5.10) ve onun Arweave manifestleri üzerinden ulaşır.

Planlanan yüzey için tasarım taslağı — açık API'den ayrı taban yolu, ayrı kimlik bilgileri, ayrı kotalar:

| Metot | Yol | Amaç |
|---|---|---|
| GET | `/inflation-pulse` | Inflation Pulse serileri |
| GET | `/basket-panel` | Basket Panel sorgusu |
| GET | `/merchant-benchmarks` | Merchant Benchmarks |
| POST | `/cohort-query` | k-taban zorlamalı özel kohort |
| GET | `/catalog` | Mevcut ürünler + tazelik + fiyatlandırma |
| GET | `/methodology/{version}` | Belirli bir sürümün metodoloji belgesi |

Planlanan kimlik doğrulama: tekrar oynatma (replay) korumalı istek imzalamayla API anahtarı; imzalama şeması ve tekrar oynatma penceresi iç operasyon katmanında kalır.

Planlanan her B2B yanıtı `methodology_version`, k-anonimlik taban göstergesi ve yanıtın katkıcı sayısını içerir; böylece alıcının uyum ekibi bir yayını denetleyebilir.

---
