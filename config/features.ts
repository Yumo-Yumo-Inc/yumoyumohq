/**
 * Feature flags.
 *
 * MESSAGING_ENABLED — direct messaging between friends is BUILT but intentionally
 * NOT launched. It stays off until the governance layer is in place: block +
 * report, a message retention/auto-purge policy, and the ToS / KVKK-GDPR
 * disclosure updates. Flip to `true` only after those ship. While false, the
 * messaging UI is hidden, the /app/messages routes redirect, and the
 * /api/messages endpoints return 404.
 */
export const MESSAGING_ENABLED = false;
