# Bağımlılıklar ve arıza sınıfları

## 1.9 Bağımlılıklar ve arıza sınıfları

Açık teknik belge, dış bağımlılıkları ürün davranışı açısından sınıflandırır. Sağlayıcı rotaları, eşikler ve olay müdahale adımları iç operasyon katmanında yönetilir.

| Arıza sınıfı | Kullanıcıya etkisi | Açık mimari duruş |
|---|---|---|
| Belge/AI işleme gecikmesi | Fiş önizlemesi gecikir veya manuel incelemeye düşer | Boru hattı aşamaları tipli çıktılarla ayrıdır; her aşama bağımsız olarak ertelenebilir veya yeniden çalıştırılabilir |
| Veri düzlemi erişilemezliği | Yeni fiş işleme askıya alınabilir; okuma davranışı korumalı moda geçebilir | Defter olay modeli append-only çalışır; mutabakat tekrar yürütülebilir olaylardan türetilir |
| Zincir/RPC canlılık sorunu | Zincir üstü mutabakat gecikir; kullanıcı önizlemesi zincir dışı kalabilir | Ödül muhasebesi önce zincir dışı deftere yazılır; zincir üstü yazımlar yığın mutabakat olarak ele alınır |
| Yetki ve imza riski | Hazine veya program yetkileri etkilenebilir | Yetkiler kullanıcı cüzdanı, uygulama servisi ve zincir üstü katman arasında ayrıştırılır |
| Kuyruk ve birikmiş iş büyümesi | İşleme süresi uzar; düşük öncelikli işler ertelenir | Eşzamanlı kullanıcı akışı ile arka plan mutabakat akışı ayrıdır |

Sağlayıcı rotaları, imza eşikleri, kurtarma adımları ve olay müdahale süreleri iç operasyon katmanında yönetilir. Açık doküman, ürün etkisi ve mimari dayanıklılık sınıflarını açıklar.

## Çapraz referanslar

- Fiş işleme ayrıntısı → 02 Fiş İşleme Boru Hattı
- Güven ve anti-istismar modeli → 03 Güven Katmanı
- Token ve mutabakat yüzeyi → 04 Tokenomik Mekanikleri
- Veri şeması ve toplam ürün → 05 Veri Şeması ve API
