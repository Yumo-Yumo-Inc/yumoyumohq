"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import {
  ReceiptPipelineError,
  ReceiptResultWithBreakdownStep,
  ReceiptVectorReceiptStep,
  ReceiptDoneStep,
} from "@/components/app/receipt-pipeline-steps";
import type { Receipt } from "@/lib/mock/types";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";

function ClaimReceiptPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useAppLocale();
  const { profile } = useAppProfile();
  const accountLevel = profile?.accountLevel ?? 1;
  const forceDoneStep = searchParams.get("step") === "4";

  const [step, setStep] = useState<2 | 3 | 4>(forceDoneStep ? 4 : 2);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [analysisData, setAnalysisData] = useState<ReceiptAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cross-render dedupe: a single receiptId must never trigger two save POSTs
  // even if React re-mounts the component (strict mode, parent re-render, etc.).
  // `isSaving` alone is reset by re-mount; this ref outlives state for the page session.
  const savedReceiptIdsRef = useRef<Set<string>>(new Set());
  const inFlightSaveRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (forceDoneStep) {
      setStep(4);
    }
  }, [forceDoneStep]);

  useEffect(() => {
    const receiptId = params?.id?.trim();
    if (!receiptId) {
      setError(t("errors.receiptDetail.notFound"));
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/receipts/${encodeURIComponent(receiptId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg =
            typeof body?.error === "string" && body.error.length > 0
              ? body.error
              : t("errors.receiptDetail.notFound");
          setError(msg);
          return;
        }

        const analysis = (await res.json()) as ReceiptAnalysis;
        setAnalysisData(analysis);
        const { convertReceiptAnalysisToReceipt } = await import("@/lib/receipt/receipt-converter");
        const converted = convertReceiptAnalysisToReceipt(analysis);
        setReceipt(converted);
      } catch (e) {
        console.error("[claim] failed to load receipt:", e);
        setError(t("errors.receiptDetail.notFound"));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [params?.id, t]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error || !receipt) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto">
          <ReceiptPipelineError
            message={error || t("errors.receiptDetail.notFound")}
            onRetry={() => router.push("/app/receipts")}
            locale={locale}
            accountLevel={accountLevel}
          />
        </div>
      </AppShell>
    );
  }

  const handleSave = async () => {
    if (!analysisData || isSaving) return;

    const receiptId = analysisData.receiptId;
    // Already saved this session? Skip the POST entirely and advance the UI.
    if (receiptId && savedReceiptIdsRef.current.has(receiptId)) {
      setStep(4);
      return;
    }
    // Save already in flight (e.g. fast double-click, React re-render race)?
    // Wait on the existing promise instead of starting a new POST.
    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current;
      return;
    }

    setIsSaving(true);
    const saveTask = (async () => {
      try {
        const payload: ReceiptAnalysis = {
          ...analysisData,
          status: "verified",
        };
        const res = await fetch("/api/receipts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || t("errors.api.saveFailed"));
        }
        if (receiptId) {
          savedReceiptIdsRef.current.add(receiptId);
        }
        setStep(4);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("errors.api.saveFailed");
        setError(msg);
      } finally {
        setIsSaving(false);
        inFlightSaveRef.current = null;
      }
    })();
    inFlightSaveRef.current = saveTask;
    await saveTask;
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto space-y-4">
        {step === 2 && (
          <ReceiptResultWithBreakdownStep
            receipt={receipt}
            onContinue={() => setStep(3)}
            onCancel={() => router.push("/app/receipts")}
            locale={locale}
            accountLevel={accountLevel}
          />
        )}

        {step === 3 && (
          <ReceiptVectorReceiptStep
            receipt={receipt}
            onBack={() => setStep(2)}
            onSave={handleSave}
            isSaving={isSaving}
            locale={locale}
            accountLevel={accountLevel}
          />
        )}

        {step === 4 && (
          <ReceiptDoneStep
            receipt={receipt}
            onMineAnother={() => router.push("/app/mine")}
            onViewReceipts={() => router.push("/app/receipts")}
            locale={locale}
            accountLevel={accountLevel}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function ClaimReceiptPage() {
  return (
    <Suspense fallback={null}>
      <ClaimReceiptPageContent />
    </Suspense>
  );
}
