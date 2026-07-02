# 03 — Güven Katmanı

Güven katmanı, doğrulanmış fişlerden ödül muhasebesine geçişi kontrol eden kalite ve bütünlük katmanıdır. Boru hattından çıkan her fiş otomatik olarak bINT'e dönüşmez; önce fiş kalitesi, kullanıcı davranışı ve tekrar eden kötüye kullanım sinyalleri üzerinden açık karar bantlarından birine girer.

Katmanın açık sözleşmesi, hangi karar kategorilerinin bulunduğu ve bu kararların ödül defterini nasıl etkilediğidir. Sinyal ağırlıkları, eşikler, yarı-ömürler, günlük tavanlar ve anti-istismar sinyallerinin tam kümesi iç operasyon katmanında yönetilir.

## 3.0 Açık karar yüzeyi

| Çıktı | Anlamı |
|---|---|
| Tam kabul | Fiş ödül defterine normal katsayıyla girer |
| Azaltılmış kabul | Fiş geçerlidir, fakat kalite veya davranış sinyalleri ödül katsayısını düşürür |
| İnceleme | Fiş veya kullanıcı davranışı manuel karar akışına girer |
| Ret | Fiş reddedilmiş kayıt durumuna alınır |

Bu yüzey, kullanıcıya anlaşılır geri bildirim verirken savunma parametrelerini açık etmez.
