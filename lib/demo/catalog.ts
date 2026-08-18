import type { CanonicalReceiptCategory } from "@/lib/receipt/categories";
import type { CanonicalProductCategory } from "@/lib/receipt/category-taxonomy";

export type DemoMerchantType =
  | CanonicalReceiptCategory
  | "coffee"
  | "dining"
  | "home"
  | "pet"
  | "books";

export interface DemoMerchant {
  name: string;
  type: DemoMerchantType;
  /** Maps onto receipts.merchant_category (canonical receipt slug). */
  category: CanonicalReceiptCategory;
  factor: number;
  district: string;
  hourRange: [number, number];
}

export interface DemoProduct {
  raw: string;
  canon: string;
  brand: string | null;
  pack: number | null;
  unit: string | null;
  /** Mid-2026 TRY shelf price (today). Drifted backward in the plan. */
  base: number;
  cat1: CanonicalProductCategory;
  path: string;
  weight: number;
  /** Inclusive day-ago window; omitted = always available. */
  window?: [number, number];
}

export const DEMO_MERCHANTS: DemoMerchant[] = [
  { name: "Migros", type: "grocery", category: "grocery", factor: 1.0, district: "Kadıköy", hourRange: [17, 21] },
  { name: "Migros Jet", type: "grocery", category: "grocery", factor: 1.01, district: "Moda", hourRange: [18, 21] },
  { name: "A101", type: "grocery", category: "grocery", factor: 0.94, district: "Kadıköy", hourRange: [17, 20] },
  { name: "BİM", type: "grocery", category: "grocery", factor: 0.93, district: "Acıbadem", hourRange: [16, 20] },
  { name: "ŞOK Market", type: "grocery", category: "grocery", factor: 0.95, district: "Göztepe", hourRange: [17, 20] },
  { name: "CarrefourSA", type: "grocery", category: "grocery", factor: 1.02, district: "Kozyatağı", hourRange: [16, 21] },
  { name: "Macrocenter", type: "grocery", category: "grocery", factor: 1.14, district: "Suadiye", hourRange: [12, 19] },
  { name: "Starbucks", type: "cafe", category: "cafe", factor: 1.0, district: "Bağdat Caddesi", hourRange: [8, 11] },
  { name: "Espressolab", type: "cafe", category: "cafe", factor: 0.9, district: "Moda", hourRange: [9, 12] },
  { name: "Kahve Dünyası", type: "cafe", category: "cafe", factor: 0.85, district: "Kadıköy", hourRange: [10, 16] },
  { name: "Simit Sarayı", type: "cafe", category: "cafe", factor: 0.5, district: "Üsküdar", hourRange: [7, 10] },
  { name: "Köfteci Yusuf", type: "restaurant", category: "restaurant", factor: 1.0, district: "Ataşehir", hourRange: [19, 22] },
  { name: "Domino's Pizza", type: "restaurant", category: "restaurant", factor: 1.0, district: "Kadıköy", hourRange: [19, 23] },
  { name: "Burger King", type: "restaurant", category: "restaurant", factor: 1.0, district: "Kozyatağı", hourRange: [12, 21] },
  { name: "Big Chefs", type: "restaurant", category: "restaurant", factor: 1.35, district: "Suadiye", hourRange: [19, 22] },
  { name: "Opet", type: "fuel", category: "fuel", factor: 1.0, district: "E-5 Üzeri", hourRange: [9, 19] },
  { name: "Shell", type: "fuel", category: "fuel", factor: 1.01, district: "Ataşehir", hourRange: [8, 20] },
  { name: "Gratis", type: "personal_care", category: "personal_care", factor: 1.0, district: "Kadıköy", hourRange: [13, 18] },
  { name: "Watsons", type: "beauty", category: "beauty", factor: 1.02, district: "Akasya AVM", hourRange: [14, 19] },
  { name: "Rossmann", type: "personal_care", category: "personal_care", factor: 0.98, district: "Optimum AVM", hourRange: [13, 18] },
];

/** One-off / sector-coverage merchants. Each visit uses the listed basket. */
export interface DemoOneOff {
  merchant: DemoMerchant;
  items: DemoProduct[];
}

