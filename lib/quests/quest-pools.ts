/**
 * Quest Pools V2: Tier-based pool definitions and segment filter.
 *
 * Each tier has a daily/weekly pool.
 * A difficulty filter is applied based on segment.
 * Tier fallback is applied based on feature flag.
 */

import type {
  QuestTier, UserSegment,
  DailyReceiptType, DailyDiscoveryType, DailySavingsType, DailySocialType,
  WeeklyReceiptType, WeeklyDiscoveryType, WeeklySavingsType, WeeklySocialType,
  DailyQuestType, WeeklyQuestType,
} from "./schema";

// ── Daily Pools by Tier ───────────────────────────────────

export const DAILY_RECEIPT_POOL: DailyReceiptType[] = [
  "D1", "D3", "D4", "D5", "D6", "D7", "D8", "D9",
  "D10", "D11", "D12", "D13", "D14", "D16",
];

export const DAILY_DISCOVERY_POOL: DailyDiscoveryType[] = [
  "DD1", "DD2", "DD3", "DD4", "DD5", "DD6", "DD7", "DD8", "DD9", "DD10",
];

export const DAILY_SAVINGS_POOL: DailySavingsType[] = [
  "DS1", "DS2", "DS3", "DS4", "DS5", "DS6", "DS7", "DS8",
];

export const DAILY_SOCIAL_POOL: DailySocialType[] = [
  "DC1", "DC2", "DC3", "DC4", "DC5", "DC6",
];

// ── Weekly Pools by Tier ──────────────────────────────────

export const WEEKLY_RECEIPT_POOL: WeeklyReceiptType[] = [
  "W1A", "W1B", "W1C", "W2", "W3", "W4", "W5", "W6",
  "W7", "W8", "W9", "W10", "W11", "W12",
];

export const WEEKLY_DISCOVERY_POOL: WeeklyDiscoveryType[] = [
  "WD1", "WD2", "WD3", "WD4", "WD5", "WD6", "WD7", "WD8",
];

export const WEEKLY_SAVINGS_POOL: WeeklySavingsType[] = [
  "WS1", "WS2", "WS3", "WS4", "WS5", "WS6",
];

export const WEEKLY_SOCIAL_POOL: WeeklySocialType[] = [
  "WC1", "WC2", "WC3", "WC4", "WC5", "WC6", "WC7", "WC8",
];

// ── Segment-based Daily Difficulty Filter ─────────────────
// Each segment only selects from quests appropriate to it.

export const SEGMENT_DAILY_POOLS: Record<UserSegment, Record<QuestTier, string[]>> = {
  dormant: {
    receipt:   ["D1", "D9", "D12", "D11", "D10"],
    discovery: ["DD9", "DD5", "DD8", "DD4"],
    savings:   ["DS5", "DS6", "DS1"],
    social:    ["DC4", "DC6"],
    streak:    [],
  },
  casual: {
    receipt:   ["D3", "D6", "D7", "D9", "D10", "D11", "D16"],
    discovery: ["DD1", "DD2", "DD4", "DD5", "DD8"],
    savings:   ["DS1", "DS2", "DS5", "DS6"],
    social:    ["DC4", "DC5", "DC6"],
    streak:    [],
  },
  power: {
    receipt:   ["D4", "D5", "D7", "D8", "D13", "D14"],
    discovery: ["DD3", "DD6", "DD7", "DD10", "DD1", "DD2"],
    savings:   ["DS3", "DS4", "DS7", "DS8"],
    social:    ["DC1", "DC2", "DC3", "DC5"],
    streak:    [],
  },
};

// ── Segment-based Weekly Difficulty Filter ─────────────────

export const SEGMENT_WEEKLY_POOLS: Record<UserSegment, Record<QuestTier, string[]>> = {
  dormant: {
    receipt:   ["W1A", "W12", "W1C"],
    discovery: ["WD1", "WD5", "WD6"],
    savings:   ["WS1", "WS5", "WS3"],
    social:    ["WC2", "WC5"],
    streak:    [],
  },
  casual: {
    receipt:   ["W1A", "W1C", "W4", "W7", "W8", "W11"],
    discovery: ["WD1", "WD5", "WD6", "WD8"],
    savings:   ["WS1", "WS3", "WS5"],
    social:    ["WC2", "WC4", "WC5"],
    streak:    [],
  },
  power: {
    receipt:   ["W1B", "W2", "W3", "W5", "W6", "W9", "W10"],
    discovery: ["WD2", "WD3", "WD4", "WD7"],
    savings:   ["WS2", "WS4", "WS6"],
    social:    ["WC1", "WC3", "WC6", "WC7", "WC8"],
    streak:    [],
  },
};

