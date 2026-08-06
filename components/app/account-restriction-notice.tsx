"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";

/**
 * Shown on launch to an account whose uploads are temporarily capped.
 *
 * It appears every session for as long as the restriction is active — the user
 * needs to know why the pipeline refuses a second receipt — but it never traps
 * them: both the close control and the acknowledge button dismiss it, and the
 * whole notice stops rendering the moment the restriction lapses.
 *
 * Amber rather than red: this is a temporary cap that lifts itself, not a
 * closed account, and the colour should say so.
 */

interface RestrictionData {
  dailyReceiptLimit: number;
  expiresAt: string;
}

export function AccountRestrictionNotice() {
  const { t, locale } = useAppLocale();
  const [data, setData] = useState<RestrictionData | null>(null);
  const [open, setOpen] = useState(false);

  // t() humanizes the key when a message is missing, so compare against that
  // and fall back to the Turkish copy until the other locales are filled in.
  const tx = (key: string, fallback: string): string => {
    const full = `restriction.${key}`;
    const value = t(full);
    return typeof value === "string" && value && value !== full && !value.includes("restriction")
      ? value
      : fallback;
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/user/restriction");
        if (!res.ok) return;
        const body = (await res.json()) as { restriction: RestrictionData | null };
        if (!cancelled && body.restriction) {
          setData(body.restriction);
          setOpen(true);
        }
      } catch {
        // Silent: a notice that fails to load must not disturb the app.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  const endsOn = new Date(data.expiresAt).toLocaleDateString(locale || "tr", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            aria-label={tx("close", "Kapat")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-[rgba(6,7,11,0.8)] backdrop-blur-[9px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restriction-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative w-full max-w-[440px] pb-6"
            style={{
              background: "linear-gradient(168deg,#1B2130 0%,#12151E 62%,#0F1117 100%)",
              borderTop: "1px solid rgba(232,163,61,0.22)",
              borderRadius: "26px 26px 0 0",
              boxShadow: "0 -20px 50px -18px rgba(0,0,0,0.8)",
            }}
          >
            {/* top light hairline */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[14%] right-[14%] top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg,transparent,rgba(232,163,61,0.55),transparent)",
              }}
            />

            <button
              onClick={() => setOpen(false)}
              aria-label={tx("close", "Kapat")}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#5A6680] transition-colors hover:bg-white/[0.06] hover:text-[#E4E8F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8A33D]"
            >
              <X size={16} strokeWidth={2.2} />
            </button>

            <div className="mx-auto mt-3 h-[3.5px] w-[34px] rounded-full bg-white/[0.16]" />

            <div className="px-6 pt-5">
              <span
                className="inline-flex items-center gap-[7px] rounded-full px-[11px] py-[5px] font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#E8A33D]"
                style={{
                  background: "rgba(232,163,61,0.13)",
                  border: "1px solid rgba(232,163,61,0.22)",
                }}
              >
                <span
                  className="h-[5px] w-[5px] rounded-full bg-[#E8A33D] motion-safe:animate-pulse"
                  style={{ boxShadow: "0 0 8px #E8A33D" }}
                />
                {tx("badge", "Hesap kısıtlı")}
              </span>

              <h2
                id="restriction-title"
                className="mt-4 mb-3 text-[23px] font-[640] leading-[1.24] tracking-[-0.025em] text-[#F0F0FF]"
                style={{ textWrap: "balance" }}
              >
                {tx("title", "Fiş yükleme hakkınız geçici olarak sınırlandırıldı")}
              </h2>

              <p className="mb-1 text-[14.6px] leading-[1.62] text-[#9BA8C0]">
                {tx("body", "Hesabınızda, yükleme kurallarına aykırı belgeler tespit edildi.")}
              </p>

              <div className="my-5 flex items-baseline gap-[13px] border-y border-white/[0.07] py-4">
                <span
                  className="font-mono text-[40px] font-semibold leading-none tracking-[-0.04em] text-[#E8A33D]"
                  style={{ textShadow: "0 0 26px rgba(232,163,61,0.32)", fontVariantNumeric: "tabular-nums" }}
                >
                  {data.dailyReceiptLimit}
                </span>
                <span className="text-[14.5px] font-semibold text-[#E4E8F2]">
                  {tx("perDay", "fiş / gün")}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[13px] text-[#5A6680]">
                <span>{tx("endsLabel", "Kısıtlamanın bitişi")}</span>
                <span
                  className="font-mono text-[13.5px] text-[#9BA8C0]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {endsOn}
                </span>
              </div>

              <p
                className="mt-4 pl-[11px] text-[12.8px] leading-[1.58] text-[#5A6680]"
                style={{ borderLeft: "1px solid rgba(232,163,61,0.24)" }}
              >
                {tx("note", "Bu tarihten sonra hesabınız kendiliğinden normale döner. Yumo Yumo, farklı ülkelerden katkı veren herkes için aynı kuralları uygular.")}
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mx-6 mt-5 block w-[calc(100%-3rem)] rounded-[14px] border border-white/[0.12] py-[14px] text-[15px] font-[560] text-[#F0F0FF] transition-all hover:-translate-y-px hover:border-[rgba(232,163,61,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8A33D]"
              style={{
                background: "linear-gradient(180deg,#252D3D,#1A2030)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {tx("acknowledge", "Anladım")}
            </button>

            <p className="mt-3 text-center text-[12.5px] text-[#5A6680]">
              {tx("appealPrefix", "Bir hata olduğunu düşünüyorsanız")}{" "}
              <a
                href="/support?subject=account-restriction"
                className="border-b border-white/[0.14] text-[#9BA8C0] transition-colors hover:text-[#E4E8F2]"
              >
                {tx("appealLink", "bize yazın")}
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
