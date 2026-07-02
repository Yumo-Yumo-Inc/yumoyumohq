# Güven puanı

## 3.3 Fiş başına güven puanı

Bir fiş için güven puanı, sinyallerin ağırlıklı birleşiminden türetilen `[0, 1]` aralığında bir sayıdır. Yüksek olan iyidir. Puan, fiş kaydına (bkz. 05 §5.3) katkıda bulunan sinyallerin listesiyle birlikte yazılır.

### Sinyal aileleri

Puan dört sinyal ailesinden yararlanır. Her aile bir veya daha fazla bireysel sinyal üretir; katman bunları nihai puana harmanlar.

| Aile | Neyi gözlemler |
|---|---|
| **Boru hattı güveni** | Yukarı akış boru hattının çıkarımdan ne kadar emin olduğu (OCR güveni, LLM güveni, kural katmanı mutabakatı). |
| **Satıcı tutarlılığı** | Satıcı, şube ve fiş şablonunun bu satıcıdan daha önce gördüğümüzle eşleşip eşleşmediği. |
| **Zamansal makullük** | Fişin tarih, saat ve kullanıcının yükleme düzeninin normal davranışla tutarlı olup olmadığı. |
| **Kullanıcı geçmişi** | Yuvarlanan bir pencereye kapsanmış kullanıcının yakın katkı kalitesi. |

Her aile içinde bireysel sinyaller gözlemlenen değer ve katkı bayrağı (`signal_used` / `signal_skipped`) ile kaydedilir. Tam ağırlıklandırma, aile eşikleri ve atlama kuralları iç operasyon katmanında yönetilir.

### Puan bantları

Nihai puan, aşağı akış kullanımı için bantlara bölünür:

- **Yüksek** — fiş tam bINT kredisi için geçer.
- **Orta** — fiş azaltılmış bINT kredisi için geçer. Kullanıcı doğrulanmış önizlemeyi ve bINT miktarını görür; akış doğrudan tamamlanır.
- **Düşük** — fiş incelemeye tutulur (bkz. 3.7). Kullanıcıya kontrol edildiği söylenir.
- **Ret** — fiş reddedilen duruma girer. Kullanıcı sade dille bir neden kategorisi görür.

Bant sınırları periyodik olarak gözlemlenen sonuçlara karşı kalibre edilir ve iç operasyon katmanında yönetilir.

## 3.4 Fiş kaydı neyi taşır

Fişin güven bloğu, katkıda bulunan sinyal ailelerini ve sonuç bandını listeler. Bireysel sinyal değerleri, ağırlıklar ve puan iç güven konfigürasyonunda kalır. Kullanıcıya bakan yüzey **sonucu** (bINT miktarı, tut, ret) ve uygun yerde **neden kategorisini** iletir.

Bu kasıtlıdır: açık bantlar kullanıcıya sonuç netliği sağlarken iç puanlar kalibrasyon yüzeyini korur.
