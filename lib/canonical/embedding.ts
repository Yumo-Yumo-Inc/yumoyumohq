/**
 * OpenAI text-embedding helper with 3-tier cache.
 *
 *   L1: in-process Map LRU            (sub-ms, scoped to function instance)
 *   L2: Upstash Redis                 (cross-invocation, paid mode only)
 *   L3: OpenAI text-embedding-3-small (1536-d, $0.02/1M tokens)
 *
 * Free tier (CacheMode.fullEmbeddingCache=false):
 *   - L2 is BYPASSED for vectors (240MB doesn't fit in 256MB free)
 *   - Lookup mapping (text → canonical_id, ~50B/key) is still written to Redis
 *     → via the setEmbedLookup / getEmbedLookup helpers
 *
 * Paid tier:
 *   - L1 + L2 + L3 all active
 *   - ~70% OpenAI cost savings
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "lib/canonical/embedding is server-only. Do not import in client components."
  );
}

import OpenAI from "openai";
import crypto from "crypto";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { CacheKeys, CacheTTL, CacheMode } from "./cache-config";

const client = process.env.OPENAI_API_KEY ? new OpenAI() : null;
const MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
const DIMENSIONS = 1536; // text-embedding-3-small native size

// ─── L1: in-process LRU ──────────────────────────────────────────────────────

const memCache = new Map<string, number[]>();
const MEM_LIMIT = Number(process.env.EMBEDDING_MEM_LIMIT ?? 1000);

function memEvictIfFull(): void {
  if (memCache.size > MEM_LIMIT) {
    const oldestKey = memCache.keys().next().value;
    if (oldestKey) memCache.delete(oldestKey);
  }
}

// ─── Cache key helpers ───────────────────────────────────────────────────────

function normalizeForCache(text: string): string {
  return text.trim().toLowerCase();
}

function embedHash(text: string): string {
  return crypto.createHash("sha1").update(normalizeForCache(text)).digest("hex");
}

function embeddingRedisKey(text: string): string {
  return CacheKeys.embedding(embedHash(text));
}

function lookupRedisKey(text: string): string {
  return CacheKeys.embeddingLookup(embedHash(text));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface EmbedResult {
  vector: number[];
  source: "memory" | "redis" | "openai";
}

/**
 * Embed a single text. Returns vector or null on error/no-key.
 * Cache hierarchy: L1 → L2 (paid only) → L3.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const result = await embedTextWithSource(text);
  return result?.vector ?? null;
}

export async function embedTextWithSource(
  text: string
): Promise<EmbedResult | null> {
  if (!client) return null;
  const norm = normalizeForCache(text);
  if (!norm) return null;

  // L1: in-process
  const memHit = memCache.get(norm);
  if (memHit) return { vector: memHit, source: "memory" };

  // L2: Redis (paid mode only — free tier skips vector cache)
  if (CacheMode.fullEmbeddingCache) {
    const redisHit = await cacheGet<number[]>(embeddingRedisKey(text));
    if (redisHit && Array.isArray(redisHit) && redisHit.length === DIMENSIONS) {
      memCache.set(norm, redisHit);
      memEvictIfFull();
      return { vector: redisHit, source: "redis" };
    }
  }

  // L3: OpenAI
  try {
    const response = await client.embeddings.create({
      model: MODEL,
      input: norm,
    });
    const vector = response.data[0]?.embedding;
    if (!vector || vector.length !== DIMENSIONS) return null;

    memCache.set(norm, vector);
    memEvictIfFull();

    if (CacheMode.fullEmbeddingCache) {
      // Fire-and-forget Redis write
      void cacheSet(embeddingRedisKey(text), vector, CacheTTL.embedding);
    }

    return { vector, source: "openai" };
  } catch (error) {
    console.error("[embedding] OpenAI error:", (error as Error).message);
    return null;
  }
}

/**
 * Batch embed (up to 100/call to OpenAI). Returns map keyed by NORMALIZED text.
 * L1 + L2 (paid only) + L3 hierarchy with batched fetch.
 */
