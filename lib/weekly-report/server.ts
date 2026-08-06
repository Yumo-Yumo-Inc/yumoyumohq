/**
 * Weekly Ledger builder — SERVER-ONLY.
 *
 * Computes one user's closed-week report from the live DB and freezes it into
 * `weekly_reports` (self-healing table, no migration file — matches the
 * friendships pattern). A frozen report never changes: the page and the cron
 * both read the frozen row first and only compute when it is missing.
 *
 * Data honesty: a week with zero receipts returns null — no report row, no
 * notification, nothing fabricated. Sections whose inputs are missing are null
 * and the UI skips them.
 */

import { sql } from "@/lib/db/client";
import { resolveCategoryLvl1 } from "@/lib/receipt/category-taxonomy";
import {
  addDays,
  type SingleReceiptDive,
  type WeekArchetype,
  type WeeklyCategorySlice,
  type WeeklyEntry,
  type WeeklyLedgerReport,
  type WeeklyMoment,
  type WeeklyTopItem,
  type WildcardInsight,
} from "./types";

function toRows<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r && Array.isArray((r as { rows: unknown }).rows)) {
    return (r as { rows: T[] }).rows;
  }
  return [];
}

let ensured = false;
export async function ensureWeeklyReportsTable(): Promise<void> {
  if (ensured || !sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_reports (
      username VARCHAR(255) NOT NULL,
      week_start DATE NOT NULL,
      report JSONB NOT NULL,
      notified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (username, week_start)
    )`;
  ensured = true;
}

interface WeekReceiptRow {
  receipt_id: string;
  merchant_name: string | null;
  extraction_date_value: string | null;
  extraction_time_value: string | null;
  created_at: string;
  pricing_total_paid: string | number | null;
  pricing_vat_amount: string | number | null;
  pricing_currency: string | null;
  hidden_cost_core: string | number | null;
}

/** Effective ledger date of a receipt row (extraction date, else upload date). */
function rowDate(r: WeekReceiptRow): string {
  const d = (r.extraction_date_value || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return new Date(r.created_at).toISOString().slice(0, 10);
}

function rowHour(r: WeekReceiptRow): number | null {
  const t = (r.extraction_time_value || "").trim();
  const m = /^(\d{1,2})[:.]/.exec(t);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  return h >= 0 && h <= 23 ? h : null;
}

const sameCur = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toUpperCase() === String(b ?? "").trim().toUpperCase() && !!b;

/** Display name for a line item: canonical unless it is a machine slug, else the receipt text. */
function itemDisplayName(canonical: string | null, raw: string | null): string {
  const c = (canonical || "").trim();
  if (c && !c.includes("_")) return c;
  return (raw || "").trim() || c;
}

function pickPrimaryCurrency(list: Iterable<string | null | undefined>): string | null {
  const tally = new Map<string, number>();
  for (const cur of list) {
    const c = (cur || "").trim().toUpperCase();
    if (c) tally.set(c, (tally.get(c) ?? 0) + 1);
  }
  let best: string | null = null,
    max = 0;
  for (const [k, v] of tally) if (v > max) { max = v; best = k; }
  return best;
}

/** Verified personal receipts whose ledger date falls inside [start, endExcl). */
async function fetchWindowReceipts(username: string, start: string, endExcl: string): Promise<WeekReceiptRow[]> {
  if (!sql) return [];
  const rows = toRows<WeekReceiptRow>(await sql`
    SELECT r.receipt_id,
           COALESCE(m.display_name, r.merchant_name) AS merchant_name,
           r.extraction_date_value, r.extraction_time_value, r.created_at,
           r.pricing_total_paid, r.pricing_vat_amount, r.pricing_currency, r.hidden_cost_core
    FROM receipts r
    LEFT JOIN merchants m ON m.id = r.merchant_id
    WHERE r.username = ${username}
      AND r.status IN ('verified', 'saved')
      AND COALESCE(r.flags_rejected, false) = false
      AND COALESCE(r.expense_type, 'personal') = 'personal'
      AND (
        -- Only a well-formed YYYY-MM-DD prefix may place a receipt by its
        -- extraction date: OCR leaves malformed values ("2026-06-null") that
        -- plain string comparison would let through. Anything else falls back
        -- to the upload date, mirroring rowDate().
        (r.extraction_date_value ~ '^\\d{4}-\\d{2}-\\d{2}'
          AND substring(r.extraction_date_value, 1, 10) >= ${start}
          AND substring(r.extraction_date_value, 1, 10) < ${endExcl})
        OR
        ((r.extraction_date_value IS NULL OR r.extraction_date_value !~ '^\\d{4}-\\d{2}-\\d{2}')
          AND r.created_at >= ${start + "T00:00:00Z"} AND r.created_at < ${endExcl + "T00:00:00Z"})
      )
  `);
  return rows.filter((r) => (Number(r.pricing_total_paid) || 0) > 0);
}

function pickArchetype(input: {
  receipts: WeekReceiptRow[];
  total: number;
  merchantTotals: Map<string, { total: number; visits: number }>;
  categoryTotals: Map<string, number>;
  itemizedTotal: number;
  previousArchetype: WeekArchetype | null;
}): { archetype: WeekArchetype; category: string | null } {
  const { receipts, total, merchantTotals, categoryTotals, itemizedTotal, previousArchetype } = input;

  const nightCount = receipts.filter((r) => { const h = rowHour(r); return h != null && (h >= 21 || h < 6); }).length;
  const earlyCount = receipts.filter((r) => { const h = rowHour(r); return h != null && h >= 6 && h < 9; }).length;
  const weekendSpend = receipts.reduce((s, r) => {
    const dow = new Date(rowDate(r) + "T00:00:00Z").getUTCDay();
    return dow === 0 || dow === 6 ? s + (Number(r.pricing_total_paid) || 0) : s;
  }, 0);
  const topMerchant = [...merchantTotals.entries()].sort((a, b) => b[1].total - a[1].total)[0];
  const topCategory = [...categoryTotals.entries()].filter(([k]) => k !== "other").sort((a, b) => b[1] - a[1])[0];

  // Rarest-first candidate order; the previous week's archetype is skipped so
  // two consecutive ledgers never open with the same headline.
  const candidates: { key: WeekArchetype; ok: boolean; category?: string }[] = [
    { key: "night_shift", ok: nightCount >= 2 },
    { key: "early_bird", ok: earlyCount >= 2 },
    { key: "single_fort", ok: receipts.length >= 3 && !!topMerchant && total > 0 && topMerchant[1].total / total >= 0.6 },
    { key: "explorer", ok: merchantTotals.size >= 4 },
    { key: "weekend_run", ok: total > 0 && weekendSpend / total >= 0.6 },
    { key: "category_week", ok: !!topCategory && itemizedTotal > 0 && topCategory[1] / itemizedTotal >= 0.5, category: topCategory?.[0] },
    { key: "steady_log", ok: true },
  ];
  const eligible = candidates.filter((c) => c.ok);
  const fresh = eligible.find((c) => c.key !== previousArchetype) ?? eligible[0];
  return { archetype: fresh.key, category: fresh.key === "category_week" ? fresh.category ?? null : null };
}

async function pickWildcard(input: {
  username: string;
  weekStart: string;
  currency: string;
  total: number;
  receipts: WeekReceiptRow[];
  weekItems: { canonical: string | null; name: string; unitPrice: number }[];
  merchantTotals: Map<string, { total: number; visits: number }>;
  categoryTotals: Map<string, number>;
  trailingCategoryAvg: Map<string, number>;
}): Promise<WildcardInsight | null> {
  const { username, weekStart, currency, total, receipts, weekItems, merchantTotals, categoryTotals, trailingCategoryAvg } = input;

  const pool: (() => Promise<WildcardInsight | null>)[] = [
    // Own price track: the same item bought this week and before, price moved ≥3%.
    async () => {
      if (!sql) return null;
      const names = [...new Set(weekItems.filter((i) => i.canonical && i.unitPrice > 0).map((i) => i.canonical as string))].slice(0, 80);
      if (names.length === 0) return null;
      const prev = toRows<{ canonical_name: string; unit_price_gross: string | number; d: string }>(await sql`
        SELECT DISTINCT ON (li.canonical_name)
               li.canonical_name, li.unit_price_gross,
               CASE WHEN r.extraction_date_value ~ '^\\d{4}-\\d{2}-\\d{2}'
                    THEN substring(r.extraction_date_value, 1, 10)
                    ELSE to_char(r.created_at, 'YYYY-MM-DD') END AS d
        FROM receipt_line_items li
        JOIN receipts r ON r.receipt_id = li.receipt_id
        WHERE r.username = ${username}
          AND li.canonical_name = ANY(${names})
          AND li.unit_price_gross > 0
          AND r.pricing_currency = ${currency}
          AND CASE WHEN r.extraction_date_value ~ '^\\d{4}-\\d{2}-\\d{2}'
                   THEN substring(r.extraction_date_value, 1, 10)
                   ELSE to_char(r.created_at, 'YYYY-MM-DD') END < ${weekStart}
        ORDER BY li.canonical_name, d DESC
      `);
      let best: WildcardInsight | null = null, bestDelta = 0.03;
      for (const p of prev) {
        const nowItem = weekItems.find((i) => i.canonical === p.canonical_name && i.unitPrice > 0);
        const prevPrice = Number(p.unit_price_gross) || 0;
        if (!nowItem || prevPrice <= 0) continue;
        const delta = Math.abs(nowItem.unitPrice - prevPrice) / prevPrice;
        if (delta > bestDelta) {
          bestDelta = delta;
          best = { kind: "price_repeat", item: nowItem.name, thisPrice: nowItem.unitPrice, prevPrice, prevDate: String(p.d).slice(0, 10) };
        }
      }
      return best;
    },
    // Night share of the week's spend.
    async () => {
      const night = receipts.filter((r) => { const h = rowHour(r); return h != null && (h >= 21 || h < 6); });
      if (night.length < 2 || total <= 0) return null;
      const share = night.reduce((s, r) => s + (Number(r.pricing_total_paid) || 0), 0) / total;
      return share >= 0.2 ? { kind: "night_share", share, count: night.length } : null;
    },
    // Merchant loyalty: repeated visits to one place.
    async () => {
      const top = [...merchantTotals.entries()].sort((a, b) => b[1].visits - a[1].visits)[0];
      if (!top || top[1].visits < 3) return null;
      return { kind: "loyalty", merchant: top[0], visits: top[1].visits, total: Math.round(top[1].total) };
    },
    // Category pulse: this week's top category vs its own trailing-3-week average.
    async () => {
      const top = [...categoryTotals.entries()].filter(([k]) => k !== "other").sort((a, b) => b[1] - a[1])[0];
      if (!top) return null;
      const avg = trailingCategoryAvg.get(top[0]) ?? 0;
      if (avg <= 0) return null;
      const delta = Math.abs(top[1] - avg) / avg;
      return delta >= 0.15 ? { kind: "category_pulse", categoryKey: top[0], total: Math.round(top[1]), trailingAvg: Math.round(avg) } : null;
    },
  ];

  // Rotate the starting slot by ISO-ish week index + username so the wildcard
  // section changes type from week to week and user to user.
  const weekIndex = Math.floor(new Date(weekStart + "T00:00:00Z").getTime() / (7 * 86400000));
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = 0; i < pool.length; i++) {
    const candidate = await pool[(weekIndex + hash + i) % pool.length]().catch(() => null);
    if (candidate) return candidate;
  }
  return null;
}

/**
 * Builds the closed-week report for [weekStart, weekStart+7). Returns null for
 * a week with no verified receipts in the user's primary currency.
 */
async function buildWeeklyReport(username: string, weekStart: string): Promise<WeeklyLedgerReport | null> {
  if (!sql) return null;
  const endExcl = addDays(weekStart, 7);
  const weekEnd = addDays(weekStart, 6);

  const all = await fetchWindowReceipts(username, weekStart, endExcl);
  if (all.length === 0) return null;

  const currency = pickPrimaryCurrency(all.map((r) => r.pricing_currency));
  if (!currency) return null;
  const receipts = all.filter((r) => sameCur(r.pricing_currency, currency));
  if (receipts.length === 0) return null;

  const receiptIds = receipts.map((r) => r.receipt_id);
  let total = 0, hiddenTotal = 0, vatTotal = 0;
  const dailyTotals = new Array(7).fill(0);
  const dailyCounts = new Array(7).fill(0);
  const merchantTotals = new Map<string, { total: number; visits: number }>();
  let biggest: WeeklyMoment | null = null;

  for (const r of receipts) {
    const amount = Number(r.pricing_total_paid) || 0;
    const hiddenCore = Number(r.hidden_cost_core) || 0;
    total += amount;
    hiddenTotal += Math.min(hiddenCore, amount);
    vatTotal += Math.min(Number(r.pricing_vat_amount) || 0, amount);
    const idx = Math.min(6, Math.max(0, Math.round((new Date(rowDate(r) + "T00:00:00Z").getTime() - new Date(weekStart + "T00:00:00Z").getTime()) / 86400000)));
    dailyTotals[idx] += amount;
    dailyCounts[idx] += 1;
    const name = (r.merchant_name || "").trim();
    if (name) {
      const cur = merchantTotals.get(name) ?? { total: 0, visits: 0 };
      cur.total += amount;
      cur.visits += 1;
      merchantTotals.set(name, cur);
    }
    if (!biggest || amount > biggest.total) {
      biggest = {
        merchant: name || "—",
        total: Math.round(amount * 100) / 100,
        date: rowDate(r),
        time: (r.extraction_time_value || "").slice(0, 5) || null,
        receiptId: r.receipt_id,
      };
    }
  }

  // The ledger's entries — every receipt of the week, chronological.
  const entries: WeeklyEntry[] = receipts
    .map((r) => ({
      date: rowDate(r),
      time: (r.extraction_time_value || "").slice(0, 5) || null,
      merchant: (r.merchant_name || "").trim() || "—",
      total: Math.round((Number(r.pricing_total_paid) || 0) * 100) / 100,
      receiptId: r.receipt_id,
    }))
    .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
    .slice(0, 30);

  // Line items → category slices + wildcard inputs.
  // Line items carry no currency column — they inherit it from their receipt,
  // and receiptIds is already filtered to the week's primary currency.
  const itemRows = toRows<{
    receipt_id: string; raw_name: string | null; canonical_name: string | null;
    category_lvl1: string | null; category_lvl2: string | null;
    quantity: string | number | null; unit_price_gross: string | number | null;
    line_total_gross: string | number | null;
  }>(await sql`
    SELECT receipt_id, raw_name, canonical_name, category_lvl1, category_lvl2,
           quantity, unit_price_gross, line_total_gross
    FROM receipt_line_items
    WHERE receipt_id = ANY(${receiptIds})
  `);

  const categoryTotals = new Map<string, number>();
  let itemizedTotal = 0;
  const weekItems: { canonical: string | null; name: string; unitPrice: number }[] = [];
  for (const it of itemRows) {
    const amt = Number(it.line_total_gross) || 0;
    if (amt <= 0) continue;
    const canon = resolveCategoryLvl1(it.category_lvl1, it.category_lvl2);
    const key = canon && canon !== "other" ? canon : "other";
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + amt);
    itemizedTotal += amt;
    weekItems.push({
      canonical: it.canonical_name,
      name: itemDisplayName(it.canonical_name, it.raw_name),
      unitPrice: Number(it.unit_price_gross) || 0,
    });
  }
  const named = [...categoryTotals.entries()].filter(([k]) => k !== "other").sort((a, b) => b[1] - a[1]);
  const categories: WeeklyCategorySlice[] = named.slice(0, 3).map(([key, t]) => ({ key, total: Math.round(t) }));
  const otherTotal = (categoryTotals.get("other") ?? 0) + named.slice(3).reduce((s, [, v]) => s + v, 0);
  if (otherTotal > 0) categories.push({ key: "other", total: Math.round(otherTotal) });

  // Basket highlights — repeat purchases of the same item folded together.
  const itemAgg = new Map<string, WeeklyTopItem>();
  for (const it of itemRows) {
    const amt = Number(it.line_total_gross) || 0;
    const name = itemDisplayName(it.canonical_name, it.raw_name);
    if (amt <= 0 || !name) continue;
    const key = name.toLocaleLowerCase();
    const cur = itemAgg.get(key) ?? { name, quantity: null, occurrences: 0, total: 0 };
    cur.occurrences += 1;
    cur.total += amt;
    const qty = it.quantity != null ? Number(it.quantity) : null;
    if (qty != null && Number.isFinite(qty) && qty > 0) cur.quantity = (cur.quantity ?? 0) + qty;
    itemAgg.set(key, cur);
  }
  const topItems = [...itemAgg.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((i) => ({ ...i, total: Math.round(i.total * 100) / 100 }));

  // Trailing 3 weeks — self-comparison baseline (same currency only).
  const trailingStart = addDays(weekStart, -21);
  const prior = await fetchWindowReceipts(username, trailingStart, weekStart);
  const priorSame = prior.filter((r) => sameCur(r.pricing_currency, currency));
  const weekTotals = new Map<number, number>();
  const trailingCategoryTotals = new Map<string, number>();
  for (const r of priorSame) {
    const idx = Math.floor((new Date(rowDate(r) + "T00:00:00Z").getTime() - new Date(trailingStart + "T00:00:00Z").getTime()) / (7 * 86400000));
    weekTotals.set(idx, (weekTotals.get(idx) ?? 0) + (Number(r.pricing_total_paid) || 0));
  }
  if (priorSame.length > 0) {
    const priorIds = priorSame.map((r) => r.receipt_id);
    const priorItems = toRows<{ category_lvl1: string | null; category_lvl2: string | null; line_total_gross: string | number | null }>(await sql`
      SELECT category_lvl1, category_lvl2, line_total_gross
      FROM receipt_line_items WHERE receipt_id = ANY(${priorIds})
    `);
    for (const it of priorItems) {
      const amt = Number(it.line_total_gross) || 0;
      if (amt <= 0) continue;
      const canon = resolveCategoryLvl1(it.category_lvl1, it.category_lvl2);
      const key = canon && canon !== "other" ? canon : "other";
      trailingCategoryTotals.set(key, (trailingCategoryTotals.get(key) ?? 0) + amt);
    }
  }
  const trailingWeeks = weekTotals.size;
  const trailingAvg = trailingWeeks > 0 ? [...weekTotals.values()].reduce((s, v) => s + v, 0) / trailingWeeks : null;
  const priorWeekTotals = [0, 1, 2].map((i) => Math.round(weekTotals.get(i) ?? 0));
  const trailingCategoryAvg = new Map<string, number>();
  if (trailingWeeks > 0) {
    for (const [k, v] of trailingCategoryTotals) trailingCategoryAvg.set(k, v / trailingWeeks);
  }

  // Previous frozen report (if any) — used to avoid a repeated headline.
  let previousArchetype: WeekArchetype | null = null;
  try {
    await ensureWeeklyReportsTable();
    const prevRows = toRows<{ report: { archetype?: WeekArchetype } }>(await sql`
      SELECT report FROM weekly_reports
      WHERE username = ${username} AND week_start = ${addDays(weekStart, -7)} LIMIT 1
    `);
    previousArchetype = prevRows[0]?.report?.archetype ?? null;
  } catch { /* headline freshness is best-effort */ }

  const { archetype, category: archetypeCategory } = pickArchetype({
    receipts, total, merchantTotals, categoryTotals, itemizedTotal, previousArchetype,
  });

  const wildcard = await pickWildcard({
    username, weekStart, currency, total, receipts, weekItems, merchantTotals, categoryTotals, trailingCategoryAvg,
  });

  // Rewards earned on this week's receipts (bINT — the unit the result screen shows).
  const rewardRows = toRows<{ points: string | number }>(await sql`
    SELECT COALESCE(SUM(bint_bonus_amount), 0) AS points
    FROM receipt_rewards WHERE receipt_id = ANY(${receiptIds})
  `.catch(() => []));
  const points = Math.round(Number(rewardRows[0]?.points) || 0);

  const xpRows = toRows<{ xp: string | number }>(await sql`
    SELECT COALESCE(SUM(xp_delta), 0) AS xp FROM season_xp_events
    WHERE username = ${username}
      AND created_at >= ${weekStart + "T00:00:00Z"} AND created_at < ${endExcl + "T00:00:00Z"}
  `.catch(() => []));
  const seasonXpGained = Math.round(Number(xpRows[0]?.xp) || 0);

  const questRows = toRows<{ n: string | number }>(await sql`
    SELECT COUNT(*)::int AS n FROM user_quests
    WHERE username = ${username} AND status = 'completed'
      AND completed_at >= ${weekStart + "T00:00:00Z"} AND completed_at < ${endExcl + "T00:00:00Z"}
  `.catch(() => []));
  const questsCompleted = Number(questRows[0]?.n) || 0;

  const profileRows = toRows<{ season_level: string | number | null }>(await sql`
    SELECT season_level FROM user_profiles WHERE username = ${username} LIMIT 1
  `.catch(() => []));
  const seasonLevel = profileRows[0]?.season_level != null ? Number(profileRows[0].season_level) : null;

  // Month-end projection from the ledger month of weekEnd, frozen at build time.
  let forecast: WeeklyLedgerReport["forecast"] = null;
  const month = weekEnd.slice(0, 7);
  const monthStart = month + "-01";
  const daysElapsed = Number(weekEnd.slice(8, 10));
  if (daysElapsed >= 7) {
    const monthRows = await fetchWindowReceipts(username, monthStart, addDays(weekEnd, 1));
    const monthSoFar = monthRows.filter((r) => sameCur(r.pricing_currency, currency)).reduce((s, r) => s + (Number(r.pricing_total_paid) || 0), 0);
    if (monthSoFar > 0) {
      const daysInMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
      forecast = {
        monthSoFar: Math.round(monthSoFar),
        monthProjected: Math.round((monthSoFar / daysElapsed) * daysInMonth),
        month,
      };
    }
  }

  // Low-data week (1–2 receipts): the ledger becomes a deep-dive of the
  // largest receipt instead of a hollow stats sequence.
  const mode: WeeklyLedgerReport["mode"] = receipts.length <= 2 ? "single" : "full";
  let singleReceipt: SingleReceiptDive | null = null;
  if (mode === "single" && biggest) {
    const items = itemRows
      .filter((it) => it.receipt_id === biggest!.receiptId && (Number(it.line_total_gross) || 0) > 0)
      .sort((a, b) => (Number(b.line_total_gross) || 0) - (Number(a.line_total_gross) || 0))
      .slice(0, 12)
      .map((it) => ({
        name: itemDisplayName(it.canonical_name, it.raw_name) || "—",
        quantity: it.quantity != null ? Number(it.quantity) : null,
        lineTotal: Math.round((Number(it.line_total_gross) || 0) * 100) / 100,
      }));
    const src = receipts.find((r) => r.receipt_id === biggest!.receiptId);
    const srcTotal = Number(src?.pricing_total_paid) || 0;
    singleReceipt = {
      merchant: biggest.merchant,
      date: biggest.date,
      time: biggest.time,
      total: biggest.total,
      hidden: Math.round(Math.min(Number(src?.hidden_cost_core) || 0, srcTotal)),
      items,
    };
  }

  return {
    weekStart,
    weekEnd,
    currency,
    receiptCount: receipts.length,
    total: Math.round(total),
    trailingAvg: trailingAvg != null ? Math.round(trailingAvg) : null,
    trailingWeeks,
    hiddenTotal: Math.round(hiddenTotal),
    hiddenShare: total > 0 ? hiddenTotal / total : null,
    dailyTotals: dailyTotals.map((v) => Math.round(v)),
    dailyCounts,
    priorWeekTotals,
    vatTotal: Math.round(vatTotal),
    entries,
    topItems,
    topMerchant: (() => {
      const top = [...merchantTotals.entries()].sort((a, b) => b[1].total - a[1].total)[0];
      return top ? { name: top[0], total: Math.round(top[1].total), visits: top[1].visits } : null;
    })(),
    distinctMerchants: merchantTotals.size,
    categories,
    biggestReceipt: biggest,
    archetype,
    archetypeCategory,
    wildcard,
    points,
    seasonXpGained,
    questsCompleted,
    seasonLevel,
    forecast,
    mode,
    singleReceipt,
  };
}

/** Frozen report for the week, building + freezing it when absent. */
export async function getOrFreezeWeeklyReport(username: string, weekStart: string): Promise<WeeklyLedgerReport | null> {
  if (!sql) return null;
  await ensureWeeklyReportsTable();
  const rows = toRows<{ report: WeeklyLedgerReport }>(await sql`
    SELECT report FROM weekly_reports WHERE username = ${username} AND week_start = ${weekStart} LIMIT 1
  `);
  if (rows.length > 0) return rows[0].report;

  const report = await buildWeeklyReport(username, weekStart);
  if (!report) return null;
  await sql`
    INSERT INTO weekly_reports (username, week_start, report)
    VALUES (${username}, ${weekStart}, ${JSON.stringify(report)}::jsonb)
    ON CONFLICT (username, week_start) DO NOTHING
  `;
  return report;
}

/** Frozen weeks available for the archive strip, newest first. */
export async function listFrozenWeeks(username: string, limit = 12): Promise<string[]> {
  if (!sql) return [];
  await ensureWeeklyReportsTable();
  const rows = toRows<{ week_start: string }>(await sql`
    SELECT to_char(week_start, 'YYYY-MM-DD') AS week_start
    FROM weekly_reports WHERE username = ${username}
    ORDER BY week_start DESC LIMIT ${limit}
  `);
  return rows.map((r) => r.week_start);
}
