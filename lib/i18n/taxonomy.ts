/**
 * Taxonomy labels — human-readable names for receipt budget categories
 * and canonical product taxonomy paths.
 *
 * Phase 1 scope: en + tr. Other locales fall back to en (filled in Phase 3).
 */

import type { YumoLocale, UserFacingText } from "@/lib/product-architecture/dashboard-contract";
import { SERVICE_CATEGORY_LABELS } from "@/lib/service-providers/categories";

export { SERVICE_CATEGORY_LABELS };

/* ------------------------------------------------------------------
 * Budget category labels (flat receipt category slugs)
 * ------------------------------------------------------------------ */

export const BUDGET_CATEGORY_LABELS: Record<string, UserFacingText> = {
  // Needs
  grocery: { en: "Groceries", tr: "Market" },
  groceries: { en: "Groceries", tr: "Market" },
  food: { en: "Food", tr: "Yiyecek" },
  health: { en: "Health", tr: "Sağlık" },
  pharmacy: { en: "Pharmacy", tr: "Eczane" },
  transport: { en: "Transport", tr: "Ulaşım" },
  utility: { en: "Utilities", tr: "Faturalar" },
  utilities: { en: "Utilities", tr: "Faturalar" },
  home: { en: "Home", tr: "Ev" },
  housing: { en: "Housing", tr: "Konut" },

  // Wants
  cafe: { en: "Cafe", tr: "Kafe" },
  restaurant: { en: "Restaurant", tr: "Restoran" },
  restaurants: { en: "Restaurants", tr: "Restoranlar" },
  dining: { en: "Dining", tr: "Yeme-içme" },
  entertainment: { en: "Entertainment", tr: "Eğlence" },
  shopping: { en: "Shopping", tr: "Alışveriş" },
  electronics: { en: "Electronics", tr: "Elektronik" },
  beauty: { en: "Beauty", tr: "Güzellik" },
  travel: { en: "Travel", tr: "Seyahat" },

  // Impulse-fingerprint wants
  fast_food: { en: "Fast food", tr: "Fast food" },
  coffee: { en: "Coffee", tr: "Kahve" },
  bar: { en: "Bar", tr: "Bar" },
  alcohol: { en: "Alcohol", tr: "Alkol" },
  delivery: { en: "Delivery", tr: "Paket servis" },
  food_delivery: { en: "Food delivery", tr: "Yemek siparişi" },
  snack: { en: "Snacks", tr: "Atıştırmalık" },
  dessert: { en: "Dessert", tr: "Tatlı" },
  bakery: { en: "Bakery", tr: "Fırın" },
  ice_cream: { en: "Ice cream", tr: "Dondurma" },
  streaming: { en: "Streaming", tr: "Dijital yayın platformu" },
  gaming: { en: "Gaming", tr: "Oyun" },

  // Upload-window penalty categories
  telecom: { en: "Telecom", tr: "Telekom" },
  insurance: { en: "Insurance", tr: "Sigorta" },
  rent: { en: "Rent", tr: "Kira" },
  healthcare: { en: "Healthcare", tr: "Sağlık hizmetleri" },

  // Product-intelligence categories
  prepared_food: { en: "Prepared food", tr: "Hazır yemek" },
  hot_drinks: { en: "Hot drinks", tr: "Sıcak içecekler" },
  groceries_fmcg: { en: "Groceries (FMCG)", tr: "Market (hızlı tüketim)" },
  gida: { en: "Food", tr: "Gıda" },
  gıda: { en: "Food", tr: "Gıda" },
  vegetables: { en: "Vegetables", tr: "Sebze" },
  fruits: { en: "Fruits", tr: "Meyve" },
  meat: { en: "Meat", tr: "Et" },
  dairy: { en: "Dairy", tr: "Süt ürünleri" },
  grains: { en: "Grains", tr: "Tahıl" },
  condiments: { en: "Condiments", tr: "Baharat ve sos" },
  oils: { en: "Oils", tr: "Yağ" },
  beverages: { en: "Beverages", tr: "İçecek" },

  // Common catch-alls
  other: { en: "Other", tr: "Diğer" },
  supermarket: { en: "Supermarket", tr: "Süpermarket" },
  market: { en: "Market", tr: "Market" },
  fuel: { en: "Fuel", tr: "Yakıt" },
  gas: { en: "Gas", tr: "Benzin/LPG" },
  electricity: { en: "Electricity", tr: "Elektrik" },
  water: { en: "Water", tr: "Su" },
  education: { en: "Education", tr: "Eğitim" },
  clothing: { en: "Clothing", tr: "Giyim" },
  apparel: { en: "Apparel", tr: "Giyim" },
  fashion: { en: "Fashion", tr: "Moda" },
  personal_care: { en: "Personal care", tr: "Kişisel bakım" },

  // Canonical product L1 buckets that may surface as budget categories
  yemek: { en: "Food service", tr: "Yemek" },
  konaklama: { en: "Lodging", tr: "Konaklama" },
  seyahat: { en: "Travel", tr: "Seyahat" },
  kozmetik: { en: "Cosmetics", tr: "Kozmetik" },
  elektronik: { en: "Electronics", tr: "Elektronik" },
  giyim: { en: "Apparel", tr: "Giyim" },
  ev: { en: "Home", tr: "Ev" },
  dijital: { en: "Digital", tr: "Dijital" },
  tobacco: { en: "Tobacco", tr: "Tütün" },
};

