/**
 * @deprecated DO NOT IMPORT.
 *
 * This file used to export NextAuth `authOptions` for `getServerSession()`.
 * The app's real auth lives in `lib/auth/session` (cookie-backed signed
 * sessions). NextAuth has been reduced to an empty provider list for
 * SessionProvider compatibility only.
 *
 * Importing this file pulls in `getServerSession`, which would validate
 * legacy NextAuth JWTs (signed with the unchanged NEXTAUTH_SECRET back
 * when the CredentialsProvider stub accepted any username/password) and
 * silently impersonate users. See the internal security audit (finding C-1).
 *
 * Use `getSessionUsername()` from `@/lib/auth/session` instead.
 */
export {};
