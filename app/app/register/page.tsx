"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, Mail, Sparkles, Star, UserPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/auth/turnstile-widget";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translateApiError, useAppLocale } from "@/lib/i18n/app-context";
import { getMaximumAllowedBirthDate } from "@/lib/legal/age";
import { getEnabledCountries, OTHER_COUNTRY_CODE } from "@/lib/shared/countries";
import { REFERRAL_REF_STORAGE_KEY } from "@/lib/referral/referral-link";

const countries = getEnabledCountries();
const isCaptchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { t, locale: appLocale, setLocale: setAppLocale } = useAppLocale();
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref")?.trim() || "";
  const [storedRef, setStoredRef] = useState("");
  const refCode = refFromUrl || storedRef;
  const maximumBirthDate = getMaximumAllowedBirthDate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const captchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const legalBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const { hostname, protocol } = window.location;
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return "";
    }
    if (hostname.startsWith("app.")) {
      return `${protocol}//${hostname.replace(/^app\./, "")}`;
    }
    return `${protocol}//${hostname}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (refFromUrl) {
      sessionStorage.setItem(REFERRAL_REF_STORAGE_KEY, refFromUrl);
      setStoredRef(refFromUrl);
      return;
    }
    setStoredRef(sessionStorage.getItem(REFERRAL_REF_STORAGE_KEY) || "");
  }, [refFromUrl]);

  const loginHref = refCode
    ? `/app/login?ref=${encodeURIComponent(refCode)}`
    : "/app/login";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError(t("auth.register.legalRequired"));
      return;
    }

    setIsLoading(true);
    let verifiedCaptchaToken = captchaToken;
    if (isCaptchaRequired && !verifiedCaptchaToken) {
      verifiedCaptchaToken = await captchaRef.current?.execute() ?? null;
      if (!verifiedCaptchaToken) {
        setError(t("auth.register.captchaRequired"));
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username,
          password,
          country,
          birthDate,
          locale: appLocale,
          termsAccepted,
          privacyAccepted,
          captchaToken: verifiedCaptchaToken,
          ...(refCode ? { ref: refCode } : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(translateApiError(data.error, t, true));
        setCaptchaToken(null);
        captchaRef.current?.reset();
        setCaptchaResetKey((value) => value + 1);
        setIsLoading(false);
        return;
      }

      const verifyUrl = new URL("/app/verify-email", window.location.origin);
      verifyUrl.searchParams.set("status", "pending");
      if (data.emailSent === false) {
        verifyUrl.searchParams.set("emailSent", "0");
      }
      sessionStorage.removeItem(REFERRAL_REF_STORAGE_KEY);
      window.location.href = verifyUrl.toString();
    } catch (requestError: unknown) {
      if (
        requestError instanceof TypeError ||
        (requestError instanceof Error && requestError.message.includes("Failed to fetch"))
      ) {
        setError(t("errors.login.noInternet"));
      } else {
        setError(t("errors.api.registrationFailed"));
      }
      setCaptchaToken(null);
      captchaRef.current?.reset();
      setCaptchaResetKey((value) => value + 1);
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      badge={t("auth.register.badge")}
      headline={t("auth.register.headline")}
      subheadline={t("auth.register.subheadline")}
      icon={<UserPlus className="h-6 w-6" />}
      title={t("auth.register.title")}
      description={t("auth.register.description")}
      features={[
        {
          title: t("auth.register.featureSecureTitle"),
          body: t("auth.register.featureSecureBody"),
        },
        {
          title: t("auth.register.featureRewardsTitle"),
          body: t("auth.register.featureRewardsBody"),
        },
        {
          title: t("auth.register.featureProfileTitle"),
          body: t("auth.register.featureProfileBody"),
        },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-locale">{t("auth.register.locale")}</Label>
          <Select
            value={appLocale}
            onValueChange={(value) => setAppLocale(value as "tr" | "en" | "ru" | "th" | "es" | "zh")}
            disabled={isLoading}
          >
            <SelectTrigger
              id="register-locale"
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
              <SelectItem value="ru">🇷🇺 Русский</SelectItem>
              <SelectItem value="th">🇹🇭 ไทย</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="zh">🇨🇳 简体中文</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-white/45">{t("auth.register.localeHint")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="register-email">{t("auth.register.email")}</Label>
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={appLocale === "tr" ? "ornek@eposta.com" : "name@example.com"}
              autoComplete="email"
              disabled={isLoading}
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-username">{t("auth.register.username")}</Label>
            <Input
              id="register-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={appLocale === "tr" ? "ornek_kullanici" : "yumouser"}
              autoComplete="username"
              disabled={isLoading}
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-country">{t("auth.register.country")}</Label>
            <Select value={country} onValueChange={setCountry} disabled={isLoading}>
              <SelectTrigger
                id="register-country"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
              >
                <SelectValue placeholder={t("auth.register.countryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
                <SelectItem
                  value={OTHER_COUNTRY_CODE}
                  className="mt-1 border-t border-white/10 pt-2"
                >
                  <span className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-amber-300" fill="currentColor" />
                    {t("auth.register.countryOther")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Always-on immutability notice — country is locked after signup. */}
            <p className="flex items-start gap-1.5 text-xs leading-5 text-white/45">
              <Lock className="mt-0.5 h-3 w-3 shrink-0 text-white/35" />
              <span>{t("auth.register.countryLockNotice")}</span>
            </p>

            {/* "Other" caution callout — no integration → no on-chain, no reward. */}
            <AnimatePresence initial={false}>
              {country === OTHER_COUNTRY_CODE ? (
                <motion.div
                  key="other-notice"
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 flex items-start gap-2.5 rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-500/[0.12] to-amber-500/[0.04] px-3.5 py-3 shadow-[0_8px_24px_-12px_rgba(245,158,11,0.4)]">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-semibold text-amber-100">
                        {t("auth.register.countryOtherStarTitle")}
                      </p>
                      <p className="text-xs leading-5 text-amber-100/80">
                        {t("auth.register.countryOtherNotice")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-birth-date">{t("auth.register.birthDate")}</Label>
            <Input
              id="register-birth-date"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              max={maximumBirthDate}
              disabled={isLoading}
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35 [color-scheme:dark]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">{t("auth.register.password")}</Label>
            <Input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              required
            />
            <p className="text-xs text-white/45">{t("auth.register.passwordHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password-confirm">{t("auth.register.confirmPassword")}</Label>
            <Input
              id="register-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              className={`h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35 ${confirmPassword.length > 0 && password !== confirmPassword ? "border-red-500/60" : ""}`}
              required
            />
            {confirmPassword.length > 0 && password !== confirmPassword ? (
              <p className="text-xs text-red-400">{t("auth.register.passwordMismatch")}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("auth.register.captchaLabel")}</Label>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
            <TurnstileWidget
              ref={captchaRef}
              onTokenChange={setCaptchaToken}
              resetKey={captchaResetKey}
              execution="render"
              appearance="always"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          <p className="mb-4 leading-6 text-white/65">{t("auth.register.legalNotice")}</p>
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-1 border-white/25 data-[state=checked]:bg-app-gold data-[state=checked]:text-black"
              />
              <span className="leading-6">
                {t("auth.register.acceptTermsPrefix")}{" "}
                <Link
                  href={`${legalBaseUrl}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-app-gold hover:text-app-gold-light"
                >
                  {t("auth.register.acceptTermsLink")}
                </Link>{" "}
                {t("auth.register.acceptTermsSuffix")}
              </span>
            </label>
            <label className="flex items-start gap-3">
              <Checkbox
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                className="mt-1 border-white/25 data-[state=checked]:bg-app-gold data-[state=checked]:text-black"
              />
              <span className="leading-6">
                {t("auth.register.acceptPrivacyPrefix")}{" "}
                <Link
                  href={`${legalBaseUrl}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-app-gold hover:text-app-gold-light"
                >
                  {t("auth.register.acceptPrivacyLink")}
                </Link>{" "}
                {t("auth.register.acceptPrivacySuffix")}
              </span>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-2xl bg-app-gold text-black hover:bg-app-gold-light"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.register.submitting")}
            </>
          ) : (
            t("auth.register.submit")
          )}
        </Button>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-app-gold" />
            <p>{t("auth.register.verifyHint")}</p>
          </div>
        </div>

        <p className="text-center text-sm text-white/55">
          {t("auth.register.haveAccount")}{" "}
          <Link href={loginHref} className="text-app-gold hover:text-app-gold-light">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
