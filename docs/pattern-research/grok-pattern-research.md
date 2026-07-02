# Yumo Yumo Pattern Sayfası Araştırma Raporu

**Psikoloji + Davranışsal Ekonomi + UX + Veri Görselleştirme + Engagement Odaklı Derin Araştırma**

**Hazırlayan:** Grok (xAI)  
**Tarih:** 23 Haziran 2026  
**Proje:** Yumo Yumo – Kişisel Harcama Davranış Analizi

---

## Giriş ve Amaç

Pattern sayfası, Yumo Yumo ürününün **en kritik ve can alıcı bölümü**. 

Kullanıcılar alışveriş fişlerini OCR ile sisteme ekledikçe (tarih, saat, kalem kalem ürünler, tutarlar, mağaza bilgileri) ve siz de yaş, cinsiyet, şehir bilgisiyle birleştirdikçe, amacınız **“harcamanın arkasındaki davranışsal örüntüleri”** ortaya çıkarmak.

Bu rapor, modern psikoloji (davranışsal ekonomi + finansal psikoloji), analitik ekonomi, UX en iyi uygulamaları ve engagement/reklam stratejileri ışığında:

- Hangi grafikler, veriler ve anlatım biçimlerinin kullanılabileceğini
- Nasıl “standart dışı ama basit ve güçlü” bir sayfa tasarlanabileceğini
- Bilimsel temelleri ve pratik önerileri

detaylı olarak sunar.

---

## 1. Teorik Temeller: Modern Psikoloji + Davranışsal Ekonomi

### 1.1 Mental Accounting (Zihinsel Muhasebe) – Richard Thaler
İnsanlar parayı mantıksal olarak “fungible” (değiştirilebilir) görmez. Parayı **zihinsel kategorilere** ayırır:

- “Kira / zorunlu giderler parası”
- “Eğlence / discretionary parası”
- “İkramiye, hediye, vergi iadesi = ekstra / windfall parası”
- “Kredi kartı parası” (ödeme acısı daha az hissedilir)

**Sonuç:** Aynı miktar para, kaynağına göre farklı harcanır. İkramiye parası daha özgür harcanırken, maaş parası daha dikkatli kullanılır. Kredi kartı kullanımı toplam harcamayı artırır.

**Pattern Sayfası İçin Fırsat:**  
Kullanıcının harcama örüntüsünü “zihinsel kategoriler” üzerinden görselleştirip, “Bu hafta windfall kategorisinden gelen harcamanız normal maaş harcamanıza göre %X daha yüksek. Bu klasik mental accounting davranışıdır.” şeklinde nazikçe işaret etmek çok güçlü bir “aha” anı yaratır.

### 1.2 Present Bias + Hyperbolic Discounting
Küçük, anlık keyifler (kahve, hızlı alışveriş) uzun vadeli faydalardan daha çekicidir. Özellikle stresli dönemlerde ve genç yaş gruplarında belirgindir.

### 1.3 Loss Aversion + Dopamine & Emotional Spending
Kaybetme acısı kazanma sevincinden daha güçlüdür. Alışveriş sırasında dopamin salgılanır. Stres, can sıkıntısı, üzüntü veya “kendini ödüllendirme” ihtiyacı tetikleyici olur (retail therapy).

**Zaman bazlı görselleştirmeler** (Heatmap) bu tetikleyicileri çok net ortaya çıkarır.

### 1.4 Money Scripts (Finansal Psikoloji / Financial Therapy)
Çocukluktan gelen bilinçdışı para inançları (Klontz ve ark.):

