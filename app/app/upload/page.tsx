"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_QUERY_KEY, QUESTS_DAILY_QUERY_KEY, PROFILE_QUERY_KEY } from "@/lib/app/query-keys";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { DesktopUploadMessage } from "@/components/app/desktop-upload-message";
import { ReceiptUploadCard } from "../components/receipt-upload-card";
import { useIsDesktop } from "@/lib/hooks/use-is-desktop";
import { AppShell } from "@/components/app/app-shell";
import { useYumbieStore } from "@/components/yumbie/useYumbieStore";
import { BreakdownCard } from "../components/breakdown-card";
import { RewardCard } from "../components/reward-card";
import { ItemizedReceiptUploadDialog } from "../components/itemized-receipt-upload-dialog";
import { FieldCorrectionModal } from "@/components/app/field-correction-modal";
import { Pencil } from "lucide-react";
import { EvidenceDrawer } from "../components/evidence-drawer";
import { EvidenceModal } from "../components/evidence-modal";
import { MiningModal } from "../components/mining-modal";
import { StyledReceipt } from "../components/styled-receipt";
import { ThemeCard } from "@/components/app/theme-card";
import { ThemeBg } from "@/components/app/theme-bg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, LayoutDashboard, Upload, AlertTriangle } from "lucide-react";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
import { getCategoryRates } from "@/lib/receipt/calculations";
import { useAppLocale, translateApiError } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { CountrySelectorModal } from "@/components/app/country-selector-modal";
import { isCountryRequiredErrorPayload } from "@/lib/app/country-required";
import { localDb } from "@/lib/local-db";
import { saveLocalReceiptImage } from "@/lib/local-db/receipt-images";
import {
  createOptimisticReceiptRecord,
  createProcessingReceiptFromUpload,
  createReceiptRecordFromAnalysis,
} from "@/lib/offline/receipt-cache";
import { syncMobileData } from "@/lib/sync";
import { applyMobileActionResult } from "@/lib/mobile/action-result-client";
import type { MobileActionResult } from "@/lib/mobile/action-result-types";
import { rebuildLocalInsightsFromReceipts } from "@/lib/insights/local-provisional";
import type { CachedReceiptRecord } from "@/lib/offline/types";

const STEPS = ["Upload", "Result"];

/** Keep IndexedDB in sync when background analyze returns 400 rejected (no JSON body with full analysis). */
async function markLocalReceiptRejected(receiptId: string): Promise<void> {
  const existing = (await localDb.get("receipts", receiptId).catch(() => null)) as CachedReceiptRecord | null;
  if (!existing) return;
  const now = new Date().toISOString();
  await localDb.set("receipts", {
    ...existing,
    status: "rejected",
    updated_at: now,
    version: (existing.version ?? 0) + 1,
  });
}

