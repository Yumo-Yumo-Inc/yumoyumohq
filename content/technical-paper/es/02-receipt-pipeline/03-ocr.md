# Etapa 1 — Lectura del documento

## 2.4 Etapa 1 — Capa de lectura del documento

Esta etapa convierte una imagen de recibo o un PDF en texto que la capa de reglas puede verificar. El canal es **vision-first**: para imágenes, un modelo con capacidad de visión lee la fotografía del recibo directamente, de modo que la ruta común omite un pase OCR separado. El contrato público es la salida normalizada de la etapa, no el nombre del proveedor.

### Ruta de imagen — vision-first

Para cargas de imagen, la imagen preprocesada va directamente a la etapa de extracción por visión (2.5) en una sola llamada. El modelo de visión realiza juntas la lectura y la extracción estructurada de campos, lo que elimina un ida y vuelta completo con un proveedor de la ruta sincrónica y evita acoplar la calidad de extracción a la segmentación de líneas de un motor OCR separado.

Las etapas posteriores que operan sobre líneas planas del recibo (la capa de reglas, el matching de productos) siguen recibiendo entrada estilo OCR: una lista de líneas con orden de lectura se **reconstruye a partir de la salida de visión**, de modo que esas etapas mantienen una única forma de entrada sin importar cómo se leyó el documento.

### Ruta de PDF — rama OCR

Las facturas digitales llegan como PDFs. Para estas, el canal extrae directamente el texto incrustado y, cuando el documento no lleva una capa de texto utilizable, recurre a convertir el PDF en una imagen para la ruta de visión. Esta es la rama donde se ejecuta un paso clásico de extracción de texto; las imágenes la omiten por completo.

### Normalización de la salida

Sea cual sea la fuente — salida de visión, texto de PDF o un volcado de texto proporcionado por un operador —, el resultado de lectura se normaliza a una única forma interna: una cadena de texto completo más una lista ordenada de líneas (`lineNo`, `text`). Las etapas posteriores consumen esta forma normalizada, de modo que la extracción de campos no queda acoplada a la forma de respuesta bruta de ningún proveedor.

### Señal de calidad

La etapa de lectura transporta señales de calidad y categorías de error a las etapas posteriores. En casos de baja calidad, el canal puede reprocesar, pedir al usuario una nueva imagen o continuar con menor confianza según la política operativa.

Esto preserva el contrato técnico público evitando detalles de umbrales y contingencias que serían fáciles de aplicar en ingeniería inversa.
