# Inventario de componentes

## 1.2 Inventario de componentes

Este inventario enumera las responsabilidades de los componentes del protocolo y los contratos que exponen.

| Componente | Responsabilidad | Contrato público |
|---|---|---|
| Aplicación cliente | Captura de recibos, firma de billetera, vista previa del usuario | La firma del usuario ocurre en el dispositivo; las cargas comienzan desde una acción explícita del usuario |
| Superficie de API | Identidad, orquestación de cargas, inicio de canalización, consultas de estado | Superficie REST/SDK estable; estados de etapa y categorías de error |
| Canal de procesamiento de recibos | Convertir entrada de imagen/PDF en un registro de recibo estructurado | Salidas intermedias tipadas, estado de validación, referencias canónicas de producto y comerciante |
| Capa de confianza | Producir elegibilidad de recompensa a partir del recibo y señales del usuario | Bandas públicas, categorías de decisión y calibración gestionada en operaciones internas |
| Libro mayor y contabilidad de recompensas | Mantener eventos bINT/ePoints como un flujo contable inmutable | Modelo de eventos de solo adición (append-only), registros de liquidación auditables |
| Capa de producto de datos | Producir agregados anonimizados a partir de observaciones de recibos | Separación de datos personales, umbrales k, salidas agregadas versionadas |
| Programas en cadena | Estado de tokens, staking, enrutamiento de tesorería y compromisos criptográficos | Interfaces de programa auditables y direcciones de programa publicadas |
| Plano de control operativo | Monitoreo, cuotas, enrutamiento de proveedores, respuesta a incidentes | Resumen de estado público; runbooks, umbrales y detalles de enrutamiento permanecen privados |

Esta separación es importante para la seguridad: el documento público hace que la arquitectura sea auditable, mientras que las combinaciones de infraestructura, los umbrales y los pasos de respuesta se gestionan en las operaciones internas.