# Kullanıcı ödülü emisyonu

## 4.3 Ödüller bINT'e nasıl akar

Kullanıcı ödülü havuzu, 4.17'deki tahsis tablosuyla yönetilir. O havuz içinde, günlük emisyon, birincil girdisi olarak aylık aktif kullanımı alan bir eğriyle ölçülür. Eğrinin adlandırılmaya değer üç özelliği vardır:

- **Tepeye doğru basamaklı büyüme.** MAU tanımlı bantlardan geçtikçe, günlük emisyon havuzu sürekli yerine basamaklarla genişler. Bu, aktivite bir eşik yakınında salındığında uçurum etkilerini önler.
- **Sınırlı tepe.** Günlük havuz basamaklı olarak bir tepe banda kadar büyür, ardından sabit kalır. Tepe sonrasında ek MAU, kullanıcı başına katkı yoğunluğunu yükseltir. Bant değerleri üretimde kalibre edilir ve yayınlanmaz.
- **Uzun ufuk.** Kullanıcı ödülü rayı 15 yıllık ufka göre boyutlandırılmıştır. Arzın ödül payı (64,35 milyar INT, bkz. 4.17) bütçedir; eğri sayaçtır.

Basamak fonksiyonu — MAU bantları, banda göre günlük havuz değerleri ve geçiş davranışı — 4.19'da belgelenmiştir. Bant sınırları, gözlemlenen aktivite evrildikçe yeniden ayarlanır.

## 4.4 bINT → INT dönüşüm yaşam döngüsü

bINT, bir fiş güven katmanını (03) geçtiğinde zincir dışı olarak birikir. Kullanıcı başına zincir üstü bir dönüşüm çağrısı yerine, periyodik bir epoch (dönem) üzerinden INT'e mutabakat eder. Yaşam döngüsü:

```
birik  →  mutabakat (epoch)  →  talep  →  kullanıcı cüzdanında INT
```

- **Birik.** Fiş başına, zincir dışı muhasebe katmanında. Miktar; fişin kalite değerlendirmesi, kullanıcının sağlığa göre düzeltilmiş ödül oranı, seviye tabanlı günlük tavan ve mevcut emisyon basamağı tarafından belirlenir.
- **Mutabakat.** Her epoch'ta motor, katkı defterini epoch penceresi üzerinden toplar ve düz 1:1 oranıyla (4.24) INT'e dönüştürür. Epoch penceresi kapanmadan önce kazanılan puanlar o epoch'ta mutabakat eder. Motor bir dağıtım listesi oluşturur, bağımsız bir doğrulayıcı listeyi denetler (4.17) ve elde edilen kök, denetlenmiş dağıtıcıya yayımlanır.
- **Talep.** Kullanıcı INT'ini doğrudan dağıtıcıdan standart bir SPL cüzdanına talep eder; devredilebilir. INT talep edilene kadar hazinede tutulur; ayrı bir hakediş adımı yoktur.

Bir epoch'un toplam uygun ödülü küresel emisyon tavanını aştığında, her katılımcının miktarı aynı katsayıyla küçültülür (yumuşak tavan oranlı dağıtım — *soft-cap pro-rata*, 4.24). Küresel tavan değeri operasyon katmanında yönetilir ve yayınlanmaz.

## 4.5 Günlük tavan, tokenomik açısından

Günlük bINT tavanı, kullanıcının hesap seviyesi (03 §3.6) tarafından seviye başına tablolar (4.22) üzerinden belirlenir. Bu tavan içinde, kullanıcının sağlık durumu (03 §3.5) fiş başına ödül oranını çarpar. Seviye başına değerler ve sağlık eşlemesi güven katmanında ve operasyon yapılandırmasında yaşar.

Bu ayrıştırma önemlidir çünkü protokolün tokenomiği koruyarak iki faktörden herhangi birini yeniden ayarlamasına izin verir. Pazar genişlemesi veya seviye sistemi yeniden dengelemesi tavan tablolarını kaydırabilir; bir istismar dalgası sağlık dağılımını sıkıştırır ve onunla birlikte etkin ödül oranını düşürür.
