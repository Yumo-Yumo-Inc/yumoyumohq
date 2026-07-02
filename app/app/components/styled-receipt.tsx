"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReceiptAnalysis } from "@/lib/receipt/types";

interface StyledReceiptProps {
  analysis: ReceiptAnalysis;
  locale?: string;
  className?: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function StyledReceipt({
  analysis,
  locale = "tr",
  className
}: StyledReceiptProps) {
  // Defensive check - if no analysis, show placeholder
  if (!analysis) {
    return (
      <div className={cn("relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#151515] via-[#0f0f0f] to-[#151515] flex items-center justify-center", className)}>
        <p className="text-muted-foreground">Loading receipt...</p>
      </div>
    );
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const localeTag =
      locale === 'tr' ? 'tr-TR' :
      locale === 'ru' ? 'ru-RU' :
      locale === 'th' ? 'th-TH' :
      locale === 'es' ? 'es-ES' :
      locale === 'zh' ? 'zh-CN' : 'en-US';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(localeTag, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Format time
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      if (timeStr.match(/^\d{2}:\d{2}$/)) {
        return timeStr;
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  const merchantName = analysis.merchant?.name || "Unknown";
  const category = analysis.merchant?.category || "General";
  const totalPaid = analysis.pricing?.totalPaid || analysis.extraction?.total?.value || 0;
  const hiddenCost = analysis.hiddenCost?.hiddenCostCore || (analysis.hiddenCost as any)?.totalHidden || 0;
  const currency = analysis.pricing?.currency || "TRY";
  const symbol = analysis.pricing?.symbol || "₺";
  const date = formatDate(analysis.extraction?.date?.value || new Date().toISOString());
  const time = formatTime(analysis.extraction?.time?.value);

  // Truncate merchant name to fit in box (max 25 chars)
  const truncatedMerchant = merchantName.length > 25 
    ? merchantName.substring(0, 22) + "..." 
    : merchantName;

  // Generate unique receipt code
  const generateReceiptCode = () => {
    if (analysis.receiptId) {
      const id = analysis.receiptId.replace(/-/g, '').toUpperCase();
      return id.length >= 12 ? `${id.substring(0, 8)}-${id.substring(id.length - 4)}` : id;
    }
    const dateStr = (analysis.extraction?.date?.value || '').replace(/-/g, '').substring(2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${dateStr}-${random}`;
  };

  const receiptCode = generateReceiptCode();
  const uniqueId = `receipt-${analysis.receiptId || Math.random().toString(36).substring(7)}`;

  // Localized texts
  const texts = {
    tr: {
      merchant: "SATICI",
      dateTime: "TARİH & SAAT",
      timeNA: "Saat bilgisi yok",
      totalPaid: "ÖDENEN TOPLAM",
      hiddenCost: "GİZLİ MALİYET TESPİT EDİLDİ",
      thanks: "YumoYumo'yu tercih ettiğiniz için teşekkür ederiz",
      seeAgain: "Yine bekleriz",
      receiptCode: "FİŞ KODU",
      digitalReceipt: "DİJİTAL FİŞ"
    },
    en: {
      merchant: "MERCHANT",
      dateTime: "DATE & TIME",
      timeNA: "Time not available",
      totalPaid: "TOTAL AMOUNT PAID",
      hiddenCost: "HIDDEN COST DETECTED",
      thanks: "Thank you for choosing YumoYumo",
      seeAgain: "We look forward to seeing you again",
      receiptCode: "RECEIPT CODE",
      digitalReceipt: "DIGITAL RECEIPT"
    }
  };

  const t = texts[locale as keyof typeof texts] || texts.tr;

  return (
    <motion.div
      className={cn("relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#151515] via-[#0f0f0f] to-[#151515] shadow-2xl", className)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)"
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 400 520" 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`${uniqueId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#121212", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#1c1c1c", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`${uniqueId}-accent`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#f97316", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "#ec4899", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
          </linearGradient>
          <pattern id={`${uniqueId}-dots`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="#2a2a2a" opacity="0.25"/>
          </pattern>
          <filter id={`${uniqueId}-shadow`}>
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.1"/>
          </filter>
        </defs>
        
        {/* Background */}
        <rect width="400" height="520" fill={`url(#${uniqueId}-bg)`} rx="12"/>
        <rect width="400" height="520" fill={`url(#${uniqueId}-dots)`} opacity="0.4"/>
        
        {/* Receipt border lines */}
        <line x1="50" y1="65" x2="350" y2="65" stroke="#2f2f2f" strokeWidth="1" strokeDasharray="3,3" opacity="0.7"/>
        <line x1="50" y1="455" x2="350" y2="455" stroke="#2f2f2f" strokeWidth="1" strokeDasharray="3,3" opacity="0.7"/>
        
        {/* Receipt Code - Top Right (frame starts where text starts, right-aligned) */}
        <rect x="278" y="12" width="112" height="25" fill="#1f1f1f" stroke="#2f2f2f" strokeWidth="1" rx="4" opacity="0.95"/>
        <text x="385" y="19" textAnchor="end" style={{ fontFamily: "Arial, sans-serif", fontSize: "6px", fontWeight: "600", letterSpacing: "1px" }} fill="#94a3b8">{t.receiptCode}</text>
        <text x="385" y="30" textAnchor="end" style={{ fontFamily: "Courier New, monospace", fontSize: "9px", fontWeight: "bold" }} fill="#f97316">{escapeXml(receiptCode)}</text>
        
        {/* Header */}
        <g transform="translate(200, 32)">
          <text x="0" y="0" style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "bold" }} textAnchor="middle" fill={`url(#${uniqueId}-accent)`}>YUMO YUMO</text>
          <text x="0" y="14" style={{ fontFamily: "Arial, sans-serif", fontSize: "7px", letterSpacing: "2px" }} textAnchor="middle" fill="#94a3b8">{t.digitalReceipt}</text>
        </g>
        
        {/* Merchant Section */}
        <rect x="30" y="78" width="340" height="80" fill="#242424" stroke="#2f2f2f" strokeWidth="1.5" rx="8" filter={`url(#${uniqueId}-shadow)`} opacity="0.95"/>
        <text x="200" y="98" style={{ fontFamily: "Arial, sans-serif", fontSize: "8px", fontWeight: "600", letterSpacing: "1.5px" }} textAnchor="middle" fill="#94a3b8">{t.merchant}</text>
        <text x="200" y="118" style={{ fontFamily: "Georgia, serif", fontSize: "15px", fontWeight: "bold" }} textAnchor="middle" fill="#f1f5f9">{escapeXml(truncatedMerchant)}</text>
        <text x="200" y="136" style={{ fontFamily: "Arial, sans-serif", fontSize: "9px", fontWeight: "500" }} textAnchor="middle" fill="#cbd5e1">{escapeXml(category.toUpperCase())}</text>
        
        {/* Date & Time Section */}
        <rect x="30" y="170" width="340" height="60" fill="#242424" stroke="#2f2f2f" strokeWidth="1.5" rx="8" filter={`url(#${uniqueId}-shadow)`} opacity="0.95"/>
        <text x="200" y="190" style={{ fontFamily: "Arial, sans-serif", fontSize: "8px", fontWeight: "600", letterSpacing: "1.5px" }} textAnchor="middle" fill="#94a3b8">{t.dateTime}</text>
        <text x="200" y="210" style={{ fontFamily: "Courier New, monospace", fontSize: "12px", fontWeight: "bold" }} textAnchor="middle" fill="#f1f5f9">{escapeXml(date)}</text>
        {time ? (
          <text x="200" y="224" style={{ fontFamily: "Courier New, monospace", fontSize: "11px", fontWeight: "600" }} textAnchor="middle" fill="#cbd5e1">{escapeXml(time)}</text>
        ) : (
          <text x="200" y="224" style={{ fontFamily: "Arial, sans-serif", fontSize: "9px" }} textAnchor="middle" fill="#64748b">{t.timeNA}</text>
        )}
        
        {/* Divider */}
        <line x1="50" y1="245" x2="350" y2="245" stroke="#2f2f2f" strokeWidth="1" strokeDasharray="5,3" opacity="0.7"/>
        
        {/* Total Amount Section */}
        <rect x="30" y="258" width="340" height="90" fill="#1a1a1a" stroke="#f97316" strokeWidth="2" rx="10" filter={`url(#${uniqueId}-shadow)`} opacity="0.98"/>
        <text x="200" y="280" style={{ fontFamily: "Arial, sans-serif", fontSize: "8px", fontWeight: "600", letterSpacing: "1.5px" }} textAnchor="middle" fill="#94a3b8">{t.totalPaid}</text>
        <text x="200" y="315" style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: "bold" }} textAnchor="middle" fill="#f97316">{totalPaid.toFixed(2)}</text>
        <text x="200" y="335" style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", fontWeight: "600", letterSpacing: "1px" }} textAnchor="middle" fill="#cbd5e1">{escapeXml(currency)}</text>
        
        {/* Hidden Cost Section */}
        <rect x="30" y="360" width="340" height="75" fill="#1a1a1a" stroke="#ef4444" strokeWidth="2" rx="8" filter={`url(#${uniqueId}-shadow)`} opacity="0.98"/>
        <text x="200" y="382" style={{ fontFamily: "Arial, sans-serif", fontSize: "8px", fontWeight: "600", letterSpacing: "1.5px" }} textAnchor="middle" fill="#fca5a5">{t.hiddenCost}</text>
        <text x="200" y="408" style={{ fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "bold" }} textAnchor="middle" fill="#ef4444">{hiddenCost.toFixed(2)}</text>
        <text x="200" y="425" style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", fontWeight: "600", letterSpacing: "1px" }} textAnchor="middle" fill="#fca5a5">{escapeXml(currency)}</text>
        
        {/* Footer */}
        <text x="200" y="475" style={{ fontFamily: "Arial, sans-serif", fontSize: "9px", fontWeight: "600", letterSpacing: "0.5px" }} textAnchor="middle" fill="#cbd5e1">
          {t.thanks}
        </text>
        <text x="200" y="488" style={{ fontFamily: "Arial, sans-serif", fontSize: "8px", fontWeight: "500", letterSpacing: "0.5px" }} textAnchor="middle" fill="#94a3b8">
          {t.seeAgain}
        </text>
        
        {/* Yumo Yumo Signature */}
        <g transform="translate(200, 505)">
          <text x="0" y="0" style={{ fontFamily: "Georgia, serif", fontSize: "11px", fontWeight: "bold", fontStyle: "italic" }} textAnchor="middle" fill={`url(#${uniqueId}-accent)`}>Yumo Yumo</text>
        </g>
      </svg>
    </motion.div>
  );
}
