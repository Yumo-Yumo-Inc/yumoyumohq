# Tasarım hedefleri

## 3.1 Güven katmanının hedefleri

Güven katmanı, birbirine gerilimde olan dört özelliği optimize eder.

| Hedef | Anlamı | Niçin önemli |
|---|---|---|
| **Dürüst fişler hızlı geçer** | Gerçek bir hane fişi, doğrulanmış önizlemeyi üreten istek içinde tam bINT ile katmandan geçer. | Elde tutma. Dürüst kullanıcılar protokolün kütlesidir; buradaki sürtünme MAU'yu düşürür. |
| **Ödül kalitesi korunur** | Koordineli çoklu hesap tarlama, tekrarlı fişler ve sentetik görseller azaltma, inceleme veya ret akışına yönlenir. | Ekonomik güvenlik. İstismarcı yüklemeden basılan her bINT, her dürüst kullanıcının değerini aşındırır. |
| **Sınır durumlar ikinci kez bakılır** | Olağandışı ama makul görünen fişler inceleme kuyruğuna girer. | Yanlış pozitif maliyeti. Gerçek bir fişi incelemek kullanıcı güvenini korur. |
| **Kullanıcı kontrolde hisseder** | Bir fişin neden düşürüldüğünü veya tutulduğunu ve ne yapacağını kullanıcı görür. | Güven. Açıklamalı karar katkı döngüsünü korur. |

Bu dört hedef arasında doğal gerilim vardır. Katman, bunları sabit kurallar yerine kalibre edilmiş bir puanlama modeliyle dengeler; model gözlemlenen sonuçlara göre yeniden ayarlanır.

## 3.2 Güven nereye iliştirilir

Güven puanlaması iki ayrıntı düzeyinde çalışır:

1. **Fiş seviyesi** — boru hattından (02 Aşama 6) çıkan her fiş, bINT mutabakatı öncesinde tam olarak bir kez puanlanır. Yeniden puanlama mümkündür (örn. başarılı bir itirazdan sonra) ama her sürüm öncekini geçersiz kılar.
2. **Kullanıcı seviyesi** — her kullanıcının yakın katkılarının kalitesini yansıtan yuvarlanan bir sağlık anlık görüntüsü vardır. Sağlık yavaş değişir ve sınırlıdır; tek kötü bir fiş uzun süreli iyi bir kaydı çökertemez.

Fiş seviyesi puanlama eşzamanlıdır; kullanıcı seviyesi sağlık günlük grup katmanında yeniden hesaplanır (01 §1.5).
