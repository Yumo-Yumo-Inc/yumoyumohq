# Stage 1 — Document reading

## 2.4 Stage 1 — Document reading layer

This stage extracts text blocks, reading order, and position information from a receipt image or PDF input. The public contract is the normalized output of the stage, not the provider name.

### Output normalization

Document-reading engines can return different shapes. The pipeline normalizes them to one internal form:

```json
// DocumentReadResult
{
  "raw_text": "MIGROS\nFIS NO: 4521\n...",
  "blocks": [
    {
      "text": "MIGROS",
      "bbox": { "x": 120, "y": 40, "w": 200, "h": 50 },
      "confidence_band": "high",
      "reading_order": 0
    }
  ],
  "quality_band": "high",
  "detected_languages": ["tr"],
  "page_count": 1
}
```

Blocks are sorted into reading order and passed to the next stage as deterministic input. Model extraction is therefore not coupled to any raw provider response shape.

### Quality signal

The document-reading stage carries quality bands and error categories to later stages. In low-quality cases, the pipeline can reprocess, ask the user for a new image, or continue with lower confidence according to operational policy.

This preserves the public technical contract while avoiding threshold and fallback details that would be easy to reverse engineer.
