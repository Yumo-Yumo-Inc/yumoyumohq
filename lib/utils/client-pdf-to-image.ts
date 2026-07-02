'use client'

/**
 * Convert PDF to image on client-side (browser)
 * Uses pdfjs-dist to render PDF first page as PNG
 */

export async function convertPdfToImageClient(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Load pdfjs-dist dynamically
    import("pdfjs-dist").then((pdfjsLib) => {
      // Self-hosted worker (same origin) — CDN is blocked by CSP on production.
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.js",
        import.meta.url,
      ).toString();

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          if (!arrayBuffer) {
            reject(new Error("Failed to read PDF file"));
            return;
          }
          
          // Load PDF
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          // Get first page
          const page = await pdf.getPage(1);
          // Cap canvas dimensions to avoid tab crash on memory-constrained mobile devices.
          // A4 at 1.5x = ~893×1264px (≈4MB canvas), safely under browser limits.
          const MAX_DIM = 2048;
          const baseViewport = page.getViewport({ scale: 1.0 });
          const scale = Math.min(1.5, MAX_DIM / Math.max(baseViewport.width, baseViewport.height));
          const viewport = page.getViewport({ scale });

          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          
          if (!context) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          
          // Render PDF to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Failed to convert canvas to blob"));
              return;
            }
            
            // Create File from blob
            const imageFile = new File(
              [blob],
              file.name.replace(/\.pdf$/i, ".png"),
              { type: "image/png" }
            );
            
            resolve(imageFile);
          }, "image/png", 0.9);
        } catch (error: any) {
          reject(new Error(`Failed to convert PDF: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read PDF file"));
      reader.readAsArrayBuffer(file);
    }).catch((error) => {
      reject(new Error(`Failed to load PDF library: ${error.message}`));
    });
  });
}





