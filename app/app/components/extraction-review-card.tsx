"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Extraction } from "@/lib/receipt/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface ExtractionReviewCardProps {
  extraction: Extraction;
  onUpdate?: (extraction: Extraction) => void; // Made optional since we don't allow edits
}

export function ExtractionReviewCard({
  extraction,
}: ExtractionReviewCardProps) {
  const { t } = useAppLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("extractionCard.title")}</CardTitle>
        <CardDescription>{t("extractionCard.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("extractionCard.date")}</span>
            <Badge variant={extraction.date.confidence >= 0.7 ? "default" : "secondary"}>
              {t("extractionCard.confidence", { pct: (extraction.date.confidence * 100).toFixed(0) })}
            </Badge>
          </div>
          <p className="text-lg font-semibold">{extraction.date.value}</p>
          {extraction.date.sourceLine && (
            <span className="text-xs text-muted-foreground">
              {t("extractionCard.sourceLine", { line: extraction.date.sourceLine })}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("extractionCard.totalAmount")}</span>
            <Badge variant={extraction.total.confidence >= 0.7 ? "default" : "secondary"}>
              {t("extractionCard.confidence", { pct: (extraction.total.confidence * 100).toFixed(0) })}
            </Badge>
          </div>
          <p className="text-lg font-semibold">
            {typeof extraction.total.value === 'number'
              ? extraction.total.value.toFixed(2)
              : extraction.total.value}
            {extraction.total.currency && ` ${extraction.total.currency}`}
          </p>
          {extraction.total.sourceLine && (
            <span className="text-xs text-muted-foreground">
              {t("extractionCard.sourceLine", { line: extraction.total.sourceLine })}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("extractionCard.vatAmount")}</span>
            <div className="flex items-center gap-2">
              <Badge variant={extraction.vat.confidence >= 0.7 ? "default" : "secondary"}>
                {t("extractionCard.confidence", { pct: (extraction.vat.confidence * 100).toFixed(0) })}
              </Badge>
              {extraction.vat.rate && (
                <Badge variant="outline">
                  {t("extractionCard.rate", { pct: (extraction.vat.rate * 100).toFixed(0) })}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-lg font-semibold">{extraction.vat.value.toFixed(2)}</p>
          {extraction.vat.sourceLine && (
            <span className="text-xs text-muted-foreground">
              {t("extractionCard.sourceLine", { line: extraction.vat.sourceLine })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


