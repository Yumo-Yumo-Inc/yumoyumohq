/**
 * Admin user list from environment (no hardcoded usernames in source).
 *
 * Required in .env:
 *   ADMIN_USERNAME=your_admin_username
 *   # or for multiple: ADMIN_USERNAMES=admin1,admin2,admin3
 *
 * Optional (comma-separated):
 *   WHATSAPP_EXEMPT_USERNAMES=user1,user2  - exempt from WhatsApp/chat export filename rule
 *   MULTI_COUNTRY_USERNAMES=user1,user2    - can upload from any country without selection
 *   SMALL_FILE_EXEMPT_USERNAMES=user1,user2 - exempt from small-file (<600KB) penalty
 */
function parseUserList(envKey: string): string[] {
  const raw = process.env[envKey] ?? "";
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getAdminUsers(): string[] {
  const fromNames = parseUserList("ADMIN_USERNAMES");
  if (fromNames.length > 0) return fromNames;
  const fromSingle = parseUserList("ADMIN_USERNAME");
  return fromSingle.length > 0 ? fromSingle : [];
}

/** First admin (for leaderboard exclusion etc). Empty string if none configured. */
export function getPrimaryAdmin(): string {
  return getAdminUsers()[0] ?? "";
}

/** Check if username is admin */
export function isAdminUser(username: string | null): boolean {
  if (!username) return false;
  return getAdminUsers().includes(username);
}

/** Users exempt from WhatsApp/chat export filename rule */
export function getWhatsAppExemptUsernames(): string[] {
  return parseUserList("WHATSAPP_EXEMPT_USERNAMES");
}

/** Users who can upload from any country without country selection */
export function getMultiCountryUsernames(): string[] {
  return parseUserList("MULTI_COUNTRY_USERNAMES");
}

/** Users exempt from small-file (<600KB) penalty */
export function getSmallFileExemptUsernames(): string[] {
  return parseUserList("SMALL_FILE_EXEMPT_USERNAMES");
}
