import type { ReceiptStatus } from "@/lib/mock/types";
import { normalizeReceiptCategory } from "@/lib/receipt/categories";

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
  | "services"
  | "beauty";

/**
 * Maps merchant_category (+ optional channel) to a UI schema kind.
 * Returns null for unknown/other — callers must not show a "General" badge.
 */
export function getReceiptCategoryKind(
  category?: string | null,
  merchantChannel?: string | null
): ReceiptCategoryKind | null {
  const channel = normalize(merchantChannel);
  if (channel === "supermarket_grocery") return "market";

  const canonical = normalizeReceiptCategory(category);
  if (canonical === "other") return null;
  if (canonical) {
    switch (canonical) {
      case "grocery":
      case "kiosk":
        return "market";
      case "restaurant":
      case "cafe":
        return "food";
      case "apparel":
      case "fashion":
        return "fashion";
      case "fuel":
        return "fuel";
      case "utilities":
        return "utility";
      case "travel":
        return "travel";
      case "hospitality_lodging":
        return "hospitality";
      case "electronics":
        return "electronics";
      case "pharmacy":
        return "pharmacy";
      case "healthcare":
        return "healthcare";
      case "alcohol":
        return "alcohol";
      case "tobacco":
        return "tobacco";
      case "specialty_retail":
      case "sports":
        return "retail";
      case "beauty":
      case "personal_care":
        return "beauty";
      case "services":
        return "services";
      default:
        break;
    }
  }

  // Legacy / unnormalized strings that never hit the canonical enum.
  const cat = normalize(category);
  if (!cat) return null;
  if (["grocery", "groceries", "supermarket", "market", "convenience", "kiosk", "bakery", "butcher"].some((k) => cat.includes(k))) {
    return "market";
  }
  if (["restaurant", "cafe", "food", "dining", "food_delivery"].some((k) => cat.includes(k))) return "food";
  if (["fashion", "apparel", "clothing", "shoe", "jewelry"].some((k) => cat.includes(k))) return "fashion";
  if (["fuel", "gas_station", "petrol", "akaryakit"].some((k) => cat.includes(k))) return "fuel";
  if (["utility", "utilities", "electric", "water", "gas bill"].some((k) => cat.includes(k))) return "utility";
  if (["travel", "flight", "ticket", "train", "bus", "ferry"].some((k) => cat.includes(k))) return "travel";
  if (["hospitality", "lodging", "hotel", "hostel", "booking", "agoda", "accommodation"].some((k) => cat.includes(k))) {
    return "hospitality";
  }
  if (["alcohol", "liquor", "wine", "beer", "rakı", "raki", "tekel"].some((k) => cat.includes(k))) return "alcohol";
  if (["tobacco", "cigarette", "sigara", "tütün", "tutun"].some((k) => cat.includes(k))) return "tobacco";
  if (["electronic", "electronics", "teknosa", "computer"].some((k) => cat.includes(k))) return "electronics";
  if (["pharmacy", "drug", "eczane"].some((k) => cat.includes(k))) return "pharmacy";
  if (
    ["healthcare", "sağlı", "saglik", "hospital", "hastane", "clinic", "klinik", "poliklinik", "medical",
      "tıp merkez", "tip merkez", "muayene", "dental", "dentist", "diş", "dis hekim", "doctor", "doktor",
      "laboratory", "laboratuvar"].some((k) => cat.includes(k))
  ) {
    return "healthcare";
  }
  if (["beauty", "cosmetic", "kozmetik", "personal_care", "kişisel", "kisisel"].some((k) => cat.includes(k))) {
    return "beauty";
  }
  if (["service", "subscription", "digital", "tax_office"].some((k) => cat.includes(k))) return "services";
  if (
    ["specialty_retail", "stationery", "kırtasiye", "kirtasiye", "bookstore", "kitabevi",
      "nalbur", "hardware", "hırdavat", "hirdavat", "florist", "çiçek", "cicek", "sport"].some((k) => cat.includes(k))
  ) {
    return "retail";
  }
  return null;
}

export function getCategorySchemaLabel(
  category?: string | null,
  locale?: LocaleLike,
  merchantChannel?: string | null
): string {
  const kind = getReceiptCategoryKind(category, merchantChannel);
  if (!kind) return "";
  const labels: Record<ReceiptCategoryKind, string> = {
    market: pick(locale, "Market", "Market"),
    food: pick(locale, "Restoran / kafe", "Restaurant / cafe"),
    fashion: pick(locale, "Moda / perakende", "Fashion / retail"),
    fuel: pick(locale, "Akaryakıt", "Fuel"),
    utility: pick(locale, "Fatura", "Utility"),
    travel: pick(locale, "Seyahat", "Travel"),
    hospitality: pick(locale, "Konaklama", "Hospitality"),
    electronics: pick(locale, "Elektronik", "Electronics"),
    pharmacy: pick(locale, "Eczane", "Pharmacy"),
    healthcare: pick(locale, "Sağlık", "Healthcare"),
    alcohol: pick(locale, "Alkol", "Alcohol"),
    tobacco: pick(locale, "Tütün", "Tobacco"),
    retail: pick(locale, "Perakende", "Retail"),
    services: pick(locale, "Hizmetler", "Services"),
    beauty: pick(locale, "Güzellik / bakım", "Beauty / care"),
  };
  return labels[kind];
}

