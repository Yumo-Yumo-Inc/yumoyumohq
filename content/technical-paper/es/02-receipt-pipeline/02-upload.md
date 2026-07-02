# Etapa 0 — Carga

## 2.3 Etapa 0 — Carga y preprocesamiento

### Lado del cliente

El cliente redimensiona la imagen y aplica compresión con pérdida: suficiente resolución para OCR manteniendo tamaños de carga pequeños en teléfonos típicos. Los objetivos exactos de resolución y calidad se gestionan en la capa operativa interna. Los metadatos EXIF se eliminan antes de la carga; el enriquecimiento geográfico comienza solo con la aceptación explícita del usuario.

El hash perceptual para la desduplicación se realiza en el lado del servidor una vez que se recibe la imagen (2.3.3).

### Lado del servidor

```json
// UploadRequest
{
  "user_id": "uuid",
  "content_type": "image/jpeg",
  "size_bytes": 524288,
  "captured_at": "2026-05-17T14:23:00Z"
}

// UploadResponse
{
  "receipt_id": "uuid",
  "upload_url": "https://...",
  "expires_at": "2026-05-17T14:24:00Z"
}
```

El servidor valida el tamaño de carga contra un límite definido en producción, incluye el tipo de contenido en la lista de permitidos (`image/jpeg`, `image/png`, `application/pdf`) y emite una URL prefirmada de corta duración. Tras el éxito del PUT, el cliente llama a `POST /receipts/{id}/process` para entrar en la Etapa 1.

### Desduplicación

Se ejecuta una comprobación de similitud perceptual de múltiples señales antes de cualquier trabajo costoso. Se distinguen dos casos:

1. **Duplicado del mismo usuario** — las cargas repetidas del mismo recibo por el mismo usuario se resuelven en el registro existente. Esto evita las cargas dobles accidentales.
2. **Colisión entre usuarios** — los recibos que parecen compartirse entre cuentas se marcan para revisión de confianza (la Etapa 6 los degrada). Esto forma parte de la defensa contra la agricultura de recompensas.

Un duplicado del mismo usuario es un **éxito suave** — el usuario ve su resultado anterior. Una señal entre usuarios aún continúa por el canal; el puntaje de confianza decide. Los umbrales y señales de similitud exactos se ajustan en producción y se gestionan en la capa operativa interna.

---
