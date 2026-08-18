/**
 * Client-side tour vitrine. Built from the same plan as the yumo_demo seed.
 * Never reads the signed-in user's cache, never writes it.
 */
import {
  ACHIEVEMENT_TRACKS,
  currentTier,
  nextTier,
  tierDescription,
} from "@/config/achievements";
import { GENESIS_SEASON, getNextTier, getTierForXp } from "@/config/seasons";
import type { AnalysisPayload } from "@/lib/analysis/types";
import type { CategoryBucket } from "@/lib/insights/category-spending";
import type { CachedInsightsRecord } from "@/lib/offline/types";
import type { UserFacingText } from "@/lib/product-architecture/dashboard-contract";
import {
  DEMO_CITY,
  DEMO_COUNTRY,
  DEMO_DISPLAY_NAME,
  DEMO_MONTH_SPEND_TRY,
  DEMO_USERNAME,
} from "./constants";
import { buildDemoPlan, type PlannedReceipt } from "./plan";

export type TourReceiptRow = {
  id: string;
  merchantName: string;
  category: string;
  date: string;
  total: number;
  currency: "TRY";
  status: "verified";
  hidden: number;
  reward: number;
};

export type TourProfile = {
  username: string;
  displayName: string;
  avatarUrl: null;
  gender: string;
  birthDate: string;
  occupation: string;
  city: string;
  country: string;
  website: null;
  bio: null;
  nameColor: string;
  profileFrame: string;
  themeAccent: string;
  profileBg: string;
  avatarSticker: string;
  seal: null;
  declaredMonthlyIncomeBand: null;
  isAdmin: false;
  honor: number;
  accountLevel: number;
  accountXp: number;
  seasonLevel: number;
  seasonXp: number;
  pointsBalance: number;
  contributionPoints: {
    total: number;
    fromReceipts: number;
    fromQuests: number;
    contributionReceipts: number;
    lastContributionAt: string | null;
  };
  streak: number;
  checkedInToday: boolean;
};

export type TourSeasonStatus = {
  active: {
    seasonNumber: number;
    name: string;
    key: string;
    startAt: string;
    endAt: string;
    daysLeft: number;
  };
  progress: {
    seasonXp: number;
    seasonLevel: number;
    currentTier: { index: number; key: string; cpointsReward: number } | null;
    nextTier: { index: number; key: string; cpointsReward: number; minSeasonXp: number } | null;
  };
};

export type TourAchievementTrack = {
  key: string;
  metric: string;
  name: { tr: string; en: string };
  value: number;
  currentTier: { index: number } | null;
  nextTier: { index: number; threshold: number } | null;
  tiers: Array<{
    index: number;
    key: string;
    threshold: number;
    name: { tr: string; en: string };
    description: { tr: string; en: string };
    earned: boolean;
    earnedAt: string | null;
  }>;
};

export type TourSnapshot = {
  profile: TourProfile;
  insights: CachedInsightsRecord;
  categories: CategoryBucket[];
  receipts: TourReceiptRow[];
  analysis: AnalysisPayload;
  season: TourSeasonStatus;
  achievements: TourAchievementTrack[];
};

const DISPLAY: Record<string, UserFacingText> = {
  grocery: { tr: "Market & Gıda", en: "Grocery", ru: "Продукты", th: "ของชำ", es: "Comestibles", zh: "食杂" },
  food_drink: { tr: "Yeme & İçme", en: "Food & Drink", ru: "Еда и напитки", th: "อาหารและเครื่องดื่ม", es: "Comida y bebida", zh: "餐饮" },
  fuel: { tr: "Ulaşım & Yakıt", en: "Fuel & Transport", ru: "Топливо", th: "เชื้อเพลิง", es: "Combustible", zh: "燃油" },
  fashion: { tr: "Giyim & Moda", en: "Fashion", ru: "Одежда", th: "แฟชั่น", es: "Moda", zh: "服饰" },
  personal_care: { tr: "Kişisel Bakım", en: "Personal Care", ru: "Уход за собой", th: "ดูแลตัวเอง", es: "Cuidado personal", zh: "个人护理" },
  health: { tr: "Sağlık & Eczane", en: "Health", ru: "Здоровье", th: "สุขภาพ", es: "Salud", zh: "健康" },
  electronics: { tr: "Elektronik", en: "Electronics", ru: "Электроника", th: "อิเล็กทรอนิกส์", es: "Electrónica", zh: "电子产品" },
  services: { tr: "Hizmetler", en: "Services", ru: "Услуги", th: "บริการ", es: "Servicios", zh: "服务" },
  hospitality: { tr: "Konaklama", en: "Accommodation", ru: "Проживание", th: "ที่พัก", es: "Alojamiento", zh: "住宿" },
  sports: { tr: "Spor", en: "Sports", ru: "Спорт", th: "กีฬา", es: "Deportes", zh: "运动" },
  tobacco: { tr: "Tütün", en: "Tobacco", ru: "Табак", th: "ยาสูบ", es: "Tabaco", zh: "烟草" },
  other: { tr: "Diğer", en: "Other", ru: "Другое", th: "อื่น ๆ", es: "Otros", zh: "其他" },
};

