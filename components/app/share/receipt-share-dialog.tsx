"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, Share2, X } from "lucide-react";
import { FaFacebookF, FaTelegram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import type { ComponentType, CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { Receipt } from "@/lib/mock/types";

const PUBLIC_SHARE_URL = "https://yumoyumo.com";

/**
 * Share dialog for the branded receipt card. Rasterizes `generateReceiptShareCard`
 * once on open, previews the exact PNG, then lets the user push it out: native
 * image share (mobile) → download fallback, plus web-intent buttons for X /
 * WhatsApp / Telegram / Facebook. Self-contained so it can sit at any entry
 * point (scan result screen, receipt detail).
 */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
  locale: string;
}

/** Circular frosted-glass action — matches the identity share dialog. */
function GlassAction({
  Icon,
  iconColor,
  glow,
  label,
  href,
  onClick,
  disabled,
  loading,
  ring,
}: {
  Icon: ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;
  iconColor: string;
  glow: string;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  ring?: boolean;
}) {
  const style: CSSProperties = {
    height: 46,
    width: 46,
    background: "linear-gradient(150deg, rgba(255,255,255,0.14), rgba(255,255,255,0.035))",
    border: `1px solid ${ring ? `${glow}66` : "rgba(255,255,255,0.14)"}`,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: ring
      ? `0 6px 20px rgba(0,0,0,0.4), 0 0 18px ${glow}59, inset 0 1px 0 rgba(255,255,255,0.28)`
      : "0 6px 18px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.22)",
    opacity: disabled ? 0.45 : 1,
  };
  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle at 50% 34%, ${glow}40, transparent 68%)` }}
      />
      {loading ? (
        <Loader2 size={16} className="relative animate-spin" style={{ color: "#5A6680" }} />
      ) : (
        <Icon size={19} className="relative" style={{ color: iconColor }} />
      )}
    </>
  );
  const cls = "relative grid h-[46px] w-[46px] place-items-center rounded-full";
  if (href && !disabled) {
    return (
      <motion.a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls} style={style} whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={cls} style={style} whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: 0.9 }}>
      {inner}
    </motion.button>
  );
}

export function ReceiptShareDialog({ open, onOpenChange, receipt, locale }: Props) {
  const isTr = locale === "tr";
  const fileRef = useRef<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState(false);

  const hiddenPct = receipt.total > 0 ? Math.round((receipt.hiddenCost.totalHidden / receipt.total) * 100) : 0;
  const shareText = isTr
    ? `${receipt.merchantName} alışverişimde ödediğimin %${hiddenPct}'i gizli maliyetmiş. Harcamanın gerçek dökümünü Yumo Yumo ile gör 👇`
    : `${hiddenPct}% of what I paid at ${receipt.merchantName} was hidden cost. See the real breakdown of your spending with Yumo Yumo 👇`;

  // Build the card PNG once each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let localUrl: string | null = null;
    setError(false);
    setBuilding(true);
    (async () => {
      try {
        const { generateReceiptShareCard } = await import("@/lib/receipt/share-card");
        const blob = await generateReceiptShareCard(receipt, locale);
        if (cancelled) return;
        fileRef.current = new File([blob], `yumo-${receipt.id}.png`, { type: "image/png" });
        localUrl = URL.createObjectURL(blob);
        setImgUrl(localUrl);
      } catch (err) {
        console.error("Build receipt share card failed:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setBuilding(false);
      }
    })();
    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [open, receipt, locale]);

  useEffect(() => {
    if (!open) {
      setImgUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      fileRef.current = null;
    }
  }, [open]);

  const onDownload = () => {
    const file = fileRef.current;
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onShare = async () => {
    const file = fileRef.current;
    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: receipt.merchantName, text: shareText, url: PUBLIC_SHARE_URL });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Native image share failed:", err);
      }
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: receipt.merchantName, text: shareText, url: PUBLIC_SHARE_URL });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    onDownload();
  };

  const socials = [
    { key: "x", Icon: FaXTwitter, iconColor: "#FFFFFF", glow: "#FFFFFF", href: (u: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(u)}` },
    { key: "facebook", Icon: FaFacebookF, iconColor: "#4D8DF7", glow: "#1877F2", href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
    { key: "whatsapp", Icon: FaWhatsapp, iconColor: "#25D366", glow: "#25D366", href: (u: string) => `https://wa.me/?text=${encodeURIComponent(`${shareText} ${u}`)}` },
    { key: "telegram", Icon: FaTelegram, iconColor: "#3BB7F0", glow: "#26A5E4", href: (u: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(shareText)}` },
  ] as const;

  const buildingLabel = isTr ? "Kart hazırlanıyor…" : "Building card…";
  const errorLabel = isTr ? "Kart oluşturulamadı." : "Could not build the card.";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[130] grid place-items-center p-6"
                style={{ background: "rgba(6,8,11,.78)", backdropFilter: "blur(8px)" }}
              >
                <Dialog.Content asChild onClick={(e) => e.stopPropagation()}>
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="relative w-full max-w-[360px] overflow-hidden rounded-[24px] border p-5"
                    style={{ background: "linear-gradient(160deg,#1a1430,#0d1018)", borderColor: "rgba(255,255,255,.12)" }}
                  >
                    <Dialog.Title className="sr-only">{isTr ? "Kartı paylaş" : "Share card"}</Dialog.Title>
                    <Dialog.Description className="sr-only">{receipt.merchantName}</Dialog.Description>

                    <Dialog.Close asChild>
                      <button
                        aria-label="close"
                        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full"
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#9BA8C0" }}
                      >
                        <X size={15} />
                      </button>
                    </Dialog.Close>

                    <div className="grid min-h-[320px] place-items-center overflow-hidden rounded-[18px]" style={{ background: "rgba(255,255,255,.03)" }}>
                      {imgUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl} alt={receipt.merchantName} className="w-full" />
                      ) : error ? (
                        <p className="px-6 text-center text-[13px]" style={{ color: "#9BA8C0" }}>{errorLabel}</p>
                      ) : (
                        <div className="flex flex-col items-center gap-2.5" style={{ color: "#9BA8C0" }}>
                          <Loader2 size={20} className="animate-spin" style={{ color: "#E8C97A" }} />
                          <span className="text-[12px]">{buildingLabel}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2">
                      <GlassAction Icon={Share2} iconColor="#E8C97A" glow="#E8C97A" ring label={isTr ? "Paylaş" : "Share"} onClick={onShare} disabled={building || error || !imgUrl} />
                      <GlassAction Icon={Download} iconColor="#E6EAF2" glow="#9BA8C0" label={isTr ? "İndir" : "Download"} onClick={onDownload} disabled={building || error || !imgUrl} />
                      {socials.map(({ key, Icon, iconColor, glow, href }) => (
                        <GlassAction
                          key={key}
                          Icon={Icon}
                          iconColor={iconColor}
                          glow={glow}
                          label={key}
                          href={imgUrl ? href(PUBLIC_SHARE_URL) : undefined}
                          disabled={building || error || !imgUrl}
                        />
                      ))}
                    </div>
                  </motion.div>
                </Dialog.Content>
              </motion.div>
            </Dialog.Overlay>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
