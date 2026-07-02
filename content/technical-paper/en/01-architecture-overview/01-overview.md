# 01 — Architecture Overview

Yumo Yumo separates three flows: the receipt-processing flow that returns feedback to the user in seconds, the reward and settlement flow that runs in the background, and the anonymized data-product flow. This separation lets the protocol manage latency, cost, privacy, and on-chain settlement as distinct responsibilities inside one system.

In this section, the public technical paper describes component responsibilities, data movement, and trust boundaries. Provider choices, capacity thresholds, runbooks, defense parameters, and failover policies remain in operational documentation.

The core architectural invariant is simple: raw receipt content is processed in the off-chain data layer; reward accounting is computed first in an off-chain ledger; the on-chain layer carries token state, authority state, and cryptographic commitments.
