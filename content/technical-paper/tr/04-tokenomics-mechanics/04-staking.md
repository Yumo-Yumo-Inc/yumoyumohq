# Staking mekanikleri

## 4.6 Staking rayı

Staking altyapısı v1 ile birlikte gelir, ancak **lansmanda etkin değildir**. İlk fiyat keşif penceresi tamamlandıktan sonra, ileriki bir fazda etkinleşir; böylece lansman dönemi staking akışları tarafından biçimlendirilmez. Vision Paper, staking tahsisini ve kademe tablosunu (kilit süresi, ağırlık, gösterge APR aralığı) yayınlar. Bu bölüm, etkinleştiğinde geçerli olacak mekanizmayı anlatır.

### Ödül modeli

Staking, Staking Teşvikleri rayından (4.17) çeker ve 5 yıllık bir ufukta serbest bırakılır. Tasarım, APR'yi değil **yıllık emisyon havuzunu** sabitler. Bir kademenin herhangi bir andaki APR'si `annual_pool / weighted_staked_supply` fonksiyonudur: stake edilen miktar azken daha yüksek seyreder ve stake edilen arz büyüdükçe normalleşir. Bu, katılım ne olursa olsun rayı bütçesi içinde tutar ve Vision Paper'daki gösterge APR'leri sabit vaatler değil, ağırlıklar olarak çerçeveler.

### Kademe yapısı

Staker, her biri göreli bir ağırlık taşıyan sabit bir kademe kümesinden bir kilit süresi seçer. Ödüller bu ağırlıkla orantılı olarak birikir. Kademe tablosu, yayınlanmış Vision Paper'ın parçasıdır.

### Birikim ve talep

Ödüller kilit süresi boyunca birikir ve kullanıcı ödülleriyle aynı epoch (dönem) ve dağıtıcı yolundan mutabakat eder (4.4): motor birikimi hesaplar, bağımsız doğrulayıcı denetler (4.17) ve kullanıcı dağıtıcıdan talep eder. Anapara, kilit süresi dolduktan sonra çekilebilir hale gelir.

### Uygulama

Staking, 4.15'teki program modeliyle tutarlı olarak, özel bir protokol programı yerine denetlenmiş araçları kullanır. Güvensiz aracısız zincir üstü staking, devreye girdiğinde, denetlenmiş bir şablon üzerine kurulur.

## 4.7 Lansman zamanlaması

v1, staking altyapısını kapalı (devre dışı) olarak yayınlar. İlk fiyat keşif penceresinden sonra, ileriki bir fazda etkinleştirilir. Bu, Vision Paper'da yayınlanır.

## 4.8 Operasyonel kontroller

Ödül dağıtımları ve kademe tablosu parametre değişiklikleri, 4.9'da anlatılan hazine kontrolleri altında yönetilir. Değişiklikler, geri al ve yak icrasıyla aynı çoklu imza + zaman kilidi kadansını izler; zaman kilidi penceresinden önce duyuru yapılır.
