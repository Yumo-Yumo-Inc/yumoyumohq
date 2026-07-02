/**
 * User authentication storage.
 * Uses Neon PostgreSQL when available and falls back to local JSON storage in development.
 */

if (typeof window !== "undefined") {
  throw new Error("user-auth-storage is a server-only module. Do not import in client components.");
}

import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { getSql } from "@/lib/db/client";

const DATA_DIR = path.join(process.cwd(), ".data");
const AUTH_USERS_FILE = path.join(DATA_DIR, "auth-users.json");
const DB_TIMEOUT_MS = 15_000;
const BCRYPT_ROUNDS = 12;

export interface UserAuthRecord {
  username: string;
  email: string | null;
  country: string | null;
  passwordHash: string;
  emailVerifiedAt: string | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  privacyAcceptedAt: string | null;
  privacyVersion: string | null;
  signupIp: string | null;
  signupUserAgent: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface PersistedUserAuthRecord {
  username: string;
  email: string | null;
  country: string | null;
  password_hash: string;
  email_verified_at: string | null;
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
  signup_ip: string | null;
  signup_user_agent: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  country?: string;
  emailVerifiedAt?: string | null;
  termsAcceptedAt: string;
  termsVersion: string;
  privacyAcceptedAt: string;
  privacyVersion: string;
  signupIp?: string | null;
  signupUserAgent?: string | null;
}

type SeedUser = { username: string; password: string };

let memoryUsers: PersistedUserAuthRecord[] = [];
let ensuredUsersTable = false;

function isDatabaseAvailable(): boolean {
  return typeof window === "undefined" && !!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string): string {
  return username.trim();
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return code === "23505" || message.toLowerCase().includes("duplicate key");
}

function toRecord(row: PersistedUserAuthRecord): UserAuthRecord {
  return {
    username: row.username,
    email: row.email ?? null,
    country: row.country ?? null,
    passwordHash: row.password_hash,
    emailVerifiedAt: row.email_verified_at ?? null,
    termsAcceptedAt: row.terms_accepted_at ?? null,
    termsVersion: row.terms_version ?? null,
    privacyAcceptedAt: row.privacy_accepted_at ?? null,
    privacyVersion: row.privacy_version ?? null,
    signupIp: row.signup_ip ?? null,
    signupUserAgent: row.signup_user_agent ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function fromRecord(record: UserAuthRecord): PersistedUserAuthRecord {
  return {
    username: record.username,
    email: record.email,
    country: record.country,
    password_hash: record.passwordHash,
    email_verified_at: record.emailVerifiedAt,
    terms_accepted_at: record.termsAcceptedAt,
    terms_version: record.termsVersion,
    privacy_accepted_at: record.privacyAcceptedAt,
    privacy_version: record.privacyVersion,
    signup_ip: record.signupIp,
    signup_user_agent: record.signupUserAgent,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readUsersFromFile(): Promise<PersistedUserAuthRecord[]> {
  const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
  if (isVercel) {
    return memoryUsers;
  }

  await ensureDataDir();
  try {
    const raw = await fs.readFile(AUTH_USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PersistedUserAuthRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsersToFile(users: PersistedUserAuthRecord[]): Promise<void> {
  const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
  if (isVercel) {
    memoryUsers = users;
    return;
  }

  await ensureDataDir();
  await fs.writeFile(AUTH_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

async function withUsersTable(): Promise<NonNullable<ReturnType<typeof getSql>> | null> {
  const sql = getSql();
  if (!isDatabaseAvailable() || !sql) {
    return null;
  }

  if (ensuredUsersTable) {
    return sql;
  }

  const tableExists = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'users'
    )
  `;

  if (!tableExists[0]?.exists) {
    await sql`
      CREATE TABLE users (
        username VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255),
        country VARCHAR(2),
        password_hash VARCHAR(255) NOT NULL,
        email_verified_at TIMESTAMP,
        terms_accepted_at TIMESTAMP,
        terms_version VARCHAR(64),
        privacy_accepted_at TIMESTAMP,
        privacy_version VARCHAR(64),
        signup_ip VARCHAR(255),
        signup_user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(2)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP`;
  // Stamped on every password change; sessions issued before this are rejected.
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version VARCHAR(64)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_version VARCHAR(64)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_user_agent TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at)`;

  try {
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
      ON users(email)
      WHERE email IS NOT NULL
    `;
  } catch (error) {
    console.warn("[user-auth-storage] Failed to ensure unique email index:", error);
  }

  ensuredUsersTable = true;
  return sql;
}

function getSeedUsersFromEnv(): SeedUser[] {
  const raw = process.env.SEED_USERS_JSON;
  if (!raw || typeof raw !== "string") return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is SeedUser =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as SeedUser).username === "string" &&
        typeof (entry as SeedUser).password === "string"
    );
  } catch {
    return [];
  }
}

async function readAllUsers(): Promise<UserAuthRecord[]> {
  const sql = await withUsersTable();
  if (sql) {
    const rows = await sql`
      SELECT username, email, country, password_hash, email_verified_at, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, signup_ip, signup_user_agent, created_at, updated_at
      FROM users
      ORDER BY updated_at DESC NULLS LAST, username ASC
    `;
    return rows.map((row) => toRecord(row as PersistedUserAuthRecord));
  }

  const fileUsers = await readUsersFromFile();
  return fileUsers.map(toRecord);
}

async function writeAllUsers(records: UserAuthRecord[]): Promise<void> {
  const persisted = records.map(fromRecord);
  await writeUsersToFile(persisted);
}

async function getUserByUsernameInternal(username: string): Promise<UserAuthRecord | null> {
  const normalizedUsername = normalizeUsername(username);
  const sql = await withUsersTable();
  if (sql) {
    const rows = await sql`
      SELECT username, email, country, password_hash, email_verified_at, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, signup_ip, signup_user_agent, created_at, updated_at
      FROM users
      WHERE username = ${normalizedUsername}
      LIMIT 1
    `;
    return rows[0] ? toRecord(rows[0] as PersistedUserAuthRecord) : null;
  }

  const fileUsers = await readUsersFromFile();
  const found = fileUsers.find((entry) => entry.username === normalizedUsername);
  return found ? toRecord(found) : null;
}

async function getUserByEmailInternal(email: string): Promise<UserAuthRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  const sql = await withUsersTable();
  if (sql) {
    const rows = await sql`
      SELECT username, email, country, password_hash, email_verified_at, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, signup_ip, signup_user_agent, created_at, updated_at
      FROM users
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;
    return rows[0] ? toRecord(rows[0] as PersistedUserAuthRecord) : null;
  }

  const fileUsers = await readUsersFromFile();
  const found = fileUsers.find((entry) => entry.email === normalizedEmail);
  return found ? toRecord(found) : null;
}

async function updateUser(record: UserAuthRecord): Promise<void> {
  const sql = await withUsersTable();
  if (sql) {
    const createdAt = record.createdAt ? new Date(record.createdAt) : new Date();
    const updatedAt = new Date();
    const emailVerifiedAt = record.emailVerifiedAt ? new Date(record.emailVerifiedAt) : null;
    const termsAcceptedAt = record.termsAcceptedAt ? new Date(record.termsAcceptedAt) : null;
    const privacyAcceptedAt = record.privacyAcceptedAt ? new Date(record.privacyAcceptedAt) : null;
    await sql`
      INSERT INTO users (username, email, country, password_hash, email_verified_at, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, signup_ip, signup_user_agent, created_at, updated_at)
      VALUES (
        ${record.username},
        ${record.email},
        ${record.country},
        ${record.passwordHash},
        ${emailVerifiedAt},
        ${termsAcceptedAt},
        ${record.termsVersion},
        ${privacyAcceptedAt},
        ${record.privacyVersion},
        ${record.signupIp},
        ${record.signupUserAgent},
        ${createdAt},
        ${updatedAt}
      )
      ON CONFLICT (username)
      DO UPDATE SET
        email = EXCLUDED.email,
        country = EXCLUDED.country,
        password_hash = EXCLUDED.password_hash,
        email_verified_at = EXCLUDED.email_verified_at,
        terms_accepted_at = EXCLUDED.terms_accepted_at,
        terms_version = EXCLUDED.terms_version,
        privacy_accepted_at = EXCLUDED.privacy_accepted_at,
        privacy_version = EXCLUDED.privacy_version,
        signup_ip = EXCLUDED.signup_ip,
        signup_user_agent = EXCLUDED.signup_user_agent,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }

  const users = await readAllUsers();
  const index = users.findIndex((entry) => entry.username === record.username);
  const nextRecord: UserAuthRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
    createdAt: record.createdAt ?? new Date().toISOString(),
  };

  if (index >= 0) {
    users[index] = nextRecord;
  } else {
    users.push(nextRecord);
  }

  await writeAllUsers(users);
}

async function rehashPasswordInBackground(username: string, password: string): Promise<void> {
  const user = await getUserByUsernameInternal(username);
  if (!user) return;

  try {
    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.updatedAt = new Date().toISOString();
    await updateUser(user);
  } catch {
    // ignore background failures
  }
}

function shouldRehashPasswordHash(hash: string): boolean {
  try {
    return bcrypt.getRounds(hash) < BCRYPT_ROUNDS;
  } catch {
    return false;
  }
}

export function isEffectivelyVerified(user: Pick<UserAuthRecord, "email" | "emailVerifiedAt"> | null): boolean {
  if (!user) return false;
  if (!user.email) return true;
  return !!user.emailVerifiedAt;
}

export async function getUserAuthRecord(username: string): Promise<UserAuthRecord | null> {
  return getUserByUsernameInternal(username);
}

export async function getUserAuthRecordByEmail(email: string): Promise<UserAuthRecord | null> {
  return getUserByEmailInternal(email);
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const normalizedUsername = normalizeUsername(username);
  const sql = await withUsersTable();

  if (sql) {
    try {
      const rowsPromise = sql`
        SELECT password_hash
        FROM users
        WHERE username = ${normalizedUsername}
        LIMIT 1
      `;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB_TIMEOUT")), DB_TIMEOUT_MS)
      );
      const rows = (await Promise.race([rowsPromise, timeoutPromise])) as PersistedUserAuthRecord[];
      const row = rows[0];
      if (!row?.password_hash) {
        return false;
      }

      const matches = await bcrypt.compare(password, row.password_hash);
      if (!matches) return false;

      if (shouldRehashPasswordHash(row.password_hash)) {
        void rehashPasswordInBackground(normalizedUsername, password);
      }

      return true;
    } catch (error) {
      console.warn("[user-auth-storage] Database password verification failed:", error);
    }
  }

  const fileUser = await getUserByUsernameInternal(normalizedUsername);
  if (fileUser?.passwordHash) {
    const matches = await bcrypt.compare(password, fileUser.passwordHash);
    if (matches) {
      if (shouldRehashPasswordHash(fileUser.passwordHash)) {
        void rehashPasswordInBackground(normalizedUsername, password);
      }
      return true;
    }
  }

  const seedUsers = getSeedUsersFromEnv();
  const seedMatch = seedUsers.find((entry) => entry.username === normalizedUsername);
  if (!seedMatch) {
    return false;
  }
  const seedPasswordValid = await bcrypt.compare(password, seedMatch.password).catch(() => false);
  if (!seedPasswordValid) {
    return false;
  }

  const existing = await getUserByUsernameInternal(normalizedUsername);
  if (existing?.passwordHash) {
    return false;
  }

  return true;
}

export async function createUser(input: CreateUserInput): Promise<UserAuthRecord> {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  const country = input.country?.trim().toUpperCase() || null;
  const now = new Date().toISOString();

  const sql = await withUsersTable();
  if (sql) {
    const [existingByUsername, existingByEmail] = await Promise.all([
      sql`
        SELECT 1
        FROM users
        WHERE username = ${username}
        LIMIT 1
      `,
      sql`
        SELECT 1
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `,
    ]);

    if (existingByUsername.length > 0) {
      throw new Error("Username already exists");
    }

    if (existingByEmail.length > 0) {
      throw new Error("Email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const record: UserAuthRecord = {
      username,
      email,
      country,
      passwordHash,
      emailVerifiedAt: input.emailVerifiedAt ?? null,
      termsAcceptedAt: input.termsAcceptedAt,
      termsVersion: input.termsVersion,
      privacyAcceptedAt: input.privacyAcceptedAt,
      privacyVersion: input.privacyVersion,
      signupIp: input.signupIp ?? null,
      signupUserAgent: input.signupUserAgent ?? null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await sql`
        INSERT INTO users (
          username,
          email,
          country,
          password_hash,
          email_verified_at,
          terms_accepted_at,
          terms_version,
          privacy_accepted_at,
          privacy_version,
          signup_ip,
          signup_user_agent,
          created_at,
          updated_at
        )
        VALUES (
          ${record.username},
          ${record.email},
          ${record.country},
          ${record.passwordHash},
          ${record.emailVerifiedAt ? new Date(record.emailVerifiedAt) : null},
          ${new Date(record.termsAcceptedAt ?? now)},
          ${record.termsVersion},
          ${new Date(record.privacyAcceptedAt ?? now)},
          ${record.privacyVersion},
          ${record.signupIp},
          ${record.signupUserAgent},
          ${new Date(now)},
          ${new Date(now)}
        )
      `;
      return record;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const emailConflict = await sql`
          SELECT 1
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;
        if (emailConflict.length > 0) {
          throw new Error("Email already exists");
        }
        throw new Error("Username already exists");
      }
      throw error;
    }
  }

  const [existingByUsername, existingByEmail] = await Promise.all([
    getUserByUsernameInternal(username),
    getUserByEmailInternal(email),
  ]);

  if (existingByUsername) {
    throw new Error("Username already exists");
  }

  if (existingByEmail) {
    throw new Error("Email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const record: UserAuthRecord = {
    username,
    email,
    country,
    passwordHash,
    emailVerifiedAt: input.emailVerifiedAt ?? null,
    termsAcceptedAt: input.termsAcceptedAt,
    termsVersion: input.termsVersion,
    privacyAcceptedAt: input.privacyAcceptedAt,
    privacyVersion: input.privacyVersion,
    signupIp: input.signupIp ?? null,
    signupUserAgent: input.signupUserAgent ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await updateUser(record);
  return record;
}

export async function markUserEmailVerified(username: string): Promise<UserAuthRecord | null> {
  const user = await getUserByUsernameInternal(username);
  if (!user) return null;

  user.emailVerifiedAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  await updateUser(user);
  return user;
}

const ACCOUNT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type UpdateUserEmailResult =
  | { ok: true; email: string; emailVerifiedAt: string | null }
  | { ok: false; error: "USER_NOT_FOUND" | "EMAIL_IN_USE" | "INVALID_EMAIL" };

export async function updateUserEmail(
  username: string,
  newEmailRaw: string
): Promise<UpdateUserEmailResult> {
  const normalizedUsername = normalizeUsername(username);
  const trimmed = typeof newEmailRaw === "string" ? newEmailRaw.trim() : "";
  if (!trimmed || !ACCOUNT_EMAIL_REGEX.test(trimmed)) {
    return { ok: false, error: "INVALID_EMAIL" };
  }
  const newEmail = normalizeEmail(trimmed);

  const user = await getUserByUsernameInternal(normalizedUsername);
  if (!user) {
    return { ok: false, error: "USER_NOT_FOUND" };
  }

  const prevNormalized = user.email ? normalizeEmail(user.email) : null;
  if (prevNormalized === newEmail) {
    return { ok: true, email: newEmail, emailVerifiedAt: user.emailVerifiedAt };
  }

  const other = await getUserByEmailInternal(newEmail);
  if (other && normalizeUsername(other.username) !== normalizeUsername(user.username)) {
    return { ok: false, error: "EMAIL_IN_USE" };
  }

  user.email = newEmail;
  user.emailVerifiedAt = null;
  user.updatedAt = new Date().toISOString();
  await updateUser(user);
  return { ok: true, email: newEmail, emailVerifiedAt: null };
}

export async function updatePassword(username: string, newPassword: string): Promise<void> {
  const normalizedUsername = normalizeUsername(username);
  const existing = await getUserByUsernameInternal(normalizedUsername);
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const now = new Date().toISOString();

  if (existing) {
    await updateUser({
      ...existing,
      passwordHash,
      updatedAt: now,
    });
    await stampPasswordChangedAt(normalizedUsername);
    return;
  }

  await updateUser({
    username: normalizedUsername,
    email: null,
      country: null,
      passwordHash,
      emailVerifiedAt: now,
      termsAcceptedAt: now,
      termsVersion: "seed-user",
      privacyAcceptedAt: now,
      privacyVersion: "seed-user",
      signupIp: null,
      signupUserAgent: null,
      createdAt: now,
      updatedAt: now,
    });
  await stampPasswordChangedAt(normalizedUsername);
}

/**
 * Stamp users.password_changed_at = now(). Any session/refresh token issued
 * before this instant is treated as invalid (see getSessionResolution), so a
 * password change/reset logs out previously-issued (e.g. stolen) sessions.
 */
async function stampPasswordChangedAt(username: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`UPDATE users SET password_changed_at = now() WHERE username = ${username}`;
}

/**
 * Returns the epoch-seconds timestamp of the user's last password change, or
 * null when never changed / unknown. Used to invalidate older session tokens.
 */
export async function getPasswordChangedAtEpoch(username: string): Promise<number | null> {
  const sql = getSql();
  if (!sql) return null;
  const normalized = normalizeUsername(username);
  try {
    const rows = await sql`
      SELECT password_changed_at FROM users WHERE username = ${normalized} LIMIT 1
    `;
    const value = (rows[0] as { password_changed_at: string | null } | undefined)?.password_changed_at;
    if (!value) return null;
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
  } catch {
    // Column may not exist yet, or transient DB error — fail open so a missing
    // column / hiccup never logs everyone out.
    return null;
  }
}

export async function initializeDefaultUsers(): Promise<void> {
  const seeds = getSeedUsersFromEnv();
  if (seeds.length === 0) return;

  for (const seed of seeds) {
    const existing = await getUserByUsernameInternal(seed.username);
    if (existing) {
      if (!existing.passwordHash) {
        existing.passwordHash = await bcrypt.hash(seed.password, BCRYPT_ROUNDS);
        existing.emailVerifiedAt = existing.emailVerifiedAt ?? new Date().toISOString();
        existing.updatedAt = new Date().toISOString();
        await updateUser(existing);
      }
      continue;
    }

    const now = new Date().toISOString();
    await updateUser({
      username: seed.username,
      email: null,
      country: null,
      passwordHash: await bcrypt.hash(seed.password, BCRYPT_ROUNDS),
      emailVerifiedAt: now,
      termsAcceptedAt: now,
      termsVersion: "seed-user",
      privacyAcceptedAt: now,
      privacyVersion: "seed-user",
      signupIp: null,
      signupUserAgent: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function isUserEmailVerified(username: string): Promise<boolean> {
  const user = await getUserByUsernameInternal(username);
  return isEffectivelyVerified(user);
}
