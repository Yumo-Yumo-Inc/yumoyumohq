# 01 — Visión general de la arquitectura

Yumo Yumo separa tres flujos: el flujo de procesamiento de recibos que devuelve retroalimentación al usuario en segundos, el flujo de recompensas y liquidación que se ejecuta en segundo plano, y el flujo de productos de datos anonimizados. Esta separación permite al protocolo gestionar la latencia, el costo, la privacidad y la liquidación en cadena como responsabilidades diferenciadas dentro de un mismo sistema.

En esta sección, el documento técnico público describe las responsabilidades de los componentes, el movimiento de datos y los límites de confianza. Las elecciones de proveedor, los umbrales de capacidad, los runbooks, los parámetros de defensa y las políticas de conmutación por error permanecen en la documentación operativa.

El invariante arquitectónico central es simple: el contenido bruto del recibo se procesa en la capa de datos fuera de la cadena; la contabilidad de recompensas se calcula primero en un libro mayor fuera de la cadena; la capa en cadena transporta el estado del token, el estado de la autoridad y los compromisos criptográficos.