/* ------------------------------------------------------------------
 * Canonical category labels (dot-path taxonomy)
 * ------------------------------------------------------------------ */

export const CANONICAL_CATEGORY_LABELS: Record<string, UserFacingText> = {
  // ── groceries ──
  "groceries.beverages.still_water": { en: "Still water", tr: "Gazsız içme suyu" },
  "groceries.beverages.sparkling_water": { en: "Sparkling water", tr: "Maden suyu" },
  "groceries.beverages.carbonated_soft.cola": { en: "Cola", tr: "Kola" },
  "groceries.beverages.carbonated_soft.gazoz": { en: "Lemonade soda", tr: "Gazoz" },
  "groceries.beverages.carbonated_soft.energy_drink": { en: "Energy drink", tr: "Enerji içeceği" },
  "groceries.beverages.fruit_juice": { en: "Fruit juice", tr: "Meyve suyu" },
  "groceries.beverages.tea_pkg.black_tea_loose": { en: "Loose black tea", tr: "Dökme siyah çay" },
  "groceries.beverages.tea_pkg.black_tea_bag": { en: "Black tea bags", tr: "Poşet çay" },
  "groceries.beverages.tea_pkg.herbal_tea": { en: "Herbal tea", tr: "Bitki çayı" },
  "groceries.beverages.tea_pkg.green_tea": { en: "Green tea", tr: "Yeşil çay" },
  "groceries.beverages.coffee_pkg.turkish_coffee": { en: "Turkish coffee", tr: "Türk kahvesi" },
  "groceries.beverages.coffee_pkg.instant_coffee": { en: "Instant coffee", tr: "Hazır kahve" },
  "groceries.beverages.coffee_pkg.filter_coffee": { en: "Filter coffee", tr: "Filtre kahve" },
  "groceries.beverages.coffee_pkg.coffee_capsule": { en: "Coffee capsules", tr: "Kapsül kahve" },
  "groceries.beverages.ayran_kefir": { en: "Ayran & kefir", tr: "Ayran, kefir" },

  "groceries.dairy_eggs.milk": { en: "Milk", tr: "Süt" },
  "groceries.dairy_eggs.yogurt": { en: "Yogurt", tr: "Yoğurt" },
  "groceries.dairy_eggs.cheese.white_cheese": { en: "White cheese", tr: "Beyaz peynir" },
  "groceries.dairy_eggs.cheese.kashar": { en: "Kashar cheese", tr: "Kaşar peyniri" },
  "groceries.dairy_eggs.cheese.tulum": { en: "Tulum cheese", tr: "Tulum peyniri" },
  "groceries.dairy_eggs.butter_cream": { en: "Butter & cream", tr: "Tereyağı & kaymak" },
  "groceries.dairy_eggs.eggs": { en: "Eggs", tr: "Yumurta" },

  "groceries.meat_fish.red_meat": { en: "Red meat", tr: "Kırmızı et" },
  "groceries.meat_fish.poultry": { en: "Poultry", tr: "Tavuk & hindi" },
  "groceries.meat_fish.fish_seafood": { en: "Fish & seafood", tr: "Balık & deniz ürünleri" },
  "groceries.meat_fish.deli_sausage": { en: "Deli & sausage", tr: "Şarküteri" },

  "groceries.produce.fresh_veg": { en: "Fresh vegetables", tr: "Taze sebze" },
  "groceries.produce.fresh_fruit": { en: "Fresh fruit", tr: "Taze meyve" },

  "groceries.dry_goods.rice_pasta": { en: "Rice & pasta", tr: "Pirinç & makarna" },
  "groceries.dry_goods.flour_sugar": { en: "Flour & sugar", tr: "Un & şeker" },
  "groceries.dry_goods.oils": { en: "Cooking oils", tr: "Yemeklik yağ" },
  "groceries.dry_goods.pulses": { en: "Pulses", tr: "Bakliyat" },
  "groceries.dry_goods.spices_sauces": { en: "Spices & sauces", tr: "Baharat & sos" },
  "groceries.dry_goods.breakfast": { en: "Breakfast spreads", tr: "Kahvaltılıklar" },

  "groceries.bakery.bread": { en: "Bread", tr: "Ekmek" },
  "groceries.bakery.pastry_simit": { en: "Pastry & simit", tr: "Simit & poğaça" },
  "groceries.bakery.cake_cookie": { en: "Cakes & cookies", tr: "Pasta & kurabiye" },

  "groceries.snacks_nuts.nuts.pistachio": { en: "Pistachio", tr: "Antep fıstığı" },
  "groceries.snacks_nuts.nuts.hazelnut": { en: "Hazelnut", tr: "Fındık" },
  "groceries.snacks_nuts.nuts.walnut": { en: "Walnut", tr: "Ceviz" },
  "groceries.snacks_nuts.nuts.almond": { en: "Almond", tr: "Badem" },
  "groceries.snacks_nuts.nuts.cashew": { en: "Cashew", tr: "Kaju" },
  "groceries.snacks_nuts.seeds.sunflower_seed": { en: "Sunflower seeds", tr: "Ay çekirdeği" },
  "groceries.snacks_nuts.seeds.pumpkin_seed": { en: "Pumpkin seeds", tr: "Kabak çekirdeği" },
  "groceries.snacks_nuts.seeds.chia_seed": { en: "Chia seeds", tr: "Chia tohumu" },
  "groceries.snacks_nuts.chips_snacks": { en: "Chips & snacks", tr: "Cips & atıştırmalık" },
  "groceries.snacks_nuts.biscuits": { en: "Biscuits", tr: "Bisküvi & kraker" },
  "groceries.snacks_nuts.chocolate_candy": { en: "Chocolate & candy", tr: "Çikolata & şeker" },
  "groceries.snacks_nuts.dried_fruit.dried_apricot": { en: "Dried apricot", tr: "Kuru kayısı" },
  "groceries.snacks_nuts.dried_fruit.raisin": { en: "Raisins", tr: "Kuru üzüm" },
  "groceries.snacks_nuts.dried_fruit.date": { en: "Dates", tr: "Hurma" },
  "groceries.snacks_nuts.dried_fruit": { en: "Dried fruit", tr: "Kuru meyve" },

  "groceries.cleaning.laundry": { en: "Laundry supplies", tr: "Çamaşır deterjanı" },
  "groceries.cleaning.dish_washing": { en: "Dishwashing", tr: "Bulaşık deterjanı" },
  "groceries.cleaning.surface_clean": { en: "Surface cleaners", tr: "Yüzey temizleyici" },
  "groceries.cleaning.paper_tissue": { en: "Paper & tissue", tr: "Kağıt ürünleri" },

  "groceries.personal_care.shampoo_cond": { en: "Shampoo & conditioner", tr: "Şampuan & saç bakımı" },
  "groceries.personal_care.soap_gel": { en: "Soap & shower gel", tr: "Sabun & duş jeli" },
  "groceries.personal_care.oral_care": { en: "Oral care", tr: "Ağız bakımı" },
  "groceries.personal_care.deodorant": { en: "Deodorant", tr: "Deodorant" },
  "groceries.personal_care.skin_care": { en: "Skin care", tr: "Cilt bakımı" },

  "groceries.baby_child": { en: "Baby & child", tr: "Bebek & çocuk" },
  "groceries.alcohol": { en: "Alcohol", tr: "Alkol" },
  "groceries.tobacco": { en: "Tobacco", tr: "Tütün" },

  // ── food_service ──
  "food_service.cafe.espresso_drinks": { en: "Espresso drinks", tr: "Espresso içecekleri" },
  "food_service.cafe.cold_brew_iced": { en: "Cold brew & iced", tr: "Soğuk kahve" },
  "food_service.cafe.turkish_coffee_svc": { en: "Turkish coffee (cafe)", tr: "Türk kahvesi (kafe servisi)" },
  "food_service.cafe.tea_cafe": { en: "Tea (cafe)", tr: "Kafe çay servisi" },
  "food_service.cafe.breakfast_plate": { en: "Breakfast plate", tr: "Kahvaltı tabağı" },
  "food_service.cafe.pastry_cake": { en: "Pastry & cake (cafe)", tr: "Pasta & börek (kafe)" },
  "food_service.restaurant": { en: "Restaurant meal", tr: "Restoran yemeği" },
  "food_service.fast_food.doner": { en: "Döner", tr: "Döner" },
  "food_service.fast_food.lahmacun": { en: "Lahmacun", tr: "Lahmacun & pide" },
  "food_service.fast_food.burger_svc": { en: "Burger (restaurant)", tr: "Burger (restoran)" },
  "food_service.fast_food.pizza": { en: "Pizza", tr: "Pizza" },
  "food_service.fast_food.combo_meal": { en: "Fast food combo", tr: "Fast food menüsü" },
  "food_service.delivery": { en: "Food delivery", tr: "Yemek siparişi" },

  // ── fashion ──
  "fashion.tops.t_shirt": { en: "T-shirt", tr: "T-shirt" },
  "fashion.tops.shirt": { en: "Shirt", tr: "Gömlek" },
  "fashion.tops.sweater_hoodie": { en: "Sweater & hoodie", tr: "Kazak & hoodie" },
  "fashion.tops.dress": { en: "Dress", tr: "Elbise" },
  "fashion.bottoms.jeans": { en: "Jeans", tr: "Kot pantolon" },
  "fashion.bottoms.trousers": { en: "Trousers", tr: "Pantolon & eşofman" },
  "fashion.outerwear.puffer_jacket": { en: "Puffer jacket", tr: "Şişme mont" },
  "fashion.outerwear.parka": { en: "Parka", tr: "Parka & kaban" },
  "fashion.outerwear.trench_coat": { en: "Trench coat", tr: "Trençkot" },
  "fashion.shoes.sneaker": { en: "Sneakers", tr: "Spor ayakkabı" },
  "fashion.shoes.boot": { en: "Boots", tr: "Bot & çizme" },
  "fashion.shoes.sandal": { en: "Sandals", tr: "Sandalet" },
  "fashion.underwear": { en: "Underwear", tr: "İç çamaşırı" },
  "fashion.home_textile.bedding": { en: "Bedding", tr: "Nevresim" },
  "fashion.home_textile.towel": { en: "Towels", tr: "Havlu" },
  "fashion.bags_accessories": { en: "Bags & accessories", tr: "Çanta & aksesuar" },

  // ── transport ──
  "transport.fuel.petrol_95": { en: "Petrol 95", tr: "Benzin 95 oktan" },
  "transport.fuel.petrol_97": { en: "Petrol 97+", tr: "Benzin 97+ premium" },
  "transport.fuel.diesel": { en: "Diesel", tr: "Motorin" },
  "transport.fuel.lpg": { en: "LPG", tr: "LPG / Otogaz" },
  "transport.fuel.ev_charge": { en: "EV charging", tr: "Elektrikli araç şarj" },
  "transport.public_transit.istanbul_metro": { en: "Istanbul metro", tr: "Metro & metrobüs" },
  "transport.public_transit.istanbul_ferry": { en: "Istanbul ferry", tr: "Vapur" },
  "transport.public_transit.bus": { en: "Bus", tr: "Otobüs & dolmuş" },
  "transport.public_transit": { en: "Public transit", tr: "Toplu taşıma kartı" },
    "transport.taxi_rideshare": { en: "Taxi & rideshare", tr: "Taksi & özel ulaşım" },
  "transport.flight": { en: "Flight", tr: "Uçak bileti" },
  "transport.intercity.bus_ticket": { en: "Intercity bus", tr: "Şehirlerarası otobüs" },
  "transport.intercity.train_ticket": { en: "Train ticket", tr: "Tren bileti" },
  "transport.car_maintenance": { en: "Car maintenance", tr: "Araç bakım" },
  "transport.car_wash": { en: "Car wash", tr: "Araç yıkama" },
  "transport.parking": { en: "Parking", tr: "Otopark" },

  // ── tourism ──
  "tourism.hotel": { en: "Hotel", tr: "Otel" },
  "tourism.apart_rental": { en: "Apart & rental", tr: "Apart & kiralık" },
  "tourism.tour_package": { en: "Tour package", tr: "Tur paketi" },
  "tourism.activity": { en: "Activity", tr: "Aktivite & etkinlik" },

  // ── health ──
  "health.medicine_otc.pain_relief": { en: "Pain relief", tr: "Ağrı kesici" },
  "health.medicine_otc.cold_flu": { en: "Cold & flu", tr: "Soğuk algınlığı" },
  "health.medicine_otc.antacid": { en: "Antacid", tr: "Mide ilacı" },
  "health.medicine_rx": { en: "Prescription medicine", tr: "Reçeteli ilaç" },
  "health.supplements.vitamin_d": { en: "Vitamin D", tr: "D vitamini" },
  "health.supplements.omega3": { en: "Omega-3", tr: "Omega-3" },
  "health.supplements.protein_powder": { en: "Protein powder", tr: "Protein tozu" },
  "health.supplements.collagen": { en: "Collagen", tr: "Kolajen" },
  "health.supplements": { en: "Supplements", tr: "Vitamin & takviye" },
  "health.doctor_visit": { en: "Doctor visit", tr: "Doktor muayenesi" },
  "health.dentist": { en: "Dentist", tr: "Diş hekimi" },
  "health.lab_test": { en: "Lab test", tr: "Tahlil" },
  "health.optician": { en: "Optician", tr: "Gözlük & optik" },

  // ── education ──
  "education.book.novel": { en: "Novel", tr: "Roman" },
  "education.book.self_help": { en: "Self-help book", tr: "Kişisel gelişim" },
  "education.book.textbook": { en: "Textbook", tr: "Ders kitabı" },
  "education.book.children_book": { en: "Children's book", tr: "Çocuk kitabı" },
  "education.stationery": { en: "Stationery", tr: "Kırtasiye" },
  "education.course": { en: "Course", tr: "Kurs & ders" },
  "education.online_edu": { en: "Online education", tr: "Online eğitim" },

  // ── services ──
  "services.hair_beauty.haircut_women": { en: "Women's haircut", tr: "Kadın kuaför" },
  "services.hair_beauty.haircut_men": { en: "Men's haircut", tr: "Erkek berber" },
  "services.hair_beauty.nail_service": { en: "Nail service", tr: "Tırnak bakımı" },
  "services.laundry_cleaning": { en: "Laundry & cleaning", tr: "Kuru temizleme" },
  "services.cargo_delivery": { en: "Cargo & delivery", tr: "Kargo" },
  "services.gym_fitness": { en: "Gym & fitness", tr: "Spor salonu" },
  "services.spa_massage": { en: "Spa & massage", tr: "Masaj & spa" },

  // ── electronics ──
  "electronics.mobile.smartphone_budget": { en: "Budget smartphone", tr: "Bütçe akıllı telefon" },
  "electronics.mobile.smartphone_mid": { en: "Mid-range smartphone", tr: "Orta segment telefon" },
  "electronics.mobile.smartphone_flag": { en: "Flagship smartphone", tr: "Flagship telefon" },
  "electronics.mobile.tablet": { en: "Tablet", tr: "Tablet" },
  "electronics.computer": { en: "Computer", tr: "Bilgisayar" },
  "electronics.peripherals": { en: "Peripherals", tr: "Bilgisayar çevre birimleri" },
  "electronics.tv_audio": { en: "TV & audio", tr: "TV & ses sistemi" },
  "electronics.white_goods": { en: "White goods", tr: "Beyaz eşya" },
  "electronics.small_appliances.espresso_machine": { en: "Espresso machine", tr: "Kahve makinesi" },
  "electronics.small_appliances.blender": { en: "Blender", tr: "Blender" },
  "electronics.small_appliances.robot_vacuum": { en: "Robot vacuum", tr: "Robot süpürge" },
  "electronics.small_appliances": { en: "Small appliances", tr: "Küçük ev aletleri" },
  "electronics.accessories": { en: "Accessories", tr: "Telefon aksesuarı" },
  "electronics.gaming": { en: "Gaming", tr: "Oyun" },

  // ── home_living ──
  "home_living.furniture": { en: "Furniture", tr: "Mobilya" },
  "home_living.kitchen_tools": { en: "Kitchen tools", tr: "Mutfak gereçleri" },
  "home_living.bedding": { en: "Bedding", tr: "Yatak takımı" },
  "home_living.decoration": { en: "Decoration", tr: "Dekorasyon" },
  "home_living.hardware": { en: "Hardware", tr: "Hırdavat" },

  // ── entertainment ──
  "entertainment.cinema": { en: "Cinema", tr: "Sinema" },
  "entertainment.streaming.netflix": { en: "Netflix", tr: "Netflix" },
  "entertainment.streaming.spotify": { en: "Spotify", tr: "Spotify" },
  "entertainment.streaming": { en: "Streaming", tr: "Dijital yayın platformu" },
  "entertainment.sport_event": { en: "Sport event", tr: "Spor etkinliği" },

  // ── finance ──
  "finance.utility_bills.electricity": { en: "Electricity bill", tr: "Elektrik faturası" },
  "finance.utility_bills.natural_gas": { en: "Natural gas bill", tr: "Doğalgaz faturası" },
  "finance.utility_bills.internet": { en: "Internet bill", tr: "İnternet faturası" },
  "finance.utility_bills.mobile_phone": { en: "Mobile phone bill", tr: "Telefon faturası" },
  "finance.digital_subs": { en: "Digital subscriptions", tr: "Dijital abonelik" },
  "finance.insurance": { en: "Insurance", tr: "Sigorta" },
  "finance.rent": { en: "Rent", tr: "Kira" },
};

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

