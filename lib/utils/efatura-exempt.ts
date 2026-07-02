/**
 * E-invoice Margin Exemption
 *
 * E-invoices ("e-arşiv fatura" etc.) are exempt from the background/margin rule.
 * E-commerce e-invoices: exempt from margin and photo checks when a shipping
 * date, carrier, cargo marker, etc. appear together with an "e-arşiv fatura" tag.
 *
 * During upload, OCR (Vision API) extracts text from the image to detect e-invoices.
 */

export interface EfaturaExemptParams {
  buffer: Buffer;
  filename?: string;
  mimeType?: string;
}

const NO_BACKGROUND_MARGIN_THRESHOLD = 3;

/** E-arşiv fatura text pattern (variants) */
const E_ARSIV_FATURA = /\b(?:e-arşiv|e-arsiv|e-arxiv)\s*fatura\b/i;

/** İnternet Fatura: presence of this marker means a definite e-invoice (no further detail checked). \b is not used for Turkish İ (JS \w is ASCII-only). */
const INTERNET_FATURA_DEFINITIVE =
  /(?:^|[\s\W])(?:internet|Internet|INTERNET|İnternet|İNTERNET)\s*(?:fatura|Fatura|FATURA)(?=[\s\W]|$)/;

/**
 * ETTN UUID: e-invoice identifier required by GİB.
 * OCR sometimes omits the space/colon between ETTN and the UUID — the pattern
 * tolerates this. Matching the UUID's first two segments (8-4 hex) is enough.
 * Example: "ETTN76ac9d0c-3eb1-...", "ETTN: c9320765-657b-..."
 */
const ETTN_UUID =
  /ettn[:\s]*[0-9a-f]{6,}[-][0-9a-f]{4}/i;

/** E-invoice structural signals: counted as an e-invoice if at least 3 are present (fatura tipi, mersis no, düzenlenme tarihi, e-arşiv fatura, ticaret sicil no) */
const EFATURA_STRUCTURE_SIGNALS = [
  /\bfatura\s*tipi\b/i,
  /\bmersis\s*(?:numarası|numarasi|no)\b/i,
  /\b(?:düzenlenme|duzenlenme|düzenleme|duzenleme)\s*tarihi\b/i,
  /\b(?:e-arşiv|e-arsiv|e-arxiv)\s*fatura\b/i,
  /\bticaret\s*sicil\s*no\b/i,
];
const MIN_STRUCTURE_SIGNATURES = 3;

/** E-commerce e-invoice signals: at least MIN_SIGNATURES required + e-arşiv fatura required */
const ECOMMERCE_SIGNATURES = [
  /\bgönderim\s*tarihi\b/i,
  /\bgönderim\s*zamanı\b/i,
  /\bgönderi\s*taşıyan\b/i,
  /\bgönderi\s*taşiyan\b/i,
  /\btaşıyıcı\s*(?:ünvan|unvan)\b/i,
  /\btaşıyıcı\b/i,
  /\bkargo\b/i,
  /\binternet\s*(?:üzerinden|uzerinden)\s*yapılmıştır\b/i,
  /\binternet\s*(?:üzerinden|uzerinden)\s*yapilmistir\b/i,
  // Actual shipment date (FİİLİ SEVK TARİHİ, fiili sevk tarihi, FIILI SEVK TARIHI)
  /\b(?:fiili|FİİLİ|FIILI)\s*sevk\s*tarih[iIİı]\b/i,
  // İnternet Fatura (positive keyword; boundary used instead of \b for Turkish İ)
  /(?:^|[\s\W])(?:internet|Internet|INTERNET|İnternet|İNTERNET)\s*(?:fatura|Fatura|FATURA)(?=[\s\W]|$)/,
];
const MIN_ECOMMERCE_SIGNATURES = 2;

/** E-invoice signal in the filename (fallback when there is no OCR) */
const FILENAME_EFATURA_HINT = /\b(?:e-arşiv|e-arsiv|e-arxiv|fatura|kargo)\b/i;

