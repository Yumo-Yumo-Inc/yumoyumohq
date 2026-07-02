import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { DateExtraction, TimeExtraction } from "@/lib/receipt/types";
import { extractDate } from "@/lib/receipt/ocr/extract-date";
import { extractTime } from "@/lib/receipt/ocr/extract-time";
import { TH_CONFIG } from "../TH.config";

export function extractThaiDate(context: ReceiptContext): DateExtraction {
  return extractDate(context.ocrLines, TH_CONFIG);
}

export function extractThaiTime(
  context: ReceiptContext,
  dateExtraction: DateExtraction
): TimeExtraction {
  const dateLineIndex =
    dateExtraction.sourceLine != null
      ? context.ocrLines.findIndex((line) => line.lineNo === dateExtraction.sourceLine)
      : undefined;

  return extractTime(
    context.ocrLines,
    TH_CONFIG,
    typeof dateLineIndex === "number" && dateLineIndex >= 0 ? dateLineIndex : undefined,
    dateExtraction.confidence > 0.3 ? dateExtraction.value : undefined
  );
}
