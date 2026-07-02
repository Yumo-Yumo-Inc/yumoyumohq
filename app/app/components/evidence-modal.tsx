"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { ReceiptFlags, OCR } from "@/lib/receipt/types";

interface EvidenceModalProps {
  open: boolean;
  onClose: () => void;
  flags: ReceiptFlags;
  ocr: OCR;
}

export function EvidenceModal({ open, onClose, flags, ocr }: EvidenceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <DialogTitle className="text-2xl">Extraction Evidence & Debug Info</DialogTitle>
          </div>
          <DialogDescription>
            Detailed information about how the receipt data was extracted and processed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          <div className="space-y-6">
            {/* Flags Reasons */}
            {flags.reasons.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Extraction Reasons & Debug Flags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {flags.reasons.map((reason, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="text-xs font-mono px-2 py-1"
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* OCR Lines */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">OCR Lines ({ocr.lines.length} lines)</h3>
              <div className="max-h-64 overflow-y-auto space-y-1 text-xs font-mono bg-muted p-3 rounded border">
                {ocr.lines.map((line) => (
                  <div key={line.lineNo} className="flex gap-2 hover:bg-muted/50 px-1 rounded">
                    <span className="text-muted-foreground w-8 flex-shrink-0">
                      {line.lineNo}:
                    </span>
                    <span className="flex-1">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Text */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Raw OCR Text</h3>
              <div className="max-h-48 overflow-y-auto text-xs font-mono bg-muted p-3 rounded border whitespace-pre-wrap break-words">
                {ocr.rawText}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

