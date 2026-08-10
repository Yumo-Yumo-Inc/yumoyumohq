/**
 * Run: node --experimental-strip-types lib/analysis/__tests__/comparable-unit-price.check.ts
 */
import { comparableUnitPrice, inferPackCountFromName } from "../comparable-unit-price.ts";
import { parsePackCount } from "../../receipt/pack-size.ts";
import { filterOutlierValues } from "../price-sanity.ts";

function assertEq(label: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    console.error(`FAIL ${label}: got ${g} want ${w}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${label}`);
  }
}

assertEq("parse 30adet", parsePackCount("30adet"), 30);
assertEq("infer 30'lu", inferPackCountFromName("Yumurta 30'lu"), 30);
assertEq("infer 15LI", inferPackCountFromName("YUMURTA 15LI L"), 15);
assertEq("infer 6x200ml", inferPackCountFromName("Maden Suyu 6x200ml"), 6);
assertEq("infer 12x500ml", inferPackCountFromName("Hayat Su 12x500ml"), 12);
assertEq("infer bare null", inferPackCountFromName("Yumurta"), null);

assertEq(
  "30'lu carton → per egg",
  comparableUnitPrice({
    name: "Yumurta 30'lu",
    quantity: 1,
    unitPrice: 99,
    lineTotal: 99,
    packSize: null,
  }),
  3.3,
);

assertEq(
  "pack_size 15adet column",
  comparableUnitPrice({
    name: "Yumurta",
    quantity: 1,
    unitPrice: 99,
    lineTotal: 99,
    packSize: "15adet",
  }),
  6.6,
);

assertEq(
  "6x200ml → per bottle",
  comparableUnitPrice({
    name: "Maden Suyu 6x200ml",
    quantity: 1,
    unitPrice: 90,
    lineTotal: 90,
  }),
  15,
);

assertEq(
  "umbrella ekmek excluded",
  comparableUnitPrice({
    name: "Ekmek",
    quantity: 1,
    unitPrice: 15,
    lineTotal: 15,
  }),
  null,
);

assertEq(
  "bare yumurta carton excluded",
  comparableUnitPrice({
    name: "Yumurta",
    quantity: 1,
    unitPrice: 200,
    lineTotal: 200,
    packSize: null,
    unitType: "adet",
  }),
  null,
);

assertEq(
  "alpha bare range collapses",
  filterOutlierValues(
    [200, 200, 100, 200]
      .map((lt) =>
        comparableUnitPrice({
          name: "Yumurta",
          quantity: 1,
          unitPrice: lt,
          lineTotal: lt,
          unitType: "adet",
        }),
      )
      .filter((p): p is number => p != null),
  ),
  [],
);

console.log(process.exitCode ? "FAILED" : "ALL PASS");
