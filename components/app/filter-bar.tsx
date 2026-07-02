"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReceiptFilters } from "@/lib/mock/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface FilterBarProps {
  filters: ReceiptFilters;
  onFiltersChange: (filters: ReceiptFilters) => void;
  className?: string;
}

export function FilterBar({ filters, onFiltersChange, className }: FilterBarProps) {
  const { t } = useAppLocale();
  const hasActiveFilters = filters.search || filters.status || filters.country || filters.verifiedOnly;

  return (
    <Card className={cn("card-cinematic", className)}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("filter.search.placeholder")}
              value={filters.search || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value || undefined })
              }
              className="pl-9"
            />
          </div>

          <select
            value={filters.status || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as ReceiptFilters["status"] || undefined,
              })
            }
            className="px-3 py-2 rounded-md bg-background border border-input text-sm"
          >
            <option value="">{t("filter.status.all")}</option>
            <option value="VERIFIED">{t("filter.status.verified")}</option>
            <option value="NEEDS_REVIEW">{t("filter.status.needsReview")}</option>
            <option value="REJECTED">{t("filter.status.rejected")}</option>
          </select>

          <select
            value={filters.country || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                country: e.target.value || undefined,
              })
            }
            className="px-3 py-2 rounded-md bg-background border border-input text-sm"
          >
            <option value="">{t("filter.country.all")}</option>
            <option value="TH">{t("filter.country.th")}</option>
            <option value="TW">{t("filter.country.tw")}</option>
            <option value="TR">{t("filter.country.tr")}</option>
            <option value="US">{t("filter.country.us")}</option>
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.verifiedOnly || false}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  verifiedOnly: e.target.checked || undefined,
                })
              }
              className="rounded"
            />
            <span>{t("filter.verifiedOnly")}</span>
          </label>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  dateFrom: filters.dateFrom,
                  dateTo: filters.dateTo,
                })
              }
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {t("filter.clear")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}







