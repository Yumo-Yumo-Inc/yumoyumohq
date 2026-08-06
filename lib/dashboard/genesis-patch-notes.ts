/**
 * Genesis season patch-notes popup — dashboard campaign window + permanent opt-out.
 *
 * - "Don't show again" → localStorage never flag.
 * - Dismiss without opt-out → shows again on each dashboard visit until campaign end.
 */

const GENESIS_PATCH_NOTES_DISMISS_KEY = "yumo.dashboard.genesis-patch-notes.v1";

/** Campaign ends end of 9 July 2026 (UTC+7), two days after Genesis launch. */
const GENESIS_PATCH_NOTES_CAMPAIGN_END_MS = Date.parse("2026-07-09T23:59:59+07:00");

function isGenesisPatchNotesCampaignActive(now = Date.now()): boolean {
  return now <= GENESIS_PATCH_NOTES_CAMPAIGN_END_MS;
}

function isGenesisPatchNotesPermanentlyDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(GENESIS_PATCH_NOTES_DISMISS_KEY) === "never";
  } catch {
    return true;
  }
}

export function shouldShowGenesisPatchNotes(now = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  if (!isGenesisPatchNotesCampaignActive(now)) return false;
  if (isGenesisPatchNotesPermanentlyDismissed()) return false;
  return true;
}

export function dismissGenesisPatchNotesPermanent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GENESIS_PATCH_NOTES_DISMISS_KEY, "never");
  } catch {
    // localStorage unavailable — ignore
  }
}
