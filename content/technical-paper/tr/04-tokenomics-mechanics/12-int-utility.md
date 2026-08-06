# INT kullanım alanları

## 4.27 Kullanım yüzeyi

INT, Yumo Yumo protokolü içinde altı işlev taşır. Ödül işlevinin mutabakat ve talep altyapısı kuruludur, etkinleştirilmesi beklemededir; diğerleri planlanmıştır ve protokol yüzeyi olgunlaştıkça etkinleşir.

| İşlev | Durum | Açıklama |
|---|---|---|
| **Ödül varlığı** | Altyapı tamam, etkinleştirme beklemede | Doğrulanmış katkılar şu anda bINT muhasebe katmanında (4.14) birikir. bINT → INT dönüşüm yaşam döngüsünün (4.4) mutabakat ve talep yolu kuruludur; zincir üstü INT dağıtımı Token Üretim Etkinliğiyle etkinleşir |
| **Staking varlığı** | Planlanan | Staking etkinleştirilirse, sahipler INT'i kademe ağırlıklı staking havuzlarına (4.6) kilitleyebilir |
| **Geri al ve yak** | Politika etkinleştirilirse | Hazine, yayımlanmış politika uyarınca INT satın alıp yakabilir (4.9) |
| **Veri raporu yakımı** | Planlanan | Toplulaştırılmış topluluk veri raporlarına erişen işletmeler, rapor başına belirli miktarda INT yakmalıdır (4.30) |
| **Yönetişim sinyali** | Planlanan | Veri ürünü öncelikleri, hazine tahsisleri ve ekosistem hibeleri üzerindeki kararlar için INT ağırlıklı sinyal |
| **Bağlı API erişimi** | Planlanan | Anonimleştirilmiş veri ürünü API tüketicilerinin erişim anahtarlarına INT bağlaması gerekebilir |

## 4.28 Hazine gelir politikası

INT bir getiri, değer artışı veya fiyat desteği vaadi taşımaz. Veri ürünü veya başka bir faaliyetten gelir doğarsa, gelirin hazineye ayrılması, operasyonlarda kullanılması, staking teşviğine yönlendirilmesi veya geri al/yak için kullanılması ancak yayımlanmış bir politika ve gerekli hukuki inceleme sonrasında uygulanır.

Gelir tahsisi ve varsa staking teşviki; miktar, dönem, yetkili karar organı ve zincir üstü kayıtla birlikte yayımlanır. Gelecekteki gelir, yakım veya staking ödemeleri hakkında bu bölüm bir taahhüt oluşturmaz.

## 4.29 Olası gelir kaynakları

Hazine politikasına konu olabilecek gelir kaynakları şunlardır:

- **Anonimleştirilmiş veri satışları.** k-anonimleştirilmiş, toplulaştırılmış fiş düzeyinde veriler; FMCG markalarına, perakendecilere, araştırma firmalarına ve geliştiricilere kademeli API erişimi aracılığıyla satılır.
- **Ortaklık ve referans geliri.** Perakendeci veya kupon ortaklarına fiyat karşılaştırma tıklamaları (planlanan).
- **Premium abonelik.** Gelişmiş kişisel analitik ve hedef otomasyon özellikleri (planlanan).

Gelir üretimi ayrıntıları ve anonimleştirme mimarisi 05 Veri Şeması ve API'de açıklanmıştır.

## 4.30 Veri raporu yakımı

Planlanan veri raporu erişim modeli, belirli rapor türleri için INT yakımını gerektirebilir. Böyle bir model etkinleştirilirse, yakım işlemi zincir üstünde kaydedilir ve rapor türü ile miktar yayımlanır.

Yakım, dolaşımdaki INT miktarını azaltır; token fiyatı, değeri veya talebi için sonuç garanti etmez. Rapor başına yakım miktarı ancak ilgili hazine politikası ve ürün fiyatlandırması yayımlandığında geçerlilik kazanır.