// ── Tier slot order ───────────────────────────────────────
// Slot order in daily and weekly quest generation

export const DAILY_TIER_ORDER: QuestTier[] = ["receipt", "discovery", "savings", "social"];
export const WEEKLY_TIER_ORDER: QuestTier[] = ["receipt", "discovery", "savings", "social"];

// ── Feature flags ─────────────────────────────────────────

const ENABLED_FEATURES = new Set<string>([
  // 'price_comparison',  // uncomment when Price Compare MVP launches
  // 'referral_system',   // uncomment when referral system is live
]);

export function isFeatureEnabled(feature: string): boolean {
  return ENABLED_FEATURES.has(feature);
}

// ── Fallback tier when a tier is not available ────────────
// savings → receipt (fallback), social → discovery (fallback)

export const TIER_FALLBACK: Partial<Record<QuestTier, QuestTier>> = {
  savings: "receipt",
  social: "discovery",
};

// ── Quest target definitions for new types ─────────────────

export interface QuestTargetConfig {
  fixedTarget?: number;
  dynamicFn?: string; // name of dynamic target function
}

export const DAILY_QUEST_TARGETS: Record<string, QuestTargetConfig> = {
  // Tier 1 existing
  D1:  { fixedTarget: 1 },
  D3:  { fixedTarget: 1 },
  D4:  { fixedTarget: 2 },
  D5:  { dynamicFn: "hiddenCostThreshold" },
  D6:  { fixedTarget: 1 },
  D7:  { fixedTarget: 1 },
  D8:  { fixedTarget: 2 },
  D9:  { fixedTarget: 1 },
  // Tier 1 new
  D10: { fixedTarget: 1 },
  D11: { fixedTarget: 1 },
  D12: { fixedTarget: 1 },
  D13: { fixedTarget: 1 },
  D14: { fixedTarget: 2 },
  D16: { fixedTarget: 1 },
  // Tier 2 Discovery
  DD1:  { fixedTarget: 1 },
  DD2:  { fixedTarget: 1 },
  DD3:  { fixedTarget: 1 },
  DD4:  { fixedTarget: 1 },
  DD5:  { fixedTarget: 1 },
  DD6:  { fixedTarget: 1 },
  DD7:  { fixedTarget: 1 },
  DD8:  { fixedTarget: 1 },
  DD9:  { fixedTarget: 1 },
  DD10: { fixedTarget: 1 },
  // Tier 3 Savings
  DS1: { dynamicFn: "savingsThreshold" },
  DS2: { fixedTarget: 1 },
  DS3: { fixedTarget: 1 },
  DS4: { fixedTarget: 1 },
  DS5: { fixedTarget: 1 },
  DS6: { dynamicFn: "budgetThreshold" },
  DS7: { fixedTarget: 1 },
  DS8: { fixedTarget: 1 },
  // Tier 4 Social
  DC1: { fixedTarget: 1 },
  DC2: { fixedTarget: 1 },
  DC3: { fixedTarget: 1 },
  DC4: { fixedTarget: 1 },
  DC5: { dynamicFn: "benchmarkDaily" },
  DC6: { fixedTarget: 1 },
};

export const WEEKLY_QUEST_TARGETS: Record<string, QuestTargetConfig> = {
  // Tier 1 existing
  W1A: { fixedTarget: 5 },
  W1B: { fixedTarget: 20 },
  W1C: { fixedTarget: 10 },
  W2:  { dynamicFn: "benchmarkWeekly" },
  W3:  { dynamicFn: "previousBest" },
  W4:  { fixedTarget: 5 },
  W5:  { fixedTarget: 8 },
  W6:  { fixedTarget: 10 },
  // Tier 1 new
  W7:  { dynamicFn: "weeklyHiddenCostReduction" },
  W8:  { fixedTarget: 5 },
  W9:  { fixedTarget: 7 },
  W10: { fixedTarget: 2000 },
  W11: { fixedTarget: 3 },
  W12: { fixedTarget: 3 },
  // Tier 2 Discovery weekly
  WD1: { fixedTarget: 5 },
  WD2: { fixedTarget: 6 },
  WD3: { fixedTarget: 3 },
  WD4: { fixedTarget: 3 },
  WD5: { fixedTarget: 4 },
  WD6: { fixedTarget: 2 },
  WD7: { fixedTarget: 3 },
  WD8: { fixedTarget: 3 },
  // Tier 3 Savings weekly
  WS1: { dynamicFn: "weeklyHiddenCostReduction" },
  WS2: { fixedTarget: 5 },
  WS3: { dynamicFn: "weeklySpendingReduction" },
  WS4: { fixedTarget: 1 },
  WS5: { fixedTarget: 5 },
  WS6: { fixedTarget: 1 },
  // Tier 4 Social weekly
  WC1: { fixedTarget: 1 },
  WC2: { fixedTarget: 3 },
  WC3: { fixedTarget: 1 },
  WC4: { fixedTarget: 1 },
  WC5: { fixedTarget: 1 },
  WC6: { fixedTarget: 10 },
  WC7: { fixedTarget: 5 },
  WC8: { fixedTarget: 3 },
};

