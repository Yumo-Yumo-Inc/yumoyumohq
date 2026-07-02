"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Gem, 
  Coins,
  RotateCcw,
  FileText,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";

// Premium success SVG icon
function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer glow ring */}
      <circle cx="60" cy="60" r="55" stroke="url(#successGradient)" strokeWidth="2" opacity="0.3" />
      <circle cx="60" cy="60" r="48" stroke="url(#successGradient)" strokeWidth="1" opacity="0.2" />
      
      {/* Main circle */}
      <circle cx="60" cy="60" r="40" fill="url(#successBg)" />
      <circle cx="60" cy="60" r="40" stroke="url(#successGradient)" strokeWidth="3" />
      
      {/* Checkmark */}
      <path 
        d="M40 60L52 72L80 44" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Decorative elements */}
      <circle cx="95" cy="25" r="3" fill="url(#successGradient)" opacity="0.6" />
      <circle cx="25" cy="35" r="2" fill="url(#successGradient)" opacity="0.4" />
      <circle cx="100" cy="85" r="2.5" fill="url(#successGradient)" opacity="0.5" />
      <circle cx="20" cy="80" r="2" fill="url(#successGradient)" opacity="0.3" />
      
      <defs>
        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(150 50% 35%)" />
        </linearGradient>
        <linearGradient id="successBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(150 50% 35%)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface MiningCompleteProps {
  receipt: Receipt;
  totalAnalyzed?: number;
  totalHiddenCost?: number;
  onMineAnother: () => void;
  onViewReceipts: () => void;
  /** @deprecated Use app locale from context */
  locale?: string;
  className?: string;
}

export function MiningComplete({
  receipt,
  totalAnalyzed = 1,
  totalHiddenCost = 0,
  onMineAnother,
  onViewReceipts,
  className
}: MiningCompleteProps) {
  const { t } = useAppLocale();
  const hiddenCost = receipt.hiddenCost.totalHidden;
  // Use honor-scaled reward from API when available; fallback to hidden cost (1:1 base for MY)
  const potentialReward = receipt.reward?.amount ?? hiddenCost;

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="card-cinematic border-accent/30">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center space-y-6">
            {/* Success icon with animation */}
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <SuccessIcon className="w-28 h-28" />
              </motion.div>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-1">{t("miningComplete.congrats")}</h2>
              <p className="text-accent font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {t("miningComplete.success")}
              </p>
            </motion.div>

            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t("miningComplete.receiptAnalyzed")}
            </motion.p>

            {/* Results */}
            <motion.div 
              className="bg-muted rounded-xl p-5 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4 text-primary" />
                  <span className="text-sm">{t("miningComplete.foundHidden")}</span>
                </div>
                <span className="font-bold text-primary tabular-nums">
                  {hiddenCost.toFixed(2)} {receipt.currency}
                </span>
              </div>

              <div className="border-t border-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">{t("miningComplete.potentialReward")}</span>
                </div>
                <span className="font-bold text-amber-400 tabular-nums">
                  {potentialReward.toFixed(0)} cPoints
                </span>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="bg-muted/50 rounded-lg p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                {t("miningComplete.stats")}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{totalAnalyzed}</p>
                  <p className="text-xs text-muted-foreground">{t("miningComplete.totalReceipts")}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary tabular-nums">
                    {(totalHiddenCost + hiddenCost).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("miningComplete.totalHidden")}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400 tabular-nums">
                    {(totalHiddenCost + potentialReward).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("miningComplete.totalPotential")}</p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              className="flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button onClick={onViewReceipts} className="flex-1 gap-2">
                <FileText className="w-4 h-4" />
                {t("miningComplete.viewHistory")}
              </Button>
              <Button variant="outline" onClick={onMineAnother} className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                {t("miningComplete.mineAnother")}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
