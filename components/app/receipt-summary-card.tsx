"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Receipt } from "@/lib/mock/types";
import { Bed } from "lucide-react";

interface ReceiptSummaryCardProps {
  receipt: Receipt;
  className?: string;
}

export function ReceiptSummaryCard({ receipt, className }: ReceiptSummaryCardProps) {
  const isHospitality = receipt.category === "hospitality_lodging";
  
  // Extract nights from breakdown reasons if available
  const nightsMatch = receipt.reasons?.find(r => r.includes("nights="))?.match(/nights=(\d+)/);
  const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : undefined;
  
  // Calculate per-night metrics for hospitality
  const perNightPaid = nights && nights > 0 ? receipt.paidExTax / nights : undefined;
  
  // Check if OTA merchant
  const isOTAMerchant = receipt.merchantName && 
    ['agoda', 'booking.com', 'booking', 'expedia', 'airbnb'].some(ota => 
      receipt.merchantName.toLowerCase().includes(ota)
    );

  return (
    <Card className={cn("card-cinematic", className)}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Merchant</span>
            <span className="font-medium text-xs sm:text-sm text-right break-words">{receipt.merchantName}</span>
          </div>
          {isHospitality && nights && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Bed className="h-3 w-3" />
                Stay Duration
              </span>
              <span className="font-medium text-xs sm:text-sm">{nights} {nights === 1 ? 'night' : 'nights'}</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Date</span>
            <span className="font-medium text-xs sm:text-sm">{receipt.date}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Currency</span>
            <span className="font-medium text-xs sm:text-sm">{receipt.currency}</span>
          </div>
          <div className="flex justify-between items-center gap-2 pt-3 border-t border-border">
            <span className="text-xs sm:text-sm text-muted-foreground">Total Amount</span>
            <span className="text-lg sm:text-xl font-bold tabular-nums text-primary text-right">
              {receipt.total.toFixed(2)} {receipt.currency}
            </span>
          </div>
          {isHospitality && perNightPaid && (
            <div className="flex justify-between items-center gap-2 pt-2 border-t border-border/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Per Night (Ex Tax)</span>
              <span className="text-sm font-semibold tabular-nums text-right">
                {perNightPaid.toFixed(2)} {receipt.currency}
              </span>
            </div>
          )}
          {isHospitality && isOTAMerchant && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground italic">
                OTA commission included in breakdown
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

