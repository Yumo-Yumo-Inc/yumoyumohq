/**
 * Quality Issues Modal
 * Displays image quality issues and suggestions
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ImageQualityIssue } from "@/lib/utils/image-quality-check";
import { useAppLocale } from "@/lib/i18n/app-context";

interface QualityIssuesModalProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  issues: ImageQualityIssue[];
  locale?: string;
}

export function QualityIssuesModal({
  open,
  onClose,
  onRetry,
  issues,
  locale
}: QualityIssuesModalProps) {
  const { locale: appLocale } = useAppLocale();
  const errorIssues = issues.filter(i => i.severity === 'error');
  const warningIssues = issues.filter(i => i.severity === 'warning');

  const texts = {
    tr: {
      title: 'Fotoğraf Kalitesi Yetersiz',
      description: 'Lütfen aşağıdaki sorunları düzeltip tekrar deneyiniz:',
      cancel: 'İptal',
      retry: 'Yeniden Dene',
      errors: 'Hatalar',
      warnings: 'Uyarılar'
    },
    en: {
      title: 'Photo Quality Insufficient',
      description: 'Please fix the following issues and try again:',
      cancel: 'Cancel',
      retry: 'Retry',
      errors: 'Errors',
      warnings: 'Warnings'
    }
  };

  const activeLocale = locale ?? appLocale;
  const t = texts[activeLocale === "tr" ? "tr" : "en"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {errorIssues.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-red-600 dark:text-red-400">
                {t.errors} ({errorIssues.length})
              </h4>
              <div className="space-y-2">
                {errorIssues.map((issue, i) => (
                  <div key={i} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="font-medium text-sm text-red-900 dark:text-red-100">
                      {issue.message}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {warningIssues.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-yellow-600 dark:text-yellow-400">
                {t.warnings} ({warningIssues.length})
              </h4>
              <div className="space-y-2">
                {warningIssues.map((issue, i) => (
                  <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                      {issue.message}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      {issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button onClick={onRetry}>
              {t.retry}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
