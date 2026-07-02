"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { YumbieCompanion } from "@/components/app/home/yumbie-companion";
import type { YumbieMood, YumbieExpression } from "@/lib/app/use-yumbie-mood";
import { getEnabledCountries, getCountryByName } from "@/lib/shared/countries";
import {
  TRANSLATIONS,
  SUPPORTED_LANGS,
  getIncomeOptions,
  type Lang,
} from "./i18n";
import { subscribeToPush, wantsOsPushNotifications } from "@/lib/app/push-subscribe";

const WHY_REASONS = [
  { key: "fin_track", lens: "FINANCIAL" as const },
  { key: "min_goals", lens: "MINER" as const },
  { key: "fin_budget", lens: "FINANCIAL" as const },
  { key: "min_habits", lens: "MINER" as const },
  { key: "fin_save", lens: "FINANCIAL" as const },
  { key: "com_motivation", lens: "COMPANION" as const },
  { key: "min_freedom", lens: "MINER" as const },
];

const TONE_OPTIONS = [
  { key: "warm", icon: "☺️", labelKey: "toneWarm", descKey: "toneWarmDesc" },
  { key: "professional", icon: "🧑‍💼", labelKey: "toneProfessional", descKey: "toneProfessionalDesc" },
  { key: "energetic", icon: "⚡", labelKey: "toneEnergetic", descKey: "toneEnergeticDesc" },
] as const;

const NOTIF_OPTIONS = [
  { key: "important_only", icon: "🔕", labelKey: "notifImportant", descKey: "notifImportantDesc" },
  { key: "daily", icon: "🔔", labelKey: "notifDaily", descKey: "notifDailyDesc" },
  { key: "frequent", icon: "📣", labelKey: "notifFrequent", descKey: "notifFrequentDesc" },
] as const;

type WelcomePageClientProps = {
  initialLang: Lang;
};

