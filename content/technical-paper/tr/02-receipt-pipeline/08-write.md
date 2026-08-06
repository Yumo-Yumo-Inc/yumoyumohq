# Aşama 6 — Yazım

## 2.9 Aşama 6 — Çıktı yazımı

Yazım, eşzamanlı akış ile arka plandaki son-işlem işçisi arasında bölünmüştür.

**Eşzamanlı yazım.** Fiş doğrulamayı geçtiğinde, eşzamanlı akış `receipts` satırını ham görsel-çıkarım kaydıyla birlikte ekler. Doğrulanmış önizleme bu durumdan sunulur: önizleme göründüğü anda kullanıcının fişi veritabanında vardır.

**Eşzamansız yazım.** Ardından arka plandaki son-işlem işçisi kaydı tamamlar:

- `receipt_line_items` — kalemler, kanonik ürün çözümlemesinden (2.7) sonra yazılır; böylece her satır kanonik referansını taşır.
- `receipt_rewards` — kullanıcıya gösterilen puan dökümü dahil ödül muhasebe kaydı.
- `receipt_quality` — güven katmanının (03) okuduğu kalite değerlendirmesi.

**Fiyat gözlemleri.** Fiyat gözlemleri, doğrulanmış fişleri okuyan, gözlemleri epoch başına toplayan ve epoch kökünü eşzamansız katmanda zincire taahhüt eden ayrı bir günlük fiyat-epoch akışı tarafından üretilir (01 Faz B). Fiş satırlarından türetilirler; fiş işleme hattının kendisi tarafından yazılmazlar.

Aşağı akış işleri — güven puanlama, ödül mutabakatı, fiyat defteri — fiş ve kalite satırlarını doğrudan okur. Yazımlar fiş tanımlayıcısı üzerinde idempotenttir: işçi tekrar denerse oynatma güvenli.

---
