import { classifyLineKind, isCanonicalizableLineKind } from "@/lib/receipt/line-kind";
import { extractCanonicalFromVision } from "@/lib/receipt/canonical/extract-canonical";
import { isSizeOnlyProductSlug } from "@/lib/canonical/product-slug";
import {
  isForbiddenMerchant,
  validateOcrMerchant,
} from "@/lib/receipt/merchant-validation";
import { isPatternAnchoredMatch } from "@/lib/receipt/merchant-matching";

// Cases mirror outputs/_name-quality-audit-pass2.json — real rows that leaked
// into canonical_products / brand_registry / merchants before the write gates.

describe("classifyLineKind", () => {
  it("keeps real products as product", () => {
    expect(classifyLineKind("SÜTAŞ YOĞURT KAYMAKSIZ", 89.5)).toBe("product");
    expect(classifyLineKind("DOMATES SALKIM", 42.3)).toBe("product");
    expect(classifyLineKind("Nasi Gudeg Sudut Kota", 25000)).toBe("product");
    expect(classifyLineKind("KRAKER 150G ÜLKER", 30)).toBe("product");
    expect(classifyLineKind("Kampanya Dana", 250)).toBe("product"); // discounted product ≠ discount row
    // Multipacks starting with NxM stay product (OCR fragment is whole-line only)
    expect(classifyLineKind("3X180 G LABNE", 120)).toBe("product");
    expect(classifyLineKind("6X330SEFTALI DIDI", 90)).toBe("product");
    // "poşet" inside a product name is not a bag fee
    expect(classifyLineKind("DEMLİK POŞET ÇAY", 85)).toBe("product");
    expect(classifyLineKind("PİLİÇ BÜTÜN POŞET", 145)).toBe("product");
    // Trash bags are bought, not charged — "çöp" stays out of the bag context list
    expect(classifyLineKind("ÇÖP POŞETİ 80X110", 65)).toBe("product");
    // "atlet" only means carrier bag next to "poşet"; alone it is an undershirt
    expect(classifyLineKind("ATLET BEYAZ M BEDEN", 120)).toBe("product");
    // Real purchased services with "ücret" stay product
    expect(classifyLineKind("MUAYENE ÜCRETİ", 500)).toBe("product");
    expect(classifyLineKind("OTOPARK ÜCRETİ", 60)).toBe("product");
    // "kredi" is a brand word here (Tarım Kredi Kooperatifi), not a tender line
    expect(classifyLineKind("TARIM KREDİ YARIM YAĞLI SÜT 1L", 45)).toBe("product");
    expect(classifyLineKind("Tarım Kredi Bulgur", 30)).toBe("product");
    // New noise patterns must not shadow real products that share a word
    expect(classifyLineKind("DEVİR DAİM POMPASI", 850)).toBe("product"); // "devir" not a noise word
    expect(classifyLineKind("BÜYÜKBOY HAVLU 50X90", 120)).toBe("product"); // size word, but no "poşet"
    expect(classifyLineKind("BÜYÜK BOY YUMURTA 15Lİ", 88)).toBe("product");
  });

  it("classifies discount rows", () => {
    expect(classifyLineKind("% 40 İNDİRİM", 12)).toBe("discount");
    expect(classifyLineKind("250 TL VE ÜZERİ ALIŞVERİŞ İNDİRİMİ", 25)).toBe("discount");
    expect(classifyLineKind("Sarelle Kakaolu Fındık Kreması İndirimi", 15)).toBe("discount");
    expect(classifyLineKind("İNDİRİMLER:", 5)).toBe("discount");
    expect(classifyLineKind("Herhangi Bir Ürün", -20)).toBe("discount"); // negative total
    expect(classifyLineKind("KAMPANYA", 8)).toBe("discount");
  });

  it("classifies tax rows", () => {
    expect(classifyLineKind("KDV%20", 55)).toBe("tax");
    expect(classifyLineKind("TOPKDV", 12)).toBe("tax");
    expect(classifyLineKind("KDV (20%) (Matrah 557,01 TL)", 111)).toBe("tax");
    expect(classifyLineKind("CTV", 4)).toBe("tax");
  });

  it("classifies payment rows", () => {
    expect(classifyLineKind("K. KARTI", 250)).toBe("payment");
    expect(classifyLineKind("KREDİ", 250)).toBe("payment");
    expect(classifyLineKind("Havale", 1000)).toBe("payment");
    expect(classifyLineKind("NAKİT", 100)).toBe("payment");
    expect(classifyLineKind("Para transferi", 500)).toBe("payment");
  });

  it("classifies bag and fee rows", () => {
    expect(classifyLineKind("ALIŞVERİŞ POŞETİ BİM", 0.25)).toBe("bag");
    expect(classifyLineKind("POŞET ADETİ", 0.5)).toBe("bag");
    expect(classifyLineKind("Orta Boy Kağıt Poşet", 3)).toBe("bag");
    expect(classifyLineKind("PLASTİK POŞET 5M", 1)).toBe("bag");
    // Brand prefix must not shadow the bag-fee context match
    expect(classifyLineKind("Tarım Kredi Market Poşet", 1)).toBe("bag");
    // Vest carrier bag. PROD (2026-07-17) had these written as "product", which
    // put a bag fee into the unresolved-product queue as a fake identification task.
    expect(classifyLineKind("HEMEN POŞET (ATLET)", 0.5)).toBe("bag");
    expect(classifyLineKind("HEMEN POSET (ATLET)", 0.5)).toBe("bag");
    expect(classifyLineKind("ATLET POŞET", 0.25)).toBe("bag");
    expect(classifyLineKind("Su Tüketim Bedeli", 320)).toBe("fee");
    expect(classifyLineKind("YUVARLAMA", 0.05)).toBe("fee");
    expect(classifyLineKind("İŞÇİLİK", 250)).toBe("fee");
    // Fused-word bag size: "boy" glued into "büyükboy" escaped the \bboy\b context.
    // PROD (2026-07-17) generated a task for "POSET(BUYUKBOY)" — a bag.
    expect(classifyLineKind("POSET(BUYUKBOY)", 1)).toBe("bag");
    expect(classifyLineKind("POŞET(BÜYÜKBOY)", 1)).toBe("bag");
    expect(classifyLineKind("KÜÇÜKBOY POŞET", 0.5)).toBe("bag");
  });

  it("classifies bank-statement transaction lines as non-product", () => {
    // These reach the unresolved-product pool from statements parsed line by line.
    expect(classifyLineKind("DK İLE HESABA PARA YATIRMA", 500)).toBe("payment");
    expect(classifyLineKind("GİDEN FAST İŞLEMİ", 1200)).toBe("payment");
    expect(classifyLineKind("BİREYSEL ÖDEME", 300)).toBe("payment");
    expect(classifyLineKind("PARA ÇEKME", 200)).toBe("payment");
  });

  it("classifies register/statement totals as other", () => {
    expect(classifyLineKind("İŞLEM TUTARI", 45)).toBe("other");
    expect(classifyLineKind("DÖNEM TUTARI", 90)).toBe("other");
    expect(classifyLineKind("EMU SATIŞ TUTARI", 60)).toBe("other");
    expect(classifyLineKind("DEPARTMAN%0", 55)).toBe("other");
    expect(classifyLineKind("DEPARTMAN%18", 55)).toBe("other");
  });

  it("classifies register department/aisle labels", () => {
    expect(classifyLineKind("TEKEL", 275)).toBe("department");
    expect(classifyLineKind("TEKEL 275", 275)).toBe("department");
    expect(classifyLineKind("HIRDAVAT", 120)).toBe("department");
    expect(classifyLineKind("MANAV", 89)).toBe("department");
    expect(classifyLineKind("GIDA", 45)).toBe("department");
    expect(classifyLineKind("GİYİM", 300)).toBe("department");
  });

  it("classifies vehicle fuel rows", () => {
    expect(classifyLineKind("MOTORİN", 1500)).toBe("fuel");
    expect(classifyLineKind("OTOGAZ", 400)).toBe("fuel");
    expect(classifyLineKind("LPG OTOGAZ", 380)).toBe("fuel");
    expect(classifyLineKind("V MAX KURŞUNSUZ 95 BENZİN", 900)).toBe("fuel");
    expect(classifyLineKind("Excellium Motorin", 1200)).toBe("fuel");
    expect(classifyLineKind("Akaryakıt", 700)).toBe("fuel");
  });

  it("classifies register noise as other", () => {
    expect(classifyLineKind("SATIŞ", 100)).toBe("other");
    expect(classifyLineKind("TOPLAM", 500)).toBe("other");
    expect(classifyLineKind("Toplam Fatura Tutarı", 500)).toBe("other");
    expect(classifyLineKind("TAXABLE T1", 10)).toBe("other");
    expect(classifyLineKind("Taxable Item", 10)).toBe("other");
    expect(classifyLineKind("Unknown Item", 10)).toBe("other");
    expect(classifyLineKind("12x25", 10)).toBe("other"); // letterless
    expect(classifyLineKind("2 Adt X 349.00", 698)).toBe("other"); // OCR fragment
    expect(classifyLineKind("", 10)).toBe("other");
  });

  it("gates canonicalization on product kind only", () => {
    expect(isCanonicalizableLineKind("product")).toBe(true);
    expect(isCanonicalizableLineKind(null)).toBe(true); // legacy rows
    expect(isCanonicalizableLineKind(undefined)).toBe(true);
    expect(isCanonicalizableLineKind("discount")).toBe(false);
    expect(isCanonicalizableLineKind("department")).toBe(false);
    expect(isCanonicalizableLineKind("fuel")).toBe(false);
  });
});

