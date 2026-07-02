# Yumo Yumo Davranışsal Finans ve Tüketici Psikolojisi Raporu
## Bilişsel Önyargılar, PostgreSQL Veri Analitiği ve UX/Görselleştirme Tasarım Örüntüleri

---

## 1. Giriş ve Kuramsal Çerçeve: Psikoloji ve Finansın Kesişim Kümesi

Geleneksel finans teorileri, bireylerin her zaman kendi kişisel faydalarını maksimize etmek üzere rasyonel kararlar alan aktörler olduğunu varsayar; ancak **davranışsal finans**, insan kararlarının sistematik bilişsel önyargılar, duygusal tetikleyiciler ve sınırlı rasyonellik çerçevesinde şekillendiğini ortaya koymaktadır. 

Kişisel finans yönetimi (PFM) sistemleri, kullanıcıların finansal verilerini yalnızca geriye dönük birer muhasebe kaydı olarak sunmaktan öteye geçerek, harcamaların arkasında yatan psikolojik dinamikleri açığa çıkarmakla yükümlüdür. Bu bağlamda, tüketici davranışını yönlendiren temel psikolojik mekanizmaların ve bilişsel önyargıların çözümlenmesi, Yumo Yumo platformunun **"Pattern" (Örüntü)** sayfasının mimarisini oluşturmada temel taş görevi görmektedir.

### Temel Psikolojik Mekanizmalar

