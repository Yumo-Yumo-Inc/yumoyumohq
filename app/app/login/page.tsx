"use client";

import Link from "next/link";
import { Suspense, useMemo, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/auth/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateApiError, useAppLocale } from "@/lib/i18n/app-context";
import { clearOfflineSessionCache } from "@/lib/offline/cache";

const isCaptchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function LoginPageContent() {
  const { t, locale } = useAppLocale();
  const captchaLabel = t("auth.login.captchaLabel");
  const resolvedCaptchaLabel =
    captchaLabel === "auth.login.captchaLabel"
      ? locale === "tr"
        ? "İnsan doğrulaması"
        : "Human verification"
      : captchaLabel;
  const searchParams = useSearchParams();
  const [username, setUsername] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("login_username") ?? "";
  });
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const captchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const successMessage = useMemo(() => {
    if (searchParams.get("reset") === "success") {
      return t("auth.login.resetSuccess");
    }
    return "";
  }, [searchParams, t]);

  useEffect(() => {
    if (username) {
      localStorage.setItem("login_username", username);
    } else {
      localStorage.removeItem("login_username");
    }
  }, [username]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    let verifiedCaptchaToken = captchaToken;
    if (isCaptchaRequired && !verifiedCaptchaToken) {
      verifiedCaptchaToken = await captchaRef.current?.execute() ?? null;
      if (!verifiedCaptchaToken) {
        setError(t("auth.login.captchaRequired"));
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, captchaToken: verifiedCaptchaToken }),
      });

      const data: { username?: string; error?: string; emailVerified?: boolean } = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(translateApiError(data.error, t) || t("errors.login.invalidCredentials"));
        setCaptchaToken(null);
        captchaRef.current?.reset();
        setCaptchaResetKey((value) => value + 1);
        setIsLoading(false);
        return;
      }

      localStorage.removeItem("login_username");
      await clearOfflineSessionCache().catch(() => {});
      if (data.emailVerified === false) {
        window.location.href = "/app/verify-email";
        return;
      }
      window.location.href = "/app";
    } catch (unknownError: unknown) {
      if (
        unknownError instanceof TypeError ||
        (unknownError instanceof Error && unknownError.message.includes("Failed to fetch"))
      ) {
        setError(t("errors.login.noInternet"));
      } else {
        setError(t("errors.login.errorOccurred"));
      }
      setCaptchaToken(null);
      captchaRef.current?.reset();
      setCaptchaResetKey((value) => value + 1);
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      badge={t("auth.login.badge")}
      headline={t("auth.login.headline")}
      subheadline={t("auth.login.subheadline")}
      icon={<LogIn className="h-6 w-6" />}
      title={t("auth.login.title")}
      description={t("auth.login.description")}
      features={[
        {
          title: t("auth.login.featureAccessTitle"),
          body: t("auth.login.featureAccessBody"),
        },
        {
          title: t("auth.login.featureTrustTitle"),
          body: t("auth.login.featureTrustBody"),
        },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">{t("auth.login.username")}</Label>
          <Input
            id="username"
            type="text"
            placeholder={t("auth.login.usernamePlaceholder")}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={isLoading}
            autoComplete="username"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link href="/app/forgot-password" className="text-sm text-app-gold hover:text-app-gold-light">
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder={t("auth.login.passwordPlaceholder")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
          />
        </div>
        <div className="space-y-2">
          <Label>{resolvedCaptchaLabel}</Label>
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
        {successMessage ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {successMessage}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <Button type="submit" className="h-12 w-full rounded-2xl bg-app-gold text-black hover:bg-app-gold-light" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.login.submitting")}
            </>
          ) : (
            t("auth.login.submit")
          )}
        </Button>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-app-gold" />
            <p>{t("auth.login.helper")}</p>
          </div>
        </div>
        <p className="text-center text-sm text-white/55">
          {t("auth.login.noAccount")}{" "}
          <Link href="/app/register" className="text-app-gold hover:text-app-gold-light">
            {t("auth.login.registerLink")}
          </Link>
        </p>
        <p className="flex items-center justify-center gap-2 text-center text-sm text-white/40">
          <ArrowRight className="h-4 w-4" />
          <span>{t("auth.login.flowHint")}</span>
        </p>
      </form>
    </AuthShell>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: "#ffb347", borderRightColor: "#f59e0b" }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
