# Tasarım hedefleri

## 3.1 Güven katmanının hedefleri

Güven katmanı, birbirine gerilimde olan dört özelliği optimize eder.

| Hedef | Anlamı | Niçin önemli |
|---|---|---|
| **Düşük riskli fişler gecikmez** | Doğrulama sinyalleri yeterli olan bir fiş, manuel inceleme beklemeden önizleme ve ödül uygunluğu sonucu alır. | İnceleme kuyruğu yalnız belirsiz veya çelişkili kayıtlar için kullanılır. |
| **Uygun olmayan kredi sınırlandırılır** | Çoklu hesap, tekrar fiş ve sentetik görsel sinyalleri azaltma, inceleme veya ret akışına yönlenir. | Uygun olmayan krediler, ödül muhasebesini ve dağıtım tavanlarını bozar. |
| **Sınır durumlar yeniden incelenir** *(planlanan)* | Olağandışı ama makul görünen fişler ikinci bir bakış için inceleme kuyruğuna girer. İnceleme kuyruğu planlanan bir mekanizmadır; mevcut sürüm her fişi otomatik olarak sonuçlandırır. | Yanlış retler için ikinci değerlendirme ve itiraz yolu gerekir. |
| **Karar ve seçenekler anlaşılırdır** | Kullanıcı, fişin neden düşürüldüğünü veya tutulduğunu, hangi seçeneklerin mevcut olduğunu görür. | Kullanıcı, yeniden yükleme veya itiraz gibi sonraki adımları anlayabilir. |

Katman bu dört hedefi sabit bir kural kümesi yerine kalibre edilmiş bir puanlama modeliyle dengeler; model tasarım anında sabitlenmek yerine gözlemlenen sonuçlara göre yeniden ayarlanır.

## 3.2 Güven nereye iliştirilir

Güven puanlaması iki ayrıntı düzeyinde çalışır:

1. **Fiş seviyesi** — boru hattından (02 Aşama 6) çıkan her fiş, bINT mutabakatı öncesinde tam olarak bir kez puanlanır. Yeniden puanlama mümkündür (örn. başarılı bir itirazdan sonra) ama her sürüm öncekini geçersiz kılar.
2. **Kullanıcı seviyesi** — her kullanıcı, katkılarının zaman içindeki kalitesini yansıtan birikimli bir güven duruşu taşır. Duruş kademeli hareket eder ve sınırlıdır; tek kötü bir fişin uzun süreli iyi bir kayıt üzerindeki etkisi sınırlı kalır.

İki düzey eşzamanlı güncellenir: fiş seviyesi kalite değerlendirmesi fiş boru hattından çıkarken çalışır, kullanıcı seviyesi duruş aynı işleme geçişinde güncellenir.
