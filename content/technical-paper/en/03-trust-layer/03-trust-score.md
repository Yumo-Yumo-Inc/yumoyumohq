# Trust score

## 3.3 Per-receipt quality and per-user trust

Trust is tracked at two connected layers. Each receipt that exits the pipeline receives a **quality assessment**: the layer checks how complete the extracted record is (merchant, date, time, totals, line items) and whether the receipt's amounts reconcile internally. The assessment resolves to a quality tier for the receipt. That tier then feeds a **cumulative per-user trust standing**, updated synchronously in the same processing pass: a stream of clean, complete receipts raises standing over time; low-quality or inconsistent uploads slow or reverse it. Downstream systems consume the standing as tiers rather than raw values.

### Signal families

The quality assessment in the current release draws on **record completeness** and **amount reconciliation**, together with duplicate detection (3.9). The following signal families extend the model and are **planned**; they are not active in the current release:

| Family (planned) | What it observes |
|---|---|
| **Pipeline confidence** | How confident the upstream pipeline was in the extraction (OCR confidence, LLM confidence, rule-layer reconciliation). |
| **Merchant consistency** | Whether the merchant, branch, and receipt template match what we have seen before from this merchant. |
| **Temporal plausibility** | Whether the receipt's date, time, and the user's upload pattern are consistent with normal behaviour. |
| **User history** | The user's recent contribution quality, scoped to a rolling window. |

The exact scoring composition, tier boundaries, and per-tier effects are managed in the internal operations layer.

### Quality tiers

The per-receipt assessment resolves to an ordered set of quality tiers. Higher tiers reflect complete, internally consistent receipts and strengthen the user's trust standing more; lower tiers reflect sparse or inconsistent records and contribute less. The tier definitions and their exact effects are calibrated in production and not published.

## 3.4 What the receipt record carries

The receipt's quality block records the assessed tier and the completeness observations that produced it. Tier boundaries and per-tier effects live in the internal trust configuration. The user-facing surface communicates the **outcome** (bINT amount, reject) and the **reason category** when relevant.

This is intentional: public outcomes provide clarity while internal calibration values preserve the calibration surface.
