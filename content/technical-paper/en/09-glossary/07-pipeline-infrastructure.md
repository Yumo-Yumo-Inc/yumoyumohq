# Pipeline and Infrastructure

- **Document reading** — Stage that extracts text blocks, reading order, and position information from a receipt image or PDF input. *See: 02.*
- **Structured extraction** — Model-independent stage that converts document-reading output into the `ReceiptExtraction` schema. *See: 02.*
- **Model routing** — Operational policy that selects the structured-extraction engine. Provider list and routing policy are managed in the internal operations layer. *See: 02.*
- **Indexer** — Monitoring component that carries on-chain events into application-readable form. *See: 01 and 05.*
- **Timelock** — Delayed-execution class applied to authority-impacting operations between queue and execution. Duration and procedure are operational. *See: 04.*
