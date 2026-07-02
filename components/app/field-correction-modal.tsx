"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppLocale } from "@/lib/i18n/app-context";
import { toast } from "sonner";

const FIELD_KEYS = ["merchant_name", "date", "time", "total", "vat"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function inputTypeFor(field: FieldKey): string {
  if (field === "total" || field === "vat") return "number";
  if (field === "date") return "date";
  if (field === "time") return "time";
  return "text";
}

export interface CorrectionResult {
  field: FieldKey;
  value: string;
  appliedImmediately: boolean;
}

interface FieldCorrectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
  /** Current values, used to prefill inputs and detect which fields changed. */
  currentValues?: Partial<Record<FieldKey, string>>;
  /** Called with every successfully-submitted field (one or many). */
  onCorrected?: (results: CorrectionResult[]) => void;
  onSuccess?: () => void;
}

export function FieldCorrectionModal({
  open,
  onOpenChange,
  receiptId,
  currentValues,
  onCorrected,
  onSuccess,
}: FieldCorrectionModalProps) {
  const { t } = useAppLocale();
  const [drafts, setDrafts] = useState<Record<FieldKey, string>>({
    merchant_name: "",
    date: "",
    time: "",
    total: "",
    vat: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill from current values each time the modal opens.
  useEffect(() => {
    if (open) {
      setDrafts({
        merchant_name: currentValues?.merchant_name ?? "",
        date: currentValues?.date ?? "",
        time: currentValues?.time ?? "",
        total: currentValues?.total ?? "",
        vat: currentValues?.vat ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (f: FieldKey, v: string) => setDrafts((p) => ({ ...p, [f]: v }));

  const changedFields = (): FieldKey[] =>
    FIELD_KEYS.filter((f) => {
      const next = (drafts[f] ?? "").trim();
      const orig = (currentValues?.[f] ?? "").trim();
      return next !== "" && next !== orig;
    });

  const handleSubmit = async () => {
    const changed = changedFields();
    if (changed.length === 0) {
      toast.error(t("correctionModal.noChanges"));
      return;
    }

    setIsSubmitting(true);
    try {
      const results: CorrectionResult[] = [];
      let anyError = false;
      for (const field of changed) {
        const value = (drafts[field] ?? "").trim();
        try {
          const res = await fetch("/api/receipt/correct", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ receiptId, field, newValue: value }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            anyError = true;
            continue;
          }
          results.push({ field, value, appliedImmediately: !!data.appliedImmediately });
        } catch {
          anyError = true;
        }
      }

      if (results.length > 0) {
        onCorrected?.(results);
        toast.success(
          results.some((r) => !r.appliedImmediately)
            ? t("correctionModal.successPending")
            : t("correctionModal.successApplied")
        );
        onOpenChange(false);
        onSuccess?.();
      } else if (anyError) {
        toast.error(t("correctionModal.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("correctionModal.title")}</DialogTitle>
          <DialogDescription>{t("correctionModal.multiSubtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {FIELD_KEYS.map((f) => (
            <div key={f} className="space-y-1">
              <Label className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                {t(`correctionModal.fields.${f}`)}
              </Label>
              <Input
                type={inputTypeFor(f)}
                inputMode={f === "total" || f === "vat" ? "decimal" : undefined}
                value={drafts[f]}
                onChange={(e) => setField(f, e.target.value)}
                placeholder={t("correctionModal.enterValue")}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "..." : t("correctionModal.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