export const DEMO_GROCERY: DemoProduct[] = [
  { raw: "SÜTAŞ SÜZME YOĞURT 900G", canon: "sutas_suzme_yogurt", brand: "Sütaş", pack: 900, unit: "g", base: 99.9, cat1: "groceries", path: "groceries>dairy>yogurt", weight: 6 },
  { raw: "SÜTAŞ SÜZME YOĞURT 400G", canon: "sutas_suzme_yogurt", brand: "Sütaş", pack: 400, unit: "g", base: 64.5, cat1: "groceries", path: "groceries>dairy>yogurt", weight: 4 },
  { raw: "PINAR SÜT TAM YAĞLI 1L", canon: "pinar_sut_1l", brand: "Pınar", pack: 1, unit: "l", base: 42.5, cat1: "groceries", path: "groceries>dairy>milk", weight: 8 },
  { raw: "SEK YARIM YAĞLI SÜT 1L", canon: "sek_sut_1l", brand: "SEK", pack: 1, unit: "l", base: 39.75, cat1: "groceries", path: "groceries>dairy>milk", weight: 4 },
  { raw: "PINAR BEYAZ PEYNİR 500G", canon: "pinar_beyaz_peynir_500g", brand: "Pınar", pack: 500, unit: "g", base: 189.9, cat1: "groceries", path: "groceries>dairy>cheese", weight: 5 },
  { raw: "UNO TAM BUĞDAY EKMEK 350G", canon: "uno_tam_bugday_ekmek", brand: "Uno", pack: 350, unit: "g", base: 27.5, cat1: "groceries", path: "groceries>bakery>bread", weight: 7 },
  { raw: "HALK EKMEK", canon: "halk_ekmek", brand: null, pack: null, unit: null, base: 12.5, cat1: "groceries", path: "groceries>bakery>bread", weight: 8 },
  { raw: "CP YUMURTA 15Lİ", canon: "cp_yumurta_15li", brand: "CP", pack: 15, unit: "adet", base: 94.9, cat1: "groceries", path: "groceries>eggs>eggs", weight: 6 },
  { raw: "ÜLKER ÇİKOLATALI GOFRET 40G", canon: "ulker_cikolatali_gofret", brand: "Ülker", pack: 40, unit: "g", base: 12.75, cat1: "groceries", path: "groceries>snacks>wafer", weight: 5, window: [179, 45] },
  { raw: "ÜLKER ÇİKOLATALI GOFRET 36G", canon: "ulker_cikolatali_gofret", brand: "Ülker", pack: 36, unit: "g", base: 13.0, cat1: "groceries", path: "groceries>snacks>wafer", weight: 5, window: [44, 0] },
  { raw: "ETİ CRAX BAHARATLI 50G", canon: "eti_crax_50g", brand: "Eti", pack: 50, unit: "g", base: 11.5, cat1: "groceries", path: "groceries>snacks>crackers", weight: 3 },
  { raw: "ERİKLİ DOĞAL KAYNAK SUYU 5L", canon: "erikli_su", brand: "Erikli", pack: 5, unit: "l", base: 34.5, cat1: "groceries", path: "groceries>beverages>water", weight: 6 },
  { raw: "ERİKLİ SU 0.5L", canon: "erikli_su", brand: "Erikli", pack: 0.5, unit: "l", base: 12.0, cat1: "groceries", path: "groceries>beverages>water", weight: 4 },
  { raw: "COCA-COLA 1L", canon: "coca_cola", brand: "Coca-Cola", pack: 1, unit: "l", base: 52.5, cat1: "groceries", path: "groceries>beverages>cola", weight: 4 },
  { raw: "COCA-COLA KUTU 330ML", canon: "coca_cola", brand: "Coca-Cola", pack: 0.33, unit: "l", base: 32.5, cat1: "groceries", path: "groceries>beverages>cola", weight: 4 },
  { raw: "RED BULL 250ML", canon: "red_bull", brand: "Red Bull", pack: 0.25, unit: "l", base: 64.9, cat1: "groceries", path: "groceries>beverages>energy", weight: 2 },
  { raw: "RED BULL 473ML", canon: "red_bull", brand: "Red Bull", pack: 0.473, unit: "l", base: 94.9, cat1: "groceries", path: "groceries>beverages>energy", weight: 2 },
  { raw: "DOMATES KG", canon: "domates", brand: null, pack: null, unit: "kg", base: 55.0, cat1: "groceries", path: "groceries>produce>tomato", weight: 6 },
  { raw: "MUZ İTHAL KG", canon: "muz_ithal", brand: null, pack: null, unit: "kg", base: 89.9, cat1: "groceries", path: "groceries>produce>banana", weight: 4 },
  { raw: "BANVİT PİLİÇ BAGET 1KG", canon: "banvit_pilic_baget", brand: "Banvit", pack: 1, unit: "kg", base: 154.9, cat1: "groceries", path: "groceries>meat>chicken", weight: 4 },
  { raw: "YUDUM AYÇİÇEK YAĞI 2L", canon: "yudum_aycicek_2l", brand: "Yudum", pack: 2, unit: "l", base: 229.9, cat1: "groceries", path: "groceries>pantry>oil", weight: 3 },
  { raw: "FAIRY PLATINUM SIVI 650ML", canon: "fairy_platinum_650ml", brand: "Fairy", pack: 650, unit: "ml", base: 154.9, cat1: "groceries", path: "groceries>household>dish-soap", weight: 3 },
  { raw: "SELPAK TUVALET KAĞIDI 16LI", canon: "selpak_16li", brand: "Selpak", pack: 16, unit: "adet", base: 234.9, cat1: "groceries", path: "groceries>household>paper", weight: 3 },
  { raw: "TORKU FISTIKLI ÇİKOLATA 70G", canon: "torku_cikolata_70g", brand: "Torku", pack: 70, unit: "g", base: 42.5, cat1: "groceries", path: "groceries>snacks>chocolate", weight: 3 },
];

