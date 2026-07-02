"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CorrectionField {
  key: string;
  label: string;
}

interface CorrectionSuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { field: string; note: string }) => void | Promise<void>;
  fields: CorrectionField[];
  title: string;
  fieldLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  cancelLabel: string;
  submitLabel: string;
}

export function CorrectionSuggestionModal({
  open,
  onOpenChange,
  onSubmit,
  fields,
  title,
  fieldLabel,
  noteLabel,
  notePlaceholder,
  cancelLabel,
  submitLabel,
}: CorrectionSuggestionModalProps) {
  const [field, setField] = useState(fields[0]?.key ?? "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setField(fields[0]?.key ?? "");
      setNote("");
    }
  }, [fields, open]);

  const handleSubmit = async () => {
    if (!field) return;
    try {
      setSubmitting(true);
      await onSubmit({ field, note });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[var(--app-border)] bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm" style={{ color: "var(--app-text-secondary)" }}>
              {fieldLabel}
            </span>
            <select
              value={field}
              onChange={(event) => setField(event.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--app-bg-surface)",
                border: "1px solid var(--app-border)",
                color: "var(--app-text-primary)",
              }}
            >
              {fields.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm" style={{ color: "var(--app-text-secondary)" }}>
              {noteLabel}
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={notePlaceholder}
              rows={4}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--app-bg-surface)",
                border: "1px solid var(--app-border)",
                color: "var(--app-text-primary)",
              }}
            />
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{
              border: "1px solid var(--app-border)",
              color: "var(--app-text-primary)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !field}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--app-gold), var(--app-gold-dim))",
              color: "#0a0a0a",
            }}
          >
            {submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
