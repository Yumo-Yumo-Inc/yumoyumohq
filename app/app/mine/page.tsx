"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { DesktopUploadMessage } from "@/components/app/desktop-upload-message";
import { ReceiptScanner, type ReceiptExpenseType } from "@/components/app/receipt-scanner";
import { useIsDesktop } from "@/lib/hooks/use-is-desktop";
import {
  ReceiptPipelineError,
  ReceiptAnalyzingStep,
  ReceiptResultWithBreakdownStep,
  ReceiptDoneStep,
} from "@/components/app/receipt-pipeline-steps";
import { useAppProfile } from "@/lib/app/profile-context";
import { useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_QUERY_KEY, QUESTS_DAILY_QUERY_KEY, PROFILE_QUERY_KEY } from "@/lib/app/query-keys";
import type { Receipt } from "@/lib/mock/types";
import type { ReceiptAnalysis } from "@/lib/receipt/types";
import { convertReceiptAnalysisToReceipt } from "@/lib/receipt/receipt-converter";
import { generateSyntheticReceiptBlob } from "@/lib/receipt/synthetic-receipt";
import { toast } from "sonner";
import { useAppLocale, translateApiError } from "@/lib/i18n/app-context";
import { TimePickerModal } from "@/components/app/time-picker-modal";
import { QualityIssuesModal } from "@/components/app/quality-issues-modal";
import { checkImageQuality } from "@/lib/utils/image-quality-check";
import type { ImageQualityIssue } from "@/lib/utils/image-quality-check";
import { filenameSuggestsEfatura } from "@/lib/utils/efatura-exempt";
import { CountrySelectorModal } from "@/components/app/country-selector-modal";
import { isCountryRequiredErrorPayload } from "@/lib/app/country-required";
import { localDb } from "@/lib/local-db";
import {
  createOptimisticReceiptRecord,
  createProcessingReceiptFromUpload,
  createReceiptRecordFromAnalysis,
} from "@/lib/offline/receipt-cache";
import { syncMobileData } from "@/lib/sync";
import { applyMobileActionResult } from "@/lib/mobile/action-result-client";
import type { MobileActionResult } from "@/lib/mobile/action-result-types";
import { rebuildLocalInsightsFromReceipts } from "@/lib/insights/local-provisional";


/**
 * Get user's GPS location (with permission)
 * Returns null if permission denied or unavailable
 */
async function getLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) {
    console.log("[getLocation] Geolocation not available");
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log(`[getLocation] Location captured: ${location.lat}, ${location.lng}`);
        resolve(location);
      },
      (error) => {
        // User denied or error - non-blocking
        console.log(`[getLocation] ⚠️ Location not available: ${error.message}`);
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 60000, // Cache for 1 minute
        enableHighAccuracy: false, // Faster, less battery
      }
    );
  });
}

