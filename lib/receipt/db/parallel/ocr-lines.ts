/**
 * Save OCR lines in parallel
 * SERVER-ONLY: Do not import in client components
 */

import { sql } from "@/lib/db/client";
import type { OCRLine } from "../../types";

/**
 * Save OCR lines for a receipt
 * Deletes existing lines and batch inserts new ones
 */
export async function saveOcrLines(
  receiptId: string,
  lines: OCRLine[]
): Promise<void> {
  if (!lines || lines.length === 0) {
    return;
  }

  const dbSql = sql;
  if (!dbSql) {
    throw new Error("Database connection not available");
  }

  // Delete existing OCR lines
  await dbSql`DELETE FROM receipt_ocr_lines WHERE receipt_id = ${receiptId}`;

  const receiptIds = lines.map(() => receiptId);
  const lineNos = lines.map((line) => line.lineNo);
  const texts = lines.map((line) => line.text);

  await dbSql`
    INSERT INTO receipt_ocr_lines (receipt_id, line_no, text)
    SELECT *
    FROM UNNEST(
      ${receiptIds}::text[],
      ${lineNos}::int[],
      ${texts}::text[]
    )
  `;
}
