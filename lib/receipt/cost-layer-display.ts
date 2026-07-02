import type { ReceiptStatus } from "@/lib/mock/types";

export type CostLayerBucket = "store" | "supply" | "retail" | "government" | "excise" | "other";

type LocaleLike = string | undefined | null;

function isTurkish(locale: LocaleLike): boolean {
  return String(locale || "").toLowerCase().startsWith("tr");
}

function pick(locale: LocaleLike, tr: string, en: string): string {
  return isTurkish(locale) ? tr : en;
}

function normalize(value: string | undefined | null): string {
  return String(value || "").toLowerCase().trim();
}

export type ReceiptCategoryKind =
  | "market"
  | "food"
  | "fashion"
  | "fuel"
  | "utility"
  | "travel"
  | "hospitality"
  | "electronics"
  | "pharmacy"
  | "healthcare"
  | "alcohol"
  | "tobacco"
  | "retail"
  | "general";

export function getReceiptCategoryKind(
  category?: string | null,
  merchantChannel?: string | null
): ReceiptCategoryKind {
  const cat = normalize(category);
  const channel = normalize(merchantChannel);

  if (
    channel === "supermarket_grocery" ||
    ["grocery", "groceries", "groceries_fmcg", "supermarket", "market", "convenience"].some((key) =>
      cat.includes(key)
    )
  ) {
    return "market";
  }
  if (["restaurant", "cafe", "food", "dining", "bakery", "food_delivery"].some((key) => cat.includes(key))) {
    return "food";
  }
  if (["fashion", "apparel", "clothing", "shoe", "jewelry"].some((key) => cat.includes(key))) {
    return "fashion";
  }
  if (["fuel", "gas_station", "petrol", "akaryakit"].some((key) => cat.includes(key))) {
    return "fuel";
  }
  if (["utility", "utilities", "electric", "water", "gas bill"].some((key) => cat.includes(key))) {
    return "utility";
  }
  if (["travel", "flight", "ticket", "train", "bus", "ferry"].some((key) => cat.includes(key))) {
    return "travel";
  }
  if (["hospitality", "lodging", "hotel", "hostel", "booking", "agoda"].some((key) => cat.includes(key))) {
    return "hospitality";
  }
  if (["alcohol", "liquor", "wine", "beer", "rakı", "raki", "tekel"].some((key) => cat.includes(key))) {
    return "alcohol";
  }
  if (["tobacco", "cigarette", "sigara", "tütün", "tutun"].some((key) => cat.includes(key))) {
    return "tobacco";
  }
  if (["electronic", "electronics", "teknosa", "computer"].some((key) => cat.includes(key))) {
    return "electronics";
  }
  if (["pharmacy", "drug", "eczane"].some((key) => cat.includes(key))) {
    return "pharmacy";
  }
  if (
    ["healthcare", "sağlı", "saglik", "hospital", "hastane", "clinic", "klinik", "poliklinik", "medical",
     "tıp merkez", "tip merkez", "muayene", "dental", "dentist", "diş", "dis hekim", "doctor", "doktor",
     "laboratory", "laboratuvar"].some((key) =>
      cat.includes(key)
    )
  ) {
    return "healthcare";
  }
  if (
    ["specialty_retail", "stationery", "kırtasiye", "kirtasiye", "bookstore", "kitabevi",
     "nalbur", "hardware", "hırdavat", "hirdavat", "florist", "çiçek", "cicek"].some((key) =>
      cat.includes(key)
    )
  ) {
    return "retail";
  }
  return "general";
}

