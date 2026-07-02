import type { Receipt } from "@/lib/mock/types";
import type { CostLayerBucket } from "@/lib/receipt/cost-layer-display";
import { getCategoryStoryIntro, getReceiptCategoryKind } from "@/lib/receipt/cost-layer-display";
import { getBreakdownItemCopy } from "@/lib/receipt/breakdown-item-copy";
import { displayHiddenCost } from "@/lib/receipt/display-hidden-cost";

// RULE (per the product decision, §0.2/§3): no fabrication. The hidden-cost breakdown
// is shown ONLY from values the backend computes from official/academic data and sends.
// Producing an estimate via a fixed percentage (0.35/0.45/0.20) of totalPaid is FORBIDDEN.
// If the backend sends 0/empty, the breakdown is not shown — an empty-state message is displayed instead.

export type BreakdownDisplayItem = {
  label: string;
  description: string;
  amount: number;
  bucket: CostLayerBucket;
  estimated: boolean;
  pendingAmount: boolean;
};

export type BreakdownDisplayGroup = {
  bucket: CostLayerBucket;
  items: BreakdownDisplayItem[];
  total: number;
};

const BUCKET_ORDER: CostLayerBucket[] = ["store", "supply", "retail", "excise", "other"];

function groupItems(items: BreakdownDisplayItem[]): BreakdownDisplayGroup[] {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.bucket]) acc[item.bucket] = [];
    acc[item.bucket].push(item);
    return acc;
  }, {} as Record<string, BreakdownDisplayItem[]>);

  return BUCKET_ORDER.filter((bucket) => grouped[bucket]?.length)
    .map((bucket) => {
      const bucketItems = grouped[bucket]!;
      const total = bucketItems.reduce((sum, item) => sum + item.amount, 0);
      return { bucket, items: bucketItems, total };
    });
}

/** Uses the breakdownItems sent by the backend directly. No fabrication. */
function fromApiItems(
  receipt: Receipt,
  locale?: string
): BreakdownDisplayItem[] {
  return (receipt.hiddenCost.breakdownItems || [])
    .filter((item) => item.bucket !== "government")
    .map((item) => {
      const copy = getBreakdownItemCopy(item.label, item.description, locale);
      const amount = Math.max(0, Number(item.amount) || 0);
      return {
        label: copy.label,
        description: copy.description,
        amount,
        bucket: (item.bucket || "other") as CostLayerBucket,
        estimated: item.estimated !== false,
        pendingAmount: amount <= 0,
      };
    });
}

export function buildReceiptBreakdownDisplay(
  receipt: Receipt,
  locale?: string
): {
  groups: BreakdownDisplayGroup[];
  hiddenCost: number;
  storyIntro: string;
  hasPricedItems: boolean;
  isEstimated: boolean;
} {
  // Only the backend's stored value. No estimate/fallback.
  const hiddenCost = displayHiddenCost(receipt);

  // Only the items sent by the backend. If empty, the breakdown is not shown.
  const apiItems = fromApiItems(receipt, locale);
  const items = apiItems.some((item) => item.amount > 0) ? apiItems : [];

  const kind = getReceiptCategoryKind(receipt.category, receipt.merchantChannel);
  return {
    groups: groupItems(items),
    hiddenCost,
    storyIntro: getCategoryStoryIntro(kind, locale),
    hasPricedItems: items.some((item) => item.amount > 0),
    // The backend provides real data; the client side does not produce an estimate.
    isEstimated: false,
  };
}
