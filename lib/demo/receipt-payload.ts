import { DEMO_DISPLAY_NAME, DEMO_LINE_SOURCE, DEMO_USERNAME } from "./constants";
import type { PlannedReceipt } from "./plan";

export interface DemoReceiptRow {
  receipt_id: string;
  username: string;
  status: string;
  proof_status: string;
  merchant_name: string;
  merchant_category: string;
  merchant_country: string;
  merchant_city: string;
  merchant_district: string;
  pricing_currency: string;
  pricing_symbol: string;
  pricing_total_paid: number;
  pricing_vat_amount: number;
  pricing_paid_ex_tax: number;
  pricing_import_system_rate: number;
  pricing_retail_hidden_rate: number;
  hidden_cost_reference_price: number;
  hidden_cost_core: number;
  hidden_cost_breakdown_import_system: number;
  hidden_cost_breakdown_retail_hidden: number;
  reward_conversion_rate: number;
  reward_raw: number;
  reward_final: number;
  reward_token: string;
  receipt_data: string;
  expense_type: string;
  document_type: string;
  extraction_date_value: string;
  extraction_time_value: string;
  extraction_total_value: number;
  payment_proven: boolean;
  created_at: string;
  updated_at: string;
  source: string;
}

export interface DemoLineRow {
  receipt_id: string;
  raw_name: string;
  canonical_name: string;
  brand: string | null;
  pack_size: string | null;
  unit_type: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  unit_price_gross: number;
  line_total_gross: number;
  vat_rate: number;
  category_lvl1: string;
  category_path: string;
  hidden_cost_line: number;
  observed_at: string;
  source: string;
  line_kind: string;
}

const R2 = (x: number) => Math.round(x * 100) / 100;

function iso(d: Date): string {
  return d.toISOString();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateForDayAgo(now: Date, dayAgo: number, hour: number, minute: number): Date {
  const d = new Date(now.getTime() - dayAgo * 86400000);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

export function buildReceiptRows(
  plan: PlannedReceipt[],
  now: Date,
  newId: () => string
): Array<{ receipt: DemoReceiptRow; lines: DemoLineRow[]; cpoints: number; when: Date }> {
  return plan.map((p) => {
    const id = newId();
    const when = dateForDayAgo(now, p.dayAgo, p.hour, p.minute);
    const vatRate = p.merchant.category === "fuel" ? 0.2 : 0.1;
    const vat = R2(p.total * vatRate / (1 + vatRate));
    const cpoints = R2(Math.min(55, 8 + p.total * 0.015));
    const time = `${pad(p.hour)}:${pad(p.minute)}`;
    const dateStr = iso(when).slice(0, 10);
    const ratio = p.total > 0 ? p.hidden / p.total : 0.28;

    const receipt: DemoReceiptRow = {
      receipt_id: id,
      username: DEMO_USERNAME,
      status: "verified",
      proof_status: "matched",
      merchant_name: p.merchant.name,
      merchant_category: p.merchant.category,
      merchant_country: "TR",
      merchant_city: "İstanbul",
      merchant_district: p.merchant.district,
      pricing_currency: "TRY",
      pricing_symbol: "₺",
      pricing_total_paid: p.total,
      pricing_vat_amount: vat,
      pricing_paid_ex_tax: R2(p.total - vat),
      pricing_import_system_rate: 0.18,
      pricing_retail_hidden_rate: 0.12,
      hidden_cost_reference_price: R2(p.total - p.hidden),
      hidden_cost_core: p.hidden,
      hidden_cost_breakdown_import_system: R2(p.hidden * 0.6),
      hidden_cost_breakdown_retail_hidden: R2(p.hidden * 0.4),
      reward_conversion_rate: 1,
      reward_raw: cpoints,
      reward_final: cpoints,
      reward_token: "cPoints",
      expense_type: "personal",
      document_type: p.documentType,
      extraction_date_value: dateStr,
      extraction_time_value: time,
      extraction_total_value: p.total,
      payment_proven: true,
      created_at: iso(when),
      updated_at: iso(when),
      source: JSON.stringify({ app: "yumo", captureType: DEMO_LINE_SOURCE }),
      receipt_data: JSON.stringify({
        receiptId: id,
        username: DEMO_USERNAME,
        status: "verified",
        createdAt: iso(when),
        expenseType: "personal",
        documentType: p.documentType,
        paymentProven: true,
        merchant: {
          name: p.merchant.name,
          category: p.merchant.category,
          country: "TR",
          city: "İstanbul",
          district: p.merchant.district,
        },
        extraction: {
          date: { value: dateStr, confidence: 0.98 },
          time: { value: time, confidence: 0.95 },
          total: { value: p.total, confidence: 0.97, currency: "TRY" },
          vat: { value: vat, confidence: 0.9, rate: vatRate },
        },
        pricing: {
          currency: "TRY",
          symbol: "₺",
          totalPaid: p.total,
          vatAmount: vat,
          paidExTax: R2(p.total - vat),
          vatRate,
        },
        hiddenCost: {
          hiddenCostCore: p.hidden,
          referencePrice: R2(p.total - p.hidden),
          provenance: "sector_average",
          breakdown: {
            importSystemCost: R2(p.hidden * 0.6),
            retailHiddenCost: R2(p.hidden * 0.4),
            items: [
              {
                label: "Import & System",
                amount: R2(p.hidden * 0.6),
                bucket: "supply",
                estimated: true,
                description: "Import chain and system costs embedded in shelf prices.",
              },
              {
                label: "Retail & Brand",
                amount: R2(p.hidden * 0.4),
                bucket: "retail",
                estimated: true,
                description: "Retail margin and brand costs embedded in shelf prices.",
              },
            ],
          },
        },
        reward: { conversionRate: 1, raw: cpoints, final: cpoints, token: "cPoints", capsApplied: [] },
        flags: { needsLLM: false, reasons: [] },
        ocr: { lines: [], rawText: p.lines.map((l) => l.raw).join("\n") },
        verification: { isDuplicate: false },
        geminiLineItems: p.lines.map((l) => ({
          name: l.raw,
          brand: l.brand,
          quantity: l.qty,
          unitPrice: l.unitPrice,
          totalPrice: R2(l.unitPrice * l.qty),
          category: l.cat1,
        })),
      }),
    };

    const lines: DemoLineRow[] = p.lines.map((l) => {
      const lineTotal = R2(l.unitPrice * l.qty);
      return {
        receipt_id: id,
        raw_name: l.raw,
        canonical_name: l.canon,
        brand: l.brand,
        pack_size: l.pack != null ? String(l.pack) : null,
        unit_type: l.unit,
        quantity: l.qty,
        unit_price: l.unitPrice,
        line_total: lineTotal,
        unit_price_gross: l.unitPrice,
        line_total_gross: lineTotal,
        vat_rate: vatRate * 100,
        category_lvl1: l.cat1,
        category_path: l.path,
        hidden_cost_line: R2(lineTotal * ratio),
        observed_at: iso(when),
        source: DEMO_LINE_SOURCE,
        line_kind: "product",
      };
    });

    return { receipt, lines, cpoints, when };
  });
}

export { DEMO_DISPLAY_NAME };
