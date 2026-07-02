# Operasyon

## 2.10 Hata işleme ve uç durumlar

Boru hattı, hataları kullanıcıya bakan mesajlardan ve defter etkisinden ayrı değerlendirir. Açık sözleşme, her uç durumun hangi kategoriye düştüğüdür; algılama sinyalleri, eşikler ve tekrar deneme politikaları iç operasyon katmanında yönetilir.

| Kategori | Kullanıcıya etkisi | Defter etkisi |
|---|---|---|
| Girdi kalitesi düşük | Kullanıcıdan daha iyi girdi istenebilir | Ödül muhasebesi ertelenebilir veya düşük güvenle işaretlenir |
| Fiş eksik veya tutarsız | Kullanıcıya doğrulama/yeniden yükleme akışı gösterilir | Kayıt incelemeye veya reddedilmeye gider |
| Kapsam dışı belge tipi | Kullanıcıya belge tipinin desteklenmediği bildirilir | Ödül muhasebesine kabul edilmez |
| Tekrar veya çakışma şüphesi | Kullanıcıya mevcut kayıt gösterilebilir veya sessiz inceleme yapılır | Güven katmanı kararı belirler |
| Eski veya iade fişi | Kullanıcıya uygun statü gösterilir | bINT yerine hafıza/ePoints etkisi oluşabilir |
| Sistem gecikmesi | Kullanıcıya bekleme veya yeniden deneme durumu gösterilir | İş olay kuyruğunda korunur |

## 2.11 Maliyet ve performans

Boru hattı tasarımı, kullanıcıya düşük gecikmeli önizleme döndürmek ve ağır model aşamalarını ölçülebilir sınırlar içinde tutmak üzerine kuruludur. Aşama bazlı maliyet, gecikme bütçesi, sağlayıcı oranları ve yeniden deneme politikaları operasyonel parametredir.

## 2.12 Gözlemlenebilirlik

Her aşama aynı metrik ailelerini üretir: gecikme, başarı oranı, hata kategorisi, kuyruk derinliği ve kalite bandı. Açık dokümanda metrik şekli anlatılır; alarm eşikleri, örnekleme oranları, sağlayıcı etiketleri ve gölge çalıştırma politikası iç operasyon katmanında yönetilir.

## 2.13 Yol haritası

Boru hattı yol haritası üç teknik yönde ilerler: daha fazla yapılandırılmış fatura girdisi, daha güçlü cihaz üstü ön işleme ve toplu yakalama deneyimi. Sağlayıcı değiştirme planları ve kapasite takvimi operasyonel planlama içinde tutulur.
