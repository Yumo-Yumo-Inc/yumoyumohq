/**
 * Database connection utilities
 * SERVER-ONLY: Do not import in client components
 */

// Prevent import in browser
if (typeof window !== "undefined") {
  throw new Error("db/connection is a server-only module. Do not import in client components.");
}

import { getSql } from "@/lib/db/client";

/**
 * Check if database is available.
 * Uses getSql() at call time so we don't rely on sql from first module load (which can be null if DATABASE_URL wasn't set yet).
 */
export function isDatabaseAvailable(): boolean {
  if (typeof window !== "undefined") {
    return false; // Never use database in browser
  }
  const client = getSql();
  return client !== null;
}

/**
 * Retry mechanism for cold start and connection reset issues
 * Uses exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 600
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // Check if it's a connection-related error (cold start, connection reset, etc.)
      const isConnectionError = 
        error?.message?.includes('connection') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('timeout') ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT';
      
      if (i < retries && isConnectionError) {
        console.log(`[storage-db] Connection error detected, retry ${i + 1}/${retries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
