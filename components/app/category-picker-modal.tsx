"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/lib/i18n/app-context";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import { CANONICAL_RECEIPT_CATEGORIES } from "@/lib/receipt/categories";
import type { YumoLocale } from "@/lib/product-architecture/dashboard-contract";
import { toast } from "sonner";

interface CategoryPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
  onSubmitted?: (category: string) => void;
}

export function CategoryPickerModal({
  open,
  onOpenChange,
  receiptId,
  onSubmitted,
}: CategoryPickerModalProps) {
  const { t, locale } = useAppLocale();
  const [value, setValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = useMemo(() => {
    return (CANONICAL_RECEIPT_CATEGORIES as readonly string[])
      .filter((c) => c !== "other")
      .map((slug) => ({
        slug,
        label: categoryLabel(slug, locale as YumoLocale) || slug,
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      );
  }, [locale]);

  const submit = async () => {
    if (!value || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/receipt/category-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId, category: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(t("categoryPicker.successToast"));
      onSubmitted?.(value);
      onOpenChange(false);
    } catch (err) {
      console.error("[category-picker] submit failed:", err);
      toast.error(t("categoryPicker.errorToast"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("categoryPicker.title")}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t("categoryPicker.subtitle")}
        </p>

        <div className="py-2">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder={t("categoryPicker.placeholder")} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {options.map((opt) => (
                <SelectItem key={opt.slug} value={opt.slug}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {t("categoryPicker.reviewNote")}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("categoryPicker.skip")}
          </Button>
          <Button onClick={submit} disabled={!value || isSubmitting}>
            {isSubmitting
              ? t("categoryPicker.submitting")
              : t("categoryPicker.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
