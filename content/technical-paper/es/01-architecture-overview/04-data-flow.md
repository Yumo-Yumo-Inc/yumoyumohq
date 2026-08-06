# Flujo de datos: del recibo al bINT

## 1.3 Flujo de datos: del recibo al bINT

El recorrido de un recibo se ejecuta en dos fases.

**Fase A — Sincrónica (el usuario está esperando):**

1. El cliente envía el archivo al endpoint de carga. El servidor comprime la imagen, elimina los metadatos EXIF y guarda el resultado en el almacenamiento de objetos. Antes del análisis se consulta un índice de deduplicación por hash perceptual.
2. Para entradas de imagen, el LLM de visión (02 Etapa 2) lee el recibo directamente desde la imagen en una sola llamada. Para entradas PDF, una capa OCR (02 Etapa 1) extrae primero el texto, que luego alimenta la misma etapa LLM.
3. El LLM devuelve **texto plano etiquetado**: un bloque de líneas `FIELD: value` para comerciante, fecha, totales y campos de pago, más una tabla separada por barras verticales para las líneas de artículos. El parseo es defensivo: una línea ausente o malformada deja ese campo en `null` y el canal continúa.
4. La capa de expresiones regulares/reglas (02 Etapa 3) concilia totales y valida fechas.
5. El resolvedor de comerciante (02 Etapa 5) adjunta una identidad de comerciante.
6. La capa de confianza (03) clasifica la calidad del recibo y la recompensa se calcula dentro de la misma solicitud, de modo que el usuario ve juntas la vista previa verificada y la recompensa.

**Fase B — Asincrónica (liquidación en segundo plano):**

7. Un worker de post-procesamiento en segundo plano resuelve cada línea de artículo a un ID de producto canónico (02 Etapa 4) mediante matching difuso en la base de datos con un respaldo LLM, e incorpora la clasificación de calidad del recibo al puntaje de confianza acumulado del usuario.
8. El worker de liquidación agrupa los créditos bINT elegibles, aplica los techos diarios y genera una raíz de distribución por época para las reclamaciones de INT correspondientes.
9. La raíz de distribución se compromete en cadena. El indexador confirma en el libro mayor fuera de la cadena las transferencias de INT reclamadas desde el distribuidor.

El usuario ve la Fase A en segundos. La Fase B finaliza de forma asíncrona. El libro mayor bINT fuera de la cadena sigue siendo la fuente de verdad para los créditos de contribución; la raíz en cadena y las transferencias de reclamación registran la distribución de INT correspondiente.

---
