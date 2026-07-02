const MINIMUM_ACCOUNT_AGE = 18;

export function getMaximumAllowedBirthDate(referenceDate = new Date()): string {
  const max = new Date(Date.UTC(
    referenceDate.getUTCFullYear() - MINIMUM_ACCOUNT_AGE,
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));
  return max.toISOString().slice(0, 10);
}

export function isAdultBirthDate(birthDate: string, referenceDate = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return false;
  }

  const parsed = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return birthDate <= getMaximumAllowedBirthDate(referenceDate);
}

