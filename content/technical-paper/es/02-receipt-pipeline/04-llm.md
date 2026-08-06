# Etapa 2 — Extracción estructurada

## 2.5 Etapa 2 — Extracción estructurada

Esta etapa convierte el documento en campos estructurados del recibo. El contrato público es el conjunto de campos y el comportamiento de la etapa; los proveedores de modelos, el texto de los prompts, la política de enrutamiento, los presupuestos de tokens y las condiciones de reintento se gestionan en la capa operativa interna.

### Límite de enrutamiento de modelos

Yumo Yumo ejecuta la extracción estructurada detrás de una interfaz independiente del modelo. La política operativa puede elegir el motor apropiado según el idioma, la complejidad del documento, el estado de salud y las señales de calidad. El orden y el comportamiento de contingencia de esa política permanecen privados.

### Salida estructurada — texto plano etiquetado

El modelo devuelve **campos de texto plano etiquetados**, un campo por línea, en lugar de un objeto JSON. La salida JSON de los modelos de lenguaje introduce su propia clase de fallos de parseo — caracteres de control sin escapar, corchetes sin cerrar, comas sobrantes — donde un solo carácter malformado invalida la respuesta completa. Las líneas etiquetadas se degradan con elegancia: una línea ausente o malformada deja un campo vacío mientras todos los demás campos siguen parseándose.

Los campos de cabecera llegan dentro de un bloque delimitado:

```
document_type: receipt
merchant_legal_name: MIGROS TICARET A.S.
merchant_display_name: MIGROS
receipt_date: 2026-05-17
currency: TRY
total_paid: 276.71
total_vat: 42.21
payment_method: visa
...
```

Las líneas de artículos llegan como una **tabla separada por barras verticales** con un orden de columnas fijo:

```
LINE | NAME | BRAND | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | SUT 1L | PINAR | 2 | adet | 23.50 | 47.00 | 0.01
2 | ...
```

El conjunto de campos cubre la identidad del comerciante (razón social, nombre visible, marca reconocida, identificador fiscal, partes de la dirección), los metadatos del documento (tipo, fecha, hora, número de recibo, país, moneda), los totales e impuestos, el método de pago y la prueba de pago, y la tabla de líneas de artículos.

### Parseo defensivo

El parser trata cada campo de forma independiente: un campo ausente se convierte en `null`, un valor malformado se convierte en `null`, y una fila de artículo rota se registra y se omite. El parseo nunca lanza excepciones — el canal continúa con los campos que se hayan recuperado, y la capa de reglas (2.6) verifica los totales, la fecha, la moneda, las líneas de artículos y los campos de impuestos contra el texto del recibo.

### Manejo de consistencia

Si la extracción lleva una señal de baja calidad o la capa de reglas encuentra una inconsistencia, el canal puede enviar el resultado a revisión o reprocesamiento. La selección de ruta se gestiona mediante parámetros operativos.
