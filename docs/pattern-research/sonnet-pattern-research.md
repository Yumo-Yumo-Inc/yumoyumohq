# Yumo Pattern Sayfası — Kapsamlı Tasarım ve İçerik Araştırması

## TL;DR
- **Harcama verisinden psikolojik profil çıkarmak akademik olarak mümkün ama sınırlı:** 1.306 müşterinin banka işlem verisini analiz eden EPJ Data Science (2021) çalışması Materyalizm ve Öz-kontrolün yüksek doğrulukla, Big Five'tan ise yalnızca Dışadönüklük ve Nevrotikliğin makul doğrulukla tahmin edilebildiğini gösterdi — yani Yumo "kesin kişilik teşhisi" değil, **"merak uyandıran içgörü + somut aksiyon"** olarak konumlanmalı.
- **En güçlü davranış değişikliği bütçeleme veya şok/utandırma değil, merak + anlık taahhüt kombinasyonundan geliyor:** Irrational Labs/Duke Common Cents Lab'in 9.035 kişilik testinde hiçbir bütçeleme türü harcamayı azaltmadı; buna karşılık taahhüt cihazları (SEED +%81 tasarruf; Save More Tomorrow %3,5→%13,6) en temiz etki büyüklüklerini üretiyor.
- **Pattern sayfası "above the fold"ta tek bir aha-momenti** (kişisel arketip + tek çarpıcı karşılaştırma), altında progressive disclosure ile derinleşen modüller sunmalı; rakiplerden (Cleo, Monarch, Emma) farklılaşma fırsatı **fiş-düzeyi OCR verisinde** (ürün/marka/saat) ve zaman-mekân-kimlik temelli psikografik anlatıda.

---

## Key Findings (Özet)

1. **Profil çıkarımı doğruluk hiyerarşisi nettir:** Materyalizm > Öz-kontrol > Dışadönüklük/Nevrotiklik > diğer Big Five özellikleri. Yumo güçlü-sinyalli özellikleri öne çıkarmalı, zayıf olanları yalnızca "ipucu" olarak sunmalı.
2. **Bütçeleme kanıtlanmış şekilde işe yaramıyor;** merak-temelli "tahmin oyunu" + spesifik satıcı için ileri-dönük kural taahhüdü uzmanların önerdiği yaklaşım.
3. **Şok/utandırma geri tepiyor (ostrich effect);** olgusal + yüksek-öz-yeterlikli ton ve just-in-time zamanlama kazanıyor.
4. **Taahhüt cihazları (commitment devices) en güçlü etki büyüklüğüne sahip** finansal davranış aracı.
5. **Görselleştirmede üçlü çekirdek:** saat×gün heatmap, kategori Sankey/treemap, psikolojik profil radar.
6. **Mavi/yeşil güven paleti + tek vurgu rengi;** kırmızıyı yalnızca gerçek risk anlarına sakla.
7. **Fiş-OCR granülerliği** Yumo'nun banka-feed tabanlı rakiplerden temel farklılaşma kaynağı.

---

## Details

### 1. DAVRANIŞ EKONOMİSİ & FİNANSAL PSİKOLOJİ

**Mental accounting (Thaler 1985, 1999).** İnsanlar parayı kökenine ve amacına göre "zihinsel hesaplara" ayırır ve fungibility (paranın değiştirilebilirliği) ilkesini ihlal eder. Thaler'ın "transaction utility" kavramı: insanlar bir ürünün mutlak değerinden değil "anlaşmanın kalitesinden" de haz alır (indirimli king-size yatak örtüsü örneği). **Pratik uygulama:** Yumo, harcamaları kullanıcının kendi zihinsel kovalarına (zorunlu/keyfi, ritüel/dürtüsel) göre etiketleyip bu etiketlerin gerçekte ne kadar "sızdırdığını" gösterebilir.

**Loss aversion (Kahneman & Tversky 1979).** Kayıplar eşdeğer kazançlardan yaklaşık iki kat daha ağır hissedilir ("losses loom larger"). Görselleştirme için: bir harcama kalemini "kaçırılan tasarruf / gelecekteki sen" çerçevesiyle göstermek. ESMA gibi düzenleyiciler bile risk profillemede loss aversion ölçümünü tavsiye ediyor (ScienceDirect; yöntem 1.040 çalışan + 3.740 müşteride ölçülmüş).

