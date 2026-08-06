# Etapa 0 — Carga

## 2.3 Etapa 0 — Carga y preprocesamiento

### Lado del cliente

El cliente envía la imagen capturada o el PDF directamente al endpoint de carga de la aplicación como un POST multipart. El preprocesamiento es responsabilidad del servidor: mantener al cliente ligero significa que cada superficie de captura se beneficia de la misma normalización sin distribuir código de procesamiento de imágenes a cada plataforma.

### Lado del servidor

La ruta de carga valida la solicitud antes de cualquier trabajo de almacenamiento:

- **Límite de tamaño** — el tamaño de la carga se compara con un límite definido en producción.
- **Inspección de magic bytes** — el servidor inspecciona los primeros bytes del buffer para confirmar que la carga es realmente una imagen rasterizada (`JPEG`, `PNG`, `WEBP`, `HEIC` y otros formatos compatibles) o un PDF, sin importar el `Content-Type` proporcionado por el cliente. Esto bloquea scripts o marcado camuflados bajo un tipo `image/*`.

Las cargas aceptadas pasan luego por un preprocesamiento del lado del servidor con `sharp`:

- **Orientación** — rotación automática basada en EXIF para que el recibo esté derecho antes de la etapa de lectura.
- **Compresión** — la imagen se recodifica a un perfil de tamaño y calidad ajustado para la etapa de visión.
- **Almacenamiento** — la imagen procesada se escribe en el almacenamiento de objetos Vercel Blob, con una ruta de respaldo en la base de datos cuando el almacenamiento Blob no está disponible. Las imágenes almacenadas se programan para su eliminación según la política de retención.

La respuesta devuelve un `receipt_id` y la referencia de la imagen almacenada. El cliente llama entonces a `POST /api/receipt/analyze` para entrar en la Etapa 1.

### Deduplicación

Una verificación de hash exacto del archivo se ejecuta antes de iniciar cualquier trabajo costoso: el SHA-256 de los bytes cargados se compara con los recibos almacenados previamente. Una verificación de similitud perceptual se difiere deliberadamente hasta después de la extracción de contenido, donde puede contrastarse con un hash de contenido; ejecutar la comparación visual temprano gastaría ese trabajo en cargas que la verificación exacta ya resuelve.

Ambos casos de duplicado rechazan la carga con un error de duplicado:

1. **Duplicado del mismo usuario** — se informa al usuario que ya cargó este recibo. Esto previene cargas dobles accidentales e intentos de recompensa repetida.
2. **Colisión entre usuarios** — se informa al usuario que el recibo fue cargado por otra cuenta. Esto forma parte de la defensa contra el farming.

Las señales exactas de similitud se calibran en producción y se gestionan en la capa de operaciones internas.

---