export default function WelcomePageClient({ initialLang }: WelcomePageClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 | 1 | 2 | 3 (done)
  const [lang, setLang] = useState<Lang>(initialLang);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Yumbie reactive state
  const [mood, setMood] = useState<YumbieMood>("idle");
  const [expression, setExpression] = useState<YumbieExpression>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);
  const [country, setCountry] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [whyReasons, setWhyReasons] = useState<string[]>([]);
  const [tone, setTone] = useState<"warm" | "professional" | "energetic">("warm");
  const [notifFreq, setNotifFreq] = useState<"important_only" | "daily" | "frequent">("daily");

  const t = TRANSLATIONS[lang];
  const countries = useMemo(() => getEnabledCountries(), []);
  const selectedCurrency = useMemo(() => {
    const c = country ? getCountryByName(country) : undefined;
    return c?.currency ?? "USD";
  }, [country]);
  const incomeOptions = useMemo(
    () => getIncomeOptions(selectedCurrency, lang),
    [selectedCurrency, lang],
  );

  // Debounced name reaction
  const nameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNameChange = (value: string) => {
    setDisplayName(value);
    if (nameTimeoutRef.current) clearTimeout(nameTimeoutRef.current);
    if (value.trim().length >= 2) {
      nameTimeoutRef.current = setTimeout(() => {
        setMood("happy");
        setExpression(null);
      }, 700);
    } else {
      setMood("idle");
      setExpression(null);
    }
  };

  // Gender reaction
  const handleGenderSelect = (g: "male" | "female" | "other") => {
    setGender(g);
    if (g === "male") {
      setMood("idle");
      setExpression(null);
    } else if (g === "female") {
      setMood("happy");
      setExpression(null);
    } else {
      setMood("happy");
      setExpression(null);
    }
  };

  // Income reaction
  const handleIncomeSelect = (key: string) => {
    setIncomeRange(key);
    const idx = incomeOptions.findIndex((o) => o.key === key);
    if (idx <= 1) {
      setMood("idle");
      setExpression(null);
    } else if (idx === 2) {
      setMood("happy");
      setExpression(null);
    } else {
      // high income -> star eyes
      setMood("happy");
      setExpression("celebrate");
      setTimeout(() => setExpression(null), 2000);
    }
  };

  // Why reasons reaction
  const toggleReason = (key: string) => {
    setWhyReasons((prev) => {
      const next = prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key];
      if (next.length >= 2) {
        setMood("happy");
        setExpression(null);
      }
      return next;
    });
  };

  // Tone reaction
  const handleToneSelect = (tKey: "warm" | "professional" | "energetic") => {
    setTone(tKey);
    if (tKey === "warm") {
      setMood("happy");
      setExpression(null);
    } else if (tKey === "professional") {
      setMood("worried");
      setExpression(null);
    } else {
      setMood("happy");
      setExpression("celebrate");
      setTimeout(() => setExpression(null), 2000);
    }
  };

  // Notification reaction
  const handleNotifSelect = (nKey: "important_only" | "daily" | "frequent") => {
    setNotifFreq(nKey);
    if (nKey === "important_only") {
      setMood("worried");
      setExpression(null);
    } else if (nKey === "daily") {
      setMood("happy");
      setExpression(null);
    } else {
      setMood("happy");
      setExpression("celebrate");
      setTimeout(() => setExpression(null), 2000);
    }
  };

  const canProceedStep0 = displayName.trim().length >= 2;

  const handleNext = () => {
    setError("");
    if (step === 0 && !canProceedStep0) {
      setError(t.displayNameRequired);
      return;
    }
    if (step < 2) {
      setStep((s) => s + 1);
      // Reset Yumbie to idle when entering new step
      setMood("idle");
      setExpression(null);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setMood("idle");
      setExpression(null);
    }
  };

  const handleSkip = () => {
    if (step < 2) {
      setStep((s) => s + 1);
      setMood("idle");
      setExpression(null);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError("");
    // Request OS permission while the Finish click is still a valid user gesture.
    if (wantsOsPushNotifications(notifFreq)) {
      void subscribeToPush();
    }
    try {
      const res = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          age: age ? parseInt(age, 10) : null,
          gender,
          country: country || null,
          monthly_income_range: incomeRange || null,
          why_yumo_reasons: whyReasons,
          tone_preference: tone,
          notification_frequency: notifFreq,
          onboarding_language: lang,
        }),
      });
      if (res.ok) {
        setStep(3);
        setMood("happy");
        setExpression("celebrate");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t.genericError);
      }
    } catch {
      setError(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToDashboard = () => {
    router.push("/app");
  };

  return (
    <div className="min-h-screen bg-app-bg-base text-app-text-primary flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between gap-3 mb-6">
        <div className="text-xs font-medium text-app-text-muted uppercase tracking-wider truncate">
          {t.headerLabel}
        </div>
        <div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label="Language"
            className="text-xs h-7 pl-2 pr-7 rounded-full bg-app-bg-surface text-app-text-primary border border-app-border hover:border-app-border-strong focus:outline-none focus:border-app-gold/50 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235A6680' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            {SUPPORTED_LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} — {l.nativeLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Yumbie */}
      <div className="mb-4">
        <YumbieCompanion
          mood={mood}
          expression={expression}
          className="h-36 w-36 sm:h-44 sm:w-44"
        />
      </div>

      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center gap-2 mb-6">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-8 bg-app-gold"
                  : s < step
                    ? "w-4 bg-app-gold/60"
                    : "w-4 bg-app-bg-surface3"
              }`}
            />
          ))}
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-md bg-app-bg-elevated border border-app-border rounded-2xl p-5 sm:p-6 shadow-lg">
        {step === 0 && (
          <>
            <h1 className="text-headline-sm text-app-text-primary mb-1">
              {t.personalInfoTitle}
            </h1>
            <p className="text-body-sm text-app-text-muted mb-5">
              {t.personalInfoSubtitle}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-1.5">
                  {t.displayNameLabel}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t.displayNamePlaceholder}
                  maxLength={50}
                  className="w-full h-11 px-3 rounded-xl bg-app-bg-surface border border-app-border text-app-text-primary placeholder:text-app-text-muted focus:outline-none focus:border-app-gold/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-1.5">
                  {t.ageLabel}
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t.agePlaceholder}
                  min={13}
                  max={99}
                  className="w-full h-11 px-3 rounded-xl bg-app-bg-surface border border-app-border text-app-text-primary placeholder:text-app-text-muted focus:outline-none focus:border-app-gold/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-1.5">
                  {t.genderLabel}
                </label>
                <div className="flex gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGenderSelect(g)}
                      className={`flex-1 h-10 rounded-xl text-sm font-medium border transition-all ${
                        gender === g
                          ? "bg-app-gold text-black border-app-gold"
                          : "bg-app-bg-surface text-app-text-secondary border-app-border hover:border-app-border-strong"
                      }`}
                    >
                      {g === "male"
                        ? t.genderMale
                        : g === "female"
                          ? t.genderFemale
                          : t.genderOther}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-1.5">
                  {t.countryLabel}
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-app-bg-surface border border-app-border text-app-text-primary focus:outline-none focus:border-app-gold/50 transition-colors appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A6680' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="">{t.countryPlaceholder}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-headline-sm text-app-text-primary mb-1">
              {t.financialTitle}
            </h1>
            <p className="text-body-sm text-app-text-muted mb-5">
              {t.financialSubtitle}
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-1.5">
                  {t.incomeLabel}
                </label>
                <select
                  value={incomeRange}
                  onChange={(e) => handleIncomeSelect(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-app-bg-surface border border-app-border text-app-text-primary focus:outline-none focus:border-app-gold/50 transition-colors appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A6680' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="">{t.incomePlaceholder}</option>
                  {incomeOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {!country && (
                  <p className="mt-1.5 text-[11px] text-app-text-muted">
                    {t.incomeSelectCountryHint}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-1">
                  {t.whyYumoTitle}
                </label>
                <p className="text-xs text-app-text-muted mb-2.5">{t.whyYumoSubtitle}</p>
                <div className="grid grid-cols-1 gap-2">
                  {WHY_REASONS.map((r) => {
                    const selected = whyReasons.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        onClick={() => toggleReason(r.key)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                          selected
                            ? "bg-app-gold/10 border-app-gold/40 text-app-text-primary"
                            : "bg-app-bg-surface border-app-border text-app-text-secondary hover:border-app-border-strong"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                            selected
                              ? "bg-app-gold border-app-gold"
                              : "border-app-text-muted"
                          }`}
                        >
                          {selected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>

                        {String(t[`reason_${r.key}` as keyof typeof t])}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-headline-sm text-app-text-primary mb-1">
              {t.yumbieSettingsTitle}
            </h1>
            <p className="text-body-sm text-app-text-muted mb-5">
              {t.yumbieSettingsSubtitle}
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-2">
                  {t.toneLabel}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TONE_OPTIONS.map((o) => {
                    const selected = tone === (o.key as typeof tone);
                    return (
                      <button
                        key={o.key}
                        onClick={() =>
                          handleToneSelect(o.key as "warm" | "professional" | "energetic")
                        }
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          selected
                            ? "bg-app-gold/10 border-app-gold/40 text-app-text-primary"
                            : "bg-app-bg-surface border-app-border text-app-text-secondary hover:border-app-border-strong"
                        }`}
                      >
                        <span className="text-lg">{o.icon}</span>
                        <div>
                          <div className="text-sm font-medium">
                            {String(t[o.labelKey as keyof typeof t] ?? "")}
                          </div>
                          <div className="text-xs text-app-text-muted">
                            {String(t[o.descKey as keyof typeof t] ?? "")}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-app-text-secondary mb-2">
                  {t.notificationLabel}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {NOTIF_OPTIONS.map((o) => {
                    const selected = notifFreq === (o.key as typeof notifFreq);
                    return (
                      <button
                        key={o.key}
                        onClick={() =>
                          handleNotifSelect(o.key as "important_only" | "daily" | "frequent")
                        }
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          selected
                            ? "bg-app-gold/10 border-app-gold/40 text-app-text-primary"
                            : "bg-app-bg-surface border-app-border text-app-text-secondary hover:border-app-border-strong"
                        }`}
                      >
                        <span className="text-lg">{o.icon}</span>
                        <div>
                          <div className="text-sm font-medium">
                            {String(t[o.labelKey as keyof typeof t] ?? "")}
                          </div>
                          <div className="text-xs text-app-text-muted">
                            {String(t[o.descKey as keyof typeof t] ?? "")}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <h1 className="text-headline text-app-text-primary mb-2">{t.doneTitle}</h1>
            <p className="text-body-sm text-app-text-muted mb-6">{t.doneSubtitle}</p>
            <button
              onClick={goToDashboard}
              className="h-12 w-full rounded-2xl bg-app-gold text-black font-semibold hover:bg-app-gold-light transition-colors"
            >
              {t.goToApp}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="mt-6 flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="h-11 px-4 rounded-xl bg-app-bg-surface text-app-text-secondary text-sm font-medium border border-app-border hover:border-app-border-strong transition-colors"
              >
                {t.back}
              </button>
            )}
            <button
              onClick={step === 2 ? handleFinish : handleNext}
              disabled={step === 0 && !canProceedStep0}
              className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-colors ${
                step === 0 && !canProceedStep0
                  ? "bg-app-bg-surface3 text-app-text-muted cursor-not-allowed"
                  : "bg-app-gold text-black hover:bg-app-gold-light"
              }`}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.savingLabel}
                </span>
              ) : step === 2 ? (
                t.finish
              ) : (
                t.next
              )}
            </button>
            {step < 2 && (
              <button
                onClick={handleSkip}
                className="h-11 px-4 rounded-xl bg-transparent text-app-text-muted text-sm font-medium hover:text-app-text-secondary transition-colors"
              >
                {t.skip}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step label */}
      {step < 3 && (
        <div className="mt-4 text-xs text-app-text-muted">
          {t.stepIndicator(step + 1, 3)}
        </div>
      )}
    </div>
  );
}
