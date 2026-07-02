"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  CheckCircle2, 
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";

interface PotentialRewardProps {
  receipt: Receipt;
  onBack: () => void;
  onClaim: () => void;
  isSaving?: boolean;
  /** @deprecated Use app locale from context */
  locale?: string;
  className?: string;
  /** When true, show note that admin's honor score is not updated */
  isAdmin?: boolean;
}

export function PotentialReward({
  receipt,
  onBack,
  onClaim,
  isSaving = false,
  className,
  isAdmin = false,
}: PotentialRewardProps) {
  const { t } = useAppLocale();
  const potentialReward = receipt.reward?.amount ?? receipt.hiddenCost.totalHidden;
  const qh = receipt.qualityHonor;

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="card-cinematic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            {t("potentialReward.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reward display */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-muted rounded-xl p-6 text-center border border-primary/20">
              <motion.div 
                className="flex justify-center mb-3"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="p-3 rounded-full bg-primary/20">
                  <Coins className="w-8 h-8 text-primary" />
                </div>
              </motion.div>
              
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-3xl font-bold text-primary tabular-nums">
                  {potentialReward.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground">cPoints</span>
              </div>
              
              <p className="text-xs text-muted-foreground">{t("potentialReward.potential")}</p>
            </div>
          </motion.div>

          {/* Honor breakdown (this receipt: honor delta, reward %, bonus; admin sees note that their score is not updated) */}
          {qh && (
            <div className="rounded-lg p-4 border border-primary/20 bg-primary/5 space-y-2">
              <p className="text-sm font-medium text-primary">
                {t("potentialReward.honorFromReceipt")}: {qh.honorDelta >= 0 ? "+" : ""}{qh.honorDelta} · {t("potentialReward.honorEffect")}: %{qh.rewardPct}
                {qh.honorBonusApplied && ` · ${t("potentialReward.honorBonus")}`}
              </p>
              {isAdmin && (
                <p className="text-xs text-muted-foreground">{t("potentialReward.honorAdminNote")}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">{t("potentialReward.description")}</p>
            <div className="flex items-start gap-2 text-left bg-primary/5 rounded-lg p-3 border border-primary/10">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-primary font-medium text-sm">{t("potentialReward.rewardNote")}</p>
                <p className="text-muted-foreground text-xs mt-1">{t("potentialReward.rewardDesc")}</p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            {[t("potentialReward.check1"), t("potentialReward.check2"), t("potentialReward.check3")].map((item, idx) => (
              <motion.div
                key={idx}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1 gap-2" disabled={isSaving}>
              <ArrowLeft className="w-4 h-4" />
              {t("potentialReward.back")}
            </Button>
            <Button onClick={onClaim} className="flex-1 gap-2" disabled={isSaving}>
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Coins className="w-4 h-4" />
                  </motion.div>
                  {t("potentialReward.saving")}
                </>
              ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t("potentialReward.save")}
              </>
            )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
