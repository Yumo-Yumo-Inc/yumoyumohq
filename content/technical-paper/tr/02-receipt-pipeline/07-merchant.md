# Aşama 5 — Satıcı

## 2.8 Aşama 5 — Satıcı çözümlemesi

Her fiş bir `merchant_id`'ye eşlenir. Satıcı çözümlemesi **eşzamanlı akışta** koşar; böylece doğrulanmış önizleme çözülmüş satıcıyı zaten taşır. Çözümleme katmanlı bir öncelik kaskadıdır — her katman, yalnızca önceki katman eşleşme üretmediğinde koşar:

1. **Vergi kimliği** — fişte basılı vergi numarası (Türkiye'de VKN) kontrol hanesi algoritmasıyla doğrulanır ve satıcı ana tablosunda aranır. Geçerli bir vergi numarası doğrudan kimlik eşleşmesidir.
2. **Tanınan marka** — çıkarım aşaması bilinen bir zincir markasını tanıdığında, resmî marka yazımı doğrudan zincir satıcısına çözülür.
3. **Desen çapaları** — satıcı başına öğrenilmiş metin desenleri, karşılaştırmadan önce selamlama önekleri kırpılarak normalleştirilmiş satıcı adıyla eşleştirilir.
4. **Konum** — ad kanıtı tek başına belirsiz kaldığında adres sinyalleri adayları daraltır.
5. **Bulanık eşleşme** — mevcut satıcı adaylarına karşı normalleştirilmiş ad benzerliği.
6. **Otomatik oluşturma** — hiçbir katman eşleşmediğinde, hız sınırlı bir yol yeni bir satıcı kaydı oluşturur; kayıt doğrulama kuyruğuna girer.

Kaskadın benzerlik ayarları iç operasyon katmanında yönetilir.

### Zincir eşleştirme

Bilinen bir zincire (BIM, A101, Migros, ŞOK) çözülen satıcı bir `chain_id` alır. Zincirler iki işlevi yönetir:

- B2B veri ürünü için **şubeler arası toplama** ("Migros ülke genelinde" sepet fiyatları).
- **Coğrafi zenginleştirme** — kullanıcı onayladığında, şube adresi satıcı ana tablosundan şehir/bölge ile zenginleştirilir.

### Coğrafi zenginleştirme (rıza-içi)

Kullanıcı konum paylaşımını etkinleştirdiyse fiş çözülen şehir/bölge ile etiketlenir. Sistem şehir seviyesinde coğrafya kullanır. Bu, 08'deki gizlilik taahhüdünü ve B2B veri ürününün 05'teki k-anonimlik gereksinimini karşılar.

### Bilinmeyen satıcı

Hiçbir katman çözüm üretmez ve otomatik oluşturma da devreye girmezse fiş `merchant_id = null` ile yazılır ve `merchant_raw_name` korunur. Güven puanlayıcı (03) bilinmeyen satıcıyı hafif negatif sinyal olarak ele alır. Eşleşmeyen satıcılar yönetici doğrulama kuyruğu üzerinden incelenir.

---
