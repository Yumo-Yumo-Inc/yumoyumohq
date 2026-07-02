'use client';

/**
 * Client-side image resize before upload.
 *
 * Strategy:
 *  - Only resizes images that exceed RESIZE_THRESHOLD_BYTES (1.5 MB).
 *  - Scales down so the longest dimension is at most MAX_DIM (1920 px).
 *  - Exports as JPEG at JPEG_QUALITY (0.82) — good OCR quality, ~300-700 KB output.
 *  - If the image is already small enough, the original File is returned unchanged.
 *
 * Main-thread discipline (why the fast path exists):
 *  - The legacy `<img>.onload` + `drawImage` + `canvas.toBlob` path decodes and
 *    JPEG-encodes a multi-megapixel image SYNCHRONOUSLY on the main thread. That
 *    blocks for ~0.5-1.5s on a phone — and since it runs while the scan story is
 *    on screen, it freezes the progress bars (requestAnimationFrame is starved
 *    while the main thread is busy).
 *  - The fast path moves the work off the main thread: `createImageBitmap`
 *    decodes on an internal thread, and `OffscreenCanvas.convertToBlob` encodes
 *    asynchronously. Only the downscale `drawImage` of an already-decoded bitmap
 *    runs on the main thread, which is fast and GPU-assisted — the bars stay
 *    smooth. The legacy path remains as a fallback for older browsers.
 *
 * Memory note:
 *  - Peak heap ≈ (source pixels × 4 bytes). 12 MP → ~48 MB (safe); 50 MP → ~200 MB
 *    (borderline); 200 MP will OOM — the caller must catch the rejection.
 */

const MAX_DIM = 1920;
const JPEG_QUALITY = 0.82;
const RESIZE_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

/** True when the off-main-thread decode + encode primitives are available. */
function canUseFastPath(): boolean {
  return (
    typeof createImageBitmap === 'function' &&
    typeof OffscreenCanvas !== 'undefined'
  );
}

/**
 * Off-main-thread resize: decode via createImageBitmap, encode via
 * OffscreenCanvas.convertToBlob. Keeps the main thread free so the scan-story
 * progress bars never freeze. Rejects on OOM or unsupported operations.
 */
async function resizeFast(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file); // decode off the main thread
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    const scale = Math.min(1, MAX_DIM / Math.max(w, h));
    if (scale >= 1) return file; // already fits — skip re-encode loss

    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);

    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
    const resizedName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], resizedName, { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

/**
 * Legacy resize (older browsers without createImageBitmap/OffscreenCanvas).
 * Decode + encode run on the main thread, so this can briefly block — used only
 * as a fallback.
 */
async function resizeLegacy(file: File): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_DIM / Math.max(w, h));

      if (scale >= 1) {
        resolve(file);
        return;
      }

      const targetW = Math.round(w * scale);
      const targetH = Math.round(h * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2d context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('canvas.toBlob returned null'));
            return;
          }
          const resizedName = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], resizedName, { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for resize'));
    };

    img.src = url;
  });
}

/**
 * Returns a resized File if the source exceeds the threshold, or the original
 * File if it is already small enough. Prefers the off-main-thread fast path and
 * falls back to the legacy path on older browsers. Rejects on canvas errors or
 * OOM — the caller must handle the rejection.
 */
export async function resizeImageIfNeeded(file: File): Promise<File> {
  if (file.size <= RESIZE_THRESHOLD_BYTES) return file;
  if (!file.type.startsWith('image/')) return file;

  if (canUseFastPath()) {
    try {
      return await resizeFast(file);
    } catch (err) {
      console.warn('[resize] fast path failed, falling back to legacy:', err);
    }
  }
  return resizeLegacy(file);
}
