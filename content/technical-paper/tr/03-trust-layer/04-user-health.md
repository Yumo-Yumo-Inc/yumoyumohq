# Kullanıcı sağlığı ve seviyesi

## 3.5 Kullanıcı seviyesi sağlık

Her kullanıcının yakın katkı kalitesini yansıtan `[0, 1]` aralığında bir **sağlık** değeri vardır. Sağlık yavaş değişir: temiz fişlerden oluşan uzun bir dizi onu yukarı iter; tutulmuş veya reddedilmiş fişlerden oluşan bir dizi onu aşağı çeker. Sağlık, kullanıcının günlük katkı tavanı üzerinde çarpan olarak işler; dolayısıyla aynı fişin farklı kullanıcılar için ne kadar bINT kazanabileceğini doğrudan etkiler.

Sağlığın üç önemli özelliği vardır:

- **Sınırlı.** Toparlanmakta olan bir kullanıcının kalıcı hasar olmadan geri tırmanmasına izin veren yapılandırılmış bir aralıkta kalır. Yeni kullanıcılar nötr bir orta noktada başlar.
- **Gecikmeli.** Günlük yığın katmanında yeniden hesaplanır. Tekil fiş etkileri zamana yayılır.
- **Sönümlü.** Katkı penceresi içinde eski katkılar yenilerden daha az önemlidir.

Tam yarı-ömür, taban ve tavan değerleri ve sağlığı günlük tavanlara eşleyen bant sınırları iç operasyon katmanında yönetilir.

## 3.6 Seviye

Sağlık kısa ufukludur; **seviye** uzun ufukludur. Seviye, kümülatif yüksek kaliteli katkıyla büyüyen bir tamsayıdır. Seviyeler ürün yüzeylerini açar ve *Vision Paper — Yumbie Ürün Yüzeyi* bölümünde tanımlanan kilometre taşında, kullanıcının Foundation NFT'si Smart Agent'a evrilir (tek yönlü bir mint olayı).

Seviye monoton — geri gitmez. Katkı vermeyi bırakan bir kullanıcı seviyesini korur ama sağlığı nötr orta noktaya doğru kayar.

Seviye ve sağlık birlikte etkin günlük bINT tavanını belirler. Mevcut MVP uygulaması seviye başına tablo kullanır (04 §4.22); hedef mimari `base_cap × level_multiplier × health_score` formül tabanlı tavan kullanır (04 §4.23).

## 3.7 Günlük tavan, sade dille

Bir kullanıcı her gün, (a) protokolde ne kadar aktif olduğunu ve (b) yakın katkılarının ne kadar temiz olduğunu yansıtan bir tavana kadar bINT kazanabilir. Yeni kullanıcılar seviyeyle büyüyen mütevazı bir tavanla başlar. Tavan, kullanıcıya ürün yüzeyinde bir ilerleme göstergesi olarak iletilir; değer zaman içinde ve pazarlar arasında yeniden ayarlanır.
