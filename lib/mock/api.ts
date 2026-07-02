import type {
  Receipt,
  ReceiptFilters,
  UserStats,
  Quest,
  Task,
  LeaderboardEntry,
  InsightData,
  ActivityLog,
} from "./types";
import {
  mockReceipts,
  mockUserStats,
  mockQuests,
  mockTasks,
  mockLeaderboard,
  mockWeeklyLeaderboard,
  mockDailyLeaderboard,
  mockInsights,
  mockActivityLog,
} from "./data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listReceipts(
  filters?: ReceiptFilters
): Promise<Receipt[]> {
  await delay(300);
  
  // Try to fetch from API first (client-side only)
  let apiReceipts: Receipt[] = [];
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/receipts");
      if (response.ok) {
        const data = await response.json();
        // Convert ReceiptAnalysis[] to Receipt[]
        const { convertReceiptAnalysisToReceipt } = await import("@/lib/receipt/receipt-converter");
        apiReceipts = (data.receipts || []).map((analysis: any) => {
          try {
            return convertReceiptAnalysisToReceipt(analysis);
          } catch (err) {
            console.error("Failed to convert receipt:", analysis.receiptId, err);
            return null;
          }
        }).filter((r: Receipt | null): r is Receipt => r !== null);
        
        console.log(`[listReceipts] Loaded ${apiReceipts.length} receipts from API`);
      } else {
        console.warn("Failed to fetch receipts from API:", response.status, response.statusText);
      }
    } catch (err) {
      console.warn("Failed to fetch receipts from API, using mock data:", err);
    }
  }
  
  // Combine API receipts with mock receipts (avoid duplicates)
  const allReceipts = [...apiReceipts, ...mockReceipts];
  const uniqueReceipts = allReceipts.filter((r, index, self) => 
    index === self.findIndex((t) => t.id === r.id)
  );
  
  // Sort by date (newest first)
  let results = uniqueReceipts.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA; // Newest first
  });

  if (filters?.status) {
    results = results.filter((r) => r.status === filters.status);
  }

  if (filters?.verifiedOnly) {
    results = results.filter((r) => r.status === "VERIFIED");
  }

  if (filters?.country) {
    results = results.filter((r) => r.country === filters.country);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.merchantName.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.dateFrom) {
    results = results.filter((r) => r.date >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    results = results.filter((r) => r.date <= filters.dateTo!);
  }

  return results;
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  await delay(200);
  
  // Try to fetch from API first (client-side only)
  if (typeof window !== "undefined") {
    try {
      const response = await fetch(`/api/receipts/${id}`);
      if (response.ok) {
        const analysis = await response.json();
        // Convert ReceiptAnalysis to Receipt
        const { convertReceiptAnalysisToReceipt } = await import("@/lib/receipt/receipt-converter");
        return convertReceiptAnalysisToReceipt(analysis);
      }
    } catch (err) {
      console.warn("Failed to fetch receipt from API, using mock data:", err);
    }
  }
  
  return mockReceipts.find((r) => r.id === id) || null;
}

