# Güvenlik sınırları

## 1.7 Güvenlik sınırları

Yumo Yumo güvenlik modeli, hangi katmanın hangi veriyi ve hangi yetkiyi taşıdığını açık ayırır. Açık doküman, yetki ve veri sınırlarını denetlenebilir biçimde tarif eder.

| Sınır | Tuttuğu içerik | Yetki ayrımı |
|---|---|---|
| Kullanıcı cihazı | Cüzdan imzası, seçilen fiş dosyası, yerel ön işleme | Kullanıcı imzası cihaz tarafında kalır |
| Uygulama servisleri | Oturum, yükleme orkestrasyonu, boru hattı işleri, durum olayları | Uygulama servisleri boru hattı ve oturum yetkilerini taşır |
| Veri düzlemi | Takma adlı fiş kayıtları, türetilmiş gözlemler, ödül defteri | Veri düzlemi kayıt ve defter bütünlüğünü taşır |
| Zincir üstü katman | Token durumu, staking/hazine yetkileri, kriptografik taahhütler | Zincir üstü katman token ve taahhüt durumunu taşır |
| Operasyonel kontrol düzlemi | İzleme, kota ve olay müdahalesi | Operasyonel kontrol düzlemi savunma parametrelerini yönetir |

Bu modelde kullanıcı verisi, ödül muhasebesi ve zincir üstü yetki ayrı katmanlarda tutulur. Sınırlar arası geçişler tipli olaylar ve denetlenebilir kayıtlar üzerinden yapılır; imza prosedürleri, acil durum kılavuzları ve eşik değerleri iç operasyon dokümanında yönetilir.
