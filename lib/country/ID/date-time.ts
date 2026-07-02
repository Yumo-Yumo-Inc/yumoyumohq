import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { DateExtraction, TimeExtraction } from "@/lib/receipt/types";
import { extractDate } from "@/lib/receipt/ocr/extract-date";
import { extractTime } from "@/lib/receipt/ocr/extract-time";
import { ID_CONFIG } from "../ID.config";

export function extractIndonesianDate(context: ReceiptContext): DateExtraction {
  return extractDate(context.ocrLines, ID_CONFIG);
}

export function extractIndonesianTime(
  context: ReceiptContext,
  dateExtraction: DateExtraction
): TimeExtraction {
  const dateLineIndex =
    dateExtraction.sourceLine != null
      ? context.ocrLines.findIndex((line) => line.lineNo === dateExtraction.sourceLine)
      : undefined;

  return extractTime(
    context.ocrLines,
    ID_CONFIG,
    typeof dateLineIndex === "number" && dateLineIndex >= 0 ? dateLineIndex : undefined,
    dateExtraction.confidence > 0.3 ? dateExtraction.value : undefined
  );
}
