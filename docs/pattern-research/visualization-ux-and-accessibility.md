# Visualization UX and Accessibility

Patterns should feel calm and readable. Charts exist to make one habit obvious, not to decorate the page.

## Chart roles

| Chart | Job on Patterns |
|---|---|
| Hour × weekday heatmap | Show when spend intensity clusters |
| Sankey / flow | Show how money moves across buckets or triggers → categories |
| Radar | Show the six identity axes at a glance |
| Treemap / sunburst | Show merchant or category concentration |
| Small multiples | Compare weekday vs weekend or promo vs non-promo |

Above the fold we keep one clear “aha” — usually identity + one striking comparison. Deeper charts sit behind progressive disclosure.

## Progressive disclosure

1. **Summary mirror** — identity, one sentence, one comparison
2. **Dimensions** — radar + top evidence chips
3. **Deep dive** — heatmap, flows, merchant concentration, promo radar

Users who only want the mirror should never be forced through a dense analytics wall.

## Chart discipline

- Prefer 2D, single-scale charts
- One currency and one timezone per view
- Exact values in tooltips; labels that survive without color alone
- Low visual density by default; high density only for exception exploration
- No 3D charts, dual axes for unrelated metrics, or ornamental gradients that hide the data

## Accessibility

- Meet WCAG contrast for text and key chart marks
- Do not rely on red/green alone; add labels or patterns
- Keep touch targets usable on mobile
- Provide a text alternative for the main insight (“Evenings account for 38% of your café spend”)
- Diagrams that are hard to read on mobile should open in a larger view

## Color stance

- Trust palette: calm blues / greens for structure and completion
- One accent for the primary action
- Reserve alert red for real risk moments, not for ordinary variance
- Avoid dashboards that feel like a market ticker — Patterns is a mirror, not a trading desk

## Anti-patterns we reject

- Fake peer bars when the cohort is empty
- Shock headlines over thin data
- Charts that require a legend essay to decode
- Mixing speculative psychology labels into axis titles

## Writing next to charts

Every chart gets one sentence that states the observation and, when useful, one soft action. The chart is evidence; the sentence is the product.
