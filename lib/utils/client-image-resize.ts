/**
 * Client-side image resize for upload (memory-safe when file is very large).
 * Only used when file size exceeds threshold (crash/upload risk). Uses createImageBitmap
 * resize so decode happens at target size. Parameters tuned to minimize OCR impact.
 */

/** Max long edge; the server already upscales <1800px, 2000 is enough for OCR. */
const DEFAULT_MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.92;

/**
 * Resize an image file for upload. Uses createImageBitmap resize options when
 * available so decode happens at target size (low memory). Returns a new File
 * suitable for FormData. If resize fails (e.g. OOM), throws – caller should show error and abort.
 */
export async function resizeImageForUpload(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION
): Promise<File> {
  if (!file.type.startsWith("image/") || file.size === 0) {
    return file;
  }

  try {
    // createImageBitmap with resize: browser decodes directly to smaller size (memory-safe)
    const opts: ImageBitmapOptions = {
      resizeWidth: maxDimension,
      resizeQuality: "high",
    };
    const bitmap = await createImageBitmap(file, opts);
    const w = bitmap.width;
    const h = bitmap.height;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob) {
      return file;
    }

    const name = file.name.replace(/\.[a-z]+$/i, ".jpg") || "image.jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch (e) {
    throw e;
  }
}
