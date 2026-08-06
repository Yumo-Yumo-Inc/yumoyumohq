# 03 — Güven Katmanı

Güven katmanı, doğrulanmış fişler ile ödül muhasebesi arasındaki kalite ve bütünlük katmanıdır. Boru hattından çıkan bir fiş önce fiş kalitesi, kullanıcı davranışı ve tekrar eden kötüye kullanım sinyalleri üzerinden açık karar bantlarından birine girer.

Katmanın açık sözleşmesi, hangi karar kategorilerinin bulunduğu ve bu kararların ödül defterini nasıl etkilediğidir. Sinyal ağırlıkları, eşikler, sönüm yarı-ömürleri, günlük tavanlar ve anti-istismar sinyallerinin tam kümesi iç operasyon katmanında yönetilir.

## 3.0 Açık karar yüzeyi

| Çıktı | Anlamı |
|---|---|
| Tam kabul | Fiş ödül defterine normal katsayıyla girer |
| Azaltılmış kabul | Fiş geçerlidir, fakat kalite veya davranış sinyalleri ödül katsayısını düşürür |
| İnceleme | Fiş veya kullanıcı davranışı manuel karar akışına girer *(planlanan mekanizma; mevcut sürümde aktif değildir)* |
| Ret | Fiş reddedilmiş kayıt durumuna alınır |

Bu yüzey kullanıcıya anlaşılır geri bildirim verir; savunma parametreleri iç operasyon katmanında kalır.
