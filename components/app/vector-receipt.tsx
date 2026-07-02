"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTier } from "@/lib/theme/theme-context";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { Receipt } from "@/lib/mock/types";
import { displayHiddenCost } from "@/lib/receipt/display-hidden-cost";

interface VectorReceiptProps {
  receipt: Receipt;
  /** @deprecated Use app locale from context */
  locale?: string;
  className?: string;
  /** Level used for tier colors; falls back to ThemeLevelContext when omitted */
  accountLevel?: number;
  /** Theme accent override (optional); falls back to the tier's accent */
  accent?: string;
  accent2?: string;
  /** Compact view (smaller, for mobile) */
  compact?: boolean;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function VectorReceipt({
  receipt,
  locale: localeProp,
  className,
  accountLevel = 1,
  accent,
  accent2,
  compact = true,
}: VectorReceiptProps) {
  const { locale, t } = useAppLocale();
  const tier = useTier(accountLevel);
  const acc = accent ?? tier.accent;
  const acc2 = accent2 ?? tier.accent2;
  const localeForFormat = localeProp ?? locale;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(localeForFormat === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr || timeStr.trim() === "") return null;
    return timeStr.match(/^\d{2}:\d{2}$/) ? timeStr : timeStr;
  };

  const category = receipt.category || "General";
  const totalPaid = receipt.totalPaid || receipt.total;
  const hiddenCost = displayHiddenCost(receipt);
  const date = formatDate(receipt.date);
  const time = formatTime(receipt.time);

  const merchantName = receipt.merchantName || "Unknown";
  const truncatedMerchant =
    merchantName.length > 25 ? merchantName.substring(0, 22) + "…" : merchantName;

