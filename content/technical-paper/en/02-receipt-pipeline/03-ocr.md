# Stage 1 — Document reading

## 2.4 Stage 1 — Document reading layer

This stage turns a receipt image or PDF into text the rule layer can verify. The pipeline is **vision-first**: for images, a vision-capable model reads the receipt photograph directly, so a separate OCR pass is skipped for the common path. The public contract is the normalized output of the stage, not the provider name.

### Image path — vision-first

For image uploads, the preprocessed image goes straight to the vision extraction stage (2.5) in a single call. The vision model handles reading and structured field extraction together, which removes an entire provider round-trip from the synchronous path and avoids coupling extraction quality to a separate OCR engine's line segmentation.

Downstream stages that operate on plain receipt lines (the rule layer, product matching) still receive OCR-style input: a line list with reading order is **reconstructed from the vision output**, so those stages keep a single input shape regardless of how the document was read.

### PDF path — OCR branch

Digital invoices arrive as PDFs. For these the pipeline extracts embedded text directly, and falls back to converting the PDF to an image for the vision path when the document carries no usable text layer. This is the branch where a classic text-extraction step runs; images bypass it entirely.

### Output normalization

Whatever the source — vision output, PDF text, or an operator-supplied text dump — the reading result is normalized to one internal form: a full-text string plus an ordered line list (`lineNo`, `text`). Later stages consume this normalized form, so field extraction is not coupled to any raw provider response shape.

### Quality signal

The reading stage carries quality signals and error categories to later stages. In low-quality cases, the pipeline can reprocess, ask the user for a new image, or continue with lower confidence according to operational policy.

This preserves the public technical contract while avoiding threshold and fallback details that would be easy to reverse engineer.
