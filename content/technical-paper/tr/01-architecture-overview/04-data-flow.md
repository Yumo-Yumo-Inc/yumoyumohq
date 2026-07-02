# Veri akışı: fişten bINT'e

## 1.3 Veri akışı: fişten bINT'e

Bir fişin yolculuğu iki fazda işler.

**Faz A — Eşzamanlı (kullanıcı bekliyor):**

1. İstemci görseli sıkıştırır, EXIF'i siler ve önceden imzalı yükleme URL'si ister.
2. Görsel nesne depolamaya iner. Sunucu, algısal-hash tabanlı kopya kontrolüne bakar.
3. OCR katmanı (02 Aşama 1) metni ve sınırlayıcı kutuları çıkarır.
4. LLM yönlendiricisi (02 Aşama 2) yapılandırılmış bir `ReceiptExtraction` JSON çıkarır.
5. Regex/kural katmanı (02 Aşama 3) toplamları mutabık kılar ve tarihleri doğrular.
6. Kanonik eşleştirici (02 Aşama 4) her satırı bir kanonik ürün kimliğine çözer.
7. Satıcı çözümleyici (02 Aşama 5) bir satıcı kimliği iliştirir.
8. Güven puanlayıcı (03) [0, 1] aralığında bir puan üretir ve sistem kullanıcıya doğrulanmış önizlemeyi gösterir.

**Faz B — Eşzamansız (arka plan mutabakatı):**

9. Güven puanı eşiği geçtiyse deftere bir `bINT.pending` satırı yazılır.
10. Mutabakat işçisi saatlik grup bekleyen kredileri toplar, günlük tavanları hesaplar (03) ve Solana'da kullanıcının dondurulmuş ATA'sına bINT basar.
11. İndeksleyici zincir üstü mint olayını alıp zincir dışı deftere geri onaylar.

Kullanıcı Faz A'yı saniyeler içinde görür. Faz B görünmez biçimde sonuçlanır. İki faz arasındaki sözleşme şudur: **zincir üstü mutabakata kadar zincir dışı defter doğruluk kaynağıdır**; mutabakattan sonra zincir üstü durum doğruluk kaynağıdır ve defter hızlı-okuma aynasına döner.

---
