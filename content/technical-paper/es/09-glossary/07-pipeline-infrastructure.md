# Canalización e infraestructura

- **Document reading** — Etapa que extrae bloques de texto, orden de lectura e información de posición a partir de una imagen de recibo o entrada PDF. *Véase: 02.*
- **Structured extraction** — Etapa independiente del modelo que convierte la salida de lectura de documentos en el esquema `ReceiptExtraction`. *Véase: 02.*
- **Model routing** — Política operativa que selecciona el motor de extracción estructurada. La lista de proveedores y la política de enrutamiento se gestionan en la capa operativa interna. *Véase: 02.*
- **Indexer** — Componente de monitoreo que transporta eventos on-chain a forma legible por la aplicación. *Véase: 01 y 05.*
- **Timelock** — Clase de ejecución diferida aplicada a operaciones que impactan la autoridad entre cola y ejecución. La duración y el procedimiento son operacionales. *Véase: 04.*
