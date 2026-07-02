# Ortamlar

## 1.6 Ortamlar

Yumo Yumo ortam ayrımını veri kapsamı, ekonomik etki ve yönetim yetkileri üzerinden tanımlar. Bu sayfa üretim olgunluğu sınırlarını gösterir.

| Ortam | Veri kapsamı | Ekonomik etki | Kullanım |
|---|---|---|---|
| Yerel ve test | Fikstürler, sentetik fişler | Yok | Geliştirme, otomatik test ve model denemeleri |
| Staging | Sentetik veri ve açık rızalı test verisi | Yok | Yayın öncesi doğrulama, migrasyon provası, kalite kontrol |
| Kontrollü üretim | Gerçek kullanıcı verisi | Sınırlı ödül ve sınırlı yetki kapsamı | Erken büyüme, ülke/segment bazlı açılım, gözlemli ölçekleme |
| Tam üretim | Gerçek kullanıcı verisi | Yayınlanmış protokol kuralları | Geniş ölçekli kullanım ve düzenli mutabakat |

Kontrollü üretim ile tam üretim arasındaki geçiş; ekonomik sınırlar, veri işleme kapsamı ve yönetim yetkileri üzerinden yapılır. Operasyonel üst sınırlar ve geçiş kriterleri iç operasyon katmanında yönetilir.
