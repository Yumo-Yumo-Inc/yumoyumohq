# Kullanıcı ödülü emisyonu

## 4.3 Ödüller bINT'e nasıl akar

Kullanıcı ödülü havuzu, 4.17'deki tahsis tablosuyla yönetilir. O havuz içinde, günlük emisyon, birincil girdisi olarak aylık aktif kullanımı alan bir eğriyle ölçülür. Eğrinin adlandırılmaya değer üç özelliği vardır:

- **Tepeye doğru basamaklı büyüme.** MAU tanımlı bantlardan geçtikçe, günlük emisyon havuzu sürekli yerine basamaklarla genişler. Bu, aktivite bir eşik yakınında salındığında uçurum etkilerini önler.
- **Sınırlı tepe.** Günlük havuz basamaklı olarak bir tepe banda kadar büyür, ardından sabit kalır. Tepe sonrasında ek MAU, kullanıcı başına katkı yoğunluğunu yükseltir. Bant değerleri üretimde kalibre edilir ve yayınlanmaz.
- **Uzun ufuk.** Kullanıcı ödülü rayı 15 yıllık ufka göre boyutlandırılmıştır. Arzın ödül payı (64,35 milyar INT, bkz. 4.17) bütçedir; eğri sayaçtır.

Basamak fonksiyonu — MAU bantları, banda göre günlük havuz değerleri ve geçiş davranışı — 4.19'da belgelenmiştir. Bant sınırları, gözlemlenen aktivite evrildikçe yeniden ayarlanır.

## 4.4 bINT → INT dönüşüm yaşam döngüsü

bINT, bir fiş güven katmanını (03) geçtiğinde zincir dışı olarak birikir. Kullanıcı başına zincir üstü bir dönüşüm çağrısı yerine, periyodik (haftalık) bir epoch (dönem) üzerinden INT'e mutabakat eder. Yaşam döngüsü:

```
birik  →  tut  →  mutabakat (epoch)  →  talep  →  kullanıcı cüzdanında INT
```

- **Birik.** Fiş başına, zincir dışı muhasebe katmanında. Miktar güven bandı, kullanıcının günlük tavanı ve mevcut emisyon basamağı tarafından belirlenir.
- **Tut.** bINT, mutabakata uygun hale gelmeden önce asgari bir tutma penceresi boyunca muhasebe katmanında kalır. Bu pencere, herhangi bir INT dağıtılmadan önce güven katmanına (03) anormal alışkanlıklara yanıt verme zamanı tanır.
- **Mutabakat.** Her epoch'ta, uygun bINT düz 1:1 oranıyla (4.24) INT'e dönüşür. Motor bir dağıtım listesi oluşturur, bağımsız bir doğrulayıcı listeyi denetler (4.17) ve elde edilen kök, denetlenmiş dağıtıcıya yayımlanır.
- **Talep.** Kullanıcı INT'ini doğrudan dağıtıcıdan standart bir SPL cüzdanına talep eder; devredilebilir. INT talep edilene kadar hazinede tutulur; ayrı bir hakediş adımı yoktur.

Bir epoch'un toplam uygun ödülü küresel emisyon tavanını aştığında, her katılımcının miktarı aynı katsayıyla küçültülür (yumuşak tavan oranlı dağıtım — *soft-cap pro-rata*, 4.24). Tutma penceresi uzunluğu ve küresel tavan değeri operasyon katmanında yönetilir ve yayınlanmaz.

## 4.5 Günlük tavan, tokenomik açısından

Etkin günlük bINT tavanı, bir temel tavan, seviye çarpanı (03 §3.6) ve kullanıcının mevcut sağlığının (03 §3.5) çarpımıdır. Mevcut MVP uygulaması seviye başına tablolar (4.22) kullanır; hedef mimari formül tabanlı tavan (4.23) kullanır. Çarpan ve sağlık değerleri kullanıcıya özgüdür ve güven katmanında yaşar.

Bu ayrıştırma önemlidir çünkü protokolün tokenomiği yeniden yazmadan üç faktörden herhangi birini yeniden ayarlamasına izin verir. Pazar genişlemesi tabanı yükseltebilir; seviye sistemi yeniden dengelemesi çarpanı kaydırabilir; bir istismar dalgası sağlık dağılımını sıkıştırabilir.
