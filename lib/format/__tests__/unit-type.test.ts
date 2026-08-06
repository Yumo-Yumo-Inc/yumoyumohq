import { formatQtyWithUnit, formatUnitType } from "../unit-type.ts";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(formatUnitType("adet", "en") === "pcs", "adet→pcs en");
assert(formatUnitType("adet", "tr") === "adet", "adet→adet tr");
assert(formatUnitType("adet", "th") === "ชิ้น", "adet→ชิ้น th");
assert(formatUnitType("PCS", "en") === "pcs", "pcs alias");
assert(formatUnitType("kg", "en") === "kg", "kg passthrough");
assert(formatUnitType(null, "en") === null, "null unit");
assert(formatQtyWithUnit(2, "adet", "en") === "2 pcs", "qty+unit en");
assert(formatQtyWithUnit(1, "adet", "tr") === "1 adet", "qty+unit tr");
assert(formatQtyWithUnit(1.25, "kg", "en") === "1.25 kg", "fractional kg");

console.log("unit-type.format: ok");