export default function UploadPage() {
  const isDesktop = useIsDesktop();
  const { t } = useAppLocale();
  const { publicKey } = useWallet();
  const { profile, announceLevelUp } = useAppProfile();
  const queryClient = useQueryClient();
  const router = useRouter();
  const accountLevel = profile?.accountLevel ?? 1;
  const [currentStep, setCurrentStep] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  // Per-receipt cPoints for the reward card. null = still computing in background.
  const [receiptCPoints, setReceiptCPoints] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [miningStep, setMiningStep] = useState<
    "uploading" | "ocr" | "extraction" | "merchant" | "calculation" | "verification" | "complete"
  >("uploading");
  const [showMiningModal, setShowMiningModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [pendingCorrectionFields, setPendingCorrectionFields] = useState<string[]>([]);
  const [thankYouSummary, setThankYouSummary] = useState<{ receiptId: string; merchantName?: string } | null>(null);
  const [queuedReceiptId, setQueuedReceiptId] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<{
    tone: "success" | "error";
    title: string;
    description: string;
  } | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showItemizedDialog, setShowItemizedDialog] = useState(false);
  const pendingCountryRetryRef = useRef<null | (() => void | Promise<void>)>(null);

  useEffect(() => {
    setIsAdmin(!!profile?.isAdmin);
  }, [profile?.isAdmin]);

  // Poll for this receipt's cPoints. Post-process computes contribution points
  // in the background after analyze responds, so the reward card shows a
  // calculating state until the real per-receipt value lands.
  useEffect(() => {
    const id = analysis?.receiptId;
    if (!id) {
      setReceiptCPoints(null);
      return;
    }
    setReceiptCPoints(null);
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/receipts/${encodeURIComponent(id)}/status`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { contributionPoints?: number | null };
          if (!cancelled && data.contributionPoints != null) {
            setReceiptCPoints(Number(data.contributionPoints) || 0);
            return;
          }
        }
      } catch {
        /* transient — retry below */
      }
      if (!cancelled && attempts < 12) {
        window.setTimeout(poll, 1500);
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [analysis?.receiptId]);

  if (isDesktop && !isAdmin) {
    return (
      <AppShell>
        <DesktopUploadMessage />
      </AppShell>
    );
  }

  const handleFileUpload = async (file: File) => {
    if (!profile?.isAdmin && !profile?.country) {
      pendingCountryRetryRef.current = () => handleFileUpload(file);
      setShowCountryModal(true);
      return;
    }

    setQueuedReceiptId(null);
    setUploadNotice(null);
    const optimisticReceipt = createOptimisticReceiptRecord(file);
    await localDb.set("receipts", optimisticReceipt);
    console.log('[upload] 📤 Starting upload for:', file.name, (file.size / 1024 / 1024).toFixed(2), 'MB');

    let fileToUpload = file;
    let convertedImageFile: File | null = null;
    
    // If PDF, convert to image on client-side
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const { convertPdfToImageClient } = await import("@/lib/utils/client-pdf-to-image");
        fileToUpload = await convertPdfToImageClient(file);
        convertedImageFile = fileToUpload; // Store converted image for later use
        console.log("[upload] PDF converted to image on client-side");
      } catch (pdfError: any) {
        console.error("[upload] PDF conversion error:", pdfError);
        setUploadNotice({
          tone: "error",
          title: t("errors.upload.uploadFailed"),
          description: t("errors.upload.pdfFailed"),
        });
        return;
      }
    }

    console.log('[upload] 📦 Uploading file (server will compress if needed):', (fileToUpload.size / 1024).toFixed(0), 'KB');
    
    // Set the file to display (use converted image if PDF was converted)
    setUploadedFile(convertedImageFile || file);
    
    
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      setMiningStep("uploading");
      setShowMiningModal(true);
      const response = await fetch("/api/receipt/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Upload failed:", response.status, errorData);
        throw new Error(errorData.error || errorData.details || `Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.receiptId) {
        throw new Error("No receipt ID returned from server");
      }
      await localDb.delete("receipts", optimisticReceipt.id);
      await localDb.set(
        "receipts",
        createProcessingReceiptFromUpload({
          receiptId: data.receiptId,
          filename: data.filename ?? file.name,
        })
      );
      
      setReceiptId(data.receiptId);
      setQueuedReceiptId(data.receiptId);
      setCurrentStep(0);
      setAnalysis(null);

      // Let the Yumbie scan room process the receipt for its real OCR duration.
      useYumbieStore.getState().enqueue({
        kind: "scan",
        id: data.receiptId,
        label: "yumbie.workspace.scan.processing",
      });

      // Trigger analyze in background (do not block UI)
      void triggerBackgroundAnalyze(data.receiptId, data.marginViolation, data.size);

      setShowMiningModal(false);
      setUploadedFile(null);
      setUploadNotice({
        tone: "success",
        title: "Receipt successfully uploaded",
        description: `You can close this window. We will notify you once it is completed. Receipt ID: ${data.receiptId}`,
      });
      return;
    } catch (error: any) {
      console.error("Upload failed:", error);
      await localDb.delete("receipts", optimisticReceipt.id).catch(() => {});
      const msg = translateApiError(error?.message, t) || t("errors.upload.unknown");
      setShowMiningModal(false);
      setUploadNotice({
        tone: "error",
        title: t("errors.upload.uploadFailed"),
        description: msg,
      });
      return;
    }
  };

  const triggerBackgroundAnalyze = async (
    id: string,
    marginViolation?: unknown,
    originalFileSizeBytes?: number
  ) => {
    const analyzeBody: Record<string, unknown> = { receiptId: id, marginViolation, stream: false };
    if (typeof originalFileSizeBytes === "number" && originalFileSizeBytes > 0) {
      analyzeBody.originalFileSizeBytes = originalFileSizeBytes;
    }

    try {
      const response = await fetch("/api/receipt/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeBody),
        keepalive: true,
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        let parsed: any = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = null;
        }

        const rejected = parsed?.rejected === true;
        const rejectionReason =
          Array.isArray(parsed?.rejectionReasons) && parsed.rejectionReasons.length > 0
            ? parsed.rejectionReasons[0]
            : parsed?.error;

        if (response.status === 400 && isCountryRequiredErrorPayload(parsed)) {
          pendingCountryRetryRef.current = () =>
            triggerBackgroundAnalyze(id, marginViolation, originalFileSizeBytes);
          setShowCountryModal(true);
          return;
        }

        if (response.status === 400 && rejected) {
          const friendly =
            translateApiError(rejectionReason, t) ||
            rejectionReason ||
            t("errors.api.analyzeFailed");
          setQueuedReceiptId(null);
          await markLocalReceiptRejected(id);
          await syncMobileData().catch(() => null);
          await queryClient.invalidateQueries({ queryKey: ["receipts"] });
          setUploadNotice({
            tone: "error",
            title: t("errors.upload.uploadFailed"),
            description: friendly,
          });
          useYumbieStore.getState().setStatus(id, "error");
          console.warn("[upload] Background analyze rejected:", response.status, rejectionReason);
          return;
        }

        const fallbackMessage =
          translateApiError(parsed?.error || raw, t) || t("errors.api.analyzeFailed");
        setUploadNotice({
          tone: "error",
          title: t("errors.api.analyzeFailed"),
          description: fallbackMessage,
        });
        useYumbieStore.getState().setStatus(id, "error");
        console.warn("[upload] Background analyze non-ok:", response.status, parsed?.error || raw);
        return;
      }

      const analysis = (await response.json().catch(() => null)) as
        | (ReceiptAnalysis & { actionResult?: MobileActionResult })
        | null;
      if (analysis?.receiptId) {
        await localDb.set("receipts", createReceiptRecordFromAnalysis(analysis));
        await rebuildLocalInsightsFromReceipts().catch(() => {});
        if (analysis.actionResult) {
          await applyMobileActionResult(analysis.actionResult, queryClient, { onLevelEvent: announceLevelUp });
        } else {
          await syncMobileData({ fullProfile: true }).catch(() => null);
        }
        queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY("monthly") });
        queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      }
      useYumbieStore.getState().setStatus(id, "done");
    } catch (error) {
      useYumbieStore.getState().setStatus(id, "error");
      console.warn("[upload] Background analyze request failed:", error);
      setUploadNotice({
        tone: "error",
        title: t("errors.api.analyzeFailed"),
        description: t("errors.upload.unknown"),
      });
    }
  };

  const handleAnalyze = async (id?: string, marginViolation?: any, originalFileSizeBytes?: number) => {
    const receiptIdToUse = id || receiptId;
    if (!receiptIdToUse) return;
    if (!profile?.isAdmin && !profile?.country) {
      pendingCountryRetryRef.current = () =>
        handleAnalyze(receiptIdToUse, marginViolation, originalFileSizeBytes);
      setShowCountryModal(true);
      return;
    }

    setIsAnalyzing(true);
    setShowMiningModal(true);
    
    try {
      // Step 1: OCR
      setMiningStep("ocr");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Extraction
      setMiningStep("extraction");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Merchant
      setMiningStep("merchant");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Calculation (server-side)
      setMiningStep("calculation");
      
      const analyzeBody: Record<string, unknown> = { receiptId: receiptIdToUse, marginViolation };
      if (typeof originalFileSizeBytes === "number" && originalFileSizeBytes > 0) {
        analyzeBody.originalFileSizeBytes = originalFileSizeBytes;
      }
      const response = await fetch("/api/receipt/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeBody),
      });
      
      if (!response.ok) {
        // Read response as text first (can only read once)
        const text = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          // If response is not JSON, use text as error message
          throw new Error(`Server error (${response.status}): ${text || response.statusText}`);
        }
        
        const errorMessage = errorData.message || errorData.error || "Analysis failed";
        
        // Handle specific error cases
        if (response.status === 422) {
          // Low confidence or missing data
          const details = errorData.details || {};
          const confidenceInfo = details.totalConfidence !== undefined 
            ? `\n\nConfidence scores:\n- Total: ${(details.totalConfidence * 100).toFixed(0)}%\n- Date: ${(details.dateConfidence * 100).toFixed(0)}%\n- VAT: ${(details.vatConfidence * 100).toFixed(0)}%`
            : '';
          
          throw new Error(`${errorMessage}${confidenceInfo}\n\nPlease try uploading a clearer image or a different receipt.`);
        } else if (response.status === 409) {
          // Duplicate: the backend already returns the original receipt id; no new analysis runs.
          const existingId =
            typeof errorData.existingReceiptId === "string" ? errorData.existingReceiptId.trim() : "";
          const existingUser =
            typeof errorData.existingUsername === "string" ? errorData.existingUsername : "";
          if (profile?.isAdmin && existingId) {
            let reprocessSummary = "";
            try {
              const rp = await fetch("/api/admin/receipt-line-items/reprocess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiptId: existingId }),
              });
              const j = (await rp.json()) as { ok?: boolean; state?: string; error?: string };
              reprocessSummary =
                rp.ok && j.ok
                  ? `Post-process tamam (state=${j.state ?? "?"}). receipt_line_items yenilendi.`
                  : `Post-process: ${j.error || `HTTP ${rp.status}`}`;
            } catch (e) {
              reprocessSummary = `Post-process isteği: ${(e as Error).message}`;
            }
            setShowMiningModal(false);
            setIsAnalyzing(false);
            alert(
              `Duplicate — orijinal kayıtla eşleşti.\nFiş ID: ${existingId}${existingUser ? `\nKayıtlı kullanıcı: ${existingUser}` : ""}\n\n${reprocessSummary}\n\nDetay: /app/receipts/${encodeURIComponent(existingId)}`
            );
            setUploadedFile(null);
            setReceiptId(null);
            setAnalysis(null);
            return;
          }
          throw new Error(`${errorMessage}\n\nThis receipt has already been processed.`);
        } else if (response.status === 404) {
          // Receipt file not found
          throw new Error(`${errorMessage}\n\nPlease try uploading the receipt again.`);
        } else if (response.status === 400) {
          if (isCountryRequiredErrorPayload(errorData)) {
            pendingCountryRetryRef.current = () =>
              handleAnalyze(receiptIdToUse, marginViolation, originalFileSizeBytes);
            setShowMiningModal(false);
            setShowCountryModal(true);
            return;
          }
          if (errorData.rejected === true) {
            await markLocalReceiptRejected(receiptIdToUse);
            await syncMobileData().catch(() => null);
            await queryClient.invalidateQueries({ queryKey: ["receipts"] });
          }
          // Bad request
          throw new Error(`${errorMessage}\n\nPlease check the receipt image and try again.`);
        } else {
          // Other errors - include more details
          const details = errorData.details ? `\n\nDetails: ${errorData.details}` : '';
          throw new Error(`${errorMessage}${details}\n\nPlease try again or contact support if the problem persists.`);
        }
      }
      
      const data = (await response.json()) as ReceiptAnalysis & {
        actionResult?: MobileActionResult;
        duplicateResolved?: boolean;
        fieldsUpdated?: string[];
        postProcessOk?: boolean;
        postProcessError?: string;
        existingReceiptId?: string;
      };

      // Duplicate → the original record was filled server-side (analyze route)
      if (profile?.isAdmin && data && data.duplicateResolved === true) {
        setShowMiningModal(false);
        setIsAnalyzing(false);
        const fu = Array.isArray(data.fieldsUpdated) ? data.fieldsUpdated.join(", ") : "—";
        const ppOk = data.postProcessOk === true;
        alert(
          `Orijinal fiş güncellendi (duplicate eşleşmesi).\nFiş ID: ${data.existingReceiptId}\nGüncellenen: ${fu}\nPost-process: ${ppOk ? "tamam" : data.postProcessError || "kontrol et"}\n\n/app/receipts/${encodeURIComponent(String(data.existingReceiptId || ""))}`
        );
        setUploadedFile(null);
        setReceiptId(null);
        setAnalysis(null);
        return;
      }

      // Step 5: Verification
      setMiningStep("verification");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 6: Complete
      setMiningStep("complete");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await localDb.set("receipts", createReceiptRecordFromAnalysis(data));
      // Keep the original photo on this device: detail view reads it locally
      // before hitting the server, and it outlives the short server retention.
      if (uploadedFile && receiptIdToUse) {
        await saveLocalReceiptImage(receiptIdToUse, uploadedFile).catch(() => {});
      }
      await rebuildLocalInsightsFromReceipts().catch(() => {});
      if (data.actionResult) {
        await applyMobileActionResult(data.actionResult, queryClient, { onLevelEvent: announceLevelUp });
      } else {
        await syncMobileData({ fullProfile: true }).catch(() => null);
      }
      setAnalysis(data);
      setShowMiningModal(false);
      // Show evidence modal automatically after analysis completes
      setShowEvidenceModal(true);
      // Skip merchant step, go directly to breakdown
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      setShowMiningModal(false);
      setMiningStep("uploading"); // Reset step
      
      // Show user-friendly error message (locale-aware)
      const rawMessage = error?.message || "Failed to analyze receipt. Please try again.";
      const errorMessage = translateApiError(rawMessage, t) || t("errors.api.analyzeFailed");
      
      // Log full error for debugging
      console.error("Full error object:", error);
      
      alert(errorMessage);
      
      // Reset state to allow retry
      setUploadedFile(null);
      setReceiptId(null);
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const slipReceiptIdForItemized =
    analysis?.reward?.pendingSlipReceiptId ?? analysis?.receiptId ?? null;

  const refreshSlipAnalysis = async (slipId: string) => {
    const res = await fetch("/api/receipt/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptId: slipId, stream: false }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ReceiptAnalysis;
  };

  const handleSave = async () => {
    if (!analysis) return;

    setIsSaving(true);

    try {
      console.log("[upload] Saving receipt:", analysis.receiptId);
      const statusToSave = analysis.status === "pending" ? "pending" : "saved";
      let body: string;
      try {
        body = JSON.stringify({
          ...analysis,
          status: statusToSave,
          walletAddress: publicKey?.toString() ?? undefined,
        });
      } catch (serializeErr: any) {
        console.error("[upload] Serialize failed:", serializeErr);
        throw new Error("Reward data could not be sent. Please refresh the page and try again.");
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "include",
      });

      const responseText = await response.text();
      if (!response.ok) {
        const errorData = responseText ? (() => { try { return JSON.parse(responseText); } catch { return { error: responseText }; } })() : { error: "Unknown error" };
        console.error("[upload] Save failed:", response.status, errorData);
        if (response.status === 401) {
          throw new Error("Session not found or expired. Please sign in again (connect your wallet and sign).");
        }
        throw new Error((errorData as any).error || (errorData as any).details || `Kayıt başarısız: ${response.status}`);
      }

      const saved = (responseText ? JSON.parse(responseText) : {}) as Partial<ReceiptAnalysis> & {
        actionResult?: MobileActionResult;
      };
      console.log("[upload] Receipt saved successfully:", saved.receiptId);
      const savedRecord = createReceiptRecordFromAnalysis({
        ...analysis,
        ...saved,
        status: saved.status ?? "saved",
      });
      await localDb.set("receipts", savedRecord);
      await rebuildLocalInsightsFromReceipts().catch(() => {});
      if (saved.actionResult) {
        await applyMobileActionResult(saved.actionResult, queryClient, { onLevelEvent: announceLevelUp });
      } else {
        await syncMobileData({ fullProfile: true }).catch(() => null);
      }
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY("monthly") });
      queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      setThankYouSummary({
        receiptId: analysis.receiptId,
        merchantName: analysis.merchant?.name,
      });
      setShowThankYouModal(true);
    } catch (error: any) {
      console.error("[upload] Save failed:", error);
      const msg = error?.message || translateApiError(error?.message, t) || t("errors.upload.unknown");
      alert(`${t("errors.upload.saveFailed")}: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Keep the in-memory analysis in sync with immediately-applied corrections so a
  // later Save doesn't overwrite them. Reward fields (total/vat) are admin-gated
  // and not applied yet, so nothing to patch for those.
  const handleCorrected = ({
    field,
    value,
    appliedImmediately,
  }: {
    field: string;
    value: string;
    appliedImmediately: boolean;
  }) => {
    if (!appliedImmediately) return;
    setAnalysis((prev) => {
      if (!prev) return prev;
      const next = { ...prev } as ReceiptAnalysis;
      if (field === "merchant_name") {
        next.merchant = { ...(next.merchant as any), name: value };
      } else if (field === "date") {
        next.extraction = {
          ...(next.extraction as any),
          date: { ...((next.extraction as any)?.date ?? {}), value },
        };
      } else if (field === "time") {
        next.extraction = {
          ...(next.extraction as any),
          time: { ...((next.extraction as any)?.time ?? {}), value },
        };
      }
      return next;
    });
  };

  // Wallet is account-level and optional (2026-07-04): uploads require only a session.
  return (
    <AppShell>
      <div className="space-y-6">
        <Stepper steps={STEPS} currentStep={currentStep === 0 ? 0 : 1} className="mb-6" />

        <MiningModal open={showMiningModal} currentStep={miningStep} />
        <CountrySelectorModal
          open={showCountryModal}
          onOpenChange={setShowCountryModal}
          initialCountry={profile?.country}
          onSaved={async () => {
            const retry = pendingCountryRetryRef.current;
            pendingCountryRetryRef.current = null;
            if (retry) {
              await retry();
            }
          }}
        />

        {/* Evidence Modal - Shows automatically after analysis */}
        {analysis && (
          <EvidenceModal
            open={showEvidenceModal}
            onClose={() => setShowEvidenceModal(false)}
            flags={analysis.flags}
            ocr={analysis.ocr}
          />
        )}

        {/* Thank-you modal — after Save */}
        <Dialog open={showThankYouModal} onOpenChange={setShowThankYouModal}>
          <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-6 w-6" />
                <DialogTitle>Thank you</DialogTitle>
              </div>
              <DialogDescription asChild>
                <div className="space-y-2 pt-1">
                  <p>Your receipt has been saved.</p>
                  {thankYouSummary && (
                    <div className="rounded-lg border bg-muted/50 p-3 text-left space-y-2">
                      {thankYouSummary.merchantName && (
                        <p className="font-medium text-foreground">{thankYouSummary.merchantName}</p>
                      )}
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          Receipt saved
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Points are added after verification and sync.
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-muted-foreground">What would you like to do next?</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setShowThankYouModal(false);
                  setThankYouSummary(null);
                  router.push(thankYouSummary ? `/app/receipts/${thankYouSummary.receiptId}` : "/app/receipts");
                }}
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 border-[var(--app-border)]"
                onClick={() => {
                  setShowThankYouModal(false);
                  setThankYouSummary(null);
                  setCurrentStep(0);
                  setAnalysis(null);
                  setUploadedFile(null);
                  setReceiptId(null);
                  setQueuedReceiptId(null);
                  setShowMiningModal(false);
                }}
              >
                <Upload className="h-4 w-4" />
                Upload a new receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Step 0: Upload */}
        {currentStep === 0 && (
          <div className="space-y-4">
            {uploadNotice && (
              <ThemeCard
                accountLevel={accountLevel}
                className={
                  uploadNotice.tone === "success"
                    ? "p-4 border-emerald-500/40 bg-emerald-500/10"
                    : "p-4 border-red-500/40 bg-red-500/10"
                }
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
                    {uploadNotice.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                    {uploadNotice.description}
                  </p>
                </div>
              </ThemeCard>
            )}
            {queuedReceiptId && (
              <ThemeCard accountLevel={accountLevel} className="p-4 border-[var(--app-border)]">
                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
                    Your receipt is being analyzed in the background.
                  </p>
                  <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                    You will be notified when analysis is complete. Receipt ID: {queuedReceiptId}
                  </p>
                  <Button
                    variant="outline"
                    className="border-[var(--app-border)]"
                    onClick={() => router.push("/app/receipts")}
                  >
                    Go to receipt list
                  </Button>
                </div>
              </ThemeCard>
            )}
            <ReceiptUploadCard
              accountLevel={accountLevel}
              onUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              onRemove={() => {
                setUploadedFile(null);
                setReceiptId(null);
                setQueuedReceiptId(null);
                setAnalysis(null);
                setShowMiningModal(false);
              }}
            />
          </div>
        )}

        {/* Step 2: Single result screen — styled receipt + editable fields + reward */}
        {currentStep === 2 && analysis && (
          <div className="space-y-4">
            {analysis.receiptId && (
              <button
                type="button"
                onClick={() => setCorrectionOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
                style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)", color: "var(--app-text-primary)" }}
              >
                <Pencil className="w-4 h-4" />
                {t("correctionModal.button")}
              </button>
            )}
            {pendingCorrectionFields.length > 0 && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "var(--app-text-primary)" }}
              >
                <span className="font-medium">{t("correctionModal.awaitingApproval")}:</span>{" "}
                {pendingCorrectionFields.map((f) => t(`correctionModal.fields.${f}`)).join(", ")}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <ThemeCard accountLevel={accountLevel} className="p-4">
                <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--app-text-primary)" }}>
                  Styled Receipt
                </h3>
                <StyledReceipt analysis={analysis} locale="tr" className="flex-1" />
              </ThemeCard>
              <div className="flex flex-col gap-4">
                <ThemeCard accountLevel={accountLevel} className="p-4">
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--app-text-primary)" }}>
                    Potential Reward
                  </h3>
                  <RewardCard
                    reward={analysis.reward}
                    cPoints={receiptCPoints}
                    receiptDate={analysis.extraction?.date?.value}
                    qualityHonor={analysis.qualityHonor}
                    onRequestItemizedUpload={
                      analysis.reward?.pendingItemizedReceipt && slipReceiptIdForItemized
                        ? () => setShowItemizedDialog(true)
                        : undefined
                    }
                  />
                </ThemeCard>
                {analysis.qualityHonor && ["MEDIUM", "RISKY", "HIGH"].includes(analysis.qualityHonor.level) && (
                  <ThemeCard accountLevel={accountLevel} className="p-4 border-primary/30">
                    <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--app-text-primary)" }}>{t("honor.tipsTitle")}</h4>
                    <ul className="text-sm space-y-1" style={{ color: "var(--app-text-muted)" }}>
                      <li>• {t("honor.tipPhoto")}</li>
                      <li>• {t("honor.tipCondition")}</li>
                      <li>• {t("honor.tipBackground")}</li>
                    </ul>
                  </ThemeCard>
                )}
                {isAdmin && analysis.rejectionInfo && analysis.rejectionInfo.length > 0 && (
                  <div className="rounded-lg border border-red-500/60 bg-red-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Would be rejected for normal users</span>
                    </div>
                    {analysis.rejectionInfo.map((info, i) => (
                      <div key={i} className="text-xs space-y-1">
                        <p className="font-medium text-red-300">{info.reason}</p>
                        {info.reasons && info.reasons.length > 0 && (
                          <ul className="pl-3 space-y-0.5 text-red-400/80">
                            {info.reasons.map((r, j) => (
                              <li key={j}>• {r}</li>
                            ))}
                          </ul>
                        )}
                        {info.stage && (
                          <p className="text-red-500/60 text-[10px]">Stage: {info.stage}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <ThemeCard accountLevel={accountLevel} className="p-4">
                  <BreakdownCard
                    pricing={analysis.pricing}
                    hiddenCost={analysis.hiddenCost}
                    showEstimate={getCategoryRates(analysis.merchant.category).isEstimate}
                  />
                </ThemeCard>
              </div>
            </div>
            <EvidenceDrawer flags={analysis.flags} ocr={analysis.ocr} />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => { setCurrentStep(0); setAnalysis(null); setUploadedFile(null); setReceiptId(null); setQueuedReceiptId(null); setShowMiningModal(false); }} className="flex-1 min-w-[100px] border-[var(--app-border)]">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 min-w-[100px]">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}
        {analysis?.receiptId && (
          <FieldCorrectionModal
            open={correctionOpen}
            onOpenChange={setCorrectionOpen}
            receiptId={analysis.receiptId}
            currentValues={{
              merchant_name: analysis.merchant?.name ?? "",
              date: analysis.extraction?.date?.value ?? "",
              time: (analysis.extraction as any)?.time?.value ?? "",
              total:
                analysis.extraction?.total?.value != null
                  ? String(analysis.extraction.total.value)
                  : analysis.pricing?.totalPaid != null
                    ? String(analysis.pricing.totalPaid)
                    : "",
              vat:
                analysis.extraction?.vat?.value != null
                  ? String(analysis.extraction.vat.value)
                  : analysis.pricing?.vatAmount != null
                    ? String(analysis.pricing.vatAmount)
                    : "",
            }}
            onCorrected={(results) => {
              results.forEach(handleCorrected);
              setPendingCorrectionFields((prev) =>
                Array.from(new Set([...prev, ...results.map((r) => r.field)]))
              );
            }}
          />
        )}
        {slipReceiptIdForItemized && analysis && (
          <ItemizedReceiptUploadDialog
            open={showItemizedDialog}
            onOpenChange={setShowItemizedDialog}
            slipReceiptId={slipReceiptIdForItemized}
            merchantName={analysis.merchant?.name}
            totalPaid={analysis.pricing?.totalPaid}
            receiptDate={analysis.extraction?.date?.value}
            onUploadComplete={async () => {
              const refreshed = await refreshSlipAnalysis(slipReceiptIdForItemized);
              if (refreshed) {
                setAnalysis(refreshed);
              }
            }}
          />
        )}
      </div>
    </AppShell>
  );
}