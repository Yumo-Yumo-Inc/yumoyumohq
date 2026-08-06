/**
 * The two cases that pull in opposite directions must BOTH come out right:
 * the fridge whose line_total held a tax rate, and the diesel whose unit_price
 * held a decimal error. A fix that gets one and breaks the other is not a fix.
 */
import { normalizeUnit, classifyLine, normalizeCurrency, normalizeCity, packFromName } from "@/lib/prices/engine/clean-layer";

const mk = (o: Partial<Parameters<typeof normalizeUnit>[0]>) =>
  ({ id: 1, canonicalId: "x", rawName: "", merchant: "Migros", category: "", unitPrice: 0, quantity: 1, lineTotal: null, unitType: "", currency: "TRY", obsDate: "2026-05-01", ...o }) as Parameters<typeof normalizeUnit>[0];

const cases: [string, ReturnType<typeof normalizeUnit>, number][] = [
  ["Bosch buzdolabı: lt=0.2 vergi oranı, up=43248 gerçek",
    normalizeUnit(mk({ rawName: "Bosch KGP76AWC0N", unitPrice: 43248.33, quantity: 1, lineTotal: 0.2 })), 43248.33],
  ["AED Still Water: lt=0.05 (BAE %5), up=100 gerçek",
    normalizeUnit(mk({ rawName: "Still Water 800", unitPrice: 100, quantity: 1, lineTotal: 0.05 })), 100],
  ["Motorin: up=64490 ondalık hatası, lt=64.47 gerçek → BOZULMAMALI",
    normalizeUnit(mk({ rawName: "Motorin", unitPrice: 64490, quantity: 1, lineTotal: 64.47 })), 64.47],
  ["Yakıt pompası: up=45/lt, qty=30, lt=1350 → lt/qty korunmalı",
    normalizeUnit(mk({ rawName: "Motorin", unitPrice: 45, quantity: 30, lineTotal: 1350 })), 45],
  ["Miktar takası: up=1350 (toplam yazılmış), qty=30, lt=1350 → lt/qty düzeltmeli",
    normalizeUnit(mk({ rawName: "Benzin", unitPrice: 1350, quantity: 30, lineTotal: 1350 })), 45],
  ["Gerçekten ucuz ürün: up=0.50, qty=1, lt=0.50 → dokunulmamalı",
    normalizeUnit(mk({ rawName: "Sakız", unitPrice: 0.5, quantity: 1, lineTotal: 0.5 })), 0.5],
  ["Tartılı: up=80/kg, qty=0.4, lt=32 → lt/qty korunmalı",
    normalizeUnit(mk({ rawName: "Domates", unitPrice: 80, quantity: 0.4, lineTotal: 32 })), 80],
  // The case that broke: 209g of banana. lt<1 is legitimate below one unit, and the
  // unit price is the broken half (4,500 = 4.50 read as four thousand five hundred).
  ["209g muz: up=4500 ondalık hatası, qty=0.209, lt=0.93 → 4.45 KALMALI",
    normalizeUnit(mk({ rawName: "Muz", unitPrice: 4500, quantity: 0.209, lineTotal: 0.93, currency: "BRL" })), 4.4498],
  ["96g soğan: up=7950, qty=0.096, lt=0.76 → 7.92 KALMALI",
    normalizeUnit(mk({ rawName: "Beyaz Soğan", unitPrice: 7950, quantity: 0.096, lineTotal: 0.76, currency: "BRL" })), 7.9166],
];

let pass = 0;
console.log("── normalizeUnit");
for (const [name, got, want] of cases) {
  const ok = Math.abs(got.price - want) < 0.01;
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗ BOZUK"}  ${name}`);
  if (!ok) console.log(`        beklenen ${want}, çıkan ${got.price}`);
}

