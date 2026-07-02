"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";

interface StepperProps {
  steps: { label: string; key: string }[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const currentStepInt = Math.floor(currentStep);
  const currentStepData = steps[currentStepInt];
  
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Show current step label prominently */}
      <div className="block sm:hidden mb-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">
            {l(
              `Adım ${currentStepInt + 1} / ${steps.length}`,
              `Step ${currentStepInt + 1} of ${steps.length}`,
              `Шаг ${currentStepInt + 1} из ${steps.length}`,
              `ขั้นตอน ${currentStepInt + 1} จาก ${steps.length}`,
              `Paso ${currentStepInt + 1} de ${steps.length}`,
              `第 ${currentStepInt + 1} / ${steps.length} 步`,
            )}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {currentStepData?.label || l("Yükleniyor...", "Loading...", "Загрузка...", "กำลังโหลด...", "Cargando...", "加载中...")}
          </p>
        </div>
      </div>
      
      {/* Stepper circles - mobile optimized */}
      <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-max sm:min-w-0">
          {steps.map((step, index) => {
            const isActive = index === currentStepInt;
            const isCompleted = index < currentStepInt;
            const stepNumber = index + 1;

            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 rounded-full border-2 transition-colors flex-shrink-0",
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 sm:h-5 sm:w-5" />
                    ) : (
                      <span className="font-semibold text-sm sm:text-base">{stepNumber}</span>
                    )}
                  </div>
                  {/* Desktop: Show all labels, Mobile: Hide labels (shown above) */}
                  <p
                    className={cn(
                      "hidden sm:block mt-2 text-sm font-medium text-center w-full whitespace-nowrap overflow-hidden text-ellipsis px-1",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                    title={step.label}
                  >
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 sm:w-12 mx-2 sm:mx-4 transition-colors flex-shrink-0",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

