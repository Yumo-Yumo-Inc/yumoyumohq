# Source registry

The table below is read **live from the database** at the time this page is served.
It lists the sources currently behind the hidden-cost estimate, grouped by what they
feed. Only verified rows appear; a draft that has not been reviewed is not shown
here, and a figure with no source is not shown at all.

Each row names the institution and dataset, the scope it covers, the effective
period, and a confidence level. Where a public reference exists, the institution
name links to it.

```academia-sources
```

## 4.1 How to read the registry

- **Taxes & rates** and **commercial margins** carry a mandatory source and effective
  date per row; these are the most directly attributable figures.
- **Cost composition** lists the category weights' provenance. One category may be
  shown as low confidence where its weights are an internal estimate pending an
  external source — it is marked rather than hidden.
- **Reference prices** and **economic indices** are the official TÜİK and TCMB
  series; the count reflects how many products or series are loaded for the latest
  period.

## 4.2 Why it is live

A frozen table drifts out of date the moment a source is refreshed. Reading the
registry from the database means the paper shows what is actually verified now: when
a draft is approved, it appears here on the next refresh, and when a series is
updated, its period moves forward. The methodology in this paper is fixed; the
figures it points to are kept current by the pipeline described in the
[previous section](03-data-foundations.md).
