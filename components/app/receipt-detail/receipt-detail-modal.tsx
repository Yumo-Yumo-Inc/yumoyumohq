"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Share2, Download, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ErrorState } from "@/components/app/error-state";
import { ProofView } from "@/components/app/receipt-detail/proof/proof-view";
import { AdminDeep } from "@/components/app/receipt-detail/proof/admin-deep";
import { pfVars } from "@/components/app/receipt-detail/proof/theme";
import { FieldCorrectionModal } from "@/components/app/field-correction-modal";
import { CategoryPickerModal } from "@/components/app/category-picker-modal";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useReceiptDetail } from "@/lib/receipt/use-receipt-detail";
import type { Receipt } from "@/lib/mock/types";
import { localDb } from "@/lib/local-db";
import { syncMobileData } from "@/lib/sync";
import {
  rememberDeletedReceiptId,
  stripReceiptIdFromAllReceiptQueries,
} from "@/lib/receipt/deleted-receipt-tombstones";

interface ReceiptDetailModalProps {
  /** Receipt id to show. When null/undefined the modal stays closed. */
  receiptId: string | null;
  onClose: () => void;
  /** Called after a successful delete so the host can refresh its list. */
  onDeleted?: (id: string) => void;
  /**
   * "detail" (default) renders the consumer proof view — no admin tooling, ever.
   * "adminTools" renders the admin-only pipeline/OCR/fraud/evidence surface; it is
   * opened explicitly from the admin panel, never from the consumer detail.
   */
  mode?: "detail" | "adminTools";
}

/**
 * In-place receipt detail. Replaces the standalone `/app/receipts/[id]` page:
 * the deep proof view (ProofView) is rendered inside a dialog over the current
 * screen instead of navigating away. All orchestration that used to live on the
 * page (synthetic preview, share, download, delete, corrections) lives here so
 * there is a single source for the deep view.
 *
 * The consumer detail never shows admin tooling. Admins reach pipeline/OCR/fraud
 * data through the separate admin-tools surface (`mode="adminTools"`), launched
 * from the admin receipts panel.
 */
