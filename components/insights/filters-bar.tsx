"use client";

import { ThemeCard } from "@/components/app/theme-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { InsightsFilters } from "@/lib/insights/types";
import { useAppLocale } from "@/lib/i18n/app-context";
import { categoryLabel } from "@/lib/i18n/taxonomy";

interface FiltersBarProps {
  filters: InsightsFilters;
  onFiltersChange: (filters: InsightsFilters) => void;
  availableCountries: string[];
  availableCategories: string[];
  defaultCurrency: string;
  accountLevel?: number;
}

export function FiltersBar({
  filters,
  onFiltersChange,
  availableCountries,
  availableCategories,
  defaultCurrency,
  accountLevel = 1,
}: FiltersBarProps) {
  const { t, locale } = useAppLocale();
  const updateFilter = (key: keyof InsightsFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.timeRange ||
    filters.country ||
    filters.category ||
    filters.merchant;

  return (
    <ThemeCard accountLevel={accountLevel} className="p-4">
      <div className="flex flex-wrap items-center gap-3">
      {/* Time Range */}
      <Select
        value={filters.timeRange || "all"}
        onValueChange={(value) =>
          updateFilter("timeRange", value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder={t("insights.filters.timeRange")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("insights.filters.allTime")}</SelectItem>
          <SelectItem value="7d">{t("insights.filters.last7Days")}</SelectItem>
          <SelectItem value="30d">{t("insights.filters.last30Days")}</SelectItem>
          <SelectItem value="90d">{t("insights.filters.last90Days")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Country */}
      {availableCountries.length > 0 && (
        <Select
          value={filters.country || "all"}
          onValueChange={(value) =>
            updateFilter("country", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t("insights.filters.country")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("insights.filters.allCountries")}</SelectItem>
            {availableCountries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Category */}
      {availableCategories.length > 0 && (
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            updateFilter("category", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("insights.filters.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("insights.filters.allCategories")}</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {categoryLabel(category, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Merchant Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--app-text-muted)" }} />
        <Input
          placeholder={t("insights.filters.searchMerchant")}
          value={filters.merchant || ""}
          onChange={(e) =>
            updateFilter("merchant", e.target.value || undefined)
          }
          className="pl-9"
        />
      </div>

      {/* Currency Display (read-only) */}
      <div className="px-3 py-2 text-sm rounded-md" style={{ color: "var(--app-text-muted)", border: "1px solid var(--app-border)" }}>
        {t("insights.filters.currency")}: {defaultCurrency}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          {t("insights.filters.clear")}
        </Button>
      )}
      </div>
    </ThemeCard>
  );
}