// ── Quest titles by locale ────────────────────────────────

type QuestLocale = "tr" | "en" | "ru" | "th" | "es" | "zh";

const QUEST_TITLES_I18N: Record<string, Record<QuestLocale, string>> = {
  D1:  { tr: "Günlük giriş yap", en: "Daily check-in", ru: "Ежедневная отметка", th: "เช็คอินรายวัน", es: "Registro diario", zh: "每日签到" },
  D3:  { tr: "Farklı bir kategoride fiş yükle", en: "Upload a receipt in a new category", ru: "Загрузи чек в новой категории", th: "อัปโหลดใบเสร็จในหมวดหมู่ใหม่", es: "Sube un recibo en una categoría nueva", zh: "上传新类别的收据" },
  D4:  { tr: "2 farklı kategoriden fiş tara", en: "Scan receipts from 2 different categories", ru: "Загрузи чеки из 2 разных категорий", th: "สแกนใบเสร็จจาก 2 หมวดหมู่ที่ต่างกัน", es: "Escanea recibos de 2 categorías diferentes", zh: "扫描来自2个不同类别的收据" },
  D5:  { tr: "Gizli maliyetli ürün bul", en: "Find a product with hidden costs", ru: "Найди товар со скрытыми расходами", th: "ค้นหาผลิตภัณฑ์ที่มีต้นทุนซ่อนอยู่", es: "Encuentra un producto con costes ocultos", zh: "找到含有隐藏成本的产品" },
  D6:  { tr: "Gizli maliyet içeren fiş yükle", en: "Upload a receipt with hidden costs", ru: "Загрузи чек со скрытыми расходами", th: "อัปโหลดใบเสร็จที่มีต้นทุนซ่อนอยู่", es: "Sube un recibo con costes ocultos", zh: "上传含隐藏成本的收据" },
  D7:  { tr: "Yeni bir mağazadan fiş yükle", en: "Upload a receipt from a new store", ru: "Загрузи чек из нового магазина", th: "อัปโหลดใบเสร็จจากร้านใหม่", es: "Sube un recibo de una tienda nueva", zh: "从新店铺上传收据" },
  D8:  { tr: "2 farklı mağazadan fiş yükle", en: "Upload receipts from 2 different stores", ru: "Загрузи чеки из 2 разных магазинов", th: "อัปโหลดใบเสร็จจาก 2 ร้านที่ต่างกัน", es: "Sube recibos de 2 tiendas diferentes", zh: "从2家不同店铺上传收据" },
  D9:  { tr: "Bugün en az 1 fiş yükle", en: "Upload at least 1 receipt today", ru: "Загрузи хотя бы 1 чек сегодня", th: "อัปโหลดใบเสร็จอย่างน้อย 1 ใบวันนี้", es: "Sube al menos 1 recibo hoy", zh: "今天至少上传1张收据" },
  D10: { tr: "Sabah fişi: Saat 10:00'dan önceki bir fişi yükle", en: "Morning receipt: Upload a receipt before 10:00", ru: "Утренний чек: загрузи чек до 10:00", th: "ใบเสร็จเช้า: อัปโหลดใบเสร็จก่อน 10:00", es: "Recibo matutino: sube un recibo antes de las 10:00", zh: "早晨收据：在10:00前上传收据" },
  D11: { tr: "Akşam fişi: 18:00-23:00 arası fiş yükle", en: "Evening receipt: Upload a receipt between 18:00-23:00", ru: "Вечерний чек: загрузи чек между 18:00 и 23:00", th: "ใบเสร็จเย็น: อัปโหลดใบเสร็จระหว่าง 18:00-23:00", es: "Recibo vespertino: sube un recibo entre las 18:00 y las 23:00", zh: "晚间收据：在18:00-23:00上传收据" },
  D12: { tr: "Küçük alışveriş: Düşük tutarlı fiş yükle", en: "Small purchase: Upload a low-value receipt", ru: "Мелкая покупка: загрузи чек на небольшую сумму", th: "ซื้อเล็กน้อย: อัปโหลดใบเสร็จมูลค่าต่ำ", es: "Compra pequeña: sube un recibo de poco valor", zh: "小额购物：上传低金额收据" },
  D13: { tr: "Büyük alışveriş: Yüksek tutarlı fiş yükle", en: "Big purchase: Upload a high-value receipt", ru: "Крупная покупка: загрузи чек на большую сумму", th: "ซื้อใหญ่: อัปโหลดใบเสร็จมูลค่าสูง", es: "Compra grande: sube un recibo de alto valor", zh: "大额购物：上传高金额收据" },
  D14: { tr: "Çift fiş: 2 farklı marketten aynı gün fiş yükle", en: "Double receipt: Upload from 2 different stores same day", ru: "Двойной чек: загрузи из 2 разных магазинов в один день", th: "ใบเสร็จคู่: อัปโหลดจาก 2 ร้านต่างกันในวันเดียวกัน", es: "Recibo doble: sube de 2 tiendas distintas el mismo día", zh: "双份收据：同一天从2家不同店铺上传" },
  D16: { tr: "KDV avcısı: KDV'li fiş yükle", en: "VAT hunter: Upload a receipt with VAT", ru: "Охотник за НДС: загрузи чек с НДС", th: "นักล่า VAT: อัปโหลดใบเสร็จที่มี VAT", es: "Cazador de IVA: sube un recibo con IVA", zh: "增值税猎人：上传含增值税的收据" },
  DD1: { tr: "Yeni yerden fiş yükle", en: "Upload from a new place", ru: "Загрузи чек из нового места", th: "อัปโหลดจากสถานที่ใหม่", es: "Sube desde un lugar nuevo", zh: "从新地点上传" },
  DD2: { tr: "Az yüklediğin kategoride fiş yükle", en: "Upload in your least-used category", ru: "Загрузи в категории, которую используешь реже всего", th: "อัปโหลดในหมวดหมู่ที่ใช้น้อยที่สุด", es: "Sube en tu categoría menos usada", zh: "上传到使用最少的类别" },
  DD3: { tr: "Fiyat dedektifi: Karşılaştırma yap", en: "Price detective: Compare prices", ru: "Ценовой детектив: сравни цены", th: "นักสืบราคา: เปรียบเทียบราคา", es: "Detective de precios: compara precios", zh: "价格侦探：比较价格" },
  DD4: { tr: "Farklı lokasyondan fiş yükle", en: "Upload from a different location", ru: "Загрузи чек из другого места", th: "อัปโหลดจากสถานที่ต่างออกไป", es: "Sube desde una ubicación diferente", zh: "从不同地点上传" },
  DD5: { tr: "İndirim avcısı: İndirimli ürün içeren fiş yükle", en: "Discount hunter: Upload a receipt with discounted items", ru: "Охотник за скидками: загрузи чек со скидочными товарами", th: "นักล่าส่วนลด: อัปโหลดใบเสร็จที่มีสินค้าลดราคา", es: "Cazador de descuentos: sube un recibo con artículos rebajados", zh: "折扣猎人：上传含折扣商品的收据" },
  DD6: { tr: "En ucuz ürünü bul", en: "Find the cheapest product", ru: "Найди самый дешёвый товар", th: "ค้นหาสินค้าที่ถูกที่สุด", es: "Encuentra el producto más barato", zh: "找到最便宜的产品" },
  DD7: { tr: "Yerel marketten fiş yükle", en: "Upload from a local store", ru: "Загрузи чек из местного магазина", th: "อัปโหลดจากร้านค้าท้องถิ่น", es: "Sube desde una tienda local", zh: "从本地店铺上传" },
  DD8: { tr: "Kahvaltılık kategorisinde fiş yükle", en: "Upload a breakfast category receipt", ru: "Загрузи чек из категории завтрака", th: "อัปโหลดใบเสร็จหมวดอาหารเช้า", es: "Sube un recibo de categoría desayuno", zh: "上传早餐类别收据" },
  DD9: { tr: "En düşük tutarlı fişini yükle", en: "Upload your lowest-value receipt", ru: "Загрузи чек с наименьшей суммой", th: "อัปโหลดใบเสร็จที่มีมูลค่าต่ำที่สุด", es: "Sube tu recibo de menor valor", zh: "上传金额最低的收据" },
  DD10: { tr: "10+ kalemli fiş yükle", en: "Upload a receipt with 10+ items", ru: "Загрузи чек с 10+ товарами", th: "อัปโหลดใบเสร็จที่มี 10+ รายการ", es: "Sube un recibo con 10+ artículos", zh: "上传含10个以上商品的收据" },
  DS1: { tr: "Gizli maliyet eşiğinin altında kal", en: "Stay below the hidden cost threshold", ru: "Оставайся ниже порога скрытых расходов", th: "อยู่ต่ำกว่าเกณฑ์ต้นทุนซ่อน", es: "Mantente por debajo del umbral de costes ocultos", zh: "保持在隐藏成本阈值以下" },
  DS2: { tr: "Fiyat karşılaştırması yap", en: "Do a price comparison", ru: "Сравни цены", th: "เปรียบเทียบราคา", es: "Haz una comparación de precios", zh: "进行价格比较" },
  DS3: { tr: "En ucuz ürünü bularak tasarruf et", en: "Save by finding the cheapest option", ru: "Сэкономь, найдя самый дешёвый вариант", th: "ประหยัดโดยหาตัวเลือกที่ถูกที่สุด", es: "Ahorra encontrando la opción más barata", zh: "通过寻找最便宜的选项来省钱" },
  DS4: { tr: "Birim fiyatı en avantajlı ürünü seç", en: "Choose the best unit price product", ru: "Выбери товар с лучшей ценой за единицу", th: "เลือกสินค้าที่มีราคาต่อหน่วยดีที่สุด", es: "Elige el producto con mejor precio unitario", zh: "选择单价最优的产品" },
  DS5: { tr: "İndirimli ürün içeren fiş yükle", en: "Upload a receipt with discounted items", ru: "Загрузи чек со скидочными товарами", th: "อัปโหลดใบเสร็จที่มีสินค้าลดราคา", es: "Sube un recibo con artículos en oferta", zh: "上传含折扣商品的收据" },
  DS6: { tr: "Ortalamanın altında harcama yap", en: "Spend below your average", ru: "Потрать меньше своего среднего", th: "ใช้จ่ายต่ำกว่าค่าเฉลี่ย", es: "Gasta por debajo de tu media", zh: "支出低于平均水平" },
  DS7: { tr: "Farklı KDV oranlı ürün içeren fiş yükle", en: "Upload a receipt with different VAT rates", ru: "Загрузи чек с товарами разных ставок НДС", th: "อัปโหลดใบเสร็จที่มีอัตรา VAT ต่างกัน", es: "Sube un recibo con diferentes tasas de IVA", zh: "上传含不同增值税税率商品的收据" },
  DS8: { tr: "Düşük gizli maliyet oranlı fiş yükle", en: "Upload a receipt with low hidden cost ratio", ru: "Загрузи чек с низким соотношением скрытых расходов", th: "อัปโหลดใบเสร็จที่มีอัตราต้นทุนซ่อนต่ำ", es: "Sube un recibo con bajo ratio de costes ocultos", zh: "上传隐藏成本比率低的收据" },
  DC1: { tr: "İlk 100 fiş yükleyeninden biri ol", en: "Be among the first 100 uploaders today", ru: "Войди в первую сотню загрузчиков чеков", th: "เป็นหนึ่งใน 100 คนแรกที่อัปโหลดวันนี้", es: "Sé uno de los primeros 100 en subir hoy", zh: "成为今天前100名上传者之一" },
  DC2: { tr: "Kataloğa yeni ürün ekle", en: "Add a new product to the catalog", ru: "Добавь новый товар в каталог", th: "เพิ่มสินค้าใหม่ในแค็ตตาล็อก", es: "Añade un producto nuevo al catálogo", zh: "向目录添加新产品" },
  DC3: { tr: "Davet ettiğin bir arkadaşın fiş yüklesin", en: "Have a friend you invited upload a receipt", ru: "Пусть приглашённый тобой друг загрузит чек", th: "ให้เพื่อนที่คุณเชิญอัปโหลดใบเสร็จ", es: "Haz que un amigo invitado suba un recibo", zh: "让你邀请的朋友上传收据" },
  DC4: { tr: "Günün en popüler kategorisinde fiş yükle", en: "Upload in today's most popular category", ru: "Загрузи чек в самой популярной категории дня", th: "อัปโหลดในหมวดหมู่ยอดนิยมของวันนี้", es: "Sube en la categoría más popular de hoy", zh: "上传到今日最热门类别" },
  DC5: { tr: "Topluluk ortalamasını geç", en: "Beat the community average", ru: "Обгони среднее значение сообщества", th: "เอาชนะค่าเฉลี่ยของชุมชน", es: "Supera la media de la comunidad", zh: "超越社区平均水平" },
  DC6: { tr: "Bir arkadaşını davet et", en: "Invite a friend", ru: "Пригласи друга", th: "เชิญเพื่อน", es: "Invita a un amigo", zh: "邀请一位朋友" },
  // Weekly quests W1–W6
  W1A: { tr: "Minimalist Plan", en: "Minimalist Plan", ru: "Минималистичный план", th: "แผนมินิมอล", es: "Plan Minimalista", zh: "极简计划" },
  W1B: { tr: "Agresif Plan", en: "Aggressive Plan", ru: "Агрессивный план", th: "แผนเชิงรุก", es: "Plan Agresivo", zh: "激进计划" },
  W1C: { tr: "Dengeli Plan", en: "Balanced Plan", ru: "Сбалансированный план", th: "แผนสมดุล", es: "Plan Equilibrado", zh: "均衡计划" },
  W2:  { tr: "Hedef kullanıcıyı geç", en: "Pass the target user", ru: "Обойди целевого пользователя", th: "แซงผู้ใช้เป้าหมาย", es: "Supera al usuario objetivo", zh: "超越目标用户" },
  W3:  { tr: "Kendi rekorunu kır", en: "Break your own record", ru: "Побей свой собственный рекорд", th: "ทำลายสถิติของตัวเอง", es: "Bate tu propio récord", zh: "打破自己的记录" },
  W4:  { tr: "Tek sektör uzmanı", en: "Single-sector specialist", ru: "Специалист одного сектора", th: "ผู้เชี่ยวชาญภาคเดียว", es: "Especialista de un solo sector", zh: "单一领域专家" },
  W5:  { tr: "Riskli hafta", en: "High-risk week", ru: "Рискованная неделя", th: "สัปดาห์ความเสี่ยงสูง", es: "Semana de alto riesgo", zh: "高风险周" },
  W6:  { tr: "Sosyal tırmanış", en: "Social climb", ru: "Социальный подъём", th: "การปีนบันไดทางสังคม", es: "Ascenso social", zh: "社交攀升" },
  W7:  { tr: "Haftalık tasarruf: Düşük gizli maliyet", en: "Weekly savings: Low hidden cost", ru: "Еженедельная экономия: низкие скрытые расходы", th: "ประหยัดรายสัปดาห์: ต้นทุนซ่อนต่ำ", es: "Ahorro semanal: bajo coste oculto", zh: "每周节省：低隐藏成本" },
  W8:  { tr: "Kategori gezgini: 5 farklı kategori", en: "Category explorer: 5 different categories", ru: "Путешественник по категориям: 5 разных категорий", th: "นักสำรวจหมวดหมู่: 5 หมวดหมู่ต่างกัน", es: "Explorador de categorías: 5 categorías diferentes", zh: "类别探索者：5个不同类别" },
  W9:  { tr: "Her gün aktif: 7/7 gün fiş yükle", en: "Daily active: Upload receipts 7/7 days", ru: "Ежедневная активность: загружай чеки 7/7 дней", th: "ใช้งานทุกวัน: อัปโหลดใบเสร็จ 7/7 วัน", es: "Activo cada día: sube recibos 7/7 días", zh: "每天活跃：7/7天上传收据" },
  W10: { tr: "Kümülatif tutar: Yüksek toplam fiş", en: "Cumulative total: High total receipts", ru: "Совокупная сумма: большой объём чеков", th: "ยอดรวมสะสม: ใบเสร็จรวมสูง", es: "Total acumulado: recibos de alto valor", zh: "累计总额：高额收据总计" },
  W11: { tr: "Yeni keşif haftası: 3 yeni mağaza", en: "Discovery week: 3 new stores", ru: "Неделя открытий: 3 новых магазина", th: "สัปดาห์แห่งการค้นพบ: 3 ร้านใหม่", es: "Semana de descubrimiento: 3 tiendas nuevas", zh: "发现周：3家新店铺" },
  W12: { tr: "En az 3 gün aktif ol", en: "Be active at least 3 days", ru: "Будь активен хотя бы 3 дня", th: "ใช้งานอย่างน้อย 3 วัน", es: "Activo al menos 3 días", zh: "至少活跃3天" },
  WD1: { tr: "Harita boyacısı: 5 farklı mağaza", en: "Map painter: 5 different stores", ru: "Картограф: 5 разных магазинов", th: "จิตรกรแผนที่: 5 ร้านต่างกัน", es: "Pintor de mapas: 5 tiendas diferentes", zh: "地图画家：5家不同店铺" },
  WD2: { tr: "Kategori koleksiyoncusu: 6 kategori", en: "Category collector: 6 categories", ru: "Коллекционер категорий: 6 категорий", th: "นักสะสมหมวดหมู่: 6 หมวดหมู่", es: "Coleccionista de categorías: 6 categorías", zh: "类别收藏家：6个类别" },
  WD3: { tr: "Fiyat hafızası: 3 marketten karşılaştır", en: "Price memory: Compare from 3 stores", ru: "Ценовая память: сравни в 3 магазинах", th: "ความจำราคา: เปรียบเทียบจาก 3 ร้าน", es: "Memoria de precios: compara en 3 tiendas", zh: "价格记忆：比较3家店铺" },
  WD4: { tr: "Yerel kahraman: 3 yerel market", en: "Local hero: 3 local stores", ru: "Местный герой: 3 местных магазина", th: "วีรบุรุษท้องถิ่น: 3 ร้านค้าท้องถิ่น", es: "Héroe local: 3 tiendas locales", zh: "本地英雄：3家本地店铺" },
  WD5: { tr: "Market turu: 4 farklı gün aktif", en: "Store tour: Active 4 different days", ru: "Тур по магазинам: активен 4 разных дня", th: "ทัวร์ตลาด: ใช้งาน 4 วันต่างกัน", es: "Ruta de tiendas: activo 4 días diferentes", zh: "商店之旅：4天活跃" },
  WD6: { tr: "Yeni kategori avcısı: 2 yeni kategori", en: "New category hunter: 2 new categories", ru: "Охотник за категориями: 2 новые категории", th: "นักล่าหมวดหมู่ใหม่: 2 หมวดหมู่ใหม่", es: "Cazador de categorías nuevas: 2 categorías nuevas", zh: "新类别猎人：2个新类别" },
  WD7: { tr: "Sepet analisti: 3 karşılaştırma", en: "Basket analyst: 3 comparisons", ru: "Аналитик корзины: 3 сравнения", th: "นักวิเคราะห์ตะกร้า: 3 การเปรียบเทียบ", es: "Analista de cesta: 3 comparaciones", zh: "购物篮分析师：3次比较" },
  WD8: { tr: "Rutin kırıcı: Bilinen marketten dışarı çık", en: "Routine breaker: Go beyond known stores", ru: "Нарушитель рутины: выйди за рамки привычных магазинов", th: "ผู้ทำลายกิจวัตร: ออกไปนอกร้านที่รู้จัก", es: "Rompe rutinas: ve más allá de las tiendas habituales", zh: "打破常规：超越熟悉的店铺" },
  WS1: { tr: "Haftalık bütçe ustası: Gizli maliyeti azalt", en: "Weekly budget master: Reduce hidden costs", ru: "Мастер недельного бюджета: снижай скрытые расходы", th: "ผู้เชี่ยวชาญงบประมาณรายสัปดาห์: ลดต้นทุนซ่อน", es: "Maestro del presupuesto semanal: reduce los costes ocultos", zh: "每周预算大师：降低隐藏成本" },
  WS2: { tr: "Karşılaştırma kralı: 5 ürün karşılaştır", en: "Comparison king: Compare 5 products", ru: "Король сравнений: сравни 5 товаров", th: "ราชาแห่งการเปรียบเทียบ: เปรียบเทียบ 5 สินค้า", es: "Rey de las comparaciones: compara 5 productos", zh: "比较之王：比较5种产品" },
  WS3: { tr: "Tutumlu hafta: Harcamaları azalt", en: "Thrifty week: Reduce spending", ru: "Экономная неделя: сократи расходы", th: "สัปดาห์ประหยัด: ลดการใช้จ่าย", es: "Semana austera: reduce el gasto", zh: "节俭周：减少支出" },
  WS4: { tr: "En iyi fırsatı yakala", en: "Grab the best deal", ru: "Поймай лучшую сделку", th: "คว้าดีลที่ดีที่สุด", es: "Consigue la mejor oferta", zh: "抓住最佳优惠" },
  WS5: { tr: "İndirim koleksiyoncusu: 5 promosyon", en: "Discount collector: 5 promotions", ru: "Коллекционер скидок: 5 акций", th: "นักสะสมส่วนลด: 5 โปรโมชัน", es: "Coleccionista de descuentos: 5 promociones", zh: "折扣收藏家：5个促销" },
  WS6: { tr: "Akıllı sepet: Sepet karşılaştırması", en: "Smart basket: Basket comparison", ru: "Умная корзина: сравнение корзин", th: "ตะกร้าอัจฉริยะ: เปรียบเทียบตะกร้า", es: "Cesta inteligente: comparación de cestas", zh: "智能购物篮：购物篮比较" },
  WC1: { tr: "Haftalık üst %10'a gir", en: "Enter the top 10% weekly", ru: "Войди в топ 10% за неделю", th: "เข้าสู่ 10% อันดับต้นรายสัปดาห์", es: "Entra en el top 10% semanal", zh: "进入每周前10%" },
  WC2: { tr: "3 arkadaş davet et", en: "Invite 3 friends", ru: "Пригласи 3 друзей", th: "เชิญเพื่อน 3 คน", es: "Invita a 3 amigos", zh: "邀请3位朋友" },
  WC3: { tr: "Şehrinde ilk 5'e gir", en: "Enter top 5 in your city", ru: "Войди в топ 5 своего города", th: "เข้าสู่ 5 อันดับแรกในเมืองของคุณ", es: "Entra en el top 5 de tu ciudad", zh: "进入你所在城市的前5名" },
  WC4: { tr: "Kategorinde en çok fiş yükle", en: "Upload the most receipts in your category", ru: "Загрузи больше всех чеков в своей категории", th: "อัปโหลดใบเสร็จมากที่สุดในหมวดหมู่ของคุณ", es: "Sube más recibos que nadie en tu categoría", zh: "在你的类别中上传最多收据" },
  WC5: { tr: "Yeni mağaza keşfet", en: "Discover new stores", ru: "Открой новые магазины", th: "ค้นพบร้านใหม่", es: "Descubre tiendas nuevas", zh: "发现新店铺" },
  WC6: { tr: "Takım oyuncusu: Referanslarla 10 fiş", en: "Team player: 10 receipts with referrals", ru: "Командный игрок: 10 чеков с рефералами", th: "นักเล่นทีม: 10 ใบเสร็จพร้อมการแนะนำ", es: "Jugador de equipo: 10 recibos con referidos", zh: "团队成员：通过推荐上传10张收据" },
  WC7: { tr: "5 kişi davet et", en: "Invite 5 people", ru: "Пригласи 5 человек", th: "เชิญ 5 คน", es: "Invita a 5 personas", zh: "邀请5人" },
  WC8: { tr: "3 davetlinin aktif olmasını sağla", en: "Get 3 invitees to be active", ru: "Сделай так, чтобы 3 приглашённых были активны", th: "ทำให้ผู้รับเชิญ 3 คนใช้งาน", es: "Consigue que 3 invitados estén activos", zh: "让3位受邀者保持活跃" },
  D_ADMIN_FREE_300XP: { tr: "Admin bedava XP", en: "Admin free XP", ru: "Бесплатный XP для администратора", th: "XP ฟรีสำหรับแอดมิน", es: "XP gratis para admin", zh: "管理员免费XP" },
};

export function getQuestTitle(type: string, locale: string, dbTitle?: string): string {
  const titles = QUEST_TITLES_I18N[type];
  if (titles) {
    const loc = (locale in titles ? locale : "en") as QuestLocale;
    return titles[loc];
  }
  // Type not present in QUEST_TITLES_I18N: use the DB title for EN/TR, return the type code for other locales
  if (dbTitle && dbTitle.length >= 3) return dbTitle;
  return type;
}

// Backward compat: FALLBACK_TITLES now returns the TR titles
export const FALLBACK_TITLES: Record<string, string> = Object.fromEntries(
  Object.entries(QUEST_TITLES_I18N).map(([k, v]) => [k, v.tr])
);