describe("extractCanonicalFromVision → line_kind", () => {
  it("stamps every observation with its kind on the write path", () => {
    const payload = extractCanonicalFromVision(null, {
      receiptId: "test-receipt",
      merchantName: "BIM BIRLESIK MAGAZALAR A.S.",
      geminiLineItems: [
        { name: "SÜTAŞ YOĞURT 1KG", totalPrice: 89.5 },
        { name: "ALIŞVERİŞ POŞETİ BİM", totalPrice: 0.25 },
        { name: "% 40 İNDİRİM", totalPrice: 12 },
        { name: "TOPKDV", totalPrice: 8.2 },
        { name: "TEKEL", totalPrice: 275 },
      ],
    });
    const kinds = payload.observations.map((o) => o.line_kind);
    expect(kinds).toEqual(["product", "bag", "discount", "tax", "department"]);
    const products = payload.observations.filter((o) =>
      isCanonicalizableLineKind(o.line_kind)
    );
    expect(products.map((o) => o.raw_name)).toEqual(["SÜTAŞ YOĞURT 1KG"]);
  });
});

describe("isSizeOnlyProductSlug", () => {
  it("rejects size-only slugs", () => {
    expect(isSizeOnlyProductSlug("1_5_l")).toBe(true);
    expect(isSizeOnlyProductSlug("2_5_l")).toBe(true);
    expect(isSizeOnlyProductSlug("75_g")).toBe(true);
    expect(isSizeOnlyProductSlug("330ml")).toBe(true);
    expect(isSizeOnlyProductSlug("6x200ml")).toBe(true);
    expect(isSizeOnlyProductSlug("")).toBe(true);
  });

  it("keeps slugs that name a product or brand", () => {
    expect(isSizeOnlyProductSlug("su_0_5_l")).toBe(false);
    expect(isSizeOnlyProductSlug("pepsi_1_5_l")).toBe(false);
    expect(isSizeOnlyProductSlug("tadim_antep_fistigi")).toBe(false);
    expect(isSizeOnlyProductSlug("gofret_47g")).toBe(false);
  });
});

