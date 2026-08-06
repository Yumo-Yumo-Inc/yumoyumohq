# API yüzeyi

## 5.10 API yüzeyi

### Mevcut: uygulama rotaları

Canlı API, uygulamanın kendi rota yüzeyidir: **`yumoyumo.com` üzerinde `/api/*` altında oturum kimlikli rotalar**, ürünle aynı Next.js dağıtımından sunulur. Kimlik doğrulama kullanıcının oturumudur; bugün ayrı bir geliştirici kimlik bilgisi bulunmaz.

| Metot | Yol | Amaç | Kimlik |
|---|---|---|---|
| POST | `/api/receipt/upload` | Fiş görseli yükleme | Oturum |
| POST | `/api/receipt/analyze` | Yüklenen görsel üzerinde pipeline'ı çalıştırma | Oturum |
| GET  | `/api/receipts` | Kullanıcının fişlerini listeleme | Oturum (yalnız kendi) |
| GET  | `/api/receipts/{id}` | Bir fiş kaydını getirme | Oturum (yalnız kendi) |
| GET  | `/api/wallet/summary` | Puan bakiyesi ve geçmişi | Oturum |
| GET  | `/api/prices/epoch/{epoch}` | Açık fiyat epoch verisi: epoch üst verisi, gözlem sayfaları ve Merkle dahil edilme kanıtları (`?proof=<leaf_hash>`) | Açık |
| GET  | `/api/prices/product/{productId}` | Katalog ürünü için açık fiyat geçmişi | Açık |

Fiyat defteri rotaları bugünkü açık okuma yüzeyidir: herkes mühürlenmiş bir epoch'u getirebilir, gözlemlerini çekebilir ve zincir üstü köke katlanan bir dahil edilme kanıtı isteyebilir. Yayımlanan Arweave manifestleri aynı veriyi bu rotalardan bağımsız olarak sunar.

### Planlı: sürümlü açık REST API

Üçüncü taraf uygulamalar için sürümlü bir açık REST API **planlanan gelecek iştir**. Tasarım taslağı: `yumoyumo.com` üzerinde `/v1` tabanı, üçüncü taraf istemciler için standartlara dayalı yetki devri, kaynak-biçimli fiş ve ödül uç noktaları ve durum değişiklikleri için olay abonelikleri (fiş doğrulandı, ödül yazıldı, epoch mühürlendi). Somut yüzey geliştirici programı açıldığında tanımlanacaktır; o zamana kadar sözleşme yukarıdaki uygulama rotalarıdır.

---
