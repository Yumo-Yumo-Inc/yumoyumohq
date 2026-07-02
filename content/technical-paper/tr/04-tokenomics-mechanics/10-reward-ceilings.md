# Ödül tavanları

## 4.22 Fiş başına ve günlük tavanlar

İki davranışsal tavan, emisyon havuzunu yoğunlaşma ve istenmeyen mesajlardan korur. Her ikisi de bINT kullanıcının zincir dışı bakiyesine alacaklandırılmadan önce uygulama katmanında uygulanır. Üçüncü, küresel bir tavan ise mutabakatta geçerlidir (4.24'teki yumuşak tavan oranlı dağıtım — *soft-cap pro-rata*).

### Fiş başına tavan

Doğrulanmış her fiş, en fazla seviyeye bağlı bir bINT alacağı üretir. Tavan, tek bir yüksek değerli fişin kullanıcının günlük bütçesinin orantısız bir payını tüketmesini önler. Sistem 50 kullanıcı seviyesini destekler; fiş başına tavan seviyeler boyunca monoton olarak artar. Seviye başına tam değerler üretimde kalibre edilir ve yayınlanmaz.

### Günlük tavan

Her kullanıcının, bir UTC günü içinde tüm fişlerden kazanılan toplam ödülü sınırlayan günlük bir bINT bütçesi vardır. Tavan, aynı 50 seviyeli aralıkta kullanıcı seviyesiyle ölçeklenir ve monoton olarak artar. Seviye başına tam değerler üretimde kalibre edilir ve yayınlanmaz.

Kullanıcının günlük toplamı tavana ulaştığında, ek fişler işlenir ve kaydedilir ancak o gün için sıfır artışlı bINT üretir. Tavan UTC gece yarısında sıfırlanır. Bu değerler seviye başına yapılandırma aracılığıyla değiştirilebilir ve kullanıcı tabanı büyüdükçe, seviye dağılımı evrildikçe yeniden ayarlanır.

## 4.23 Hedef mimari: formül tabanlı tavan

Uzun vadeli tavan modeli, seviye başına düz tabloyu sürekli bir formülle değiştirir:

```
etkin_günlük_tavan = temel_tavan × seviye_çarpanı × sağlık_skoru
```

| Faktör | Kaynak | Aralık |
|---|---|---|
| `temel_tavan` | Protokol seviyesi sabiti | Üretimde kalibre edilir ve yayınlanmaz |
| `seviye_çarpanı` | Birikimli katkı (03 §3.6) | Seviyeyle artar |
| `sağlık_skoru` | Yakın dönem katkı kalitesi (03 §3.5) | Sınırlı skaler, üretimde kalibre edilir ve yayınlanmaz |

Bu modelde, nötr sağlığa sahip düşük seviyeli bir kullanıcı temel tavanın bir kesrini (`temel_tavan × seviye_çarpanı × sağlık_skoru`) kazanırken, güçlü sağlığa sahip yüksek seviyeli bir kullanıcı tavan aralığının üst ucuna yaklaşır. Tam sabitler üretimde kalibre edilir ve yayınlanmaz. Formül, protokolün genel ekonomik zarfı koruyarak üç faktörden herhangi birini bağımsız olarak yeniden ayarlamasına olanak tanır.

### Geçiş yolu

MVP tablosu ve hedef formül, TGE öncesi ve erken TGE sonrası dönemlerinde birlikte var olur. MVP tablosu, sağlık puanlama sistemi ve seviye dağılımının olgunlaştığı dönemde deterministik ve kolayca denetlenebilir tavanlar sağlar. Formül tabanlı model, güven katmanının sağlık ve seviye sinyalleri yeterli kalibrasyon derinliğine ulaştığında etkinleşir. Geçiş bir protokol yapılandırma değişikliğidir, akıllı kontrat taşıması değil.
