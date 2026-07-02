type LocaleLike = string | undefined | null;

function isTurkish(locale: LocaleLike): boolean {
  return String(locale || "").toLowerCase().startsWith("tr");
}

// Keys MUST match the labels in lib/pricing/breakdownDictionary.ts exactly — that
// dictionary is the source of breakdown item labels. Any label without an entry
// here renders in English (the fallback at the bottom of getBreakdownItemCopy).
const ITEM_COPY: Record<string, { tr: [string, string]; en: [string, string] }> = {
  // Store & operations
  "Shop Rent": { tr: ["Mekan kirası", "İşletme konumu ve kira"], en: ["Shop rent", "Venue location and lease"] },
  "Store Rent": { tr: ["Mağaza kirası", "Şube konumu ve kira gideri"], en: ["Store rent", "Branch location and lease"] },
  Rent: { tr: ["Kira", "İşletme konumu ve kira gideri"], en: ["Rent", "Location and lease"] },
  "Staff Costs": { tr: ["Personel", "Maaş ve ekip giderleri"], en: ["Staff costs", "Wages and team expenses"] },
  Staff: { tr: ["Personel", "Maaş ve ekip giderleri"], en: ["Staff", "Wages and salaries"] },
  "Staff/Pharmacist": { tr: ["Lisanslı personel", "Yetkili eczacı ve ekip"], en: ["Licensed staff", "Pharmacist and team"] },
  Labor: { tr: ["İşçilik", "Hizmet sağlayıcı ücretleri"], en: ["Labor", "Service provider wages"] },
  Utilities: { tr: ["Faturalar", "Elektrik, ısıtma, su"], en: ["Utilities", "Electricity, heating, water"] },
  "Payment Fees": { tr: ["Ödeme komisyonu", "Kart işlem ücretleri"], en: ["Payment fees", "Card processing fees"] },
  "Licensing & Compliance": { tr: ["Ruhsat ve uyum", "İşletme izinleri ve düzenlemeler"], en: ["Licensing & compliance", "Permits and regulations"] },
  Compliance: { tr: ["Uyum", "Güvenlik ve düzenleyici uyum"], en: ["Compliance", "Safety and regulatory compliance"] },
  "Shrinkage/Waste": { tr: ["Fire ve kayıp", "Bozulma, hırsızlık, hasar"], en: ["Shrinkage/waste", "Spoilage, theft, damage"] },
  "24/7 Ops Premium": { tr: ["7/24 işletme primi", "Kesintisiz çalışma maliyeti"], en: ["24/7 ops premium", "Round-the-clock operation"] },
  "Station Ops": { tr: ["İstasyon işletmesi", "Pompa, saha ve operasyon"], en: ["Station ops", "Pump, site, and operations"] },
  "Returns/Handling": { tr: ["İade ve elleçleme", "İade ve stok yönetimi"], en: ["Returns/handling", "Returns and inventory handling"] },
  "Warranty/Returns": { tr: ["Garanti ve iade", "Garanti ve iade maliyetleri"], en: ["Warranty/returns", "Warranty and return handling"] },
  "Tools/Consumables": { tr: ["Alet ve sarf", "Ekipman ve sarf malzemeleri"], en: ["Tools/consumables", "Equipment and supplies"] },
  "Property Operations": { tr: ["Tesis işletmesi", "Otel operasyonu ve bakım"], en: ["Property operations", "Hotel operations and maintenance"] },
  Operations: { tr: ["Operasyon", "Terminal, ekip ve güvenlik"], en: ["Operations", "Terminal, team, and safety"] },
  // Supply chain & journey
  "Ingredient Sourcing": { tr: ["Malzeme tedariki", "Gıda ve içecek alımı"], en: ["Ingredient sourcing", "Food and drink procurement"] },
  "Logistics & Cold Chain": { tr: ["Lojistik ve soğuk zincir", "Taşıma ve depolama"], en: ["Logistics & cold chain", "Transportation and storage"] },
  "Supplier Margin": { tr: ["Tedarikçi marjı", "Toptancı ve tedarikçi payı"], en: ["Supplier margin", "Wholesaler and supplier margins"] },
  "Supplier Premium": { tr: ["Tedarikçi primi", "Market tedarik marjı"], en: ["Supplier premium", "Convenience supplier margins"] },
  "Distribution & Logistics": { tr: ["Dağıtım ve lojistik", "Taşıma ve dağıtım"], en: ["Distribution & logistics", "Shipping and logistics"] },
  Distribution: { tr: ["Dağıtım", "Dağıtım ağı ve lojistik"], en: ["Distribution", "Distribution network and logistics"] },
  Storage: { tr: ["Depolama", "Depo ve soğuk zincir"], en: ["Storage", "Warehouse and cold chain"] },
  "Refining/Procurement": { tr: ["Rafineri/tedarik", "Yakıt tedariki ve rafinaj"], en: ["Refining/procurement", "Fuel procurement and refining"] },
  "Manufacturing/Procurement": { tr: ["Üretim/tedarik", "Üretim ve kaynak"], en: ["Manufacturing/procurement", "Production and sourcing"] },
  Procurement: { tr: ["Tedarik", "Ürün tedariki"], en: ["Procurement", "Product sourcing"] },
  Shipping: { tr: ["Nakliye", "Taşıma ve lojistik"], en: ["Shipping", "Transportation and logistics"] },
  Warehousing: { tr: ["Depolama", "Stok ve depo"], en: ["Warehousing", "Storage and inventory"] },
  "Materials/Parts": { tr: ["Malzeme/parça", "Ham madde ve parçalar"], en: ["Materials/parts", "Raw materials and parts"] },
  Logistics: { tr: ["Lojistik", "Nakliye ve teslimat"], en: ["Logistics", "Shipping and delivery"] },
  "Housekeeping & Supplies": { tr: ["Kat hizmetleri ve sarf", "Temizlik ve sarf malzemeleri"], en: ["Housekeeping & supplies", "Cleaning and amenities"] },
  "Food & Beverage": { tr: ["Yiyecek-içecek", "Restoran ve oda servisi"], en: ["Food & beverage", "Restaurant and room service"] },
  "Fuel & Energy": { tr: ["Yakıt ve enerji", "Yakıt ve enerji maliyeti"], en: ["Fuel & energy", "Fuel and energy costs"] },
  Maintenance: { tr: ["Bakım", "Araç ve ekipman bakımı"], en: ["Maintenance", "Vehicle and equipment maintenance"] },
  Infrastructure: { tr: ["Altyapı", "Terminal ve altyapı ücretleri"], en: ["Infrastructure", "Terminal and infrastructure fees"] },
  "Supply Chain": { tr: ["Tedarik zinciri", "Tedarik ve lojistik"], en: ["Supply chain", "Procurement and logistics"] },
  // Retail & brand — these are the ESTIMATED retail/operator share of the hidden
  // markup, not the business's measured net profit. Labels say "payı" (share), not
  // "marjı", to avoid implying an exact margin (per the product decision, 2026-06-24).
  "Retail Margin": { tr: ["Perakende payı", "Fiyata yansıyan perakende payı (tahmini)"], en: ["Retail share", "Estimated retail share in the price"] },
  "Restaurant Margin": { tr: ["Restoran işletme payı", "Fiyata yansıyan işletme payı (tahmini)"], en: ["Restaurant operating share", "Estimated operator share in the price"] },
  "Convenience Premium": { tr: ["Market payı", "Bakkal/market fiyat farkı (tahmini)"], en: ["Convenience premium", "Estimated convenience markup"] },
  "Service Margin": { tr: ["Hizmet payı", "Fiyata yansıyan hizmet payı (tahmini)"], en: ["Service share", "Estimated service share in the price"] },
  "Hotel Margin": { tr: ["Otel işletme payı", "Fiyata yansıyan işletme payı (tahmini)"], en: ["Hotel operating share", "Estimated operator share in the price"] },
  "Transport Margin": { tr: ["Taşıma payı", "Fiyata yansıyan taşıma payı (tahmini)"], en: ["Transport share", "Estimated transport share in the price"] },
  "Brand / Experience": { tr: ["Marka / deneyim", "Marka ve müşteri deneyimi"], en: ["Brand / experience", "Branding and customer experience"] },
  "Brand / Marketing": { tr: ["Marka / pazarlama", "Marka ve pazarlama giderleri"], en: ["Brand / marketing", "Branding and marketing"] },
  "Brand / Service": { tr: ["Marka / servis", "Marka ve hizmet kalitesi"], en: ["Brand / service", "Branding and service quality"] },
  "Brand Premium": { tr: ["Marka primi", "Marka ve pazarlama"], en: ["Brand premium", "Brand and marketing"] },
  "Brand/Trust Premium": { tr: ["Marka / güven primi", "Güven ve marka değeri"], en: ["Brand/trust premium", "Trust and brand value"] },
};

export function getBreakdownItemCopy(
  englishLabel: string,
  englishDescription: string | undefined,
  locale?: LocaleLike
): { label: string; description: string } {
  const entry = ITEM_COPY[englishLabel];
  if (entry) {
    const [label, description] = isTurkish(locale) ? entry.tr : entry.en;
    return { label, description };
  }
  return {
    label: englishLabel,
    description: englishDescription || englishLabel,
  };
}
