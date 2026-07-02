/**
 * Convert PDF first page to image buffer
 * Uses pdfjs-dist and canvas to render PDF page as PNG
 * Note: This requires Node.js environment with canvas support
 */

import { createCanvas } from "canvas";
import sharp from "sharp";
import { resolve } from "path";

// Dynamically import pdfjs-dist to avoid browser API issues
let pdfjsLib: any = null;

async function getPdfjsLib() {
  if (!pdfjsLib) {
    // Use dynamic require to avoid ES module issues
    pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    
    // Set up worker for Node.js
    try {
      const workerPath = resolve(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.js");
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
    } catch (error) {
      // Disable worker if not found (will be slower but should work)
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    }
  }
  return pdfjsLib;
}

export async function convertPdfFirstPageToImage(
  pdfBuffer: Buffer
): Promise<Buffer> {
  try {
    // Get pdfjs library (lazy load to avoid browser API issues)
    const pdfjs = await getPdfjsLib();
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({
      data: pdfBuffer,
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    
    // Get first page
    const page = await pdfDocument.getPage(1);
    
    // Calculate scale for good quality (3x for better OCR - PDFs need higher resolution)
    const scale = 3.0;
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // Convert canvas to PNG buffer
    const pngBuffer = canvas.toBuffer("image/png");
    
    // Preprocess PDF image for better OCR quality
    // PDFs are usually cleaner than photos, so we can use more aggressive preprocessing
    const preprocessedBuffer = await sharp(pngBuffer)
      // 1. Resize to optimal size for OCR (max 3000px width/height)
      .resize(3000, 4000, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      // 2. Convert to grayscale (better for text recognition)
      .grayscale()
      // 3. Normalize contrast (enhance text visibility - more aggressive for PDFs)
      .normalize()
      // 4. Sharpen text edges (more aggressive for PDFs since they're usually cleaner)
      .sharpen({
        sigma: 2.0,  // Increased from 1.5 for PDFs
        m1: 1.2,     // Increased from 1.0
        m2: 0.6,     // Increased from 0.5
      })
      // 5. Increase brightness slightly
      .modulate({ 
        brightness: 1.08,  // Slightly higher for PDFs
        saturation: 0,     // Already grayscale
      })
      // 6. Output as high-quality JPEG (better compression than PNG for OCR)
      .jpeg({ quality: 95 })
      .toBuffer();
    
    console.log("[convertPdfFirstPageToImage] PDF converted and preprocessed for OCR:", {
      originalSize: pngBuffer.length,
      processedSize: preprocessedBuffer.length,
      scale: scale,
    });
    
    return preprocessedBuffer;
  } catch (error: any) {
    console.error("[pdf-to-image] Error converting PDF to image:", error);
    throw new Error(`Failed to convert PDF to image: ${error.message}`);
  }
}

/**
 * Check if buffer is a PDF file
 */
export function isPdfBuffer(buffer: Buffer): boolean {
  // PDF files start with %PDF
  const header = buffer.slice(0, 4).toString("ascii");
  return header === "%PDF";
}

