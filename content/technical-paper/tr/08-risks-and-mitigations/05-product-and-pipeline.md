# Ürün ve boru hattı riski

## 8.11 Yüzey

Fiş işleme boru hattı (02) protokolün veri giriş yüzeyidir. Risk, belge okuma kalitesi, yapılandırılmış çıkarım, kural katmanı ve kayıt yazımı etrafında toplanır.

| Yüzey | Teknik etki | Public kontrol ilkesi |
|---|---|---|
| Belge okuma sürekliliği | Fiş işleme gecikir veya kuyruğa alınır | Sağlayıcıdan bağımsız adaptör ve durum görünürlüğü |
| Çıktı kalitesi | OCR / LLM çıktısı şema ile çelişebilir | Kurallı doğrulama ve kanonik eşleştirme |
| Birim maliyet | İşleme maliyeti veri ürünü marjını etkiler | Operasyonel maliyet takibi ve ekonomik model bağlantısı |
| İstismar denemesi | Sahte, tekrar veya manipüle edilmiş fişler katkı rayını zorlar | Güven katmanı geri beslemesi ve karar durumu |

## 8.12 Kontrol modeli

Boru hattı tasarımı belge işleme sağlayıcısından bağımsız bir arayüzle çalışır. OCR ve LLM çıktıları kanonik şemaya alınır; kural katmanı alan tutarlılığı, satıcı eşleşmesi, tarih-miktar makullüğü ve tekrar sinyallerini kontrol eder (02 §2.5-§2.7).

Belirsiz fişler güven katmanına ve inceleme akışına bağlanır. Kullanıcıya görünen durum modeli, fişin hangi aşamada olduğunu ve ödül kararının hangi raydan geçtiğini gösterir (02 §2.9).

Sağlayıcı seçimi, yönlendirme sırası, eşikler ve hız sınırı değerleri iç operasyon katmanında yönetilir. Açık teknik belge, bu uygulamanın teknik kontratını verir: normalize edilmiş fiş kaydı, güven skoru girişi ve bINT defter çıktısı.

## 8.13 Evrim

Boru hattı olgunlaştıkça kural setleri, kanonik ürün kapsamı ve kalite izleme sinyalleri sürümlü olarak genişler. Yerelleşme planı ilerledikçe boru hattı konfigürasyonu, hazine ve yetki taşıma modeliyle aynı yönetim disiplinine bağlanır.