| Script              | Temel İnanç                          | Tipik Harcama Davranışı          | Pattern Sayfasında İşaret |
|---------------------|--------------------------------------|----------------------------------|---------------------------|
| **Money Status**    | Kendilik değeri = maddi başarı     | Statü harcamaları, karşılaştırma | Yüksek varyanslı lüks/discretionary |
| **Money Worship**   | Para her sorunu çözer              | Aşırı harcama döngüsü            | Discretionary dominansı   |
| **Money Avoidance** | Para utanç verici / kötü           | Finansal konuları ihmal          | Düzensiz veya düşük takip |
| **Money Vigilance** | Dikkatli ve ketum olmak gerekir    | Sorumlu ama kaygılı              | Düzenli ama düşük discretionary |

Bu script’ler compulsive buying gibi davranışları öngörebilir. Pattern sayfası script eğilimlerini **dolaylı ve nazik** şekilde gösterebilir.

### 1.5 Demografik Etkiler (Age, Gender, City)
- **Yaş:** Harcama yaşam döngüsünde “hump-shaped” (35-54 yaş zirve). Gençlerde keşif ve discretionary yüksek; ileri yaşta essentials + sağlık artar, alışveriş daha az maceracı ve daha sık/küçük sepetli olur.
- **Cinsiyet:** Kadınlarda duygusal ve impulsive harcama eğilimi daha sık gözlenir (karma sonuçlar). Erkeklerde risk alma ve büyük statü alımları daha baskın olabilir.
- **Şehir:** Yerel yaşam maliyeti, kültürel normlar ve ekonomik belirsizlik dönemlerinde “doomspending” (anı yaşama odaklı harcama) artışı gözlenir (Türkiye bağlamında da güncel araştırmalar var).

**Öneri:** Anonimleştirilmiş, demografik olarak normalize edilmiş benchmark’lar kullanın (“Sizin yaş/cinsiyet/şehir grubunuzdaki benzer kullanıcılar...”).

---

## 2. Veri Kaynakları ve Çıkarılabilecek Örüntüler

Elinizdeki zengin veri seti:

| Veri Kaynağı       | İçerik                              | Çıkarılabilecek Örüntü                          |
|--------------------|-------------------------------------|-------------------------------------------------|
| OCR Fiş Verisi     | Tarih, saat, ürünler, tutar, mağaza | Zaman kalıpları, sepet analizi, marka sadakati |
| Kullanıcı Profili  | Yaş, cinsiyet, şehir                | Demografik benchmark + script eğilimi           |
| Postgres Tablosu   | Kanonik yazılmış tüm detaylar       | Agregasyon, zaman serisi, varyans analizi       |

**Güçlü Türev Metrikler:**
- Mental account proxy’leri (Discretionary / Essentials oranı + varyans)
- Zaman bazlı tetikleyici skorları (Heatmap’ten)
- Peer deviation (anonim)
- Script alignment skorları (dolaylı)
- Sepet birliktelik kuralları (Market Basket Analysis)

---

## 3. Pattern Sayfası için Somut Öneriler

### 3.1 Genel UX Felsefesi (İdeal Form)
- **Non-judgmental & Empowering** — Yargılamayın, merak uyandırın ve güçlendirin.
- **Kişiselleştirme** — Yaş, cinsiyet, şehir + kişisel baseline.
- **Progressive Disclosure** — Ana sayfada 3-4 güçlü insight + 1-2 güçlü görsel; detay drill-down.
- **Modern & Standart Dışı** — Sadece pie + bar yetmez. Flow, zaman ve hikaye odaklı görseller + psikolojik anlatım.
- **Engagement Odaklı** — Kullanıcılar kişiselleştirilmiş insight sayfalarıyla etkileşime girenlerde login sıklığı %60’a kadar artabiliyor.

### 3.2 Önerilen Sayfa Yapısı (Basit ama Etkileyici)

**Hero Bölümü**  
Kısa, empatik hikaye:  
> “Harcamalarınız sadece sayılardan ibaret değil. Arkalarında alışkanlıklar, duygular ve karar mekanizmaları var. İşte sizin benzersiz örüntünüz…”

