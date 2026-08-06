# Kullanıcı sağlığı ve seviyesi

## 3.5 Kullanıcı seviyesi sağlık

Her kullanıcı, katkılarının kalitesini yansıtan bir **sağlık** duruşu taşır. Sağlık kademeli hareket eder: temiz, eksiksiz fişlerden oluşan bir dizi onu yukarı iter; düşük kaliteli veya tutarsız fişlerden oluşan bir dizi onu aşağı çeker. Sağlık, **fiş başına ödül oranı** üzerinde çarpan olarak işler; dolayısıyla aynı fiş, farklı duruşa sahip kullanıcılar için farklı bINT miktarları kazandırabilir.

Sağlığın üç önemli özelliği vardır:

- **Sınırlı.** Toparlanmakta olan bir kullanıcının geri tırmanmasına izin veren yapılandırılmış bir aralıkta kalır. Yeni kullanıcılar nötr bir orta noktada başlar.
- **Eşzamanlı.** Her fiş işlenirken, fiş kalitesini değerlendiren aynı geçişte (3.3) güncellenir.
- **Sönümlü** *(planlanan)*. Eski katkıların yenilerden daha az önemli olduğu bir zaman sönümü bileşeni planlanmıştır ve mevcut sürümde aktif değildir.

Sağlık aralığı, oran bantları ve sağlıktan ödül oranına eşleme iç operasyon katmanında yönetilir.

## 3.6 Seviye

Sağlık davranış ufkundadır; **seviye** katkı ufkundadır. Seviye, kümülatif yüksek kaliteli katkıyla büyüyen bir tamsayıdır. Seviyeler ürün yüzeylerini açar.

Seviye monotondur. Katkı vermeye ara veren bir kullanıcı seviyesini korur; sağlığı ise nötr orta noktaya doğru kayar.

Seviye ve sağlık, ödül hesabının farklı bölümlerinde etkilidir: **seviye günlük bINT tavanını belirler** (04 §4.22), **sağlık bu tavan içinde fiş başına ödül oranını çarpar**.

## 3.7 Günlük tavan, sade dille

Bir kullanıcı her gün, protokolde ne kadar aktif olduğunu yansıtan hesap seviyesinin belirlediği bir tavana kadar bINT kazanabilir. Bu tavan içinde, her bir fişin kazandırdığı miktar kullanıcının sağlık duruşuyla şekillenir. Yeni kullanıcılar seviyeyle büyüyen mütevazı bir tavanla başlar. Tavan, kullanıcıya ürün yüzeyinde bir ilerleme göstergesi olarak iletilir; değerler zaman içinde ve pazarlar arasında yeniden ayarlanır.