**Present bias / hyperbolic discounting (Laibson 1997).** İnsanlar yakın gelecekteki ödülü orantısız değerli görür; bu yüzden bugün $100'ı yarın $110'a tercih eder ama 31 gün sonra $110'ı 30 gün sonra $100'a tercih eder. Düşük gelirli nüfuslarda iskonto oranı daha yüksek (daha present-biased) — bu rasyonel de olabilir çünkü gelecek belirsizliği yüksek. Save More Tomorrow bunu future-positive çerçeveyle aşar.

**Impulse buying & emotional spending.** Atalay & Meloy (2011, *Psychology & Marketing* 28(6):638–659) "retail therapy"nin gerçekten işe yaradığını, insanların bunu dürtüsel değil **stratejik** kullandığını ve kalıcı negatif duygusal yan etkisinin az olduğunu üç çalışmada gösterdi (AVM'de ~200 alışverişçi; kötü ruh hâliyle giren katılımcılar plansız alışveriş yapma eğiliminde). Invesp'e göre ("The State of Impulse Buying," 2025) **dürtüsel alımlar tüm online harcamanın "nearly 40%"ını oluşturuyor** (vendor/blog kaynağı — temkinli yorumla). Tetikleyici dağılımı: dürtüsel alışverişçilerin %47 (erkek)/%50 (kadın)'ı heyecan, %28/%32'si can sıkıntısı hissediyor; Credit Karma anketinde tüketicilerin %52'si "stress shopping" yapıyor, **%60'ı bunu her ay yapıyor, %83'ü sonradan pişmanlık duyuyor.** **Pratik kalıp:** harcama-audit'i (saat, yer, önceki aktivite, duygu durumu) — 10-20 dürtüsel alım incelendiğinde pattern netleşir (örn. "geç saatte stresle alışveriş").

**Hedonic adaptation.** Tekrarlayan alımlarda tatmin azalır; aynı duygusal doyum için giderek daha sık/pahalı alım gerekir — finansal olarak sürdürülemez bir tırmanış. Yumo tekrar eden alımların "marjinal mutluluk getirisini" görselleştirebilir.

**Social proof / peer comparison.** D'Acunto, Rossi & Weber (*Journal of Financial Economics* 2024): bir fintech uygulamasında akran harcama bilgisi verildiğinde tüm kullanıcılar akranlarına yakınsadı, ama etki "fazla harcadığını" öğrenenlerde daha güçlüydü. **Asimetrik yakınsama:** 12 ay içinde fazla harcayanlar açığın %17'sini, az harcayanlar yalnızca %5'ini kapatıyor. **UYARI:** Bu çift taraflı bir kılıç — az harcayanlara akran ortalaması göstermek harcamayı **artırabilir.**

**Davranışsal segmentasyon.** Tovanich/EPJ hattı ve arXiv (2109.09425) çalışması Recurrent Neural Network ile "spending personality" mikro-segmentasyonu yaptı; 2.193 müşteride Big Five'ı işlemlerden Random Forest ile tahmin etti ve 59 işlem sınıfını her Big Five özelliğiyle −3..+3 katsayılarla ilişkilendirdi.

### 2. ANALİTİK & GÖRSEL VERİ SUNUMU

- **Monarch Money** 2026'da en kapsamlı görselleştirme setine sahip; öne çıkan özellik **Sankey diyagramı** (gelir → kategoriler → gider akışı). Fiyatlandırma iki katmanlı: **Monarch Core $14,99/ay veya $99,99/yıl ($8,33/ay), Monarch Plus $199/yıl (yalnızca yıllık); 7 günlük deneme, kalıcı ücretsiz katman yok** (The Penny Hoarder, "Monarch Money Review 2026"; monarch.com/pricing).
- **Calendar heatmap** harcama yoğunluğunu gün gün göstermek için ideal (koyu renk = yüksek harcama); Finny ve birçok uygulama kullanıyor.
- **Grafik türü eşleştirmesi:** Pie/donut (kategori payı), stacked column (bütçe vs. gerçek), line (trend), Sankey (akış), heatmap (zaman/yoğunluk), radar (çok boyutlu profil).
- **Renk psikolojisi:** Mavi = güven (fintech anchor rengi; kızıl-yeşil renk körü ~%10 nüfusa erişilebilirlik için kritik); yeşil = tamamlanma/onay (Tier 2 "action" rengi, irreversible finansal aksiyonların kaygısını azaltır); kırmızı = aciliyet/hata (idareli kullan). Yatırım uygulamalarında kırmızı-yeşil dashboard'un kullanıcıyı duygusal "rollercoaster"a sokup dürtüsel/kısa-vadeli davranışı tetiklediği gözlemleniyor — Yumo bunu bilinçli yönetmeli.
- **Data storytelling:** Ham sayı değil bağlam + karşılaştırma. Stanford SIEPR çalışması hikâye-temelli finansal eğitimin okuryazarlığı artırdığını ama 8 ayda davranış göstergelerinde fark yaratmadığını buldu ("değişim zaman alıyor; 8 ay yeterli olmayabilir" — Lusardi).
- **Genel ilke (Coupler.io / Merge.rocks):** 4-5 anahtar metrik öne çıkar, gerisi drill-down; tutarlı renk kodlaması; tooltip ile kesin değerler.

### 3. PSİKOLOJİK PROFİL OLUŞTURMA

- **EPJ Data Science (Tovanich ve ark., 2021; DOI 10.1140/epjds/s13688-021-00281-y):** 1.306 müşteri, 5 özellik ailesi (genel/zamansal/kategorik harcama, kategori profili, sosyo-demografik). **Sonuç:** Materyalizm ve Öz-kontrol yüksek doğrulukla; Big Five'tan yalnızca Dışadönüklük ve Nevrotiklik makul doğrulukla tahmin edilebilir. Öz-kontrolü yüksek kişiler daha istikrarlı, nevrotik kişiler zaman içinde daha az süreklilik gösteriyor.
- **MDPI/arXiv (Explainable AI from Spending Data, 2021):** 6.408 kişi, 285 harcama kategorisi, BFI-2 anketiyle eşlenmiş; global kural çıkarımıyla hangi harcama paternlerinin kişiliği yordadığını açıklıyor (XAI yaklaşımı, kara-kutu değil).
- **74 milyon işlem / 127.469 müşteri** veri setiyle bireysel düzeyde psikolojik çıkarım çalışıldı.
- Harcama saati → sirkadyen ritim/impulsivite ilişkisi: geç-saat alımları düşük öz-kontrol ve karar yorgunluğu (decision fatigue) ile ilişkili.
- Kategori ağırlıkları → yaşam tarzı profilleri; tekrar eden harcama → ritüel vs. dürtü ayrımı.
- **Spending personality arketipleri:** ticari sistemler "Free Spirit / Saver / Pleasure Seeker / Enterprising / Puritan" gibi arketipler kullanıyor (Mind Money Balance 4 tip; Abacus Wealth 8 tip).
- **Yaş/cinsiyet farkları:** NielsenIQ + World Data Lab "The X Factor" raporu (10 Temmuz 2025): kadınlar yıllık **31,8 trilyon $** harcama kontrol ediyor ve **"now influence 70%–80% of all consumer spending"**; rapor kadınların "ilk kez küresel harcamanın yarısını kontrol ettiğini" belirtiyor. Berkeley CMR (2025): kadınlar anlamlı/hikâye-temelli deneyim ve duygusal bağ, erkekler işlevsellik/kontrol ve sadelik arıyor. Yaşla harcama gücü 30-50 arası zirve yapıp düşüyor.
- **Identity-based consumption (Reed, Forehand, Puntoni & Warlop 2012, *IJRM* 29(4)):** seçimler kimlik-temellidir ve durumsal ipuçlarıyla tetiklenir; düşük-katılımlı (low-involvement) alımlarda kimlik/sembolik ipuçları, yüksek-katılımlıda faydacı kriterler baskın.

### 4. AKSİYON ÖNERİ MOTORLARI & NUDGING

- **Bütçeleme çalışmıyor; merak + anlık taahhüt çalışıyor.** Irrational Labs / Duke Common Cents Lab'in **9.035 kişilik** (13 hafta, Eylül 2019) testinde hiçbir bütçeleme koşulu harcamayı anlamlı azaltmadı (kontrol $675,97 vs. tek-bütçe $681,08 vs. kategori $673,25; tümü p>0,4); bütçeleyenler bütçeyi **1,3-1,4x aştı** ve bütçelenen kategorideki harcama bütçelenmeyenden ~$30 daha **yüksek** çıktı (p<.001). Kristen Berman'ın reçetesi: **"tahmin oyunu"** ("Amazon'a ne kadar harcadın sence?") → şaşkınlık → o spesifik satıcı için ileri-dönük kural taahhüdü. (Not: tahmin oyununun **kendi etki büyüklüğü yayımlanmamış**, uzman hipotezi.)
- **Şok/utandırma geri tepebilir (ostrich effect).** Karlsson, Loewenstein & Seppi (2009, *Journal of Risk and Uncertainty* 38(2):95–115) "ostrich effect"i tanımladı ("avoiding exposing oneself to information that one fears will cause psychological discomfort"); Vanguard verisiyle saha replikasyonu (Sicherman ve ark. 2016) piyasalar düşerken kullanıcıların daha az login olduğunu gösterdi. Sung Kwan Lee (2019, SSRN) fintech aşırı-harcama mesajlarının ertesi gün harcamayı **C$8,15 (%5,35)** düşürdüğünü ama kullanıcıların sonrasında daha az login olduğunu (selektif dikkatsizlik) gösterdi.
- **Korku iştahı yalnızca yüksek öz-yeterlikle çalışır.** Witte & Allen (2000, *Health Education & Behavior* 27(5):591–615) meta-analizi: "strong fear appeals and high-efficacy messages produce the greatest behavior change, whereas strong fear appeals with low-efficacy messages produce the greatest levels of defensive responses." Tannenbaum ve ark. (2015, *Psychological Bulletin*) doğruluyor. **Tasarım sonucu:** her şok içgörüsünü hemen kolay ve etkili bir aksiyonla eşle.
- **Just-in-time / işlem-öncesi zamanlama kazanıyor.** Grubb ve ark. (2025, *Journal of Finance*) otomatik kayıtlı anlık SMS overdraft uyarılarının ücretleri **%4-19 azalttığını** ve telafi edici zarar yaratmadığını buldu ("provides a large consumer benefit without offsetting consumer harm"). Lee'den farkı: ton şikayetçi/utandırıcı değil, olgusal (düşük-bakiye) → ostrich tetiklenmiyor.
- **Salt bütçe bilgisi harcamayı artırabilir.** Think Forward Initiative (3 saha + 2 lab çalışması): bütçe-durumu bilgisine erişen tüketiciler, özellikle dönem sonunda, daha çok harcadı; hafızadan takip edenler aşmadı (mekanizma: "kalan para" belirsizliğinin azalması güvenlik marjını kaldırıyor). **Sonuç:** pasif dashboard yerine aksiyon/taahhüt çerçevesi.
- **Taahhüt cihazları en temiz etki.** Ashraf, Karlan & Yin (2006, *QJE* 121(2):635–672) SEED ürünü 1 yılda tasarrufu **%81 artırdı** (2,5 yılda %33'e geriledi; güçlü heterojenlik — müşterilerin %50'si ilk yatırımdan sonra yeni mevduat yapmadı). Thaler & Benartzi (2004, *JPE* 112(S1)) Save More Tomorrow tasarruf oranını **40 ayda %3,5→%13,6** yaptı (%78 katılım, %80 kalış). StickK (Karlan, Ayres, Goldberg): taahhüt sözleşmeleri başarı şansını ~3 katına çıkarıyor (kurucu araştırması — pazarlama figürü).
- **EAST framework (Behavioural Insights Team 2014):** Easy, Attractive, Social, Timely. Save More Tomorrow'da insanların çoğu Ocak başlangıcını seçti (timely ilkesi).
- **Gain vs. loss framing'de evrensel kazanan yok.** Tasarruf (önleme-tipi, düşük-risk davranış) gain-framing'i hafifçe favori (Gallagher & Updegraff meta-analizi, 93 çalışma); yakın tarihli tekrarlı-efor çalışması (2025) loss-framing'in efor artırmadığını ve **stresi yükselttiğini** buldu.
- **Cleo benchmark'ı (Business Wire, 29 Tem 2025):** Cleo "over 14 billion user transactions—nearly 82 million per day" analiz etmiş; kullanıcılar "20x more than they do with typical banking apps" etkileşim gösteriyor; **>%85 yeni kullanıcı bir ay içinde** finansları hakkında daha iyi hissediyor; ~1M ücretli abone, $250M ARR. Roast/hype modu 18-36 yaş kitlede kişilik-temelli tonun gücünü kanıtlıyor.

### 5. UX/UI BEST PRACTICES & TASARIM TRENDLERİ (2023-2025)

- **Glassmorphism** veri-yoğun fintech dashboard'lar için "altın standart" olarak konumlanıyor (frosted-glass katmanlama, derinlik; backdrop-filter); ama kontrast/erişilebilirlik dikkat ister. 2026'da daha incelikli, dark-mode'la birleşik kullanılıyor.
- **Dark mode** fintech'te varsayılan beklenti (göz yorgunluğu azaltma, OLED batarya, odak).
- **Progressive disclosure** (Nielsen, NN/g 1995): karmaşık görevi katmanlara böl, sık gerekeni öne çıkar; >2 katman genelde düşük kullanılabilirlik. "How was this calculated?" gibi katmanlı açıklama paterni güven inşa eder.
- **Empty state** kritik onboarding dokunuşu: kullanıcılar ilk 3-5 saniyede karar veriyor; uygulamaların ~%80'i ilk hafta terk ediliyor. Boş ekranı eyleme dönüştür (Slack/Notion checklist paterni).
- **Aha moment / time-to-value:** ilk anlamlı değere hızlı ulaştır; bir aksiyon alan kullanıcı ikincisini 3-4x daha olası alır (Teresa Torres).
- **Gamification:** streak/badge/progress bar engagement'ı artırıyor ama Goodhart riski — "oyun katmanı"na optimize edip asıl davranışı ihmal etme; streak kaygı yaratabilir. *Not: vendor blogları (Netguru, StriveCloud, 2025-2026) "gamified apps increase user engagement by 48%" ve "boosts saving habits by 22%, users saving 20% more" diyor — bunlar bağımsız hakemli kaynak değil, temkinli yorumla.*
- **Benchmark gösterimi:** şehir/yaş grubu ortalaması vs. kullanıcı (ama peer-comparison çift taraflı kılıç — bkz. D'Acunto 2024).
- **Mobil-first, bento grid, variable fonts, kinetic typography** 2025-2026 trendleri.

---

## Recommendations (Aşamalı, Somut)

**Aşama 1 — MVP Pattern Sayfası (ilk lansman):**
- Tek **Hero Arketip Kartı** + tek çarpıcı karşılaştırma (aha moment <10 sn).
- **Tahmin Oyunu Modülü:** en sık satıcı için "Sence ne kadar?" → reveal → tek-tık ileri-dönük kural taahhüdü (bütçelemeyi tamamen atla).
- Mavi/yeşil güven paleti; kırmızı yalnızca gerçek risk anlarında.
- Empty state checklist: "3 fiş tara, profilin oluşsun" + örnek profil önizleme.
- Profili "ayna/içgörü" dili ile sun, "teşhis" iddiasından kaçın.

**Aşama 2 — Derinleşme (yeterli veri biriktiğinde, ~10+ fiş):**
- Saat×gün heatmap, kategori Sankey, psikolojik profil radar (yalnız güçlü-sinyalli eksenler: Materyalizm, Öz-kontrol, Dışadönüklük, Nevrotiklik).
- Just-in-time/işlem-öncesi olgusal bildirimler (utandırma yok, yüksek-öz-yeterlik tonu).
- Loss-aversion "kaçırılan tasarruf" kartı (gain-framed mikro-hedef).

**Aşama 3 — Farklılaşma & ölçekleme:**
- Fiş-OCR marka/mağaza-tipi identity katmanı.
- Opsiyonel taahhüt cihazı (commitment device): kullanıcı kendi kuralına "söz verir".
- Opsiyonel, dikkatli benchmark şeridi (şehir/yaş/cinsiyet).

**Eşik/karar metrikleri:** (a) Tahmin oyunu → kural taahhüdü dönüşüm oranı %15'in altındaysa framing'i revize et; (b) bildirim sonrası login oranı düşüyorsa (ostrich sinyali) tonu daha olgusal/pozitife çevir; (c) peer-benchmark gören az-harcayanlarda harcama artışı görülürse benchmark'ı yalnız fazla-harcayanlara göster.

---

## Pattern Sayfası Veri Modülleri (Öncelik Sırasıyla)
1. **Hero Arketip Kartı** — "spending personality" + tek çarpıcı karşılaştırma (aha moment).
2. **Tahmin Oyunu Modülü** — en sık satıcı → reveal → tek-tık kural taahhüdü.
3. **Saat × Gün Heatmap** — dürtüsel/duygusal harcama zamanlaması.
4. **Kategori Sankey/Treemap** — para akışı; ritüel vs. dürtü ayrımı.
5. **Psikolojik Profil Radar** — Materyalizm, Öz-kontrol, Dışadönüklük, Nevrotiklik.
6. **Loss-aversion "Kaçırılan Tasarruf" Kartı** — gain-framed mikro-hedef.
7. **Benchmark Şeridi** — şehir/yaş/cinsiyet (opsiyonel, dikkatli).
8. **Just-in-time Bildirim Ayarı** — işlem-öncesi/olgusal ton.
9. **Identity/Marka İçgörüsü** — fiş-OCR'dan marka/mağaza tipi → öz-algı katmanı.
10. **Empty State / Onboarding Checklist.**

## Rakiplerden Farklılaşma Fırsatları
- **Fiş-düzeyi OCR verisi** (ürün, marka, saat, mağaza): Cleo/Monarch/Emma banka feed'iyle sınırlı; Yumo ürün-düzeyi granülerlikle identity-based ve zaman-mekân profili çıkarabilir.
- **Merak-temelli insight-to-action** (bütçeleme yerine tahmin oyunu + anlık taahhüt) — kanıtlanmış başarısız bütçelemeden ayrış.
- **Şehir + yaş + cinsiyet + saat dörtlüsüyle** psikografik anlatı — rakiplerde yok.
- **Utandırmayan, yüksek-öz-yeterlikli ton** — Cleo'nun roast'ından farklı, kaygı yaratmadan farkındalık.

## En İyi 10 Referans Uygulama/Kaynak
1. **EPJ Data Science (Tovanich ve ark., 2021)** — harcamadan psikolojik çıkarımın akademik temeli.
2. **Irrational Labs / Kristen Berman (Common Cents Lab)** — bütçelemenin başarısızlığı + tahmin oyunu reçetesi.
3. **Cleo** — kişilik-temelli AI coach, roast/hype modu (14B+ işlem, 20x engagement).
4. **Monarch Money** — Sankey + en zengin görselleştirme seti.
5. **Behavioural Insights Team — EAST framework.**
6. **Ashraf, Karlan & Yin (2006, QJE) / Thaler & Benartzi (2004, JPE)** — taahhüt cihazları.
7. **D'Acunto, Rossi & Weber (2024, JFE)** — peer-comparison etkisi.
8. **Atalay & Meloy (2011, Psychology & Marketing)** — retail therapy.
9. **Nielsen Norman Group** — progressive disclosure, empty state, form UX.
10. **Grubb ve ark. (2025, Journal of Finance)** — just-in-time uyarı etkisi.

## Caveats
- Harcamadan kişilik çıkarımı sınırlı doğrulukta; Yumo "kesin teşhis" iddiasından kaçınmalı (yasal/etik + doğruluk riski).
- Peer-comparison ve gamification çift taraflı kılıç; yanlış uygulandığında harcamayı artırabilir veya kaygı yaratabilir.
- Tahmin oyununun etki büyüklüğü henüz yayımlanmadı (uzman hipotezi — Berman/Irrational Labs).
- Bazı sektörel istatistikler (impulse %40; gamification +%48/+%22; renk-karar %62-90) vendor/blog kaynaklı — temkinli yorumla; A/B testle doğrula.
- Veri gizliliği (GDPR/KVKK ve AB AI Act): psikografik profilleme hassas kategori; şeffaflık, açıklanabilirlik ("How was this calculated?") ve opt-out zorunlu.
- StickK'in "3 kat" ve Cleo metrikleri kurum-içi/pazarlama kaynaklı; akademik çıpa için Ashraf (2006) ve Thaler-Benartzi (2004) tercih edilmeli.