# Etik

Bir kişinin harcamasından bir kimlik okumak yükümlülükler taşır. Üç kural katmanı
sınırlar.

## 5.1 Uydurma yok

Her özellik tek somut bir sinyale karşılık gelir, ve verisi olmayan bir özellik boş
döner — arayüz uydurma bir rakam yerine dürüst bir "henüz yeterli veri yok" durumu
gösterir. Aynısı toplumsal katman için de geçerlidir: kohort sayıları gerçek
sayılardır, küçük olsa bile gösterilir, var olandan daha büyük bir topluluk
düşündürecek şekilde asla şişirilmez. Kimlik gerçek harcamadan büyür ya da boş kalır.

## 5.2 Dürüst boş durumlar

Yeni bir kişinin ya da az fişi olan birinin henüz okunabilir bir kimliği olmaz. Katman
boşluğu doldurmak yerine bunu söyler ve neyin onu açtığını açıklar: daha çok fiş, ya da
zamanlama sinyali için farklı saatlerde fişler, ya da sadakat sinyali için tekrar
ziyaretler. Boş durum tasarımın bir parçasıdır, kusuru değil — kimliği kanıta bağlı
tutar.

## 5.3 Gizlilik

- **Toplam, bireysel değil.** Tribü sayıları ve paylaşılan yerleri yüzeye çıkarır.
  Başka bir kişinin bireysel sepetini asla açığa çıkarmaz; keşif, kohorttan kaç kişinin
  bir mağazaya gittiğinin bir sayısıdır, kimsenin satın almalarına açılan bir pencere
  değil.
- **Koordinat değil, davranış.** Yer, fişlerden bir şehir olarak okunur. Mağaza
  koordinatları kullanılmaz, ve bir mesafe ya da konum izleme katmanı yoktur.
- **Okumanın sahibi kişidir.** Kimlik, kişinin kendisi hakkında gördüğü bir şey olarak,
  yargı değil öz-bilgi dilinde sunulur — [geniş literatürün](04-wider-literature.md)
  öz-belirleme ve yargısız veri üzerine kısmının bilgilendirdiği duruş.

## 5.4 Kalibrasyon gizli kalır

Gizli maliyet katmanında olduğu gibi, mekanizma burada tümüyle anlatılırken her
özelliği hesaplayan eşikler üretimde kalır. Bu, yöntemin şeffaflığında bir boşluk
değildir — yöntem tümüyle ortaya konur — ama operasyonel kalibrasyonu kamu görüşünün
dışında tutan bir sınırdır. Aynı sınır Yumo Yumo'nun teknik yazımı boyunca uygulanır.
