export function isCountryRequiredErrorPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as { code?: unknown; error?: unknown };
  return (
    candidate.code === "COUNTRY_REQUIRED" ||
    candidate.error === "Please select your country first"
  );
}
