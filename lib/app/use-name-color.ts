"use client";

import { useAppProfile } from "@/lib/app/profile-context";
import { useTheme } from "@/lib/theme/theme-context";
import { resolveNameColorHex } from "@/config/name-colors";

/**
 * Resolved hex for the current user's name-color cosmetic (account-level-4
 * unlock), or null when there is no valid override — callers keep their default
 * name color. Theme-aware: re-resolves when the app switches light/dark.
 */
export function useOwnNameColor(): string | null {
  const { profile } = useAppProfile();
  const { theme } = useTheme();
  return resolveNameColorHex(profile?.nameColor, theme);
}
