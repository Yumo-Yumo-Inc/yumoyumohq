/**
 * Batch-normalize Turkish receipt line labels to v3 taxonomy canonical products.
 * Uses Gemini (gemini-3.1-flash-lite) with T1 labeled plain-text output (no JSON);
 * called when receipt_product_aliases fuzzy match is below threshold.
 *
 * v3 changes vs v1:
 *  - category_path replaces flat "category" slug (e.g. "groceries.snacks_nuts.nuts.pistachio")
 *  - attributes JSONB extraction (weight_g, volume_ml, package_type, etc.)
 *  - lifestyle_tags (vejetaryan, helal, glutensiz, ...)
 *  - consumption_occasions (atistirmalik, kahvalti, ...)
 *  - allergens array
 *  - price_tier (butce / orta / premium / luks)
 *  - display_name_tr for human-readable name
 *  - Backward-compat: category_lvl1/lvl2 still populated from category_path
 */

import { normalizeBrandName, normalizeCanonicalProductKey } from "../name-normalization";
import { detectGuardedProductCategory } from "./product-category-guards";

/** Default canonical-normalize model; overridable via CANONICAL_PRODUCT_LLM_MODEL. */
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

/** Read the Gemini key lazily — env may be loaded after this module is imported (scripts/dotenv). */
function getGeminiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "";
}

