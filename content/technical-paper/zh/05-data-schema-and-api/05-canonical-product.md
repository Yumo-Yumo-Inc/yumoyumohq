# 标准商品（规范）

## 5.4 标准商品（规范）

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

`category_path` 为阶层式；查询可在任何深度配对（`food` 回传整棵树）。`taxonomy_version` 允许向后相容的重新分类 — 当 v1.1 发布时，既有记录保留其 v1.0 路径直至重新处理。

### 别名

`name_aliases` 是 02 阶段 4 模糊配对的动力来源。新别名由标准化审查者新增，或在两个嵌入紧密分群时由自动合并新增。审计日志记录每个别名由谁/什么新增。

---
