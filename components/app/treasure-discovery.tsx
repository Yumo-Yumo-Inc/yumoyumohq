"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Receipt } from "@/lib/mock/types";

interface TreasureDiscoveryProps {
  receipt: Receipt;
  onContinue: () => void;
  onCancel?: () => void;
  locale?: string;
  className?: string;
}

// Animated counter
function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);
      
      if (progress >= 1) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [value, duration]);

  return <>{displayValue.toFixed(2)}</>;
}

export function TreasureDiscovery({
  receipt,
  onContinue,
  onCancel,
  locale = "en",
  className
}: TreasureDiscoveryProps) {
  const hiddenCost = receipt.hiddenCost.totalHidden;
  const totalPaid = receipt.total;
  const productValue = receipt.hiddenCost.productValue || (totalPaid - hiddenCost);
  const hiddenPercent = totalPaid > 0 ? (hiddenCost / totalPaid) * 100 : 0;

  const texts = {
    tr: {
      title: "GİZLİ MALİYET BULUNDU!",
      hiddenCost: "Gizli Maliyet",
      paid: "Ödenen",
      realValue: "Gerçek Değer",
      hiddenLayer: "Gizli Katman",
      viewDetails: "Detaylı Analizi Gör",
      cancelAnalysis: "Analizi İptal Et",
    },
    en: {
      title: "HIDDEN COST FOUND!",
      hiddenCost: "Hidden Cost",
      paid: "Paid",
      realValue: "Real Value",
      hiddenLayer: "Hidden Layer",
      viewDetails: "View Detailed Analysis",
      cancelAnalysis: "Cancel Analysis",
    }
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="card-cinematic">
        <CardContent className="p-6 space-y-6">
          {/* Title */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              <Gem className="w-5 h-5 text-primary" />
              {t.title}
              <Gem className="w-5 h-5 text-primary" />
            </h2>
          </motion.div>

          {/* Main value */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-muted rounded-xl p-6 text-center border border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gem className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">{t.hiddenCost}</span>
                <Gem className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-primary tabular-nums">
                  <AnimatedCounter value={hiddenCost} />
                </span>
                <span className="text-xl text-muted-foreground">{receipt.currency}</span>
              </div>
            </div>
          </motion.div>

          {/* Breakdown bars */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Total Paid */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.paid}</span>
                <span className="font-medium tabular-nums">{totalPaid.toFixed(2)} {receipt.currency}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-muted-foreground/50 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </div>
            </div>

            {/* Real Value */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.realValue}</span>
                <span className="font-medium text-accent tabular-nums">{productValue.toFixed(2)} {receipt.currency}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(productValue / totalPaid) * 100}%` }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                />
              </div>
            </div>

            {/* Hidden Layer */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.hiddenLayer}</span>
                <span className="font-medium text-primary tabular-nums">
                  {hiddenCost.toFixed(2)} {receipt.currency} ({hiddenPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${hiddenPercent}%` }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div 
            className="flex justify-center gap-3 pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            {onCancel && (
              <Button 
                onClick={onCancel} 
                variant="outline" 
                size="lg" 
                className="gap-2"
              >
                <X className="w-4 h-4" />
                {t.cancelAnalysis}
              </Button>
            )}
            <Button onClick={onContinue} size="lg" className="gap-2">
              {t.viewDetails}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
