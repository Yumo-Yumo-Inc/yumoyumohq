# Observability and calibration

## 3.14 What the trust layer publishes to itself

Every receipt that passes through the layer emits a record into an internal observability stream. The record contains:

- The trust band assigned and the list of signal families that contributed.
- Whether the receipt was held, rejected, or credited (full / reduced).
- For held receipts, the reviewer's eventual action and the time-to-decision.
- For credited receipts, the user's health and level at the moment of credit.

This stream feeds three views:

1. **Layer health dashboard** — band distribution over time, hold-queue depth, time-to-decision, reviewer override rate.
2. **Calibration view** — paired distributions of trust band and observed downstream outcome (e.g. did a "high" band receipt later get flagged by a different signal?).
3. **Abuse pulse** — cluster size distribution, new-pattern emergence rate, geography of held cases.

## 3.15 Calibration cadence

The layer is recalibrated on a regular cadence. The calibration step:

- Reviews the reviewer-override rate by band and by signal family.
- Detects drift in signal distributions (a signal whose distribution has shifted is a signal that may need re-weighting).
- Reweights signals and adjusts band boundaries against the most recent window of observed outcomes.

Calibration is owned by the protocol team in the current phase. As the operating model decentralises (see 00 §0.2), recalibration moves to a governed process documented in the *Vision Paper — Closing Thesis*.

## 3.16 What stays out of the dashboard

The dashboards are internal. They aggregate by band, by signal family, by geography, and by time. Identifiable data lives in the receipt store (05 §5.3) and is accessed under the operational controls described there.

The calibration parameters — the weights produced by each calibration step — live in the production configuration store and are rotated as the layer is re-tuned.

---

## Cross-references

- Schema definitions (`trust_scores`, `health_snapshots`, `levels`) → 05 Data Schema and API
- Receipt status enum and lifecycle → 05 §5.3
- Daily ceiling computation in tokenomics terms → 04 Tokenomics Mechanics
- Operational risks for the trust layer (reviewer scale, abuse-evolution lag) → 08 Risks and Mitigations
