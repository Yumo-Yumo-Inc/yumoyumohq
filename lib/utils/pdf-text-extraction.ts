/**
 * Extract text layer from PDF using pdfjs-dist
 * This is more reliable than OCR for PDFs with embedded text
 */

// Dynamically import pdfjs-dist to avoid browser API issues
let pdfjsLib: any = null;

async function getPdfjsLib() {
  if (!pdfjsLib) {
    // Use dynamic require to avoid ES module issues
    pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    
    // Set up worker for Node.js
    try {
      const { resolve } = require("path");
      const workerPath = resolve(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.js");
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
    } catch (error) {
      // Disable worker if not found (will be slower but should work)
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    }
  }
  return pdfjsLib;
}

export interface PdfTextExtractionResult {
  text: string;
  pages: string[];
  success: boolean;
  error?: string;
}

/**
 * Extract text from PDF buffer
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<PdfTextExtractionResult> {
  try {
    const pdfjs = await getPdfjsLib();
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({
      data: pdfBuffer,
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    const pages: string[] = [];
    let fullText = "";
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      pages.push(pageText);
      fullText += pageText + "\n";
    }
    
    return {
      text: fullText.trim(),
      pages,
      success: true,
    };
  } catch (error: any) {
    console.error("[pdf-text-extraction] Error extracting PDF text:", error);
    return {
      text: "",
      pages: [],
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Calculate reliability score for PDF text extraction
 * Higher score = more reliable for travel receipt extraction
 */
export function calculatePdfTextScore(text: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  // +3: Has "Fiyat Özeti" or "Price Summary"
  if (/(?:fiyat\s*özeti|price\s*summary)/i.test(text)) {
    score += 3;
  }

  // +2: Has "Toplam" or "Total"
  if (/\b(?:toplam|total)\b/i.test(text)) {
    score += 2;
  }

  // +2: Has currency "TL" or "TRY"
  if (/\b(?:TL|TRY)\b/i.test(text)) {
    score += 2;
  }

  // +1: Has >=2 TR money patterns like 1.386,67
  const trMoneyPattern = /[\d]{1,3}(?:\.\d{3})*(?:,\d{2})/g;
  const trMoneyMatches = text.match(trMoneyPattern);
  if (trMoneyMatches && trMoneyMatches.length >= 2) {
    score += 1;
  }

  // +1: Has >=2 labels among [Ücret/Fare, Vergiler ve ücretler/Taxes & fees, Koltuk Seçimi/Seat Selection]
  const labelPatterns = [
    /\b(?:ücret|fare)\b/i,
    /(?:vergi(?:ler)?\s*(?:ve|and)?\s*ücretler?|taxes?\s*(?:and|&)?\s*fees?)/i,
    /(?:koltuk\s*seçimi|seat\s*selection)/i,
  ];
  const labelMatches = labelPatterns.filter(pattern => pattern.test(text));
  if (labelMatches.length >= 2) {
    score += 1;
  }

  // +2 BONUS: Invoice/formal document keywords (e-Arşiv, utility bills, invoices)
  // This helps non-travel receipts (invoices, utility bills) reach acceptable thresholds
  const invoiceKeywords = /\b(?:ettn|vkn|fatura|invoice|kdv|vergi\s*no|tax\s*id|mali\s*cihaz|fiscal|e-arşiv|e-arsiv)\b/i;
  if (invoiceKeywords.test(text)) {
    score += 2;
  }

  return score;
}



