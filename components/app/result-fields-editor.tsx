"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { toast } from "sonner";

const FIELD_KEYS = ["merchant_name", "date", "time", "total", "vat"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
const REWARD_FIELDS: ReadonlySet<FieldKey> = new Set(["total", "vat"]);

function inputTypeFor(field: FieldKey): string {
  if (field === "total" || field === "vat") return "number";
  if (field === "date") return "date";
  if (field === "time") return "time";
  return "text";
}

export interface ResultFieldsEditorProps {
  receiptId: string;
  values: Record<FieldKey, string>;
  currency?: string;
  /** Called when an immediately-applied field (merchant/date/time) was corrected. */
  onApplied?: (field: FieldKey, value: string) => void;
}

/**
 * Inline, per-field correction on the post-pipeline result screen.
 * Each field has a pencil → input → confirm. Reward fields (total/vat) are
 * admin-gated (queued for review); harmless fields apply immediately.
 */
export function ResultFieldsEditor({ receiptId, values, currency, onApplied }: ResultFieldsEditorProps) {
  const { t } = useAppLocale();
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<Set<FieldKey>>(new Set());
  const [local, setLocal] = useState<Record<FieldKey, string>>(values);

  const start = (f: FieldKey) => {
    setEditing(f);
    setDraft(local[f] ?? "");
  };
  const cancel = () => {
    setEditing(null);
    setDraft("");
  };

  const submit = async (f: FieldKey) => {
    if (draft.trim() === "") {
      toast.error(t("correctionModal.enterValue"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/receipt/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId, field: f, newValue: draft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t("correctionModal.error"));
        return;
      }
      if (data.appliedImmediately) {
        setLocal((p) => ({ ...p, [f]: draft.trim() }));
        onApplied?.(f, draft.trim());
        toast.success(t("correctionModal.successApplied"));
      } else {
        setPending((p) => new Set(p).add(f));
        toast.success(t("correctionModal.successPending"));
      }
      setEditing(null);
      setDraft("");
    } catch (e: any) {
      toast.error(e?.message || t("correctionModal.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      {FIELD_KEYS.map((f) => {
        const showCurrency = REWARD_FIELDS.has(f) && currency;
        return (
          <div
            key={f}
            className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0"
            style={{ borderColor: "var(--app-border)" }}
          >
            <span className="text-sm shrink-0" style={{ color: "var(--app-text-muted)" }}>
              {t(`correctionModal.fields.${f}`)}
            </span>

            {editing === f ? (
              <div className="flex items-center gap-1">
                <Input
                  type={inputTypeFor(f)}
                  inputMode={f === "total" || f === "vat" ? "decimal" : undefined}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-8 w-44"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => submit(f)}
                  disabled={saving}
                  aria-label="Confirm"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={cancel}
                  disabled={saving}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--app-text-primary)" }}
                >
                  {local[f] || "—"}
                  {showCurrency ? ` ${currency}` : ""}
                </span>
                {pending.has(f) && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: "var(--app-bg-elevated)", color: "var(--app-text-muted)" }}
                  >
                    {t("correctionModal.pendingBadge")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => start(f)}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`Edit ${f}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs pt-2" style={{ color: "var(--app-text-muted)" }}>
        {t("correctionModal.subtitle")}
      </p>
    </div>
  );
}
