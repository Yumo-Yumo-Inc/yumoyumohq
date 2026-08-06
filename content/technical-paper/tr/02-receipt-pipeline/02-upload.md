# Aşama 0 — Yükleme

## 2.3 Aşama 0 — Yükleme ve ön-işleme

### İstemci tarafı

İstemci, yakalanan görseli veya PDF'i multipart POST olarak doğrudan uygulamanın yükleme uç noktasına gönderir. Ön-işleme sunucu sorumluluğudur: istemciyi ince tutmak, görsel işleme kodunu her platforma taşımadan tüm yakalama yüzeylerinin aynı normalizasyondan yararlanmasını sağlar.

### Sunucu tarafı

Yükleme rotası, herhangi bir depolama işinden önce isteği doğrular:

- **Boyut sınırı** — yükleme boyutu üretimde tanımlanmış bir sınıra göre kontrol edilir.
- **Magic-byte kontrolü** — sunucu, istemcinin bildirdiği `Content-Type` ne olursa olsun, tamponun ilk baytlarını inceleyerek yükün gerçekten bir raster görsel (`JPEG`, `PNG`, `WEBP`, `HEIC` ve desteklenen diğer biçimler) veya PDF olduğunu teyit eder. Bu, `image/*` tipi altında kaçırılmaya çalışılan betik veya işaretleme kodunu engeller.

Kabul edilen yüklemeler ardından `sharp` ile sunucu tarafı ön-işlemeden geçer:

- **Yönlendirme** — EXIF tabanlı otomatik döndürme; fiş, okuma aşamasından önce dik konuma getirilir.
- **Sıkıştırma** — görsel, vision aşamasına göre ayarlanmış bir boyut ve kalite profiliyle yeniden kodlanır.
- **Depolama** — işlenmiş görsel Vercel Blob nesne depolamasına yazılır; Blob depolama erişilemezse veritabanı yedek yolu devreye girer. Depolanan görseller saklama politikasına göre silinmek üzere zamanlanır.

Yanıt bir `receipt_id` ve depolanan görsel referansını döndürür. İstemci ardından Aşama 1'e girmek için `POST /api/receipt/analyze` çağırır.

### Kopya tespiti

Pahalı herhangi bir iş başlamadan önce birebir dosya-hash kontrolü çalışır: yüklenen baytların SHA-256'sı daha önce depolanan fişlerle karşılaştırılır. Algısal benzerlik kontrolü bilinçli olarak içerik çıkarımından sonraya ertelenir; orada bir içerik hash'iyle çapraz kontrol edilebilir. Görsel karşılaştırmayı erken çalıştırmak, birebir kontrolün zaten çözdüğü yüklemelere emek harcamak olurdu.

İki kopya durumu da yüklemeyi kopya hatasıyla reddeder:

1. **Aynı kullanıcı kopyası** — kullanıcıya bu fişi zaten yüklediği söylenir. Bu, kazara çift yüklemeyi ve tekrar-ödül denemelerini önler.
2. **Çapraz kullanıcı çakışması** — kullanıcıya fişin başka bir hesap tarafından yüklendiği söylenir. Bu, anti-tarlama savunmasının parçasıdır.

Tam benzerlik sinyalleri üretimde kalibre edilir ve iç operasyon katmanında yönetilir.

---
