# Dependencies and failure classes

## 1.9 Dependencies and failure classes

The public technical paper classifies external dependencies by product behavior. Provider routes, thresholds, and incident actions are managed in the internal operations layer.

| Failure class | User impact | Public architecture posture |
|---|---|---|
| Document/AI processing delay | Receipt preview is delayed or routed to review | Pipeline stages are separated by typed outputs; each stage can be deferred or re-run independently |
| Data-plane unavailability | New receipt processing may pause; read behavior may be limited | The ledger event model is append-only; settlement can be derived again from replayable events |
| Chain/RPC liveness issue | On-chain settlement is delayed; user preview can remain off-chain | Reward accounting is written to the off-chain ledger first; on-chain writes are treated as batched settlement |
| Authority and signing risk | Treasury or program authorities may be affected | Authorities are separated across user wallet, application services, and on-chain layer |
| Queue and backlog growth | Processing time increases; lower-priority jobs are deferred | The synchronous user flow and background settlement flow are separate |

Provider routes, signing thresholds, recovery steps, and incident response timings are managed in the internal operations layer. The public document describes product impact and architectural resilience classes.

## Cross-references

- Receipt processing detail → 02 Receipt Pipeline
- Trust and anti-abuse model → 03 Trust Layer
- Token and settlement surface → 04 Tokenomics Mechanics
- Data schema and aggregate product → 05 Data Schema and API
