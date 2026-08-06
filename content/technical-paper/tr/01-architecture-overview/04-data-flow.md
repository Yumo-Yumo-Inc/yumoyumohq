# Veri akışı: fişten bINT'e

## 1.3 Veri akışı: fişten bINT'e

Bir fişin yolculuğu iki fazda işler.

**Faz A — Eşzamanlı (kullanıcı bekliyor):**

1. İstemci dosyayı yükleme uç noktasına gönderir. Sunucu görseli sıkıştırır, EXIF üstverisini siler ve sonucu nesne depolamaya yazar. Analizden önce algısal-hash tabanlı kopya indeksi kontrol edilir.
2. Görsel girdide vision LLM (02 Aşama 2) fişi tek çağrıda doğrudan görselden okur. PDF girdide önce bir OCR katmanı (02 Aşama 1) metni çıkarır; bu metin aynı LLM aşamasını besler.
3. LLM **etiketli düz metin** döndürür: satıcı, tarih, toplamlar ve ödeme alanları için `FIELD: value` satırlarından oluşan bir blok, kalemler için pipe ile ayrılmış bir tablo. Parse defansiftir — eksik ya da bozuk bir satır o alanı `null` bırakır ve boru hattı devam eder.
4. Regex/kural katmanı (02 Aşama 3) toplamları mutabık kılar ve tarihleri doğrular.
5. Satıcı çözümleyici (02 Aşama 5) bir satıcı kimliği iliştirir.
6. Güven katmanı (03) fişin kalitesini sınıflandırır ve ödül aynı istek içinde hesaplanır; kullanıcı doğrulanmış önizlemeyi ve ödülü birlikte görür.

**Faz B — Eşzamansız (arka plan mutabakatı):**

7. Arka plandaki post-process işçisi, her kalemi veritabanı tarafında bulanık eşleştirme ve LLM yedeğiyle bir kanonik ürün kimliğine çözer (02 Aşama 4) ve fişin kalite sınıflandırmasını kullanıcının kümülatif güven puanına katar.
8. Mutabakat işçisi uygun bINT kredilerini toplar, günlük tavanları uygular ve karşılık gelen INT talepleri için bir epoch dağıtım kökü üretir.
9. Dağıtım kökü zincire taahhüt edilir. İndeksleyici, dağıtıcıdan yapılan INT talep transferlerini zincir dışı deftere geri onaylar.

Kullanıcı Faz A'yı saniyeler içinde görür. Faz B eşzamansız olarak sonuçlanır. Zincir dışı bINT defteri katkı kredileri için doğruluk kaynağı olarak kalır; zincir üstü kök ve talep transferleri, karşılık gelen INT dağıtımını kayda geçirir.

---
