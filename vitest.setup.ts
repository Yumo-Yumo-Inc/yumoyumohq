/**
 * Vitest global setup. Runs once before any test file.
 *
 * Konvansiyon:
 *  - Pure-function unit testleri ENV gerektirmez.
 *  - DB/Redis/OpenAI gerektiren testler kendi içinde mock'lar veya skip eder.
 *  - INTEGRATION_TESTS=1 env'siyle çalıştırılırsa gerçek bağlantı testleri açılır.
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local'ı yükle (varsa) — DATABASE_URL gibi şeyler için
config({ path: resolve(process.cwd(), ".env.local"), override: false });

// Test ortamı işaretle
Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV ?? "test",
});
