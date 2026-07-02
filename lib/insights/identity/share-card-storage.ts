/**
 * Persistence for public identity share cards (see migration 098). One row per
 * user; the opaque token backs the public /i/<token> page whose Open Graph image
 * is the uploaded PNG.
 */

import { randomBytes } from "crypto";
import { db } from "@/lib/db/client";

export interface IdentityShareCard {
  token: string;
  username: string;
  imageUrl: string;
  classPrimary: string | null;
  classSecondary: string | null;
  locale: string | null;
  updatedAt: string;
}

interface Row {
  token: string;
  username: string;
  image_url: string;
  class_primary: string | null;
  class_secondary: string | null;
  locale: string | null;
  updated_at: string;
}

function toCard(r: Row): IdentityShareCard {
  return {
    token: r.token,
    username: r.username,
    imageUrl: r.image_url,
    classPrimary: r.class_primary,
    classSecondary: r.class_secondary,
    locale: r.locale,
    updatedAt: r.updated_at,
  };
}

function newToken(): string {
  return randomBytes(9).toString("base64url");
}

/**
 * Return the user's stable share token, creating the row on first share. The
 * token is needed before the blob upload (it forms the blob path), so image_url
 * starts empty and is filled by {@link updateShareCard} once the PNG is stored.
 */
export async function getOrCreateShareToken(username: string): Promise<string> {
  const { rows } = await db.query<{ token: string }>(
    `
INSERT INTO identity_share_cards (token, username, image_url)
VALUES ($1, $2, '')
ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
RETURNING token
`,
    [newToken(), username],
  );
  return rows[0].token;
}

export async function updateShareCard(
  token: string,
  fields: { imageUrl: string; classPrimary: string; classSecondary: string; locale: string },
): Promise<void> {
  await db.query(
    `
UPDATE identity_share_cards
SET image_url = $1, class_primary = $2, class_secondary = $3, locale = $4, updated_at = NOW()
WHERE token = $5
`,
    [fields.imageUrl, fields.classPrimary, fields.classSecondary, fields.locale, token],
  );
}

export async function getShareCardByToken(token: string): Promise<IdentityShareCard | null> {
  const { rows } = await db.query<Row>(
    `SELECT token, username, image_url, class_primary, class_secondary, locale, updated_at
     FROM identity_share_cards WHERE token = $1`,
    [token],
  );
  const r = rows[0];
  return r && r.image_url ? toCard(r) : null;
}
