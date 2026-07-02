# B2B REST API

## 5.11 B2B REST API

Ayrı taban, ayrı yetki, ayrı hız sınırları.

```
Taban: https://b2b-api.yumo.io/v1
Yetki: API anahtarı + tekrar oynatma korumalı kimlik doğrulanmış istek. İmzalama şeması ve tekrar oynatma penceresi iç operasyon katmanında yönetilir.
Hız sınırı: kademeye bağlı · açık API'den ayrı kota
```

| Yöntem | Yol | Amaç |
|---|---|---|
| GET | `/inflation-pulse` | TR Enflasyon Nabzı serileri |
| GET | `/basket-panel` | Sepet Paneli sorgusu |
| GET | `/merchant-benchmarks` | Satıcı Karşılaştırmaları |
| POST | `/cohort-query` | k-tabanı uygulamalı özel kohort |
| GET | `/catalog` | Mevcut ürünler + tazelik + fiyatlandırma |
| GET | `/methodology/{version}` | Belirli sürüm için metodoloji belgesi |

Her B2B yanıtı `methodology_version`, `k_anonymity_floor` ve yanıtın katkıcı sayısını içerir; alıcının uyum ekibi bir yayını denetleyebilir.

---
