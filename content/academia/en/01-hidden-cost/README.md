# Part I — Hidden Cost

When a person buys a good, the shelf price bundles together many things: the cost
of producing the good, the cost of moving and selling it, taxes, and margin. Most
of that bundle is invisible at the point of sale. The hidden-cost layer estimates
one part of it — how much of a price sits above the cost of producing the good —
and attributes that estimate to named, dated sources.

This part proceeds in five steps:

- **The question** — what "hidden cost" means here, and what it deliberately does
  not claim.
- **The model family** — the three reference models (producer gap, market
  benchmark, fallback) and how a line is routed to one of them.
- **Data foundations** — the official and institutional statistics the estimate
  reads, and the draft-to-verified pipeline that keeps them sourced.
- **Source registry** — the live list of verified sources, read from the database.
- **Limits & honesty** — where the estimate is weak, and the boundary between a
  sourced figure and an engineering parameter.

Throughout, the paper names mechanisms and sources but not the tuned values that
operate them. Those are calibrated in production and kept there.
