# Mapa del sistema de alto nivel

## 1.1 Mapa del sistema de alto nivel

```mermaid
flowchart LR
    subgraph Client["Dispositivo del usuario"]
        A["Aplicación<br/>firma de billetera + captura de recibo"]
    end

    subgraph Processing["Procesamiento sincrónico"]
        B["Superficie de API"]
        C["Canal de procesamiento de recibos"]
        D["Capa de confianza"]
    end

    subgraph Data["Datos fuera de la cadena"]
        E[("Registros de recibos")]
        F[("Libro mayor bINT / ePoints")]
        G["Agregados anonimizados"]
    end

    subgraph Chain["Capa en cadena"]
        H["Programas de tokens"]
        I["Tesorería y staking"]
        J["Compromisos criptográficos"]
    end

    A --> B --> C --> D
    D --> E
    D --> F
    E --> G
    F -. "liquidación por lotes" .-> H
    F -. "compromiso" .-> J
    H --> I
```

El mapa muestra el límite de la arquitectura pública: la vista previa orientada al usuario es sincrónica; la contabilidad de bINT y ePoints se escribe primero en el libro mayor y luego se liquida por lotes a la capa en cadena por los workers de liquidación. El diagrama se centra en los componentes del protocolo y el movimiento de datos.