export const DEMO_CAFE: DemoProduct[] = [
  { raw: "FİLTRE KAHVE GRANDE", canon: "filtre_kahve", brand: null, pack: null, unit: null, base: 105.0, cat1: "restaurant", path: "restaurant>coffee>filter", weight: 6 },
  { raw: "CAFFE LATTE GRANDE", canon: "caffe_latte", brand: null, pack: null, unit: null, base: 135.0, cat1: "restaurant", path: "restaurant>coffee>latte", weight: 5 },
  { raw: "SAN SEBASTIAN CHEESECAKE", canon: "cheesecake_dilim", brand: null, pack: null, unit: null, base: 185.0, cat1: "restaurant", path: "restaurant>dessert>cheesecake", weight: 3 },
  { raw: "SUSAMLI SİMİT", canon: "simit", brand: null, pack: null, unit: null, base: 17.5, cat1: "restaurant", path: "restaurant>bakery>simit", weight: 4 },
];

export const DEMO_DINING: DemoProduct[] = [
  { raw: "KÖFTE PORSİYON 8Lİ", canon: "kofte_porsiyon", brand: null, pack: null, unit: null, base: 285.0, cat1: "restaurant", path: "restaurant>meal>kofte", weight: 4 },
  { raw: "AYRAN 300ML", canon: "ayran_300ml", brand: null, pack: null, unit: null, base: 30.0, cat1: "restaurant", path: "restaurant>beverages>ayran", weight: 5 },
  { raw: "MERCİMEK ÇORBASI", canon: "mercimek_corbasi", brand: null, pack: null, unit: null, base: 95.0, cat1: "restaurant", path: "restaurant>meal>soup", weight: 3 },
  { raw: "ORTA BOY MARGARITA PİZZA", canon: "margarita_pizza", brand: null, pack: null, unit: null, base: 239.0, cat1: "restaurant", path: "restaurant>meal>pizza", weight: 3 },
  { raw: "WHOPPER MENÜ", canon: "whopper_menu", brand: null, pack: null, unit: null, base: 275.0, cat1: "restaurant", path: "restaurant>fastfood>menu", weight: 3 },
];

export const DEMO_FUEL: DemoProduct[] = [
  { raw: "KURŞUNSUZ BENZİN 95", canon: "kursunsuz_benzin_95", brand: null, pack: null, unit: "l", base: 47.8, cat1: "fuel", path: "fuel>petrol>95", weight: 1 },
];

export const DEMO_CARE: DemoProduct[] = [
  { raw: "NIVEA NEMLENDİRİCİ KREM 200ML", canon: "nivea_krem_200ml", brand: "Nivea", pack: 200, unit: "ml", base: 189.9, cat1: "cosmetics", path: "cosmetics>skin>moisturizer", weight: 3 },
  { raw: "OGX ARGAN ŞAMPUAN 385ML", canon: "ogx_sampuan_385ml", brand: "OGX", pack: 385, unit: "ml", base: 289.9, cat1: "cosmetics", path: "cosmetics>hair>shampoo", weight: 2 },
  { raw: "GILLETTE FUSION 4LÜ BIÇAK", canon: "gillette_fusion_4lu", brand: "Gillette", pack: 4, unit: "adet", base: 449.9, cat1: "cosmetics", path: "cosmetics>shaving>blades", weight: 2 },
];

