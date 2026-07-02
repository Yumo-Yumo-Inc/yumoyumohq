"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Package, 
  Building2, 
  Tag, 
  Gem, 
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Info,
  FileText,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Receipt } from "@/lib/mock/types";
import { VectorReceipt } from "./vector-receipt";
import { useAppLocale } from "@/lib/i18n/app-context";
import { FieldCorrectionModal } from "./field-correction-modal";
import { Bug } from "lucide-react";

interface CostLayerBreakdownProps {
  receipt: Receipt;
  onBack: () => void;
  onContinue: () => void;
  locale?: string;
  className?: string;
  isAdmin?: boolean; // OCR output only visible to admin
  accountLevel?: number;
}

const bucketConfig = {
  store: { icon: Store, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  supply: { icon: Package, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  retail: { icon: Tag, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  government: { icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

export function CostLayerBreakdown({
  receipt,
  onBack,
  onContinue,
  locale = "en",
  className,
  isAdmin = false,
  accountLevel = 1,
}: CostLayerBreakdownProps) {
  const { t: tApp } = useAppLocale();
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);
  const [showOcr, setShowOcr] = useState(false);
  const [reportBugOpen, setReportBugOpen] = useState(false);

  // Government's share (VAT) is not shown in the breakdown — only hidden cost layers are
  const items = (receipt.hiddenCost.breakdownItems || []).filter((item) => item.bucket !== "government");
  // OCR data only visible to admin users
  const hasOcrData = isAdmin && ((receipt.ocrLines && receipt.ocrLines.length > 0) || receipt.ocrRawText);
  const totalHidden = receipt.hiddenCost.totalHidden;
  // Ensure productValue is never negative
  const productValue = Math.max(0, receipt.hiddenCost.productValue || (receipt.total - totalHidden));
  const totalPaid = receipt.total;

  // Group items by bucket
  const groupedItems = items.reduce((acc, item) => {
    const bucket = item.bucket || "other";
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const texts = {
    tr: {
      title: "Maliyet Katmanları",
      total: "TOPLAM",
      productValue: "Ürün Değeri",
      storeOps: "Mağaza İşletme",
      supplyChain: "Tedarik & Lojistik",
      retailBrand: "Perakende & Marka",
      stateTaxes: "Devlet Payı",
      back: "Geri",
      continue: "Devam Et",
      ocrOutput: "OCR Çıktısı",
      showOcr: "OCR Çıktısını Göster",
      hideOcr: "OCR Çıktısını Gizle",
    },
    en: {
      title: "Cost Layers",
      total: "TOTAL",
      productValue: "Product Value",
      storeOps: "Store Operations",
      supplyChain: "Supply & Logistics",
      retailBrand: "Retail & Brand",
      stateTaxes: "State Taxes",
      back: "Back",
      continue: "Continue",
      ocrOutput: "OCR Output",
      showOcr: "Show OCR Output",
      hideOcr: "Hide OCR Output",
    }
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  const bucketLabels: Record<string, string> = {
    store: t.storeOps,
    supply: t.supplyChain,
    retail: t.retailBrand,
    government: t.stateTaxes,
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 2-Column Layout: Left = Styled Receipt, Right = Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Styled Receipt (visible on all screen sizes) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold mb-3 text-center">{locale === 'tr' ? 'Düzenlenen Fiş' : 'Styled Receipt'}</h3>
          <VectorReceipt receipt={receipt} locale={locale} accountLevel={accountLevel} className="h-[280px] sm:h-[400px] lg:h-[550px]" compact={false} />
          {receipt.id && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-amber-500/80 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-400"
                onClick={() => setReportBugOpen(true)}
              >
                <Bug className="w-4 h-4" />
                {tApp("correctionModal.button")}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Right Column: Cost Breakdown */}
        <Card className="card-cinematic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo Quality Warning for Admin - Show if background objects detected */}
            {isAdmin && receipt.ocrLines && (() => {
              // Check if OCR contains text from multiple receipts (e.g., "GIFT" at top when merchant is "MR.D.I.Y.")
              const firstFewLines = receipt.ocrLines.slice(0, 5).map(l => l.text.toUpperCase());
              const hasMultipleReceipts = firstFewLines.some(line => 
                /^(GIFT|FASHION|STARDU|AP)$/i.test(line.trim()) && 
                receipt.merchantName && 
                !receipt.merchantName.toUpperCase().includes(line.trim())
              );
              
              if (hasMultipleReceipts) {
                return (
                  <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">
                        {locale === 'tr' 
                          ? 'Fotoğraf Kalitesi Uyarısı' 
                          : 'Photo Quality Warning'}
                      </p>
                      <p className="text-xs leading-relaxed">
                        {locale === 'tr'
                          ? 'Fotoğrafta birden fazla fiş veya başka nesneler tespit edildi. Bu durum OCR kalitesini düşürebilir ve yanlış veri çıkarımına neden olabilir. Lütfen sadece tek bir fişin görünür olduğundan emin olun.'
                          : 'Multiple receipts or other objects detected in photo. This may reduce OCR quality and cause incorrect data extraction. Please ensure only a single receipt is visible.'}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Margin Violation Warning - Show to ALL users (friendly reminder, not just admin) */}
            {receipt.marginViolation && (receipt.marginViolation.hasViolation === true || receipt.marginViolation.violationCount > 0) && (
              <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-2">
                    {locale === 'tr' 
                      ? '📸 Fotoğraf İpucu' 
                      : '📸 Photo Tip'}
                  </p>
                  <p className="text-sm leading-relaxed mb-2">
                    {locale === 'tr'
                      ? receipt.marginViolation.violationCount >= 3
                        ? "Fişinizin etrafında yeterli boşluk yok. Lütfen bir sonraki fotoğrafta fişi koyu bir yüzeye yerleştirip tüm kenarlardan boşluk bırakın. Bu, daha iyi okuma kalitesi sağlar. (3. uyarı - bir sonraki fotoğrafta dikkat edin)"
                        : receipt.marginViolation.violationCount >= 2
                        ? "Fişinizin etrafında yeterli boşluk yok. Lütfen bir sonraki fotoğrafta fişi koyu bir yüzeye yerleştirip tüm kenarlardan boşluk bırakın. Bu, daha iyi okuma kalitesi sağlar."
                        : "Fişinizin etrafında biraz daha boşluk bırakırsanız, okuma kalitesi daha iyi olur. Lütfen fişi koyu bir yüzeye yerleştirip tüm kenarlardan boşluk bırakın."
                      : receipt.marginViolation.violationCount >= 3
                      ? "Your receipt doesn't have enough space around it. Please place the receipt on a dark surface with space around all edges for better reading quality. (3rd warning - please be careful in the next photo)"
                      : receipt.marginViolation.violationCount >= 2
                      ? "Your receipt doesn't have enough space around it. Please place the receipt on a dark surface with space around all edges for better reading quality."
                      : "Adding a bit more space around your receipt will improve reading quality. Please place the receipt on a dark surface with space around all edges."}
                  </p>
                  <div className="mt-2 text-xs text-blue-300 dark:text-blue-500">
                    {locale === 'tr'
                      ? '💡 İpucu: Fişi koyu bir zemin üzerine koyun ve tüm kenarlardan en az 2-3 cm boşluk bırakın.'
                      : '💡 Tip: Place the receipt on a dark surface and leave at least 2-3 cm of space around all edges.'}
                  </div>
                </div>
              </div>
            )}

            {/* Admin bypass — shown to admins in the breakdown: reason a regular user would have been rejected */}
            {isAdmin && receipt.marginViolation?.adminBypass && (
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">
                    {locale === 'tr' ? 'Admin Bypass' : 'Admin Bypass'}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {receipt.marginViolation.adminBypass}
                  </p>
                </div>
              </div>
            )}
            
            {/* Fraud warning for admin — warnings (moiré, etc.) shown to admins in the breakdown; if adminBypass is set, show it in the same card */}
            {isAdmin && (
              (receipt.fraudInfo && (
                (receipt.fraudInfo.warnings && receipt.fraudInfo.warnings.length > 0) || 
                (receipt.fraudInfo.rejectionReasons && receipt.fraudInfo.rejectionReasons.length > 0) || 
                !receipt.fraudInfo.isValid
              )) || !!receipt.marginViolation?.adminBypass || !!receipt.qualityHonor
            ) && (() => {
              const fraudInfo = receipt.fraudInfo;
              const hasFraudContent = fraudInfo && (
                (fraudInfo.warnings && fraudInfo.warnings.length > 0) || 
                (fraudInfo.rejectionReasons && fraudInfo.rejectionReasons.length > 0) || 
                !fraudInfo.isValid
              );
              const hasAdminBypass = !!receipt.marginViolation?.adminBypass;
              const hasQualityHonor = !!receipt.qualityHonor;
              const isRed = hasFraudContent && !fraudInfo!.isValid;
              return (
                <div className={`border-2 rounded-lg p-4 mb-4 ${
                  isRed ? 'border-red-500 bg-red-500/10' : 'border-amber-500 bg-amber-500/10'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      isRed ? 'text-red-600' : 'text-amber-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${
                        isRed ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {isRed
                          ? (locale === 'tr' ? 'Uyarı: Fraud Tespit Edildi' : 'Warning: Fraud Detected')
                          : hasQualityHonor && !hasFraudContent && !hasAdminBypass
                            ? (locale === 'tr' ? 'Kalite / Honor' : 'Quality / Honor')
                            : (locale === 'tr' ? 'Uyarılar ve Kontroller' : 'Warnings and Checks')}
                      </h4>
                      <div className="space-y-2">
                        <div className={`text-sm ${
                          isRed ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {/* Admin bypass (margin) — must always show in the breakdown; state explicitly that a regular user would have been rejected */}
                          {hasAdminBypass && (
                            <div className="mb-3 p-2 rounded bg-amber-500/20 border border-amber-500/40">
                              <p className="font-semibold mb-1">
                                {locale === 'tr' ? '🔓 Admin Bypass (Marjin):' : '🔓 Admin Bypass (Margin):'}
                              </p>
                              <p className="text-xs font-medium mb-1 text-amber-800 dark:text-amber-200">
                                {locale === 'tr'
                                  ? 'Bu fiş sadece admin bypass ile kabul edildi; normal kullanıcı yükleme aşamasında reddedilirdi.'
                                  : 'This receipt was accepted only due to admin bypass; a normal user would have been rejected at upload.'}
                              </p>
                              <p className="text-xs leading-relaxed">{receipt.marginViolation!.adminBypass}</p>
                            </div>
                          )}
                          {hasFraudContent && fraudInfo!.riskLevel && fraudInfo!.fraudScore !== undefined && (
                            <p className="font-medium mb-1">
                              {locale === 'tr' 
                                ? `Risk Seviyesi: ${fraudInfo!.riskLevel === 'critical' ? 'Kritik' : fraudInfo!.riskLevel === 'high' ? 'Yüksek' : fraudInfo!.riskLevel === 'medium' ? 'Orta' : 'Düşük'} (Skor: ${fraudInfo!.fraudScore}/100)`
                                : `Risk Level: ${fraudInfo!.riskLevel.toUpperCase()} (Score: ${fraudInfo!.fraudScore}/100)`}
                            </p>
                          )}
                          {hasFraudContent && fraudInfo!.rejectionReasons && fraudInfo!.rejectionReasons.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium mb-1">
                                {locale === 'tr' ? 'Red Nedenleri:' : 'Rejection Reasons:'}
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-xs">
                                {fraudInfo!.rejectionReasons.map((reason, idx) => (
                                  <li key={idx} className={!fraudInfo!.isValid ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {hasFraudContent && fraudInfo!.warnings && fraudInfo!.warnings.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium mb-1">
                                {locale === 'tr' ? 'Uyarılar:' : 'Warnings:'}
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-xs">
                                {fraudInfo!.warnings.map((warning, idx) => (
                                  <li key={idx} className={!fraudInfo!.isValid ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {hasFraudContent && fraudInfo!.checks && (
                            <div className="mt-2 text-xs">
                              <p className="font-medium mb-1">
                                {locale === 'tr' ? 'Kontroller:' : 'Checks:'}
                              </p>
                              <div className="grid grid-cols-2 gap-1">
                                {fraudInfo!.checks!.hasExif !== undefined && (
                                  <span className={fraudInfo!.checks!.hasExif ? 'text-green-600' : 'text-red-600'}>
                                    {locale === 'tr' ? 'EXIF:' : 'EXIF:'} {fraudInfo!.checks!.hasExif ? '✓' : '✗'}
                                  </span>
                                )}
                                {fraudInfo!.checks!.hasDate !== undefined && (
                                  <span className={fraudInfo!.checks!.hasDate ? 'text-green-600' : 'text-red-600'}>
                                    {locale === 'tr' ? 'Tarih:' : 'Date:'} {fraudInfo!.checks!.hasDate ? '✓' : '✗'}
                                  </span>
                                )}
                                {fraudInfo!.checks!.hasTime !== undefined && (
                                  <span className={fraudInfo!.checks!.hasTime ? 'text-green-600' : 'text-red-600'}>
                                    {locale === 'tr' ? 'Saat:' : 'Time:'} {fraudInfo!.checks!.hasTime ? '✓' : '✗'}
                                  </span>
                                )}
                                {fraudInfo!.checks!.merchantVerified !== undefined && (
                                  <span className={fraudInfo!.checks!.merchantVerified ? 'text-green-600' : 'text-red-600'}>
                                    {locale === 'tr' ? 'Merchant:' : 'Merchant:'} {fraudInfo!.checks!.merchantVerified ? '✓' : '✗'}
                                  </span>
                                )}
                                {fraudInfo!.checks!.hasInfrastructure !== undefined && (
                                  <span className={fraudInfo!.checks!.hasInfrastructure ? 'text-green-600' : 'text-red-600'}>
                                    {locale === 'tr' ? 'Altyapı:' : 'Infrastructure:'} {fraudInfo!.checks!.hasInfrastructure ? '✓' : '✗'}
                                  </span>
                                )}
                                {fraudInfo!.checks!.isScreenshot !== undefined && (
                                  <span className={!fraudInfo!.checks!.isScreenshot ? 'text-green-600' : 'text-red-600'}>
                                    {locale === 'tr' ? 'Screenshot:' : 'Screenshot:'} {!fraudInfo!.checks!.isScreenshot ? '✓' : '✗'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Quality / Honor (admin, when honor system is active) */}
                          {receipt.qualityHonor && (
                            <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
                              <p className="font-medium mb-2 text-amber-700 dark:text-amber-300">
                                {locale === 'tr' ? 'Kalite / Honor' : 'Quality / Honor'}
                              </p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                                <span>
                                  <span className="font-medium text-amber-800 dark:text-amber-200">{locale === 'tr' ? 'Seviye:' : 'Level:'}</span>{' '}
                                  {locale === 'tr'
                                    ? (receipt.qualityHonor.level === 'LOW' ? 'Düşük' : receipt.qualityHonor.level === 'MEDIUM' ? 'Orta' : receipt.qualityHonor.level === 'RISKY' ? 'Riskli' : receipt.qualityHonor.level === 'HIGH' ? 'Yüksek' : receipt.qualityHonor.level === 'EXTREME' ? 'Aşırı' : receipt.qualityHonor.level === 'SECURITY' ? 'Güvenlik' : receipt.qualityHonor.level)
                                    : receipt.qualityHonor.level}
                                </span>
                                {typeof receipt.qualityHonor.qualityScore === 'number' && (
                                  <span>
                                    <span className="font-medium text-amber-800 dark:text-amber-200">{locale === 'tr' ? 'Kalite puanı:' : 'Quality score:'}</span>{' '}
                                    {receipt.qualityHonor.qualityScore}
                                  </span>
                                )}
                                <span>
                                  <span className="font-medium text-amber-800 dark:text-amber-200">{locale === 'tr' ? 'Honor:' : 'Honor:'}</span>{' '}
                                  {receipt.qualityHonor.honorDelta >= 0 ? '+' : ''}{receipt.qualityHonor.honorDelta}
                                </span>
                                <span>
                                  <span className="font-medium text-amber-800 dark:text-amber-200">{locale === 'tr' ? 'Ödül oranı:' : 'Reward %:'}</span>{' '}
                                  %{receipt.qualityHonor.rewardPct}
                                  {receipt.qualityHonor.honorBonusApplied && (locale === 'tr' ? ' (1.2x bonus)' : ' (1.2x bonus)')}
                                </span>
                              </div>
                              {(receipt.qualityHonor.reasons?.length || receipt.qualityHonor.securityReasons?.length) ? (
                                <div className="mt-2">
                                  <p className="font-medium mb-1 text-amber-800 dark:text-amber-200 text-xs">
                                    {locale === 'tr' ? 'Kalitenin hesaplanması:' : 'How quality is calculated:'}
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                                    {(receipt.qualityHonor.securityReasons?.length ? receipt.qualityHonor.securityReasons : []).map((r, idx) => (
                                      <li key={`sec-${idx}`}>{r}</li>
                                    ))}
                                    {(receipt.qualityHonor.reasons || []).map((r, idx) => (
                                      <li key={idx}>{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                      {hasFraudContent && !fraudInfo!.isValid && (
                        <p className="text-xs mt-3 text-red-600 dark:text-red-500">
                          {locale === 'tr' 
                            ? 'Bu fiş fraud tespiti nedeniyle normal kullanıcılar için reddedilmiş olurdu, ancak admin modunda analiz için gösteriliyor.'
                            : 'This receipt would be rejected for regular users due to fraud detection, but is shown for analysis in admin mode.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Rejection Info for Admin - Show all rejection reasons that were bypassed */}
            {isAdmin && receipt.rejectionInfo && receipt.rejectionInfo.length > 0 && (
              <div className="border-2 border-red-500 bg-red-500/10 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 text-red-600">
                      {locale === 'tr' ? '⚠️ Red Sebepleri (Admin Bypass)' : '⚠️ Rejection Reasons (Admin Bypass)'}
                    </h4>
                    <div className="space-y-3">
                      {receipt.rejectionInfo.map((rejection, idx) => (
                        <div key={idx} className="border-l-2 border-red-500/50 pl-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {rejection.substage || rejection.stage}
                            </Badge>
                            {rejection.gateConfidence !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                Confidence: {rejection.gateConfidence}%
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-red-600 dark:text-red-400 text-sm">
                            {rejection.reason}
                          </p>
                          {rejection.reasons && rejection.reasons.length > 0 && (
                            <ul className="list-disc list-inside space-y-1 text-xs text-red-700 dark:text-red-400">
                              {rejection.reasons.map((r, rIdx) => (
                                <li key={rIdx}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-3 text-red-600 dark:text-red-500">
                      {locale === 'tr' 
                        ? 'Bu fiş normal kullanıcılar için reddedilmiş olurdu, ancak admin modunda analiz için gösteriliyor.'
                        : 'This receipt would be rejected for regular users, but is shown for analysis in admin mode.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Warning for Admin */}
            {isAdmin && receipt.duplicateCheck?.isDuplicate && (
              <div className="border-yellow-500 border-2 bg-yellow-500/10 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-600 mb-2">
                      {locale === 'tr' ? 'Dikkat: Duplicate Fiş' : 'Warning: Duplicate Receipt'}
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        {locale === 'tr' 
                          ? `Bu fiş daha önce yüklenmiş.`
                          : `This receipt was uploaded before.`}
                      </p>
                      <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1">
                        {receipt.duplicateCheck.duplicateType && (
                          <p>
                            <span className="font-medium">
                              {locale === 'tr' ? 'Duplicate Tipi:' : 'Duplicate Type:'}
                            </span> {receipt.duplicateCheck.duplicateType === 'file' 
                              ? (locale === 'tr' ? 'Dosya Hash (Aynı Dosya)' : 'File Hash (Same File)')
                              : receipt.duplicateCheck.duplicateType === 'visual'
                              ? (locale === 'tr' ? 'Görsel Benzerlik' : 'Visual Similarity')
                              : (locale === 'tr' ? 'İçerik Hash (Aynı İçerik)' : 'Content Hash (Same Content)')}
                          </p>
                        )}
                        {receipt.duplicateCheck.matchedReceiptId && (
                          <p>
                            <span className="font-medium">
                              {locale === 'tr' ? 'Eşleşen Fiş ID:' : 'Matched Receipt ID:'}
                            </span> {receipt.duplicateCheck.matchedReceiptId.substring(0, 8)}...
                          </p>
                        )}
                        {receipt.duplicateCheck.duplicateUsername && (
                          <p>
                            <span className="font-medium">
                              {locale === 'tr' ? 'Yükleyen Kullanıcı:' : 'Uploaded By:'}
                            </span> {receipt.duplicateCheck.duplicateUsername}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs mt-3 text-yellow-600 dark:text-yellow-500">
                      {locale === 'tr' 
                        ? 'Bu fiş sadece analiz için gösteriliyor ve kaydedilmeyecek.'
                        : 'This receipt is shown for analysis only and will not be saved.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-muted rounded-lg p-3 flex justify-between items-center">
              <span className="text-muted-foreground">{t.total}</span>
              <span className="text-lg font-bold tabular-nums">{totalPaid.toFixed(2)} {receipt.currency}</span>
            </div>

            {/* Product Value */}
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Gem className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{t.productValue}</p>
                    <p className="text-xs text-muted-foreground">
                      {((productValue / totalPaid) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-accent tabular-nums">
                  {productValue.toFixed(2)} {receipt.currency}
                </span>
              </div>
            </div>

            {/* Cost layers */}
            {Object.entries(groupedItems).map(([bucket, bucketItems]) => {
              const config = bucketConfig[bucket as keyof typeof bucketConfig] || bucketConfig.store;
              const Icon = config.icon;
              const bucketTotal = bucketItems.reduce((sum, item) => sum + item.amount, 0);
              const bucketPercent = (bucketTotal / totalPaid) * 100;
              const isExpanded = expandedBucket === bucket;

              return (
                <div key={bucket}>
                  <div 
                    className={cn(
                      "rounded-lg border cursor-pointer transition-all",
                      config.bg, config.border,
                      isExpanded && "ring-1 ring-primary/30"
                    )}
                    onClick={() => setExpandedBucket(isExpanded ? null : bucket)}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", config.bg)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div>
                          <p className="font-medium">{bucketLabels[bucket] || bucket}</p>
                          <p className={cn("text-xs", config.color)}>{bucketPercent.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold tabular-nums", config.color)}>
                          {bucketTotal.toFixed(2)} {receipt.currency}
                        </span>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2">
                            {bucketItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between p-2 bg-background/50 rounded-lg text-sm">
                                <span className="text-muted-foreground">{item.label}</span>
                                {item.amount > 0 ? (
                                <span className="tabular-nums">{item.amount.toFixed(2)} {receipt.currency}</span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">{locale === 'tr' ? '(satıcı tarafından ödenmiştir)' : '(paid by seller)'}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}

            {/* OCR Output Section */}
            {hasOcrData && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowOcr(!showOcr)}
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {showOcr ? t.hideOcr : t.showOcr}
                  </span>
                  <motion.div animate={{ rotate: showOcr ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </Button>
                
                <AnimatePresence>
                  {showOcr && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-muted rounded-lg p-4 mt-2 max-h-64 overflow-y-auto">
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t.ocrOutput}</h4>
                        {receipt.ocrLines && receipt.ocrLines.length > 0 ? (
                          <div className="space-y-1 font-mono text-xs">
                            {receipt.ocrLines.map((line) => (
                              <div key={line.lineNo} className="flex gap-4 py-0.5">
                                <span className="text-muted-foreground w-8">{line.lineNo}:</span>
                                <span className="break-all">{line.text}</span>
                              </div>
                            ))}
                          </div>
                        ) : receipt.ocrRawText ? (
                          <pre className="text-xs font-mono whitespace-pre-wrap break-words text-muted-foreground">
                            {receipt.ocrRawText}
                          </pre>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onBack} className="flex-1 gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t.back}
              </Button>
              <Button onClick={onContinue} className="flex-1 gap-2">
                {t.continue}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {receipt.id && (
        <FieldCorrectionModal
          open={reportBugOpen}
          onOpenChange={setReportBugOpen}
          receiptId={receipt.id}
        />
      )}
    </div>
  );
}
