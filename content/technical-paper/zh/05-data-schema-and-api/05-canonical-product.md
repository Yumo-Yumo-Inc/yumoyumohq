# 標準商品（規範）

## 5.4 標準商品（規範）

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

`category_path` 為階層式；查詢可在任何深度配對（`food` 回傳整棵樹）。`taxonomy_version` 允許向後相容的重新分類 — 當 v1.1 發布時，既有記錄保留其 v1.0 路徑直至重新處理。

### 別名

`name_aliases` 是 02 階段 4 模糊配對的動力來源。新別名由標準化審查者新增，或在兩個嵌入緊密分群時由自動合併新增。審計日誌記錄每個別名由誰/什麼新增。

---
