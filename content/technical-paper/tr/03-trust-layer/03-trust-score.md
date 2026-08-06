# Güven puanı

## 3.3 Fiş başına kalite ve kullanıcı başına güven

Güven, birbirine bağlı iki katmanda izlenir. Boru hattından çıkan her fiş bir **kalite değerlendirmesi** alır: katman, çıkarılan kaydın ne kadar eksiksiz olduğunu (işletme, tarih, saat, toplamlar, kalemler) ve fişin tutarlarının kendi içinde mutabık olup olmadığını kontrol eder. Değerlendirme, fiş için bir kalite kademesine çözülür. Bu kademe daha sonra aynı işleme geçişinde eşzamanlı güncellenen **birikimli kullanıcı güven duruşunu** besler: temiz, eksiksiz fiş akışı duruşu zamanla yükseltir; düşük kaliteli veya tutarsız yüklemeler onu yavaşlatır veya geri çevirir. Aşağı akış sistemler duruşu ham değerler yerine kademeler olarak tüketir.

### Sinyal aileleri

Mevcut sürümdeki kalite değerlendirmesi, tekrar tespitiyle (3.9) birlikte **kayıt eksiksizliği** ve **tutar mutabakatından** yararlanır. Aşağıdaki sinyal aileleri modeli genişletir ve **planlanmıştır**; mevcut sürümde aktif değildir:

| Aile (planlanan) | Neyi gözlemler |
|---|---|
| **Boru hattı güveni** | Yukarı akış boru hattının çıkarımdan ne kadar emin olduğu (OCR güveni, LLM güveni, kural katmanı mutabakatı). |
| **İşletme tutarlılığı** | İşletme, şube ve fiş şablonunun bu işletmeden daha önce gördüğümüzle eşleşip eşleşmediği. |
| **Zamansal makullük** | Fişin tarih, saat ve kullanıcının yükleme düzeninin normal davranışla tutarlı olup olmadığı. |
| **Kullanıcı geçmişi** | Yuvarlanan bir pencereye kapsanmış, kullanıcının yakın katkı kalitesi. |

Tam puanlama bileşimi, kademe sınırları ve kademe başına etkiler iç operasyon katmanında yönetilir.

### Kalite kademeleri

Fiş başına değerlendirme, sıralı bir kalite kademesi kümesine çözülür. Yüksek kademeler eksiksiz, kendi içinde tutarlı fişleri yansıtır ve kullanıcının güven duruşunu daha çok güçlendirir; düşük kademeler seyrek veya tutarsız kayıtları yansıtır ve daha az katkı sağlar. Kademe tanımları ve tam etkileri üretimde kalibre edilir ve yayınlanmaz.

## 3.4 Fiş kaydı neyi taşır

Fişin kalite bloğu, değerlendirilen kademeyi ve onu üreten eksiksizlik gözlemlerini kaydeder. Kademe sınırları ve kademe başına etkiler iç güven konfigürasyonunda kalır. Kullanıcıya bakan yüzey **sonucu** (bINT miktarı, ret) ve uygun yerde **neden kategorisini** iletir.

Bu kasıtlıdır: açık sonuçlar netlik sağlarken iç kalibrasyon değerleri kalibrasyon yüzeyini korur.
