"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileImage, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoGuidelines } from "./photo-guidelines";

interface MiningPortalProps {
  onFileSelect: (file: File) => void;
  className?: string;
  locale?: string;
}

export function MiningPortal({
  onFileSelect,
  className,
  locale = "en",
}: MiningPortalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const isValidImage = file && file.type.startsWith("image/");
      const isValidPdf = file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
      if (isValidImage || isValidPdf) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const texts = {
    tr: {
      title: "Fiş Yükle",
      dropHere: "Fişinizi buraya bırakın",
      orClick: "veya tıklayarak seçin",
      tagline: "Her fişte gizli maliyetler yatar",
      privacy: "Gizlilik Notu",
      privacyDesc: "Fişleriniz analiz edildikten sonra anonimleştirilir. Kişisel verileriniz asla paylaşılmaz.",
    },
    en: {
      title: "Upload Receipt",
      dropHere: "Drop your receipt here",
      orClick: "or click to browse",
      tagline: "Hidden costs lie in every receipt",
      privacy: "Privacy Note",
      privacyDesc: "Your receipts are anonymized after analysis. Personal data is never shared.",
    }
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Photo Guidelines */}
      <PhotoGuidelines locale={locale} />

      <Card className="card-cinematic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/10" 
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20 flex-shrink-0">
                  <FileImage className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    onFileSelect(new File([], ""));
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <motion.div 
                  className="p-4 rounded-full bg-primary/10 mb-4"
                  animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload className="h-8 w-8 text-primary" />
                </motion.div>
                <p className="font-semibold text-lg mb-1">{t.dropHere}</p>
                <p className="text-muted-foreground mb-4">{t.orClick}</p>
                
                <div className="flex items-center gap-2 text-primary/80">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm">{t.tagline}</p>
                  <Sparkles className="h-4 w-4" />
                </div>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Privacy note */}
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">{t.privacy}</p>
            <p>{t.privacyDesc}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
