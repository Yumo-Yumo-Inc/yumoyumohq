"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Gift, Lock, Sparkles } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";
import { CountUp, flameText } from "./primitives";
import { CONDENSED, MONO } from "./theme";

export function RewardSeal({ receipt }: { receipt: Receipt }) {
  const { t, locale } = useAppLocale();
  const isTr = locale === "tr";
  const [open, setOpen] = useState(false);
  const r = receipt.reward;
  const unit = r.symbol || "cPoints";
  const fraction = r.rewardFraction != null && r.rewardFraction < 1 ? r.rewardFraction : null;
  const partial = fraction != null && (r.pendingItemizedReceipt || (r.fullRewardEstimate ?? 0) > r.amount);
  const hasDetail = partial || (!r.claimable && !!r.noRewardExplanation);

  return (
    <div className="flex flex-col items-center">
      <motion.button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        whileTap={hasDetail ? { scale: 0.96 } : undefined}
        className="relative grid place-items-center rounded-full p-[2px]"
        style={{ background: "var(--pf-flame)", boxShadow: r.claimable ? "0 0 36px var(--pf-glow)" : "none", cursor: hasDetail ? "pointer" : "default" }}
        animate={r.claimable ? { boxShadow: ["0 0 22px var(--pf-glow)", "0 0 44px var(--pf-glow)", "0 0 22px var(--pf-glow)"] } : undefined}
        transition={r.claimable ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full text-center" style={{ background: "var(--pf-panel)" }}>
          <div>
            <div className="flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>
              {r.claimable ? <Sparkles className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {r.claimable ? t("receiptDetail.rewardReady") : t("receiptDetail.rewardVerifying")}
            </div>
            <div className="mt-0.5 text-3xl font-bold leading-none" style={{ ...flameText, fontFamily: CONDENSED }}>
              +<CountUp value={r.amount} />
            </div>
            <div className="text-[10px]" style={{ color: "var(--pf-mute)", fontFamily: MONO }}>{unit}</div>
          </div>
        </div>
      </motion.button>

      {hasDetail && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ ...flameText, fontFamily: MONO }}>
          {open ? (isTr ? "kapat" : "close") : isTr ? "detay" : "detail"}
        </button>
      )}

      <AnimatePresence initial={false}>
        {open && hasDetail && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="w-full overflow-hidden">
            <div className="mt-2 space-y-2 text-center">
              {partial && (
                <p className="mx-auto max-w-xs text-xs leading-relaxed" style={{ color: "var(--pf-soft)" }}>
                  <Gift className="mr-1 inline h-3.5 w-3.5" style={{ color: "var(--pf-amber)" }} />
                  {isTr ? `%${Math.round((fraction as number) * 100)} açıldı — kalanı için detaylı fiş yükle.` : `${Math.round((fraction as number) * 100)}% unlocked — upload the itemized receipt to unlock the rest.`}
                  {r.fullRewardEstimate != null && r.fullRewardEstimate > r.amount && (
                    <> <span style={{ color: "var(--pf-peach)", fontFamily: MONO }}>(+{r.fullRewardEstimate.toFixed(2)})</span></>
                  )}
                </p>
              )}
              {!r.claimable && r.noRewardExplanation && !partial && (
                <p className="mx-auto max-w-xs text-xs leading-relaxed" style={{ color: "var(--pf-soft)" }}>{r.noRewardExplanation}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
