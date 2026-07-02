"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";

interface MiningStep {
  label: string;
  description: string;
  progress: number;
}

interface MiningProgressProps {
  isActive: boolean;
  onComplete?: () => void;
  className?: string;
  estimatedDuration?: number; // Estimated duration in milliseconds (based on OCR)
  actualProgress?: number; // Actual progress from backend (0-100), overrides time-based progress
}

export function MiningProgress({ isActive, onComplete, className, estimatedDuration = 8000, actualProgress }: MiningProgressProps) {
  const { t } = useAppLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const steps: MiningStep[] = [
    { label: t("mining.step.extracting"), description: t("mining.step.extractingDesc"), progress: 10 },
    { label: t("mining.step.calculating"), description: t("mining.step.calculatingDesc"), progress: 25 },
    { label: t("mining.step.categorizing"), description: t("mining.step.categorizingDesc"), progress: 40 },
    { label: t("mining.step.generating"), description: t("mining.step.generatingDesc"), progress: 70 },
    { label: t("mining.step.finalizing"), description: t("mining.step.finalizingDesc"), progress: 100 },
  ];

  useEffect(() => {
    if (!isActive) {
      // Reset if mining stopped
      setStartTime(null);
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // Record start time when mining begins
    if (startTime === null) {
      setStartTime(Date.now());
    }

    const start = startTime || Date.now();
    let stepIndex = 0;
    let lastProgress = 0;

    // Calculate progress based on actual progress or elapsed time vs estimated duration
    const updateProgress = () => {
      // If actual progress is 100%, go directly to 100% and wait 1 second before completing
      if (actualProgress !== undefined && actualProgress !== null && actualProgress >= 100) {
        if (lastProgress < 100) {
          lastProgress = 100;
          setProgress(100);
          setCurrentStep(steps.length - 1);
          // Wait 1 second before completing
          setTimeout(() => {
            onComplete?.();
          }, 1000);
        }
        return;
      }

      // Don't update if already at 100%
      if (lastProgress >= 100) {
        return;
      }

      let targetProgress: number;

      // If actual progress is provided and >= 85, use it
      if (actualProgress !== undefined && actualProgress !== null && actualProgress >= 85) {
        targetProgress = Math.max(actualProgress, lastProgress);
      } else {
        // Time-based progress: slowly progress to 85%
        const elapsed = Date.now() - start;
        // Progress to 85% over estimated duration
        const timeBasedProgress = Math.min((elapsed / estimatedDuration) * 85, 85);
        
        // If actual progress is provided but < 85, use the minimum of time-based and actual
        if (actualProgress !== undefined && actualProgress !== null) {
          targetProgress = Math.min(timeBasedProgress, actualProgress);
        } else {
          targetProgress = timeBasedProgress;
        }
      }

      // Determine current step based on progress
      // Steps represent the END percentage of each step
      // Step 0: 0-10%, Step 1: 10-25%, Step 2: 25-40%, Step 3: 40-70%, Step 4: 70-100%
      let newStepIndex = 0;
      
      // Check each step range
      if (targetProgress < steps[0].progress) {
        // 0-10%: Extracting Data
        newStepIndex = 0;
      } else if (targetProgress < steps[1].progress) {
        // 10-25%: Calculating Hidden Costs
        newStepIndex = 1;
      } else if (targetProgress < steps[2].progress) {
        // 25-40%: Categorizing Expenses
        newStepIndex = 2;
      } else if (targetProgress < steps[3].progress) {
        // 40-70%: Generating Receipt
        newStepIndex = 3;
      } else {
        // 70-100%: Finalizing
        newStepIndex = 4;
      }

      if (newStepIndex !== stepIndex) {
        stepIndex = newStepIndex;
        setCurrentStep(stepIndex);
      }

      // Smooth progress: ensure it progresses realistically and NEVER goes backwards
      // Add very small random variation only for time-based progress
      let smoothProgress = targetProgress;
      if (actualProgress === undefined || actualProgress === null || actualProgress < 85) {
        smoothProgress = targetProgress + (Math.random() * 0.08 - 0.04); // ±0.04% variation
      }
      // Never go backwards - always increase or stay the same
      const finalProgress = Math.min(Math.max(smoothProgress, lastProgress), actualProgress !== undefined && actualProgress !== null && actualProgress >= 85 ? actualProgress : 85);

      // Only update if progress increased
      if (finalProgress > lastProgress) {
        lastProgress = finalProgress;
        setProgress(finalProgress);
      }
    };

    // Update every 150ms for smoother animation
    const interval = setInterval(updateProgress, 150);

    return () => clearInterval(interval);
  }, [isActive, onComplete, estimatedDuration, startTime, actualProgress, steps]);


  if (!isActive) return null;

  const currentStepData = steps[currentStep] || steps[steps.length - 1];

  return (
    <Card className={cn("card-cinematic", className)}>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t("mining.title")}</h3>
          <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{currentStepData.label}</span>
            <span className="font-semibold tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-3 text-sm transition-opacity",
                idx < currentStep ? "opacity-100" : idx === currentStep ? "opacity-100" : "opacity-40"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  idx < currentStep
                    ? "bg-primary text-primary-foreground"
                    : idx === currentStep
                    ? "bg-primary/50 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {idx < currentStep ? "✓" : idx + 1}
              </div>
              <div className="flex-1">
                <p className={cn("font-medium", idx === currentStep && "text-primary")}>{step.label}</p>
                {idx === currentStep && (
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



