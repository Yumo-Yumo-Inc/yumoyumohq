"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { ReceiptFlags, OCR } from "@/lib/receipt/types";

interface EvidenceDrawerProps {
  flags: ReceiptFlags;
  ocr: OCR;
}

export function EvidenceDrawer({ flags, ocr }: EvidenceDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between p-0 h-auto"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <CardTitle>Evidence & OCR</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <CardDescription>
          {flags.reasons.length > 0 && (
            <div className="space-y-1 mt-2">
              {flags.reasons.map((reason, i) => (
                <Badge key={i} variant="outline" className="mr-1">
                  {reason}
                </Badge>
              ))}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">OCR Lines</h4>
              <div className="max-h-64 overflow-y-auto space-y-1 text-xs font-mono bg-muted p-3 rounded">
                {ocr.lines.map((line) => (
                  <div key={line.lineNo} className="flex gap-2">
                    <span className="text-muted-foreground w-8">
                      {line.lineNo}:
                    </span>
                    <span>{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Raw Text</h4>
              <div className="max-h-32 overflow-y-auto text-xs font-mono bg-muted p-3 rounded whitespace-pre-wrap">
                {ocr.rawText}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}