/**
 * Is the text structurally an e-invoice? (fatura tipi, mersis no, düzenlenme tarihi, e-arşiv fatura, ticaret sicil no — at least 3)
 */
function isEfaturaByStructure(text: string): boolean {
  if (!text) return false;
  const count = EFATURA_STRUCTURE_SIGNALS.filter((re) => re.test(text)).length;
  return count >= MIN_STRUCTURE_SIGNATURES;
}

/**
 * Is the text an e-invoice? (for margin exemption, template extraction, etc.)
 * 0. Definite e-invoice if İnternet Fatura / INTERNET FATURA / İnternet Fatura etc. is present.
 * 1. ETTN UUID: mandatory GİB e-invoice identifier — definite e-invoice if present.
 * 2. E-Arşiv Fatura tag + FATURA NO: retail e-invoice (BİM, A101, Migros, etc.).
 * 3. Structural e-invoice: fatura tipi, mersis no, düzenlenme tarihi, e-arşiv fatura, ticaret sicil no — at least 3.
 * 4. E-commerce e-invoice: "e-arşiv fatura" + shipping/cargo/actual shipment date etc. — at least 2.
 */
export function isEcommerceEfatura(text: string, _filename?: string): boolean {
  if (!text) return false;

  // 0. Definite e-invoice if the İnternet Fatura group is present
  if (INTERNET_FATURA_DEFINITIVE.test(text)) return true;

  // 1. ETTN UUID — mandatory GİB identifier, definite e-invoice
  if (ETTN_UUID.test(text)) return true;

  // 2. "E-Arsiv Fatura" / "E-Arşiv Fatura" tag + FATURA NO — retail e-invoice
  if (E_ARSIV_FATURA.test(text) && /\bfatura\s*no\b/i.test(text)) return true;

  // 3. Structural criterion: at least 3 markers (B2B e-invoice)
  if (isEfaturaByStructure(text)) return true;

  // 4. E-commerce criterion: e-arşiv fatura + shipping/cargo/actual shipment date, etc.
  if (!E_ARSIV_FATURA.test(text)) return false;
  const signatureCount = ECOMMERCE_SIGNATURES.filter((re) => re.test(text)).length;
  return signatureCount >= MIN_ECOMMERCE_SIGNATURES;
}

/**
 * Is this likely an e-invoice based on filename alone? (fallback when there is no OCR)
 */
export function filenameSuggestsEfatura(filename: string): boolean {
  return FILENAME_EFATURA_HINT.test(filename);
}

/**
 * Single Vision OCR call for the image buffer during upload; returns the extracted text.
 * Returns an empty string if there is no API key or an error occurs.
 */
export async function runQuickOcrForExempt(imageBuffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return "";

  const base64 = imageBuffer.toString("base64");
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate`;

  try {
    const response = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
          imageContext: { languageHints: ["tr", "en"] },
        }],
      }),
    });

    if (!response.ok) return "";

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations || [];
    const fullText = textAnnotations[0]?.description || "";
    return typeof fullText === "string" ? fullText : "";
  } catch {
    return "";
  }
}

/**
 * Considered "no background" when all margin values are below this threshold.
 */
export function getNoBackgroundMarginThreshold(): number {
  return NO_BACKGROUND_MARGIN_THRESHOLD;
}

/**
 * Is this file an e-invoice? E-invoices are exempt from the margin (background) rule.
 * - PDF: always exempt.
 * - Image: text is extracted via Vision OCR; true if isEcommerceEfatura(text). Falls
 *   back to the filename if OCR is empty/fails.
 */
export async function isEfaturaExemptForMarginCheck(
  params: EfaturaExemptParams
): Promise<boolean> {
  const { buffer, filename, mimeType } = params;

  if (mimeType === "application/pdf") {
    return true;
  }

  const ocrText = await runQuickOcrForExempt(buffer);
  if (ocrText && isEcommerceEfatura(ocrText, filename)) return true;

  // Falls back to the filename when there is no OCR or the text doesn't meet the e-invoice criteria
  if (filename && filenameSuggestsEfatura(filename)) return true;

  return false;
}
