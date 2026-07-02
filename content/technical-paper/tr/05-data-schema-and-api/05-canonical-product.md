# Kanonik ürün (bağlayıcı)

## 5.4 Kanonik ürün (bağlayıcı)

```json
// CanonicalProduct
{
  "canonical_product_id": "cp.pinar.milk.1l",
  "name": "Pınar Süt 1 L",
  "name_aliases": ["PINAR SUT 1L", "SUT PINAR 1L", "PINAR S.YAGLI 1L"],
  "brand_id": "brand.pinar",
  "category_path": ["food", "dairy", "milk"],
  "attributes": {
    "size_value": 1.0,
    "size_unit": "L",
    "package_type": "carton",
    "fat_content_pct": 3.0,
    "is_private_label": false
  },
  "barcode_gtin": "8690571000123",
  "embedding_vector_id": "v.pinar.milk.1l.v3",
  "taxonomy_version": "1.0.0",
  "created_at": "2026-01-01T00:00:00Z",
  "last_seen_at": "2026-05-17T14:23:11Z",
  "observation_count": 42813
}
```

`category_path` hiyerarşiktir; sorgular herhangi bir derinlikte eşleşebilir (`food` tüm ağacı döndürür). `taxonomy_version` geriye uyumlu yeniden sınıflandırmaya izin verir — v1.1 çıktığında mevcut kayıtlar yeniden işlenene kadar v1.0 yolunu korur.

### Takma adlar

`name_aliases` 02 Aşama 4'teki bulanık eşleşmeyi besler. Yeni takma adlar ya kanoniklik inceleyicisi tarafından eklenir ya da iki *embedding* birbirine yaklaştığında otomatik birleştirme ile gelir. Denetim günlüğü her takma adın kim/ne tarafından eklendiğini kaydeder.

---
