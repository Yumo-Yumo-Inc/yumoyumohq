# Depolama katmanları

## 1.4 Depolama katmanları

Depolama modeli, veriyi kullanım amacı ve gizlilik sınıfına göre ayırır. Açık doküman, hangi verinin hangi katmanda yaşadığını açıklar.

| Katman | İçerik | Yerleşim | Saklama ilkesi | Gizlilik sınıfı |
|---|---|---|---|---|
| Sıcak kayıt katmanı | Fiş kaydı, satır kalemleri, aşama olayları | Uygulama veritabanı | Aktif ürün penceresi | Takma adlı |
| Analitik katman | Normalize gözlemler ve kalite metrikleri | Ayrı analitik bölüm | Politika tanımlı yuvarlanan pencere | Takma adlı veya anonim |
| Nesne katmanı | Şifreli fiş girdisi ve işlem türevleri | Şifreli nesne deposu | Veri minimizasyon politikası | Kişisel veri içerebilir |
| Anonim toplam katmanı | B2B veri ürünü için toplam çıktı | Ayrı toplam deposu | Sürümlü yayın penceresi | Kullanıcıya geri bağlanmayan |
| Zincir üstü özet | Token olayı, mutabakat taahhüdü, program durumu | Açık zincir | Kalıcı | Token ve taahhüt verisi |

İki kural değişmezdir: ham fiş içeriği zincir dışı veri katmanında işlenir; anonim toplam katmanı kullanıcıdan ayrıştırılmış anahtarlarla çalışır. Saklama süreleri ve fiziksel sağlayıcı seçimi operasyonel politikadır.
