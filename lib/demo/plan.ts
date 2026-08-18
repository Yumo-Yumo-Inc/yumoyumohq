import { CANONICAL_RECEIPT_CATEGORIES } from "@/lib/receipt/categories";
import { DEMO_MONTH_SPEND_TRY, DEMO_WINDOW_DAYS } from "./constants";
import {
  DEMO_CAFE,
  DEMO_FUEL,
  DEMO_GROCERY,
  DEMO_MERCHANTS,
  DEMO_ONE_OFFS,
  HIDDEN_RATIO,
  POOLS,
  type DemoMerchant,
  type DemoProduct,
} from "./catalog";

export interface PlannedLine {
  raw: string;
  canon: string;
  brand: string | null;
  pack: number | null;
  unit: string | null;
  qty: number;
  unitPrice: number;
  cat1: string;
  path: string;
}

export interface PlannedReceipt {
  merchant: DemoMerchant;
  dayAgo: number;
  hour: number;
  minute: number;
  documentType: "receipt" | "utility_bill" | "ticket" | "booking_confirmation";
  lines: PlannedLine[];
  total: number;
  hidden: number;
}

function mulberry(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const R2 = (x: number) => Math.round(x * 100) / 100;

function priceAt(base: number, dayAgo: number, factor: number, jitter: number): number {
  const monthsAgo = dayAgo / 30;
  return R2(base * Math.pow(1.021, -monthsAgo) * factor * (1 + (jitter - 0.5) * 0.05));
}

function pickWeighted(pool: DemoProduct[], rnd: () => number, count: number): DemoProduct[] {
  const available = pool.filter((p) => p.weight > 0);
  const picked: DemoProduct[] = [];
  const used = new Set<string>();
  const totalWeight = available.reduce((s, p) => s + p.weight, 0);
  for (let n = 0; n < count && used.size < available.length; n++) {
    let roll = rnd() * totalWeight;
    let idx = 0;
    for (; idx < available.length; idx++) {
      roll -= available[idx].weight;
      if (roll <= 0) break;
    }
    const item = available[Math.min(idx, available.length - 1)];
    if (used.has(item.raw)) continue;
    used.add(item.raw);
    picked.push(item);
  }
  return picked;
}

function inWindow(p: DemoProduct, dayAgo: number): boolean {
  if (!p.window) return true;
  return dayAgo <= p.window[0] && dayAgo >= p.window[1];
}

function linesFromProducts(
  products: DemoProduct[],
  merchant: DemoMerchant,
  dayAgo: number,
  rnd: () => number
): PlannedLine[] {
  return products.map((p) => {
    const qty =
      p.unit === "kg" && rnd() > 0.45 ? R2(0.5 + rnd() * 1.5) : p.unit === "l" && p.canon === "kursunsuz_benzin_95" ? R2(22 + rnd() * 18) : 1;
    return {
      raw: p.raw,
      canon: p.canon,
      brand: p.brand,
      pack: p.pack,
      unit: p.unit,
      qty,
      unitPrice: priceAt(p.base, dayAgo, merchant.factor, rnd()),
      cat1: p.cat1,
      path: p.path,
    };
  });
}

function finishReceipt(
  merchant: DemoMerchant,
  dayAgo: number,
  hour: number,
  minute: number,
  lines: PlannedLine[],
  documentType: PlannedReceipt["documentType"]
): PlannedReceipt | null {
  const total = R2(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
  if (total <= 0) return null;
  const ratio = HIDDEN_RATIO[merchant.category] ?? 0.28;
  return {
    merchant,
    dayAgo,
    hour,
    minute,
    documentType,
    lines,
    total,
    hidden: R2(total * ratio),
  };
}

function merchantsOf(type: DemoMerchant["type"]): DemoMerchant[] {
  return DEMO_MERCHANTS.filter((m) => m.type === type || m.category === type);
}

function groceryBasket(dayAgo: number, rnd: () => number): DemoProduct[] {
  const pool = DEMO_GROCERY.filter((p) => inWindow(p, dayAgo));
  const count = 5 + Math.floor(rnd() * 5);
  const picked = pickWeighted(pool, rnd, count);
  // Force staple + size-variant coverage so analysis layers have series.
  const must = ["pinar_sut_1l", "sutas_suzme_yogurt", "erikli_su", "coca_cola", "ulker_cikolatali_gofret"];
  for (const canon of must) {
    if (picked.some((p) => p.canon === canon)) continue;
    const extra = pool.filter((p) => p.canon === canon);
    if (extra.length) picked.push(extra[Math.floor(rnd() * extra.length)]);
  }
  return picked;
}

/**
 * Builds the sample-account receipt plan.
 * Current calendar month is scaled to DEMO_MONTH_SPEND_TRY.
 */
export function buildDemoPlan(now: Date): PlannedReceipt[] {
  const receipts: PlannedReceipt[] = [];
  let seed = 0;
  const nextRnd = () => mulberry(42 + seed++ * 104729);

  const dayOfMonth = now.getUTCDate();
  const currentMonthDays = Math.max(1, dayOfMonth);

  // 1. Weekly grocery (analysis backbone) across the whole window.
  for (let week = 0; week < Math.floor(DEMO_WINDOW_DAYS / 7); week++) {
    const rnd = nextRnd();
    const dayAgo = Math.min(DEMO_WINDOW_DAYS - 1, week * 7 + Math.floor(rnd() * 3));
    const chain = merchantsOf("grocery");
    const merchant = chain[week % chain.length];
    const [h0, h1] = merchant.hourRange;
    const hour = h0 + Math.floor(rnd() * (h1 - h0 + 1));
    const lines = linesFromProducts(groceryBasket(dayAgo, rnd), merchant, dayAgo, rnd);
    const rec = finishReceipt(merchant, dayAgo, hour, Math.floor(rnd() * 60), lines, "receipt");
    if (rec) receipts.push(rec);
  }

  // 2. Cafe ritual — weekday mornings (heatmap + ritual loop + micro-leak).
  const starbucks = DEMO_MERCHANTS.find((m) => m.name === "Starbucks")!;
  for (let dayAgo = 1; dayAgo < DEMO_WINDOW_DAYS; dayAgo++) {
    const d = new Date(now.getTime() - dayAgo * 86400000);
    const dow = d.getUTCDay(); // 0 Sun
    if (dow === 0 || dow === 6) continue;
    if (dayAgo % 2 === 1) continue; // ~3 visits / week
    const rnd = nextRnd();
    const drink = DEMO_CAFE[dayAgo % 3 === 0 ? 1 : 0];
    const extra = dayAgo % 5 === 0 ? [DEMO_CAFE[2]] : [];
    const rec = finishReceipt(
      starbucks,
      dayAgo,
      8 + Math.floor(rnd() * 2),
      10 + Math.floor(rnd() * 40),
      linesFromProducts([drink, ...extra], starbucks, dayAgo, rnd),
      "receipt"
    );
    if (rec) receipts.push(rec);
  }

  // 3. Dining + fuel sprinkled through the window.
  const diningMerchants = merchantsOf("restaurant");
  for (let i = 0; i < 28; i++) {
    const rnd = nextRnd();
    const dayAgo = Math.floor((i / 28) * DEMO_WINDOW_DAYS);
    const merchant = diningMerchants[i % diningMerchants.length];
    const pool = (POOLS.restaurant ?? DEMO_CAFE).filter((p) => inWindow(p, dayAgo));
    const picked = pickWeighted(pool, rnd, 2);
    const rec = finishReceipt(
      merchant,
      dayAgo,
      merchant.hourRange[0] + Math.floor(rnd() * 3),
      Math.floor(rnd() * 60),
      linesFromProducts(picked, merchant, dayAgo, rnd),
      "receipt"
    );
    if (rec) receipts.push(rec);
  }
  const fuelMerchants = merchantsOf("fuel");
  for (let i = 0; i < 10; i++) {
    const rnd = nextRnd();
    const dayAgo = Math.floor((i / 10) * DEMO_WINDOW_DAYS);
    const merchant = fuelMerchants[i % fuelMerchants.length];
    const rec = finishReceipt(
      merchant,
      dayAgo,
      merchant.hourRange[0] + Math.floor(rnd() * 6),
      Math.floor(rnd() * 60),
      linesFromProducts(DEMO_FUEL, merchant, dayAgo, rnd),
      "receipt"
    );
    if (rec) receipts.push(rec);
  }

  // 4. Every sector at least once in the current month AND once historically.
  const seenCurrent = new Set<string>();
  const seenHist = new Set<string>();
  DEMO_ONE_OFFS.forEach((oneOff, idx) => {
    const cat = oneOff.merchant.category;
    const currentDay = idx % currentMonthDays;
    const histDay = 40 + ((idx * 11) % 120);
    const placements: Array<{ dayAgo: number; target: Set<string> }> = [];
    if (!seenCurrent.has(cat)) {
      placements.push({ dayAgo: currentDay, target: seenCurrent });
    }
    if (!seenHist.has(cat)) {
      placements.push({ dayAgo: histDay, target: seenHist });
    }
    // Apparel / grocery-adjacent one-offs also get a second current-month visit
    // so the 60k mix is not only utilities + travel.
    if (["apparel", "fashion", "electronics", "sports", "alcohol", "beauty"].includes(cat)) {
      placements.push({ dayAgo: Math.min(currentMonthDays - 1, currentDay + 3), target: seenCurrent });
    }
    for (const place of placements) {
      const rnd = nextRnd();
      const rec = finishReceipt(
        oneOff.merchant,
        place.dayAgo,
        oneOff.merchant.hourRange[0],
        Math.floor(rnd() * 50),
        linesFromProducts(oneOff.items, oneOff.merchant, place.dayAgo, rnd),
        oneOff.merchant.category === "utilities"
          ? "utility_bill"
          : oneOff.merchant.category === "travel"
            ? "ticket"
            : oneOff.merchant.category === "hospitality_lodging"
              ? "booking_confirmation"
              : "receipt"
      );
      if (rec) {
        receipts.push(rec);
        place.target.add(cat);
      }
    }
  });

  // Personal-care / beauty repeating visits for loyalty.
  const care = DEMO_MERCHANTS.filter((m) => m.category === "personal_care" || m.category === "beauty");
  for (let i = 0; i < 8; i++) {
    const rnd = nextRnd();
    const dayAgo = Math.floor((i / 8) * 90);
    const merchant = care[i % care.length];
    const pool = (POOLS[merchant.type] ?? []).filter((p) => inWindow(p, dayAgo));
    if (!pool.length) continue;
    const rec = finishReceipt(
      merchant,
      dayAgo,
      merchant.hourRange[0],
      Math.floor(rnd() * 40),
      linesFromProducts(pickWeighted(pool, rnd, 2), merchant, dayAgo, rnd),
      "receipt"
    );
    if (rec) receipts.push(rec);
  }

  // Hit 60_000 TRY in the current calendar month without distorting staple
  // unit prices (those series feed price-track / inflation / unit-trap).
  const stapleNames = new Set(["Migros", "Migros Jet", "A101", "BİM", "ŞOK Market", "CarrefourSA", "Macrocenter", "Starbucks", "Opet", "Shell"]);
  const current = receipts.filter((r) => r.dayAgo < currentMonthDays);
  let currentSum = current.reduce((s, r) => s + r.total, 0);
  const adjustable = current.filter((r) => !stapleNames.has(r.merchant.name));
  const adjSum = adjustable.reduce((s, r) => s + r.total, 0);
  if (adjustable.length > 0 && adjSum > 0 && currentSum !== DEMO_MONTH_SPEND_TRY) {
    const gap = DEMO_MONTH_SPEND_TRY - currentSum;
    const factor = Math.max(0.35, (adjSum + gap) / adjSum);
    for (const rec of adjustable) {
      for (const line of rec.lines) line.unitPrice = R2(line.unitPrice * factor);
      rec.total = R2(rec.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
      rec.hidden = R2(rec.total * (HIDDEN_RATIO[rec.merchant.category] ?? 0.28));
    }
    currentSum = current.reduce((s, r) => s + r.total, 0);
  }
  const drift = R2(DEMO_MONTH_SPEND_TRY - currentSum);
  const topUp = adjustable[0] ?? current[0];
  if (topUp && Math.abs(drift) >= 1) {
    topUp.lines[0].unitPrice = R2(topUp.lines[0].unitPrice + drift / topUp.lines[0].qty);
    topUp.total = R2(topUp.total + drift);
    topUp.hidden = R2(topUp.total * (HIDDEN_RATIO[topUp.merchant.category] ?? 0.28));
  }

  const covered = new Set(receipts.map((r) => r.merchant.category));
  for (const cat of CANONICAL_RECEIPT_CATEGORIES) {
    if (!covered.has(cat)) {
      throw new Error(`demo plan missing sector: ${cat}`);
    }
  }

  return receipts;
}
