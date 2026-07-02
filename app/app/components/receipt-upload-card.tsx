"use client";

import { useCallback, useState } from "react";
import { Upload, FileImage, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeCard } from "@/components/app/theme-card";
import { useAppLocale } from "@/lib/i18n/app-context";

interface ReceiptUploadCardProps {
  onUpload: (file: File) => void;
  uploadedFile?: File | null;
  onRemove?: () => void;
  accountLevel?: number;
}

export function ReceiptUploadCard({
  onUpload,
  uploadedFile,
  onRemove,
  accountLevel = 1,
}: ReceiptUploadCardProps) {
  const { t } = useAppLocale();
  const [isDragging, setIsDragging] = useState(false);
  const level = accountLevel ?? 1;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      const isValidImage = file && file.type.startsWith("image/");
      const isValidPdf = file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
      if (isValidImage || isValidPdf) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  if (uploadedFile) {
    return (
      <ThemeCard accountLevel={level} className="p-4 sm:p-5">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
            {t("upload.card.uploaded")}
          </h3>
          <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
            {t("upload.card.readyToAnalyze")}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <FileImage className="h-12 w-12 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: "var(--app-text-primary)" }}>{uploadedFile.name}</p>
            <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
              {(uploadedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0">
              <X className="h-4 w-4" style={{ color: "var(--app-text-secondary)" }} />
            </Button>
          )}
        </div>
      </ThemeCard>
    );
  }

  return (
    <ThemeCard accountLevel={level} className="p-4 sm:p-5">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
          {t("upload.card.title")}
        </h3>
        <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>
          {t("upload.card.description")}
        </p>
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/10" : "border-[var(--app-border)]"}
        `}
        style={isDragging ? undefined : { background: "var(--app-bg-elevated)" }}
      >
        <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--app-text-muted)" }} />
        <p className="mb-2 font-medium" style={{ color: "var(--app-text-primary)" }}>{t("upload.card.dropHere")}</p>
        <p className="text-sm mb-4" style={{ color: "var(--app-text-muted)" }}>
          {t("upload.card.clickToSelect")}
        </p>
        <Input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="receipt-upload"
        />
        <Button asChild>
          <label htmlFor="receipt-upload" className="cursor-pointer">
            {t("upload.card.browseFiles")}
          </label>
        </Button>
      </div>
    </ThemeCard>
  );
}






