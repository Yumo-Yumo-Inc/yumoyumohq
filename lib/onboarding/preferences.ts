import { sql } from "@/lib/db/client";

export interface OnboardingInput {
  display_name: string;
  age: number | null;
  gender: string | null;
  country: string | null;
  monthly_income_range: string | null;
  why_yumo_reasons: string[];
  tone_preference: string;
  notification_frequency: string;
  onboarding_language: string;
}

export async function saveOnboardingPreferences(
  username: string,
  input: OnboardingInput
): Promise<void> {
  // 1. Update user_profiles
  const birthYear = input.age ? new Date().getFullYear() - input.age : null;
  const birthDate = birthYear ? `${birthYear}-01-01` : null;

  await sql`
    UPDATE user_profiles SET
      display_name = ${input.display_name.trim()},
      gender       = ${input.gender},
      birth_date   = ${birthDate}::date,
      country      = ${input.country},
      updated_at   = NOW()
    WHERE username = ${username}
  `;

  // 2. user_companion_preferences upsert
  await sql`
    INSERT INTO user_companion_preferences (
      username,
      monthly_income_range,
      why_yumo_reasons,
      tone_preference,
      notification_frequency,
      onboarding_language,
      onboarding_completed_at,
      updated_at
    ) VALUES (
      ${username},
      ${input.monthly_income_range},
      ${input.why_yumo_reasons},
      ${input.tone_preference},
      ${input.notification_frequency},
      ${input.onboarding_language},
      NOW(),
      NOW()
    )
    ON CONFLICT (username) DO UPDATE SET
      monthly_income_range    = EXCLUDED.monthly_income_range,
      why_yumo_reasons        = EXCLUDED.why_yumo_reasons,
      tone_preference         = EXCLUDED.tone_preference,
      notification_frequency  = EXCLUDED.notification_frequency,
      onboarding_language     = EXCLUDED.onboarding_language,
      onboarding_completed_at = NOW(),
      updated_at              = NOW()
  `;

  // 3. Lens seed: calculate and set user_companion_profile dominant_lens
  const lensScores = computeInitialLensScores(input.why_yumo_reasons);
  const dominantLens = lensScores.dominant;

  await sql`
    INSERT INTO user_companion_profile (
      username,
      financial_lens_score,
      companion_lens_score,
      miner_lens_score,
      dominant_lens,
      emotional_state,
      updated_at
    ) VALUES (
      ${username},
      ${lensScores.financial},
      ${lensScores.companion},
      ${lensScores.miner},
      ${dominantLens},
      'CURIOUS',
      NOW()
    )
    ON CONFLICT (username) DO UPDATE SET
      financial_lens_score = EXCLUDED.financial_lens_score,
      companion_lens_score = EXCLUDED.companion_lens_score,
      miner_lens_score     = EXCLUDED.miner_lens_score,
      dominant_lens        = EXCLUDED.dominant_lens,
      updated_at           = NOW()
  `;
}

export async function isOnboardingPending(username: string): Promise<boolean> {
  const rows = await sql`
    SELECT onboarding_completed_at
    FROM user_companion_preferences
    WHERE username = ${username}
    LIMIT 1
  `;
  if (rows.length === 0) return true;
  const row = rows[0] as { onboarding_completed_at: string | null };
  return row.onboarding_completed_at == null;
}

// why_yumo_reasons → lens score
// Each selection adds +20 points to the relevant lens (max 100)
function computeInitialLensScores(reasons: string[]): {
  financial: number;
  companion: number;
  miner: number;
  dominant: "FINANCIAL" | "COMPANION" | "MINER";
} {
  const FIN_REASONS = ["fin_track", "fin_budget", "fin_save"];
  const MIN_REASONS = ["min_goals", "min_habits", "min_freedom"];
  const COM_REASONS = ["com_motivation"];

  const fin = Math.min(100, reasons.filter((r) => FIN_REASONS.includes(r)).length * 20);
  const com = Math.min(100, reasons.filter((r) => COM_REASONS.includes(r)).length * 40);
  const min = Math.min(100, reasons.filter((r) => MIN_REASONS.includes(r)).length * 20);

  // Default to COMPANION when there is no selection
  if (fin === 0 && com === 0 && min === 0) {
    return { financial: 0, companion: 50, miner: 0, dominant: "COMPANION" };
  }

  const dominant =
    fin >= com && fin >= min
      ? "FINANCIAL"
      : min >= com && min >= fin
        ? "MINER"
        : "COMPANION";

  return { financial: fin, companion: com, miner: min, dominant };
}
