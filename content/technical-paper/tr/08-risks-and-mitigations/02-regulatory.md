# Düzenleyici risk

## 8.2 Yüzey

Yumo Yumo, veri ürünü, kullanıcı katkısı ve token ekonomisi nedeniyle birden fazla düzenleyici çerçevenin kesişiminde çalışır. Her çerçeve ayrı bir teknik yüzeye dokunur:

| Çerçeve | Teknik yüzey | Açık kontrol ilkesi |
|---|---|---|
| KVKK | Türkiye'deki kullanıcı kimliği, fiş içeriği, işleyici envanteri | Veri minimizasyonu ve hukuki süreç kaydı |
| GDPR | AB / AEA kullanıcı verisi ve toplam veri ürünü | Kullanıcı hakkı süreçleri ve toplam yayın disiplini |
| MiCA | INT'nin AB içindeki kripto-varlık sınıflandırması | Bölgesel kayıt ve hukuk danışmanlığı |
| ABD token sınıflandırması | INT'nin kullanım token'ı tasarımı ve dağıtım modeli | Katkı temelli emisyon, açık hak ediş ve kullanım odaklı konumlandırma |
| Vergi sınıflandırması | Kullanıcı ödülleri, kurumsal gelir, KDV / satış vergisi | Bölge bazlı muhasebe ve raporlama süreci |

Bu çerçeveler farklı bölgelerde aynı teknik mekanizmaya farklı uyum görevleri yükleyebilir. Technical paper, bu sonuçları taşıyabilecek mimari yüzeyi tanımlar.

## 8.3 Kontrol modeli

**Veri minimizasyonu.** Fiş içeriği zincir dışı veri katmanında tutulur (04 §4.16). Zincir üstü katman bINT mint olayları, INT mutabakatları ve özet taahhütleri taşır. Kullanıcı harcama geçmişi açık zincir verisine dönüşmeden bütünlük kanıtı üretir.

**Toplam yayın politikası.** B2B veri ürünü, k-anonimlik ve toplam yayın kurallarıyla çalışır (05 §5.8). Yayınlanan veri, bireysel fiş yerine bölge / dönem / kategori düzeyinde toplam sinyal üretir.

**Kurumsal yapı.** Yumo Yumo Inc. Delaware şirketidir (00 §0.1). Bölgesel kayıt, temsilcilik ve servis sağlayıcı ilişkileri hukuk danışmanlığı ve ürün yayılım planıyla birlikte yürütülür.

**Token sınıflandırma duruşu.** INT ekonomik tasarımı kullanım ve katkı mekaniği etrafında kurulur: emisyon ölçülen katkıya bağlanır (4.3), staking ödülleri açık havuzlardan gelir (4.6), BBB operasyon geliriyle finanse edilir (4.9).

## 8.4 Evrim

Aşamalı yerelleşme ilerledikçe uyum sorumlulukları da yetki taşıma planına bağlanır (00 §0.2, 04 §4.10). Kurumsal yapı, veri saklama sorumluluğu ve token servis rolleri aynı mimari altında farklı bölgesel yapılara taşınabilecek şekilde tasarlanır.
