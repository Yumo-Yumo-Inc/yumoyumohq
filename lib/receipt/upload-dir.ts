import os from "os";
import path from "path";

/**
 * Single source of truth for where uploaded receipt images live on local disk.
 *
 * Vercel runtime uses /tmp (the only writable path); local development uses an
 * OS-level cache dir outside the project tree so uploads survive `next` rebuilds
 * and are never accidentally committed. The upload route and the image resolver
 * MUST agree on this path, otherwise the resolver looks in the wrong folder and
 * locally-scanned receipts (no Vercel Blob) appear imageless.
 */
export function getReceiptUploadDir(): string {
  const isVercel = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
  if (isVercel) return path.join("/tmp", "uploads");
  return process.env.YUMO_UPLOAD_DIR?.trim() || path.join(os.homedir(), ".yumoyumo-data", "uploads");
}