function snakeToTitle(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function pickLabel(label: UserFacingText | undefined, locale: YumoLocale): string | undefined {
  if (!label) return undefined;
  if (locale === "tr") return label.tr;
  if (locale === "en") return label.en;
  // Phase 3: other locales fall back to en
  return label.en;
}

function fallbackPathLabels(path: string, locale: YumoLocale): string | undefined {
  // Try parent paths from deepest to shallowest
  const parts = path.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const parent = parts.slice(0, i).join(".");
    const label =
      CANONICAL_CATEGORY_LABELS[parent] ??
      BUDGET_CATEGORY_LABELS[parent];
    if (label) return pickLabel(label, locale);
  }
  return undefined;
}

export function categoryLabel(slug: string, locale: YumoLocale): string {
  if (!slug) return "";

  const lower = slug.toLowerCase();

  // 1. Exact match (budget categories first, then canonical)
  const exact =
    BUDGET_CATEGORY_LABELS[lower] ??
    CANONICAL_CATEGORY_LABELS[lower] ??
    SERVICE_CATEGORY_LABELS[lower];
  if (exact) {
    const text = pickLabel(exact, locale);
    if (text) return text;
  }

  // 2. Parent path fallback for dot-paths
  if (slug.includes(".")) {
    const parent = fallbackPathLabels(slug, locale);
    if (parent) return parent;
  }

  // 3. snake_case → Title Case
  return snakeToTitle(slug);
}

export function productLabel(canonicalId: string, locale: YumoLocale): string {
  // Same logic as categoryLabel; product-specific enrichment can be added later.
  return categoryLabel(canonicalId, locale);
}
