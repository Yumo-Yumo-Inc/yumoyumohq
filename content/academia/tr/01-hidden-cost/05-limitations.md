# Sınırlar & dürüstlük

Bir yöntem, ancak zayıf olduğu yerler konusunda açıksa güvenilirdir. Bu bölüm gizli
maliyet tahmininin bilinen sınırlarını ortaya koyar ve kaynaklı bir rakam ile bir
mühendislik parametresi arasındaki çizgiyi çeker.

## 5.1 Tahminin zayıf olduğu yerler

- **Tek satın almalar.** Tahmin modellenmiş bir referanstır, ölçülmüş bir maliyet
  değil. Tek bir fişteki tek bir satır için yönseldir; değeri toplamda ve zaman
  içinde, ürüne özgü tuhaflıklar ortalamada kaybolduğunda ortaya çıkar.
- **İnce kategoriler.** Bazı kategorilerin yayınlanmış istatistikleri ötekilerden daha
  zengindir. Bir kategorinin maliyet kompozisyonu ya da fiyat referansı seyrek
  olduğunda, tahmin daha kabadır ve kesin bir model yerine yedek model kullanılır.
- **İthal ve hızlı değişen ürünler.** İthal maliyetinin baskın olduğu ya da fiyatı
  hızla değişen ürünlerde referans dönemi büyük önem taşır; tahmin en çok taze bir
  istatistik yayımına yakınken güvenilirdir.

## 5.2 Bilinen bir boşluk

En çok hacme sahip kategori olan günlük market, şu anda tam dış kaynaklı bir referans
yerine bir iç maliyet kompozisyon tahminine dayanır. [Kaynak
kütüğünde](04-source-registry.md) doğrulanmamış olarak işaretlidir: hesaplamayı
beslemeye devam eder, ama dış kaynaklı olarak sunulmaz ve bir dış referans atanana
kadar kamuya açık kaynak listesinden dışlanır. Dürüst durum budur — boşluk gösterilir,
doldurulmaz.

## 5.3 Kaynaklı rakamlar ile mühendislik parametreleri

Bu belge net bir çizgi çeker:

- **Kaynaklı rakamlar** — ortalama fiyatlar, vergi oranları, üretici farkları, maliyet
  kompozisyon ağırlıkları — yürürlük tarihleri olan adlı kurumlardan gelir ve kütükte
  listelenir.
- **Mühendislik parametreleri** — modelleri işleten eşikler, harmanlama oranları,
  referans marj ve yönlendirme kesme noktaları — üretimde kalibre edilir. Bunlar
  araştırma bulguları değildir ve belge onları öyle sunmaz. Yayınlanmazlar; çünkü tam
  kalibrasyonu yayınlamak, yöntemin şeffaflığına bir şey katmadan operasyonel ayrıntıyı
  açığa çıkarır.

Mekanizma tümüyle anlatılır; ayarlar üretimde yapılır. Bu sınır bilinçlidir ve
Yumo Yumo'nun teknik yazımı boyunca uygulanan aynı sınırdır.

## 5.4 Sınırlar nasıl küçülür

Her sınırın iyileşme yolu vardır: ince bir kategori, kaynaklı bir maliyet kompozisyonu
eklendiğinde kesinlik kazanır; market boşluğu, bir dış referans doğrulandığında
kapanır; dönem duyarlılığı, istatistikler planlı şekilde tazelendikçe hafifler.
Taslak-doğrulama hattı, bu iyileşmelerin yeniden dağıtım olmadan tahmine ulaşma
mekanizmasıdır.
