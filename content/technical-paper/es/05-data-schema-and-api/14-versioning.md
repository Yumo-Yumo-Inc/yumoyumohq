# Versionado

## 5.13 Versionado

- **Versiones de esquema** siguen SemVer a nivel de registro. `schema_version: "1.0.0"` en cada recibo permite lecturas compatibles hacia atrás.
- **Versiones de API** tienen prefijo de URL (`/v1`, `/v2`). Dos versiones mayores adyacentes ejecutan en paralelo durante al menos 12 meses.
- **Versiones de taxonomía** son independientes de las versiones de esquema. Un producto canónico puede moverse de `food.dairy.milk` (v1.0) a `food.dairy.fluid-milk` (v1.1) mientras el esquema de registro de recibo permanece estable.

---
