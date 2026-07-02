# API REST B2B

## 5.11 API REST B2B

Base separada, auth separado, límites de tasa separados.

```
Base: https://b2b-api.yumo.io/v1
Auth: API key + solicitudes autenticadas con protección contra reproducción. El esquema de firma y la ventana de reproducción se gestionan en la capa operativa interna.
Rate limit: dependiente de tier · cuota separada de la API pública
```

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/inflation-pulse` | Serie TR Inflation Pulse |
| GET | `/basket-panel` | Consulta Basket Panel |
| GET | `/merchant-benchmarks` | Merchant Benchmarks |
| POST | `/cohort-query` | Cohorte personalizada con aplicación de piso k |
| GET | `/catalog` | Productos disponibles + frescura + precios |
| GET | `/methodology/{version}` | Documento de metodología para una versión dada |

Cada respuesta B2B incluye `methodology_version`, `k_anonymity_floor` y el conteo de contribuidores de la respuesta, para que el equipo de cumplimiento del comprador pueda auditar una liberación.

---
