# Veri temelleri

Önceki bölümdeki modeller, ancak okudukları istatistikler kadar iyidir. Bu bölüm bu
istatistiklerin nereden geldiğini ve nasıl kaynaklı ve güncel tutulduğunu ortaya
koyar.

## 3.1 Resmi istatistikler

Tahminin omurgası resmi Türkiye istatistikleridir:

- **TÜİK (Türkiye İstatistik Kurumu)** — ürünler için ortalama perakende fiyatlar,
  tüketici fiyat endeksi ve alt endeksleri, yurt içi üretici fiyat endeksi ve sektör
  bazında işgücü maliyeti endeksleri.
- **TCMB (Türkiye Cumhuriyet Merkez Bankası)** — enflasyon raporu ve referans
  dönemlerini hizalamak için kullanılan endeks hareketleri.
- **EPDK (Enerji Piyasası Düzenleme Kurumu)** — yakıt kategorisi için akaryakıt
  vergilendirmesi ve dağıtıcı marjları.
- **Ticaret Bakanlığı** — ithal ürünleri etkileyen gümrük vergisi kararları.

Bunlar tanımlı yürürlük tarihleri olan deterministik kamu veri setleridir; tahminin
genel bir ortalama yerine satın almanın dönemine bağlanmasını sağlayan da budur.

## 3.2 Kurumsal ve sektör verisi

Üretici-perakende farkları gerektiğinde, tahmin sektör kuruluşlarına ve şirket
açıklamalarına başvurur:

- Üretici-perakende ürün farkları için **TZOB (Türkiye Ziraat Odaları Birliği)**;
  market brüt marjları ve piyasa yoğunlaşması için **Rekabet Kurumu**.
- Süt, ambalajlı su, meyve suyu, bitkisel ve zeytinyağı, mobilya için sektör
  dernekleri — **SETBİR, SUDER, MEYED, BYSD, UZZK, MOSDER**.
- Halka açık şirket brüt marjları için **KAP (Kamuyu Aydınlatma Platformu)**.
- **TOBB, İSO ve oda sektör raporlarından** derlenen maliyet kompozisyon ağırlık
  aralıkları, ülkeler arası referans olarak **OECD girdi-çıktı tabloları** ile.

[Kaynak kütüğü](04-source-registry.md), şu anda neyin doğrulanmış olduğunu; her
kurumu, kapsadığı alanı ve yürürlük tarihini listeler.

## 3.3 Taslak-doğrulama hattı

Hiçbir rakam nihai olarak elle girilmez. Veri bir hattan geçer:

1. Otomatik bir adım ya da araştırma rutini, zorunlu bir kaynak, isteğe bağlı bir
   referans URL'si ve bir yürürlük tarihi taşıyan bir **taslak** satır yazar.
2. Taslak, kamuya açık tahmini ya da bu belgeyi etkilemeden önce gözden geçirilir ve
   **doğrulanır**. Yalnızca doğrulanmış satırlar okunur.
3. Bir taslağı onaylamak yeniden dağıtım gerektirmeden yürürlüğe girer; canlı kütük
   değişikliği bir sonraki tazelemede yansıtır.

Bu tek seferlik bir uygulama değil, kalıcı bir kuraldır: her rakam bir kaynak taşır,
ve kaynağı olmayan bir satır yer tutucuyla doldurulmak yerine eksik olarak bildirilir.

## 3.4 Dönemler ve güncellik

Her kaynak bir yürürlük tarihi taşıdığı için, tahmin bir satın almanın döneminde
geçerli olan rakamı seçebilir ve kütük altta yatan verinin ne kadar güncel olduğunu
gösterebilir. Fiyat istatistikleri kurumlar yayınladıkça tazelenir; kütüğün "son
güncelleme"si en son doğrulanmış rakamı yansıtır.