**Ana Insight Kartları (3-5 tane)**  
Her kartta:
- Kısa başlık
- Kişiselleştirilmiş veri
- Psikolojik açıklama (1-2 cümle)
- Nazik “Ne anlama gelebilir?” sorusu

**Görsel Bölümler** (En kritik kısım)

#### 3.2.1 Heatmap (Zaman Bazlı Tetikleyiciler) – **En Yüksek Etki Önerisi**
Gün × Saat veya Takvim ısı haritası. Renk yoğunluğu = harcama tutarı veya sıklık.

**Neden çok güçlü?**  
“Ne zaman” harcama yapıldığını gösterir → duygusal ve durumsal tetikleyicileri (stres sonrası Cuma akşamı, maaş günü spike, hafta sonu retail therapy) net ortaya çıkarır. Kullanıcı “Bu benim hayatımın ritmi” der.

**Örnek Görsel Konsepti (Heatmap):**

![Spending Heatmap Örneği](searched_images/Kd7Zt.jpg)  
*(Benzer interaktif takvim/heatmap görselleri kullanılabilir – modern fintech dashboard’larında sık tercih edilir. Bu örnekte günlük harcama yoğunluğu renklerle gösteriliyor.)*

#### 3.2.2 Sankey Diagram – Para Akışı & Mental Accounting
Gelir kaynakları → Zihinsel kategoriler (Essentials / Discretionary / Goals / Windfall) → Alt kırılımlar.

Genişlik = tutar. “Leak”leri ve fırsat maliyetlerini çok net gösterir.

**Örnek Görsel Konsepti (Sankey):**

![Sankey Diagram – Cash Flow / Mental Accounting](searched_images/8g88s.jpg)  
*(Apple FY22 Income Statement örneği – benzer temiz akış diyagramları mental accounting ve para sızıntılarını çok net gösterir.)*

#### 3.2.3 Diğer Güçlü Görseller
- **Trend Çizgisi + Psikolojik Anotasyonlar** — Zaman içinde harcama + “Maaş sonrası present bias spike” gibi etiketler.
- **Treemap / Sunburst** — Kalem bazlı hiyerarşik harcama (ürün → alt kategori → mental account).
- **Nazik Peer Benchmark** — Radar veya grup bar chart (“Benzer profildeki kullanıcılar...”).
- **Item Association** — Sık birlikte alınan ürünler (lifestyle ipucu).

### 3.3 Anlatım ve Mikro-Kopya Örnekleri

**Mental Accounting Kartı Örneği:**
> “Bu hafta ‘ikramiye / windfall’ kategorisinden gelen harcamanız normal maaş harcamanıza göre %28 daha yüksek. Bu, klasik **mental accounting** davranışıdır. Birçok insan ‘ekstra’ kabul ettiği parayı daha özgür harcar. Bu örüntü uzun vadeli hedeflerinizi nasıl etkiliyor?”

**Zaman / Tetikleyici Kartı Örneği:**
> “Cuma akşamı ve Cumartesi günleri harcama yoğunluğunuz belirgin şekilde artıyor. Bu örüntü, birçok kullanıcıda iş haftası stresinin ardından gelen rahatlama veya sosyal aktivite ihtiyacıyla örtüşüyor (dopamin döngüsü). Sizde de benzer bir tetikleyici var mı?”

**Script Eğilimi Kartı Örneği (Nazik):**
> “Discretionary kategorinizdeki yüksek varyans, **Money Status** script’ine yakın bir örüntü gösterebiliyor. Kendilik değerini maddi ifadelerle ilişkilendirme eğilimi oldukça yaygındır. Farkındalık burada büyük bir fark yaratabilir.”

### 3.4 Engagement & Nudge Katmanları
- Her insight’a “Bu faydalı mıydı?” / “Hedefime bağla” butonları.
- Hafif gamification (keşif rozetleri).
- “Bu pattern’i dikkate alarak yeni bir Goal oluşturalım mı?” nudge’ı.
- Şeffaflık notu: “Benchmark’lar tamamen anonimleştirilmiş verilerden oluşur.”

