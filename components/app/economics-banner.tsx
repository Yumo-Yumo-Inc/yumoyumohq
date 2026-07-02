"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { ThemeCard } from "@/components/app/theme-card";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getEconomicsContext } from "@/lib/utils/economics-context";
import { getEconomicsTexts } from "@/lib/utils/economics-texts";

interface EconomicsBannerProps {
  merchantChannel?: string;
  accountLevel?: number;
  className?: string;
}

export function EconomicsBanner({
  merchantChannel = "other",
  accountLevel = 1,
  className,
}: EconomicsBannerProps) {
  const { t } = useAppLocale();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const context = getEconomicsContext(merchantChannel);
  const texts = getEconomicsTexts(context);

  return (
    <TooltipProvider>
      <ThemeCard accountLevel={accountLevel} className={cn("p-4", className)}>
        <div className="flex items-start gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="mt-0.5 flex-shrink-0 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  color: "var(--app-text-muted)",
                }}
                aria-label="Learn more about hidden costs"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-xs p-3 text-sm leading-relaxed"
            >
              <p>{texts.tooltip}</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex-1 min-w-0">
            <p className="leading-relaxed text-sm" style={{ color: "var(--app-text-primary)" }}>
              {texts.banner}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="mt-0.5 flex-shrink-0 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ color: "var(--app-text-muted)" }}
            aria-label={t("common.dismissBanner")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </ThemeCard>
    </TooltipProvider>
  );
}
