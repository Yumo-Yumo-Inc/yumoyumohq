"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, LogOut, Mail, RefreshCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { translateApiError, useAppLocale } from "@/lib/i18n/app-context";
import { clearOfflineSessionCache } from "@/lib/offline/cache";

type VerifyStatus = "pending" | "verified" | "expired" | "consumed" | "invalid";

function VerifyEmailPageContent() {
  const { t } = useAppLocale();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const emailSent = searchParams.get("emailSent") !== "0";

  const status = useMemo<VerifyStatus>(() => {
    const raw = searchParams.get("status");
    if (raw === "verified" || raw === "expired" || raw === "consumed" || raw === "invalid") {
      return raw;
    }
    return "pending";
  }, [searchParams]);

  const content = {
    pending: {
      icon: Mail,
      title: t("auth.verify.pendingTitle"),
      body: emailSent ? t("auth.verify.pendingBody") : t("auth.verify.pendingEmailFailedBody"),
      accent: "text-app-gold",
    },
    verified: {
      icon: CheckCircle2,
      title: t("auth.verify.verifiedTitle"),
      body: t("auth.verify.verifiedBody"),
      accent: "text-emerald-400",
    },
    expired: {
      icon: ShieldAlert,
      title: t("auth.verify.expiredTitle"),
      body: t("auth.verify.expiredBody"),
      accent: "text-amber-300",
    },
    consumed: {
      icon: ShieldAlert,
      title: t("auth.verify.consumedTitle"),
      body: t("auth.verify.consumedBody"),
      accent: "text-white",
    },
    invalid: {
      icon: ShieldAlert,
      title: t("auth.verify.invalidTitle"),
      body: t("auth.verify.invalidBody"),
      accent: "text-red-300",
    },
  }[status];

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(translateApiError(data.error, t) || t("auth.verify.resendError"));
        setIsResending(false);
        return;
      }
      toast.success(t("auth.verify.resendSuccess"));
    } catch {
      toast.error(t("auth.verify.resendError"));
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await clearOfflineSessionCache().catch(() => {});
    } finally {
      window.location.href = "/app/login";
    }
  };

  const Icon = content.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(201,168,76,0.18),_transparent_40%),linear-gradient(180deg,_#0f1117_0%,_#111827_60%,_#090b10_100%)] px-4 py-10">
      <Card className="w-full max-w-xl border-white/10 bg-[#121725]/95 text-white shadow-2xl shadow-black/35">
        <CardHeader className="space-y-3">
          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ${content.accent}`}>
            <Icon className="h-7 w-7" />
          </div>
          <CardTitle className="text-3xl">{content.title}</CardTitle>
          <CardDescription className="text-base leading-7 text-white/65">
            {content.body}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status !== "verified" ? (
            <Button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="h-12 w-full rounded-2xl bg-app-gold text-black hover:bg-app-gold-light"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.verify.resending")}
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {t("auth.verify.resend")}
                </>
              )}
            </Button>
          ) : (
            <Button asChild className="h-12 w-full rounded-2xl bg-app-gold text-black hover:bg-app-gold-light">
              <Link href="/app">{t("auth.verify.continueToApp")}</Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-12 w-full rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.verify.signingOut")}
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                {t("auth.verify.logout")}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-white/55">
            {t("auth.verify.needAnotherAccount")}{" "}
            <Link href="/app/register" className="text-app-gold hover:text-app-gold-light">
              {t("auth.verify.registerAgain")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