* **Zihinsel Muhasebe (Mental Accounting):** Nobel ödüllü ekonomist Richard Thaler tarafından tanımlanan bu teoriye göre; insanlar, paranın ikame edilebilir (*fungible*) olduğu gerçeğini göz ardı ederek, fonları kaynağına veya kullanım amacına göre zihinsel olarak farklı kategorilere ayırırlar. Örneğin, emek harcanarak kazanılan bir maaş gelirine kıyasla, beklenmedik bir şekilde elde edilen bir hediye, vergi iadesi ya da yolda bulunan bir nakit (*windfall*), bireyler tarafından "mutlu para" olarak kodlanmakta ve çok daha kolay harcanabilmektedir.
* **Ödemenin Acısı (Pain of Paying):** Kredi kartı veya dijital ödeme yöntemlerinin kullanılması bu mekanizmayı hafifletmektedir. Nakit ödemelerde cüzdandan fiziksel olarak çıkan paranın yarattığı anlık kayıp hissi, dijital ödemelerde "ödeme ayrışması" (*payment decoupling*) nedeniyle ertelenmekte ve bu durum tüketiciyi daha yüksek meblağlarda ve dürtüsel harcamalar yapmaya yöneltmektedir.
* **Dürtüsel Satın Alma (Impulse Buying):** Nörobiyolojik arka planda mezolimbik dopamin sisteminin yönettiği ödül ve beklenti döngüleri yer alır. Alışveriş sürecinin en yüksek dopamin salınımı yaratan aşaması, satın alma anından ziyade, ürünün aranması, mağazada gezinme veya sepete ekleme gibi **beklenti (anticipation)** evresidir. Bu durum, bireylerin can sıkıntısı, kaygı veya yetersizlik hissi gibi duygusal boşlukları anlık dopamin artışlarıyla kapatmaya çalıştığı **"Alışveriş Terapisi" (Retail Therapy)** olgusunu tetikler. Satın alma işlemi tamamlandıktan hemen sonra dopamin seviyeleri hızla düşerek yerini *tüketici pişmanlığına (buyer's remorse)* ve *egonun tükenmesine (ego depletion)* bırakır.

### Alışveriş Bağımlılığı ve Dürtüselliğe Giden Süreç



| Aşama | Psikolojik Tanımlama | Finansal Göstergeler |
| :--- | :--- | :--- |
| **Aşama 1: Alışveriş Terapisi** | Boşluğu alışverişle doldurma çabası. | Stresli günlerde veya hafta sonlarında artan lüks ve keyfi harcamalar. |
| **Aşama 2: İnkâr** | Aşırı tüketimi ve bütçe aşımını görmezden gelme. | PFM uygulamalarını kontrol etme sıklığında düşüş, bildirimleri kapatma. |
| **Aşama 3: Borç Sarmalı** | Likidite kaybı yaşanmasına rağmen harcamaların sürmesi. | Eşzamanlı olarak hem yüksek kredi kartı borcu taşıma hem de düşük faizli tasarruf tutma. |
| **Aşama 4: Dürtüsel Satın Alma** | Düşünmeden ve aceleyle yapılan alışverişler. | Fişlerde tek seferlik yüksek tutarlı, planlanmamış sepetlerin sıklığı. |
| **Aşama 5: Kompülsif Tüketim** | Alışveriş eyleminin kontrol dışı kalması. | Sürekli tekrarlanan mikro-satın almalar ve gelir-gider dengesinin tamamen bozulması. |

> ⚠️ **Kritik Önyargı (Hiperbolik İndirgeme):** Dijital platformların tasarımı genellikle **Hiperbolik İndirgeme (Hyperbolic Discounting)** önyargısını istismar edecek şekilde kurgulanmaktadır. Tüketiciler, gelecekteki büyük bir ödül (tasarruf) yerine anlık küçük ödülleri (yeni bir giysi/yemek) tercih eder. 
> 
> Sonsuz kaydırma, kişiselleştirilmiş reklamlar ve tek tıkla ödeme gibi **Agresif Tüketici Tasarım Kalıpları (ACDPs)**, tüketicinin oto-kontrol mekanizmasını devre dışı bırakır. Yumo Yumo platformu, bu mekanizmaları tersine çevirerek "bilinçli tüketim" ve **"olumlu pürüzler" (positive friction)** tasarlamayı hedeflemelidir.

---

## 2. Türkiye Pazarı ve Makroekonomik Psikoloji: Enflasyonist Tüketici Davranışları

Türkiye'deki makroekonomik koşullar (yüksek enflasyon, döviz kuru dalgalanmaları), tüketici psikolojisini radikal biçimde yeniden şekillendirmektedir. Enflasyonist ortamlarda tüketiciler, gelecekte fiyatların daha da artacağını öngörerek harcamalarını öne çekme eğilimi gösterirler. Bu durum, tasarruf yapmanın rasyonelliğini yitirdiği algısını doğurur.

Yüksek enflasyonun yarattığı psikolojik baskı, harcama davranışlarında iki farklı uç kutup oluşturmaktadır:

1.  **İhtiyati Tedbir ve Marka Değiştirme (Trading Down):** Tüketiciler, temel gıda ve hanehalkı harcamalarında daha ucuz alternatiflere, market markalı (*private label*) ürünlere yönelmekte, esnek harcama kalemlerini sınırlandırmaktadır. Fiş verilerinden elde edilen birim fiyat analizleri, kullanıcının zaman içinde alt segment markalara geçişini net bir şekilde ortaya koyabilir.
2.  **Dopaminerjik Kaçış ve "Günü Kurtarma" Harcamaları:** Büyük ölçekli varlıkların (konut/otomobil) edinilebilirliğinin zorlaşması, genç yetişkinlerde **"mikro-lüks"** harcamalara (kaliteli bir kahve, şık bir akşam yemeği) yönelimi artırmaktadır. Gelecek birikimlerinden ümidini kesen birey, anlık mutluluk kaynaklarına yönelerek finansal stresini hafifletmeye çalışmaktadır.

### Demografik Özellikler ve Harcama Motivasyon Faktörleri Korelasyonu

| Demografik Kohort | Öne Çıkan Davranışsal Örüntü | Baskın Faktör Yapısı | Psikolojik Güdüleyici | Analiz Metriği |
| :--- | :--- | :--- | :--- | :--- |
| **Genç Metropol Kadın** *(18-29, İst/Ank)* | Kozmetik, hazır giyim ve gurme kafe harcamalarının yüksek frekansı. | Moda Odaklılık & Düşünmeden Alışveriş. | Sosyal kimlik inşası, akran onayı ve anlık haz arayışı. | **Sosyal Kanıt Endeksi:** Akran grubuna göre keyfi tüketim sapması. |
| **Genç Metropol Erkek** *(18-29, İst/İzm)* | Teknoloji aksesuarları, dijital oyun ve dışarıda yeme-içme. | Marka Odaklılık & Alışkanlık. | Prestij algısı, statü göstergesi ve dopaminerjik kaçış. | **Dopamin Frekansı:** Hafta içi akşam saatlerindeki sipariş yoğunluğu. |
| **Orta Yaş Aile Reisi** *(35-50, Anadolu)* | Toplu gıda alımı, çocuk odaklı harcamalar ve indirim marketleri. | Fiyat Odaklılık & Mükemmelliyetçilik. | İhtiyati tasarruf güdüsü, bütçe koruma ve kayıptan kaçınma. | **Birim Fiyat Endeksi:** İndirimli ve özel markalı ürünlerin sepet payı. |
| **İleri Yaş Tüketici** *(50+, Tüm Şehirler)* | Eczane, sağlık ve geleneksel perakende harcamalarının ağırlığı. | Alışkanlık & Marka Bağlılığı. | Değişime karşı direnç, güven arayışı ve düşük risk toleransı. | **Sadakat Katsayısı:** Aynı zincir market/markadan yapılan alışveriş yüzdesi. |

> 📊 **Kültürel Not:** Türkiye gibi gelişmekte olan pazarlarda *Dinamik Fiyatlandırma (Dynamic Pricing)* uygulamalarına karşı kültürel ve ahlaki bir hassasiyet bulunmaktadır. Enflasyonist belirsizlik ortamında tüketicinin "kontrolü geri kazanma" ihtiyacı, Yumo Yumo "Pattern" sayfasında sunulacak analitik verilerin şeffaf ve yapıcı bir dille sunulmasını zorunlu kılmaktadır.

---

## 3. PostgreSQL ile Kanonik Veri Modellemesi ve Semantik Sınıflandırma

Yumo Yumo platformuna OCR aracılığıyla aktarılan fiş verileri düzensiz, eksik ve yazım hataları içeren metin yığınlarından oluşmaktadır. Bu verilerin veritabanı düzeyinde temizlenmesi, normalleştirilmesi ve kanonik bir ürün/kategori ağacına eşlenmesi gerekmektedir.

### Mimari Araçlar ve İndeksleme

* **Metin Benzerliği ve Trigram Eşleme (`pg_trgm`):** OCR çıktılarındaki tipik yazım hatalarını (örn. "Coca Cola" yerine "C0ca C0la") tolere edebilmek için kullanılır. İki metin arasındaki ortak trigram oranını hesaplayarak $0$ ile $1$ arasında bir benzerlik skoru döndürür. Performans için sorgular **GIN (Generalized Inverted Index)** ile desteklenmelidir. GIN indeksi, büyük veri kümelerinde benzerlik aramalarını milisaniyeler düzeyine indirir.
* **Tam Metin Arama (`tsvector` ve `tsquery`):** Kelimelerin kökenlerine (*lexemes*) inerek semantik arama yapar. `to_tsvector` duraklama sözcüklerini (*stop words*) temizler; `to_tsquery` ise mantıksal operatörlerle (`AND`, `OR`, `NOT`) sorgulama sağlar. `unaccent` eklentisi ile Türkçe karakter hassasiyeti (ı-i, ş-s, ğ-g) tamamen ortadan kaldırılır.

### Kanonik Sınıflandırma Veri Modeli Tasarımı

```sql
-- Gerekli eklentilerin etkinleştirilmesi
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Kullanıcı Bağlam Tablosu
CREATE TABLE users_context (
    user_id SERIAL PRIMARY KEY,
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    city VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kanonik Ürün Sınıflandırma Tablosu (Dimension)
CREATE TABLE canonical_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    sub_category_name VARCHAR(100) NOT NULL,
    search_keywords TEXT[] NOT NULL,
    ts_keywords tsvector
);

-- Fiş Üst Bilgi Tablosu (Fact)
CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users_context(user_id),
    merchant_name VARCHAR(150) NOT NULL,
    transaction_time TIMESTAMP NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- Nakit, Kredi Kartı, Temassız
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fiş Kalemleri Detay Tablosu (Fact Detail)
CREATE TABLE receipt_items (
    id SERIAL PRIMARY KEY,
    receipt_id INT REFERENCES receipts(id) ON DELETE CASCADE,
    raw_item_name VARCHAR(255) NOT NULL,
    canonical_category_id INT REFERENCES canonical_categories(id),
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

-- İndeks Tanımlamaları
CREATE INDEX idx_canonical_keywords_gin ON canonical_categories USING gin(ts_keywords);
CREATE INDEX idx_canonical_subcat_trgm ON canonical_categories USING gin (sub_category_name gin_trgm_ops);

-- tsvector Alanını Otomatik Güncelleyen Fonksiyon ve Tetikleyici (Trigger)
CREATE OR REPLACE FUNCTION update_canonical_tsvector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ts_keywords := to_tsvector('turkish', unaccent(coalesce(array_to_string(NEW.search_keywords, ' '), '')));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_canonical_tsvector_update
BEFORE INSERT OR UPDATE ON canonical_categories
FOR EACH ROW EXECUTE FUNCTION update_canonical_tsvector();

Ağırlıklı Eşleştirme Sorgu Örneği
OCR ile okunan ham bir fiş satırının kanonik sınıflara atanmasını sağlayan, tam metin ve trigram skorlarını ağırlıklandırarak birleştiren SQL sorgusu:

WITH matched_items AS (
    SELECT 
        id, 
        category_name, 
        sub_category_name,
        -- Tam metin arama skoru (Ağırlıklı öncelik)
        ts_rank_cd(ts_keywords, to_tsquery('turkish', 'filtre & kahve')) AS search_rank,
        -- Trigram benzerlik skoru
        similarity(unaccent(sub_category_name), unaccent('Filtre Kahve 250gr')) AS trigram_score
    FROM canonical_categories
    WHERE ts_keywords @@ to_tsquery('turkish', 'filtre | kahve') 
       OR unaccent(sub_category_name) % unaccent('Filtre Kahve 250gr')
)
SELECT 
    id,
    category_name, 
    sub_category_name, 
    -- Skorların ağırlıklandırılarak birleştirilmesi (%70 FTS, %30 Trigram)
    (coalesce(search_rank, 0) * 0.7 + coalesce(trigram_score, 0) * 0.3) AS confidence_score
FROM matched_items
ORDER BY confidence_score DESC
LIMIT 1;

4. UX ve İleri Düzey Veri Görselleştirme Tasarım Kalıpları
Geleneksel kişisel finans araçlarının en büyük başarısızlık noktası, kullanıcılara sıkıcı, statik ve suçlayıcı pasta grafikler (pie charts) sunmalarıdır. Pasta grafikler, 5 ten fazla kategori içerdiğinde okunabilirliğini yitirir. Yumo Yumo "Pattern" sayfası, standart dışı ve etkileşimli görselleştirme tekniklerine odaklanmalıdır.

Finansal Akış Sahneleri İçin Sankey Diyagramları
Sankey diyagramları, miktarların bir aşamadan diğerine nasıl aktığını gösteren, bant genişliklerinin akış hacmiyle doğru orantılı olduğu araçlardır. Yumo Yumo "Pattern" sayfasında akış şu şekilde kurgulanmalıdır:

Sol Düğümler (Tetikleyiciler/Bağlamlar): "Gece Yarısı Dürtüsü", "İş Çıkışı Tükenmişliği", "Hafta Sonu Eğlencesi".

Orta Düğümler (Sektörel Kategoriler): "Yemek Siparişi", "Giyim & Moda", "Market".

Sağ Düğümler (Kanonik Çıktılar): "Premium Markalar", "İndirim Marketleri", "Dijital Abonelikler".

Eşmerkezli Yolculuklar İçin Sunburst (Güneş Patlaması) Diyagramları
Sunburst diyagramları, hiyerarşik verileri dairesel, iç içe geçmiş halkalar halinde sunan radyal grafiklerdir.

Merkez: Ana bütçe dilimi (örn. Süpermarket)

İkinci Halka: Mağaza zinciri (örn. Şarküteri)

En Dış Halka: Fişten okunan spesifik ürün grubu (örn. Gurme Peynirler)

Görselleştirme Türlerinin Karşılaştırmalı Analizi
Görselleştirme Türü,En Güçlü Olduğu Alan,En Büyük Zayıflığı,Yumo Yumo Pattern Sayfası Kullanım Senaryosu
Sankey Diyagramı,"Süreç akışlarını, neden-sonuç ilişkilerini ve hacimsel dönüşümleri göstermek.",Adım sayısı arttıkça ve çok fazla çapraz geçiş (criss-cross) olduğunda karmaşıklaşması.,"""Tetikleyiciden Markaya Finansal Akış"" görünümü. (Duygusal tetikleyiciler ile nihai satın almaların eşlenmesi)."
Sunburst Diyagramı,İç içe geçmiş hiyerarşik yapıları ve çok katmanlı kategorizasyon bütünlüğünü sunmak.,Farklı dallar arasındaki çapraz ilişkileri ve bağımsız akış yollarını göstermekte yetersiz kalması.,"""Ürün Sepeti Derinliği"" analizi. (Merkezden dışa doğru kategori kırılım detayı)."

Fintech Sektörü Tasarım Kalıpları ve Anti-Pattern ler

- Zaman Serisi Çizgileri (Time-Series Line): Nakit akışı gelişimi için idealdir. Grafik başına en fazla 4-6 çizgi serisi kullanılmalıdır. Sapmalar çok küçük olmadıkça Y-ekseni sıfır tabanlı olmalıdır.

- Yığılmış Çubuk Grafikler (Stacked Bar): Zaman dilimlerindeki kompozisyonlar için kullanılır. Kategori sayısı en fazla 4-6 ile sınırlandırılmalı ve yığın sıralaması sütunlar arasında tutarlı olmalıdır.

- Cohort Izgaraları (Cohort Grid): Kullanım aylarına göre harcama/tasarruf eğilimlerindeki değişimi gösteren ısı haritası benzeri matrislerdir.

- WCAG 2.2 Erişilebilirliği ve Renk Kodlaması: Geleneksel kırmızı-yeşil renk kodlaması renk körü kullanıcılar için erişilemezdir. Renk kodları her zaman uygun simgelerle (yeşil yukarı ok, kırmızı aşağı ok) desteklenmeli, Stephen Fewun "Düşük Yoğunluklu Temel, Yüksek Yoğunluklu İstisna" kuralı uyarınca yalnızca sapma gösteren anomali verileri renkli vurgulanmalıdır.

🚫 Fintech Görselleştirme Anti-Patternleri (Kaçınılması Gerekenler):

- 3D Grafikler: Perspektif bozulması nedeniyle veri doğruluğunu yok eder.
- Çift Eksenli Grafikler (Dual-Axis): Tek grafikte iki farklı ölçek sahte korelasyon algısı yaratır.- Karışık Para Birimleri: Kur dönüşüm damgası olmaksızın farklı para birimlerinin aynı eksende sunulması.
- Gizli Zaman Dilimleri: Zaman dilimlerinin (UTC, TSİ vb.) açıkça belirtilmemesi.

5. Yumo Yumo "Pattern" Sayfası İçin Davranışsal Dürtme (Nudge) Modelleri

"Pattern" sayfası, yalnızca pasif bir analiz ekranı değil; kullanıcının finansal davranışlarını daha sağlıklı bir yöne bükmeyi amaçlayan aktif bir eylemsel müdahale (intervention) merkezi olmalıdır.

Geliştirilmiş "Tetikleyici Genomu" (Trigger Genome)

Whistl modelinden uyarlanan ve PostgreSQL veri modeliyle entegre çalışan 8 boyutlu Tetikleyici Genomu, harcamanın gerçekleştiği anın çevresel ve psikolojik bağlamını haritalandırır:

$$\text{Tetikleyici Genomu} = \{ \text{Duygu, Zaman, Lokasyon, Sosyal Bağlam, Finansal Durum, Takvim, Hava Durumu, Fiziksel Durum} \}
$$

Duygusal Boyut: [Stresli, Canı Sıkılmış, Heyecanlı, Yalnız] (Kullanıcı Geri Bildirimi)

Zaman Boyutu: [Gece Yarısı, Hafta Sonu, Ay Başı, İş Çıkışı] (receipts.transaction_time)

Lokasyon Boyutu: [Evde Yalnız, Ofis Çevresi, Alışveriş Merkezi] (users_context.city & OCR)

Sosyal Boyut: [Sosyal Baskı, Akran Grubu Etkisi, Yalnız Tüketim] (OCR Detayı)

Finansal Boyut: [Maaş Günü, Beklenmedik Gelir, Limit Aşımı] (receipts.total_amount)

Takvim Boyutu: [Resmi Tatil, Bayram, Yılbaşı, İndirim Dönemi] (Sistem Saati)

Hava Durumu Boyutu: [Yağmurlu, Aşırı Sıcak, Kapalı/Kasvetli] (Hava Durumu API)

Fiziksel Boyut: [Yorgunluk, Zaman Kısıtı, Acele Satın Alma] (Dolaylı Analiz)

💬 Örnek Doğal Dil Bildirimi (Narrative):"Hava sıcaklığının 10°C'nin altına düştüğü yağmurlu günlerde, dışarıda yeme-içme harcamalarınız normal günlere göre %34 oranında artıyor. Bu durum, zihinsel muhasebenizde soğuk hava stresini hafifletmeye yönelik bir 'teselli harcaması' olabilir. Bir sonraki yağmurlu gün sipariş vermeden önce 15 dakikalık bir 'dur ve düşün' molası vermek ister misiniz?"

Olumlu Pürüz Mühendisliği (Positive Friction) ve Öz Kararlılık Kuramı

Modern fintech arayüzleri işlemleri pürüzsüz (frictionless) hale getirerek harcamayı körükler. Yumo Yumo ise dürtüsel harcama anlarında kasıtlı olarak Olumlu Pürüzler (Positive Friction) devreye sokmalıdır:

- Dinamik Bekleme Süreleri: Gece yarısı yüksek riskli bir lüks harcama tespit edildiğinde, analiz ekranının açılmasını geciktiren onay adımları.

- Farkındalık Promptları: Satın alma dürtüsünü sorgulatan mikro anketler ("Bu harcamayı yaparken ne hissediyordunuz?").

Bu müdahaleler tasarlanırken Öz Kararlılık Kuramı (Self-Determination Theory) uyarınca kullanıcının özerklik (autonomy) ve yeterlilik (competence) ihtiyaçları zedelenmemelidir. Uygulama cezalandırıcı bir otorite değil; kararı kullanıcıya bırakan bir rehber olmalıdır. Gamifikasyon öğeleri (bütçe koruma serileri, farkındalık rozetleri) ile içsel motivasyon desteklenmelidir.

Sayfa Yerleşim Şeması (Layout Architecture)

1- Ön Plan (Foreground) - Davranışsal Özet Kartı: En üstte son 30 günlük "Duygusal Harcama Katsayısı" ve akran grubuna (cohort) göre durumu özetleyen minimalist KPI kartı. Renk körü dostu trend okları ve mikro-sparklinelar.

2- Orta Plan (Midground) - Karar Verme ve Akış Analitiği: Sayfanın gövdesini kaplayan dinamik ve etkileşimli Sankey Diyagramı.

3- Arka Plan (Background) - Yapıcı Eylem Planı (Nudges): En altta kural tabanlı otomatik birikim önerileri (Rule-Based Savings) ve esnek bütçe sınırları (Auto-Calculated Category Budgets).

6. Sonuç ve Stratejik Öneriler

Yumo Yumo platformunun "Pattern" sayfası, ham finansal verileri eyleme dönüştürülebilir psikolojik içgörülere dönüştürmek amacıyla şu üç temel sütun üzerine inşa edilmelidir:

- PostgreSQL Katmanı ile Veri Standardizasyonu: pg_trgm trigram benzerliği ve yerleşik tam metin arama (tsvector/tsquery) yetenekleri kullanılarak, OCR çıktılarındaki yazım hataları veritabanı düzeyinde temizlenmeli ve kanonik veritabanına işlenerek uygulama performansı optimize edilmelidir.

- Etkileşimli ve Suçlamayan UX Tasarımı: Statik pasta grafikler yerine, harcamaların arkasındaki psikolojik tetikleyiciler ile nihai satın alma kararları arasındaki akışı gösteren yarı şeffaf, etkileşimli Sankey diyagramları kullanılmalıdır. Veriler demografik akran grubu bağlamına oturtulmalıdır.

- Davranışsal Nudge ve Olumlu Pürüz Entegrasyonu: Tüketici psikolojisindeki "Ödemenin Acısı" ve "Alışveriş Terapisi" gibi mekanizmalar analiz edilerek, finansal stres anlarında olumlu pürüzler ve farkındalık promptları devreye sokulmalıdır. Kullanıcının finansal özerkliğine saygı duyan bir anlatım dili benimsenmelidir.