describe("merchant validation write gates", () => {
  it("rejects letterless candidates (numbers, phones)", () => {
    expect(validateOcrMerchant("12")).toBe(false);
    expect(validateOcrMerchant("99")).toBe(false);
    expect(validateOcrMerchant("05424113578")).toBe(false);
  });

  it("rejects thank-you / tax-id / screen-header lines", () => {
    expect(isForbiddenMerchant("*TEŞEKKÜR EDERİZ* KARŞIYAKA/IZMIR")).toBe(true);
    expect(isForbiddenMerchant("TEŞEKKÜR EDERİZ.")).toBe(true);
    expect(isForbiddenMerchant("TCKN/VKN:11111111111-NIHAI TUKETICI")).toBe(true);
    expect(isForbiddenMerchant("Sipariş Detayları")).toBe(true);
    expect(isForbiddenMerchant("ALİŞVERİŞ KARTI")).toBe(true);
    expect(isForbiddenMerchant("null")).toBe(true);
  });

  it("rejects bare generic store types but keeps named stores", () => {
    expect(isForbiddenMerchant("MARKET")).toBe(true);
    expect(isForbiddenMerchant("DEPO")).toBe(true);
    expect(isForbiddenMerchant("FILE MARKET")).toBe(false);
    expect(isForbiddenMerchant("CESURMAR")).toBe(false);
  });

  it("anchors chain patterns on OCR legal names, never on lookalikes", () => {
    // The exact failure that left BIM ×108 receipts unlinked
    expect(isPatternAnchoredMatch("BIM BIRLESIK MAGAZALAR A.S.", "bim")).toBe(true);
    expect(isPatternAnchoredMatch("A101 Yeni Mağazacılık A.Ş. Genel Merkez", "a101")).toBe(true);
    expect(isPatternAnchoredMatch("SOK MARKETLER T.A.S.", "sok")).toBe(true);
    // Turkish-folded multi-token pattern
    expect(isPatternAnchoredMatch("BIM BIRLESIK MAGAZALAR A.S.", "bim birleşik")).toBe(true);
    // Single-token pattern must be the FIRST token — no substring lookalikes
    expect(isPatternAnchoredMatch("BIMEKS TEKNOLOJI A.S.", "bim")).toBe(false);
    expect(isPatternAnchoredMatch("SOKAK LEZZETLERI", "sok")).toBe(false);
    expect(isPatternAnchoredMatch("ELIT BIM MARKET", "bim")).toBe(false);
    // Multi-token pattern may sit anywhere as a whole-token run
    expect(isPatternAnchoredMatch("TR BIM BIRLESIK MAGAZALAR", "bim birlesik")).toBe(true);
    // Owner check: a learned sub-brand token must not claim another business
    expect(isPatternAnchoredMatch("JET PIZZA", "jet", "Migros")).toBe(false);
    expect(isPatternAnchoredMatch("MIGROS JET", "migros", "Migros")).toBe(true);
    expect(isPatternAnchoredMatch("BIM BIRLESIK MAGAZALAR A.S.", "bim", "BIM")).toBe(true);
    expect(isPatternAnchoredMatch("ŞOK MARKETLER TİC.A.Ş.", "sok", "Şok Marketler")).toBe(true);
  });

  it("rejects device brands and phone models, keeps real merchants", () => {
    expect(isForbiddenMerchant("TOSHIBA")).toBe(true);
    expect(isForbiddenMerchant("POCO X7 Pro")).toBe(true);
    expect(isForbiddenMerchant("BIM BIRLESIK MAGAZALAR A.S.")).toBe(false);
    expect(isForbiddenMerchant("7-Eleven")).toBe(false);
    expect(isForbiddenMerchant("7-11")).toBe(false); // letterless whitelist
    expect(isForbiddenMerchant("Tarım Kredi Kooperatifi")).toBe(false);
  });
});
