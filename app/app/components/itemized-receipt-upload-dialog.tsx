"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";

type ItemizedReceiptUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slipReceiptId: string;
  merchantName?: string;
  totalPaid?: number;
  receiptDate?: string;
  onUploadComplete?: () => void | Promise<void>;
};

export function ItemizedReceiptUploadDialog({
  open,
  onOpenChange,
  slipReceiptId,
  merchantName,
  totalPaid,
  receiptDate,
  onUploadComplete,
}: ItemizedReceiptUploadDialogProps) {
  const { t } = useAppLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const uploadRes = await fetch("/api/receipt/upload", {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("expenseType", "personal");
          return fd;
        })(),
      });
      if (!uploadRes.ok) {
        throw new Error(t("errors.upload.uploadFailed"));
      }
      const uploadJson = (await uploadRes.json()) as { receiptId?: string };
      const itemizedReceiptId = uploadJson.receiptId;
      if (!itemizedReceiptId) {
        throw new Error(t("errors.upload.unknown"));
      }

      const analyzeRes = await fetch("/api/receipt/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: itemizedReceiptId,
          completeSlipReceiptId: slipReceiptId,
          stream: false,
        }),
      });
      if (!analyzeRes.ok) {
        throw new Error(t("errors.api.analyzeFailed"));
      }

      const slipRes = await fetch("/api/receipt/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: slipReceiptId, stream: false }),
      });
      if (slipRes.ok) {
        const slipAnalysis = (await slipRes.json()) as {
          reward?: { pendingItemizedReceipt?: boolean };
        };
        if (slipAnalysis.reward?.pendingItemizedReceipt === true) {
          throw new Error(t("rewardCard.itemizedDialog.mismatch"));
        }
      }

      await onUploadComplete?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.upload.unknown"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rewardCard.itemizedDialog.title")}</DialogTitle>
          <DialogDescription>{t("rewardCard.itemizedDialog.description")}</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm space-y-1">
          {merchantName && (
            <p>
              <span className="text-muted-foreground">{t("rewardCard.itemizedDialog.merchant")}: </span>
              {merchantName}
            </p>
          )}
          {receiptDate && (
            <p>
              <span className="text-muted-foreground">{t("rewardCard.itemizedDialog.date")}: </span>
              {receiptDate}
            </p>
          )}
          {totalPaid != null && (
            <p>
              <span className="text-muted-foreground">{t("rewardCard.itemizedDialog.total")}: </span>
              {totalPaid.toFixed(2)}
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("rewardCard.itemizedDialog.later")}
          </Button>
          <Button onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("rewardCard.itemizedDialog.uploading")}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t("rewardCard.itemizedDialog.upload")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
