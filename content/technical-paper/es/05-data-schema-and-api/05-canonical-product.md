# Producto canónico (normativo)

## 5.4 Producto canónico (normativo)

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

El `category_path` es jerárquico; las consultas pueden coincidir a cualquier profundidad (`food` devuelve todo el árbol). El `taxonomy_version` permite reclasificación compatible hacia atrás: cuando se lanza v1.1, los registros existentes mantienen su ruta v1.0 hasta ser reprocesados.

### Alias

`name_aliases` es lo que potencia el fuzzy match en la Etapa 4 de 02. Los nuevos alias se añaden ya sea por el revisor de canonización o por una fusión automática cuando dos embeddings se agrupan estrechamente. El registro de auditoría registra quién/qué añadió cada alias.

---
