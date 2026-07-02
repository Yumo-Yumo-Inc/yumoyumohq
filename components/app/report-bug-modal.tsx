"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppLocale } from "@/lib/i18n/app-context";
import { toast } from "sonner";

const BUG_TYPE_KEYS = [
  "category_wrong",
  "date_wrong",
  "merchant_name_wrong",
  "time_wrong",
  "total_wrong",
] as const;

interface ReportBugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
  onSuccess?: () => void;
}

export function ReportBugModal({
  open,
  onOpenChange,
  receiptId,
  onSuccess,
}: ReportBugModalProps) {
  const { t } = useAppLocale();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const optionsSorted = useMemo(() => {
    return [...BUG_TYPE_KEYS]
      .map((key) => ({
        key,
        label: t(`reportBug.types.${key}`),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [t]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    const bugTypes = Array.from(selected);
    if (bugTypes.length === 0) {
      toast.error(t("reportBug.selectAtLeastOne"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/receipt/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId, bugTypes }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to submit feedback");
        return;
      }

      toast.success(
        typeof data === "object" && data.id
          ? (t("reportBug.title") + " submitted.")
          : "Feedback submitted."
      );
      setSelected(new Set());
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reportBug.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            {t("reportBug.selectAtLeastOne")}
          </p>
          <div className="space-y-2">
            {optionsSorted.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer rounded-md p-2 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.has(key)}
                  onCheckedChange={() => toggle(key)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "..." : t("reportBug.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
