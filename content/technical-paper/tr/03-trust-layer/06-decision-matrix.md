# Karar matrisi

## 3.11 Puandan sonuca

Bir fişin güven bandı ve kullanıcının mevcut sağlık anlık görüntüsü olduktan sonra, katman fişi dört sonuçtan birine yönlendirir.

| Sonuç | Kullanıcının gördüğü | Defterin kaydettiği |
|---|---|---|
| **Kabul — tam kredi** | Doğrulanmış önizleme + bu fiş ve bu kullanıcı için tam bINT miktarı. | `receipt.status = "verified"`, tam kredi, sinyal aileleri listelendi. |
| **Kabul — azaltılmış kredi** | Doğrulanmış önizleme + daha küçük bir bINT miktarı. Akış doğrudan tamamlanır. | `receipt.status = "verified"`, kısmi kredi, düşürme neden kategorisi. |
| **İnceleme için tut** | "Bunu kontrol ediyoruz. Sonuç genellikle bir gün içinde gelir." | `receipt.status = "under_review"`, itiraz iş akışında kuyrukta (3.12). |
| **Ret** | Açık, sade dille mesaj. | `receipt.status = "rejected"`, ret neden kategorisi. |

Dördüncü sonuç, dürüst fiş aralığının dışında kalan durumlar için ayrılır — örn. sentetik medya özgünlük kontrollerine takılan bir görsel, el yazısı bir belge veya çatışan kanıtla farklı bir kullanıcıya kredilendirilmiş bir fişin kopyası.

## 3.12 İtiraz kuyruğu

İncelemeye tutulan bir fiş, operasyonel zaman hedefiyle kuyruğa girer. İnceleyen (başlangıçta operasyon ekibi, sonra Proof of Contribution kazanan topluluk havuzu) şunları görür:

- Fiş görseli ve çıkarılan kayıt.
- Bant ve katkıda bulunan sinyal ailelerinin listesi.
- Kullanıcının yakın geçmişine bir bakış.
- Üç eylem: **tam onayla**, **azaltılmış onayla**, **reddi onayla**.

İnceleyen, puanın kendisi yerine fiş bloğunun kaydettiği sinyal aileleriyle çalışır. Bu, inceleyeni katmanın tasarımıyla hizalı tutar ve paralel kural seti oluşumunu azaltır.

İnceleyen katmanın önerisini bozarsa, geçersiz kılma kaydedilir ve bir sonraki kalibrasyon döngüsüne katkıda bulunur.

## 3.13 Kullanıcının yapabileceği

Ret alan bir kullanıcı kategori seviyesi bir açıklama görür ve uygun olduğunda kendi kendine servis bir yol izler: fişi daha iyi ışıkla yeniden çek, ödeme onayı ile destek ile iletişime geç veya reddi kabul et. Sinyal seviyesi gerekçeler güven konfigürasyonunda kalır; bu, sinyal setinin protokol dışından modellenmesini zorlaştırır.

Sağlığı sıkışmış bir kullanıcı, temiz fişler katkı vererek toparlayabilir. Toparlanma kasıtlı olarak kademelidir; sistem ani patlamalar yerine sürdürülen iyi davranışı ödüllendirir.
