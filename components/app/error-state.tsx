"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  /** When true, show receipt margin guide illustration (e.g. for "Arka plan yok" / noBackground rejection) */
  showMarginGuide?: boolean;
}

export function ErrorState({
  title,
  message,
  onRetry,
  showMarginGuide = false,
}: ErrorStateProps) {
  const { t } = useAppLocale();
  const defaultTitle = title || t("common.somethingWentWrong");
  return (
    <Card className="card-cinematic border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{defaultTitle}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          {message}
        </p>
        {showMarginGuide && (
          <div className="mb-6 w-full max-w-[200px] flex justify-center rounded-lg border border-border overflow-hidden bg-muted/30 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 180 300"
              width={180}
              height={300}
              className="w-full h-auto"
              aria-hidden
            >
              {/* Outer frame: photo boundary (portrait) */}
              <rect x={2} y={2} width={176} height={236} rx={8} fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" />
              <text x={90} y={14} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="system-ui, sans-serif">Photo should look like this</text>

              {/* Background / spacing area (dark - should appear around the receipt) */}
              <rect x={12} y={24} width={156} height={208} rx={6} fill="#334155" />
              <text x={90} y={20} textAnchor="middle" fontSize={8} fill="#64748b" fontFamily="system-ui, sans-serif">Spacing (dark background)</text>

              {/* Receipt - vertical, white, clearly framed box */}
              <rect x={46} y={36} width={88} height={184} rx={4} fill="#fff" stroke="#0f172a" strokeWidth={2} />
              <text x={90} y={32} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#0f172a" fontFamily="system-ui, sans-serif">Receipt</text>
              <line x1={54} y1={48} x2={126} y2={48} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={60} x2={118} y2={60} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={72} x2={122} y2={72} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={86} x2={110} y2={86} stroke="#94a3b8" strokeWidth={1.5} />
              <line x1={54} y1={100} x2={126} y2={100} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={114} x2={118} y2={114} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={128} x2={122} y2={128} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={142} x2={110} y2={142} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={156} x2={126} y2={156} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={170} x2={118} y2={170} stroke="#94a3b8" strokeWidth={1.5} />
              <line x1={54} y1={184} x2={126} y2={184} stroke="#cbd5e1" strokeWidth={1} />
              <line x1={54} y1={198} x2={122} y2={198} stroke="#cbd5e1" strokeWidth={1} />

              {/* Spacing labels: top, bottom, left, right */}
              <text x={90} y={228} textAnchor="middle" fontSize={8} fill="#64748b" fontFamily="system-ui, sans-serif">spacing</text>
              <text x={28} y={128} textAnchor="middle" fontSize={8} fill="#64748b" fontFamily="system-ui, sans-serif" transform="rotate(-90 28 128)">spacing</text>
              <text x={152} y={128} textAnchor="middle" fontSize={8} fill="#64748b" fontFamily="system-ui, sans-serif" transform="rotate(90 152 128)">spacing</text>

              {/* Bottom description */}
              <text x={90} y={278} textAnchor="middle" fontSize={10} fill="#94a3b8" fontFamily="system-ui, sans-serif">Receipt should be vertical, with a dark background around it</text>
            </svg>
          </div>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            {t("common.tryAgain")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}






