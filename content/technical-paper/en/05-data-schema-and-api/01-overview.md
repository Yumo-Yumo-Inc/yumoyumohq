# 05 — Data Schema and API

This section defines Yumo Yumo's schema and API surface. Pipeline outputs in 02, trust decisions in 03, and reward accounting in 04 map to the entity and event shapes defined here. The live surface is the application's own routes plus the public price ledger; a versioned public REST API and the B2B API are described as planned work and labeled as such.

Schemas are published so protocol parties can read the same record in the same way. Physical indexing strategy, provider choice, and commercial parameters of the B2B product remain in operational documentation.

## 5.0 Schema Principle

| Principle | Consequence |
|---|---|
| Typed record | Every public object is versioned and schema-bound |
| Event-based ledger | Reward accounting is derived from auditable historical events |
| Separated data | Personal data, aggregate data, and on-chain summary live in separate layers |
| Versionable API | Field additions/removals follow backward-compatibility rules |