export function getCategorySchemaLabel(
  category?: string | null,
  locale?: LocaleLike,
  merchantChannel?: string | null
): string {
  const kind = getReceiptCategoryKind(category, merchantChannel);
  const labels: Record<ReceiptCategoryKind, string> = {
    market: pick(locale, "Market", "Market"),
    food: pick(locale, "Restoran / kafe", "Restaurant / cafe"),
    fashion: pick(locale, "Moda / perakende", "Fashion / retail"),
    fuel: pick(locale, "Akaryakıt", "Fuel"),
    utility: pick(locale, "Fatura / hizmet", "Utility / service"),
    travel: pick(locale, "Seyahat", "Travel"),
    hospitality: pick(locale, "Konaklama", "Hospitality"),
    electronics: pick(locale, "Elektronik", "Electronics"),
    pharmacy: pick(locale, "Eczane", "Pharmacy"),
    healthcare: pick(locale, "Sağlık", "Healthcare"),
    alcohol: pick(locale, "Alkol", "Alcohol"),
    tobacco: pick(locale, "Tütün", "Tobacco"),
    retail: pick(locale, "Perakende", "Retail"),
    general: pick(locale, "Genel", "General"),
  };
  return labels[kind];
}

export function getCostLayerCopy(args: {
  category?: string | null;
  merchantChannel?: string | null;
  bucket?: string | null;
  locale?: LocaleLike;
}): { label: string; description: string } {
  const kind = getReceiptCategoryKind(args.category, args.merchantChannel);
  const bucket = (args.bucket || "other") as CostLayerBucket;
  const locale = args.locale;

  // Excise (TR: ÖTV) is category-agnostic — same embedded special-consumption tax
  // on tobacco / alcohol / fuel regardless of merchant kind.
  if (bucket === "excise") {
    return {
      label: pick(locale, "Özel Tüketim Vergisi (ÖTV)", "Excise Tax (ÖTV)"),
      description: pick(
        locale,
        "Tütün, alkol veya yakıtın raf fiyatına gömülü ÖTV; fişte ayrı görünmez.",
        "Special consumption tax baked into the shelf price of tobacco, alcohol, or fuel; never itemised on the receipt."
      ),
    };
  }

  // excise is handled by the early return above, so the per-kind maps don't carry it.
  const copies: Record<ReceiptCategoryKind, Partial<Record<CostLayerBucket, { tr: [string, string]; en: [string, string] }>>> = {
    market: {
      store: { tr: ["Mağaza operasyonu", "Şube, personel, kira ve ödeme altyapısı"], en: ["Store operations", "Branch, staff, rent, and payment operations"] },
      supply: { tr: ["Tedarik ve soğuk zincir", "Lojistik, depo, fire ve dağıtım"], en: ["Supply and cold chain", "Logistics, storage, spoilage, and distribution"] },
      retail: { tr: ["Perakende marjı", "Raf, kampanya, marka ve kâr payı"], en: ["Retail margin", "Shelf, promotion, brand, and margin"] },
      government: { tr: ["KDV", "Fişte görünen vergi kalemi"], en: ["VAT", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    food: {
      store: { tr: ["Mekan ve servis", "Kira, ekip, mutfak ve masa servisi"], en: ["Venue and service", "Rent, team, kitchen, and table service"] },
      supply: { tr: ["Malzeme tedariki", "Gıda, içecek, hazırlık ve fire"], en: ["Ingredient sourcing", "Food, drink, prep, and waste"] },
      retail: { tr: ["İşletme marjı", "Menü fiyatlaması, paketleme ve kâr payı"], en: ["Operator margin", "Menu pricing, packaging, and margin"] },
      government: { tr: ["Vergi", "Fişte görünen vergi/servis kalemi"], en: ["Tax", "Tax or service line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    fashion: {
      store: { tr: ["Mağaza ve satış", "Mağaza, ekip ve satış operasyonu"], en: ["Store and sales", "Store, team, and sales operations"] },
      supply: { tr: ["Üretim ve dağıtım", "Üretim, ithalat, stok ve lojistik"], en: ["Production and distribution", "Production, import, inventory, and logistics"] },
      retail: { tr: ["Marka ve kampanya", "Marka primi, sezon riski, iade ve promosyon"], en: ["Brand and promotion", "Brand premium, season risk, returns, and promotion"] },
      government: { tr: ["Vergi", "Fişte görünen vergi kalemi"], en: ["Tax", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    fuel: {
      store: { tr: ["İstasyon operasyonu", "Bayi, pompa, personel ve saha gideri"], en: ["Station operations", "Dealer, pump, staff, and site costs"] },
      supply: { tr: ["Ürün ve dağıtım", "Rafineri, taşıma ve dağıtım ağı"], en: ["Product and distribution", "Refinery, transport, and distribution network"] },
      retail: { tr: ["Bayi marjı", "Bayi payı ve ticari marj"], en: ["Dealer margin", "Dealer share and commercial margin"] },
      government: { tr: ["Vergi / ÖTV", "Fişte görünen vergi payı"], en: ["Tax / excise", "Tax share shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    utility: {
      store: { tr: ["Altyapı ve sayaç", "Şebeke, sayaç, okuma ve faturalama"], en: ["Grid and metering", "Network, meter, reading, and billing"] },
      supply: { tr: ["Tüketim bedeli", "Enerji/su/gaz tedarik maliyeti"], en: ["Consumption value", "Energy, water, or gas supply cost"] },
      retail: { tr: ["Hizmet bedeli", "Sağlayıcı operasyonu ve marjı"], en: ["Service fee", "Provider operations and margin"] },
      government: { tr: ["Vergi", "Fişte/faturada görünen vergi payı"], en: ["Tax", "Tax share shown on the bill"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    travel: {
      store: { tr: ["Operasyon", "Terminal, ekip, operasyon ve güvenlik"], en: ["Operations", "Terminal, team, operations, and safety"] },
      supply: { tr: ["Taşıma değeri", "Yakıt/enerji, rota ve altyapı"], en: ["Transport value", "Fuel, route, and infrastructure"] },
      retail: { tr: ["Dağıtım ve marj", "Platform, acente, risk ve operatör payı"], en: ["Distribution and margin", "Platform, agency, risk, and operator share"] },
      government: { tr: ["Vergi ve ücretler", "Bilette görünen kamu/vergi kalemleri"], en: ["Taxes and fees", "Public tax and fee lines shown on the ticket"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    hospitality: {
      store: { tr: ["Tesis ve servis", "Oda, ekip, temizlik ve tesis operasyonu"], en: ["Property and service", "Room, team, housekeeping, and property operations"] },
      supply: { tr: ["Konaklama girdileri", "Tüketim malzemeleri, bakım ve enerji"], en: ["Stay inputs", "Consumables, maintenance, and energy"] },
      retail: { tr: ["Platform ve otel marjı", "OTA komisyonu, ödeme/FX ve işletme marjı"], en: ["Platform and hotel margin", "OTA commission, payment/FX, and operator margin"] },
      government: { tr: ["Vergi", "Faturada görünen vergi kalemi"], en: ["Tax", "Tax line shown on the invoice"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    electronics: {
      store: { tr: ["Mağaza ve satış", "Mağaza, ekip, garanti ve iade operasyonu"], en: ["Store and sales", "Store, staff, warranty, and returns"] },
      supply: { tr: ["Tedarik ve lojistik", "İthalat, depo ve dağıtım"], en: ["Sourcing and logistics", "Import, warehousing, and distribution"] },
      retail: { tr: ["Perakende ve marka", "Mağaza marjı ve marka primi"], en: ["Retail and brand", "Store margin and brand premium"] },
      government: { tr: ["Vergi", "Fişte görünen vergi kalemi"], en: ["Tax", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    pharmacy: {
      store: { tr: ["Eczane operasyonu", "Kira, lisanslı eczacı ve uyum"], en: ["Pharmacy operations", "Rent, licensed pharmacist, and compliance"] },
      supply: { tr: ["Tedarik ve depolama", "İlaç tedarikçi marjı ve soğuk zincir"], en: ["Sourcing and storage", "Pharma supplier margin and cold chain"] },
      retail: { tr: ["Eczane marjı", "Düzenlenmiş perakende marjı ve güven primi"], en: ["Pharmacy margin", "Regulated retail margin and trust premium"] },
      government: { tr: ["Vergi", "Fişte görünen vergi kalemi"], en: ["Tax", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    healthcare: {
      store: { tr: ["Tesis ve sağlık ekibi", "Bina, ekipman ve lisanslı sağlık personeli"], en: ["Facility and clinical staff", "Building, equipment, and licensed clinical staff"] },
      supply: { tr: ["Medikal tedarik", "Sarf malzeme, ilaç, laboratuvar ve cihaz"], en: ["Medical supplies", "Consumables, medicines, lab, and devices"] },
      retail: { tr: ["Hizmet ve işletme marjı", "İdari giderler, sigorta/komisyon ve işletme payı"], en: ["Service and operating margin", "Administration, insurance/commission, and operator share"] },
      government: { tr: ["Vergi", "Fişte görünen vergi kalemi"], en: ["Tax", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    alcohol: {
      store: { tr: ["Mağaza ve ruhsat", "Kira, ekip, ruhsat ve uyum"], en: ["Store and licensing", "Rent, staff, licence, and compliance"] },
      supply: { tr: ["Tedarik ve dağıtım", "İthalatçı/dağıtıcı marjı ve lojistik"], en: ["Supply and distribution", "Importer/distributor margin and logistics"] },
      retail: { tr: ["Perakende ve marka", "Mağaza marjı ve marka primi"], en: ["Retail and brand", "Store margin and brand premium"] },
      government: { tr: ["Vergi / ÖTV", "Fiyata gömülü ÖTV ve KDV"], en: ["Tax / excise", "Embedded excise and VAT"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    tobacco: {
      store: { tr: ["Bayi operasyonu", "Kira, ekip ve ödeme"], en: ["Dealer operations", "Rent, staff, and payment"] },
      supply: { tr: ["Üretim ve dağıtım", "Üretici tedariki ve lojistik"], en: ["Production and distribution", "Manufacturer sourcing and logistics"] },
      retail: { tr: ["İnce perakende marjı", "Fiyatın küçük kısmı; gerisi ÖTV"], en: ["Thin retail margin", "A small slice; the rest is excise"] },
      government: { tr: ["Vergi / ÖTV", "Fiyatın büyük kısmı gömülü ÖTV"], en: ["Tax / excise", "Most of the price is embedded excise"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    retail: {
      store: { tr: ["Mağaza operasyonu", "Kira, ekip ve mağaza giderleri"], en: ["Store operations", "Rent, staff, and store costs"] },
      supply: { tr: ["Tedarik ve lojistik", "Ürün tedariki ve dağıtım"], en: ["Sourcing and logistics", "Product sourcing and distribution"] },
      retail: { tr: ["Perakende marjı", "Mağaza kâr payı ve marka"], en: ["Retail margin", "Store margin and brand"] },
      government: { tr: ["Vergi", "Fişte görünen vergi kalemi"], en: ["Tax", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    general: {
      store: { tr: ["İşletme operasyonu", "Mekan, ekip ve operasyon giderleri"], en: ["Business operations", "Location, team, and operations"] },
      supply: { tr: ["Tedarik ve yolculuk", "Lojistik, dağıtım ve altyapı"], en: ["Supply and journey", "Logistics, distribution, and infrastructure"] },
      retail: { tr: ["Marka / marj", "Marka, pazarlama ve ticari marj"], en: ["Brand / margin", "Brand, marketing, and commercial margin"] },
      government: { tr: ["Vergi", "Fişte görünen vergi kalemi"], en: ["Tax", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
  };

  const entry = copies[kind][bucket] ||
    copies[kind].other || { tr: ["Diğer katman", ""], en: ["Other layer", ""] };
  const [label, description] = isTurkish(locale) ? entry.tr : entry.en;
  return { label, description };
}

export type HiddenCostProvenance =
  | "item_derived"
  | "category_derived"
  | "sector_average"
  | "inflation_premium";

/**
 * Mandatory transparency notice for how the hidden-cost TOTAL was derived
 * (per the product decision, §3, 2026-06-24). When the receipt's items were too
 * generic to price directly we fall back to a sector average — and the user must
 * be told. `item_derived` shows a short positive confirmation instead.
 */
export function getProvenanceNotice(
  provenance: HiddenCostProvenance | null | undefined,
  locale?: LocaleLike
): { label: string; detail: string; tone: "success" | "info" } {
  if (provenance === "inflation_premium") {
    // For countries without detailed producer-gap data, hidden cost is estimated from
    // general inflation (CPI). No misleading precision (producer margin) is claimed.
    return {
      label: pick(locale, "Genel enflasyona dayalı tahmin", "Based on general inflation"),
      detail: pick(
        locale,
        "Ülkeniz için ürün bazlı maliyet verisi henüz yok; bu rakam resmî genel enflasyon (TÜFE/CPI) endeksine dayalı tahminî bir paydır — kalem bazında üretici maliyetinden hesaplanmadı.",
        "Product-level cost data is not available yet for your country, so this figure is an estimate based on the official general inflation (CPI) index — not computed from per-item producer cost."
      ),
      tone: "info",
    };
  }
  if (provenance === "item_derived") {
    return {
      label: pick(locale, "Kalemlerinizden hesaplandı", "Computed from your items"),
      detail: pick(
        locale,
        "Fişinizdeki kalemler tanındı; gizli maliyet kendi ürünlerinizden hesaplandı. Kalemlere dağılım yine de tahminîdir.",
        "This receipt's items were recognised, so the hidden cost was computed from your own products. The split across items is still an estimate."
      ),
      tone: "success",
    };
  }
  // category_derived + sector_average + unknown → estimate, must be disclosed.
  return {
    label: pick(locale, "Tahmini hesap (sektör ortalaması)", "Estimated (sector average)"),
    detail: pick(
      locale,
      "Fişteki kalemler genel ifadeler içerdiği için (örn. “yiyecek”, “içecek”) bu rakam sektör ortalamasına dayanır — kendi kalemlerinizden hesaplanmadı. Kalem dağılımı tahminîdir.",
      "The items on this receipt were too generic (e.g. “food”, “drink”), so this figure is based on a sector average — not computed from your own items. The item split is an estimate."
    ),
    tone: "info",
  };
}

export function getEvidenceBadge(args: {
  bucket?: string | null;
  amount?: number | null;
  locale?: LocaleLike;
}): { label: string; tone: "success" | "warning" | "muted" } {
  if ((args.amount ?? 0) <= 0) {
    return { label: pick(args.locale, "Bilgi", "Info"), tone: "muted" };
  }
  if (args.bucket === "government") {
    return { label: pick(args.locale, "Fişten okundu", "Read from receipt"), tone: "success" };
  }
  return { label: pick(args.locale, "Tahmini", "Estimated"), tone: "warning" };
}

export function isReceiptVerified(status?: ReceiptStatus | string | null): boolean {
  const normalized = String(status || "").toLowerCase();
  return normalized === "verified" || normalized === "saved";
}

export function getCategoryStoryIntro(
  kind: ReceiptCategoryKind,
  locale?: LocaleLike
): string {
  const intros: Record<ReceiptCategoryKind, { tr: string; en: string }> = {
    market: {
      tr: "Market alışverişinde ödediğin tutar; mağaza operasyonu, tedarik zinciri ve perakende marjı katmanlarına dağılır. Kalemler satır doğrulaması tamamlandıkça güncellenir.",
      en: "In grocery shopping, what you pay splits across store operations, supply chain, and retail margin. Line amounts update after line verification.",
    },
    food: {
      tr: "Restoran ve kafe fişlerinde tutar; mekan, malzeme tedariki ve işletme marjı katmanlarına ayrılır.",
      en: "Restaurant and cafe receipts split across venue, ingredients, and operator margin.",
    },
    fashion: {
      tr: "Moda fişlerinde tutar; mağaza, üretim-distribution ve marka marjı katmanlarına dağılır.",
      en: "Fashion receipts split across store, production-distribution, and brand margin.",
    },
    fuel: {
      tr: "Akaryakıt fişlerinde tutar; istasyon operasyonu, ürün dağıtımı ve bayi marjına ayrılır.",
      en: "Fuel receipts split across station operations, product distribution, and dealer margin.",
    },
    utility: {
      tr: "Fatura ödemelerinde tutar; altyapı, tüketim bedeli ve hizmet marjı katmanlarına dağılır.",
      en: "Utility bills split across infrastructure, consumption value, and service margin.",
    },
    travel: {
      tr: "Seyahat biletlerinde tutar; operasyon, taşıma değeri ve dağıtım marjına ayrılır.",
      en: "Travel tickets split across operations, transport value, and distribution margin.",
    },
    hospitality: {
      tr: "Konaklama faturalarında tutar; tesis, konaklama girdileri ve platform-otel marjına dağılır.",
      en: "Lodging invoices split across property, stay inputs, and platform-hotel margin.",
    },
    electronics: {
      tr: "Elektronik alışverişinde tutar; mağaza-satış, tedarik-lojistik ve perakende-marka katmanlarına dağılır.",
      en: "Electronics receipts split across store-sales, sourcing-logistics, and retail-brand layers.",
    },
    pharmacy: {
      tr: "Eczane alışverişinde tutar; eczane operasyonu, tedarik-depolama ve düzenlenmiş marja ayrılır.",
      en: "Pharmacy receipts split across pharmacy operations, sourcing-storage, and regulated margin.",
    },
    healthcare: {
      tr: "Sağlık harcamasında tutar; tesis ve sağlık ekibi, medikal tedarik ve hizmet-işletme marjı katmanlarına dağılır.",
      en: "Healthcare spending splits across facility and clinical staff, medical supplies, and service-operating margin.",
    },
    alcohol: {
      tr: "Alkolde ödediğin tutarın büyük kısmı rafta görünmeyen ÖTV'dir; kalanı mağaza, tedarik ve perakende marjına dağılır.",
      en: "For alcohol, a large part of what you pay is excise (ÖTV) hidden in the shelf price; the rest splits across store, supply, and retail margin.",
    },
    tobacco: {
      tr: "Sigarada ödediğin tutarın çoğu fiyata gömülü ÖTV'dir; ticari pay (mağaza, tedarik, marj) incedir.",
      en: "For tobacco, most of what you pay is excise (ÖTV) baked into the price; the commercial share (store, supply, margin) is thin.",
    },
    retail: {
      tr: "Kırtasiye ve benzeri perakendede tutar; mağaza operasyonu, tedarik ve perakende marjına dağılır.",
      en: "Stationery and similar retail receipts split across store operations, supply, and retail margin.",
    },
    general: {
      tr: "Bu kategoride ödediğin tutar; işletme, tedarik ve marka marjı katmanlarına dağılır.",
      en: "In this category, what you pay splits across business operations, supply, and brand margin.",
    },
  };
  const entry = intros[kind] || intros.general;
  return isTurkish(locale) ? entry.tr : entry.en;
}

export function getMvpCopy(locale?: LocaleLike) {
  return {
    receiptRead: pick(locale, "Fişten okundu", "Read from receipt"),
    estimated: pick(locale, "Tahmini", "Estimated"),
    verifying: pick(locale, "Doğrulanıyor", "Verifying"),
    updateableReward: pick(locale, "Satır doğrulaması sonrası güncellenebilir", "May update after line verification"),
    pendingLineAmount: pick(locale, "Satır doğrulaması sonrası hesaplanır", "Calculated after line verification"),
    lineItemsTitle: pick(locale, "Gizli maliyet kalemleri", "Hidden cost line items"),
    categorySchemaNote: pick(locale, "Bu şema kategoriye göre değişir.", "This schema changes by category."),
    rewardWindowNote: pick(locale, "Yalnızca içinde bulunulan takvim ayına ait fişler ödül kazanır.", "Only receipts from the current calendar month earn rewards."),
    hiddenEstimate: pick(locale, "Tahmini gizli maliyet", "Estimated hidden cost"),
    taxRead: pick(locale, "KDV / vergi", "VAT / tax"),
    rewardEstimate: pick(locale, "Ödül tahmini", "Reward estimate"),
    lineVerificationDone: pick(locale, "Satır kontrolü tamamlandı", "Line check complete"),
    lineVerificationPending: pick(locale, "Satır kontrolü devam ediyor", "Line check in progress"),
    distributionConfidence: pick(locale, "Dağılım: tahmini", "Breakdown: estimated"),
    totalConfidence: pick(locale, "Toplam: yüksek", "Total: high"),
    taxConfidence: pick(locale, "KDV: fişten", "VAT: receipt"),
    noTaxConfidence: pick(locale, "KDV: yok / okunamadı", "VAT: missing / unread"),
  };
}
