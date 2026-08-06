# Aşama 1 — Belge okuma

## 2.4 Aşama 1 — Belge okuma katmanı

Bu aşama, fiş görselini veya PDF'i kural katmanının doğrulayabileceği metne dönüştürür. Boru hattı **vision-öncelikli** çalışır: görsellerde vision yetenekli bir model fiş fotoğrafını doğrudan okur; yaygın yolda ayrı bir OCR geçişi atlanır. Açık sözleşme, aşamanın normalleştirilmiş çıktısıdır; sağlayıcı adı değildir.

### Görsel yolu — vision-öncelikli

Görsel yüklemelerde, ön-işlemeden geçmiş görsel tek çağrıyla doğrudan vision çıkarım aşamasına (2.5) gider. Vision modeli okuma ve yapılandırılmış alan çıkarımını birlikte yürütür; bu, eşzamanlı yoldan bir sağlayıcı gidiş-dönüşünü tümüyle kaldırır ve çıkarım kalitesini ayrı bir OCR motorunun satır bölütlemesine bağlamaktan kaçınır.

Düz fiş satırlarıyla çalışan sonraki aşamalar (kural katmanı, ürün eşleştirme) yine OCR tarzı girdi alır: okuma sıralı bir satır listesi **vision çıktısından yeniden kurulur**; böylece bu aşamalar, belgenin nasıl okunduğundan bağımsız tek bir girdi biçimini korur.

### PDF yolu — OCR dalı

Dijital faturalar PDF olarak gelir. Bunlarda boru hattı gömülü metni doğrudan çıkarır; belge kullanılabilir bir metin katmanı taşımıyorsa PDF'i görsele çevirip vision yoluna düşer. Klasik metin çıkarım adımının çalıştığı dal budur; görseller bu dalı tümüyle atlar.

### Çıktı normalleştirmesi

Kaynak ne olursa olsun — vision çıktısı, PDF metni veya operatör kaynaklı metin dökümü — okuma sonucu tek bir iç biçime normalleştirilir: tam-metin dizesi artı sıralı bir satır listesi (`lineNo`, `text`). Sonraki aşamalar bu normalleştirilmiş biçimi tüketir; alan çıkarımı hiçbir ham sağlayıcı yanıt biçimine bağlı kalmaz.

### Kalite sinyali

Okuma aşaması sonraki aşamalara kalite sinyalleri ve hata kategorileri taşır. Düşük kalite durumlarında boru hattı yeniden işleme, kullanıcıdan yeni görsel isteme veya operasyonel politikaya göre düşük güvenle devam etme yollarından birini izleyebilir.

Bu yaklaşım açık teknik sözleşmeyi korurken tersine mühendisliğe açık olabilecek eşik ve yedek davranış ayrıntılarını dışarıda tutar.
