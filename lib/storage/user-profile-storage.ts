/**
 * Shared storage for user profile data (displayName, gender, birthDate)
 * Uses Neon PostgreSQL database if available, falls back to file-based or in-memory storage
 * SERVER-ONLY: Do not import in client components
 */

// Prevent import in browser
if (typeof window !== "undefined") {
  throw new Error("user-profile-storage is a server-only module. Do not import in client components.");
}

import { promises as fs } from "fs";
import path from "path";
import { sql } from "@/lib/db/client";
import { formatDateOnly } from "@/lib/shared/date-only";
import { normalizeCountryCode } from "@/lib/shared/countries";

const DATA_DIR = path.join(process.cwd(), ".data");
const USER_PROFILES_FILE = path.join(DATA_DIR, "user-profiles.json");

export interface UserProfile {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
  gender?: string;
  birthDate?: string;
  honor?: number; // Honor score 0-100, default 50 (Honor system)
  occupation?: string;
  city?: string;
  country?: string;
  website?: string;
  bio?: string;
}

// In-memory storage fallback (for Vercel without database)
let memoryProfiles: UserProfile[] = [];

// Track if table creation has been attempted (to avoid repeated attempts)
let tableCreationAttempted = false;

// Check if database is available
function isDatabaseAvailable(): boolean {
  if (typeof window !== "undefined") {
    return false; // Never use database in browser
  }
  return !!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL);
}

/**
 * Ensure user_profiles table exists in database
 * This is called automatically before database operations
 */