const today = "2026-07-17";
console.log("\n── Yakıt: pompa toplamı litre fiyatı diye yayımlanmamalı");
const fuelCases: [string, string][] = [
  ["Excellium Motorin", "excluded"],  // up=3078 toplam, lt=0.2 oran, qty yok
];
for (const [name, want] of fuelCases) {
  const v = classifyLine(mk({ rawName: name, unitPrice: 3078.94, quantity: 1, lineTotal: 0.2 }), 3000, 5, null, today);
  const ok = v.disposition === want;
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗ BOZUK"}  "${name}" up=3078.94 lt=0.2 → ${v.disposition} (${v.reason})`);
}
// Fuel priced properly still works: 45/litre, 30 litres, 1350 total.
{
  const v = classifyLine(mk({ rawName: "Motorin", unitPrice: 45, quantity: 30, lineTotal: 1350 }), 45, 5, null, today);
  const ok = v.disposition === "clean";
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗ BOZUK"}  "Motorin" 45/lt × 30lt → ${v.disposition} (litre fiyatı korunmalı)`);
}
{
  // Pump total as unit price, no litre count — must be withheld.
  const v = classifyLine(mk({ rawName: "Excellium Motorin", unitPrice: 3078.94, quantity: 1, lineTotal: 3078.94 }), 60, 5, null, today);
  const ok = v.disposition === "excluded" && v.reason === "FUEL_TOTAL_NOT_UNIT";
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗ BOZUK"}  "Excellium Motorin" up=lt=3078.94 qty=1 → ${v.disposition} (${v.reason})`);
}
{
  // Genuine fill: unit_price is the litre price, qty is the litres, total differs.
  const v = classifyLine(mk({ rawName: "Excellium", unitPrice: 65.37, quantity: 34.87, lineTotal: 2279.29 }), 64, 5, null, today);
  const ok = v.disposition === "clean";
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗ BOZUK"}  "Excellium" 65.37/lt × 34.87lt → ${v.disposition} (gerçek dolum korunmalı)`);
}

console.log("\n── SECTION_RE: fiş bölüm başlığı ürün sayılmamalı");
const sect: [string, string][] = [
  ["TEMEL GIDA", "excluded"], ["Temel Gıda", "excluded"], ["ARA TOPLAM", "excluded"],
  ["İNDİRİM", "excluded"], ["Yemek Bedeli", "excluded"],
  ["Temel Gıda Paketi", "clean"], // gerçek ürün — başlık gibi başlıyor ama değil
];
for (const [name, want] of sect) {
  const v = classifyLine(mk({ rawName: name, unitPrice: 100, lineTotal: 100 }), 100, 5, null, today);
  const ok = v.disposition === want;
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗ BOZUK"}  "${name}" → ${v.disposition}${v.reason ? ` (${v.reason})` : ""}`);
}

console.log("\n── normalizeCurrency");
for (const [inp, want] of [["TL", "TRY"], ["TRY", "TRY"], ["try", "TRY"], ["IDR", "IDR"], ["", ""]] as [string, string][]) {
  const ok = normalizeCurrency(inp) === want;
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗"}  "${inp}" → "${normalizeCurrency(inp)}"`);
}

console.log("\n── packFromName (fişte yazanı okur, uydurmaz)");
for (const [inp, want] of [
  ["Portakal 350g", "350g"], ["Yoğurt Yarım Yağlı 1.2KG", "1.2kg"], ["Kaymak 200 G", "200g"],
  ["Karpuz", ""], ["Domates", ""], ["Süt 1L", "1l"],
] as [string, string][]) {
  const got = packFromName(inp);
  const ok = got === want;
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗"}  "${inp}" → "${got}"${ok ? "" : `  (beklenen "${want}")`}`);
}

console.log("\n── normalizeCity: bir şehir, tek yazım");
const cityCases: [string[], string][] = [
  [["IZMIR", "Izmir", "İZMİR", "İzmir", "izmir"], "IZMIR"],
  [["ISTANBUL", "Istanbul", "İSTANBUL", "İstanbul"], "ISTANBUL"],
  [["DIYARBAKIR", "Diyarbakir", "Diyarbakır", "DİYARBAKIR"], "DIYARBAKIR"],
  [["USKUDAR", "Üsküdar", "ÜSKÜDAR", "Uskudar"], "USKUDAR"],
  [["Ceilandia", "CEILANDIA", "Ceilândia"], "CEILANDIA"],
  [["", "  "], ""],
];
for (const [variants, want] of cityCases) {
  const got = variants.map(normalizeCity);
  const ok = got.every((g) => g === want);
  if (ok) pass++;
  console.log(`  ${ok ? "✓" : "✗"}  ${variants.filter(Boolean).join(" / ") || "(boş)"} → "${want}"${ok ? "" : `  çıkan: ${JSON.stringify(got)}`}`);
}

const total = cases.length + sect.length + 5 + 6 + 2 + cityCases.length + 2;
console.log(`\n${pass}/${total} ${pass === total ? "GEÇTİ ✓" : "KALDI ✗"}`);
if (pass !== total) process.exitCode = 1;
