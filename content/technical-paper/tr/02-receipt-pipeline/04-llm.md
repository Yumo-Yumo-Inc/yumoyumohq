# Aşama 2 — Yapılandırılmış çıkarım

## 2.5 Aşama 2 — Yapılandırılmış çıkarım

Bu aşama belgeyi yapılandırılmış fiş alanlarına dönüştürür. Açık sözleşme, alan kümesi ve aşama davranışıdır; model sağlayıcıları, istem metni, yönlendirme politikası, token bütçeleri ve yeniden deneme koşulları iç operasyon katmanında yönetilir.

### Model yönlendirme sınırı

Yumo Yumo yapılandırılmış çıkarımı modelden bağımsız bir arayüz arkasında çalıştırır. Operasyonel politika; dile, belge karmaşıklığına, sağlık durumuna ve kalite sinyallerine göre uygun motoru seçebilir. Bu politikanın sıralaması ve yedek davranışı gizli kalır.

### Yapılandırılmış çıktı — etiketli düz metin

Model, JSON nesnesi yerine **etiketli düz metin alanları** döndürür; her satır tek bir alandır. Dil modellerinden JSON çıktısı kendine özgü bir parse-hatası sınıfı doğurur — kaçırılmamış kontrol karakterleri, kapatılmamış parantezler, fazladan virgüller — ve tek bir bozuk karakter tüm yanıtı geçersiz kılar. Etiketli satırlar zarifçe bozulur: eksik ya da bozuk bir satır tek bir alanı boş bırakırken diğer tüm alanlar parse edilmeye devam eder.

Başlık alanları ayraçlı bir blok içinde gelir:

```
document_type: receipt
merchant_legal_name: MIGROS TICARET A.S.
merchant_display_name: MIGROS
receipt_date: 2026-05-17
currency: TRY
total_paid: 276.71
total_vat: 42.21
payment_method: visa
...
```

Kalemler, sabit kolon sıralı **pipe ile ayrılmış bir tablo** olarak gelir:

```
LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | SUT 1L | PINAR | 2 | adet | 23.50 | 47.00 | 0.01
2 | ...
```

Alan kümesi; satıcı kimliğini (yasal ad, görünen ad, tanınan marka, vergi kimliği, adres parçaları), belge üstverisini (tip, tarih, saat, fiş numarası, ülke, para birimi), toplamları ve vergiyi, ödeme yöntemi ile ödeme kanıtını ve kalem tablosunu kapsar.

### Defansif parse

Parser her alanı bağımsız ele alır: eksik alan `null` olur, bozuk değer `null` olur, bozuk bir kalem satırı loglanır ve atlanır. Parse asla exception fırlatmaz — boru hattı kurtarılabilen alanlarla devam eder ve kural katmanı (2.6) toplamları, tarihi, para birimini, kalemleri ve vergi alanlarını fiş metnine karşı doğrular.

### Tutarlılık ele alımı

Çıkarım düşük bir kalite sinyali taşıyorsa veya kural katmanı tutarsızlık bulursa, boru hattı sonucu incelemeye veya yeniden işlemeye gönderebilir. Yol seçimi operasyonel parametrelerle yönetilir.
