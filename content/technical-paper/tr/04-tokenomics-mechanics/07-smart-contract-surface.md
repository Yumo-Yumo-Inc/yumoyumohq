# Akıllı Kontrat Yüzeyi

## 4.15 Program modeli

v1, özel protokol kodu yerine denetlenmiş ve yaygın kullanılan programlar üzerinde çalışır. Ödül katmanı için özel bir zincir üstü program dağıtılmaz; her zincir üstü işlev, dağıtılmış ve dışarıdan incelenmiş bir programa eşlenir.

| İşlev | Program | Yetki modeli |
|---|---|---|
| INT ihracı ve yakım | SPL Token | Mint yetkisi genesis sonrası kapatılır; yakım çoklu imza altında |
| Ödül dağıtımı ve talep | Denetlenmiş merkle dağıtıcı | Epoch başına kök; kök-belirleme yetkisi çoklu imza |
| Hazine ve yetkiler | Squads çoklu imza | Ayrılmış kök / hazine / geri çağırma onayları |
| Foundation NFT | Token-2022 (NonTransferable) | Arka uç mint, cüzdan başına bir adet |
| Şeffaflık taahhütleri | Memo programı | Epoch kökü ve veri kümesi özeti zincire yazılır |

bINT ve ePoints zincir dışı muhasebe birimleridir. Zincir üstü token değildirler; bakiyeleri operasyon katmanında yaşar ve dağıtıcı üzerinden INT'e mutabakat eder.

## 4.16 Zincire ne gider

Zincir üstü katman, INT token olaylarını, epoch başına dağıtım kökünü, hazine yetki değişikliklerini ve şeffaflık taahhütlerini taşır. Zincir dışı katman, ödül motorunu (katkı → miktar → kök), fiş içeriğini, güven sinyallerini ve davranış geçmişini taşır.

Yayınlanan ödül veri kümesi kalıcı depolamaya yazılır; özeti ve epoch kökü zincire taahhüt edilir. Dış taraflar kendi bakiyelerini yayınlanan veriden yeniden hesaplayıp zincir üstü köke karşı denetleyebilir; fiş içeriği ise zincir dışı veri katmanında kalır.

## 4.17 Mutabakat bütünlüğü

Bir dağıtım kökü imzalanmadan önce, bağımsız bir doğrulayıcı kökü aynı kaynak defterden yeniden hesaplar ve birikimli tahsis değişmezlerini (4.18) denetler. Yeniden hesaplamayla eşleşmeyen veya bir tahsis tavanını aşacak bir kök, imzalamaya geçmez. Kök imzalama ve hazine hareketleri, Squads çoklu imzası üzerinden çoklu onay gerektirir.

Bu ayrım; ödül hesaplamasını, bağımsız doğrulamayı ve fon hareketini ayrı ellerde tutar: ele geçirilmiş tek bir sunucu kendi başına fon hareket ettiremez.

## 4.18 Denetim duruşu

Zincir üstü yüzey, hâlihazırda denetlenmiş ve yaygın üretimde kullanılan programlara dayanır. Zincir dışı ödül motoru ve bağımsız doğrulayıcı, lansmandan önce, açık bir rapor arşivi ve bir güvenlik bildirim kanalıyla incelenir. Kapsam ve rapor bağlantıları, incelemeler tamamlandıkça yayınlanır.
