# Aşama 0 — Yükleme

## 2.3 Aşama 0 — Yükleme ve ön-işleme

### İstemci tarafı

İstemci görseli yeniden boyutlandırır ve kayıplı sıkıştırma uygular — OCR için yeterli çözünürlüğü korurken tipik telefonlarda yükleme boyutunu düşük tutar. Tam çözünürlük ve kalite hedefleri iç operasyon katmanında yönetilir. EXIF metaverisi yüklemeden önce silinir; coğrafi zenginleştirme yalnız açık kullanıcı rızasıyla başlar.

Kopya tespiti için algısal hash, görsel alındıktan sonra sunucu tarafında hesaplanır (2.3.3).

### Sunucu tarafı

```json
// UploadRequest
{
  "user_id": "uuid",
  "content_type": "image/jpeg",
  "size_bytes": 524288,
  "captured_at": "2026-05-17T14:23:00Z"
}

// UploadResponse
{
  "receipt_id": "uuid",
  "upload_url": "https://...",
  "expires_at": "2026-05-17T14:24:00Z"
}
```

Sunucu üretimde tanımlanmış boyut sınırını doğrular, içerik tipini izinli listeye göre (`image/jpeg`, `image/png`, `application/pdf`) kontrol eder ve kısa ömürlü önceden imzalı bir URL yayınlar. PUT başarıyla tamamlandıktan sonra istemci, Aşama 1'e girmek için `POST /receipts/{id}/process` çağırır.

### Kopya tespiti

Pahalı her işten önce çok-sinyalli bir algısal benzerlik kontrolü çalışır. İki durum ayrılır:

1. **Aynı kullanıcı kopyası** — aynı fişin aynı kullanıcı tarafından tekrar yüklenmesi mevcut kayda çözülür ve boru hattına yeniden girmez. Kazara çift yüklemeyi önler.
2. **Çapraz kullanıcı çakışması** — hesaplar arasında paylaşıldığı görünen fişler güven incelemesine işaretlenir (Aşama 6 düşürür). Bu, anti-tarlama savunmasının parçasıdır.

Aynı-kullanıcı kopyası **yumuşak başarı**dır — kullanıcı önceki sonucu görür. Çapraz-kullanıcı sinyali yine boru hattından geçer; güven puanlayıcı karar verir. Tam benzerlik eşikleri ve sinyalleri üretimde kalibre edilir ve iç operasyon katmanında yönetilir.
