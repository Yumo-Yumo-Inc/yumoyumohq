/**
 * Mock receipt data — recent receipts per category.
 * Once wired to the real API, this will come from /api/insights/receipts?category=X.
 */

export interface MockReceipt {
  id: string;
  date: string; // ISO YYYY-MM-DD
  merchant: string;
  total: number;
  itemCount: number;
}

export const RECEIPTS_BY_CATEGORY: Record<string, MockReceipt[]> = {
  grocery: [
    { id: "r-g-1", date: "2026-05-14", merchant: "Migros", total: 487, itemCount: 14 },
    { id: "r-g-2", date: "2026-05-11", merchant: "BIM", total: 312, itemCount: 9 },
    { id: "r-g-3", date: "2026-05-08", merchant: "Migros", total: 401, itemCount: 11 },
    { id: "r-g-4", date: "2026-05-04", merchant: "A101", total: 198, itemCount: 6 },
    { id: "r-g-5", date: "2026-05-02", merchant: "Migros", total: 528, itemCount: 16 },
    { id: "r-g-6", date: "2026-04-29", merchant: "BIM", total: 245, itemCount: 7 },
    { id: "r-g-7", date: "2026-04-27", merchant: "CarrefourSA", total: 612, itemCount: 18 },
  ],
  restaurant: [
    { id: "r-r-1", date: "2026-05-15", merchant: "Burger King", total: 240, itemCount: 2 },
    { id: "r-r-2", date: "2026-05-13", merchant: "Mado", total: 380, itemCount: 4 },
    { id: "r-r-3", date: "2026-05-09", merchant: "Yemeksepeti", total: 295, itemCount: 3 },
    { id: "r-r-4", date: "2026-05-06", merchant: "KFC", total: 210, itemCount: 2 },
    { id: "r-r-5", date: "2026-05-03", merchant: "Baydoner", total: 425, itemCount: 4 },
    { id: "r-r-6", date: "2026-04-30", merchant: "Burger King", total: 240, itemCount: 2 },
  ],
  cafe: [
    { id: "r-c-1", date: "2026-05-15", merchant: "Starbucks", total: 102, itemCount: 1 },
    { id: "r-c-2", date: "2026-05-08", merchant: "Caffe Nero", total: 95, itemCount: 1 },
    { id: "r-c-3", date: "2026-05-01", merchant: "Starbucks", total: 102, itemCount: 1 },
    { id: "r-c-4", date: "2026-04-24", merchant: "Starbucks", total: 102, itemCount: 1 },
    { id: "r-c-5", date: "2026-04-17", merchant: "Mado", total: 145, itemCount: 2 },
    { id: "r-c-6", date: "2026-04-10", merchant: "Costa Coffee", total: 88, itemCount: 1 },
  ],
  fuel: [
    { id: "r-f-1", date: "2026-05-12", merchant: "Shell", total: 720, itemCount: 1 },
    { id: "r-f-2", date: "2026-04-28", merchant: "Shell", total: 360, itemCount: 1 },
    { id: "r-f-3", date: "2026-04-15", merchant: "Opet", total: 360, itemCount: 1 },
  ],
  marketplace: [
    { id: "r-m-1", date: "2026-05-13", merchant: "Trendyol", total: 287, itemCount: 3 },
    { id: "r-m-2", date: "2026-05-09", merchant: "Trendyol", total: 156, itemCount: 1 },
    { id: "r-m-3", date: "2026-05-02", merchant: "Hepsiburada", total: 412, itemCount: 2 },
    { id: "r-m-4", date: "2026-04-26", merchant: "Trendyol", total: 195, itemCount: 2 },
    { id: "r-m-5", date: "2026-04-20", merchant: "Trendyol", total: 100, itemCount: 1 },
  ],
  pharmacy: [
    { id: "r-p-1", date: "2026-05-10", merchant: "Mahalle Eczanesi", total: 245, itemCount: 3 },
    { id: "r-p-2", date: "2026-04-22", merchant: "Şifa Eczanesi", total: 178, itemCount: 2 },
    { id: "r-p-3", date: "2026-04-08", merchant: "Mahalle Eczanesi", total: 297, itemCount: 4 },
  ],
  electronics: [
    { id: "r-e-1", date: "2026-05-05", merchant: "Teknosa", total: 430, itemCount: 1 },
  ],
  convenience: [
    { id: "r-co-1", date: "2026-05-14", merchant: "Mahalle Bakkalı", total: 87, itemCount: 4 },
    { id: "r-co-2", date: "2026-05-07", merchant: "Mahalle Bakkalı", total: 102, itemCount: 5 },
    { id: "r-co-3", date: "2026-04-30", merchant: "Mahalle Bakkalı", total: 93, itemCount: 4 },
  ],
};

export function getReceiptsForCategory(key: string): MockReceipt[] {
  return RECEIPTS_BY_CATEGORY[key] ?? [];
}

// Collect receipts for a given merchant across all categories, sorted by date DESC
export function getReceiptsForMerchant(merchantName: string): MockReceipt[] {
  const all: MockReceipt[] = [];
  for (const list of Object.values(RECEIPTS_BY_CATEGORY)) {
    for (const r of list) {
      if (r.merchant === merchantName) all.push(r);
    }
  }
  return all.sort((a, b) => b.date.localeCompare(a.date));
}
