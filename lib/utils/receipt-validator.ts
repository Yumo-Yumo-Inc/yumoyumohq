/**
 * Receipt Margin Validator
 * 
 * Validates that receipt images have sufficient background margins on all 4 sides.
 * Uses dynamic threshold based on background brightness.
 */

import sharp from 'sharp';

const LOG_PREFIX = '[receipt-validator]';

export interface EdgeMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MarginValidationResult {
  valid: boolean;
  margins: EdgeMargins;
  reason?: string;
  croppedBuffer?: Buffer;
  violations?: string[]; // Detailed violation list (e.g., ["top=54px < 80px", "right=1px < 45px"])
  minRequired?: {
    vertical: number;
    horizontal: number;
  };
}

/**
 * Check if receipt has sufficient background margin on all 4 sides
 */
export async function validateReceiptMargins(imageBuffer: Buffer): Promise<MarginValidationResult> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;
    
    if (!width || !height) {
      return {
        valid: false,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        reason: 'Could not read image dimensions'
      };
    }
    
    // 1. Edge detection to find receipt boundaries
    const edges = await detectReceiptEdges(imageBuffer);
    
    if (!edges.found) {
      console.log(`${LOG_PREFIX} Margin check: REJECTED — Could not detect receipt boundaries (see boundary detection log above)`);
      return {
        valid: false,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        reason: 'Could not detect receipt boundaries'
      };
    }
    
    // 2. Calculate margins
    const margins: EdgeMargins = {
      top: edges.top,
      bottom: height - edges.bottom,
      left: edges.left,
      right: width - edges.right,
    };
    
    // 3. Minimum margin requirement (4px — very permissive)
    const minVerticalMargin = 4;
    const minHorizontalMargin = 4;
    
    // 4. Check all 4 sides - collect all violations
    const violations: string[] = [];
    const userFacingReason = 'Please center the receipt in the photo and leave a small margin around the edges.';
    
    if (margins.top < minVerticalMargin) {
      violations.push(`top=${margins.top}px < ${minVerticalMargin.toFixed(0)}px`);
    }
    if (margins.bottom < minVerticalMargin) {
      violations.push(`bottom=${margins.bottom}px < ${minVerticalMargin.toFixed(0)}px`);
    }
    if (margins.left < minHorizontalMargin) {
      violations.push(`left=${margins.left}px < ${minHorizontalMargin.toFixed(0)}px`);
    }
    if (margins.right < minHorizontalMargin) {
      violations.push(`right=${margins.right}px < ${minHorizontalMargin.toFixed(0)}px`);
    }
    
    if (violations.length > 0) {
      console.log(
        `${LOG_PREFIX} Margin check: REJECTED — ${violations.length} violation(s): ${violations.join(', ')} | margins: top=${margins.top}, bottom=${margins.bottom}, left=${margins.left}, right=${margins.right}`
      );
      return {
        valid: false,
        margins,
        reason: userFacingReason,
        violations, // Detailed violation list for admin breakdown
        minRequired: {
          vertical: minVerticalMargin,
          horizontal: minHorizontalMargin
        }
      };
    }
    
    // All margins OK - auto-crop receipt
    const receiptWidth = edges.right - edges.left;
    const receiptHeight = edges.bottom - edges.top;
    
    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: edges.left,
        top: edges.top,
        width: receiptWidth,
        height: receiptHeight,
      })
      .toBuffer();
    
    console.log(
      `${LOG_PREFIX} Margin check: ACCEPTED | image=${width}x${height} | margins: top=${margins.top}, bottom=${margins.bottom}, left=${margins.left}, right=${margins.right} | receipt=${receiptWidth}x${receiptHeight}px`
    );
    
    return { 
      valid: true, 
      margins,
      croppedBuffer
    };
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error validating margins:`, error);
    return {
      valid: false,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      reason: `Validation error: ${error?.message || 'Unknown error'}`
    };
  }
}

/**
 * Legacy edge detection: threshold-based, dark/light mode.
 * Kept as fallback when transition-based detection fails or yields invalid size.
 */
function detectEdgesLegacy(
  data: Buffer,
  width: number,
  height: number,
  backgroundBrightness: number,
  minWidthPx: number,
  minHeightPx: number
): { top: number; bottom: number; left: number; right: number; mode: string } {
  const runPass = (receiptBrighterThanBg: boolean): { top: number; bottom: number; left: number; right: number } => {
    const threshold = receiptBrighterThanBg ? backgroundBrightness + 30 : Math.max(0, backgroundBrightness - 30);
    const isReceipt = (val: number) => receiptBrighterThanBg ? val > threshold : val < threshold;

    let top = 0;
    let bottom = height - 1;
    let left = 0;
    let right = width - 1;

    for (let y = 0; y < height; y++) {
      if (isReceipt(getRowAverageBrightness(data, width, y))) {
        top = y;
        break;
      }
    }
    for (let y = height - 1; y >= 0; y--) {
      if (isReceipt(getRowAverageBrightness(data, width, y))) {
        bottom = y;
        break;
      }
    }
    const minRun = 5;
    for (let x = 0; x <= width - minRun; x++) {
      let run = 0;
      while (run < minRun && x + run < width && isReceipt(getColumnAverageBrightness(data, width, height, x + run))) run++;
      if (run >= minRun) {
        left = x;
        break;
      }
    }
    for (let x = width - 1; x >= minRun - 1; x--) {
      let run = 0;
      while (run < minRun && x - run >= 0 && isReceipt(getColumnAverageBrightness(data, width, height, x - run))) run++;
      if (run >= minRun) {
        right = x;
        break;
      }
    }
    return { top, bottom, left, right };
  };

  let { top, bottom, left, right } = runPass(true);
  let receiptWidth = right - left;
  let receiptHeight = bottom - top;
  let mode = "dark";

  if (receiptWidth < minWidthPx || receiptHeight < minHeightPx) {
    const lightResult = runPass(false);
    const lw = lightResult.right - lightResult.left;
    const lh = lightResult.bottom - lightResult.top;
    if (lw >= minWidthPx && lh >= minHeightPx) {
      top = lightResult.top;
      bottom = lightResult.bottom;
      left = lightResult.left;
      right = lightResult.right;
      receiptWidth = lw;
      receiptHeight = lh;
      mode = "light";
    }
  }
  return { top, bottom, left, right, mode };
}

/**
 * Detect receipt edges: try transition-based (median + corner diff) first; fallback to legacy threshold.
 * Margin check and 4px minimum are unchanged; only the edge detection method is switched.
 */
async function detectReceiptEdges(imageBuffer: Buffer): Promise<{
  found: boolean;
  top: number;
  bottom: number;
  left: number;
  right: number;
}> {
  try {
    const image = sharp(imageBuffer);
    const { data, info } = await image
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    if (!width || !height) {
      console.warn(`${LOG_PREFIX} Edge detection skipped: no dimensions`);
      return { found: false, top: 0, bottom: 0, left: 0, right: 0 };
    }

    const backgroundBrightness = calculateBackgroundBrightness(data, width, height);
    const minWidthPx = width * 0.15;
    const minHeightPx = height * 0.15;

    // 1) Try transition-based first unless legacy-only is requested (backup/revert)
    const useLegacyOnly =
      process.env.USE_LEGACY_RECEIPT_EDGE_DETECTION === "true" || process.env.USE_LEGACY_RECEIPT_EDGE_DETECTION === "1";

    const transition = detectEdgesTransitionBased(data, width, height, backgroundBrightness);
    const tw = transition.right - transition.left;
    const th = transition.bottom - transition.top;
    const transitionValid =
      !useLegacyOnly &&
      transition.top <= transition.bottom &&
      transition.left <= transition.right &&
      tw >= minWidthPx &&
      th >= minHeightPx;

    let top: number;
    let bottom: number;
    let left: number;
    let right: number;
    let method: "transition" | "legacy";

    if (transitionValid) {
      top = transition.top;
      bottom = transition.bottom;
      left = transition.left;
      right = transition.right;
      method = "transition";
    } else {
      const legacy = detectEdgesLegacy(data, width, height, backgroundBrightness, minWidthPx, minHeightPx);
      top = legacy.top;
      bottom = legacy.bottom;
      left = legacy.left;
      right = legacy.right;
      method = "legacy";
    }

    const receiptWidth = right - left;
    const receiptHeight = bottom - top;
    const widthPct = width > 0 ? (receiptWidth / width) * 100 : 0;
    const heightPct = height > 0 ? (receiptHeight / height) * 100 : 0;
    const widthOk = receiptWidth >= minWidthPx;
    const heightOk = receiptHeight >= minHeightPx;
    const found = widthOk && heightOk;

    let failReason: string | null = null;
    if (!widthOk && !heightOk) failReason = "Width and height too small";
    else if (!widthOk) failReason = "Width too small";
    else if (!heightOk) failReason = "Height too small";

    console.log(
      `${LOG_PREFIX} Boundary detection: ` +
        `image=${width}x${height} | ` +
        `backgroundBrightness=${backgroundBrightness.toFixed(2)} (4 corners) | ` +
        `method=${method} | ` +
        `edges={ top=${top}, bottom=${bottom}, left=${left}, right=${right} } | ` +
        `receipt=${receiptWidth}x${receiptHeight}px | ` +
        `width=${widthPct.toFixed(1)}% (min 15%, ${widthOk ? "OK" : "FAIL"}) | ` +
        `height=${heightPct.toFixed(1)}% (min 15%, ${heightOk ? "OK" : "FAIL"}) | ` +
        (found ? "result=ACCEPTED" : `result=REJECTED (${failReason})`)
    );

    if (!found) {
      return { found: false, top: 0, bottom: 0, left: 0, right: 0 };
    }
    return { found: true, top, bottom, left, right };
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error detecting edges:`, error);
    return { found: false, top: 0, bottom: 0, left: 0, right: 0 };
  }
}

