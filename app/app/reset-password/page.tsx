"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateApiError, useAppLocale } from "@/lib/i18n/app-context";

type ResetView = "form" | "success" | "invalid";
const INVALID_RESET_ERRORS = new Set([
  "Password reset link is invalid",
  "Password reset link has expired",
  "Password reset link has already been used",
]);

function ResetPasswordPageContent() {
  const { t } = useAppLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const view = useMemo<ResetView>(() => {
    if (resetDone) return "success";
    if (invalidToken) return "invalid";
    if (!token) return "invalid";
    return "form";
  }, [invalidToken, resetDone, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth.reset.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (typeof data.error === "string" && INVALID_RESET_ERRORS.has(data.error)) {
          setInvalidToken(true);
        }
        setError(translateApiError(data.error, t, true));
        setIsLoading(false);
        return;
      }
      setResetDone(true);
    } catch {
      setError(t("errors.login.noInternet"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      badge={t("auth.reset.badge")}
      headline={t("auth.reset.headline")}
      subheadline={t("auth.reset.subheadline")}
      icon={
        view === "success" ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : view === "invalid" ? (
          <ShieldAlert className="h-6 w-6" />
        ) : (
          <KeyRound className="h-6 w-6" />
        )
      }
      title={
        view === "success"
          ? t("auth.reset.successTitle")
          : view === "invalid"
            ? t("auth.reset.invalidTitle")
            : t("auth.reset.title")
      }
      description={
        view === "success"
          ? t("auth.reset.successBody")
          : view === "invalid"
            ? t("auth.reset.invalidBody")
            : t("auth.reset.description")
      }
      features={[
        {
          title: t("auth.reset.featureFastTitle"),
          body: t("auth.reset.featureFastBody"),
        },
        {
          title: t("auth.reset.featureSecureTitle"),
          body: t("auth.reset.featureSecureBody"),
        },
      ]}
    >
      {view === "form" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">{t("auth.reset.password")}</Label>
            <Input
              id="reset-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-confirm">{t("auth.reset.confirmPassword")}</Label>
            <Input
              id="reset-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-2xl bg-app-gold text-black hover:bg-app-gold-light"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.reset.submitting")}
              </>
            ) : (
              t("auth.reset.submit")
            )}
          </Button>
        </form>
      ) : null}

      {view === "success" ? (
        <div className="space-y-4">
          <Button asChild className="h-12 w-full rounded-2xl bg-app-gold text-black hover:bg-app-gold-light">
            <Link href="/app/login?reset=success">{t("auth.reset.signIn")}</Link>
          </Button>
        </div>
      ) : null}

      {view === "invalid" ? (
        <div className="space-y-4">
          <Button asChild className="h-12 w-full rounded-2xl bg-app-gold text-black hover:bg-app-gold-light">
            <Link href="/app/forgot-password">{t("auth.reset.requestAnother")}</Link>
          </Button>
        </div>
      ) : null}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
