"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppLocale } from "@/lib/i18n/app-context";

export type MiningStep = 
  | "uploading"
  | "ocr"
  | "extraction"
  | "merchant"
  | "calculation"
  | "verification"
  | "complete";

interface MiningStepInfo {
  label: string;
  description: string;
}

function getStepInfo(t: (key: string) => string): Record<MiningStep, MiningStepInfo> {
  return {
    uploading: {
      label: t("mining.modal.uploading"),
      description: t("mining.modal.uploadingDesc"),
    },
    ocr: {
      label: t("mining.modal.ocr"),
      description: t("mining.modal.ocrDesc"),
    },
    extraction: {
      label: t("mining.modal.extraction"),
      description: t("mining.modal.extractionDesc"),
    },
    merchant: {
      label: t("mining.modal.merchant"),
      description: t("mining.modal.merchantDesc"),
    },
    calculation: {
      label: t("mining.modal.calculation"),
      description: t("mining.modal.calculationDesc"),
    },
    verification: {
      label: t("mining.modal.verification"),
      description: t("mining.modal.verificationDesc"),
    },
    complete: {
      label: t("mining.modal.complete"),
      description: t("mining.modal.completeDesc"),
    },
  };
}

const STEP_ORDER: MiningStep[] = [
  "uploading",
  "ocr",
  "extraction",
  "merchant",
  "calculation",
  "verification",
  "complete",
];

interface MiningModalProps {
  open: boolean;
  currentStep: MiningStep;
  progress?: number; // 0-100
}

export function MiningModal({ open, currentStep, progress }: MiningModalProps) {
  const { t } = useAppLocale();
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const STEP_INFO = getStepInfo(t);

  useEffect(() => {
    if (progress !== undefined) {
      // Animate progress bar
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Calculate progress based on step
      const stepIndex = STEP_ORDER.indexOf(currentStep);
      const totalSteps = STEP_ORDER.length - 1; // Exclude "complete"
      const calculatedProgress = (stepIndex / totalSteps) * 100;
      setAnimatedProgress(calculatedProgress);
    }
  }, [currentStep, progress]);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const currentStepInfo = STEP_INFO[currentStep];

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&_button.absolute.right-4.top-4]:hidden bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] border-[var(--app-border)]"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ color: "var(--app-text-primary)" }}>
            {t("mining.modal.title")}
          </DialogTitle>
          <DialogDescription className="!text-[var(--app-text-muted)]">
            {t("mining.modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--app-text-muted)" }}>{t("mining.modal.progress")}</span>
              <span className="font-medium" style={{ color: "var(--app-text-primary)" }}>{Math.round(animatedProgress)}%</span>
            </div>
            <Progress value={animatedProgress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {currentStep === "complete" ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
              <div className="flex-1">
                <p className="font-semibold" style={{ color: "var(--app-text-primary)" }}>{currentStepInfo.label}</p>
                <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
                  {currentStepInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Step List */}
          <div className="space-y-3 pt-2">
            {STEP_ORDER.slice(0, -1).map((step, index) => {
              const stepInfo = STEP_INFO[step];
              const isActive = step === currentStep;
              const isCompleted = index < currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 text-sm transition-opacity ${
                    isPending ? "opacity-40" : ""
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 flex-shrink-0" style={{ color: "var(--app-text-muted)" }} />
                  )}
                  <div className="flex-1">
                    <p
                      className={isActive ? "font-semibold" : ""}
                      style={{ color: isActive ? "var(--app-text-primary)" : "var(--app-text-muted)" }}
                    >
                      {stepInfo.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

