# Canonical product (normative)

## 5.4 Canonical product (normative)

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

The `category_path` is hierarchical; queries can match at any depth (`food` returns the whole tree). The `taxonomy_version` allows backwards-compatible reclassification — when v1.1 ships, existing records keep their v1.0 path until reprocessed.

### Aliases

`name_aliases` is what powers fuzzy match in 02 Stage 4. New aliases are added either by the canonicalisation reviewer or by an auto-merge when two embeddings cluster tightly. The audit log records who/what added each alias.

---
