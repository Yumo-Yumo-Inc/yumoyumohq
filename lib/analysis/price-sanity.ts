/**
 * price-sanity — deterministic reasoning gate applied to every price series
 * or ratio before it reaches the user.
 *
 * Pipeline per series:
 *   (a) In-series outlier removal: median + MAD based. An observation that
 *       deviates beyond the MAD band, or sits further than a fixed multiple
 *       from the median, is dropped (typical cause: an OCR misread turning
 *       one historical price into a 100x value).
 *   (b) After removal the series must keep a minimum number of observations,
 *       otherwise it is not published.
 *   (c) A delta ratio outside the plausibility band is treated as suspect
 *       data quality and the series is discarded.
 *   (d) Unit consistency is enforced upstream by keying series on
 *       canonical name + pack size + unit type; a series therefore never
 *       mixes unit types by construction.
 *
 * Thresholds live in code only and are not documented publicly.
 */

// ── Thresholds (in code by design) ──────────────────────────────────────────
const OUTLIER_MEDIAN_MULTIPLE = 5; // beyond ~5x the median (either direction)
const OUTLIER_MAD_Z = 6; // robust z-score cutoff when MAD is informative
const MIN_VALID_OBSERVATIONS = 3;
const MAX_ABS_DELTA_RATIO = 3; // |delta| > 300% → suspect data quality

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Returns the values that survive the median+MAD outlier gate.
 * Order is preserved. Non-positive values never survive.
 */
export function filterOutlierValues(values: number[]): number[] {
  const positive = values.filter((v) => Number.isFinite(v) && v > 0);
  if (positive.length < 3) return positive;
  const med = median(positive);
  if (med <= 0) return positive;
  const mad = median(positive.map((v) => Math.abs(v - med)));
  return positive.filter((v) => {
    if (v > med * OUTLIER_MEDIAN_MULTIPLE || v < med / OUTLIER_MEDIAN_MULTIPLE) return false;
    if (mad > 0) {
      const robustZ = Math.abs(v - med) / (1.4826 * mad);
      if (robustZ > OUTLIER_MAD_Z) return false;
    }
    return true;
  });
}

/**
 * Sanitises a series of observations by their unit price.
 * Returns the surviving observations (original order preserved), or null
 * when fewer than the minimum remain — the series is then not published.
 */
export function sanitizeObservations<T>(
  observations: T[],
  getUnitPrice: (obs: T) => number
): T[] | null {
  const priced = observations.filter((o) => {
    const p = getUnitPrice(o);
    return Number.isFinite(p) && p > 0;
  });
  if (priced.length < MIN_VALID_OBSERVATIONS) return null;

  const med = median(priced.map(getUnitPrice));
  if (med <= 0) return null;
  const mad = median(priced.map((o) => Math.abs(getUnitPrice(o) - med)));

  const kept = priced.filter((o) => {
    const v = getUnitPrice(o);
    if (v > med * OUTLIER_MEDIAN_MULTIPLE || v < med / OUTLIER_MEDIAN_MULTIPLE) return false;
    if (mad > 0) {
      const robustZ = Math.abs(v - med) / (1.4826 * mad);
      if (robustZ > OUTLIER_MAD_Z) return false;
    }
    return true;
  });
  return kept.length >= MIN_VALID_OBSERVATIONS ? kept : null;
}

/** Gate (c): a drift outside the plausibility band is not published. */
export function isPlausibleDeltaRatio(deltaRatio: number): boolean {
  return Number.isFinite(deltaRatio) && Math.abs(deltaRatio) <= MAX_ABS_DELTA_RATIO;
}
