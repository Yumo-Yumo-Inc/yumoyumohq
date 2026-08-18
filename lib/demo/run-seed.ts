/**
 * Seed / refresh the onboarding sample account (`yumo_demo`).
 *
 *   npx tsx lib/demo/run-seed.ts
 *   npx tsx lib/demo/run-seed.ts --allow-prod
 *
 * Default: refuses unless DATABASE_URL is the DEV branch (ep-old-term).
 * Only deletes/rewrites rows owned by yumo_demo.
 */
import { readFileSync } from "fs";
import pg from "pg";
import { DEMO_DISPLAY_NAME, DEMO_PASSWORD, DEMO_USERNAME } from "./constants";
import { seedDemoAccount } from "./seed-account";
import { seedDemoExtras } from "./seed-extras";

function envValue(key: string): string {
  try {
    const env = readFileSync(".env.local", "utf8");
    return (env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1] || "")
      .replace(/^["']|["']$/g, "")
      .trim();
  } catch {
    return process.env[key] ?? "";
  }
}

async function main() {
  const allowProd = process.argv.includes("--allow-prod");
  const url = envValue("DATABASE_URL") || process.env.DATABASE_URL || "";
  if (!url) {
    console.error("DATABASE_URL missing.");
    process.exit(1);
  }
  if (!allowProd && !/ep-old-term/.test(url)) {
    console.error("Refusing: DATABASE_URL is not the DEV branch (ep-old-term). Pass --allow-prod to override.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const q = async (text: string, params?: unknown[]) => {
    const res = await client.query(text, params);
    return { rows: res.rows as Record<string, unknown>[], rowCount: res.rowCount ?? 0 };
  };

  try {
    const result = await seedDemoAccount(q);
    await seedDemoExtras(q);
    console.log(`${DEMO_USERNAME} / ${DEMO_PASSWORD}  ("${DEMO_DISPLAY_NAME}", account L50, season L30)`);
    console.log(`receipts=${result.receipts} line_items=${result.lineItems} month_total=${result.monthTotal} TRY`);
    console.log(`sectors=${result.sectors.join(",")}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
