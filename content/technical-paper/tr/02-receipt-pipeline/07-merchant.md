# Aşama 5 — Satıcı

## 2.8 Aşama 5 — Satıcı çözümlemesi

Her fiş bir `merchant_id`'ye eşlenir. Parmak izi ağırlıklı çok-sinyalli bir modeldir. Sinyaller arasında vergi numarası, normalleştirilmiş satıcı adı, adres parçası ve fiş şablonu parmak izi yer alır. Sinyal kümesi ve ağırlıkları iç operasyon katmanında yönetilir.

### Zincir eşleştirme

Bilinen bir zincire (BIM, A101, Migros, ŞOK) çözülen satıcı bir `chain_id` alır. Zincirler iki işlevi yönetir:

- B2B veri ürünü için **şubeler arası toplama** ("Migros ülke genelinde" sepet fiyatları).
- **Coğrafi zenginleştirme** — kullanıcı onayladığında, şube adresi satıcı ana tablosundan şehir/bölge ile zenginleştirilir.

### Coğrafi zenginleştirme (rıza-içi)

Kullanıcı konum paylaşımını etkinleştirdiyse fiş çözülen şehir/bölge ile etiketlenir. Sistem şehir seviyesinde coğrafya kullanır. Bu, 08'deki gizlilik taahhüdünü ve B2B veri ürününün 05'teki k-anonimlik gereksinimini karşılar.

### Bilinmeyen satıcı

Hiçbir parmak izi eşleşmiyorsa fiş `merchant_id = null` ile yazılır ve `merchant_raw_name` korunur. Güven puanlayıcı (03) bilinmeyen satıcıyı hafif negatif sinyal olarak ele alır. Satıcı kuyruğu, kanoniklik kuyruğuyla aynı şekilde boşaltılır.
