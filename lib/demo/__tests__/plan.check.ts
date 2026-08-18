import { CANONICAL_RECEIPT_CATEGORIES } from "@/lib/receipt/categories";
import { DEMO_MONTH_SPEND_TRY } from "../constants";
import { buildDemoPlan } from "../plan";

const now = new Date(Date.UTC(2026, 7, 14, 12, 0, 0));
const plan = buildDemoPlan(now);
const current = plan.filter((r) => r.dayAgo < 14);
const monthTotal = current.reduce((s, r) => s + r.total, 0);
const sectors = new Set(plan.map((r) => r.merchant.category));
const missing = CANONICAL_RECEIPT_CATEGORIES.filter((c) => !sectors.has(c));

console.log("receipts", plan.length);
console.log("current_month", Math.round(monthTotal * 100) / 100);
console.log("sectors", [...sectors].sort().join(","));
if (missing.length) {
  console.error("missing sectors", missing);
  process.exit(1);
}
if (Math.abs(monthTotal - DEMO_MONTH_SPEND_TRY) > 5) {
  console.error("month total off", monthTotal);
  process.exit(1);
}
console.log("plan ok");