---

## 4. Reklam ve Engagement İdeal Formları

Pattern sayfası **kendi içinde güçlü bir retention ve habit formation aracı**dır.

- Kişiselleştirilmiş “aha” anları duygusal bağ yaratır → ürün sadakati artar.
- Kullanıcılar görselleştirme ve insight sayfalarıyla daha sık etkileşime girer.
- İleride premium katman için doğal upsell zemini oluşturur (“Daha derin script analizi + kişiselleştirilmiş coaching”).
- **Etik kural:** Asla yargılayıcı olma. Her zaman “farkındalık + güçlendirme” ver. Kullanıcı her zaman kontrol sahibi olmalı.

---

## 5. Uygulama Notları & Riskler

### Teknik Öneriler
- Postgres’te zaman bucketing + window functions ile heatmap verisi hazırla.
- Benchmark tabloları şehir + yaş bandı + cinsiyet filtreli aggregate’lerden oluşsun (gizlilik korunarak).
- OCR sonrası kategori inference’ı **kullanıcı tarafından düzenlenebilir** yap (güven ve doğruluk artar).
- Market Basket Analysis için basit frekans veya Apriori implementasyonu.

### Riskler ve Mitigasyon
| Risk                        | Mitigasyon                                                                 |
|-----------------------------|----------------------------------------------------------------------------|
| Demografik stereotip        | “Ortalama eğilimler; sizin hikayeniz farklı olabilir” vurgusu + editable inference |
| OCR doğruluğu               | Güven skoru göster + kolay düzeltme arayüzü                                |
| Yeni kullanıcı (veri azlığı)| Önce kişisel trend, benchmark’ı kademeli aç                               |
| Aşırı bilgi yükü            | Güzel, minimal, mobil-first tasarım + progressive disclosure               |
| Gizlilik                    | Sadece aggregate benchmark, bireysel veri paylaşımı yok                     |

---

## Sonuç ve MVP Önerisi

**MVP Pattern Sayfası (Basit ama Standart Dışı ve Çok Güçlü)**

1. Empatik Hero + kısa hikaye
2. 3-4 kişiselleştirilmiş Insight Kartı (Mental Accounting + Zaman/Tetikleyici + Demografik Bağlam + Script eğilimi)
3. **Interactive Heatmap** (en yüksek etki)
4. **Sankey Akış Diyagramı** (mental accounting somutlaştırma)
5. Kısa “Ne yapabilirsin?” actionable bölüm + Goal entegrasyonu

Bu yapı:
- Bilimsel derinlik taşır (Thaler, Money Scripts, demografik araştırmalar)
- Kullanıcıyı yargılamadan güçlendirir
- Ürününüzü rakiplerden net şekilde farklılaştırır
- Yüksek engagement ve retention potansiyeli sunar

---

## Sonraki Adımlar (İsteğe Bağlı)

- Detaylı Wireframe / Figma önerisi
- Örnek SQL query’leri (heatmap, Sankey, benchmark)
- Kopya varyasyonları (A/B testi için)
- Görsel mock-up’lar (Grok Imagine ile)
- Teknik implementasyon roadmap’i

---

**Kaynaklar (Seçilmiş)**  
- Thaler, R. H. – Mental Accounting Matters  
- Klontz et al. – Money Scripts research  
- St. Louis Fed – How Mental Accounting Shapes Our Financial Choices  
- Çeşitli fintech UX araştırmaları (Monzo, YNAB, Cleo örnekleri)  
- Güncel tüketici psikolojisi ve doomspending çalışmaları (Türkiye dahil)

---

*Bu rapor, Yumo Yumo Pattern sayfasının hem bilimsel hem de kullanıcı odaklı, modern ve etkileyici bir deneyim olmasını sağlamak için hazırlanmıştır.*