# Gözlemlenebilirlik ve kalibrasyon

## 3.14 Güven katmanı kendine ne yayınlar

Katmandan geçen her fiş, dahili bir gözlemlenebilirlik akışına bir kayıt yayınlar. Kayıt şunları içerir:

- Atanan güven bandı ve katkıda bulunan sinyal ailelerinin listesi.
- Fişin tutulup tutulmadığı, reddedilip reddedilmediği veya kredilendirilip kredilendirilmediği (tam / azaltılmış).
- Tutulan fişler için, inceleyenin nihai eylemi ve karar süresi.
- Kredilendirilen fişler için, kredi anındaki kullanıcının sağlığı ve seviyesi.

Bu akış üç görünümü besler:

1. **Katman sağlık panosu** — zaman içinde bant dağılımı, tut-kuyruk derinliği, karar süresi, inceleyen geçersiz kılma oranı.
2. **Kalibrasyon görünümü** — güven bandı ve gözlemlenen aşağı akış sonucunun eşli dağılımları (örn. "yüksek" bantlı bir fiş daha sonra farklı bir sinyalle işaretlendi mi?).
3. **İstismar nabzı** — küme boyutu dağılımı, yeni düzen ortaya çıkma oranı, tutulan vakaların coğrafyası.

## 3.15 Kalibrasyon kadansı

Katman düzenli bir kadansta yeniden kalibre edilir. Kalibrasyon adımı:

- Bant ve sinyal ailesi bazında inceleyen-geçersiz-kılma oranını gözden geçirir.
- Sinyal dağılımlarındaki kaymayı tespit eder (dağılımı kaymış bir sinyal, yeniden ağırlıklandırılması gerekebilecek bir sinyaldir).
- Sinyalleri yeniden ağırlıklandırır ve gözlemlenen sonuçların en yakın penceresine karşı bant sınırlarını ayarlar.

Kalibrasyon mevcut fazda protokol ekibinin sorumluluğundadır. Operasyonel model merkeziyetsizleştikçe (bkz. 00 §0.2), yeniden kalibrasyon *Vision Paper — Closing Thesis*'de belgelenen yönetilen bir sürece taşınır.

## 3.16 Panoda yer almayan

Panolar dahilidir. Bireysel kullanıcı tanımlayıcılarını açığa çıkarmazlar; bant, sinyal ailesi, coğrafya ve zamana göre toplarlar. Tanımlanabilir veri fiş deposunda (05 §5.3) yaşar ve orada anlatılan operasyonel kontrollerle erişilir.

Kalibrasyon parametreleri — her kalibrasyon adımının ürettiği ağırlıklar — üretim yapılandırma deposunda yaşar ve katman yeniden ayarlandıkça rotasyona girer.

---

## Çapraz referanslar

- Şema tanımları (`trust_scores`, `health_snapshots`, `levels`) → 05 Veri Şeması ve API
- Fiş durum enum'u ve yaşam döngüsü → 05 §5.3
- Tokenomik açısından günlük tavan hesabı → 04 Tokenomik Mekanikleri
- Güven katmanı için operasyonel riskler (inceleyen ölçeği, istismar-evrim gecikmesi) → 08 Riskler ve Önlemler
