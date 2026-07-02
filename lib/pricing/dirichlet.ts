/**
 * Deterministic PRNG and Dirichlet distribution sampling
 * All randomness is seeded for reproducibility
 */

/**
 * Simple hash function for seeding
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Deterministic PRNG (Linear Congruential Generator)
 */
export class SeededRNG {
  private seed: number;

  constructor(seed: string | number) {
    this.seed = typeof seed === "string" ? hashString(seed) : Math.abs(seed);
    // Ensure seed is in valid range
    this.seed = this.seed % 2147483647;
    if (this.seed === 0) this.seed = 1;
  }

  /**
   * Generate next random number in [0, 1)
   */
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * Generate random number from normal distribution (Box-Muller transform)
   */
  nextNormal(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform (uses 2 uniform samples)
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Generate random number from gamma distribution (for Dirichlet)
   * Using Marsaglia and Tsang's method
   */
  nextGamma(shape: number): number {
    if (shape < 1) {
      // For shape < 1, use transformation
      return this.nextGamma(shape + 1) * Math.pow(this.next(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;
      do {
        x = this.nextNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = this.next();
      const xSquared = x * x;

      if (u < 1 - 0.0331 * (xSquared * xSquared) ||
          Math.log(u) < 0.5 * xSquared + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }
}

/**
 * Sample from Dirichlet distribution deterministically
 * Returns normalized weights that sum to 1
 */
export function sampleDirichlet(
  alphas: number[],
  seed: string | number
): number[] {
  const rng = new SeededRNG(seed);
  
  // Sample from Gamma distribution for each alpha
  const samples = alphas.map(alpha => {
    if (alpha <= 0) return 0.001; // Small positive value for zero/negative alphas
    return rng.nextGamma(alpha);
  });

  // Normalize to sum to 1
  const sum = samples.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    // Fallback: uniform distribution
    return alphas.map(() => 1 / alphas.length);
  }

  return samples.map(s => s / sum);
}

/**
 * Apply soft min/max constraints to weights
 * If constraints are violated, re-normalize deterministically
 */
export function applyConstraints(
  weights: number[],
  minShares: number[],
  maxShares: number[]
): number[] {
  // Check if any constraints are violated
  let needsAdjustment = false;
  const adjusted = [...weights];

  for (let i = 0; i < weights.length; i++) {
    if (minShares[i] !== undefined && adjusted[i] < minShares[i]) {
      adjusted[i] = minShares[i];
      needsAdjustment = true;
    }
    if (maxShares[i] !== undefined && adjusted[i] > maxShares[i]) {
      adjusted[i] = maxShares[i];
      needsAdjustment = true;
    }
  }

  if (!needsAdjustment) {
    return weights;
  }

  // Re-normalize while preserving constraints
  const constrainedSum = adjusted.reduce((a, b) => a + b, 0);
  if (constrainedSum === 0) {
    return weights; // Fallback to original
  }

  // Scale remaining weights proportionally
  const scale = 1 / constrainedSum;
  return adjusted.map(w => w * scale);
}





