# Operations

## 2.10 Error Handling and Edge Cases

The pipeline evaluates errors separately from user-facing messages and ledger impact. The public contract is which category an edge case falls into; detection signals, thresholds, and retry policy are managed in the internal operations layer.

| Category | User impact | Ledger impact |
|---|---|---|
| Low input quality | User may be asked for better input | Reward accounting may be deferred or marked low-confidence |
| Missing or inconsistent receipt | User sees verification/re-upload flow | Record goes to review or rejection |
| Unsupported document type | User is told the type is unsupported | Not admitted to reward accounting |
| Suspected repeat or collision | Existing record may be shown or silent review may occur | Trust layer determines outcome |
| Old or refund receipt | User sees appropriate status | May affect memory/ePoints rather than bINT |
| System delay | User sees waiting or retry state | Job event is preserved in the queue |

## 2.11 Cost and Performance

Pipeline design targets low-latency user preview while keeping heavy model stages within measurable bounds. Per-stage cost, latency budgets, provider ratios, and retry policy are operational parameters.

## 2.12 Observability

Each stage emits the same metric families: latency, success rate, error category, queue depth, and quality band. The public document describes metric shape; alert thresholds, sampling rates, provider labels, and shadow-run policy are managed in the internal operations layer.

## 2.13 Roadmap

The pipeline roadmap moves in three technical directions: more structured invoice inputs, stronger on-device preprocessing, and batch capture experience. Provider-switching plans and capacity schedules remain in operational planning.