export async function createMockUpload(file: File): Promise<Receipt> {
  await delay(1500);
  
  // Generate mock data
  const merchants = ["7-Eleven", "Big C", "Central", "Tesco Lotus", "Starbucks", "FamilyMart"];
  const categories = ["grocery", "restaurant", "cafe", "electronics", "pharmacy"];
  const merchantName = merchants[Math.floor(Math.random() * merchants.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // Generate realistic totals
  const baseTotal = 100 + Math.random() * 400; // Between 100-500 THB
  const total = Math.round(baseTotal * 100) / 100;
  const vat = Math.round(total * 0.07 * 100) / 100;
  const paidExTax = total - vat;
  const date = new Date().toISOString().split("T")[0];
  
  // Generate synthetic receipt image
  const { generateSyntheticReceiptBlob } = await import("@/lib/receipt/synthetic-receipt");
  const receiptBlob = await generateSyntheticReceiptBlob({
    merchantName,
    date,
    category,
    total,
    vat,
    currency: "THB",
  });
  
  // Create File from blob
  const syntheticFile = new File([receiptBlob], `receipt_${Date.now()}.png`, { type: "image/png" });
  const imageUrl = URL.createObjectURL(syntheticFile);
  
  // Calculate hidden costs (mock calculation)
  const productValue = Math.round(total * 0.68 * 100) / 100;
  const importSystem = Math.round(total * 0.12 * 100) / 100;
  const retailBrand = Math.round(total * 0.15 * 100) / 100;
  const state = vat;
  const totalHidden = importSystem + retailBrand + state;
  
  // Generate confidence
  const confidence = 85 + Math.random() * 10; // 85-95%
  
  // Generate OCR lines (mock - matching synthetic receipt)
  const ocrLines = [
    { lineNo: 1, text: merchantName },
    { lineNo: 2, text: `Date: ${date}` },
    { lineNo: 3, text: `Category: ${category}` },
    { lineNo: 4, text: `Item 1: ${(total * 0.4).toFixed(2)} THB` },
    { lineNo: 5, text: `Item 2: ${(total * 0.35).toFixed(2)} THB` },
    { lineNo: 6, text: `Item 3: ${(total * 0.25).toFixed(2)} THB` },
    { lineNo: 7, text: `Subtotal: ${paidExTax.toFixed(2)} THB` },
    { lineNo: 8, text: `VAT: ${vat.toFixed(2)} THB` },
    { lineNo: 9, text: `TOTAL: ${total.toFixed(2)} THB` },
  ];
  
  // Generate total candidates
  const pickedTotalCandidate = {
    value: total,
    score: confidence / 100,
    fromLine: 9,
    reasons: ["Strong numeric pattern", "VAT calculation matches", "TOTAL keyword found"],
  };
  
  const newReceipt: Receipt = {
    id: `rec_${Date.now()}`,
    merchantName,
    country: "TH",
    currency: "THB",
    date,
    total,
    vat,
    paidExTax,
    status: "PENDING",
    confidence: Math.round(confidence),
    hiddenCost: {
      importSystem,
      retailBrand,
      state,
      productValue,
      totalHidden,
    },
    reward: { 
      amount: Math.round(totalHidden * 0.1 * 100) / 100, 
      symbol: "aYUMO", 
      claimable: false 
    },
    reasons: ["OCR extraction successful", "Merchant verified", "Synthetic receipt generated"],
    ocrLines,
    pickedTotalCandidate,
    duplicateCheck: { isDuplicate: false },
    imageUrl,
    createdAt: new Date().toISOString(),
  };
  
  return newReceipt;
}

export async function confirmAndMine(receiptId: string): Promise<Receipt> {
  await delay(2000);
  const receipt = mockReceipts.find((r) => r.id === receiptId);
  if (!receipt) throw new Error("Receipt not found");

  const updated: Receipt = {
    ...receipt,
    status: "VERIFIED",
    confidence: 95,
    reward: {
      amount: receipt.hiddenCost.totalHidden * 0.1,
      symbol: "aYUMO",
      claimable: true,
    },
  };
  return updated;
}

export async function getUserStats(): Promise<UserStats> {
  await delay(200);
  return mockUserStats;
}

export async function listQuests(): Promise<Quest[]> {
  await delay(300);
  return mockQuests;
}

export async function listTasks(): Promise<Task[]> {
  await delay(300);
  return mockTasks;
}

export async function listLeaderboard(
  type: "global" | "weekly" | "daily" = "global"
): Promise<LeaderboardEntry[]> {
  await delay(400);
  // Return different leaderboard data based on type
  if (type === "weekly") {
    return mockWeeklyLeaderboard;
  }
  if (type === "daily") {
    return mockDailyLeaderboard;
  }
  return mockLeaderboard;
}

export async function getInsights(): Promise<InsightData> {
  await delay(300);
  return mockInsights;
}

export async function getActivityLog(limit?: number): Promise<ActivityLog[]> {
  await delay(200);
  const sorted = [...mockActivityLog].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