export async function embedBatch(
  texts: string[]
): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>();
  if (!client || texts.length === 0) return out;

  const uniqueNormalized = Array.from(
    new Set(texts.map(normalizeForCache).filter(Boolean))
  );
  if (uniqueNormalized.length === 0) return out;

  const needsOpenAI: string[] = [];

  // L1 + L2 lookups
  for (const norm of uniqueNormalized) {
    const memHit = memCache.get(norm);
    if (memHit) {
      out.set(norm, memHit);
      continue;
    }
    if (CacheMode.fullEmbeddingCache) {
      const redisHit = await cacheGet<number[]>(embeddingRedisKey(norm));
      if (
        redisHit &&
        Array.isArray(redisHit) &&
        redisHit.length === DIMENSIONS
      ) {
        memCache.set(norm, redisHit);
        memEvictIfFull();
        out.set(norm, redisHit);
        continue;
      }
    }
    needsOpenAI.push(norm);
  }

  if (needsOpenAI.length === 0) return out;

  // L3: OpenAI batched (max 100 per call to be safe; OpenAI limit is 2048)
  const BATCH_SIZE = 100;
  for (let i = 0; i < needsOpenAI.length; i += BATCH_SIZE) {
    const slice = needsOpenAI.slice(i, i + BATCH_SIZE);
    try {
      const response = await client.embeddings.create({
        model: MODEL,
        input: slice,
      });
      for (let j = 0; j < response.data.length; j++) {
        const norm = slice[j];
        const vector = response.data[j]?.embedding;
        if (!vector || vector.length !== DIMENSIONS) continue;

        memCache.set(norm, vector);
        out.set(norm, vector);

        if (CacheMode.fullEmbeddingCache) {
          void cacheSet(embeddingRedisKey(norm), vector, CacheTTL.embedding);
        }
      }
      memEvictIfFull();
    } catch (error) {
      console.error(
        "[embedding] OpenAI batch error:",
        (error as Error).message
      );
      // Continue with next batch — partial success is better than none
    }
  }

  return out;
}

// ─── Lookup-only mode helpers (free tier path) ───────────────────────────────

/**
 * Free-tier optimization: instead of caching the full 1536-d vector in Redis
 * (240MB total), cache a "text → canonical_id" mapping (~50B/key, 1MB total).
 *
 * Use case in resolveCanonicalObservationsV3:
 *   const cached = await getEmbedLookup(rawName);
 *   if (cached) {
 *     // Skip embedding + LLM, hydrate from canonical_products by id
 *     return canonicalById(cached);
 *   }
 *   // Else: embed → retrieve → LLM canonicalize → setEmbedLookup(rawName, decided.id)
 */
export async function getEmbedLookup(text: string): Promise<string | null> {
  return cacheGet<string>(lookupRedisKey(text));
}

export async function setEmbedLookup(
  text: string,
  canonicalId: string
): Promise<void> {
  if (!canonicalId) return;
  await cacheSet(lookupRedisKey(text), canonicalId, CacheTTL.embedding);
}

// ─── pgvector serialization ──────────────────────────────────────────────────

/**
 * Convert number[] vector to pgvector literal: "[0.1,0.2,...]"
 * pg driver doesn't natively serialize arrays as vector — explicit cast needed:
 *   `INSERT ... VALUES ($1::vector)`
 */
export function vecToPgvector(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

/**
 * Parse pgvector text result into number[].
 * pg returns vectors as text by default unless type parser registered.
 */
export function pgvectorToArray(text: string | null | undefined): number[] | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return null;
    if (parsed.some((v) => typeof v !== "number")) return null;
    return parsed as number[];
  } catch {
    return null;
  }
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export function embeddingMemCacheStats(): { size: number; limit: number } {
  return { size: memCache.size, limit: MEM_LIMIT };
}

export function clearEmbeddingMemCache(): void {
  memCache.clear();
}

export const EMBEDDING_DIMENSIONS = DIMENSIONS;
export const EMBEDDING_MODEL = MODEL;