const RECEIPT_TO_DISPLAY: Record<string, string> = {
  grocery: "grocery",
  cafe: "food_drink",
  restaurant: "food_drink",
  alcohol: "food_drink",
  fuel: "fuel",
  apparel: "fashion",
  fashion: "fashion",
  beauty: "personal_care",
  personal_care: "personal_care",
  cosmetics: "personal_care",
  pharmacy: "health",
  healthcare: "health",
  electronics: "electronics",
  utilities: "services",
  services: "services",
  travel: "services",
  hospitality_lodging: "hospitality",
  sports: "sports",
  tobacco: "tobacco",
  kiosk: "other",
  specialty_retail: "other",
  other: "other",
};

const CHART = [
  { dot: "#fb923c", dotBg: "rgba(249,115,22,0.15)", barStart: "#ea580c", barEnd: "#fb923c" },
  { dot: "#38bdf8", dotBg: "rgba(14,165,233,0.15)", barStart: "#0284c7", barEnd: "#38bdf8" },
  { dot: "#a78bfa", dotBg: "rgba(124,58,237,0.15)", barStart: "#7c3aed", barEnd: "#a78bfa" },
  { dot: "var(--chart-other-dot)", dotBg: "var(--chart-other-dot-bg)", barStart: "var(--chart-other-bar-start)", barEnd: "var(--chart-other-bar-end)" },
];

const R2 = (n: number) => Math.round(n * 100) / 100;

function dateOf(now: Date, dayAgo: number): Date {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - dayAgo);
  return d;
}

function isoDate(now: Date, dayAgo: number): string {
  return dateOf(now, dayAgo).toISOString().slice(0, 10);
}

function monthKey(now: Date, dayAgo: number): string {
  return isoDate(now, dayAgo).slice(0, 7);
}

function displayKey(category: string): string {
  return RECEIPT_TO_DISPLAY[category] ?? "other";
}

function buildProfile(now: Date): TourProfile {
  return {
    username: DEMO_USERNAME,
    displayName: DEMO_DISPLAY_NAME,
    avatarUrl: null,
    gender: "other",
    birthDate: "1992-04-15",
    occupation: "Girişimci",
    city: DEMO_CITY,
    country: DEMO_COUNTRY,
    website: null,
    bio: null,
    nameColor: "rose",
    profileFrame: "legendary",
    themeAccent: "violet",
    profileBg: "aurora",
    avatarSticker: "crown",
    seal: null,
    declaredMonthlyIncomeBand: null,
    isAdmin: false,
    honor: 80,
    accountLevel: 50,
    accountXp: 138900,
    seasonLevel: 30,
    seasonXp: 23200,
    pointsBalance: 0,
    contributionPoints: {
      total: 4280,
      fromReceipts: 3920,
      fromQuests: 360,
      contributionReceipts: 173,
      lastContributionAt: now.toISOString(),
    },
    streak: 9,
    checkedInToday: true,
  };
}

