"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import { ScanIntroModal } from "./scan-intro-modal";
import {
  ArrowLeft,
  Camera,
  ImageIcon,
  Smartphone,
  User,
  Building2,
  ChevronRight,
} from "lucide-react";

/** Mouse-first desktop: camera capture via `<input capture>` usually fails or errors. */
function isLikelyMouseDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Receipt expense type — used to separate personal spending from
 * bulk receipts collected on behalf of a business or another person.
 *
 * - "personal": user's own shopping → Proof of Expenditure → full token reward
 * - "other":    bulk / business receipts → tagged in DB, reduced (10%) reward,
 *               excluded from price-comparison personal baselines
 */
export type ReceiptExpenseType = "personal" | "other";

/** localStorage flag: the one-time scan intro has been dismissed. */
const SCAN_INTRO_SEEN_KEY = "yumo_scan_intro_seen";

interface ReceiptScannerProps {
  /**
   * Called once a file is picked. Receives the file and the user-selected
   * expense type so callers can pass it to the receipt-analyze API.
   */
  onCapture: (file: File, expenseType: ReceiptExpenseType) => boolean | void;
  /** @deprecated Use app locale from context */
  locale?: string;
  className?: string;
  onClose?: () => void;
}

export function ReceiptScanner({ onCapture, className, onClose }: ReceiptScannerProps) {
  const { t } = useAppLocale();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showDesktopCameraHint, setShowDesktopCameraHint] = useState(false);
  const [expenseType, setExpenseType] = useState<ReceiptExpenseType | null>(null);
  // Intro overlay shown before the expense-type picker. By default it appears
  // every time; it is suppressed only once the user opts out via the
  // "don't show again" checkbox. `null` while we read localStorage so we never
  // flash the wrong screen.
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    let suppressed = false;
    try {
      suppressed = window.localStorage.getItem(SCAN_INTRO_SEEN_KEY) === "1";
    } catch {
      // localStorage unavailable (private mode, etc.) — show the intro,
      // it is harmless and stays dismissible.
      suppressed = false;
    }
    setShowIntro(!suppressed);
  }, []);

  /**
   * Dismiss the intro. When `dontShowAgain` is true we persist the opt-out so
   * the intro stays hidden on future scans; otherwise it shows again next time.
   */
  const dismissIntro = useCallback((dontShowAgain: boolean) => {
    if (dontShowAgain) {
      try {
        window.localStorage.setItem(SCAN_INTRO_SEEN_KEY, "1");
      } catch {
        // ignore — dismissal still works for this session
      }
    }
    setShowIntro(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const chosenType = expenseType ?? "personal";
      if (
        file &&
        (file.type.startsWith("image/") ||
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"))
      ) {
        onCapture(file, chosenType);
      }
      e.target.value = "";
    },
    [onCapture, expenseType]
  );

  if (!mounted) return null;

  // Hold render until we know whether the intro was already seen, so the
  // expense-type picker never flashes underneath the first-run overlay.
  if (showIntro === null) return null;

  // First run: show the intro overlay before anything else. The intro gets the
  // same back affordance as the picker (onClose), so the user can always leave
  // the scanner — even from the very first screen.
  if (showIntro) {
    return <ScanIntroModal onDismiss={dismissIntro} onBack={onClose} />;
  }

  const isOther = expenseType === "other";
  const translatedBack = t("common.back");
  const backLabel = translatedBack === "common.back" ? "Back" : translatedBack;
  const translatedOk = t("common.ok");
  const okLabel = translatedOk === "common.ok" ? "OK" : translatedOk;

  return createPortal(
    <div
      className={cn(
        "scanui-surface fixed inset-0 z-[9999] flex flex-col overflow-hidden",
        className
      )}
      style={{ height: "100dvh" }}
    >
      <div className="scanui-blob scanui-blob-p" aria-hidden />
      <div className="scanui-blob scanui-blob-g" aria-hidden />

      <div className="relative z-[1] flex items-center px-5 pt-5 pb-2">
        {/*
         * Step 1 (no expenseType yet): the back button closes the whole scanner.
         * Step 2 (expenseType picked):  the back button returns to the type picker.
         */}
        {(onClose || expenseType) && (
          <button
            type="button"
            onClick={() => {
              if (expenseType) {
                setExpenseType(null);
                return;
              }
              onClose?.();
            }}
            className="scanui-rise flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white transition-opacity hover:opacity-80"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {expenseType === null ? (
        // ── Step 1: expense type picker ────────────────────────────────────
        <div className="relative z-[1] flex flex-1 flex-col justify-center px-6 pb-7">
          <div className="mx-auto w-full max-w-sm">
            <div className="scanui-rise" style={{ animationDelay: "0.08s" }}>
              <h1 className="text-[27px] font-semibold leading-tight tracking-tight text-white">
                {t("receiptScanner.expenseTypeTitle")}
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
                {t("receiptScanner.expenseTypeSubtitle")}
              </p>
            </div>

            {/* Personal — primary, gold-accented */}
            <button
              type="button"
              onClick={() => setExpenseType("personal")}
              className="scanui-rise mt-4 flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors active:opacity-90"
              style={{
                animationDelay: "0.16s",
                borderColor: "rgba(255,198,90,0.45)",
                background: "rgba(255,198,90,0.07)",
              }}
            >
              <div className="scanui-gold-ic flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <User className="h-[22px] w-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15.5px] font-semibold text-white">
                  {t("receiptScanner.expensePersonal")}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/60">
                  {t("receiptScanner.expensePersonalDesc")}
                </p>
              </div>
              <ChevronRight className="h-[18px] w-[18px] shrink-0 text-white/45" />
            </button>

            {/* Other — glass */}
            <button
              type="button"
              onClick={() => setExpenseType("other")}
              className="scanui-rise mt-3 flex w-full items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left transition-colors hover:bg-white/[0.08] active:opacity-90"
              style={{ animationDelay: "0.22s" }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white">
                <Building2 className="h-[22px] w-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15.5px] font-semibold text-white">
                  {t("receiptScanner.expenseOther")}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/60">
                  {t("receiptScanner.expenseOtherDesc")}
                </p>
              </div>
              <ChevronRight className="h-[18px] w-[18px] shrink-0 text-white/45" />
            </button>

            <p
              className="scanui-rise mt-4 text-center text-[11.5px] text-white/55"
              style={{ animationDelay: "0.3s" }}
            >
              {t("receiptScanner.expenseTypeHint")}
            </p>
          </div>
        </div>
      ) : (
        // ── Step 2: original camera / gallery picker ───────────────────────
        <div className="relative z-[1] flex flex-1 flex-col justify-center px-6 pb-7">
          <div className="mx-auto w-full max-w-sm">
            {/* Corner-bracket scan frame */}
            <div
              className="scanui-frame scanui-rise relative mx-auto mb-1 h-[150px] w-[150px]"
              style={{ animationDelay: "0.08s" }}
            >
              <span className="cr tl" />
              <span className="cr tr" />
              <span className="cr bl" />
              <span className="cr br" />
              <span className="gl">
                <Camera className="h-10 w-10" strokeWidth={1.6} />
              </span>
            </div>

            <div
              className="scanui-rise text-center"
              style={{ animationDelay: "0.14s" }}
            >
              <h1 className="text-[27px] font-semibold leading-tight tracking-tight text-white">
                {t("receiptScanner.uploadTitle")}
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
                {t("receiptScanner.uploadSubtitle")}
              </p>
            </div>

            {/* Selected-type chip with “change” affordance */}
            <button
              type="button"
              onClick={() => setExpenseType(null)}
              className="scanui-rise mx-auto mt-3.5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition-opacity hover:opacity-80"
              style={{ animationDelay: "0.2s" }}
            >
              {isOther ? (
                <Building2 className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              <span className="font-semibold text-white">
                {isOther
                  ? t("receiptScanner.expenseOther")
                  : t("receiptScanner.expensePersonal")}
              </span>
              <span className="text-white/40">·</span>
              <span style={{ color: "var(--scanui-gold-text)" }}>
                {t("receiptScanner.expenseTypeBack")}
              </span>
            </button>

            <div
              className="scanui-rise mt-6 space-y-3"
              style={{ animationDelay: "0.26s" }}
            >
              {/* Native camera — OS handles compression, no canvas/OOM risk */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (isLikelyMouseDesktop()) {
                    setShowDesktopCameraHint(true);
                    return;
                  }
                  cameraInputRef.current?.click();
                }}
                className="scanui-gold flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
              >
                <Camera className="h-5 w-5" />
                {t("receiptScanner.takePhoto")}
              </button>

              {/* Gallery / PDF picker */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.055] py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-80"
              >
                <ImageIcon className="h-5 w-5" />
                {t("receiptScanner.pickFile")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDesktopCameraHint ? (
        <div
          className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-camera-hint-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-6 text-center shadow-xl"
            style={{ borderColor: "var(--app-border-strong)" }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Smartphone className="h-7 w-7 text-white/85" aria-hidden />
            </div>
            <h2 id="desktop-camera-hint-title" className="text-base font-semibold text-white">
              {t("mine.desktopOnlyTitle")}
            </h2>
            <p className="mt-2 text-sm text-white/65">{t("receiptScanner.desktopCameraHint")}</p>
            <p className="mt-3 text-sm text-white/50">{t("receiptScanner.desktopPickFileHint")}</p>
            <button
              type="button"
              onClick={() => setShowDesktopCameraHint(false)}
              className="mt-6 w-full rounded-xl bg-[var(--app-primary)] py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              {okLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}
