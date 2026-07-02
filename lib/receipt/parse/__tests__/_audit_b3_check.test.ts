import { parseMachineOutput } from "../machine-block.ts";

function show(label: string, raw: string) {
  const r = parseMachineOutput(raw);
  console.log(`\n=== ${label} | currency=${r.data?.currency} total_paid=${r.data?.total_paid} total_vat=${r.data?.total_vat} ===`);
  for (const it of r.line_items) {
    console.log(`  name=${JSON.stringify(it.name)} qty=${it.qty} unit=${it.unit} unitPrice=${it.unit_price} total=${it.total} vat=${it.vat_rate}`);
  }
}

// lokum — TR, 7-col, ET qty=1.350 unit=2850 total=3847.50
show("lokum (TR)", `x
<YUMO_MACHINE_DATA>
country_code: TR
currency: TRY
total_paid: 5327.50
</YUMO_MACHINE_DATA>
<YUMO_LINE_ITEMS>
LINE | NAME | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | Coca Cola (33ml) | 3 | adet | 80 | 240 | null
2 | ET | 1.350 | adet | 2850 | 3847.50 | null
3 | Kabak Tatlısı | 2 | adet | 250 | 500 | null
</YUMO_LINE_ITEMS>`);

// Kebon Iel — IDR, unit_price 18.000 should -> 18000, total 36.000 -> 36000
show("Kebon (IDR)", `x
<YUMO_MACHINE_DATA>
country_code: ID
currency: IDR
total_paid: 526.200
</YUMO_MACHINE_DATA>
<YUMO_LINE_ITEMS>
LINE | NAME | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | Hot Teh Jawa Tawar | 2 | adet | 18.000 | 36.000 | null
4 | Gulai Kakap | 1 | adet | 305.000 | 305.000 | null
</YUMO_LINE_ITEMS>`);

// TÜRKMEMELER — TR, unit_price 2699.7147 (4-decimal), qty m2 2.88
show("TURKMEMELER (TR)", `x
<YUMO_MACHINE_DATA>
country_code: TR
currency: TRY
total_paid: 53750.00
</YUMO_MACHINE_DATA>
<YUMO_LINE_ITEMS>
LINE | NAME | QTY | UNIT | UNIT_PRICE | TOTAL | VAT_RATE
1 | BAHÇ ECM-5E | 2.88 | m2 | 2699.7147 | 7775.18 | null
</YUMO_LINE_ITEMS>`);
