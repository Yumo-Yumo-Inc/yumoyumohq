# Bileşen envanteri

## 1.2 Bileşen envanteri

Bu envanter, protokol bileşenlerinin sorumluluklarını ve dışarıya verdiği sözleşmeleri listeler.

| Bileşen | Sorumluluk | Açık sözleşme |
|---|---|---|
| İstemci uygulaması | Fiş yakalama, cüzdan imzası, kullanıcıya önizleme gösterimi | Kullanıcı özel anahtarı cihaz dışına çıkmaz; yükleme isteği açık kullanıcı aksiyonuyla başlar |
| API yüzeyi | Kimlik, yükleme orkestrasyonu, boru hattı başlatma, durum sorguları | Kararlı REST/SDK yüzeyi; aşama durumları ve hata kategorileri |
| Fiş işleme boru hattı | Görsel/PDF girdisini yapılandırılmış fiş kaydına dönüştürme | Tipli ara çıktılar, doğrulama durumu, kanonik ürün ve satıcı referansları |
| Güven katmanı | Fiş ve kullanıcı sinyallerinden ödül uygunluğu üretme | Açık bantlar, karar kategorileri ve iç operasyon katmanında yönetilen kalibrasyon |
| Defter ve ödül muhasebesi | bINT/ePoints olaylarını değiştirilemez muhasebe akışı olarak tutma | Yalnız-ekleme olay modeli, denetlenebilir mutabakat kayıtları |
| Veri ürünü katmanı | Fişlerden anonimleştirilmiş toplamlar üretme | Kişisel veriden ayrıştırılmış, k-eşikli ve sürümlenmiş toplam çıktılar |
| Zincir üstü programlar | Token durumu, staking, hazine yönlendirmesi ve kriptografik taahhütler | Denetlenebilir program arayüzleri ve yayınlanmış program adresleri |
| Operasyonel kontrol düzlemi | İzleme, kota, sağlayıcı yönlendirme ve olay müdahalesi | Açık statü özeti; *runbook*, eşik ve yönlendirme ayrıntıları iç katmanda kalır |

Bu ayrım güvenlik için önemlidir: açık doküman mimariyi denetlenebilir kılar; altyapı kombinasyonları, eşikler ve müdahale adımları iç operasyon katmanında yönetilir.