export const DEMO_BEAUTY: DemoProduct[] = [
  { raw: "MAYBELLINE SKY HIGH MASKARA", canon: "maybelline_sky_high", brand: "Maybelline", pack: 1, unit: "adet", base: 449.9, cat1: "cosmetics", path: "cosmetics>makeup>mascara", weight: 3 },
  { raw: "L'OREAL ELSEVE ŞAMPUAN 360ML", canon: "loreal_elseve_360ml", brand: "L'Oreal", pack: 360, unit: "ml", base: 219.9, cat1: "cosmetics", path: "cosmetics>hair>shampoo", weight: 2 },
];

export const POOLS: Partial<Record<DemoMerchantType, DemoProduct[]>> = {
  grocery: DEMO_GROCERY,
  cafe: DEMO_CAFE,
  restaurant: DEMO_DINING,
  fuel: DEMO_FUEL,
  personal_care: DEMO_CARE,
  beauty: DEMO_BEAUTY,
};

function m(
  name: string,
  type: DemoMerchantType,
  category: CanonicalReceiptCategory,
  district: string,
  hours: [number, number]
): DemoMerchant {
  return { name, type, category, factor: 1, district, hourRange: hours };
}

export const DEMO_ONE_OFFS: DemoOneOff[] = [
  { merchant: m("LC Waikiki", "apparel", "apparel", "Kadıköy", [14, 19]), items: [
    { raw: "LCW BASIC PAMUKLU T-SHIRT", canon: "lcw_basic_tshirt", brand: "Lcw", pack: 1, unit: "adet", base: 299.99, cat1: "apparel", path: "apparel>tops>tshirt", weight: 1 },
    { raw: "LCW SLIM FIT KOT PANTOLON", canon: "lcw_slim_jean", brand: "Lcw", pack: 1, unit: "adet", base: 899.99, cat1: "apparel", path: "apparel>bottoms>jeans", weight: 1 },
  ]},
  { merchant: m("Koton", "fashion", "fashion", "Zorlu AVM", [14, 19]), items: [
    { raw: "KOTON KETEN GÖMLEK", canon: "koton_keten_gomlek", brand: "Koton", pack: 1, unit: "adet", base: 649.99, cat1: "apparel", path: "apparel>tops>shirt", weight: 1 },
  ]},
  { merchant: m("Mavi", "fashion", "fashion", "Bağdat Caddesi", [15, 20]), items: [
    { raw: "MAVİ JAMES JEAN", canon: "mavi_james_jean", brand: "Mavi", pack: 1, unit: "adet", base: 1299.0, cat1: "apparel", path: "apparel>bottoms>jeans", weight: 1 },
  ]},
  { merchant: m("Teknosa", "electronics", "electronics", "Akasya AVM", [14, 19]), items: [
    { raw: "LOGITECH M185 KABLOSUZ MOUSE", canon: "logitech_m185", brand: "Logitech", pack: 1, unit: "adet", base: 549.0, cat1: "electronics", path: "electronics>accessories>mouse", weight: 1 },
    { raw: "ANKER USB-C KABLO 1M", canon: "anker_usbc_1m", brand: "Anker", pack: 1, unit: "adet", base: 329.0, cat1: "electronics", path: "electronics>accessories>cable", weight: 1 },
  ]},
  { merchant: m("MediaMarkt", "electronics", "electronics", "Tepe Nautilus", [14, 19]), items: [
    { raw: "PHILIPS HUE AMPUL E27", canon: "philips_hue_e27", brand: "Philips", pack: 1, unit: "adet", base: 799.0, cat1: "electronics", path: "electronics>smart-home>bulb", weight: 1 },
  ]},
  { merchant: m("D&R", "specialty_retail", "specialty_retail", "Kadıköy", [15, 19]), items: [
    { raw: "KİTAP - TUTUNAMAYANLAR", canon: "kitap_tutunamayanlar", brand: "İletişim", pack: 1, unit: "adet", base: 245.0, cat1: "other", path: "other>books>novel", weight: 1 },
    { raw: "MOLESKINE DEFTER A5", canon: "moleskine_a5", brand: "Moleskine", pack: 1, unit: "adet", base: 690.0, cat1: "other", path: "other>stationery>notebook", weight: 1 },
  ]},
  { merchant: m("IKEA", "specialty_retail", "specialty_retail", "Ümraniye", [13, 18]), items: [
    { raw: "LACK SEHPA BEYAZ", canon: "ikea_lack_sehpa", brand: "IKEA", pack: 1, unit: "adet", base: 1250.0, cat1: "home", path: "home>furniture>table", weight: 1 },
  ]},
  { merchant: m("Koçtaş", "specialty_retail", "specialty_retail", "Kadıköy", [13, 18]), items: [
    { raw: "STANLEY TORNAVİDA SETİ", canon: "stanley_tornavida", brand: "Stanley", pack: 1, unit: "adet", base: 459.0, cat1: "home", path: "home>tools>screwdriver", weight: 1 },
  ]},
  { merchant: m("Decathlon", "sports", "sports", "Ataşehir", [12, 17]), items: [
    { raw: "QUECHUA MATARA 1L", canon: "quechua_matara_1l", brand: "Quechua", pack: 1, unit: "l", base: 349.0, cat1: "sports", path: "sports>outdoor>bottle", weight: 1 },
    { raw: "DOMYOS YOGA MATI", canon: "domyos_yoga_mati", brand: "Domyos", pack: 1, unit: "adet", base: 499.0, cat1: "sports", path: "sports>fitness>mat", weight: 1 },
  ]},
  { merchant: m("Flo", "apparel", "apparel", "Kadıköy", [14, 19]), items: [
    { raw: "KINETIX KOŞU AYAKKABISI", canon: "kinetix_kosu", brand: "Kinetix", pack: 1, unit: "adet", base: 999.99, cat1: "apparel", path: "apparel>shoes>running", weight: 1 },
  ]},
  { merchant: m("Petzzshop", "other", "other", "Moda", [12, 17]), items: [
    { raw: "WHISKAS KEDİ MAMASI 1.4KG", canon: "whiskas_1_4kg", brand: "Whiskas", pack: 1.4, unit: "kg", base: 489.9, cat1: "pets", path: "pets>cat>food", weight: 1 },
  ]},
  { merchant: m("Ada Çiçekçilik", "other", "other", "Kadıköy", [11, 16]), items: [
    { raw: "MEVSİM BUKETİ", canon: "mevsim_buketi", brand: null, pack: 1, unit: "adet", base: 550.0, cat1: "other", path: "other>flowers>bouquet", weight: 1 },
  ]},
  { merchant: m("Tekel Şarküteri", "kiosk", "kiosk", "Moda", [18, 22]), items: [
    { raw: "ÇEREZ KARIŞIK 250G", canon: "cerez_karisik_250g", brand: null, pack: 250, unit: "g", base: 189.0, cat1: "groceries", path: "groceries>snacks>nuts", weight: 1 },
    { raw: "SU 0.5L", canon: "su_05l", brand: null, pack: 0.5, unit: "l", base: 15.0, cat1: "groceries", path: "groceries>beverages>water", weight: 1 },
  ]},
  { merchant: m("Tütün Dünyası", "tobacco", "tobacco", "Kadıköy", [16, 21]), items: [
    { raw: "MALBORO RED KUTU", canon: "marlboro_red", brand: "Marlboro", pack: 20, unit: "adet", base: 92.0, cat1: "tobacco", path: "tobacco>cigarettes>box", weight: 1 },
  ]},
  { merchant: m("Mey Bakkal", "alcohol", "alcohol", "Moda", [17, 21]), items: [
    { raw: "EFES PİLSEN 50CL", canon: "efes_pilsen_50cl", brand: "Efes", pack: 0.5, unit: "l", base: 62.5, cat1: "alcohol", path: "alcohol>beer>lager", weight: 1 },
    { raw: "YENİ RAKI 35CL", canon: "yeni_raki_35cl", brand: "Yeni Rakı", pack: 0.35, unit: "l", base: 389.0, cat1: "alcohol", path: "alcohol>spirits>raki", weight: 1 },
  ]},
  { merchant: m("Eczane Moda", "pharmacy", "pharmacy", "Moda", [11, 18]), items: [
    { raw: "PAROL 500 MG 20 TABLET", canon: "parol_500_20", brand: "Parol", pack: 20, unit: "adet", base: 89.9, cat1: "pharmacy", path: "pharmacy>otc>pain", weight: 1 },
    { raw: "BEPANTHOL KREM 30G", canon: "bepanthol_30g", brand: "Bepanthol", pack: 30, unit: "g", base: 164.9, cat1: "pharmacy", path: "pharmacy>otc>cream", weight: 1 },
  ]},
  { merchant: m("CK Boğaziçi Elektrik", "utilities", "utilities", "Kadıköy", [10, 12]), items: [
    { raw: "ELEKTRİK TÜKETİM BEDELİ", canon: "elektrik_tuketim", brand: null, pack: null, unit: null, base: 1450.0, cat1: "services", path: "services>utilities>electricity", weight: 1 },
  ]},
  { merchant: m("İSKİ", "utilities", "utilities", "Kadıköy", [10, 12]), items: [
    { raw: "SU TÜKETİM BEDELİ", canon: "su_tuketim", brand: null, pack: null, unit: null, base: 520.0, cat1: "services", path: "services>utilities>water", weight: 1 },
  ]},
  { merchant: m("İGDAŞ", "utilities", "utilities", "Kadıköy", [10, 12]), items: [
    { raw: "DOĞALGAZ TÜKETİM BEDELİ", canon: "dogalgaz_tuketim", brand: null, pack: null, unit: null, base: 980.0, cat1: "services", path: "services>utilities>gas", weight: 1 },
  ]},
  { merchant: m("Türk Telekom", "utilities", "utilities", "Kadıköy", [10, 12]), items: [
    { raw: "FİBER İNTERNET AYLIK", canon: "fiber_internet", brand: "Türk Telekom", pack: null, unit: null, base: 649.5, cat1: "services", path: "services>telecom>internet", weight: 1 },
  ]},
  { merchant: m("TCDD Taşımacılık", "travel", "travel", "Kadıköy", [11, 16]), items: [
    { raw: "YHT İSTANBUL-ANKARA BİLET", canon: "yht_ist_ank", brand: "TCDD", pack: 1, unit: "adet", base: 890.0, cat1: "services", path: "services>travel>rail", weight: 1 },
  ]},
  { merchant: m("Pegasus", "travel", "travel", "Sabiha Gökçen", [6, 9]), items: [
    { raw: "SAW-AYT EKONOMİ BİLET", canon: "saw_ayt_ekonomi", brand: "Pegasus", pack: 1, unit: "adet", base: 1840.0, cat1: "services", path: "services>travel>air", weight: 1 },
  ]},
  { merchant: m("The Stay Hotel", "hospitality_lodging", "hospitality_lodging", "Beşiktaş", [14, 16]), items: [
    { raw: "KONAKLAMA 1 GECE", canon: "konaklama_1_gece", brand: null, pack: 1, unit: "adet", base: 2800.0, cat1: "hospitality", path: "hospitality>lodging>room", weight: 1 },
  ]},
  { merchant: m("Acıbadem Klinik", "healthcare", "healthcare", "Acıbadem", [10, 16]), items: [
    { raw: "DİŞ MUAYENE + DOLGU", canon: "dis_muayene_dolgu", brand: null, pack: 1, unit: "adet", base: 1850.0, cat1: "other", path: "other>healthcare>dental", weight: 1 },
  ]},
  { merchant: m("Kuaför Deniz", "services", "services", "Moda", [14, 18]), items: [
    { raw: "SAÇ KESİM", canon: "sac_kesim", brand: null, pack: 1, unit: "adet", base: 750.0, cat1: "services", path: "services>personal>haircut", weight: 1 },
  ]},
  { merchant: m("Oto Yıkama Moda", "services", "services", "Moda", [11, 16]), items: [
    { raw: "ARAÇ YIKAMA TAM", canon: "arac_yikama", brand: null, pack: 1, unit: "adet", base: 450.0, cat1: "services", path: "services>auto>wash", weight: 1 },
  ]},
];

/** Sector-typical hidden-cost share used only for the labeled sample account. */
export const HIDDEN_RATIO: Record<CanonicalReceiptCategory, number> = {
  cafe: 0.48,
  restaurant: 0.55,
  grocery: 0.28,
  kiosk: 0.30,
  apparel: 0.50,
  electronics: 0.22,
  fuel: 0.42,
  alcohol: 0.55,
  tobacco: 0.70,
  pharmacy: 0.35,
  fashion: 0.50,
  beauty: 0.48,
  personal_care: 0.40,
  utilities: 0.12,
  travel: 0.30,
  hospitality_lodging: 0.40,
  healthcare: 0.22,
  services: 0.20,
  specialty_retail: 0.35,
  sports: 0.40,
  other: 0.25,
};
