# Flujo de datos: del recibo al bINT

## 1.3 Flujo de datos: del recibo al bINT

El recorrido de un recibo se ejecuta en dos fases.

**Fase A — Sincrónica (el usuario está esperando):**

1. El cliente comprime la imagen, elimina el EXIF y solicita una URL de carga previamente firmada.
2. La imagen llega al almacenamiento de objetos. El servidor verifica un índice de deduplicación por hash perceptual.
3. La capa OCR (02 Etapa 1) extrae texto y cuadros delimitadores.
4. El enrutador LLM (02 Etapa 2) extrae un JSON estructurado `ReceiptExtraction`.
5. La capa de expresiones regulares/reglas (02 Etapa 3) concilia totales y valida fechas.
6. El matching canónico (02 Etapa 4) resuelve cada línea a un ID de producto canónico.
7. El resolvedor de comerciante (02 Etapa 5) adjunta una identidad de comerciante.
8. El scoring de confianza (03) emite un puntaje de confianza en [0, 1] y el sistema muestra al usuario una vista previa verificada.

**Fase B — Asincrónica (liquidación en segundo plano):**

9. Si el puntaje de confianza supera el umbral, se escribe una fila `bINT.pending` en el libro mayor.
10. El worker de liquidación en lotes horarios agrega créditos pendientes, calcula los techos diarios (03) y acuña bINT en Solana en el ATA congelado del usuario.
11. El indexador detecta el evento de acuñación en cadena y confirma de vuelta al libro mayor fuera de la cadena.

El usuario ve la Fase A en segundos. La Fase B finaliza de forma invisible. El contrato entre las dos fases es: **el libro mayor fuera de la cadena es la fuente de verdad hasta la liquidación en cadena**, tras la cual el estado en cadena es la fuente de verdad y el libro mayor se convierte en un espejo de lectura rápida.