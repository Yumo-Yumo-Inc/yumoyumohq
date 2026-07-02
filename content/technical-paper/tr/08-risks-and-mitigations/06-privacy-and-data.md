# Gizlilik ve veri riski

## 8.14 Yüzey

Yumo Yumo iki veri sınıfıyla çalışır: kullanıcı verisi ve aggregate veri. Kullanıcı verisi fiş içeriği, harcama geçmişi ve güven sinyallerini kapsar. Aggregate veri, B2B veri ürününe giren fiyat ve sepet kompozisyonu sinyalleridir.

| Yüzey | Teknik etki | Açık kontrol ilkesi |
|---|---|---|
| Kullanıcı verisi açığa çıkması | Tanımlanabilir fiş içeriği hedeflenir | Zincir dışı içerik ve şifreli saklama |
| Yeniden tanımlama | Aggregate veri bireysel fiş veya kullanıcıyla eşleşebilir | k-anonimlik ve yayın grubu disiplini |
| Hukuki veri talebi | Yetkili makam belirli kullanıcı verisi ister | Yayınlanmış gizlilik politikası ve süreç kaydı |
| İdari erişim | Operasyon ekibi veri işleme görevlerini yürütür | Görev kapsamlı erişim ve denetim izi |

## 8.15 Kontrol modeli

**Zincir dışı fiş içeriği.** Fiş satır kalemleri zincir dışı defterde tutulur (04 §4.16). Zincir üstü katman bINT mint olaylarını ve Merkle kök taahhütlerini taşır; içerik veri katmanında işlenir.

**Aggregate yayın disiplini.** B2B veri ürünü, k-anonimlik ve yayın grubu kurallarıyla çalışır (05 §5.8). Yayın grupları bölge, kategori ve dönem düzeyinde yeterli yoğunluğa ulaşan kümelerden oluşur.

**Görev kapsamlı erişim.** Belge işleme çalışanları ve idari araçlar, ilgili iş için gerekli veri kapsamıyla çalışır. Saklama, erişim ve silme süreçleri gizlilik politikası ve operasyonel güvenlik süreciyle bağlanır.

**Denetim izi.** İdari erişim kayıtları dış denetim ve iç kontrol turları için tutulur. Hukuki veri talepleri yayınlanan gizlilik politikası çerçevesinde işlenir.

## 8.16 Evrim

Veri saklama sorumluluğu, aşamalı yerelleşme ve bölgesel yapı kararlarıyla birlikte gelişir. Mimari hedef aynı kalır: kullanıcı fiş içeriği zincir dışı kalır, aggregate veri ürünleşir, bütünlük kanıtı zincir üstü taahhütle sağlanır.
