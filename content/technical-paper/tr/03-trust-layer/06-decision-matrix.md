# Karar matrisi

## 3.11 Puandan sonuca

Bir fişin kalite değerlendirmesi tamamlanıp kullanıcının sağlık duruşu güncel olduktan sonra, katman fişi bir sonuca yönlendirir.

Mevcut sürümde aktif:

| Sonuç | Kullanıcının gördüğü | Defterin kaydettiği |
|---|---|---|
| **Kabul — tam kredi** | Doğrulanmış önizleme + bu fiş ve bu kullanıcı için tam bINT miktarı. | `receipt.status = "verified"`, tam kredi, kalite kademesi kaydedildi. |
| **Kabul — azaltılmış kredi** | Doğrulanmış önizleme + daha küçük bir bINT miktarı. Sürtünme yok. | `receipt.status = "verified"`, kısmi kredi, düşürme neden kategorisi. |
| **Ret** | Açık, sade dille mesaj ve 0 bINT. | `receipt.status = "rejected"`, ret neden kategorisi. |

Planlanan, mevcut sürümde aktif değil:

| Sonuç (planlanan) | Kullanıcının gördüğü | Defterin kaydettiği |
|---|---|---|
| **İnceleme için tut** | "Bunu kontrol ediyoruz. Sonuç genellikle bir gün içinde gelir." | Ayrı bir inceleme durumu, itiraz iş akışında kuyrukta (3.12). |

Ret sonucu, dürüst fiş makullük bandının dışında kalan durumlar için ayrılır — örn. sentetik medya özgünlük kontrollerine takılan bir görsel, el yazısı bir belge veya çatışan kanıtla farklı bir kullanıcıya zaten kredilendirilmiş bir fişin kopyası.

## 3.12 İtiraz kuyruğu (planlanan)

İtiraz kuyruğu planlanan bir mekanizmadır; mevcut sürüm her fişi otomatik olarak sonuçlandırır. Planlanan tasarımda, incelemeye tutulan bir fiş operasyonel zaman hedefiyle kuyruğa girer. İnceleyen (başlangıçta operasyon ekibi, sonra Proof of Contribution kazanan topluluk havuzu) şunları görür:

- Fiş görseli ve çıkarılan kayıt.
- Bant ve katkıda bulunan sinyal ailelerinin listesi.
- Kullanıcının yakın geçmişine bir bakış.
- Üç eylem: **tam onayla**, **azaltılmış onayla**, **reddi onayla**.

İnceleyen, fiş bloğunun kaydettiği aynı sinyal ailelerini görür. Bu, inceleyeni katmanın tasarımıyla hizalı tutar ve tutarlı kararları destekler.

İnceleyen katmanın önerisini bozarsa, geçersiz kılma kaydedilir ve bir sonraki kalibrasyon döngüsüne katkıda bulunur.

## 3.13 Kullanıcının yapabileceği

Fişi reddedilen bir kullanıcı kategori seviyesinde bir açıklama görür ve uygun olduğunda kendi kendine servis bir yol izler: fişi daha iyi ışıkla yeniden çek, ödeme onayı ile destekle iletişime geç veya reddi kabul et. Sinyal seviyesi gerekçeler iç güven konfigürasyonunda kalır.

Sağlık puanı yuvarlanan sinyallerden hesaplanır. Sonraki kabul edilmiş fişler puanı yapılandırılmış kurallara göre etkiler; puan tek bir olayla aniden sıfırlanmaz.
