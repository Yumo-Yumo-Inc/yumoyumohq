# Data foundations

The models in the previous section are only as good as the statistics they read.
This section sets out where those statistics come from and how they are kept
sourced and current.

## 3.1 Official statistics

The backbone of the estimate is official Turkish statistics:

- **TÜİK (Turkish Statistical Institute)** — average retail prices for products,
  the consumer price index and its sub-indices, the domestic producer price index,
  and labour-cost indices by sector.
- **TCMB (Central Bank of the Republic of Türkiye)** — the inflation report and the
  index movements used to keep reference periods aligned.
- **EPDK (Energy Market Regulatory Authority)** — fuel taxation and distributor
  margins, used for the fuel category.
- **Ministry of Commerce** — customs-duty decisions affecting imported goods.

These are deterministic public datasets with defined effective dates, which is what
lets the estimate be tied to the period of a purchase rather than a generic
average.

## 3.2 Institutional and sector data

Where producer-to-retail markups are needed, the estimate draws on sector bodies
and company disclosures:

- **TZOB (Union of Chambers of Agriculture)** for producer-to-retail produce
  markups; **Rekabet Kurumu (Competition Authority)** for grocery gross margins and
  market concentration.
- Sector associations — **SETBİR, SUDER, MEYED, BYSD, UZZK, MOSDER** — for dairy,
  bottled water, juice, vegetable and olive oil, and furniture.
- **KAP (Public Disclosure Platform)** for listed-company gross margins.
- Cost-composition weight ranges compiled from **TOBB, İSO, and chamber sector
  reports**, with **OECD inter-country input-output tables** as a cross-country
  reference.

The [source registry](04-source-registry.md) lists what is currently verified, with
each institution, the scope it covers, and its effective date.

## 3.3 The draft-to-verified pipeline

No figure is entered by hand as final. Data flows through a pipeline:

1. An automated step or research routine writes a **draft** row, carrying a
   mandatory source, an optional reference URL, and an effective date.
2. The draft is reviewed and **verified** before it can affect the public estimate
   or this paper. Only verified rows are read.
3. Approving a draft takes effect without a redeploy; the live registry reflects the
   change on its next refresh.

This is a standing rule, not a one-off: every figure carries a source, and a row
without one is reported as missing rather than filled with a placeholder.

## 3.4 Periods and freshness

Because each source carries an effective date, the estimate can select the figure
that applied in the period of a purchase, and the registry can show how current the
underlying data is. Price statistics are refreshed as the institutions publish
them; the registry's "last updated" reflects the most recent verified figure.
