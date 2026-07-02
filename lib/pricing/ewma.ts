/**
 * EWMA (Exponentially Weighted Moving Average) helpers
 * Used for computing trends and volatility over time
 */

export interface EWMAState {
  mean: number;
  variance: number;
  count: number;
  lastUpdate: string; // ISO date
}

/**
 * EWMA parameters
 */
const ALPHA_MEAN = 0.1; // Smoothing factor for mean (10% weight to new observation)
const ALPHA_VARIANCE = 0.15; // Smoothing factor for variance

/**
 * Update EWMA state with a new observation
 */
export function updateEWMA(
  state: EWMAState | null,
  value: number,
  date: string
): EWMAState {
  if (!state) {
    return {
      mean: value,
      variance: 0,
      count: 1,
      lastUpdate: date,
    };
  }

  // Calculate time decay (older observations have less weight)
  const daysSinceUpdate = Math.max(0, 
    (new Date(date).getTime() - new Date(state.lastUpdate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const decayFactor = Math.exp(-daysSinceUpdate / 30); // 30-day half-life

  // Update mean with EWMA
  const meanDelta = value - state.mean;
  const newMean = state.mean + ALPHA_MEAN * decayFactor * meanDelta;

  // Update variance with EWMA
  const varianceDelta = Math.pow(value - state.mean, 2) - state.variance;
  const newVariance = Math.max(0, state.variance + ALPHA_VARIANCE * decayFactor * varianceDelta);

  return {
    mean: newMean,
    variance: newVariance,
    count: state.count + 1,
    lastUpdate: date,
  };
}

/**
 * Compute EWMA trend from receipt history
 * Returns trend (positive = increasing, negative = decreasing) and volatility (std dev)
 */
export function computeTrend(
  receipts: Array<{ date: string; hiddenCostRate: number }>,
  lookbackDays: number = 60
): { trend: number; volatility: number; state: EWMAState | null } {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  cutoffDate.setHours(0, 0, 0, 0);

  // Filter receipts within lookback period
  const recentReceipts = receipts
    .filter(r => new Date(r.date) >= cutoffDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (recentReceipts.length === 0) {
    return { trend: 0, volatility: 0, state: null };
  }

  // Build EWMA state from history
  let state: EWMAState | null = null;
  for (const receipt of recentReceipts) {
    state = updateEWMA(state, receipt.hiddenCostRate, receipt.date);
  }

  if (!state) {
    return { trend: 0, volatility: 0, state: null };
  }

  // Trend is the change in mean over time
  // For simplicity, use the mean itself as trend indicator
  // (positive mean = higher than baseline, negative = lower)
  const trend = state.mean;

  // Volatility is the standard deviation
  const volatility = Math.sqrt(state.variance);

  return { trend, volatility, state };
}

/**
 * Compute category-level trend from receipts
 */
export function computeCategoryTrend(
  receipts: Array<{ date: string; hiddenCostRate: number; category: string }>,
  category: string,
  lookbackDays: number = 60
): { trend: number; volatility: number } {
  const categoryReceipts = receipts
    .filter(r => r.category === category)
    .map(r => ({ date: r.date, hiddenCostRate: r.hiddenCostRate }));

  const result = computeTrend(categoryReceipts, lookbackDays);
  return { trend: result.trend, volatility: result.volatility };
}

/**
 * Compute merchant-level trend from receipts
 */
export function computeMerchantTrend(
  receipts: Array<{ date: string; hiddenCostRate: number; merchantId?: string; merchantName: string }>,
  merchantId: string | undefined,
  merchantName: string,
  lookbackDays: number = 60
): { trend: number; volatility: number } {
  const merchantReceipts = receipts
    .filter(r => 
      (merchantId && r.merchantId === merchantId) || 
      (!merchantId && r.merchantName === merchantName)
    )
    .map(r => ({ date: r.date, hiddenCostRate: r.hiddenCostRate }));

  const result = computeTrend(merchantReceipts, lookbackDays);
  return { trend: result.trend, volatility: result.volatility };
}





