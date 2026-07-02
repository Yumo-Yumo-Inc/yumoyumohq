import crypto from "crypto";
import { getEmailLinkBaseUrl } from "@/lib/auth/email-link-base-url";
import {
  consumeEmailVerificationToken,
  findEmailVerificationTokenByHash,
  getLatestEmailVerificationTokenForUser,
  replaceEmailVerificationToken,
} from "@/lib/storage/email-verification-storage";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
export const EMAIL_RESEND_COOLDOWN_MS = 1000 * 60;

export function createEmailVerificationSecret() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    token,
    tokenHash,
    expiresAt: new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
    createdAt: now.toISOString(),
  };
}

export function buildVerificationUrl(token: string): string {
  const url = new URL("/api/auth/verify-email", getEmailLinkBaseUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function issueEmailVerificationToken(username: string, email: string) {
  const secret = createEmailVerificationSecret();
  await replaceEmailVerificationToken({
    id: secret.id,
    username,
    email,
    tokenHash: secret.tokenHash,
    expiresAt: secret.expiresAt,
    consumedAt: null,
    createdAt: secret.createdAt,
  });

  return {
    token: secret.token,
    verificationUrl: buildVerificationUrl(secret.token),
    expiresAt: secret.expiresAt,
  };
}

export async function validateEmailVerificationToken(token: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await findEmailVerificationTokenByHash(tokenHash);

  if (!record) {
    return { status: "invalid" as const, record: null };
  }

  if (record.consumedAt) {
    return { status: "consumed" as const, record };
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { status: "expired" as const, record };
  }

  return { status: "valid" as const, record };
}

export async function markEmailVerificationTokenConsumed(id: string) {
  await consumeEmailVerificationToken(id);
}

export async function isEmailVerificationResendCoolingDown(username: string): Promise<boolean> {
  const latest = await getLatestEmailVerificationTokenForUser(username);
  if (!latest) return false;
  return Date.now() - new Date(latest.createdAt).getTime() < EMAIL_RESEND_COOLDOWN_MS;
}