/**
 * Sample a rectangular region (top-left corner at ox,oy with size w x h) and return average brightness.
 */
function sampleRegionBrightness(data: Buffer, width: number, height: number, ox: number, oy: number, w: number, h: number): number {
  let sum = 0;
  let count = 0;
  for (let y = oy; y < Math.min(oy + h, height); y++) {
    for (let x = ox; x < Math.min(ox + w, width); x++) {
      sum += data[y * width + x];
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Calculate background brightness from all four corners so rotation/centering doesn't bias the threshold.
 * (Previously only first+last 10 rows were used, so receipt at top/bottom could be misread as background.)
 */
function calculateBackgroundBrightness(data: Buffer, width: number, height: number): number {
  const cornerSize = 25;
  const corners = [
    sampleRegionBrightness(data, width, height, 0, 0, cornerSize, cornerSize),
    sampleRegionBrightness(data, width, height, width - cornerSize, 0, cornerSize, cornerSize),
    sampleRegionBrightness(data, width, height, 0, height - cornerSize, cornerSize, cornerSize),
    sampleRegionBrightness(data, width, height, width - cornerSize, height - cornerSize, cornerSize, cornerSize),
  ].filter((n) => n > 0);
  const avg = corners.length > 0 ? corners.reduce((a, b) => a + b, 0) / corners.length : 0;
  return avg > 0 ? avg : 150;
}

function getRowAverageBrightness(data: Buffer, width: number, y: number): number {
  let sum = 0;
  for (let x = 0; x < width; x++) {
    sum += data[y * width + x];
  }
  return sum / width;
}

function getColumnAverageBrightness(data: Buffer, width: number, height: number, x: number): number {
  let sum = 0;
  for (let y = 0; y < height; y++) {
    sum += data[y * width + x];
  }
  return sum / height;
}

/**
 * Row median brightness (robust to text/dark lines).
 */
function getRowMedianBrightness(data: Buffer, width: number, y: number): number {
  const row = new Uint8Array(width);
  for (let x = 0; x < width; x++) row[x] = data[y * width + x];
  row.sort((a, b) => a - b);
  const mid = width >> 1;
  return width % 2 ? row[mid] : (row[mid - 1] + row[mid]) / 2;
}

/**
 * Column median brightness (robust to text/dark lines).
 */
function getColumnMedianBrightness(data: Buffer, width: number, height: number, x: number): number {
  const col = new Uint8Array(height);
  for (let y = 0; y < height; y++) col[y] = data[y * width + x];
  col.sort((a, b) => a - b);
  const mid = height >> 1;
  return height % 2 ? col[mid] : (col[mid - 1] + col[mid]) / 2;
}

/** Delta for "meaningfully different from background" (0–255). */
const TRANSITION_DELTA = 20;

/**
 * Transition-based edge detection: first row/column where brightness differs from corner (background).
 * Uses median per row/column to be robust to text. No light/dark mode; works for both.
 * Returns edges; caller must check validity (min size, top<=bottom, left<=right).
 */
function detectEdgesTransitionBased(
  data: Buffer,
  width: number,
  height: number,
  backgroundBrightness: number
): { top: number; bottom: number; left: number; right: number } {
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  for (let y = 0; y < height; y++) {
    const v = getRowMedianBrightness(data, width, y);
    if (Math.abs(v - backgroundBrightness) > TRANSITION_DELTA) {
      top = y;
      break;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    const v = getRowMedianBrightness(data, width, y);
    if (Math.abs(v - backgroundBrightness) > TRANSITION_DELTA) {
      bottom = y;
      break;
    }
  }
  for (let x = 0; x < width; x++) {
    const v = getColumnMedianBrightness(data, width, height, x);
    if (Math.abs(v - backgroundBrightness) > TRANSITION_DELTA) {
      left = x;
      break;
    }
  }
  for (let x = width - 1; x >= 0; x--) {
    const v = getColumnMedianBrightness(data, width, height, x);
    if (Math.abs(v - backgroundBrightness) > TRANSITION_DELTA) {
      right = x;
      break;
    }
  }
  return { top, bottom, left, right };
}