export default function MinePage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { t, locale } = useAppLocale();
  const { profile, announceLevelUp } = useAppProfile();
  const accountLevel = profile?.accountLevel ?? 1;
  const queryClient = useQueryClient();

  // State — hooks must be declared unconditionally before any early returns
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionNoBackground, setRejectionNoBackground] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syntheticReceiptUrl, setSyntheticReceiptUrl] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [originalAnalysis, setOriginalAnalysis] = useState<(ReceiptAnalysis & { actionResult?: MobileActionResult }) | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pendingTimeAnalysis, setPendingTimeAnalysis] = useState<{
    analysis: ReceiptAnalysis & { actionResult?: MobileActionResult };
    imageUrl: string;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [qualityIssues, setQualityIssues] = useState<ImageQualityIssue[]>([]);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [canLeaveAnalyzeScreen, setCanLeaveAnalyzeScreen] = useState(false);
  // When analysis finishes we hold on step 1 to play the cinematic reveal with
  // real data, then advance to the result screen via onRevealComplete.
  const [revealReady, setRevealReady] = useState(false);
  // Basic receipt fields streamed mid-analysis (after Vision) so the scan story
  // can play the "receipt read" beat while pricing/hidden cost still compute.
  const [partialReceipt, setPartialReceipt] = useState<{
    merchantName: string | null;
    date: string | null;
    total: number;
    currency: string | null;
    category: string | null;
    itemCount: number;
  } | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const isAnalyzeScreen = currentStep === 1;
  const analyzeRunIdRef = useRef(0);
  const uploadAnalyzeInFlightRef = useRef(false);
  const pendingCountryRetryRef = useRef<null | (() => boolean | void | Promise<void>)>(null);
  const localeText = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };


  useEffect(() => {
    setIsAdmin(!!profile?.isAdmin);
  }, [profile?.isAdmin]);
  
  // Helper function to process analysis after time is confirmed
  const processAnalysisWithTime = async (
    fullAnalysis: ReceiptAnalysis & { actionResult?: MobileActionResult },
    imageUrl: string,
    time?: string
  ) => {
    // Update analysis with user-provided time if given
    const updatedAnalysis = time ? {
      ...fullAnalysis,
      extraction: {
        ...fullAnalysis.extraction,
        time: {
          value: time,
          confidence: 1.0, // User-provided = high confidence
          sourceLine: -1, // Manual input
        }
      }
    } : fullAnalysis;
    
    // Store original analysis
    setOriginalAnalysis(updatedAnalysis);
    await localDb.set("receipts", createReceiptRecordFromAnalysis(updatedAnalysis));
    await rebuildLocalInsightsFromReceipts().catch(() => {});
    if (updatedAnalysis.actionResult) {
      await applyMobileActionResult(updatedAnalysis.actionResult, queryClient, { onLevelEvent: announceLevelUp });
    }
    
    // Update receipt with full analysis data
    const fullReceipt = convertReceiptAnalysisToReceipt(updatedAnalysis, imageUrl);
    
    // Add time to receipt if provided (override extraction time)
    if (time) {
      fullReceipt.time = time;
    }
    
    setReceipt((prev) => {
      if (!prev) return fullReceipt;
      return {
        ...fullReceipt,
        imageUrl: prev.imageUrl || fullReceipt.imageUrl,
        time: fullReceipt.time || prev.time, // Preserve time from fullReceipt or keep previous
      };
    });
    
    // Generate synthetic receipt
    console.log("[mine] Full analysis completed, generating synthetic receipt...");
    
    try {
      const syntheticReceiptBlob = await generateSyntheticReceiptBlob({
        merchantName: fullReceipt.merchantName,
        date: fullReceipt.date,
        time: fullReceipt.time || time,
        category: fullReceipt.category || "other",
        total: fullReceipt.total,
        vat: fullReceipt.vat,
        currency: fullReceipt.currency,
        receiptNumber: receiptNumber,
      });
      const syntheticUrl = URL.createObjectURL(syntheticReceiptBlob);
      setSyntheticReceiptUrl(syntheticUrl);
      
      setReceipt(prev => prev ? { ...prev, imageUrl: syntheticUrl } : prev);
    } catch (err) {
      console.error("[mine] Failed to generate synthetic receipt:", err);
    }
    
    setCanLeaveAnalyzeScreen(false);
    // Hold on step 1 and play the cinematic reveal with the real numbers; the
    // analyzing screen advances to the result step via onRevealComplete.
    setRevealReady(true);
  };
  
  // Handle time selection from modal
  const handleTimeConfirm = async (time: string) => {
    setShowTimeModal(false);
    
    if (pendingTimeAnalysis) {
      const { analysis, imageUrl } = pendingTimeAnalysis;
      setPendingTimeAnalysis(null);
      
      toast.success(t("mine.toast.timeSaved"), {
        description: time,
        duration: 3000,
      });
      
      setIsMining(true);
      await processAnalysisWithTime(analysis, imageUrl, time);
    }
  };
  
  // Handle time modal close (skip time)
  const handleTimeSkip = async () => {
    setShowTimeModal(false);
    
    if (pendingTimeAnalysis) {
      const { analysis, imageUrl } = pendingTimeAnalysis;
      setPendingTimeAnalysis(null);
      
      toast.info(t("mine.toast.timeSkipped"), {
        duration: 3000,
      });
      
      setIsMining(true);
      await processAnalysisWithTime(analysis, imageUrl, undefined);
    }
  };

  // Handle file selection and start analysis
  // expenseType — chosen by the user in ReceiptScanner step 1 (personal vs other).
  // Defaults to "personal" so legacy callers / retries that don't pass it stay safe.
  const handleFileSelect = (
    file: File,
    expenseType: ReceiptExpenseType = "personal"
  ): boolean => {
    if (!file || file.size === 0) {
      setSelectedFile(null);
      setReceipt(null);
      return false;
    }

    if (!profile?.isAdmin && !profile?.country) {
      pendingCountryRetryRef.current = () => handleFileSelect(file, expenseType);
      setShowCountryModal(true);
      return false;
    }
    if (isMining || uploadAnalyzeInFlightRef.current) return false;
    uploadAnalyzeInFlightRef.current = true;
    const optimisticReceipt = createOptimisticReceiptRecord(file);
    const imageUrl = '';
    let optimisticReceiptSuperseded = false;
    const removeOptimisticReceipt = () => {
      optimisticReceiptSuperseded = true;
      void localDb.delete("receipts", optimisticReceipt.id).catch(() => {});
    };

    setSelectedFile(file);
    setIsProcessing(true);
    setError(null);
    setRejectionNoBackground(false);
    setRevealReady(false);
    setPartialReceipt(null);
    setCurrentStep(1);
    setIsMining(true);
    setCanLeaveAnalyzeScreen(false);
    setIsProcessing(false);

    void localDb
      .set("receipts", optimisticReceipt)
      .then(() => {
        if (optimisticReceiptSuperseded) {
          removeOptimisticReceipt();
        }
      })
      .catch((err) => console.warn("[mine] Optimistic receipt cache write failed:", err));

    void (async () => {
      try {
      let fileToUpload = file;
      let convertedImageFile: File | null = null;

      console.log('[mine] 📤 Uploading file (server will compress if needed):', (fileToUpload.size / 1024).toFixed(0), 'KB');

      // If PDF, convert to image on client-side
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        try {
          const { convertPdfToImageClient } = await import("@/lib/utils/client-pdf-to-image");
          fileToUpload = await convertPdfToImageClient(file);
          convertedImageFile = fileToUpload;
          console.log("[mine] PDF converted to image on client-side");
        } catch (pdfError: unknown) {
          console.error("[mine] PDF conversion error:", pdfError);
          const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
          throw new Error(`${t("mine.error.pdfConversion")}: ${errorMessage}`);
        }
      }

      // CLIENT-SIDE RESIZE: shrink large images to <=1920px before upload.
      // Keeps upload fast on mobile, avoids Vercel 4.5 MB serverless limit,
      // and reduces Blob storage costs.
      const shouldResize =
        fileToUpload.type.startsWith('image/') &&
        fileToUpload.size > 1.5 * 1024 * 1024;

      if (shouldResize) {
        try {
          const { resizeImageIfNeeded } = await import('@/lib/utils/client-resize-image');
          const resized = await resizeImageIfNeeded(fileToUpload);
          console.log(
            `[mine] Client resize: ${(fileToUpload.size / 1024).toFixed(0)} KB => ${(resized.size / 1024).toFixed(0)} KB`
          );
          fileToUpload = resized;
        } catch (resizeErr) {
          console.warn('[mine] Client resize failed:', resizeErr);
          // If original is too large for Vercel (4.5 MB hard limit), bail with a clear message.
          if (file.size > 4 * 1024 * 1024) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            throw new Error(
              localeText(
                `Foto\u011fraf boyutu ${sizeMB} MB, k\u00fc\u00e7\u00fclt\u00fclemedi. Kamera ile yeniden \u00e7ekin.`,
                `Photo is ${sizeMB} MB and could not be resized. Please take a new photo.`,
                `Размер фото ${sizeMB} МБ, уменьшить не удалось. Пожалуйста, сделайте новое фото.`,
                `รูปภาพมีขนาด ${sizeMB} MB และย่อไม่ได้ กรุณาถ่ายใหม่`,
                `La foto pesa ${sizeMB} MB y no se pudo reducir. Toma una nueva foto.`,
                `照片大小为 ${sizeMB} MB，无法压缩。请重新拍摄。`,
              )
            );
          }
        }
      }

      // Start location fetch in parallel (used for analyze; optional for upload)
      const locationPromise = getLocation();

      // Upload + analyze in background while user sees the "Analyzing receipt" screen
      const formData = new FormData();
      formData.append("file", fileToUpload);
      // Personal vs Other (bulk/business) — backend uses this to set
      // receipts.expense_type and apply the reduced reward multiplier
      // for "other" (~10% of personal). Server-side defaults to "personal"
      // if the field is missing, so this is safe to send unconditionally.
      formData.append("expense_type", expenseType);

      await fetch("/api/receipt/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
        .then(async (uploadResponse) => {
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: t("mine.error.upload") }));
            const msg = translateApiError(errorData.error, t) || t("mine.error.upload");
            removeOptimisticReceipt();
            toast.error(t("mine.error.upload"), { description: msg, duration: 5000 });
            setError(msg);
            setReceipt(null);
            setIsMining(false);
            setCurrentStep(0);
            try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
            return undefined;
          }

          const uploadData = await uploadResponse.json();
          console.log('🔍 UPLOAD DATA:', uploadData);
          console.log('🔍 BLOB URL:', uploadData.blobUrl);
          const receiptId = uploadData.receiptId;
          const hash = uploadData.hash;
          const perceptualHash = uploadData.perceptualHash;
          const filename = uploadData.filename;
          const blobUrl = uploadData.blobUrl;
          const marginViolation = uploadData.marginViolation;

          if (!receiptId) {
            removeOptimisticReceipt();
            toast.error(t("mine.error.upload"), { description: t("mine.error.noReceiptId"), duration: 5000 });
            setError(t("mine.error.noReceiptId"));
            setReceipt(null);
            setIsMining(false);
            setCurrentStep(0);
            try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
            return undefined;
          }

          const receiptNum = `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          removeOptimisticReceipt();
          void localDb.set(
            "receipts",
            createProcessingReceiptFromUpload({
              receiptId,
              filename,
            })
          ).catch((err) => console.warn("[mine] Processing receipt cache write failed:", err));
          setReceiptNumber(receiptNum);
          setCanLeaveAnalyzeScreen(true);

          // Use location when ready (max 3s wait), then run analyze
          const gpsLocation = await Promise.race([
            locationPromise,
            new Promise<{ lat: number; lng: number } | null>((r) => setTimeout(() => r(null), 3000)),
          ]);
          if (gpsLocation) {
            console.log(`[mine] 📍 Location for analyze: ${gpsLocation.lat}, ${gpsLocation.lng}`);
          }

          console.log("[mine] Upload done, starting full analysis...");
          const analyzeBody: Record<string, unknown> = {
            receiptId,
            hash,
            perceptualHash,
            filename,
            blobUrl,
            location: gpsLocation,
            marginViolation,
            // Personal vs Other (bulk/business). Backend writes this to
            // receipts.expense_type and applies the reduced reward multiplier
            // for "other". Server defaults to "personal" if omitted.
            expenseType,
          };
          if (typeof uploadData.size === "number" && uploadData.size > 0) {
            analyzeBody.originalFileSizeBytes = uploadData.size;
          }
          analyzeBody.stream = true;
          analyzeRunIdRef.current += 1;
          const thisRunId = analyzeRunIdRef.current;
          return fetch("/api/receipt/analyze", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(analyzeBody),
          }).then((res) => ({ response: res, runId: thisRunId }));
        })
        .then(async (value: { response: Response; runId: number } | undefined) => {
          if (!value) return;
          const { response: fullResponse, runId } = value;
          if (!fullResponse.ok) {
            if (fullResponse.status === 401) {
              const sessionMsg = t("errors.sessionEnded");
              setError(sessionMsg);
              setReceipt(null);
              setIsMining(false);
              setCanLeaveAnalyzeScreen(false);
              setCurrentStep(0);
              try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
              toast.error(sessionMsg, { duration: 6000 });
              router.push("/app/login");
              return;
            }
            let errorMessage = t("errors.api.analyzeFailed");
            try {
              const errorData = await fullResponse.json();
              if (typeof errorData === "object" && errorData !== null) {
                if (isCountryRequiredErrorPayload(errorData)) {
                  pendingCountryRetryRef.current = () => handleFileSelect(file, expenseType);
                  setReceipt(null);
                  setIsMining(false);
                  setCanLeaveAnalyzeScreen(false);
                  setCurrentStep(0);
                  try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
                  setShowCountryModal(true);
                  return;
                }
                const firstReason = Array.isArray(errorData.rejectionReasons) && errorData.rejectionReasons[0]
                  ? errorData.rejectionReasons[0]
                  : null;
                const primary = errorData.error || errorData.details || errorData.message;
                const raw = firstReason || primary;
                errorMessage = translateApiError(raw, t) || raw || t("errors.api.analyzeFailed");
                setRejectionNoBackground(firstReason === "Arka plan yok");
              }
            } catch {
              // Ignore parse errors
            }
            toast.error(t("mine.error.analyze"), { description: errorMessage, duration: 8000 });
            setError(errorMessage);
            setReceipt(null);
            setIsMining(false);
            setCanLeaveAnalyzeScreen(false);
            setCurrentStep(0);
            try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
            return;
          }
          
          const contentType = fullResponse.headers.get("content-type") ?? "";
          let fullAnalysis: (ReceiptAnalysis & { actionResult?: MobileActionResult }) | null = null;
          if (contentType.includes("ndjson") && fullResponse.body) {
            const reader = fullResponse.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const obj = JSON.parse(line) as { type: string; step?: number; label?: string; error?: string; merchantName?: string | null; date?: string | null; total?: number; currency?: string | null; category?: string | null; itemCount?: number };
                  if (obj.type === "partial" && runId === analyzeRunIdRef.current) {
                    setPartialReceipt({
                      merchantName: obj.merchantName ?? null,
                      date: obj.date ?? null,
                      total: typeof obj.total === "number" ? obj.total : 0,
                      currency: obj.currency ?? null,
                      category: obj.category ?? null,
                      itemCount: typeof obj.itemCount === "number" ? obj.itemCount : 0,
                    });
                  } else if (obj.type === "done" && runId === analyzeRunIdRef.current) {
                    const { type: _t, ...payload } = obj as { type: string } & ReceiptAnalysis;
                    fullAnalysis = payload as ReceiptAnalysis;
                  } else if (obj.type === "error" && typeof obj.error === "string" && runId === analyzeRunIdRef.current) {
                    if (isCountryRequiredErrorPayload(obj)) {
                      pendingCountryRetryRef.current = () => handleFileSelect(file, expenseType);
                      setReceipt(null);
                      setIsMining(false);
                      setCanLeaveAnalyzeScreen(false);
                      setCurrentStep(0);
                      try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
                      setShowCountryModal(true);
                      return;
                    }
                    const message = translateApiError(obj.error, t) || obj.error;
                    setError(message);
                    setReceipt(null);
                    setIsMining(false);
                    setCanLeaveAnalyzeScreen(false);
                    setCurrentStep(0);
                    try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
                    toast.error(t("mine.error.analyze"), { description: message, duration: 5000 });
                    return;
                  }
                } catch {
                  // skip malformed line
                }
              }
            }
            if (buffer.trim()) {
              try {
                const obj = JSON.parse(buffer) as { type: string; error?: string };
                if (obj.type === "done" && runId === analyzeRunIdRef.current) {
                  const { type: _t, ...payload } = obj as { type: string } & ReceiptAnalysis & { actionResult?: MobileActionResult };
                  fullAnalysis = payload as ReceiptAnalysis & { actionResult?: MobileActionResult };
                } else if (obj.type === "error" && typeof obj.error === "string" && runId === analyzeRunIdRef.current) {
                  if (isCountryRequiredErrorPayload(obj)) {
                    pendingCountryRetryRef.current = () => handleFileSelect(file, expenseType);
                    setReceipt(null);
                    setIsMining(false);
                    setCanLeaveAnalyzeScreen(false);
                    setCurrentStep(0);
                    try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
                    setShowCountryModal(true);
                    return;
                  }
                  const message = translateApiError(obj.error, t) || obj.error;
                  setError(message);
                  setReceipt(null);
                  setIsMining(false);
                  setCanLeaveAnalyzeScreen(false);
                  setCurrentStep(0);
                  try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
                  toast.error(t("mine.error.analyze"), { description: message, duration: 5000 });
                  return;
                }
              } catch {
                // ignore
              }
            }
            if (!fullAnalysis && runId === analyzeRunIdRef.current) {
              setError(t("errors.api.analyzeFailed"));
              setReceipt(null);
              setIsMining(false);
              setCanLeaveAnalyzeScreen(false);
              setCurrentStep(0);
              try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
              return;
            }
            if (!fullAnalysis) return;
          } else {
            fullAnalysis = await fullResponse.json();
          }
          if (!fullAnalysis) {
            setError(t("errors.api.analyzeFailed"));
            setReceipt(null);
            setIsMining(false);
            setCanLeaveAnalyzeScreen(false);
            setCurrentStep(0);
            try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
            return;
          }
          
          // Check if receipt was rejected
          if (fullAnalysis.status === "rejected" || fullAnalysis.flags?.rejected) {
            const rejectionReasons = fullAnalysis.flags?.rejectionReasons || [];
            const rawRejection = rejectionReasons[0] || "This document doesn't appear to be a valid receipt.";
            const rejectionMessage = translateApiError(rawRejection, t) || rawRejection;
            setRejectionNoBackground(rawRejection === "Arka plan yok");
            
            toast.error(t("mine.error.rejected"), {
              description: rejectionMessage,
              duration: 5000,
            });
            
            setError(rejectionMessage);
            setReceipt(null);
            setIsMining(false);
            setCanLeaveAnalyzeScreen(false);
            setCurrentStep(0);
            try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
            return;
          }
          
          // Check for duplicate warning
          if (fullAnalysis.verification?.isDuplicate) {
            toast.warning(t("errors.duplicateWarning"), {
              description: t("mine.duplicateToastDesc", { id: fullAnalysis.verification.duplicateReceiptId?.substring(0, 8) ?? "" }),
              duration: 8000,
            });
          }
          
          // Check if time is missing - show time picker modal
          const hasTime = fullAnalysis.extraction?.time?.value && fullAnalysis.extraction.time.value !== "";
          if (!hasTime) {
            console.log("[mine] Time missing - showing time picker modal");
            setPendingTimeAnalysis({ analysis: fullAnalysis, imageUrl });
            setShowTimeModal(true);
            setIsMining(false);
            setCanLeaveAnalyzeScreen(false);
            return;
          }
          
          // Process with existing time
          await processAnalysisWithTime(fullAnalysis, imageUrl, fullAnalysis.extraction?.time?.value);
        })
        .catch((err) => {
          console.error("[mine] Upload or analysis error:", err);
          const errMsg = err instanceof Error ? err.message : t("mine.error.analysisFailed");
          setError(translateApiError(errMsg, t) || errMsg);
          setReceipt(null);
          setIsMining(false);
          setCanLeaveAnalyzeScreen(false);
          setCurrentStep(0);
          try { URL.revokeObjectURL(imageUrl); } catch { /* ignore */ }
          toast.error(t("mine.error.analyze"), {
            description: translateApiError(errMsg, t) || t("mine.error.analysisFailed"),
            duration: 5000,
          });
        })
      } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("mine.error.processImage");
      const isMemoryError = /bellek\s*yetersiz|insufficient\s*memory|out\s*of\s*memory|quotaexceeded/i.test(String(errorMessage));

      if (isMemoryError) {
        toast.error(t("errors.memory"), {
          description: t("mine.photoTooLargeDesc"),
          duration: 8000,
        });
      } else {
        toast.error(t("mine.error.upload"), {
          description: translateApiError(errorMessage, t) || errorMessage,
          duration: 5000,
        });
      }

      setError(translateApiError(errorMessage, t) || errorMessage);
      setReceipt(null);
      setCanLeaveAnalyzeScreen(false);
      setCurrentStep(0);
      } finally {
        uploadAnalyzeInFlightRef.current = false;
        setIsProcessing(false);
      }
    })();
    return true;
  };

  // Automatically advance to the result step when analysis finishes (step 2 once receipt is set)

  // Handle save receipt
  // Inline correction applied immediately (merchant/date/time): keep both the
  // display receipt AND originalAnalysis (what Save persists) in sync so the save
  // doesn't overwrite the correction. Reward fields (total/vat) are admin-gated
  // and never reach this callback.
  const handleFieldApplied = (field: string, value: string) => {
    setReceipt((prev) => {
      if (!prev) return prev;
      if (field === "merchant_name") return { ...prev, merchantName: value };
      if (field === "date") return { ...prev, date: value };
      if (field === "time") return { ...prev, time: value } as Receipt;
      return prev;
    });
    setOriginalAnalysis((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
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

  const handleSaveReceipt = async () => {
    if (!originalAnalysis || isSaving) return;

    // Check if receipt is duplicate - don't save if duplicate
    if (originalAnalysis.verification?.isDuplicate) {
      toast.warning(t("errors.duplicateReceipt"), {
        description: t("mine.duplicateNotSavedDesc"),
        duration: 5000,
      });
      // Still navigate to complete step but don't save
      setCurrentStep(4);
      return;
    }

    setIsSaving(true);
    setError(null);

    // Optimistic UI: Navigate to complete step (Done)
    setCurrentStep(4);
    
    // Save in background. The UI already advanced to Done (optimistic), so the
    // network call must not be raced by an arbitrary abort: a cold-start save
    // (insert + daily quests + two level snapshots + mobile action result)
    // legitimately runs several seconds, and the old 5s abort turned those into
    // silent failures that left the receipt stuck on `scanned`. Each attempt now
    // runs to completion, and any failure is retried once so a confirmed receipt
    // reliably lands as `verified`. The server upsert is idempotent (a terminal
    // row is skipped), which makes the retry safe.
    const analysisToSave: ReceiptAnalysis = {
      ...originalAnalysis,
      status: "verified",
      createdAt: new Date().toISOString(),
    };

    const applySaved = async (
      saved: Partial<ReceiptAnalysis> & { actionResult?: MobileActionResult },
    ) => {
      await localDb.set(
        "receipts",
        createReceiptRecordFromAnalysis({
          ...analysisToSave,
          ...saved,
          status: saved.status ?? analysisToSave.status,
        }),
      );
      await rebuildLocalInsightsFromReceipts().catch(() => {});
      if (saved.actionResult) {
        await applyMobileActionResult(saved.actionResult, queryClient, { onLevelEvent: announceLevelUp });
      } else {
        await syncMobileData({ fullProfile: true }).catch(() => null);
      }
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY("monthly") });
      queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    };

    const postOnce = async (): Promise<Partial<ReceiptAnalysis> & { actionResult?: MobileActionResult }> => {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisToSave),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Save failed: ${response.status}` }));
        throw new Error(errorData.error || "Failed to save receipt");
      }
      return response.json();
    };

    const savePromise = (async () => {
      try {
        let saved: Partial<ReceiptAnalysis> & { actionResult?: MobileActionResult };
        try {
          saved = await postOnce();
        } catch (firstError: unknown) {
          console.warn("Receipt save failed, retrying once:", firstError);
          saved = await postOnce();
        }
        console.log("Receipt saved successfully:", saved.receiptId);
        await applySaved(saved);
      } catch (err: unknown) {
        console.error("Failed to save receipt (both attempts):", err);
      } finally {
        setIsSaving(false);
      }
    })();

    savePromise.catch(() => {});
  };

  // Reset and mine another receipt
  const handleMineAnother = () => {
    setCurrentStep(0);
    setSelectedFile(null);
    setReceipt(null);
    setOriginalAnalysis(null);
    setSyntheticReceiptUrl(null);
    setError(null);
    setRejectionNoBackground(false);
    setIsMining(false);
    setIsSaving(false);
    setCanLeaveAnalyzeScreen(false);
  };

  const handleLeaveAnalyzeScreen = () => {
    toast.success(
      localeText(
        "Fiş yüklendi, analiz arka planda devam ediyor.",
        "Receipt uploaded, analysis continues in background.",
        "Чек загружен, анализ продолжается в фоне.",
        "อัปโหลดใบเสร็จแล้ว การวิเคราะห์กำลังทำงานเบื้องหลัง",
        "Recibo cargado, el análisis continúa en segundo plano.",
        "收据已上传，分析将在后台继续。",
      ),
      {
        description:
          localeText(
            "Analiz tamamlanınca bildirim alacaksınız.",
            "You will be notified when analysis is complete.",
            "Вы получите уведомление, когда анализ завершится.",
            "คุณจะได้รับการแจ้งเตือนเมื่อการวิเคราะห์เสร็จสิ้น",
            "Recibirás una notificación cuando termine el análisis.",
            "分析完成后你会收到通知。",
          ),
        duration: 5000,
      }
    );
    router.push("/app/receipts");
  };

  if (isDesktop) {
    return (
      <AppShell>
        <DesktopUploadMessage />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto">
          <ReceiptPipelineError
            message={error}
            onRetry={handleMineAnother}
            locale={locale}
            accountLevel={accountLevel}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className={isAnalyzeScreen ? "p-2 sm:p-2 pb-[clamp(3.75rem,10svh,5rem)] min-h-0 overflow-hidden" : undefined}>
      <div className={`max-w-md mx-auto ${isAnalyzeScreen ? "space-y-2 h-full min-h-0 overflow-hidden" : "space-y-4"}`}>
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
        {/* Scan step - capture receipt via camera */}
        {currentStep === 0 && (
          <ReceiptScanner
            onCapture={handleFileSelect}
            locale={locale}
            className={isProcessing ? "opacity-50 pointer-events-none" : ""}
            onClose={() => router.back()}
          />
        )}

        {currentStep === 1 && (
          <ReceiptAnalyzingStep
            canLeaveScreen={canLeaveAnalyzeScreen}
            leaveHintText={
              localeText(
                "Fiş sunucuya yüklendi. Bu ekrandan çıkabilirsiniz, analiz arka planda devam eder.",
                "Receipt reached the server. You can leave this screen while analysis continues in the background.",
                "Чек отправлен на сервер. Можно выйти с этого экрана, анализ продолжится в фоне.",
                "ใบเสร็จถูกอัปโหลดไปยังเซิร์ฟเวอร์แล้ว คุณออกจากหน้านี้ได้ การวิเคราะห์จะทำงานต่อเบื้องหลัง",
                "El recibo llegó al servidor. Puedes salir de esta pantalla mientras el análisis continúa en segundo plano.",
                "收据已上传到服务器。你可以离开此页面，分析将在后台继续。",
              )
            }
            leaveButtonText={localeText(
              "Arka planda devam et",
              "Continue in background",
              "Продолжить в фоне",
              "ทำต่อในพื้นหลัง",
              "Continuar en segundo plano",
              "在后台继续",
            )}
            onLeaveScreen={handleLeaveAnalyzeScreen}
            locale={locale}
            accountLevel={accountLevel}
            partial={partialReceipt}
            revealReceipt={revealReady ? receipt : null}
            onRevealComplete={() => {
              setRevealReady(false);
              setCurrentStep(2);
            }}
          />
        )}

        {currentStep === 2 && receipt && (
          <ReceiptResultWithBreakdownStep
            receipt={receipt}
            onContinue={handleSaveReceipt}
            onCancel={handleMineAnother}
            locale={locale}
            accountLevel={accountLevel}
            editableReceiptId={receipt.id}
            onFieldApplied={handleFieldApplied}
            primaryLabel={t("common.save")}
            isSaving={isSaving}
          />
        )}

        {currentStep === 4 && receipt && (
          <ReceiptDoneStep
            receipt={receipt}
            onMineAnother={handleMineAnother}
            onViewReceipts={() => router.push("/app/receipts")}
            locale={locale}
            accountLevel={accountLevel}
          />
        )}
      </div>
      
      {/* Time Picker Modal - shown when time not detected */}
      <TimePickerModal
        open={showTimeModal}
        onClose={handleTimeSkip}
        onConfirm={handleTimeConfirm}
        locale={locale}
      />

      {/* Quality Issues Modal */}
      <QualityIssuesModal
        open={showQualityModal}
        onClose={() => {
          setShowQualityModal(false);
          setSelectedFile(null);
          setIsProcessing(false);
        }}
        onRetry={() => {
          setShowQualityModal(false);
          setQualityIssues([]);
          // File input will be reset, user can select again
          setSelectedFile(null);
          setIsProcessing(false);
        }}
        issues={qualityIssues}
        locale={locale}
      />
    </AppShell>
  );
}