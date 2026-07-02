if (typeof window !== "undefined") {
  throw new Error("email-verification-storage is a server-only module. Do not import in client components.");
}

import { promises as fs } from "fs";
import path from "path";
import { getSql } from "@/lib/db/client";

const DATA_DIR = path.join(process.cwd(), ".data");
const TOKENS_FILE = path.join(DATA_DIR, "email-verification-tokens.json");

export interface EmailVerificationTokenRecord {
  id: string;
  username: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

interface PersistedTokenRecord {
  id: string;
  username: string;
  email: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}

let memoryTokens: PersistedTokenRecord[] = [];
let ensuredTable = false;

function isDatabaseAvailable(): boolean {
  return typeof window === "undefined" && !!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL);
}

function toRecord(row: PersistedTokenRecord): EmailVerificationTokenRecord {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at ?? null,
    createdAt: row.created_at,
  };
}

function fromRecord(record: EmailVerificationTokenRecord): PersistedTokenRecord {
  return {
    id: record.id,
    username: record.username,
    email: record.email,
    token_hash: record.tokenHash,
    expires_at: record.expiresAt,
    consumed_at: record.consumedAt,
    created_at: record.createdAt,
  };
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readTokensFromFile(): Promise<PersistedTokenRecord[]> {
  const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
  if (isVercel) {
    return memoryTokens;
  }

  await ensureDataDir();
  try {
    const raw = await fs.readFile(TOKENS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PersistedTokenRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeTokensToFile(tokens: PersistedTokenRecord[]): Promise<void> {
  const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
  if (isVercel) {
    memoryTokens = tokens;
    return;
  }

  await ensureDataDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

async function withTokensTable(): Promise<NonNullable<ReturnType<typeof getSql>> | null> {
  const sql = getSql();
  if (!isDatabaseAvailable() || !sql) {
    return null;
  }

  if (ensuredTable) {
    return sql;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      consumed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_created
    ON email_verification_tokens(username, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash
    ON email_verification_tokens(token_hash)
  `;

  ensuredTable = true;
  return sql;
}

export async function replaceEmailVerificationToken(record: EmailVerificationTokenRecord): Promise<void> {
  const sql = await withTokensTable();
  if (sql) {
    await sql`
      UPDATE email_verification_tokens
      SET consumed_at = CURRENT_TIMESTAMP
      WHERE username = ${record.username}
        AND consumed_at IS NULL
    `;

    await sql`
      INSERT INTO email_verification_tokens (id, username, email, token_hash, expires_at, consumed_at, created_at)
      VALUES (
        ${record.id},
        ${record.username},
        ${record.email},
        ${record.tokenHash},
        ${record.expiresAt},
        ${record.consumedAt},
        ${record.createdAt}
      )
    `;
    return;
  }

  const tokens = (await readTokensFromFile()).map(toRecord);
  const now = new Date().toISOString();
  const next = tokens.map((entry) =>
    entry.username === record.username && !entry.consumedAt
      ? { ...entry, consumedAt: now }
      : entry
  );
  next.push(record);
  await writeTokensToFile(next.map(fromRecord));
}

export async function getLatestEmailVerificationTokenForUser(
  username: string
): Promise<EmailVerificationTokenRecord | null> {
  const sql = await withTokensTable();
  if (sql) {
    const rows = await sql`
      SELECT id, username, email, token_hash, expires_at, consumed_at, created_at
      FROM email_verification_tokens
      WHERE username = ${username}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return rows[0] ? toRecord(rows[0] as PersistedTokenRecord) : null;
  }

  const tokens = (await readTokensFromFile()).map(toRecord);
  return tokens
    .filter((entry) => entry.username === username)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function findEmailVerificationTokenByHash(
  tokenHash: string
): Promise<EmailVerificationTokenRecord | null> {
  const sql = await withTokensTable();
  if (sql) {
    const rows = await sql`
      SELECT id, username, email, token_hash, expires_at, consumed_at, created_at
      FROM email_verification_tokens
      WHERE token_hash = ${tokenHash}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return rows[0] ? toRecord(rows[0] as PersistedTokenRecord) : null;
  }

  const tokens = (await readTokensFromFile()).map(toRecord);
  return tokens
    .filter((entry) => entry.tokenHash === tokenHash)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function consumeEmailVerificationToken(id: string): Promise<void> {
  const sql = await withTokensTable();
  if (sql) {
    await sql`
      UPDATE email_verification_tokens
      SET consumed_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    return;
  }

  const tokens = (await readTokensFromFile()).map(toRecord);
  const next = tokens.map((entry) =>
    entry.id === id ? { ...entry, consumedAt: new Date().toISOString() } : entry
  );
  await writeTokensToFile(next.map(fromRecord));
}

