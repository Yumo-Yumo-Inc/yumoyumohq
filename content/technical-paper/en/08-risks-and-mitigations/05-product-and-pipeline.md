# Product and pipeline risk

## 8.11 Surface

The receipt pipeline (02) is the protocol's data-intake surface. Risk clusters around document reading quality, structured extraction, the rules layer, and record write.

| Surface | Technical impact | Public control principle |
|---|---|---|
| Document-reading continuity | Receipt processing is delayed or queued | Provider-agnostic adapter and state visibility |
| Output quality | OCR / LLM output can conflict with the schema | Rule validation and canonical matching |
| Unit cost | Processing cost affects data-product margin | Operational cost tracking and economic-model linkage |
| Abuse attempt | Fake, duplicate, or manipulated receipts pressure the contribution rail | Trust-layer feedback and decision state |

## 8.12 Control model

The pipeline design works through a provider-agnostic interface for document processing. OCR and LLM outputs are normalised into the canonical schema; the rules layer checks field consistency, merchant match, date-amount plausibility, and duplicate signals (02 §2.5-§2.7).

Ambiguous receipts connect to the trust layer and review flow. The user-visible state model shows which stage a receipt is in and which rail produced the reward decision (02 §2.9).

Provider selection, routing order, thresholds, and rate-limit values are managed in the internal operations layer. The public technical paper gives the implementation contract: normalised receipt record, trust-score input, and bINT ledger output.

## 8.13 Evolution

As the pipeline matures, rule sets, canonical-product coverage, and quality-monitoring signals expand through versioned releases. As the localisation plan advances, pipeline configuration connects to the same governance discipline as treasury and authority migration.