function buildInsights(now: Date, receipts: PlannedReceipt[]): CachedInsightsRecord {
  const monthly: CachedInsightsRecord["monthly"] = {};
  const categoryBreakdown: CachedInsightsRecord["categoryBreakdown"] = {};
  const merchantMap = new Map<string, { count: number; totalSpent: number }>();
  let totalSpend = 0;
  let totalHidden = 0;
  const thisMonth = now.toISOString().slice(0, 7);
  const trendDays = 14;
  const trend = new Array<number>(trendDays).fill(0);

  for (const rec of receipts) {
    const key = monthKey(now, rec.dayAgo);
    const slot = monthly[key] ?? { totalSpent: 0, receiptCount: 0, topCategories: [], hiddenCostTotal: 0, xpEarned: 0 };
    slot.totalSpent = R2(slot.totalSpent + rec.total);
    slot.receiptCount += 1;
    slot.hiddenCostTotal = R2(slot.hiddenCostTotal + rec.hidden);
    monthly[key] = slot;
    totalSpend += rec.total;
    totalHidden += rec.hidden;
    const merch = merchantMap.get(rec.merchant.name) ?? { count: 0, totalSpent: 0 };
    merch.count += 1;
    merch.totalSpent += rec.total;
    merchantMap.set(rec.merchant.name, merch);
    const cat = displayKey(rec.merchant.category);
    const row = categoryBreakdown[cat] ?? { totalSpent: 0, count: 0, pct: 0 };
    row.totalSpent += rec.total;
    row.count += 1;
    categoryBreakdown[cat] = row;
    if (rec.dayAgo < trendDays) trend[trendDays - 1 - rec.dayAgo] += rec.total;
  }

  const monthCats = receipts
    .filter((r) => monthKey(now, r.dayAgo) === thisMonth)
    .reduce<Record<string, number>>((acc, r) => {
      const k = displayKey(r.merchant.category);
      acc[k] = (acc[k] ?? 0) + r.total;
      return acc;
    }, {});
  if (monthly[thisMonth]) {
    monthly[thisMonth].topCategories = Object.entries(monthCats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
    monthly[thisMonth].totalSpent = DEMO_MONTH_SPEND_TRY;
  }

  const spendSum = Object.values(categoryBreakdown).reduce((s, r) => s + r.totalSpent, 0) || 1;
  for (const row of Object.values(categoryBreakdown)) {
    row.pct = Math.round((row.totalSpent / spendSum) * 100);
  }

  return {
    id: "demo-tour-insights",
    updated_at: now.toISOString(),
    version: 1,
    currency: "TRY",
    totalSpend: R2(totalSpend),
    totalHiddenCost: R2(totalHidden),
    totalReceiptCount: receipts.length,
    monthly,
    categoryBreakdown,
    spendingTrend: trend.map((n) => R2(n)),
    topMerchants: [...merchantMap.entries()]
      .map(([name, v]) => ({ name, count: v.count, totalSpent: R2(v.totalSpent) }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8),
  };
}

function buildCategories(receipts: PlannedReceipt[], now: Date): CategoryBucket[] {
  const cutoff = 30;
  const totals = new Map<string, number>();
  for (const rec of receipts) {
    if (rec.dayAgo > cutoff) continue;
    const key = displayKey(rec.merchant.category);
    totals.set(key, (totals.get(key) ?? 0) + rec.total);
  }
  const named = [...totals.entries()].filter(([k]) => k !== "other").sort((a, b) => b[1] - a[1]);
  const top3 = named.slice(0, 3);
  const other = named.slice(3).reduce((s, [, v]) => s + v, 0) + (totals.get("other") ?? 0);
  const buckets: CategoryBucket[] = top3.map(([key, total], i) => ({
    key,
    label: DISPLAY[key] ?? DISPLAY.other,
    chartColor: CHART[i],
    total: R2(total),
    currency: "TRY",
  }));
  buckets.push({
    key: "other",
    label: DISPLAY.other,
    chartColor: CHART[3],
    total: R2(other),
    currency: "TRY",
  });
  return buckets;
}

function buildReceipts(now: Date, receipts: PlannedReceipt[]): TourReceiptRow[] {
  return [...receipts]
    .sort((a, b) => a.dayAgo - b.dayAgo || b.hour - a.hour)
    .slice(0, 10)
    .map((rec, i) => ({
      id: `demo-tour-receipt-${i}`,
      merchantName: rec.merchant.name,
      category: rec.merchant.category,
      date: isoDate(now, rec.dayAgo),
      total: rec.total,
      currency: "TRY" as const,
      status: "verified" as const,
      hidden: rec.hidden,
      reward: 12,
    }));
}

function buildAnalysis(now: Date, receipts: PlannedReceipt[]): AnalysisPayload {
  const thisMonthDays = now.getDate();
  const current = receipts.filter((r) => r.dayAgo < thisMonthDays);
  const prev = receipts.filter((r) => r.dayAgo >= thisMonthDays && r.dayAgo < thisMonthDays + 31);
  const merchantSpendMap = new Map<string, { spend: number; receiptCount: number }>();
  for (const rec of current) {
    const row = merchantSpendMap.get(rec.merchant.name) ?? { spend: 0, receiptCount: 0 };
    row.spend += rec.total;
    row.receiptCount += 1;
    merchantSpendMap.set(rec.merchant.name, row);
  }

  const series = new Map<string, { name: string; brand: string | null; pack: number | null; unit: string | null; points: Array<{ date: string; unitPrice: number }> }>();
  for (const rec of receipts) {
    for (const line of rec.lines) {
      if (!line.pack || !line.unit) continue;
      const key = `${line.canon}|${line.pack}|${line.unit}`;
      const row = series.get(key) ?? {
        name: line.raw,
        brand: line.brand,
        pack: line.pack,
        unit: line.unit,
        points: [],
      };
      row.points.push({ date: isoDate(now, rec.dayAgo), unitPrice: line.unitPrice });
      series.set(key, row);
    }
  }

  const priceTracks = [...series.entries()]
    .map(([productKey, row]) => {
      const sorted = row.points.sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length < 3) return null;
      const latest = sorted[sorted.length - 1].unitPrice;
      const baseline = sorted[0].unitPrice;
      const span = Math.max(
        1,
        (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / 86400000,
      );
      return {
        productKey,
        name: row.name,
        brand: row.brand,
        packSize: row.pack,
        unitType: row.unit,
        series: sorted,
        deltaRatio: baseline > 0 ? (latest - baseline) / baseline : 0,
        baselineUnitPrice: baseline,
        latestUnitPrice: latest,
        sampleSize: sorted.length,
        spanDays: Math.round(span),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => Math.abs(b.deltaRatio) - Math.abs(a.deltaRatio))
    .slice(0, 8);

  const packByCanon = new Map<string, Array<{ name: string; pack: number; unit: string; per: number }>>();
  for (const rec of receipts) {
    for (const line of rec.lines) {
      if (!line.pack || !line.unit) continue;
      const list = packByCanon.get(line.canon) ?? [];
      list.push({ name: line.raw, pack: line.pack, unit: line.unit, per: line.unitPrice / line.pack });
      packByCanon.set(line.canon, list);
    }
  }
  const unitTraps = [...packByCanon.values()]
    .map((rows) => {
      const byPack = new Map<number, { name: string; unit: string; per: number; pack: number }>();
      for (const row of rows) {
        const prev = byPack.get(row.pack);
        if (!prev || row.per < prev.per) byPack.set(row.pack, row);
      }
      const packs = [...byPack.values()].sort((a, b) => a.pack - b.pack);
      if (packs.length < 2) return null;
      const small = packs[0];
      const large = packs[packs.length - 1];
      if (small.per <= large.per) return null;
      return {
        name: small.name,
        packSize: small.pack,
        unitType: small.unit,
        perUnitPaid: R2(small.per),
        perUnitAlt: R2(large.per),
        altPackSize: large.pack,
        savingsRatio: R2((small.per - large.per) / small.per),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .slice(0, 5);

  const grid = Array.from({ length: 4 }, () => new Array<number>(7).fill(0));
  let night = 0;
  for (const rec of receipts) {
    const band = rec.hour < 11 ? 0 : rec.hour < 16 ? 1 : rec.hour < 21 ? 2 : 3;
    const dow = dateOf(now, rec.dayAgo).getDay();
    const col = dow === 0 ? 6 : dow - 1;
    grid[band][col] += 1;
    if (rec.hour >= 21) night += 1;
  }

  const buyCount = new Map<string, { name: string; n: number; spend: number; first: number; last: number }>();
  for (const rec of receipts) {
    for (const line of rec.lines) {
      const row = buyCount.get(line.canon) ?? { name: line.raw, n: 0, spend: 0, first: rec.dayAgo, last: rec.dayAgo };
      row.n += 1;
      row.spend += line.unitPrice * line.qty;
      row.first = Math.max(row.first, rec.dayAgo);
      row.last = Math.min(row.last, rec.dayAgo);
      buyCount.set(line.canon, row);
    }
  }
  const loyalty = [...buyCount.values()]
    .filter((r) => r.n >= 4)
    .map((r) => ({
      name: r.name,
      purchasesPerMonth: R2(r.n / 6),
      annualizedSpend: R2(r.spend * 2),
      deltaRatio: priceTracks.find((t) => t.name === r.name)?.deltaRatio ?? null,
    }))
    .slice(0, 6);

  const shrinkHits = receipts.flatMap((rec) =>
    rec.lines
      .filter((l) => l.canon === "ulker_cikolatali_gofret" && l.pack === 36)
      .map((l) => ({
        name: l.raw,
        brand: l.brand,
        unitType: l.unit ?? "g",
        oldPackSize: 40,
        newPackSize: 36,
        observedAt: isoDate(now, rec.dayAgo),
        impliedPct: 40 / 36 - 1,
      })),
  );
  const shrinkflation = shrinkHits.slice(0, 1);

  const personalPct =
    priceTracks.length > 0
      ? priceTracks.reduce((s, t) => s + t.deltaRatio, 0) / priceTracks.length
      : 0;

  const catMonth = new Map<string, number>();
  const catPrev = new Map<string, number>();
  for (const rec of current) {
    const k = displayKey(rec.merchant.category);
    catMonth.set(k, (catMonth.get(k) ?? 0) + rec.total);
  }
  for (const rec of prev) {
    const k = displayKey(rec.merchant.category);
    catPrev.set(k, (catPrev.get(k) ?? 0) + rec.total);
  }
  const categoryLeague = [...catMonth.entries()].map(([category, spend]) => {
    const before = catPrev.get(category) ?? 0;
    return {
      category,
      personalPct: before > 0 ? (spend - before) / before : null,
      officialPct: null,
    };
  });

  return {
    currency: "TRY",
    generatedAt: now.toISOString(),
    overview: {
      monthTotal: DEMO_MONTH_SPEND_TRY,
      prevMonthTotal: prev.reduce((s, r) => s + r.total, 0) || null,
      hiddenCostMonth: R2(current.reduce((s, r) => s + r.hidden, 0)),
      receiptCount: receipts.length,
    },
    merchantSpend: [...merchantSpendMap.entries()]
      .map(([merchant, v]) => ({ merchant, spend: R2(v.spend), receiptCount: v.receiptCount }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8),
    priceTracks,
    merchantComparison: null,
    unitTraps,
    timeHeatmap: {
      grid,
      nightShare: receipts.length ? night / receipts.length : null,
      sampleSize: receipts.length,
    },
    loyalty,
    personalInflation: {
      personalPct,
      windowDays: 180,
      officialPct: null,
      officialSource: null,
      productCount: priceTracks.length,
    },
    shrinkflation,
    purchasingPower: null,
    categoryLeague,
    community: null,
  };
}

function buildSeason(): TourSeasonStatus {
  const xp = 23200;
  const current = getTierForXp(GENESIS_SEASON, xp);
  const next = getNextTier(GENESIS_SEASON, xp);
  const start = new Date();
  start.setDate(start.getDate() - 10);
  const end = new Date(start);
  end.setDate(end.getDate() + GENESIS_SEASON.durationDays);
  return {
    active: {
      seasonNumber: GENESIS_SEASON.seasonNumber,
      name: GENESIS_SEASON.name,
      key: GENESIS_SEASON.key,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      daysLeft: 18,
    },
    progress: {
      seasonXp: xp,
      seasonLevel: 30,
      currentTier: current
        ? { index: current.index, key: current.key, cpointsReward: current.cpointsReward }
        : null,
      nextTier: next
        ? { index: next.index, key: next.key, cpointsReward: next.cpointsReward, minSeasonXp: next.minSeasonXp }
        : null,
    },
  };
}

function buildAchievements(receipts: PlannedReceipt[]): TourAchievementTrack[] {
  const merchants = new Set(receipts.map((r) => r.merchant.name)).size;
  const categories = new Set(receipts.map((r) => r.merchant.category)).size;
  const hidden = Math.round(receipts.reduce((s, r) => s + r.hidden, 0));
  const metrics: Record<string, number> = {
    distinct_merchants: merchants,
    distinct_categories: categories,
    best_streak: 9,
    account_level: 50,
    verified_receipts: receipts.length,
    hidden_cost_surfaced: hidden,
    successful_referrals: 0,
  };
  return ACHIEVEMENT_TRACKS.map((track) => {
    const value = metrics[track.metric] ?? 0;
    const cur = currentTier(track, value);
    const nxt = nextTier(track, value);
    return {
      key: track.key,
      metric: track.metric,
      name: track.name,
      value,
      currentTier: cur ? { index: cur.index } : null,
      nextTier: nxt ? { index: nxt.index, threshold: nxt.threshold } : null,
      tiers: track.tiers.map((tier) => ({
        index: tier.index,
        key: tier.key,
        threshold: tier.threshold,
        name: tier.name,
        description: tierDescription(track, tier),
        earned: value >= tier.threshold,
        earnedAt: value >= tier.threshold ? new Date().toISOString() : null,
      })),
    };
  });
}

let cached: TourSnapshot | null = null;

export function getTourSnapshot(now = new Date()): TourSnapshot {
  if (cached) return cached;
  const receipts = buildDemoPlan(now);
  cached = {
    profile: buildProfile(now),
    insights: buildInsights(now, receipts),
    categories: buildCategories(receipts, now),
    receipts: buildReceipts(now, receipts),
    analysis: buildAnalysis(now, receipts),
    season: buildSeason(),
    achievements: buildAchievements(receipts),
  };
  return cached;
}