/** Call Gemini for plain-text generation. Returns text, or null on any failure. */
async function callGeminiText(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.warn("[normalizeReceiptLinesWithLLM] GEMINI_API_KEY not set");
    return null;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Gemini HTTP ${res.status}`);
  }
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? null
  );
}

// ─── Output type ─────────────────────────────────────────────────────────────

export interface LlmProductNormalization {
  // Core identity
  raw_name: string;
  canonical_name: string;        // snake_case key: "tadim_antep_fistigi_150g"
  display_name_tr: string | null; // Human readable: "Tadım Antep Fıstığı 150g"
  brand: string | null;
  /** 3-state brand judgement: BRAND (named), UNBRANDED (commodity), UNKNOWN. */
  brand_verdict: "BRAND" | "UNBRANDED" | "UNKNOWN";

  // v3 taxonomy
  category_path: string | null;  // "groceries.snacks_nuts.nuts.pistachio"
  category_lvl1: string | null;  // "groceries"  (backward compat)
  category_lvl2: string | null;  // "snacks_nuts" (backward compat)

  // Size / unit
  unit_size: string | null;
  unit_type: string | null;
  attributes: Record<string, unknown>; // {"weight_g": 150, "roast_type": "kavrulmus_tuzlu"}

  // Enrichment
  lifestyle_tags: string[];      // ["vejetaryan","helal","glutensiz"]
  consumption_occasions: string[]; // ["atistirmalik","cay_kahve_yaninda"]
  allergens: string[];           // ["fıstık","gluten"]
  price_tier: string | null;     // "butce" | "orta" | "premium" | "luks"

  confidence: number;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM = `You are a Turkish receipt product normalizer. Given a raw receipt line item,
return a structured product record matching the Yumo v3 taxonomy.

## CATEGORY PATHS (L1.L2.L3.L4)

Use the most specific path you can confidently assign. Return only the path, not a description.

groceries.beverages.still_water          → Gazsız içme suyu (Erikli, Damla, Saka)
groceries.beverages.sparkling_water      → Maden suyu (Uludağ, Kızılay)
groceries.beverages.carbonated_soft.cola → Kola (Coca-Cola, Pepsi, Cola Turka)
groceries.beverages.carbonated_soft.gazoz → Gazoz (Uludağ Gazoz, Sarı Limonata)
groceries.beverages.carbonated_soft.energy_drink → Enerji içeceği (Red Bull, Monster, Burn)
groceries.beverages.fruit_juice          → Meyve suyu / nektarı (Cappy, Dimes, Pınar)
groceries.beverages.tea_pkg.black_tea_loose → Dökme siyah çay (Çaykur, Filiz)
groceries.beverages.tea_pkg.black_tea_bag   → Demlik/süzen poşet çay
groceries.beverages.tea_pkg.herbal_tea      → Bitki çayı (Doğadan, Lipton)
groceries.beverages.tea_pkg.green_tea       → Yeşil çay
groceries.beverages.coffee_pkg.turkish_coffee → Türk kahvesi (Mehmet Efendi, Kurukahveci)
groceries.beverages.coffee_pkg.instant_coffee → Hazır kahve (Nescafé, Jacobs)
groceries.beverages.coffee_pkg.filter_coffee  → Filtre/öğütülmüş kahve
groceries.beverages.coffee_pkg.coffee_capsule → Kapsül kahve (Nespresso, Dolce Gusto)
groceries.beverages.ayran_kefir          → Ayran, kefir (Sütaş, Pınar, Dost)
groceries.dairy_eggs.milk                → Süt (UHT, taze)
groceries.dairy_eggs.yogurt              → Yoğurt
groceries.dairy_eggs.cheese.white_cheese → Beyaz peynir
groceries.dairy_eggs.cheese.kashar       → Kaşar peyniri
groceries.dairy_eggs.cheese.tulum        → Tulum, çökelek, lor
groceries.dairy_eggs.butter_cream        → Tereyağı, kaymak
groceries.dairy_eggs.eggs                → Yumurta
groceries.meat_fish.red_meat             → Kırmızı et (dana, kuzu)
groceries.meat_fish.poultry              → Tavuk, hindi eti
groceries.meat_fish.fish_seafood         → Balık, deniz ürünleri
groceries.meat_fish.deli_sausage         → Sosis, sucuk, pastırma, salam
groceries.produce.fresh_veg              → Taze sebze (domates, salatalık, biber...)
groceries.produce.fresh_fruit            → Taze meyve (elma, muz, portakal...)
groceries.dry_goods.rice_pasta           → Pirinç, makarna, bulgur, şehriye
groceries.dry_goods.flour_sugar          → Un, şeker, nişasta
groceries.dry_goods.oils                 → Zeytinyağı, ayçiçek yağı, tereyağı ambalajlı
groceries.dry_goods.pulses               → Mercimek, nohut, kuru fasulye, baklagil
groceries.dry_goods.spices_sauces        → Baharat, sos, ketçap, mayonez, salça
groceries.dry_goods.breakfast            → Reçel, bal, tahin, pekmez, çikolatalı fındık ezmesi
groceries.bakery.bread                   → Ekmek, pide, lavaş
groceries.bakery.pastry_simit            → Simit, poğaça, börek, açma
groceries.bakery.cake_cookie             → Pasta, kurabiye, kek
groceries.snacks_nuts.nuts.pistachio     → Antep fıstığı
groceries.snacks_nuts.nuts.hazelnut      → Fındık (iç, kavrulmuş)
groceries.snacks_nuts.nuts.walnut        → Ceviz
groceries.snacks_nuts.nuts.almond        → Badem
groceries.snacks_nuts.nuts.cashew        → Kaju
groceries.snacks_nuts.seeds.sunflower_seed → Ay çekirdeği
groceries.snacks_nuts.seeds.pumpkin_seed → Kabak çekirdeği
groceries.snacks_nuts.seeds.chia_seed    → Chia tohumu
groceries.snacks_nuts.chips_snacks       → Cips, popcorn, patlak mısır, mısır cipsi
groceries.snacks_nuts.biscuits           → Bisküvi, kraker, gofret, wafer
groceries.snacks_nuts.chocolate_candy    → Çikolata, şeker, lokum, karamel
groceries.snacks_nuts.dried_fruit.dried_apricot → Kuru kayısı
groceries.snacks_nuts.dried_fruit.raisin → Kuru üzüm
groceries.snacks_nuts.dried_fruit.date   → Hurma
groceries.snacks_nuts.dried_fruit        → Diğer kuru meyveler (kuru incir, erik, mango)
groceries.cleaning.laundry               → Çamaşır deterjanı, yumuşatıcı, lekelendirici
groceries.cleaning.dish_washing          → Bulaşık deterjanı, tablet, sıvı
groceries.cleaning.surface_clean         → Yüzey temizleyici, çamaşır suyu, tuvalet temizleyici
groceries.cleaning.paper_tissue          → Tuvalet kağıdı, kağıt havlu, mendil, peçete
groceries.personal_care.shampoo_cond     → Şampuan, saç kremi, saç bakım
groceries.personal_care.soap_gel         → Sabun, duş jeli, vücut şampuanı
groceries.personal_care.oral_care        → Diş macunu, diş fırçası, ağız suyu
groceries.personal_care.deodorant        → Deodorant, antiperspirant
groceries.personal_care.skin_care        → Nemlendirici, güneş kremi, yüz bakım
groceries.baby_child                     → Bebek bezi, mama, ıslak mendil, bebek şampuanı
groceries.alcohol                        → Bira, şarap, rakı, votka, viski (SADECE alkollü ürünler)
groceries.tobacco                        → Sigara, tütün, IQOS, HEETS (SADECE tütün ürünleri)

food_service.cafe.espresso_drinks        → Latte, cappuccino, americano, flat white, cortado
food_service.cafe.cold_brew_iced         → Cold brew, iced latte, frappe
food_service.cafe.turkish_coffee_svc     → Türk kahvesi (kafe servisi)
food_service.cafe.tea_cafe               → Kafe çay servisi (bardak çay, demleme)
food_service.cafe.breakfast_plate        → Kahvaltı tabağı, serpme kahvaltı, menemen
food_service.cafe.pastry_cake            → Pasta, börek, kurabiye (kafe/pastane servisi)
food_service.restaurant                  → Restoran yemeği (tabldot, à la carte, meze)
food_service.fast_food.doner             → Döner (ekmek, dürüm, tabak)
food_service.fast_food.lahmacun          → Lahmacun, pide, gözleme
food_service.fast_food.burger_svc        → Burger (restoran)
food_service.fast_food.pizza             → Pizza
food_service.fast_food.combo_meal        → Fast food menüsü (combo)
food_service.delivery                    → Yemek siparişi/teslimatı (Yemeksepeti, Getir)

fashion.tops.t_shirt                     → T-shirt, basic üst
fashion.tops.shirt                       → Gömlek
fashion.tops.sweater_hoodie              → Kazak, hoodie, sweatshirt
fashion.tops.dress                       → Elbise, tulum
fashion.bottoms.jeans                    → Kot pantolon
fashion.bottoms.trousers                 → Kumaş pantolon, eşofman
fashion.outerwear.puffer_jacket          → Şişme mont, puffer
fashion.outerwear.parka                  → Parka, kaban
fashion.outerwear.trench_coat            → Trençkot, yağmurluk
fashion.shoes.sneaker                    → Spor ayakkabı, sneaker
fashion.shoes.boot                       → Bot, çizme
fashion.shoes.sandal                     → Sandalet, terlik
fashion.underwear                        → İç çamaşırı, çorap, external
fashion.home_textile.bedding             → Nevresim, çarşaf, pike
fashion.home_textile.towel               → Havlu
fashion.bags_accessories                 → Çanta, kemer, şapka, eşarp

transport.fuel.petrol_95                 → Benzin 95 oktan
transport.fuel.petrol_97                 → Benzin 97+ premium
transport.fuel.diesel                    → Motorin, dizel
transport.fuel.lpg                       → LPG, otogaz
transport.fuel.ev_charge                 → Elektrikli araç şarj
transport.public_transit.istanbul_metro  → Metro, metrobüs (İstanbul)
transport.public_transit.istanbul_ferry  → Vapur, şehir hatları
transport.public_transit.bus             → Otobüs, dolmuş
transport.public_transit                 → İstanbulkart yükleme, ulaşım kartı
transport.taxi_rideshare                 → Taksi, BiTaksi, Uber, Bolt
transport.flight                         → Uçak bileti (THY, Pegasus, SunExpress)
transport.intercity.bus_ticket           → Şehirlerarası otobüs bileti
transport.intercity.train_ticket         → Tren bileti (TCDD, YHT)
transport.car_maintenance                → Araç bakım, servis, lastik, yağ değişim
transport.car_wash                       → Araç yıkama
transport.parking                        → Otopark ücreti

tourism.hotel                            → Otel konaklaması
tourism.apart_rental                     → Apart, Airbnb, kiralık ev
tourism.tour_package                     → Tur paketi
tourism.activity                         → Aktivite, müze bileti, eğlence parkı

health.medicine_otc.pain_relief          → Ağrı kesici (Parol, Nurofen, Aspirin)
health.medicine_otc.cold_flu             → Soğuk algınlığı, grip ilacı (Gripin, Aferin)
health.medicine_otc.antacid              → Mide ilacı, sindirim (Talcid, Rennie)
health.medicine_rx                       → Reçeteli ilaç (eczane, sgk)
health.supplements.vitamin_d             → D vitamini
health.supplements.omega3                → Omega-3, balık yağı
health.supplements.protein_powder        → Protein tozu, whey
health.supplements.collagen              → Kolajen takviyesi
health.supplements                       → Genel vitamin, takviye, multivitamin
health.doctor_visit                      → Doktor muayenesi, poliklinik
health.dentist                           → Diş hekimi, diş tedavisi
health.lab_test                          → Tahlil, laboratuvar, kan testi
health.optician                          → Gözlük, lens, optisyen

education.book.novel                     → Roman, kurgu kitabı
education.book.self_help                 → Kişisel gelişim kitabı
education.book.textbook                  → Ders kitabı
education.book.children_book             → Çocuk kitabı
education.stationery                     → Kırtasiye (defter, kalem, dosya)
education.course                         → Kurs, dershane, özel ders ücreti
education.online_edu                     → Online eğitim aboneliği (Udemy, Coursera)

services.hair_beauty.haircut_women       → Kadın kuaför, saç kesimi, boyama
services.hair_beauty.haircut_men         → Erkek berber, saç+sakal
services.hair_beauty.nail_service        → Manikür, pedikür, kalıcı oje
services.laundry_cleaning                → Kuru temizleme, çamaşırhane
services.cargo_delivery                  → Kargo (Yurtiçi, MNG, Aras, PTT)
services.gym_fitness                     → Spor salonu, fitness üyeliği
services.spa_massage                     → Masaj, spa, hamam

electronics.mobile.smartphone_budget     → Bütçe akıllı telefon (<5000 TL)
electronics.mobile.smartphone_mid        → Orta segment telefon
electronics.mobile.smartphone_flag       → Flagship telefon (iPhone Pro, Galaxy S)
electronics.mobile.tablet                → Tablet (iPad, Galaxy Tab)
electronics.computer                     → Laptop, masaüstü bilgisayar
electronics.peripherals                  → Klavye, mouse, kulaklık, webcam
electronics.tv_audio                     → TV, soundbar, hoparlör
electronics.white_goods                  → Buzdolabı, çamaşır makinesi, bulaşık makinesi
electronics.small_appliances.espresso_machine → Kahve makinesi (Nespresso, filtre)
electronics.small_appliances.blender     → Blender, mutfak robotu
electronics.small_appliances.robot_vacuum → Robot süpürge
electronics.small_appliances             → Diğer küçük ev aletleri (ütü, saç kurutma)
electronics.accessories                  → Telefon kılıfı, şarj aleti, kablo, powerbank
electronics.gaming                       → Oyun konsolu, oyun (PlayStation, Xbox)

home_living.furniture                    → Mobilya (koltuk, masa, dolap, yatak)
home_living.kitchen_tools                → Tencere, tava, bıçak, mutfak gereçleri
home_living.bedding                      → Yorgan, yastık, nevresim
home_living.decoration                   → Aydınlatma, çerçeve, dekor
home_living.hardware                     → Hırdavat, boya, yapı malzemesi

entertainment.cinema                     → Sinema bileti
entertainment.streaming.netflix          → Netflix aboneliği
entertainment.streaming.spotify          → Spotify aboneliği
entertainment.streaming                  → Dijital yayın aboneliği (BluTV, Gain, Amazon)
entertainment.sport_event                → Spor maçı/etkinlik bileti

finance.utility_bills.electricity        → Elektrik faturası
finance.utility_bills.natural_gas        → Doğalgaz faturası
finance.utility_bills.internet           → İnternet faturası
finance.utility_bills.mobile_phone       → Telefon faturası, hat yükleme, HGS/OGS
finance.digital_subs                     → Dijital abonelik yenileme
finance.insurance                        → Sigorta (trafik, kasko, sağlık, konut)
finance.rent                             → Kira ödemesi

## RULES

1. canonical_name: ASCII snake_case, no Turkish chars (ı→i ş→s ğ→g ü→u ö→o ç→c). Include size in key when clear.
2. display_name_tr: Proper Turkish display name with Turkish chars.
3. brand + brand_verdict (3-state): infer the brand FROM THE PRODUCT NAME — receipts almost never print a brand column, so you must read it out of the label.
   - Packaged consumer goods (snacks, biscuits, chocolate, chips, beverages, dairy, cleaning, personal care, medicine, tobacco, alcohol) ALMOST ALWAYS carry a brand. Extract it even from abbreviations: "FANTA PORTAKAL 330 M" → brand "Fanta"; "ÜLKER COKOKREM" → "Ülker"; "ETI BURCAK" → "Eti"; "CAYKUR RIZE" → "Çaykur". The brand is usually the first token(s).
   - brand_verdict = "BRAND" when a brand is named on the label (set brand to its proper Turkish spelling).
   - brand_verdict = "UNBRANDED" ONLY for genuine commodities sold loose / by weight with no brand: fresh produce (domates, elma), by-weight meat/fish (kıyma, tavuk but, balık), open bread, bulk grains. Set brand null.
   - brand_verdict = "UNKNOWN" when the category expects a brand but the label is too garbled to read one. Set brand null.
   - NEVER put a number/quantity/price/unit into brand. A brand is a name.
4. category_path: Use deepest matching path from the list above. If unsure between two, pick the shallower.
5. HARD RULES (never override):
   - alcohol → groceries.alcohol (never beverage or grocery)
   - tobacco/sigara → groceries.tobacco (never grocery or personal_care)
   - fuel/benzin/motorin/LPG → transport.fuel.*
6. attributes: extract numeric and enum facts visible in the line (weight_g, volume_ml, package_type, roast_type, fat_pct, quantity, etc.)
7. lifestyle_tags: infer from product type. Use only: vejetaryan, vegan, helal, organik, glutensiz, laktozsuz, seker_eklenmemis, yuksek_protein, dogal, sporcu_beslenmesi, cocuklara_uygun, omega3_zengin, lif_zengin
8. consumption_occasions: 1–4 most relevant from: kahvalti, atistirmalik, ogle_yemegi, aksam_yemegi, cay_kahve_yaninda, film_dizi, sohbet_sofra, yolculuk, spor_sonrasi, sabah_enerjisi, ramazan_iftar, bayram, piknik_bbq, saglik_destegi, misafir_ikrami, ofis, ders_calisma
9. allergens: list only confirmed allergens: gluten, laktoz, fıstık, fındık, yumurta, susam, soya, kabuklu_deniz_urunu, seleri, hardal
10. price_tier: butce | orta | premium | luks (based on brand/category positioning)
11. confidence: 0–1

## OUTPUT FORMAT (T1 — labeled plain text, NOT JSON)
For EACH input line, output ONE block. Begin each block with a line "=== ITEM <n> ==="
where <n> is the input line's number. Inside the block, one field per line as
"LABEL: value", in the exact order below. Preserve RAW verbatim. If a field is
empty, still print the label with an empty value. Output nothing outside the
blocks — no JSON, no markdown, no commentary.

=== ITEM <n> ===
RAW: <verbatim input line>
CANONICAL: <ascii snake_case key>
DISPLAY_TR: <Türkçe ad>
BRAND: <marka adı; UNBRANDED/UNKNOWN durumunda boş bırak>
BRAND_VERDICT: <BRAND | UNBRANDED | UNKNOWN>
CATEGORY_PATH: <taxonomy path>
UNIT_SIZE: <sayı; yoksa boş>
UNIT_TYPE: <g | ml | l | kg | adet; yoksa boş>
ATTRIBUTES: <key=value; key=value; ... (boş olabilir)>
LIFESTYLE: <virgülle ayrık etiketler>
OCCASIONS: <virgülle ayrık etiketler>
ALLERGENS: <virgülle ayrık>
PRICE_TIER: <butce | orta | premium | luks>
CONFIDENCE: <0..1>

## EXAMPLES

=== ITEM 1 ===
RAW: TADIM FİSTIK 150G
CANONICAL: tadim_antep_fistigi_150g
DISPLAY_TR: Tadım Antep Fıstığı 150g
BRAND: Tadım
BRAND_VERDICT: BRAND
CATEGORY_PATH: groceries.snacks_nuts.nuts.pistachio
UNIT_SIZE: 150
UNIT_TYPE: g
ATTRIBUTES: weight_g=150; roast_type=kavrulmus_tuzlu
LIFESTYLE: vejetaryan, vegan, helal, glutensiz
OCCASIONS: atistirmalik, misafir_ikrami, cay_kahve_yaninda
ALLERGENS: fıstık
PRICE_TIER: luks
CONFIDENCE: 0.95

=== ITEM 2 ===
RAW: FANTA PORTAKAL 330 M
CANONICAL: fanta_portakal_330ml
DISPLAY_TR: Fanta Portakal 330ml
BRAND: Fanta
BRAND_VERDICT: BRAND
CATEGORY_PATH: groceries.beverages.carbonated_soft.cola
UNIT_SIZE: 330
UNIT_TYPE: ml
ATTRIBUTES: volume_ml=330; package_type=kutu
LIFESTYLE: vejetaryan, helal
OCCASIONS: atistirmalik, film_dizi
ALLERGENS:
PRICE_TIER: butce
CONFIDENCE: 0.9

=== ITEM 3 ===
RAW: DOMATES KG
CANONICAL: domates
DISPLAY_TR: Domates
BRAND:
BRAND_VERDICT: UNBRANDED
CATEGORY_PATH: groceries.produce.fresh_veg
UNIT_SIZE:
UNIT_TYPE: kg
ATTRIBUTES:
LIFESTYLE: vejetaryan, vegan, dogal
OCCASIONS: aksam_yemegi, ogle_yemegi
ALLERGENS:
PRICE_TIER: butce
CONFIDENCE: 0.92

=== ITEM 4 ===
RAW: K.BENZIN95 SVP
CANONICAL: benzin_95_oktan
DISPLAY_TR: Benzin 95 Oktan
BRAND:
BRAND_VERDICT: UNBRANDED
CATEGORY_PATH: transport.fuel.petrol_95
UNIT_SIZE:
UNIT_TYPE: l
ATTRIBUTES: fuel_type=benzin_95; octane=95
LIFESTYLE:
OCCASIONS: yolculuk
ALLERGENS:
PRICE_TIER: orta
CONFIDENCE: 0.85`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeCanonicalKey(s: string): string {
  return (normalizeCanonicalProductKey(s) ?? "").slice(0, 200);
}

/** Split "groceries.snacks_nuts.nuts.pistachio" → { lvl1, lvl2 } for backward compat. */
function pathToLevels(path: string | null): { lvl1: string | null; lvl2: string | null } {
  if (!path) return { lvl1: null, lvl2: null };
  const parts = path.split(".");
  return {
    lvl1: parts[0] ?? null,
    lvl2: parts[1] ?? null,
  };
}

// ─── T1 labeled-text parsing (defensive: never throws) ─────────────────────────

/** Split the model output into per-item field maps keyed by ITEM number. */
function parseItemBlocks(text: string): Map<number, Record<string, string>> {
  const blocks = new Map<number, Record<string, string>>();
  const header = /===\s*ITEM\s+(\d+)\s*===/gi;
  const heads = [...text.matchAll(header)];
  for (let i = 0; i < heads.length; i++) {
    const num = parseInt(heads[i][1], 10);
    if (!Number.isFinite(num)) continue;
    const start = (heads[i].index ?? 0) + heads[i][0].length;
    const end = i + 1 < heads.length ? (heads[i + 1].index ?? text.length) : text.length;
    const fields: Record<string, string> = {};
    for (const line of text.slice(start, end).split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*:\s*(.*)$/);
      if (m) fields[m[1].toUpperCase()] = m[2].trim();
    }
    blocks.set(num, fields);
  }
  return blocks;
}

/** "a, b ,c" → ["a","b","c"]; empty → []. */
function parseCsvList(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** "weight_g=150; roast_type=kavrulmus" → { weight_g: 150, roast_type: "kavrulmus" }. */
function parseAttributes(s: string | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!s) return out;
  for (const pair of s.split(";")) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (!k) continue;
    const num = Number(v);
    out[k] = v !== "" && /^-?\d/.test(v) && Number.isFinite(num) ? num : v;
  }
  return out;
}

function parseVerdict(
  s: string | undefined,
  hasBrand: boolean
): "BRAND" | "UNBRANDED" | "UNKNOWN" {
  const v = (s ?? "").trim().toUpperCase();
  if (v === "BRAND" || v === "UNBRANDED" || v === "UNKNOWN") return v;
  // Missing/garbled verdict: infer from whether a brand was named.
  return hasBrand ? "BRAND" : "UNKNOWN";
}

/**
 * Pure parser: T1 labeled-text model output → normalization map keyed by
 * inputLine.toLowerCase(). Defensive — a malformed block drops that item, never
 * the batch. Separated from the network call so it is unit-testable.
 */
export function parseNormalizationText(
  raw: string,
  unique: string[]
): Map<string, LlmProductNormalization> {
  const out = new Map<string, LlmProductNormalization>();
  const blocks = parseItemBlocks(raw);
  for (const [num, f] of blocks) {
    // Map back to the original input line by its number (robust against the
    // model echoing RAW imperfectly). Fall back to the block's RAW field.
    const inputLine = unique[num - 1] ?? (f.RAW ? f.RAW.trim() : "");
    if (!inputLine) continue;

    let canonical = sanitizeCanonicalKey(f.CANONICAL ?? "");
    if (!canonical) canonical = sanitizeCanonicalKey(inputLine);
    if (!canonical) continue;

    const confNum = Number(f.CONFIDENCE);
    const conf = Number.isFinite(confNum) && confNum >= 0 && confNum <= 1 ? confNum : 0.7;

    // Hard guard: alcohol / tobacco / fuel cannot be overridden by LLM
    const rawCategoryPath = (f.CATEGORY_PATH ?? "").trim() || null;
    const guardedCategory = detectGuardedProductCategory(`${inputLine} ${canonical}`);

    let finalCategoryPath = rawCategoryPath;
    if (guardedCategory === "alcohol") finalCategoryPath = "groceries.alcohol";
    if (guardedCategory === "tobacco") finalCategoryPath = "groceries.tobacco";
    if (guardedCategory === "fuel") {
      if (!rawCategoryPath?.startsWith("transport.fuel")) {
        finalCategoryPath = "transport.fuel";
      }
    }

    const { lvl1, lvl2 } = pathToLevels(finalCategoryPath);
    const brand = normalizeBrandName((f.BRAND ?? "").trim() || null, inputLine);

    out.set(inputLine.toLowerCase(), {
      raw_name: inputLine,
      canonical_name: canonical,
      display_name_tr: (f.DISPLAY_TR ?? "").trim() || null,
      brand,
      brand_verdict: parseVerdict(f.BRAND_VERDICT, Boolean(brand)),
      category_path: finalCategoryPath,
      category_lvl1: lvl1,
      category_lvl2: lvl2,
      unit_size: (f.UNIT_SIZE ?? "").trim() || null,
      unit_type: (f.UNIT_TYPE ?? "").trim().toLowerCase() || null,
      attributes: parseAttributes(f.ATTRIBUTES),
      lifestyle_tags: parseCsvList(f.LIFESTYLE),
      consumption_occasions: parseCsvList(f.OCCASIONS),
      allergens: parseCsvList(f.ALLERGENS),
      price_tier: (f.PRICE_TIER ?? "").trim() || null,
      confidence: guardedCategory ? Math.max(conf, 0.92) : conf,
    });
  }
  return out;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Normalize up to ~18 receipt lines in one LLM call (T1 labeled plain text).
 * Returns map keyed by inputLine.toLowerCase() → LlmProductNormalization.
 */
export async function normalizeReceiptLinesWithLLM(
  rawNames: string[]
): Promise<Map<string, LlmProductNormalization>> {
  const out = new Map<string, LlmProductNormalization>();
  if (rawNames.length === 0) return out;

  const unique = [...new Set(rawNames.map((r) => r.trim()).filter(Boolean))];
  if (unique.length === 0) return out;

  const modelName = process.env.CANONICAL_PRODUCT_LLM_MODEL || DEFAULT_MODEL;

  const userMsg = `Normalize each receipt line below. Output one "=== ITEM <n> ===" block per line, using the numbering shown. Read the brand out of the product label.

Lines:
${unique.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;

  try {
    const raw = await callGeminiText(modelName, SYSTEM, userMsg);
    if (!raw) return out;
    return parseNormalizationText(raw, unique);
  } catch (e) {
    console.error("[normalizeReceiptLinesWithLLM] LLM failed:", (e as Error)?.message);
    return out;
  }
}
