/**
 * Slot 1/2/3 category options and Account Level unlock (Master v4).
 * general = no slot; slot1/slot2/slot3 = bonus category slots.
 */

export const SLOT_CATEGORY_OPTIONS: Record<string, string[]> = {
  slot1: ["grocery", "marketplace", "supermarket"],
  slot2: ["restaurant", "cafe", "delivery"],
  slot3: ["travel", "fuel", "retail"],
};

/** Minimum account level to unlock slot (e.g. slot2 at level 5). */
export const SLOT_UNLOCK_LEVEL: Record<string, number> = {
  slot1: 1,
  slot2: 5,
  slot3: 10,
};

export function getUnlockedSlotsForAccountLevel(accountLevel: number): string[] {
  const slots: string[] = [];
  for (const [slot, level] of Object.entries(SLOT_UNLOCK_LEVEL)) {
    if (accountLevel >= level) slots.push(slot);
  }
  return slots;
}