async function ensureUserProfilesTable(): Promise<boolean> {
  if (!isDatabaseAvailable() || !sql) {
    return false;
  }

  // Only attempt once per process to avoid repeated checks
  if (tableCreationAttempted) {
    await ensureUserProfileColumns();
    return true;
  }

  try {
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      )
    `;

    if (tableExists[0].exists) {
      await ensureUserProfileColumns();
      tableCreationAttempted = true;
      return true;
    }

    // Table doesn't exist, create it
    console.log("[user-profile-storage] user_profiles table not found, creating...");
    
    await sql`
      CREATE TABLE user_profiles (
        username VARCHAR(255) PRIMARY KEY,
        display_name VARCHAR(255),
        avatar_url TEXT,
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

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at 
      ON user_profiles(updated_at)
    `;

    console.log("[user-profile-storage] user_profiles table created successfully");
    tableCreationAttempted = true;
    return true;
  } catch (error: any) {
    // If table already exists (race condition), that's fine
    if (error.code === "42P07" || error.message?.includes("already exists")) {
      await ensureUserProfileColumns();
      tableCreationAttempted = true;
      return true;
    }
    
    console.error("[user-profile-storage] Failed to create user_profiles table:", error.message);
    tableCreationAttempted = true; // Don't retry on error
    return false;
  }
}

async function ensureUserProfileColumns(): Promise<void> {
  if (!isDatabaseAvailable() || !sql) {
    return;
  }

  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
  `;

  const existing = new Set(columns.map((row: any) => String(row.column_name)));
  if (!existing.has("city")) {
    await sql`ALTER TABLE user_profiles ADD COLUMN city VARCHAR(255)`;
  }
  if (!existing.has("avatar_url")) {
    await sql`ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT`;
  }
  if (!existing.has("country")) {
    await sql`ALTER TABLE user_profiles ADD COLUMN country VARCHAR(255)`;
  }
  if (!existing.has("website")) {
    await sql`ALTER TABLE user_profiles ADD COLUMN website VARCHAR(255)`;
  }
  if (!existing.has("bio")) {
    await sql`ALTER TABLE user_profiles ADD COLUMN bio TEXT`;
  }
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function readUserProfiles(): Promise<UserProfile[]> {
  // Try database first
  if (isDatabaseAvailable()) {
    try {
      // Ensure table exists before querying
      await ensureUserProfilesTable();
      
      const rows = await sql`
        SELECT username, display_name, avatar_url, gender, birth_date, honor, occupation, city, country, website, bio
        FROM user_profiles 
        ORDER BY updated_at DESC
      `;
      return rows.map((row: any) => ({
        username: row.username,
        displayName: row.display_name || undefined,
        avatarUrl: row.avatar_url || undefined,
        gender: row.gender || undefined,
        birthDate: formatDateOnly(row.birth_date) ?? undefined,
        honor: row.honor != null ? Number(row.honor) : 50,
        occupation: row.occupation || undefined,
        city: row.city || undefined,
        country: row.country || undefined,
        website: row.website || undefined,
        bio: row.bio || undefined,
      }));
    } catch (error) {
      console.error("[user-profile-storage] Failed to read from database, falling back to file storage:", error);
      // Fall through to file storage
    }
  }

  // Fallback to file storage
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  
  if (isVercel) {
    return memoryProfiles;
  }
  
  await ensureDataDir();
  try {
    const data = await fs.readFile(USER_PROFILES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function writeUserProfiles(profiles: UserProfile[]): Promise<void> {
  // Try database first
  if (isDatabaseAvailable()) {
    try {
      // Ensure table exists before writing
      await ensureUserProfilesTable();
      
      // Upsert for each profile
      for (const profile of profiles) {
        await sql`
          INSERT INTO user_profiles (username, display_name, avatar_url, gender, birth_date, occupation, city, country, website, bio, updated_at)
          VALUES (${profile.username}, ${profile.displayName || null}, ${profile.avatarUrl || null}, ${profile.gender || null}, ${profile.birthDate || null}, ${profile.occupation || null}, ${profile.city || null}, ${profile.country || null}, ${profile.website || null}, ${profile.bio || null}, CURRENT_TIMESTAMP)
          ON CONFLICT (username) 
          DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            gender = EXCLUDED.gender,
            birth_date = EXCLUDED.birth_date,
            occupation = EXCLUDED.occupation,
            city = EXCLUDED.city,
            country = EXCLUDED.country,
            website = EXCLUDED.website,
            bio = EXCLUDED.bio,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
      console.log("[user-profile-storage] Saved user profiles to database:", profiles.length);
      return;
    } catch (error) {
      console.error("[user-profile-storage] Failed to write to database, falling back to file storage:", error);
      // Fall through to file storage
    }
  }

  // Fallback to file storage
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  
  if (isVercel) {
    console.log("[user-profile-storage] Vercel detected - using in-memory storage. Profile count:", profiles.length);
    memoryProfiles = profiles;
    return;
  }
  
  await ensureDataDir();
  try {
    await fs.writeFile(USER_PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (error: any) {
    console.error("[user-profile-storage] Failed to write to user-profiles.json:", error);
    // If it's a permission error, it's likely Vercel - fallback to memory
    if (error.code === "EACCES" || error.code === "EROFS") {
      console.warn("[user-profile-storage] Read-only filesystem detected (likely Vercel). Using in-memory storage as fallback.");
      memoryProfiles = profiles;
      return; // Don't throw, allow API to return success
    }
    throw error;
  }
}

async function upsertUserProfile(profile: UserProfile): Promise<void> {
  await ensureUserProfilesTable();

  await sql`
    INSERT INTO user_profiles (
      username,
      display_name,
      avatar_url,
      gender,
      birth_date,
      honor,
      occupation,
      city,
      country,
      website,
      bio,
      updated_at
    )
    VALUES (
      ${profile.username},
      ${profile.displayName ?? null},
      ${profile.avatarUrl ?? null},
      ${profile.gender ?? null},
      ${profile.birthDate ?? null},
      ${profile.honor ?? null},
      ${profile.occupation ?? null},
      ${profile.city ?? null},
      ${profile.country ?? null},
      ${profile.website ?? null},
      ${profile.bio ?? null},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (username)
    DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
      gender = COALESCE(EXCLUDED.gender, user_profiles.gender),
      birth_date = COALESCE(EXCLUDED.birth_date, user_profiles.birth_date),
      honor = COALESCE(EXCLUDED.honor, user_profiles.honor),
      occupation = COALESCE(EXCLUDED.occupation, user_profiles.occupation),
      city = COALESCE(EXCLUDED.city, user_profiles.city),
      country = COALESCE(EXCLUDED.country, user_profiles.country),
      website = COALESCE(EXCLUDED.website, user_profiles.website),
      bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  if (isDatabaseAvailable()) {
    try {
      await ensureUserProfilesTable();
      const rows = await sql`
        SELECT username, display_name, avatar_url, gender, birth_date, honor, occupation, city, country, website, bio
        FROM user_profiles
        WHERE username = ${username}
        LIMIT 1
      `;
      if (rows.length === 0) return null;
      const row = rows[0] as {
        username: string;
        display_name?: string | null;
        avatar_url?: string | null;
        gender?: string | null;
        birth_date?: unknown;
        honor?: number | null;
        occupation?: string | null;
        city?: string | null;
        country?: string | null;
        website?: string | null;
        bio?: string | null;
      };
      return {
        username: row.username,
        displayName: row.display_name || undefined,
        avatarUrl: row.avatar_url || undefined,
        gender: row.gender || undefined,
        birthDate: formatDateOnly(row.birth_date) ?? undefined,
        honor: row.honor != null ? Number(row.honor) : 50,
        occupation: row.occupation || undefined,
        city: row.city || undefined,
        country: row.country || undefined,
        website: row.website || undefined,
        bio: row.bio || undefined,
      };
    } catch (error) {
      console.error("[user-profile-storage] Failed to read profile from database, falling back:", error);
    }
  }

  const profiles = await readUserProfiles();
  const profile = profiles.find((p) => p.username === username);
  return profile || null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // Defensive normalization: never persist a full country name ("Turkey") —
  // always an ISO 2-letter code so the receipt country-match gate can compare
  // cleanly. Leave null/undefined untouched so partial updates still preserve
  // the existing stored value via COALESCE.
  if (profile.country != null && profile.country !== "") {
    const iso = normalizeCountryCode(profile.country);
    profile = { ...profile, country: iso ?? profile.country.trim().toUpperCase() };
  }

  if (isDatabaseAvailable()) {
    try {
      await upsertUserProfile(profile);
      return;
    } catch (error) {
      console.error("[user-profile-storage] Failed to upsert profile to database, falling back:", error);
    }
  }

  const profiles = await readUserProfiles();
  const existingIndex = profiles.findIndex((p) => p.username === profile.username);

  if (existingIndex >= 0) {
    // Update existing profile, merge with existing data
    profiles[existingIndex] = {
      ...profiles[existingIndex],
      ...profile,
    };
  } else {
    profiles.push(profile);
  }
  await writeUserProfiles(profiles);
}

export async function saveUserProfileAvatar(
  username: string,
  avatarUrl: string | null
): Promise<void> {
  if (isDatabaseAvailable()) {
    try {
      await ensureUserProfilesTable();
      await sql`
        INSERT INTO user_profiles (username, avatar_url, updated_at)
        VALUES (${username}, ${avatarUrl}, CURRENT_TIMESTAMP)
        ON CONFLICT (username)
        DO UPDATE SET
          avatar_url = EXCLUDED.avatar_url,
          updated_at = CURRENT_TIMESTAMP
      `;
      console.log("[user-profile-storage] Saved profile avatar to database:", username);
      return;
    } catch (error) {
      console.error("[user-profile-storage] Failed to save profile avatar to database, falling back to profile storage:", error);
    }
  }

  const profiles = await readUserProfiles();
  const existingIndex = profiles.findIndex((p) => p.username === username);

  if (existingIndex >= 0) {
    profiles[existingIndex] = {
      ...profiles[existingIndex],
      avatarUrl,
    };
  } else {
    profiles.push({ username, avatarUrl });
  }

  await writeUserProfiles(profiles);
}
