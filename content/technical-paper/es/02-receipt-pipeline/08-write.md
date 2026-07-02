# Etapa 6 — Escritura

## 2.9 Etapa 6 — Escritura de salida

Una única transacción de Postgres escribe:

```
INSERT INTO receipts (...) VALUES (...);
INSERT INTO receipt_line_items (...) VALUES (...);
INSERT INTO price_observations (...) VALUES (...);
INSERT INTO events (event_type, payload) VALUES ('receipt.verified', {...});
```

La fila `events` desencadena dos consumidores descendentes:

- **Puntaje de confianza** (03) — recoge el evento, calcula la puntuación de confianza, escribe en `trust_scores`.
- **Trabajador de liquidación** — encola un crédito `bINT.pending`. La acuñación real en cadena ocurre en la capa asíncrona (01 Fase B).

La transacción es idempotente sobre una clave de escritura interna: segura para reproducción en caso de que el trabajador reintente.

---