export function ReceiptDetailModal({ receiptId, onClose, onDeleted, mode = "detail" }: ReceiptDetailModalProps) {
  const queryClient = useQueryClient();
  const { t, locale } = useAppLocale();
  const isTr = locale === "tr";
  const isAdminTools = mode === "adminTools";

  const open = !!receiptId;
  // Detail always fetches from the ownership-scoped API; the server decides field
  // visibility from the session (admins get raw OCR / fraud / pipeline log).
  const { receipt, isLoading, error, reload } = useReceiptDetail(receiptId ?? undefined);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageDownloading, setIsImageDownloading] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [reportBugOpen, setReportBugOpen] = useState(false);
  const [dateCorrectionOpen, setDateCorrectionOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Share-card preview: the user sees the generated card BEFORE anything leaves
  // the app. The card is built once here, kept as an object URL for the <img>
  // preview and as a File for the eventual native share / download.
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImgUrl, setShareImgUrl] = useState<string | null>(null);
  const [shareBuilding, setShareBuilding] = useState(false);
  const shareFileRef = useRef<File | null>(null);

  // One-time prompts per receipt: category (when "other") first, else a future date.
  const promptedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!receipt || isAdminTools) return;
    if (promptedRef.current === receipt.id) return;
    promptedRef.current = receipt.id;
    if ((receipt.category ?? "other") === "other") {
      setCategoryModalOpen(true);
      return;
    }
    const dateOnly = (receipt.date || "").split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateOnly && dateOnly > todayStr) setDateCorrectionOpen(true);
  }, [receipt, isAdminTools]);

  // Public marketing site — NEVER the private `/app/receipts?receipt=<id>`
  // deep link. That link leaks the receipt id, is gated behind auth (useless to
  // an audience), and shouldn't appear in a public post. The branded image is the
  // self-contained "card" (it carries no id/token); the link just drives traffic.
  const PUBLIC_SHARE_URL = "https://yumoyumo.com";

  const shareTextFor = (r: Receipt) => {
    const hiddenPct = r.total > 0 ? Math.round((r.hiddenCost.totalHidden / r.total) * 100) : 0;
    return isTr
      ? `${r.merchantName} alışverişimde ödediğimin %${hiddenPct}'i gizli maliyetmiş. Harcamanın gerçek dökümünü Yumo Yumo ile gör 👇`
      : `${hiddenPct}% of what I paid at ${r.merchantName} was hidden cost. See the real breakdown of your spending with Yumo Yumo 👇`;
  };

  // Prefer the user's referral link so every share doubles as an invite; fall
  // back to the public site if it can't be fetched. Never the private receipt URL.
  const resolveShareUrl = async (): Promise<string> => {
    try {
      const res = await fetch("/api/referral/link");
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.link === "string" && data.link) return data.link;
      }
    } catch {
      /* ignore — fall back below */
    }
    return PUBLIC_SHARE_URL;
  };

  const buildShareCardFile = async (r: Receipt) => {
    const { generateReceiptShareCard } = await import("@/lib/receipt/share-card");
    const blob = await generateReceiptShareCard(r, locale);
    return { blob, file: new File([blob], `yumo-${r.id}.png`, { type: "image/png" }) };
  };

  // Tapping "Share" opens a preview first — the user always sees the card before
  // it goes anywhere. The card is generated once and reused for share + download.
  const openSharePreview = async () => {
    if (!receipt) return;
    setShareOpen(true);
    setShareBuilding(true);
    try {
      const { blob, file } = await buildShareCardFile(receipt);
      shareFileRef.current = file;
      setShareImgUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      console.error("Build share card failed:", err);
      setShareOpen(false);
      setDeleteError(isTr ? "Kart oluşturulamadı" : "Could not build card");
    } finally {
      setShareBuilding(false);
    }
  };

  const closeSharePreview = () => {
    setShareOpen(false);
    setShareImgUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    shareFileRef.current = null;
  };

  // Share the already-built card. Mobile: native sheet carries the image.
  // Desktop / no file-share: native text+link, then X composer fallback.
  const shareNow = async () => {
    if (!receipt) return;
    const file = shareFileRef.current;
    const text = shareTextFor(receipt);
    const shareUrl = await resolveShareUrl();

    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, url: shareUrl });
        closeSharePreview();
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Native image share failed:", err);
      }
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: receipt.merchantName, text, url: shareUrl });
        closeSharePreview();
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    if (typeof window !== "undefined") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
        "_blank",
        "noopener"
      );
    }
  };

  // Download the previewed card (reuses the file already built for the preview).
  const downloadFromPreview = () => {
    const file = shareFileRef.current;
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Revoke any held object URL when the modal unmounts.
  useEffect(() => () => {
    if (shareImgUrl) URL.revokeObjectURL(shareImgUrl);
  }, [shareImgUrl]);

  // Download only — saves the branded share card PNG.
  const handleDownloadCard = async () => {
    if (!receipt) return;
    setIsDownloadingCard(true);
    try {
      const { blob, file } = await buildShareCardFile(receipt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download card failed:", err);
      setDeleteError(isTr ? "Kart indirilemedi" : "Could not download card");
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const imageDownloadFilename = (r: Receipt): string => {
    if (r.blobFilename) return r.blobFilename;
    const sanitize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 30);
    const merchant = sanitize(r.merchantName || "receipt");
    const date = (r.date || "").split("T")[0] || "unknown-date";
    const amount = (r.total ?? r.totalPaid ?? 0).toFixed(2);
    const currency = r.currency || "TRY";
    return `${merchant}-${date}-${amount}-${currency}-${r.id}.jpg`;
  };

  const handleImageDownload = async () => {
    if (!receipt?.id) return;
    setIsImageDownloading(true);
    try {
      const downloadFrom = async (res: Response) => {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = imageDownloadFilename(receipt);
        a.click();
        URL.revokeObjectURL(url);
      };
      if (isAdminTools) {
        const res = await fetch(`/api/receipts/${encodeURIComponent(receipt.id)}/image`, { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = [body?.error, body?.details].filter(Boolean).join(" — ") || "Failed to download image";
          throw new Error(msg);
        }
        await downloadFrom(res);
      } else if (receipt.imageUrl) {
        await downloadFrom(await fetch(receipt.imageUrl));
      }
    } catch (err) {
      console.error("Failed to download receipt image:", err);
      setDeleteError(err instanceof Error ? err.message : t("errors.receiptDetail.downloadFailed") || "İndirme başarısız");
    } finally {
      setIsImageDownloading(false);
    }
  };

  const handleDelete = () => {
    if (!receipt) return;
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    if (!receipt) return;
    setShowDeleteConfirm(false);
    const deletedId = receipt.id;
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/receipts/${encodeURIComponent(deletedId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok && response.status !== 404) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || t("errors.receiptDetail.deleteFailed") || "Fiş silinemedi");
      }
      rememberDeletedReceiptId(deletedId);
      await localDb.delete("receipts", deletedId).catch(() => {});
      await syncMobileData().catch(() => null);
      stripReceiptIdFromAllReceiptQueries(queryClient, deletedId);
      await queryClient.invalidateQueries({ queryKey: ["receipts"] });
      setIsDeleting(false);
      onDeleted?.(deletedId);
      onClose();
    } catch (err: any) {
      console.error("Failed to delete receipt:", err);
      setDeleteError(err.message || t("errors.receiptDetail.deleteFailed") || "Fiş silinemedi");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        // `block` overrides the base DialogContent's `grid`: a grid's single auto
        // track collapses to the admin content's narrow min-content width. Block
        // flow makes children fill the full dialog width, and overflow-y-auto
        // scrolls vertically.
        //
        // Sizing differs by mode. The consumer detail is a compact centered card
        // with margins on BOTH mobile and desktop — it never covers the whole
        // screen. Admin tools stay full-screen on mobile / tall on desktop
        // because pipeline logs need the room.
        className={`block gap-0 overflow-y-auto bg-[var(--app-bg-base)] p-0 ${
          isAdminTools
            ? "h-[100dvh] w-full max-w-none border-0 sm:h-[92vh] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-[var(--app-border)]"
            : "max-h-[85dvh] w-[calc(100%-1rem)] max-w-lg rounded-2xl border border-[var(--app-border)] sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-2xl"
        }`}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogPrimitive.Title className="sr-only">
          {receipt?.merchantName || t("receiptDetail.title") || "Receipt detail"}
        </DialogPrimitive.Title>

        {error && !receipt ? (
          <div className="flex min-h-[60vh] items-center px-4">
            <div className="mx-auto w-full max-w-md">
              <ErrorState message={error || t("errors.receiptDetail.notFound")} onRetry={reload} />
            </div>
          </div>
        ) : isLoading || !receipt ? (
          <div className="space-y-4 p-4 pt-12">
            <div className="h-8 w-1/3 animate-pulse rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-72 animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-48 animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        ) : isAdminTools ? (
          // Mirror the consumer ProofView layout exactly: a block wrapper that
          // grows past the dialog height, scrolled by DialogContent's own
          // overflow-y-auto. No flex / fixed height (that collapsed the width
          // inside the grid DialogContent) and no nested scroller (that trapped
          // the mouse wheel). pb-28 keeps the action buttons clear of the bottom.
          <div style={pfVars} className="relative min-h-full overflow-hidden bg-[var(--app-bg-base)]">
            <div className="relative mx-auto w-full max-w-3xl space-y-4 px-4 py-5 pt-12 pb-28 lg:px-6">
              <div>
                <h2 className="text-lg font-bold text-white">{receipt.merchantName}</h2>
                <p className="text-xs text-white/45">
                  {[receipt.date, receipt.time, receipt.currency].filter(Boolean).join(" · ")} · {receipt.id}
                </p>
              </div>
              <AdminDeep
                receipt={receipt}
                onDownloadImage={handleImageDownload}
                onDelete={handleDelete}
                isDownloading={isImageDownloading}
                isDeleting={isDeleting}
              />
            </div>
          </div>
        ) : (
          <ProofView
            inModal
            receipt={receipt}
            onBack={onClose}
            onShare={openSharePreview}
            onDownloadCard={handleDownloadCard}
            onDelete={handleDelete}
            onReportBug={() => setReportBugOpen(true)}
            onDateCorrect={() => setDateCorrectionOpen(true)}
            isDeleting={isDeleting}
            isDownloadingCard={isDownloadingCard}
          />
        )}

        {receipt?.id && (
          <FieldCorrectionModal open={reportBugOpen} onOpenChange={setReportBugOpen} receiptId={receipt.id} />
        )}
        {receipt?.id && (
          <FieldCorrectionModal
            open={dateCorrectionOpen}
            onOpenChange={setDateCorrectionOpen}
            receiptId={receipt.id}
            currentValues={{ date: (receipt.date || "").split("T")[0] }}
          />
        )}
        {receipt?.id && (
          <CategoryPickerModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} receiptId={receipt.id} />
        )}

        {/* Share-card preview — shown before anything leaves the app */}
        {shareOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
            style={{ background: "rgba(0,0,0,0.74)", backdropFilter: "blur(8px)" }}
            onClick={closeSharePreview}
          >
            <div
              className="w-full max-w-sm rounded-t-3xl p-5 sm:rounded-3xl sm:p-6"
              style={{ background: "#141A28", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-bold" style={{ color: "#F0F0FF" }}>
                  {isTr ? "Paylaşmadan önce" : "Before you share"}
                </p>
                <button
                  type="button"
                  onClick={closeSharePreview}
                  aria-label={t("common.close") || "Kapat"}
                  className="opacity-60 transition-opacity hover:opacity-100"
                  style={{ color: "#fff" }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                className="relative mx-auto overflow-hidden rounded-2xl"
                style={{ aspectRatio: "1080 / 1350", maxHeight: "58vh", background: "rgba(255,255,255,0.04)" }}
              >
                {shareBuilding || !shareImgUrl ? (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shareImgUrl}
                    alt={isTr ? "Paylaşım kartı önizleme" : "Share card preview"}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={downloadFromPreview}
                  disabled={shareBuilding || !shareImgUrl}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#F0F0FF" }}
                >
                  <Download className="h-4 w-4" />
                  {t("receiptDetail.downloadCard") || (isTr ? "İndir" : "Download")}
                </button>
                <button
                  type="button"
                  onClick={shareNow}
                  disabled={shareBuilding || !shareImgUrl}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity disabled:opacity-50"
                  style={{
                    flex: 1.4,
                    background: "linear-gradient(135deg, #E8C97A 0%, #C9A84C 55%, #A07830 100%)",
                    color: "#14110A",
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  {t("common.share") || (isTr ? "Paylaş" : "Share")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete / download error toast */}
        {deleteError && (
          <div
            className="fixed bottom-24 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg"
            style={{
              background: "var(--app-bg-elevated)",
              border: "1px solid rgba(248,113,113,0.4)",
              color: "var(--app-text-primary)",
              backdropFilter: "blur(12px)",
              maxWidth: "calc(100vw - 2rem)",
            }}
          >
            <span style={{ color: "var(--app-danger)" }}>⚠</span>
            <span>{deleteError}</span>
            <button type="button" onClick={() => setDeleteError(null)} className="ml-1 opacity-60 hover:opacity-100" aria-label="Kapat">
              ✕
            </button>
          </div>
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="w-full max-w-sm space-y-4 rounded-2xl p-6"
              style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}
            >
              <div className="space-y-1">
                <p className="text-base font-semibold" style={{ color: "var(--app-text-primary)" }}>
                  {t("receiptDetail.deleteConfirmTitle")}
                </p>
                <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
                  {t("receiptDetail.deleteConfirmBody")}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                  style={{ background: "var(--app-bg-shell)", border: "1px solid var(--app-border)", color: "var(--app-text-primary)" }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={performDelete}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                  style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.5)", color: "var(--app-danger)" }}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