  const generateReceiptCode = () => {
    if (receipt.id) {
      const id = receipt.id.replace(/-/g, "").toUpperCase();
      return id.length >= 12 ? `${id.substring(0, 8)}-${id.substring(id.length - 4)}` : id;
    }
    const dateStr = receipt.date.replace(/-/g, "").substring(2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${dateStr}-${random}`;
  };

  const receiptCode = generateReceiptCode();
  const uniqueId = `receipt-${receipt.id || Math.random().toString(36).substring(7)}`;

  const thankYou = t("vectorReceipt.thankYou");
  const seeAgain = t("vectorReceipt.seeYouAgain");

  return (
    <motion.div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden border",
        compact ? "min-h-[280px] max-h-[320px]" : "min-h-[560px]",
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        background: `linear-gradient(165deg, ${tier.cardBg} 0%, rgba(12,10,14,0.95) 100%)`,
        borderColor: tier.cardBorder,
        boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px ${tier.topLine}40`,
      }}
    >
      {/* Top highlight line */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{ background: tier.topLine }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 600"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient
            id={`${uniqueId}-accent`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" style={{ stopColor: acc, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: acc2, stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient
            id={`${uniqueId}-accent-vert`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" style={{ stopColor: acc, stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: acc, stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient
            id={`${uniqueId}-paper`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" style={{ stopColor: "#18181b", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "#1c1c21", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#121214", stopOpacity: 1 }} />
          </linearGradient>
          <pattern
            id={`${uniqueId}-noise`}
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="0.4" fill={acc} opacity="0.04" />
            <circle cx="35" cy="25" r="0.3" fill={acc} opacity="0.03" />
            <circle cx="50" cy="45" r="0.5" fill={acc} opacity="0.02" />
          </pattern>
          <filter id={`${uniqueId}-glow`}>
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background — paper feel */}
        <rect width="400" height="600" fill={`url(#${uniqueId}-paper)`} rx="12" />
        <rect
          width="400"
          height="600"
          fill={`url(#${uniqueId}-noise)`}
          opacity="0.6"
        />

        {/* Top dashed line */}
        <line
          x1="40"
          y1="62"
          x2="360"
          y2="62"
          stroke={tier.topLine}
          strokeWidth="1"
          strokeDasharray="6,4"
          opacity="0.8"
        />

        {/* Receipt code — top-right badge */}
        <rect
          x="250"
          y="14"
          width="130"
          height="32"
          fill={`${acc}08`}
          stroke={`${acc}30`}
          strokeWidth="1"
          rx="6"
        />
        <text
          x="375"
          y="24"
          textAnchor="end"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "6px",
            fontWeight: "600",
            letterSpacing: "1.2px",
          }}
          fill={acc}
          opacity="0.9"
        >
          RECEIPT
        </text>
        <text
          x="375"
          y="36"
          textAnchor="end"
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "9px",
            fontWeight: "700",
          }}
          fill={acc}
        >
          {escapeXml(receiptCode)}
        </text>

        {/* Logo / title */}
        <g transform="translate(200, 45)">
          <text
            x="0"
            y="0"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "20px",
              fontWeight: "bold",
            }}
            textAnchor="middle"
            fill={`url(#${uniqueId}-accent)`}
          >
            YUMO YUMO
          </text>
          <text
            x="0"
            y="15"
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "7px",
              letterSpacing: "2.5px",
            }}
            textAnchor="middle"
            fill={acc}
            opacity="0.7"
          >
            DIGITAL RECEIPT
          </text>
        </g>

        {/* Merchant block */}
        <rect
          x="28"
          y="82"
          width="344"
          height="92"
          fill={`${acc}06`}
          stroke={`${acc}20`}
          strokeWidth="1.5"
          rx="10"
        />
        <text
          x="200"
          y="105"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "8px",
            fontWeight: "600",
            letterSpacing: "1.5px",
          }}
          textAnchor="middle"
          fill={acc}
          opacity="0.8"
        >
          MERCHANT
        </text>
        <text
          x="200"
          y="128"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "17px",
            fontWeight: "bold",
          }}
          textAnchor="middle"
          fill="#f4f4f5"
        >
          {escapeXml(truncatedMerchant)}
        </text>
        <text
          x="200"
          y="148"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "9px",
            fontWeight: "500",
          }}
          textAnchor="middle"
          fill="#a1a1aa"
        >
          {escapeXml(category.toUpperCase())}
        </text>

        {/* Date & time block */}
        <rect
          x="28"
          y="188"
          width="344"
          height="68"
          fill={`${acc}06`}
          stroke={`${acc}20`}
          strokeWidth="1.5"
          rx="10"
        />
        <text
          x="200"
          y="210"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "8px",
            fontWeight: "600",
            letterSpacing: "1.5px",
          }}
          textAnchor="middle"
          fill={acc}
          opacity="0.8"
        >
          DATE & TIME
        </text>
        <text
          x="200"
          y="233"
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "14px",
            fontWeight: "bold",
          }}
          textAnchor="middle"
          fill="#f4f4f5"
        >
          {escapeXml(date)}
        </text>
        {time ? (
          <text
            x="200"
            y="252"
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "12px",
              fontWeight: "600",
            }}
            textAnchor="middle"
            fill="#a1a1aa"
          >
            {escapeXml(time)}
          </text>
        ) : (
          <text
            x="200"
            y="252"
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "10px",
            }}
            textAnchor="middle"
            fill="#71717a"
          >
            {t("vectorReceipt.timeNa")}
          </text>
        )}

        {/* Divider */}
        <line
          x1="40"
          y1="270"
          x2="360"
          y2="270"
          stroke={tier.topLine}
          strokeWidth="1"
          strokeDasharray="8,4"
          opacity="0.6"
        />

        {/* Total — emphasized */}
        <rect
          x="28"
          y="285"
          width="344"
          height="115"
          fill={`${acc}0a`}
          stroke={acc}
          strokeWidth="2"
          rx="12"
          filter={`url(#${uniqueId}-glow)`}
        />
        <text
          x="200"
          y="312"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "9px",
            fontWeight: "600",
            letterSpacing: "1.5px",
          }}
          textAnchor="middle"
          fill={acc}
          opacity="0.9"
        >
          TOTAL PAID
        </text>
        <text
          x="200"
          y="355"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            fontWeight: "bold",
          }}
          textAnchor="middle"
          fill={acc}
        >
          {totalPaid.toFixed(2)}
        </text>
        <text
          x="200"
          y="378"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "1px",
          }}
          textAnchor="middle"
          fill="#d4d4d8"
        >
          {escapeXml(receipt.currency)}
        </text>

        {/* Hidden cost — attention-grabbing */}
        <rect
          x="28"
          y="413"
          width="344"
          height="88"
          fill={`${acc2}0a`}
          stroke={acc2}
          strokeWidth="2"
          rx="10"
          filter={`url(#${uniqueId}-glow)`}
        />
        <text
          x="200"
          y="438"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "8px",
            fontWeight: "600",
            letterSpacing: "1.5px",
          }}
          textAnchor="middle"
          fill={acc2}
          opacity="0.9"
        >
          HIDDEN COST
        </text>
        <text
          x="200"
          y="472"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "26px",
            fontWeight: "bold",
          }}
          textAnchor="middle"
          fill={acc2}
        >
          {hiddenCost.toFixed(2)}
        </text>
        <text
          x="200"
          y="490"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "11px",
            fontWeight: "600",
          }}
          textAnchor="middle"
          fill="#a1a1aa"
        >
          {escapeXml(receipt.currency)}
        </text>

        {/* Bottom dashed line */}
        <line
          x1="40"
          y1="515"
          x2="360"
          y2="515"
          stroke={tier.topLine}
          strokeWidth="1"
          strokeDasharray="6,4"
          opacity="0.6"
        />

        {/* Thank-you message */}
        <g transform="translate(200, 545)">
          <text
            x="0"
            y="0"
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "10px",
              fontWeight: "600",
            }}
            textAnchor="middle"
            fill="#d4d4d8"
          >
            {thankYou}
          </text>
          <text
            x="0"
            y="16"
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "9px",
              fontWeight: "500",
            }}
            textAnchor="middle"
            fill="#71717a"
          >
            {seeAgain}
          </text>
        </g>

        {/* Signature */}
        <text
          x="200"
          y="578"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "12px",
            fontWeight: "bold",
            fontStyle: "italic",
          }}
          textAnchor="middle"
          fill={`url(#${uniqueId}-accent)`}
        >
          Yumo Yumo
        </text>
      </svg>
    </motion.div>
  );
}
