"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ReceiptLoadingViewerProps {
  imageUrl: string;
  className?: string;
}

interface ReceiptLoadingViewerProps {
  imageUrl: string;
  merchantName?: string;
  className?: string;
}

export function ReceiptLoadingViewer({ imageUrl, merchantName, className }: ReceiptLoadingViewerProps) {
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    // Zoom in/out animation
    const interval = setInterval(() => {
      setScale((prev) => {
        if (prev >= 1.1) return 0.95;
        return prev + 0.01;
      });
    }, 50);

    // Opacity pulse
    const opacityInterval = setInterval(() => {
      setOpacity((prev) => {
        if (prev >= 0.5) return 0.3;
        return prev + 0.02;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(opacityInterval);
    };
  }, []);

  return (
    <div className={cn("relative w-full h-[600px] bg-black/90 rounded-lg overflow-hidden", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={imageUrl}
          alt="Receipt"
          className="max-w-full max-h-full object-contain transition-all duration-300"
          style={{
            transform: `scale(${scale})`,
            opacity,
          }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Processing receipt...</p>
          {merchantName && (
            <p className="text-lg font-semibold text-foreground">{merchantName}</p>
          )}
        </div>
      </div>
    </div>
  );
}

