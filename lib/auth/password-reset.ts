import crypto from "crypto";
import { getEmailLinkBaseUrl } from "@/lib/auth/email-link-base-url";
import {
  consumePasswordResetToken,
  findPasswordResetTokenByHash,
  getLatestPasswordResetTokenForUser,
  replacePasswordResetToken,
} from "@/lib/storage/password-reset-storage";

const TOKEN_TTL_MS = 1000 * 60 * 60;
export const PASSWORD_RESET_COOLDOWN_MS = 1000 * 60;

function createPasswordResetSecret() {
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

export function buildPasswordResetUrl(token: string): string {
  const url = new URL("/app/reset-password", getEmailLinkBaseUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function issuePasswordResetToken(username: string, email: string) {
  const secret = createPasswordResetSecret();
  await replacePasswordResetToken({
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
    resetUrl: buildPasswordResetUrl(secret.token),
    expiresAt: secret.expiresAt,
  };
}

export async function validatePasswordResetToken(token: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await findPasswordResetTokenByHash(tokenHash);

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

export async function markPasswordResetTokenConsumed(id: string) {
  await consumePasswordResetToken(id);
}

export async function isPasswordResetCoolingDown(username: string): Promise<boolean> {
  const latest = await getLatestPasswordResetTokenForUser(username);
  if (!latest) return false;
  return Date.now() - new Date(latest.createdAt).getTime() < PASSWORD_RESET_COOLDOWN_MS;
}
