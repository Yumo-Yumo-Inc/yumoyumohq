/**
 * Canonization cache config.
 *
 * Single point of control for TTLs and cache mode. The CACHE_MODE env flag
 * switches between free-tier and paid-tier behavior without a code change.
 *
 * Free tier (default):
 *   - Shorter TTLs → targets <50 MB Redis storage
 *   - Embedding cache is lookup-only (no vectors in Redis, just text→id mapping)
 *
 * Paid tier (CACHE_MODE=paid):
 *   - Longer TTLs → 200-300 MB Redis storage
 *   - Full embedding vector cache (240 MB) → maximizes OpenAI cost savings
 */

const PAID = process.env.CACHE_MODE === "paid";

/**
 * Cache TTLs (in seconds). All cache helpers read this config.
 */
export const CacheTTL = {
  /** Merchant LLM disambiguator decision cache */
  merchantDecision: PAID ? 7 * 86_400 : 3 * 86_400,

  /** Product LLM canonicalizer decision cache (Sprint 2) */
  productDecision: PAID ? 7 * 86_400 : 3 * 86_400,

  /** Embedding vector cache (paid) or lookup mapping (free) */
  embedding: PAID ? 30 * 86_400 : 7 * 86_400,

  /** Retrieval candidate results (token+phonetic fingerprint hash).
   *  Long TTL is a Gemini cost lever: a cache miss can trigger a query
   *  embedding. Staleness is bounded — matched names land in the decision
   *  cache anyway, and new patterns only matter for names not yet decided. */
  retrieve: PAID ? 24 * 3_600 : 12 * 3_600,

  /** Hot merchant full-row cache (matchMerchant skip path) */
  hotMerchant: 3_600,

  /** VKN → MatchResult exact lookup */
  vkn: PAID ? 24 * 3_600 : 12 * 3_600,

  /** Auto-create rate limit window */
  autoCreateBucket: 3_600,

  /** In-process cache freshness window for threshold config */
  thresholds: 60,
} as const;

/**
 * Cache mode decisions: which cache strategy is active.
 */
export const CacheMode = {
  /**
   * true: full 1536-d embedding vectors live in Redis; false: only a
   * text→canonical_id lookup mapping (~50 bytes/key). Enabled on every tier
   * since the Gemini migration: live embed traffic is merchant-name queries
   * only (product RAC is dormant), a bounded set of short texts — re-embedding
   * them per serverless instance costs more than the Redis space they take.
   */
  fullEmbeddingCache: true,

  /**
   * Hot merchant prewarm cron frequency.
   * free: weekly, paid: daily.
   */
  hotMerchantPrewarmFrequency: (PAID ? "daily" : "weekly") as "daily" | "weekly",

  /** Current environment label — for logging and monitoring */
  modeLabel: (PAID ? "paid" : "free") as "free" | "paid",
} as const;

/**
 * Reference values for observing free-tier limits.
 * Used by scripts/canonization/observability.ts and the admin dashboard.
 */
export const FreeTierLimits = {
  /** Upstash free-tier DB size */
  maxDbSizeMB: 256,
  /** Upstash free-tier monthly command limit */
  maxMonthlyCommands: 500_000,
  /** Crossing this threshold should trigger a paid-tier upgrade */
  warningCommandThreshold: 400_000,
  /** Crossing this threshold should trigger a paid-tier upgrade */
  warningSizeMB: 200,
} as const;

/**
 * Cache key namespace builder. For consistency, all canonization cache keys
 * should be generated through these helpers.
 */
export const CacheKeys = {
  merchantDecision: (sha1: string) => `yumo:canon:merchant:decision:${sha1}`,
  productDecision: (sha1: string) => `yumo:canon:product:decision:${sha1}`,
  embedding: (sha1: string) => `yumo:canon:embed:${sha1}`,
  embeddingLookup: (sha1: string) => `yumo:canon:embed:lookup:${sha1}`,
  vkn: (taxId: string) => `yumo:canon:vkn:${taxId}`,
  hotMerchant: (id: string) => `yumo:canon:merchant:hot:${id}`,
  retrieveMerchant: (sha1: string) => `yumo:canon:retrieve:merchant:${sha1}`,
  retrieveProduct: (sha1: string) => `yumo:canon:retrieve:product:${sha1}`,
  thresholds: (scope: "merchant" | "product") =>
    `yumo:canon:thresholds:${scope}`,
  rateLimitAutoCreate: (username: string, hourBucket: number) =>
    `yumo:canon:rate:autocreate:${username}:${hourBucket}`,
  fingerprint: (fingerprint: string) =>
    `yumo:canon:fingerprint:${fingerprint}`,
} as const;
