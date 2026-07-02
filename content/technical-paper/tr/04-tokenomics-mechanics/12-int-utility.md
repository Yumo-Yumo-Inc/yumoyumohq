# INT kullanım alanları

## 4.27 Kullanım yüzeyi

INT, Yumo Yumo protokolü içinde altı işlev taşır. İkisi aktiftir; dördü planlanmıştır ve protokol yüzeyi olgunlaştıkça etkinleşir.

| İşlev | Durum | Açıklama |
|---|---|---|
| **Ödül varlığı** | Aktif | Kullanıcılar, doğrulanmış Harcama İspatı katkıları için bINT → INT dönüşüm yaşam döngüsü (4.4) aracılığıyla INT kazanır |
| **Staking varlığı** | TGE+1 haftada aktif | Sahipler, staking teşvik tahsisinden ödül kazanmak için INT'i kademe ağırlıklı staking havuzlarına (4.6) kilitler |
| **Geri al ve yak hedefi** | Gelir başlangıcında aktif | Hazine, veri ürünü gelirini açık piyasadan INT satın almak ve yakmak (4.9) için kullanır; deflasyonist baskı yaratır |
| **Veri raporu yakımı** | Planlanan | Toplulaştırılmış topluluk veri raporlarına erişen işletmeler, rapor başına belirli miktarda INT yakmalıdır (4.30) |
| **Yönetişim sinyali** | Planlanan | Veri ürünü öncelikleri, hazine tahsisleri ve ekosistem hibeleri üzerindeki kararlar için INT ağırlıklı sinyal |
| **Bağlı API erişimi** | Planlanan | Anonimleştirilmiş veri ürünü API tüketicilerinin erişim anahtarlarına INT bağlaması gerekebilir |

## 4.28 Gerçek getiri

INT, gerçek getiri varlığı olarak tasarlanmıştır. Uzun vadeli değer yakalama, token emisyonundan değil, veri ürünü işinin ürettiği dış gelirden gelir.

İki mekanizma platform gelirini token sahiplerine bağlar:

1. **Staker getirisi.** Net veri ürünü gelirinin bir kısmı, INT stakerları tarafından pay ve kademe ağırlığıyla orantılı olarak talep edilebilen bir staker getiri havuzuna akar.
2. **Geri al ve yak.** Net gelirin bir kısmı, hazine tarafından açık piyasadan INT satın almak ve kalıcı olarak yakmak için kullanılır.

Staker getirisi ile geri al ve yak arasındaki dağılım, 4.10'da açıklanan kontroller altında yönetilen bir hazine politikası parametresidir. Her iki akış da token emisyonuna değil, dış gelire bağlıdır. Bu ayrım, emisyonun (4.19) arzı öngörülebilir şekilde genişletirken, gerçek getirinin gerçek iş performansına dayalı olarak arzı sıkıştırması veya dağıtması anlamına gelir.

## 4.29 Gelir kaynakları

Gerçek getiri mekanizmasını besleyen gelir şu kaynaklardan gelir:

- **Anonimleştirilmiş veri satışları.** k-anonimleştirilmiş, toplulaştırılmış fiş düzeyinde veriler; FMCG markalarına, perakendecilere, araştırma firmalarına ve geliştiricilere kademeli API erişimi aracılığıyla satılır.
- **Ortaklık ve referans geliri.** Perakendeci veya kupon ortaklarına fiyat karşılaştırma tıklamaları (planlanan).
- **Premium abonelik.** Gelişmiş kişisel analitik ve hedef otomasyon özellikleri (planlanan).

Gelir üretimi ayrıntıları ve anonimleştirme mimarisi 05 Veri Şeması ve API'de açıklanmıştır.

## 4.30 Veri raporu yakımı

Toplulaştırılmış topluluk veri raporları satın alan işletmelerin, ürettikleri her rapor için belirli miktarda INT yakması gerekir. Yakım zincir üstünde gerçekleşir ve kalıcıdır.

Bu mekanizma iki amaca hizmet eder:

1. **Deflasyonist baskı.** Tüketilen her veri raporu, dolaşımdaki arzdan kalıcı olarak INT çıkarır; veri ürününün ticari benimsenmesiyle orantılı talep tarafı kıtlığı yaratır.
2. **Değer hizalaması.** Yakım gerekliliği, veri ürününün faydasını doğrudan tokena bağlar. Daha fazla işletme Yumo Yumo verisini tükettikçe, dolaşımdan daha fazla INT çıkarılır ve platform kullanımı ile token değeri arasındaki ilişki güçlenir.

Rapor başına yakım miktarı hazine politikası tarafından belirlenir ve rapor kademesine göre değişir (ör. kategori düzeyinde toplamlar ile tam sepet düzeyinde paneller). Fiyatlandırma yapısı, yakım maliyetinin veri ürününün ticari değerinin küçük bir kesri kalmasını sağlarken, arz üzerinde anlamlı birikimli etki üretmesini güvence altına alır.