export function getCostLayerCopy(args: {
  category?: string | null;
  merchantChannel?: string | null;
  bucket?: string | null;
  locale?: LocaleLike;
}): { label: string; description: string } {
  const kind = getReceiptCategoryKind(args.category, args.merchantChannel) ?? "retail";
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
    services: {
      store: { tr: ["Hizmet operasyonu", "Personel, mekan ve idari giderler"], en: ["Service operations", "Staff, premises, and administration"] },
      supply: { tr: ["Girdi ve araçlar", "Sarf malzeme, yazılım ve altyapı"], en: ["Inputs and tools", "Consumables, software, and infrastructure"] },
      retail: { tr: ["Hizmet marjı", "İşletme payı ve fiyatlandırma"], en: ["Service margin", "Operator share and pricing"] },
      government: { tr: ["Vergi", "Fişte görünen vergi kalemi"], en: ["Tax", "Tax line shown on the receipt"] },
      other: { tr: ["Diğer katman", "Kategoriye göre ayrıştırılamayan tahmini pay"], en: ["Other layer", "Estimated share not mapped to a category layer"] },
    },
    beauty: {
      store: { tr: ["Mağaza / salon operasyonu", "Kira, ekip ve hizmet alanı"], en: ["Store / salon operations", "Rent, staff, and service floor"] },
      supply: { tr: ["Ürün tedariki", "Kozmetik / bakım ürünleri ve lojistik"], en: ["Product sourcing", "Beauty / care products and logistics"] },
      retail: { tr: ["Perakende ve marka", "Mağaza marjı ve marka primi"], en: ["Retail and brand", "Store margin and brand premium"] },
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
  | "retail_margin"
  | "category_derived"
  | "sector_average"
  | "regional_proxy"
  | "unavailable";

/**
 * Mandatory transparency notice for how the hidden-cost TOTAL was derived
 * (per the product decision, §3, 2026-06-24). When the receipt's items were too
 * generic to price directly we fall back to a sector average — and the user must
 * be told. `item_derived` shows a short positive confirmation instead.
 */
export function getProvenanceNotice(
  provenance: HiddenCostProvenance | null | undefined,
  locale?: LocaleLike
): { label: string; detail: string; tone: "success" | "info" | "muted" } {
  if (provenance === "unavailable") {
    return {
      label: pick(locale, "Gizli maliyet hesaplanamadı", "Hidden cost could not be calculated"),
      detail: pick(
        locale,
        "Bu belge için doğrulanmış marj veya proxy verisi yok. Sıfır göstermek yanıltıcı olur; rakam uydurulmaz.",
        "No verified margin or proxy data exists for this document. Showing zero would be misleading; no figure is fabricated."
      ),
      tone: "muted",
    };
  }
  if (provenance === "regional_proxy") {
    // For countries without country-level producer data, the reference is the
    // verified commercial margin of a comparable regional market (or the
    // cross-country category median). No misleading precision is claimed.
    return {
      label: pick(locale, "Bölgesel proxy marjına dayalı tahmin", "Based on a regional proxy margin"),
      detail: pick(
        locale,
        "Ülkeniz için kalem bazında doğrulanmış veri henüz yok; bu rakam, benzer bir pazarın doğrulanmış perakende/dağıtım marjı katsayısından tahmin edildi — üretici maliyetinden hesaplanmadı ve düşük güvenlidir.",
        "Country-level item data is not available yet, so this figure was estimated from a verified retail/distribution margin of a comparable market — not computed from producer cost, and low confidence."
      ),
      tone: "info",
    };
  }
  if (provenance === "retail_margin") {
    // Items were recognised and priced one by one, but the reference is a
    // verified retail/distribution margin multiple — not a producer cost gap.
    // Saying "computed from your items" alone would overstate the precision.
    return {
      label: pick(locale, "Onaylı perakende marjına dayalı", "Based on verified retail margins"),
      detail: pick(
        locale,
        "Fişinizdeki kalemler tanındı ve tek tek fiyatlandı. Referans fiyat, ülkeniz için doğrulanmış perakende/dağıtım marjı katsayısına dayanır — üretici maliyetinden hesaplanmadı.",
        "This receipt's items were recognised and priced individually. The reference price is based on a verified retail/distribution margin for your country — it was not computed from producer cost."
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

function isReceiptVerified(status?: ReceiptStatus | string | null): boolean {
  const normalized = String(status || "").toLowerCase();
  return normalized === "verified" || normalized === "saved";
}

export function getCategoryStoryIntro(
  kind: ReceiptCategoryKind | null,
  locale?: LocaleLike
): string {
  if (!kind) return "";
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
    services: {
      tr: "Hizmet fişlerinde tutar; hizmet operasyonu, girdi-araçlar ve hizmet marjı katmanlarına dağılır.",
      en: "Service receipts split across service operations, inputs/tools, and service margin.",
    },
    beauty: {
      tr: "Güzellik ve kişisel bakımda tutar; mağaza/salon operasyonu, ürün tedariki ve perakende-marka katmanlarına dağılır.",
      en: "Beauty and personal care receipts split across store/salon operations, product sourcing, and retail-brand layers.",
    },
  };
  const entry = intros[kind];
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
