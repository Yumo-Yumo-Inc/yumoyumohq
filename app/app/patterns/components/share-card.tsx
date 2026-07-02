"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, Share2, X } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import { FaFacebookF, FaTelegram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { useEffect, useRef, useState } from "react";
import type { SpendingIdentity, TraitKey } from "@/lib/insights/identity/identity-types";
import { className as classNameOf, classTagline, TRAIT_ACCENT, tx, UI } from "../identity-copy";
import { IdentityShareCard } from "./identity-share-card";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classKeys: [TraitKey, TraitKey];
  identity: SpendingIdentity;
  locale: string;
}

/**
 * A circular frosted-glass action button — gradient glass fill, light hairline,
 * inset top highlight, soft shadow, and a brand-tinted radial glow behind the
 * icon. `ring` marks the primary action with a colored halo. Renders as an
 * anchor when `href` is given, otherwise a button.
 */
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
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cls}
        style={style}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.9 }}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={style}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
    >
      {inner}
    </motion.button>
  );
}

/**
 * Renders the branded identity card off-screen, rasterizes it to a PNG, and lets
 * the user share the actual image (native sheet → file download fallback). The
 * preview shows the exact card before it goes anywhere — same pattern as the
 * receipt share flow.
 */
export function ShareCard({ open, onOpenChange, classKeys, identity, locale }: Props) {
  const accent = TRAIT_ACCENT[classKeys[0]];
  const cardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<File | null>(null);
  const [building, setBuilding] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Build the PNG once each time the dialog opens, then upload it so the social
  // buttons get a public link whose Open Graph image is this exact card. The
  // off-screen card is always mounted, so its radar animation has long settled.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let localUrl: string | null = null;
    setError(false);
    setBuilding(true);
    setShareUrl(null);
    (async () => {
      try {
        // Let the off-screen node paint before capture.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (cancelled || !cardRef.current) return;
        const { domToBlob } = await import("modern-screenshot");
        const blob = await domToBlob(cardRef.current, { scale: 2, type: "image/png" });
        if (cancelled) return;
        const file = new File([blob], "yumo-identity.png", { type: "image/png" });
        fileRef.current = file;
        localUrl = URL.createObjectURL(blob);
        setImgUrl(localUrl);
        setBuilding(false);

        // Upload for the shareable public link (best-effort — native share and
        // download still work from the local file if this fails).
        const fd = new FormData();
        fd.append("file", file);
        fd.append("classPrimary", classKeys[0]);
        fd.append("classSecondary", classKeys[1]);
        fd.append("locale", locale);
        const res = await fetch("/api/patterns/share-card", { method: "POST", body: fd });
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { shareUrl?: string };
          if (data.shareUrl) setShareUrl(data.shareUrl);
        }
      } catch (err) {
        console.error("Build identity card failed:", err);
        if (!cancelled) {
          setError(true);
          setBuilding(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [open, classKeys, locale, identity]);

  // Clear the preview when the dialog closes.
  useEffect(() => {
    if (!open) {
      setImgUrl(null);
      setShareUrl(null);
      fileRef.current = null;
    }
  }, [open]);

  const shareText = `${tx(locale, UI.shareCaption)}: ${classNameOf(classKeys, locale)}\n${classTagline(
    classKeys,
    locale,
  )}`;
  const linkUrl =
    shareUrl ??
    (typeof window !== "undefined" ? `${window.location.origin}/app/patterns` : "");

  const onShare = async () => {
    const file = fileRef.current;
    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Yumo Yumo · ${classNameOf(classKeys, locale)}`,
          text: shareText,
          url: linkUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Native image share failed:", err);
      }
    }
    // No file-share support → download the image instead.
    onDownload();
  };

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

  // Web-intent share targets. These carry text + the public link; the platform
  // renders the card via that page's Open Graph image. iconColor reads on dark
  // glass; glow tints the radial behind the icon.
  const socials = [
    {
      key: "x",
      Icon: FaXTwitter,
      iconColor: "#FFFFFF",
      glow: "#FFFFFF",
      href: (u: string) =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(u)}`,
    },
    {
      key: "facebook",
      Icon: FaFacebookF,
      iconColor: "#4D8DF7",
      glow: "#1877F2",
      href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    },
    {
      key: "whatsapp",
      Icon: FaWhatsapp,
      iconColor: "#25D366",
      glow: "#25D366",
      href: (u: string) => `https://wa.me/?text=${encodeURIComponent(`${shareText} ${u}`)}`,
    },
    {
      key: "telegram",
      Icon: FaTelegram,
      iconColor: "#3BB7F0",
      glow: "#26A5E4",
      href: (u: string) =>
        `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(shareText)}`,
    },
  ] as const;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {/* Off-screen capture target — always mounted while open so it has painted. */}
      {open && (
        <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
          <IdentityShareCard ref={cardRef} identity={identity} classKeys={classKeys} locale={locale} />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] grid place-items-center p-6"
                style={{ background: "rgba(6,8,11,.78)", backdropFilter: "blur(8px)" }}
              >
                <Dialog.Content asChild onClick={(e) => e.stopPropagation()}>
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="relative w-full max-w-[360px] overflow-hidden rounded-[24px] border p-5"
                    style={{
                      background: "linear-gradient(160deg,#1a1430,#0d1018)",
                      borderColor: "rgba(255,255,255,.12)",
                    }}
                  >
                    <Dialog.Title className="sr-only">{tx(locale, UI.shareTitle)}</Dialog.Title>
                    <Dialog.Description className="sr-only">
                      {classNameOf(classKeys, locale)}
                    </Dialog.Description>

                    <Dialog.Close asChild>
                      <button
                        aria-label="close"
                        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full"
                        style={{
                          background: "rgba(255,255,255,.06)",
                          border: "1px solid rgba(255,255,255,.12)",
                          color: "#9BA8C0",
                        }}
                      >
                        <X size={15} />
                      </button>
                    </Dialog.Close>

                    {/* preview */}
                    <div
                      className="grid min-h-[320px] place-items-center overflow-hidden rounded-[18px]"
                      style={{ background: "rgba(255,255,255,.03)" }}
                    >
                      {imgUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl} alt={classNameOf(classKeys, locale)} className="w-full" />
                      ) : error ? (
                        <p className="px-6 text-center text-[13px]" style={{ color: "#9BA8C0" }}>
                          {tx(locale, UI.shareError)}
                        </p>
                      ) : (
                        <div className="flex flex-col items-center gap-2.5" style={{ color: "#9BA8C0" }}>
                          <Loader2 size={20} className="animate-spin" style={{ color: accent }} />
                          <span className="text-[12px]">{tx(locale, UI.shareBuilding)}</span>
                        </div>
                      )}
                    </div>

                    {/* actions — circular glass row: primary share (accent halo),
                        download, then the social targets once the link is ready */}
                    <div className="mt-5 flex items-center justify-center gap-2">
                      <GlassAction
                        Icon={Share2}
                        iconColor={accent}
                        glow={accent}
                        ring
                        label={tx(locale, UI.shareDo)}
                        onClick={onShare}
                        disabled={building || error || !imgUrl}
                      />
                      <GlassAction
                        Icon={Download}
                        iconColor="#E6EAF2"
                        glow="#9BA8C0"
                        label={tx(locale, UI.shareDownload)}
                        onClick={onDownload}
                        disabled={building || error || !imgUrl}
                      />
                      {socials.map(({ key, Icon, iconColor, glow, href }) => (
                        <GlassAction
                          key={key}
                          Icon={Icon}
                          iconColor={iconColor}
                          glow={glow}
                          label={key}
                          href={shareUrl ? href(shareUrl) : undefined}
                          disabled={!shareUrl}
                          loading={!shareUrl && !error && !!imgUrl}
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
