/**
 * Synthetic Receipt Generator
 * Generates a receipt image with specified data
 * Client-side compatible (uses SVG + Canvas)
 */

export interface SyntheticReceiptData {
  merchantName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM format (optional)
  category: string;
  total: number;
  vat?: number;
  currency: string; // "THB", "TRY", "USD"
  receiptNumber?: string; // Receipt number for blockchain
}

/**
 * Generate synthetic receipt for mock upload (client-side compatible)
 * Returns a Blob that can be used as File
 */
export async function generateSyntheticReceiptBlob(data: SyntheticReceiptData): Promise<Blob> {
  // Format date
  const dateObj = new Date(data.date);
  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Calculate subtotal
  const subtotal = data.vat ? (data.total - data.vat).toFixed(2) : data.total.toFixed(2);
  
  // Create SVG receipt
  const svg = `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="400" height="600" fill="#FFFFFF"/>
      
      <!-- Receipt Number (top right) -->
      ${data.receiptNumber ? `
      <text x="380" y="25" font-family="Arial, sans-serif" font-size="10" text-anchor="end" fill="#666666">#${escapeXml(data.receiptNumber)}</text>
      ` : ''}
      
      <!-- Header -->
      <text x="200" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#000000">${escapeXml(data.merchantName)}</text>
      
      <!-- Date and Time -->
      <text x="20" y="70" font-family="Arial, sans-serif" font-size="14" fill="#000000">Date: ${formattedDate}${data.time && data.time.trim() ? ` ${escapeXml(data.time.trim())}` : ''}</text>
      
      <!-- Category -->
      <text x="20" y="95" font-family="Arial, sans-serif" font-size="14" fill="#000000">Category: ${escapeXml(data.category)}</text>
      
      <!-- Divider -->
      <line x1="20" y1="110" x2="380" y2="110" stroke="#CCCCCC" stroke-width="1"/>
      
      <!-- Divider (items removed) -->
      <line x1="20" y1="210" x2="380" y2="210" stroke="#CCCCCC" stroke-width="1"/>
      
      <!-- Subtotal -->
      <text x="20" y="240" font-family="Arial, sans-serif" font-size="14" fill="#000000">Subtotal:</text>
      <text x="380" y="240" font-family="Arial, sans-serif" font-size="14" text-anchor="end" fill="#000000">${subtotal} ${data.currency}</text>
      
      <!-- VAT -->
      ${data.vat && data.vat > 0 ? `
      <text x="20" y="265" font-family="Arial, sans-serif" font-size="14" fill="#000000">VAT:</text>
      <text x="380" y="265" font-family="Arial, sans-serif" font-size="14" text-anchor="end" fill="#000000">${data.vat.toFixed(2)} ${data.currency}</text>
      ` : ''}
      
      <!-- Total -->
      <text x="20" y="300" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#000000">TOTAL:</text>
      <text x="380" y="300" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="end" fill="#000000">${data.total.toFixed(2)} ${data.currency}</text>
      
      <!-- Footer -->
      <text x="200" y="350" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666666">Thank you for your purchase!</text>
      <text x="200" y="370" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666666">Powered by Yumo</text>
    </svg>
  `.trim();

  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  
  // Convert SVG to PNG using canvas (client-side)
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      // Server-side: return SVG blob as-is
      resolve(svgBlob);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 400, 600);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob || svgBlob);
        }, "image/png");
      } else {
        URL.revokeObjectURL(url);
        resolve(svgBlob);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(svgBlob);
    };
    img.src = url;
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

