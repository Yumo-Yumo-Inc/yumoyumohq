# Stage 3 — Rules

## 2.6 Stage 3 — Regex and rule layer

The regex layer **always** runs after the LLM. The LLM is a fast pattern-recognizer; regex is a deterministic verifier.

### What regex catches that LLMs miss

The rule layer adds deterministic verification across four categories:

1. **Total reconciliation.** The LLM occasionally rounds or normalises the grand total. The rule layer re-extracts the printed total from the OCR text and overrides the LLM value on disagreement.
2. **Date normalisation.** Receipts use multiple regional date formats and locale-specific month names. All variants converge to ISO 8601.
3. **Currency disambiguation.** Mixed currency tokens are resolved by frequency and merchant locale.
4. **Tax-line detection.** Locale-specific tax rate lines (e.g. KDV in Türkiye) are detected from the printed text rather than inferred by the LLM.

### Rule catalog

The catalog is organised by category: totals, taxes, dates, currency, and merchant identifiers. Each category contains locale-specific rule families for the languages we operate in. Specific patterns and per-rule weights are managed in the internal operations layer.

### Confidence boost

Each verified rule hit raises a regex-layer confidence score. Receipts that reconcile cleanly receive a higher score; receipts with unresolved totals carry a reconciliation gap that the trust scorer reads as one of its inputs. The weight assigned to that input is managed in the internal operations layer.

---
