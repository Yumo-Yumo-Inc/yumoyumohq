/**
 * Receipt image orientation — EXIF-based auto-rotation only.
 *
 * PREVIOUS APPROACH (removed): trying 0/90/180/270 with horizontal projection
 * variance and picking the highest score. This algorithm rotated some receipts
 * in the WRONG direction — especially receipts with a plain background or
 * blur. Result: Gemini saw an upside-down image and misread the date/number/
 * merchant (e.g. BİM Bornova 180°, A101 90°).
 *
 * Official Google AI guidance (forum, July 2025): "API does not auto-handle EXIF
 * rotation metadata. Pre-process images to ensure correct orientation."
 *
 * Calling Sharp's .rotate() with no arguments rotates according to the EXIF
 * Orientation tag and clears the metadata. The EXIF tag is correct on 99% of
 * receipts from mobile cameras — that is already sufficient. The heuristic
 * algorithm was breaking this.
 */

import sharp from "sharp";

/**
 * Rotates the buffer to the correct orientation based on the EXIF orientation tag.
 * Returns the original buffer if no rotation is needed.
 */
export async function autoOrientReceiptBuffer(buffer: Buffer): Promise<{
  buffer: Buffer;
  rotationApplied: number;
}> {
  try {
    const meta = await sharp(buffer).metadata();
    const exifOrientation = meta.orientation ?? 1;

    // EXIF orientation 1 = upright (no rotation needed).
    if (exifOrientation === 1) {
      return { buffer, rotationApplied: 0 };
    }

    const rotated = await sharp(buffer).rotate().toBuffer();
    console.log(
      `[autoOrientReceipt] Applied EXIF rotation (orientation tag=${exifOrientation})`
    );
    return { buffer: rotated, rotationApplied: exifOrientation };
  } catch (error) {
    console.warn(
      "[autoOrientReceipt] EXIF orientation failed, using original:",
      error instanceof Error ? error.message : error
    );
    return { buffer, rotationApplied: 0 };
  }
}

/**
 * Color JPEG for Vision LLM — oriented, capped at maxPx, no grayscale pass.
 */
export async function prepareVisionImageBuffer(
  buffer: Buffer,
  maxPx = 1600,
  quality = 92
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(maxPx, maxPx, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
}
