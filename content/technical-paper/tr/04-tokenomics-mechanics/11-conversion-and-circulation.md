# Dönüşüm oranı ve dolaşımdaki arz

## 4.24 bINT → INT dönüşüm oranı

bINT, INT'e düz **1:1** oranıyla mutabakat eder. Her katkı birimi, ne zaman kazanıldığından bağımsız olarak, emisyon ufku boyunca aynı dönüşüm değerini taşır.

Düz bir oran, dönüşüm değerini öngörülebilir tutar ve erken ile geç katkı arasındaki zamanlama avantajını ortadan kaldırır. Her bINT tam olarak bir INT çektiğinden, Kullanıcı Ödülleri rayı (64,35 milyar INT, 4.17), daha yüksek bir erken oranın yapacağından daha fazla katkıyı tavana ulaşmadan önce emer.

Mutabakat zincir dışıdır (4.4): motor her epoch'ta uygun bINT'i dönüştürür ve kullanıcı elde edilen INT'i denetlenmiş dağıtıcıdan talep eder. Epoch'un toplam uygun ödülü küresel emisyon tavanını aştığında, her katılımcı aynı oranlı katsayıyla küçültülür; böylece ödül oranı, son katkıcıları kesmek yerine herkes için eşit biçimde yumuşar. Hem tavan değeri hem de ölçekleme hesabı operasyon katmanında kalibre edilir ve yayınlanmaz.

## 4.25 Tutma penceresi ve mutabakat kontrolleri

bINT, mutabakata uygun hale gelmeden önce asgari bir tutma süresine girer. Tutma penceresi, herhangi bir INT dağıtılmadan önce güven katmanına (03) anormal alışkanlıkları tespit edip yanıt verme zamanı tanır.

Birikimli bir tavan, katkı katmanının dağıtabileceği toplam INT'i sınırlar (Kullanıcı Ödülleri rayı, 4.17); bağımsız doğrulayıcı (4.17) bu değişmezi her epoch'ta uygular. Bu parametreler operasyon katmanında yönetilir ve kullanıcı deneyimi ile protokol güvenliği arasında denge sağlayacak şekilde kalibre edilir.

## 4.26 Dolaşımdaki arz modeli

Dolaşımdaki INT üç birincil girişten büyür: Kullanıcı Ödülleri mutabakatı, Likidite açılışları ve periyodik Airdrop dağıtımları (4.18). Geri al ve yak (4.9) ile kurumsal veri erişimi yakımları aracılığıyla küçülür.

Aşağıdaki tablo, üç MAU büyüme senaryosunda dolaşımdaki arzı projekte eder. Bunlar modelleme projeksiyonlarıdır, taahhüt değildir.

| Yıl | Düşük MAU senaryosu | Temel MAU senaryosu | Yüksek MAU senaryosu |
|---:|---:|---:|---:|
| TGE | 1.000.000.000 | 1.000.000.000 | 1.000.000.000 |
| 1 | 3.500.000.000 | 5.200.000.000 | 7.400.000.000 |
| 2 | 5.100.000.000 | 8.800.000.000 | 14.000.000.000 |
| 3 | 7.000.000.000 | 13.200.000.000 | 21.500.000.000 |
| 5 | 11.500.000.000 | 22.500.000.000 | 36.000.000.000 |
| 10 | 24.000.000.000 | 42.000.000.000 | 58.000.000.000 |
| 15 | 38.000.000.000 | 60.000.000.000 | 72.000.000.000 |

### Varsayımlar

- **TGE dolaşımı**, başlangıç likiditesidir (1.000.000.000) ve 4.21'deki tahminle örtüşür. Airdrop dağıtımları dolaşıma TGE'de değil, daha sonra periyodik katılım tabanlı etkinlikler olarak girer (4.18).
- **Düşük MAU:** MAU ilk iki yıl 0–10K bandında kalır, 5. yılda 100K'ya ulaşır.
- **Temel MAU:** MAU 1. yılda 100K'ya, 3. yılda 1M'a, 5. yılda 5M'a ulaşır.
- **Yüksek MAU:** MAU 1. yılda 1M'a ulaşır ve 3. yıldan itibaren 5M+ sürdürür.
- Tüm senaryolar, geri al ve yak mekanizmasının 2. yıldan itibaren aktif olduğunu ve dolaşımdaki arzın belirli bir yüzdesini yıllık olarak çıkardığını varsayar. Yakma oranı, veri ürünü geliri ve hazine politikasının fonksiyonudur.
- Staking, lansmanda etkin değildir (4.6); model, v1 boyunca staking kilitlerini bir dolaşım eksiltici olarak saymaz.

Bu projeksiyonlar, benimseme hızı ile arz genişlemesi arasındaki ilişkiyi gösterir. Gerçek dolaşımdaki arz; mutabakat davranışı, yakma gerçekleşmesi ve kesin olarak öngörülemeyen kullanıcı büyümesi alışkanlıklarına bağlıdır.
