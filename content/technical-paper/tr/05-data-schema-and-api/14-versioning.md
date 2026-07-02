# Sürümleme

## 5.13 Sürümleme

- **Şema sürümleri** kayıt seviyesinde SemVer'i takip eder. Her fişte `schema_version: "1.0.0"` geriye uyumlu okumaları sağlar.
- **API sürümleri** URL önekli (`/v1`, `/v2`). Bitişik iki ana sürüm en az 12 ay paralel çalışır.
- **Taksonomi sürümleri** şema sürümlerinden bağımsızdır. Bir kanonik ürün, fiş kaydının şemasını değiştirmeden `food.dairy.milk` (v1.0)'tan `food.dairy.fluid-milk` (v1.1)'a taşınabilir.

---
