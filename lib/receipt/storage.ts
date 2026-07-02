/**
 * Simple file-based storage for receipts
 * Uses JSON file in .data/db.json
 * On Vercel (read-only filesystem), uses in-memory storage as fallback
 */

import { promises as fs } from "fs";
import path from "path";
import type { ReceiptAnalysis, ReceiptStorage } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// In-memory storage for Vercel (read-only filesystem)
// Note: This is temporary - data will be lost on server restart
// For production, use Vercel KV, Postgres, or another database
let memoryStorage: ReceiptStorage = { receipts: [] };

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function readDB(): Promise<ReceiptStorage> {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  
  // On Vercel, use memory storage
  if (isVercel) {
    return memoryStorage;
  }
  
  await ensureDataDir();
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, return empty structure
    return { receipts: [] };
  }
}

async function writeDB(data: ReceiptStorage): Promise<void> {
  // Check if running on Vercel (read-only filesystem)
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
  
  if (isVercel) {
    // On Vercel, filesystem is read-only - use in-memory storage
    console.log("[storage] Vercel detected - using in-memory storage. Receipt count:", data.receipts.length);
    memoryStorage = data;
    // Note: This is temporary - data will be lost on server restart
    // For production, use Vercel KV, Postgres, or another database
    return;
  }
  
  await ensureDataDir();
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error: any) {
    console.error("[storage] Failed to write to db.json:", error);
    // If it's a permission error, it's likely Vercel - fallback to memory
    if (error.code === "EACCES" || error.code === "EROFS") {
      console.warn("[storage] Read-only filesystem detected (likely Vercel). Using in-memory storage as fallback.");
      memoryStorage = data;
      return; // Don't throw, allow API to return success
    }
    throw error;
  }
}

export async function getAllReceipts(): Promise<ReceiptAnalysis[]> {
  const db = await readDB();
  return db.receipts;
}

export async function getReceiptById(
  receiptId: string
): Promise<ReceiptAnalysis | null> {
  const db = await readDB();
  return db.receipts.find((r) => r.receiptId === receiptId) || null;
}

export async function saveReceipt(
  receipt: ReceiptAnalysis
): Promise<ReceiptAnalysis> {
  const db = await readDB();
  const index = db.receipts.findIndex((r) => r.receiptId === receipt.receiptId);
  
  if (index >= 0) {
    db.receipts[index] = receipt;
  } else {
    db.receipts.push(receipt);
  }
  
  await writeDB(db);
  return receipt;
}

export async function deleteReceipt(receiptId: string): Promise<boolean> {
  const db = await readDB();
  const initialLength = db.receipts.length;
  db.receipts = db.receipts.filter((r) => r.receiptId !== receiptId);
  
  if (db.receipts.length < initialLength) {
    await writeDB(db);
    return true;
  }
  
  return false;
}






