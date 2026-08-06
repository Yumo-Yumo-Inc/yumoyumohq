# Contabilidad de recompensas (normativo)

## 5.7 Contabilidad de recompensas (normativo)

La contabilidad de bINT es **basada en eventos**. Tres familias de registros la portan:

- **`contribution_point_events`** — filas de eventos de solo adición. Cada crédito se escribe como un evento con su origen (`receipt`, referido, misión, ...), el id del registro de origen, el importe y una marca de tiempo de creación. Los saldos se derivan de los eventos; los eventos nunca se editan en el sitio.
- **`receipt_rewards`** — el registro de recompensa por recibo: lo que ganó un recibo verificado específico y cómo se compuso el importe (la composición se almacena como un desglose junto al importe).
- **Saldo de usuario** — el saldo corriente mostrado en el producto, derivado del historial de eventos.

```text
// contribution_point_events row (representative)
id:          184223            // serial
user_id:     9c41...-...       // account id
source:      receipt
source_id:   6f2b...-...       // receipt UUID
amount:      125.00            // decimal
created_at:  2026-05-17T14:23:12Z
```

### Liquidación: instantáneas por época

La liquidación es periódica. El motor de épocas construye una instantánea del saldo acumulado de cada cuenta elegible para el periodo, la escribe como `reward_epochs` + `reward_epoch_leaves` (una hoja por cuenta), pliega las hojas en una **raíz de Merkle** y ejecuta un paso de verificación independiente que recomputa la raíz a partir de las hojas almacenadas antes de aprobar la época. La raíz aprobada se sella en cadena en una transacción memo, y los derechos de reclamación de INT se leen de las hojas de la época sellada.

La instantánea de época — en lugar de una cadena por entrada — es la unidad auditable: las hojas, la raíz y el método de verificación de una época publicada permiten a cualquiera recomputar el compromiso y comprobar que la raíz sellada coincide con los registros. Las correcciones posteriores al sellado se gestionan como nuevas entradas en una época posterior; la historia sellada nunca se reescribe.

---
