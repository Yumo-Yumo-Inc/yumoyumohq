/**
 * Shared storage for user country data
 * Uses Neon PostgreSQL database if available, falls back to file-based or in-memory storage
 * SERVER-ONLY: Do not import in client components
 */

// Prevent import in browser
if (typeof window !== "undefined") {
  throw new Error("user-country-storage is a server-only module. Do not import in client components.");
}

import { promises as fs } from "fs";
import path from "path";
import { sql } from "@/lib/db/client";
import { normalizeCountryCode } from "@/lib/shared/countries";

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export interface UserCountry {
  username: string;
  country: string;
}

// In-memory storage fallback (for Vercel without database)
let memoryUsers: UserCountry[] = [];

// Check if database is available
function isDatabaseAvailable(): boolean {
  if (typeof window !== "undefined") {
    return false; // Never use database in browser
  }
  return !!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL);
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

async function ensureProfileCountryColumn(): Promise<void> {
  if (!isDatabaseAvailable() || !sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      username VARCHAR(255) PRIMARY KEY,
      display_name VARCHAR(255),
      gender VARCHAR(50),
      birth_date DATE,
      honor INTEGER DEFAULT 50,
      occupation VARCHAR(255),
      city VARCHAR(255),
      country VARCHAR(255),
      website VARCHAR(255),
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(255)`;
}

async function readUsersFromDatabase(): Promise<UserCountry[]> {
  if (!isDatabaseAvailable() || !sql) return [];

  const merged = new Map<string, string>();

  try {
    const profileRows = await sql`
      SELECT username, country
      FROM user_profiles
      WHERE country IS NOT NULL AND TRIM(country) <> ''
    `;
    for (const row of profileRows as Array<{ username: string; country: string | null }>) {
      if (row.username && row.country) {
        merged.set(row.username, row.country);
      }
    }
  } catch (error) {
    console.warn("[user-country-storage] Failed to read user_profiles countries:", error);
  }

  try {
    const authRows = await sql`
      SELECT username, country
      FROM users
      WHERE country IS NOT NULL AND TRIM(country) <> ''
      ORDER BY updated_at DESC
    `;
    for (const row of authRows as Array<{ username: string; country: string | null }>) {
      if (row.username && row.country && !merged.has(row.username)) {
        merged.set(row.username, row.country);
      }
    }
  } catch (error) {
    console.error("[user-country-storage] Failed to read from users table, falling back:", error);
  }

  return Array.from(merged.entries()).map(([username, country]) => ({ username, country }));
}

async function upsertCountryToDatabase(username: string, country: string): Promise<void> {
  if (!isDatabaseAvailable() || !sql) {
    throw new Error("Database not available");
  }

  await ensureProfileCountryColumn();

  await sql`
    INSERT INTO user_profiles (username, country, updated_at)
    VALUES (${username}, ${country}, CURRENT_TIMESTAMP)
    ON CONFLICT (username)
    DO UPDATE SET
      country = EXCLUDED.country,
      updated_at = CURRENT_TIMESTAMP
  `;

  try {
    await sql`
      INSERT INTO users (username, country, updated_at)
      VALUES (${username}, ${country}, CURRENT_TIMESTAMP)
      ON CONFLICT (username)
      DO UPDATE SET
        country = EXCLUDED.country,
        updated_at = CURRENT_TIMESTAMP
    `;
  } catch (error) {
    console.warn("[user-country-storage] Legacy users.country sync skipped:", error);
  }
}

export async function readUsers(): Promise<UserCountry[]> {
  // Try database first
  if (isDatabaseAvailable()) {
    try {
      return await readUsersFromDatabase();
    } catch (error) {
      console.error("[user-country-storage] Failed to read from database, falling back to file storage:", error);
      // Fall through to file storage
    }
  }

  // Fallback to file storage
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  
  if (isVercel) {
    return memoryUsers;
  }
  
  await ensureDataDir();
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeUsers(users: UserCountry[]): Promise<void> {
  // Try database first
  if (isDatabaseAvailable()) {
    try {
      for (const user of users) {
        await upsertCountryToDatabase(user.username, user.country);
      }
      console.log("[user-country-storage] Saved users to database:", users.length);
      return;
    } catch (error) {
      console.error("[user-country-storage] Failed to write to database, falling back to file storage:", error);
      // Fall through to file storage
    }
  }

  // Fallback to file storage
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  
  if (isVercel) {
    console.log("[user-country-storage] Vercel detected - using in-memory storage. User count:", users.length);
    memoryUsers = users;
    return;
  }
  
  await ensureDataDir();
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error: unknown) {
    console.error("[user-country-storage] Failed to write to users.json:", error);
    // If it's a permission error, it's likely Vercel - fallback to memory
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
    if (code === "EACCES" || code === "EROFS") {
      console.warn("[user-country-storage] Read-only filesystem detected (likely Vercel). Using in-memory storage as fallback.");
      memoryUsers = users;
      return; // Don't throw, allow API to return success
    }
    throw error;
  }
}

export async function getUserCountry(username: string): Promise<string | null> {
  const raw = await readRawUserCountry(username);
  if (!raw) return null;
  const normalized = normalizeCountryCode(raw);
  if (!normalized) {
    console.warn(
      `[user-country-storage] Stored country "${raw}" for user "${username}" could not be normalized to an ISO code — returning raw value.`
    );
    return raw;
  }
  if (normalized !== raw) {
    console.warn(
      `[user-country-storage] Stored country "${raw}" for user "${username}" normalized to "${normalized}". Run the migration in scripts/migrations to fix the DB row.`
    );
  }
  return normalized;
}

async function readRawUserCountry(username: string): Promise<string | null> {
  if (isDatabaseAvailable()) {
    try {
      const rows = await sql`
        SELECT COALESCE(NULLIF(up.country, ''), NULLIF(u.country, '')) AS country
        FROM users u
        FULL OUTER JOIN user_profiles up ON up.username = u.username
        WHERE COALESCE(up.username, u.username) = ${username}
        LIMIT 1
      `;
      const country = (rows[0] as { country?: string | null } | undefined)?.country ?? null;
      if (country) return country;
    } catch (error) {
      console.warn("[user-country-storage] Failed to resolve effective user country from DB:", error);
    }
  }

  const users = await readUsers();
  const user = users.find((u) => u.username === username);
  return user?.country || null;
}

export async function saveUserCountry(username: string, country: string): Promise<void> {
  // Coerce both ISO codes and full names to a 2-letter ISO code so we never
  // store values like "Turkey" again. Falls back to the upper-cased raw value
  // for callers that pass a code we don't know yet.
  const isoCountry = normalizeCountryCode(country);
  const normalizedCountry = isoCountry ?? country.trim().toUpperCase();
  if (!isoCountry) {
    console.warn(
      `[user-country-storage] saveUserCountry received "${country}" which could not be normalized to an ISO code — storing as "${normalizedCountry}".`
    );
  }

  if (isDatabaseAvailable()) {
    try {
      await upsertCountryToDatabase(username, normalizedCountry);
      return;
    } catch (error) {
      console.error("[user-country-storage] Failed to upsert effective user country, falling back:", error);
    }
  }

  const users = await readUsers();
  const existingIndex = users.findIndex((u) => u.username === username);

  if (existingIndex >= 0) {
    users[existingIndex].country = normalizedCountry;
  } else {
    users.push({ username, country: normalizedCountry });
  }
  await writeUsers(users);
}
