"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateApiError, useAppLocale } from "@/lib/i18n/app-context";

export default function ForgotPasswordPage() {
  const { t } = useAppLocale();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(translateApiError(data.error, t, true));
        setIsLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError(t("errors.login.noInternet"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      badge={t("auth.forgot.badge")}
      headline={t("auth.forgot.headline")}
      subheadline={t("auth.forgot.subheadline")}
      icon={<KeyRound className="h-6 w-6" />}
      title={t("auth.forgot.title")}
      description={t("auth.forgot.description")}
      features={[
        {
          title: t("auth.forgot.featureInboxTitle"),
          body: t("auth.forgot.featureInboxBody"),
        },
        {
          title: t("auth.forgot.featureSafeTitle"),
          body: t("auth.forgot.featureSafeBody"),
        },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forgot-identifier">{t("auth.forgot.identifier")}</Label>
          <Input
            id="forgot-identifier"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={t("auth.forgot.identifierPlaceholder")}
            autoComplete="username"
            disabled={isLoading}
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
            required
          />
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {t("auth.forgot.success")}
          </div>
        ) : null}

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
              {t("auth.forgot.submitting")}
            </>
          ) : (
            t("auth.forgot.submit")
          )}
        </Button>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-app-gold" />
            <p>{t("auth.forgot.hint")}</p>
          </div>
        </div>

        <p className="text-center text-sm text-white/55">
          <Link href="/app/login" className="text-app-gold hover:text-app-gold-light">
            {t("auth.forgot.backToLogin")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
