import { categoryLabel } from "@/lib/i18n/taxonomy";
import type { CachedInsightEventRecord, InsightEventKind } from "@/lib/offline/types";

export type PatternMeta = {
  label: string;
  shortLabel: string;
  accent: string;
  softAccent: string;
  mapLabel: string;
  emptyHint: string;
};

export type ProofPoint = {
  label: string;
  value: string;
  tone?: "good" | "warn" | "muted";
};

export type PatternNarrative = {
  eyebrow: string;
  headline: string;
  read: string;
  /** One paragraph read specific to the user's own data. No generic psychology. */
  humanLayer: string;
  /** One concrete action / boundary suggestion. No cliché advice. */
  support: string;
  primaryAction: string;
  secondaryAction: string;
  proof: ProofPoint[];
  confidenceLabel: string;
  /** Micro-experiment suggested to the user. */
  suggestedExperiment?: string;
  /** @deprecated Removed — the generic sociological commentary was confusing in the panel. */
  socialLayer?: string;
  /** @deprecated Removed — the hedge list read with an "AI safety" tone. */
  counterEvidence?: string[];
};

export const PATTERN_META: Record<string, PatternMeta> = {
  impulse_fingerprint: {
    label: "Harcama Ritmi",
    shortLabel: "Ritim",
    accent: "#f7b955",
    softAccent: "rgba(247,185,85,0.14)",
    mapLabel: "Zaman baskısı",
    emptyHint: "Saat ve gün kalıbı için birkaç farklı zamanda fiş lazım.",
  },
  own_price_track: {
    label: "Fiyat Hafızası",
    shortLabel: "Fiyat",
    accent: "#58d68d",
    softAccent: "rgba(88,214,141,0.14)",
    mapLabel: "Fiyat farkındalığı",
    emptyHint: "Aynı ürünü birkaç kez taratınca fiyat hafızan oluşur.",
  },
  category_drift: {
    label: "Hayat Kayması",
    shortLabel: "Kayma",
    accent: "#6aa9ff",
    softAccent: "rgba(106,169,255,0.14)",
    mapLabel: "Günlük düzen",
    emptyHint: "Kategori değişimini görmek için en az iki dönem gerekir.",
  },
  past_self: {
    label: "Geçmiş Sen",
    shortLabel: "Tempo",
    accent: "#c084fc",
    softAccent: "rgba(192,132,252,0.14)",
    mapLabel: "Aylık tempo",
    emptyHint: "Geçmiş aylarla adil karşılaştırma için biraz daha fiş birikmeli.",
  },
  // Sprint 1 — new behavior lenses
  reward_reflex: {
    label: "Ödül Refleksi",
    shortLabel: "Ödül",
    accent: "#ff8c69",
    softAccent: "rgba(255,140,105,0.14)",
    mapLabel: "Kapanış ritüeli",
    emptyHint: "Akşam saatlerinde küçük ödül alışverişleri biriktiğinde görünür olur.",
  },
  stress_pulse: {
    label: "Stres Atışı",
    shortLabel: "Stres",
    accent: "#f87171",
    softAccent: "rgba(248,113,113,0.14)",
    mapLabel: "Rahatlama arayışı",
    emptyHint: "Hafta içi geç saatlerde delivery veya snack harcamaları biriktiğinde görünür olur.",
  },
  micro_leak: {
    label: "Mikro Sızıntı",
    shortLabel: "Sızıntı",
    accent: "#fbbf24",
    softAccent: "rgba(251,191,36,0.14)",
    mapLabel: "Tekrar eden küçük harcama",
    emptyHint: "Aynı yerden küçük tutarlı, sık tekrar eden harcamalar biriktiğinde görünür olur.",
  },
  ritual_loop: {
    label: "Ritüel Döngü",
    shortLabel: "Ritüel",
    accent: "#818cf8",
    softAccent: "rgba(129,140,248,0.14)",
    mapLabel: "Haftalık ritim",
    emptyHint: "Belirli bir gün ve saatte tekrar eden harcama kalıbı oluştuğunda görünür olur.",
  },
};

export const KIND_ORDER: InsightEventKind[] = [
  "impulse_fingerprint",
  "own_price_track",
  "category_drift",
  "past_self",
  "reward_reflex",
  "stress_pulse",
  "micro_leak",
  "ritual_loop",
];

type LocaleKey = "tr" | "en" | "ru" | "th" | "es" | "zh";

type LocalizedMetaText = Pick<PatternMeta, "label" | "shortLabel" | "emptyHint">;

const PATTERN_META_I18N: Record<LocaleKey, Record<string, LocalizedMetaText>> = {
  tr: {
    impulse_fingerprint: { label: "Harcama Ritmi", shortLabel: "Ritim", emptyHint: "Saat ve gün kalıbı için birkaç farklı zamanda fiş lazım." },
    own_price_track: { label: "Fiyat Hafızası", shortLabel: "Fiyat", emptyHint: "Aynı ürünü birkaç kez taratınca fiyat hafızan oluşur." },
    category_drift: { label: "Hayat Kayması", shortLabel: "Kayma", emptyHint: "Kategori değişimini görmek için en az iki dönem gerekir." },
    past_self: { label: "Geçmiş Sen", shortLabel: "Tempo", emptyHint: "Geçmiş aylarla adil karşılaştırma için biraz daha fiş birikmeli." },
    reward_reflex: { label: "Ödül Refleksi", shortLabel: "Ödül", emptyHint: "Akşam saatlerinde küçük ödül alışverişleri biriktiğinde görünür olur." },
    stress_pulse: { label: "Stres Atışı", shortLabel: "Stres", emptyHint: "Hafta içi geç saatlerde delivery veya snack harcamaları biriktiğinde görünür olur." },
    micro_leak: { label: "Mikro Sızıntı", shortLabel: "Sızıntı", emptyHint: "Aynı yerden küçük tutarlı, sık tekrar eden harcamalar biriktiğinde görünür olur." },
    ritual_loop: { label: "Ritüel Döngü", shortLabel: "Ritüel", emptyHint: "Belirli bir gün ve saatte tekrar eden harcama kalıbı oluştuğunda görünür olur." },
  },
  en: {
    impulse_fingerprint: { label: "Spending Rhythm", shortLabel: "Rhythm", emptyHint: "We need receipts from different times to detect day & hour patterns." },
    own_price_track: { label: "Price Memory", shortLabel: "Price", emptyHint: "Scan the same item a few times to build a price memory." },
    category_drift: { label: "Life Drift", shortLabel: "Drift", emptyHint: "Category drift needs at least two periods of data." },
    past_self: { label: "Past Self", shortLabel: "Tempo", emptyHint: "A fair comparison with past months needs more receipts." },
    reward_reflex: { label: "Reward Reflex", shortLabel: "Reward", emptyHint: "Becomes visible as small evening reward purchases accumulate." },
    stress_pulse: { label: "Stress Pulse", shortLabel: "Stress", emptyHint: "Becomes visible when late-night delivery or snack spending stacks up." },
    micro_leak: { label: "Micro Leak", shortLabel: "Leak", emptyHint: "Becomes visible when small, frequent spends from the same place build up." },
    ritual_loop: { label: "Ritual Loop", shortLabel: "Ritual", emptyHint: "Becomes visible when a recurring weekday & hour pattern forms." },
  },
  ru: {
    impulse_fingerprint: { label: "Ритм трат", shortLabel: "Ритм", emptyHint: "Нужны чеки в разное время, чтобы увидеть паттерн часа и дня." },
    own_price_track: { label: "Память цены", shortLabel: "Цена", emptyHint: "Просканируй один товар несколько раз, чтобы появилась память цены." },
    category_drift: { label: "Сдвиг жизни", shortLabel: "Сдвиг", emptyHint: "Для сдвига нужны данные за два периода." },
    past_self: { label: "Прошлый ты", shortLabel: "Темп", emptyHint: "Для честного сравнения нужно больше чеков." },
    reward_reflex: { label: "Рефлекс награды", shortLabel: "Награда", emptyHint: "Становится виден, когда копятся вечерние мини-награды." },
    stress_pulse: { label: "Импульс стресса", shortLabel: "Стресс", emptyHint: "Виден, когда поздние доставки и снеки повторяются." },
    micro_leak: { label: "Микро-утечка", shortLabel: "Утечка", emptyHint: "Виден, когда копятся мелкие частые траты из одного места." },
    ritual_loop: { label: "Ритуал", shortLabel: "Ритуал", emptyHint: "Виден, когда формируется устойчивая привычка по дню и часу." },
  },
  th: {
    impulse_fingerprint: { label: "จังหวะการใช้จ่าย", shortLabel: "จังหวะ", emptyHint: "ต้องมีใบเสร็จจากหลายช่วงเวลาเพื่อตรวจจับรูปแบบวัน-ชั่วโมง" },
    own_price_track: { label: "ความจำราคา", shortLabel: "ราคา", emptyHint: "สแกนสินค้าเดิมหลายครั้งเพื่อสร้างความจำราคา" },
    category_drift: { label: "การเลื่อนของชีวิต", shortLabel: "เลื่อน", emptyHint: "ต้องมีข้อมูลอย่างน้อยสองช่วงเพื่อดูการเปลี่ยนหมวด" },
    past_self: { label: "ตัวเองในอดีต", shortLabel: "เทมโป", emptyHint: "ต้องมีใบเสร็จมากขึ้นเพื่อเปรียบเทียบกับเดือนที่ผ่านมาอย่างเป็นธรรม" },
    reward_reflex: { label: "รีเฟล็กซ์รางวัล", shortLabel: "รางวัล", emptyHint: "จะปรากฏเมื่อซื้อรางวัลเล็ก ๆ ตอนเย็นสะสมมากพอ" },
    stress_pulse: { label: "ชีพจรความเครียด", shortLabel: "เครียด", emptyHint: "จะปรากฏเมื่อค่าเดลิเวอรี/ขนมดึก ๆ สะสมมากพอ" },
    micro_leak: { label: "รั่วไหลเล็ก ๆ", shortLabel: "รั่ว", emptyHint: "จะปรากฏเมื่อค่าใช้จ่ายเล็ก ๆ จากที่เดิมเกิดซ้ำบ่อย" },
    ritual_loop: { label: "วงจรพิธีกรรม", shortLabel: "พิธีกรรม", emptyHint: "จะปรากฏเมื่อรูปแบบการใช้จ่ายในวัน-ชั่วโมงเดิมเริ่มซ้ำ" },
  },
  es: {
    impulse_fingerprint: { label: "Ritmo de gasto", shortLabel: "Ritmo", emptyHint: "Necesitamos recibos de varios momentos para ver el patrón de día y hora." },
    own_price_track: { label: "Memoria de precio", shortLabel: "Precio", emptyHint: "Escanea el mismo producto varias veces para crear memoria de precio." },
    category_drift: { label: "Deriva de vida", shortLabel: "Deriva", emptyHint: "El cambio de categoría necesita al menos dos periodos." },
    past_self: { label: "Tu yo pasado", shortLabel: "Tempo", emptyHint: "Para comparar con meses pasados necesitamos más recibos." },
    reward_reflex: { label: "Reflejo de recompensa", shortLabel: "Recompensa", emptyHint: "Aparece cuando se acumulan pequeñas compras de recompensa por la noche." },
    stress_pulse: { label: "Pulso de estrés", shortLabel: "Estrés", emptyHint: "Aparece cuando se acumulan pedidos a domicilio o snacks tarde por la noche." },
    micro_leak: { label: "Micro-fuga", shortLabel: "Fuga", emptyHint: "Aparece cuando se acumulan pequeños gastos repetidos del mismo lugar." },
    ritual_loop: { label: "Bucle ritual", shortLabel: "Ritual", emptyHint: "Aparece cuando se forma un patrón recurrente por día y hora." },
  },
  zh: {
    impulse_fingerprint: { label: "消费节奏", shortLabel: "节奏", emptyHint: "需要不同时段的收据来识别日时模式。" },
    own_price_track: { label: "价格记忆", shortLabel: "价格", emptyHint: "多次扫描同一商品后会形成价格记忆。" },
    category_drift: { label: "生活漂移", shortLabel: "漂移", emptyHint: "类别变化需要至少两个周期的数据。" },
    past_self: { label: "过去的你", shortLabel: "节拍", emptyHint: "公平地与过去月份对比需要更多收据。" },
    reward_reflex: { label: "奖励反射", shortLabel: "奖励", emptyHint: "当夜间小额奖励性消费累积时会显现。" },
    stress_pulse: { label: "压力脉冲", shortLabel: "压力", emptyHint: "当深夜外卖或零食消费累积时会显现。" },
    micro_leak: { label: "微泄漏", shortLabel: "泄漏", emptyHint: "当同一地点的小额高频消费累积时会显现。" },
    ritual_loop: { label: "仪式循环", shortLabel: "仪式", emptyHint: "当固定日时的消费习惯形成时会显现。" },
  },
};

export function getLocalizedPatternMeta(
  kind: InsightEventKind,
  locale: string,
): PatternMeta {
  const base = PATTERN_META[kind];
  const lk = (PATTERN_META_I18N[locale as LocaleKey] ?? PATTERN_META_I18N.en)[kind];
  if (!lk) return base;
  return { ...base, label: lk.label, shortLabel: lk.shortLabel, emptyHint: lk.emptyHint };
}

export function getLocalizedStateLabel(
  state: CachedInsightEventRecord["state"] | null | undefined,
  locale: string,
): string {
  const dict: Record<string, Record<LocaleKey, string>> = {
    waiting: { tr: "bekliyor", en: "waiting", ru: "ожидает", th: "กำลังรอ", es: "esperando", zh: "等待中" },
    detected: { tr: "yeni", en: "new", ru: "новый", th: "ใหม่", es: "nuevo", zh: "新" },
    committed: { tr: "takipte", en: "tracked", ru: "в отслеж.", th: "กำลังติดตาม", es: "en seguim.", zh: "跟踪中" },
    snoozed: { tr: "sonra", en: "later", ru: "позже", th: "ภายหลัง", es: "después", zh: "稍后" },
    viewed: { tr: "okundu", en: "read", ru: "прочитано", th: "อ่านแล้ว", es: "leído", zh: "已读" },
    dismissed: { tr: "kapatıldı", en: "dismissed", ru: "закрыто", th: "ปิดแล้ว", es: "descartado", zh: "已关" },
  };
  const key = state ?? "waiting";
  const lc = (locale as LocaleKey) in dict[key] ? (locale as LocaleKey) : "en";
  return dict[key]?.[lc] ?? dict.viewed[lc];
}

export function getLocalizedRelativeDate(iso: string, locale: string): string {
  const lc: LocaleKey = (["tr", "en", "ru", "th", "es", "zh"].includes(locale)
    ? locale
    : "en") as LocaleKey;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) {
    return { tr: "bugün", en: "today", ru: "сегодня", th: "วันนี้", es: "hoy", zh: "今天" }[lc];
  }
  if (days === 1) {
    return { tr: "dün", en: "yesterday", ru: "вчера", th: "เมื่อวาน", es: "ayer", zh: "昨天" }[lc];
  }
  if (days < 7) {
    return {
      tr: `${days} gün önce`,
      en: `${days}d ago`,
      ru: `${days} дн. назад`,
      th: `${days} วันที่แล้ว`,
      es: `hace ${days} d`,
      zh: `${days}天前`,
    }[lc];
  }
  if (days < 30) {
    const w = Math.floor(days / 7);
    return {
      tr: `${w} hafta önce`,
      en: `${w}w ago`,
      ru: `${w} нед. назад`,
      th: `${w} สัปดาห์ที่แล้ว`,
      es: `hace ${w} sem`,
      zh: `${w}周前`,
    }[lc];
  }
  const m = Math.floor(days / 30);
  return {
    tr: `${m} ay önce`,
    en: `${m}mo ago`,
    ru: `${m} мес. назад`,
    th: `${m} เดือนที่แล้ว`,
    es: `hace ${m} mes`,
    zh: `${m}个月前`,
  }[lc];
}

type SixLangDict = Record<LocaleKey, string>;

function tx(locale: string, dict: SixLangDict): string {
  const lc = (["tr", "en", "ru", "th", "es", "zh"].includes(locale) ? locale : "en") as LocaleKey;
  return dict[lc] ?? dict.en;
}

const DAY_LABELS_I18N: Record<LocaleKey, readonly string[]> = {
  tr: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  th: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
};

const HOUR_BUCKET_I18N: Record<string, SixLangDict> = {
  morning: { tr: "sabah", en: "morning", ru: "утром", th: "ตอนเช้า", es: "por la mañana", zh: "上午" },
  afternoon: { tr: "öğleden sonra", en: "afternoon", ru: "днём", th: "ตอนบ่าย", es: "por la tarde", zh: "下午" },
  evening: { tr: "akşam", en: "evening", ru: "вечером", th: "ตอนเย็น", es: "por la noche", zh: "傍晚" },
  night: { tr: "gece", en: "night", ru: "ночью", th: "กลางคืน", es: "de madrugada", zh: "深夜" },
};

function getDayLabel(day: number | null, locale: string): string {
  if (day === null) {
    return tx(locale, { tr: "belli bir gün", en: "a specific day", ru: "определённый день", th: "วันที่กำหนด", es: "un día concreto", zh: "某一天" });
  }
  const lc = (["tr", "en", "ru", "th", "es", "zh"].includes(locale) ? locale : "en") as LocaleKey;
  return DAY_LABELS_I18N[lc][day] ?? DAY_LABELS_I18N.en[day] ?? "";
}

function getBucketLabel(bucket: string | null, locale: string): string {
  if (!bucket) {
    return tx(locale, { tr: "belli bir saat", en: "a specific hour", ru: "определённый час", th: "เวลาที่กำหนด", es: "una hora concreta", zh: "某一时刻" });
  }
  const dict = HOUR_BUCKET_I18N[bucket];
  return dict ? tx(locale, dict) : bucket;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const NUMBER_LOCALE: Record<LocaleKey, string> = {
  tr: "tr-TR",
  en: "en-US",
  ru: "ru-RU",
  th: "th-TH",
  es: "es-ES",
  zh: "zh-CN",
};

/** Taxonomy currently covers only tr/en; this is a local override for ru/th/es/zh.
 *  Six languages for the most common categories; the rest fall back to the taxonomy default (en). */
const CATEGORY_I18N_OVERRIDE: Record<string, SixLangDict> = {
  apparel: { tr: "giyim", en: "apparel", ru: "одежда", th: "เสื้อผ้า", es: "ropa", zh: "服装" },
  clothing: { tr: "giyim", en: "clothing", ru: "одежда", th: "เสื้อผ้า", es: "ropa", zh: "服装" },
  fashion: { tr: "moda", en: "fashion", ru: "мода", th: "แฟชั่น", es: "moda", zh: "时尚" },
  electronics: { tr: "elektronik", en: "electronics", ru: "электроника", th: "อิเล็กทรอนิกส์", es: "electrónica", zh: "电子产品" },
  dining: { tr: "yeme-içme", en: "dining", ru: "еда вне дома", th: "ทานข้าวนอกบ้าน", es: "comer fuera", zh: "外出就餐" },
  restaurant: { tr: "restoran", en: "restaurant", ru: "ресторан", th: "ร้านอาหาร", es: "restaurante", zh: "餐厅" },
  restaurants: { tr: "restoran", en: "restaurants", ru: "рестораны", th: "ร้านอาหาร", es: "restaurantes", zh: "餐厅" },
  grocery: { tr: "market", en: "groceries", ru: "продукты", th: "ของชำ", es: "supermercado", zh: "超市" },
  groceries: { tr: "market", en: "groceries", ru: "продукты", th: "ของชำ", es: "supermercado", zh: "超市" },
  supermarket: { tr: "süpermarket", en: "supermarket", ru: "супермаркет", th: "ซูเปอร์มาร์เก็ต", es: "supermercado", zh: "超市" },
  cafe: { tr: "kafe", en: "cafe", ru: "кафе", th: "คาเฟ่", es: "cafetería", zh: "咖啡馆" },
  coffee: { tr: "kahve", en: "coffee", ru: "кофе", th: "กาแฟ", es: "café", zh: "咖啡" },
  pharmacy: { tr: "eczane", en: "pharmacy", ru: "аптека", th: "ร้านยา", es: "farmacia", zh: "药店" },
  health: { tr: "sağlık", en: "health", ru: "здоровье", th: "สุขภาพ", es: "salud", zh: "健康" },
  beauty: { tr: "güzellik", en: "beauty", ru: "красота", th: "ความงาม", es: "belleza", zh: "美容" },
  entertainment: { tr: "eğlence", en: "entertainment", ru: "развлечения", th: "บันเทิง", es: "ocio", zh: "娱乐" },
  transport: { tr: "ulaşım", en: "transport", ru: "транспорт", th: "การเดินทาง", es: "transporte", zh: "交通" },
  fuel: { tr: "yakıt", en: "fuel", ru: "топливо", th: "น้ำมัน", es: "combustible", zh: "燃油" },
  delivery: { tr: "paket servis", en: "delivery", ru: "доставка", th: "การจัดส่ง", es: "envío", zh: "外卖" },
  food_delivery: { tr: "yemek siparişi", en: "food delivery", ru: "доставка еды", th: "สั่งอาหาร", es: "delivery de comida", zh: "外卖" },
  snack: { tr: "atıştırmalık", en: "snacks", ru: "снеки", th: "ของว่าง", es: "snacks", zh: "零食" },
  dessert: { tr: "tatlı", en: "dessert", ru: "десерт", th: "ของหวาน", es: "postre", zh: "甜点" },
  bakery: { tr: "fırın", en: "bakery", ru: "пекарня", th: "ร้านเบเกอรี่", es: "panadería", zh: "面包店" },
  utilities: { tr: "faturalar", en: "utilities", ru: "коммунальные", th: "สาธารณูปโภค", es: "servicios", zh: "公用事业" },
  home: { tr: "ev", en: "home", ru: "дом", th: "บ้าน", es: "hogar", zh: "家居" },
  shopping: { tr: "alışveriş", en: "shopping", ru: "покупки", th: "ช้อปปิ้ง", es: "compras", zh: "购物" },
  uncategorized: { tr: "kategorisiz", en: "uncategorized", ru: "без категории", th: "ไม่มีหมวด", es: "sin categoría", zh: "未分类" },
};

/** The backend generally stores canonical product names in Turkish (ekmek, süt, yumurta...).
 *  Manual translation of the most common items so Turkish text doesn't leak into other locales. */
const PRODUCT_NAME_I18N: Record<string, SixLangDict> = {
  ekmek: { tr: "ekmek", en: "bread", ru: "хлеб", th: "ขนมปัง", es: "pan", zh: "面包" },
  süt: { tr: "süt", en: "milk", ru: "молоко", th: "นม", es: "leche", zh: "牛奶" },
  yumurta: { tr: "yumurta", en: "eggs", ru: "яйца", th: "ไข่", es: "huevos", zh: "鸡蛋" },
  su: { tr: "su", en: "water", ru: "вода", th: "น้ำ", es: "agua", zh: "水" },
  yoğurt: { tr: "yoğurt", en: "yoghurt", ru: "йогурт", th: "โยเกิร์ต", es: "yogur", zh: "酸奶" },
  peynir: { tr: "peynir", en: "cheese", ru: "сыр", th: "ชีส", es: "queso", zh: "奶酪" },
  şeker: { tr: "şeker", en: "sugar", ru: "сахар", th: "น้ำตาล", es: "azúcar", zh: "糖" },
  tuz: { tr: "tuz", en: "salt", ru: "соль", th: "เกลือ", es: "sal", zh: "盐" },
  un: { tr: "un", en: "flour", ru: "мука", th: "แป้ง", es: "harina", zh: "面粉" },
  yağ: { tr: "yağ", en: "oil", ru: "масло", th: "น้ำมัน", es: "aceite", zh: "油" },
  domates: { tr: "domates", en: "tomato", ru: "помидоры", th: "มะเขือเทศ", es: "tomate", zh: "番茄" },
  salatalık: { tr: "salatalık", en: "cucumber", ru: "огурцы", th: "แตงกวา", es: "pepino", zh: "黄瓜" },
  patates: { tr: "patates", en: "potato", ru: "картофель", th: "มันฝรั่ง", es: "patata", zh: "土豆" },
  soğan: { tr: "soğan", en: "onion", ru: "лук", th: "หัวหอม", es: "cebolla", zh: "洋葱" },
  elma: { tr: "elma", en: "apple", ru: "яблоки", th: "แอปเปิล", es: "manzana", zh: "苹果" },
  muz: { tr: "muz", en: "banana", ru: "бананы", th: "กล้วย", es: "plátano", zh: "香蕉" },
  çay: { tr: "çay", en: "tea", ru: "чай", th: "ชา", es: "té", zh: "茶" },
  kahve: { tr: "kahve", en: "coffee", ru: "кофе", th: "กาแฟ", es: "café", zh: "咖啡" },
  pirinç: { tr: "pirinç", en: "rice", ru: "рис", th: "ข้าว", es: "arroz", zh: "大米" },
  makarna: { tr: "makarna", en: "pasta", ru: "макароны", th: "พาสต้า", es: "pasta", zh: "意面" },
  tavuk: { tr: "tavuk", en: "chicken", ru: "курица", th: "ไก่", es: "pollo", zh: "鸡肉" },
  et: { tr: "et", en: "meat", ru: "мясо", th: "เนื้อ", es: "carne", zh: "肉" },
  balık: { tr: "balık", en: "fish", ru: "рыба", th: "ปลา", es: "pescado", zh: "鱼" },
};

function localizedCategory(raw: unknown, locale: string): string {
  const value = asString(raw);
  if (!value) {
    return tx(locale, { tr: "bu kategori", en: "this category", ru: "эта категория", th: "หมวดนี้", es: "esta categoría", zh: "此类别" });
  }
  const key = value.toLowerCase();
  const override = CATEGORY_I18N_OVERRIDE[key];
  if (override) return tx(locale, override);
  const lc = (["tr", "en", "ru", "th", "es", "zh"].includes(locale) ? locale : "en") as LocaleKey;
  const yumoLocale = lc as "tr" | "en" | "ru" | "th" | "es" | "zh";
  const text = categoryLabel(value, yumoLocale as never);
  return text.toLocaleLowerCase(NUMBER_LOCALE[lc]);
}

function localizedProductName(raw: unknown, locale: string): string | null {
  const value = asString(raw);
  if (!value) return null;
  const key = value.toLocaleLowerCase("tr-TR");
  const override = PRODUCT_NAME_I18N[key];
  if (override) return tx(locale, override);
  return value;
}

function formatPercent(value: number | null, locale: string, digits = 0): string {
  if (value === null) return "—";
  const lc = (["tr", "en", "ru", "th", "es", "zh"].includes(locale) ? locale : "en") as LocaleKey;
  const pct = value * 100;
  const sign = pct < 0 ? "-" : "";
  const abs = Math.abs(pct).toLocaleString(NUMBER_LOCALE[lc], {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
  // TR uses the % sign before the number, others after.
  return lc === "tr" ? `${sign}%${abs}` : `${sign}${abs}%`;
}

export function formatCurrencyValue(
  amount: number | null,
  currency: string | null,
  options?: { sign?: "abs" | "signed"; locale?: string }
): string {
  if (amount === null || !currency) return "—";
  const value = options?.sign === "abs" ? Math.abs(amount) : amount;
  const lc = (["tr", "en", "ru", "th", "es", "zh"].includes(options?.locale ?? "")
    ? options!.locale!
    : "en") as LocaleKey;
  try {
    return new Intl.NumberFormat(NUMBER_LOCALE[lc], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString(NUMBER_LOCALE[lc])} ${currency}`;
  }
}

export function formatImpact(amount: number | null, currency: string | null, locale?: string): string {
  return formatCurrencyValue(amount, currency, { sign: "abs", locale });
}

/** @deprecated TR-only; use getLocalizedRelativeDate(iso, locale) */
export function relativeDate(iso: string): string {
  return getLocalizedRelativeDate(iso, "tr");
}

function timesLabel(n: number, locale: string): string {
  return tx(locale, {
    tr: `${n} kez`,
    en: `${n}×`,
    ru: `${n} раз`,
    th: `${n} ครั้ง`,
    es: `${n} vec.`,
    zh: `${n} 次`,
  });
}

function daysLabel(n: number, locale: string): string {
  return tx(locale, {
    tr: `${n} gün`,
    en: `${n}d`,
    ru: `${n} дн.`,
    th: `${n} วัน`,
    es: `${n} d`,
    zh: `${n} 天`,
  });
}

/** The backend generates `event.title` / `event.summary` in Turkish, so for non-TR
 *  locales we prefer the local fallback to avoid Turkish text leaking through. */
function pickEventText(locale: string, eventText: string | null | undefined, fallbackDict: SixLangDict): string {
  if (locale === "tr" && typeof eventText === "string" && eventText.trim()) return eventText;
  return tx(locale, fallbackDict);
}

function pointsLabel(n: number, locale: string): string {
  const sign = n > 0 ? "+" : "";
  return tx(locale, {
    tr: `${sign}${n} puan`,
    en: `${sign}${n} pp`,
    ru: `${sign}${n} п.п.`,
    th: `${sign}${n} จุด`,
    es: `${sign}${n} pts`,
    zh: `${sign}${n} 点`,
  });
}

function fallbackNarrative(kind: InsightEventKind, locale: string): PatternNarrative {
  const meta = getLocalizedPatternMeta(kind, locale);
  return {
    eyebrow: meta.label,
    headline: tx(locale, {
      tr: `${meta.shortLabel} henüz netleşmedi`,
      en: `${meta.shortLabel} not clear yet`,
      ru: `${meta.shortLabel} пока не ясен`,
      th: `${meta.shortLabel} ยังไม่ชัดเจน`,
      es: `${meta.shortLabel} aún no está claro`,
      zh: `${meta.shortLabel} 尚不明朗`,
    }),
    read: meta.emptyHint,
    humanLayer: tx(locale, {
      tr: "Burada acele etmiyoruz. Birkaç fiş daha gelince sana yakıştırma yapmak yerine gerçekten tekrar eden davranışı göstereceğiz.",
      en: "We're not rushing here. Once a few more receipts arrive, we'll show you the genuinely repeating behavior — not a stereotype.",
      ru: "Не торопимся. Когда появится больше чеков, мы покажем не ярлыки, а реально повторяющееся поведение.",
      th: "เราไม่รีบ เมื่อมีใบเสร็จมากขึ้น เราจะแสดงพฤติกรรมที่เกิดซ้ำจริง ไม่ใช่การตัดสินล่วงหน้า",
      es: "No tenemos prisa. Cuando lleguen más recibos, te mostraremos el comportamiento que realmente se repite, no un cliché.",
      zh: "我们不急。等更多收据进来后，我们会向你展示真正重复出现的行为，而不是贴标签。",
    }),
    support: tx(locale, {
      tr: "Şimdilik tek iyi adım şu: normal alışverişini taramaya devam et. Sistem, kalıp güçlenmeden kesin konuşmasın.",
      en: "For now, the only good step is to keep scanning your usual receipts. Better to wait than to speak too soon.",
      ru: "Пока лучшее, что можно сделать, — продолжать сканировать обычные чеки. Не говорим уверенно, пока паттерн не окрепнет.",
      th: "ตอนนี้สิ่งที่ดีที่สุดคือสแกนใบเสร็จต่อไปตามปกติ ระบบจะไม่ฟันธงจนกว่ารูปแบบจะชัด",
      es: "Por ahora, el mejor paso es seguir escaneando tus recibos habituales. Mejor esperar que adelantarse.",
      zh: "目前最好的做法是继续扫描日常收据。模式还不稳固时，系统不会下结论。",
    }),
    primaryAction: tx(locale, {
      tr: "Fiş taramaya devam et",
      en: "Keep scanning receipts",
      ru: "Продолжай сканировать чеки",
      th: "สแกนใบเสร็จต่อไป",
      es: "Sigue escaneando recibos",
      zh: "继续扫描收据",
    }),
    secondaryAction: tx(locale, {
      tr: "Bu lensi açık tut",
      en: "Keep this lens open",
      ru: "Оставить этот объектив включённым",
      th: "เปิดเลนส์นี้ไว้",
      es: "Mantén esta lente activa",
      zh: "保持此视角开启",
    }),
    proof: [
      {
        label: tx(locale, { tr: "Durum", en: "Status", ru: "Статус", th: "สถานะ", es: "Estado", zh: "状态" }),
        value: tx(locale, { tr: "Veri bekliyor", en: "Awaiting data", ru: "Ждём данные", th: "รอข้อมูล", es: "Esperando datos", zh: "等待数据" }),
        tone: "muted",
      },
    ],
    confidenceLabel: tx(locale, { tr: "bekliyor", en: "awaiting", ru: "ожидает", th: "กำลังรอ", es: "esperando", zh: "等待中" }),
    suggestedExperiment: tx(locale, {
      tr: "Birkaç hafta daha normal harcama düzenini koru, sonra tekrar kontrol et.",
      en: "Keep your usual spending pattern for a few more weeks, then check again.",
      ru: "Сохрани обычный режим трат ещё на пару недель, потом загляни снова.",
      th: "รักษารูปแบบการใช้จ่ายปกติอีกสองสามสัปดาห์ แล้วกลับมาดูอีกครั้ง",
      es: "Mantén tu patrón habitual unas semanas más y vuelve a comprobarlo.",
      zh: "再保持几周日常消费节奏，之后再来查看。",
    }),
  };
}

function impulseNarrative(event: CachedInsightEventRecord, locale: string): PatternNarrative {
  const p = event.payload;
  const day = asNumber(p.dayOfWeek);
  const bucket = asString(p.hourBucket);
  const sampleSize = asNumber(p.sampleSize);
  const wantsShare = asNumber(p.wantsShare);
  const shareOfWallet = asNumber(p.shareOfWallet);
  const totalSpend = asNumber(p.totalSpend);
  const wantsSpend = asNumber(p.wantsSpend);
  const category = localizedCategory(p.topCategory, locale);
  const dayLabel = getDayLabel(day, locale);
  const bucketLabel = getBucketLabel(bucket, locale);

  const humanLayerByBucket: Record<string, SixLangDict> = {
    morning: {
      tr: "Bu tablo bir sabah rutinini söylüyor olabilir: düşünmeden alınan kahve, hızlı market, yola çıkmadan küçük tamamlamalar. Otomatik pilot gibi.",
      en: "This may be a morning routine: a coffee on autopilot, a quick grocery run, small fill-ins before heading out.",
      ru: "Возможно, это утренняя рутина: кофе на автопилоте, быстрый магазин, мелкие сборы перед выходом.",
      th: "อาจเป็นกิจวัตรช่วงเช้า เช่น กาแฟแบบอัตโนมัติ ซื้อของด่วน หรือเติมของเล็ก ๆ ก่อนออกจากบ้าน",
      es: "Puede ser una rutina de mañana: café en piloto automático, compra rápida, pequeños extras antes de salir.",
      zh: "这可能是一种晨间惯性：自动买的咖啡、快速采购、出门前的小补给。",
    },
    afternoon: {
      tr: "Gün ortasında nefes alma ihtiyacını gösteriyor olabilir. Toplantı arası, öğle molası, kendini toparlama anları burada birikmiş.",
      en: "It may show a midday need to breathe: meeting breaks, lunch, small resets between tasks.",
      ru: "Это может быть потребность выдохнуть посреди дня: перерывы между встречами, обед, маленькие паузы.",
      th: "อาจสะท้อนความต้องการพักหายใจช่วงกลางวัน เช่น พักจากประชุม มื้อเที่ยง ช่วงเรียกพลัง",
      es: "Puede reflejar la necesidad de respirar a media jornada: pausas entre reuniones, almuerzo, pequeños reseteos.",
      zh: "可能反映了午间想喘口气的需要：会议间隙、午休、整理状态的片刻。",
    },
    evening: {
      tr: "Bu “iraden zayıf” demiyor. Günün yorgun tarafında ödül ihtiyacı, stres kapatma ya da kendini rahatlatma devreye giriyor olabilir.",
      en: "This isn't about weak willpower. On the tired side of the day, the brain reaches for reward, stress relief, or comfort.",
      ru: "Дело не в слабой воле. К концу дня мозг тянется к награде, разгрузке или утешению.",
      th: "ไม่ใช่เพราะวินัยอ่อน — ในช่วงปลายวันที่เหนื่อย สมองมองหารางวัล การปลดล็อกความเครียด หรือความผ่อนคลาย",
      es: "No se trata de poca voluntad. En la parte cansada del día, el cerebro busca recompensa, descarga o consuelo.",
      zh: "这不是意志薄弱。在一天疲惫的时段，大脑会去找奖励、释压或安抚。",
    },
    night: {
      tr: "Geç saatlerin sessizliği bazen kararları yumuşatır. Burada görülen küçük alışverişler çoğu zaman duygusal kapanış arayışıdır.",
      en: "Late-night silence can soften decisions. Small purchases here are often a search for emotional closure.",
      ru: "Тишина поздней ночи смягчает решения. Маленькие покупки в это время часто — поиск эмоционального завершения.",
      th: "ความเงียบช่วงดึกทำให้การตัดสินใจอ่อนลง การซื้อเล็ก ๆ ในช่วงนี้มักเป็นการหาบทปิดทางอารมณ์",
      es: "El silencio nocturno suaviza las decisiones. Las pequeñas compras aquí suelen buscar un cierre emocional.",
      zh: "深夜的安静会软化判断。此时的小消费常是在寻一个情绪上的收尾。",
    },
  };
  const humanLayer = tx(
    locale,
    humanLayerByBucket[bucket ?? ""] ?? humanLayerByBucket.evening,
  );

  return {
    eyebrow: tx(locale, {
      tr: "Zaman + duygu",
      en: "Time + emotion",
      ru: "Время + эмоция",
      th: "เวลา + อารมณ์",
      es: "Tiempo + emoción",
      zh: "时间 + 情绪",
    }),
    headline: pickEventText(locale, event.title, {
      tr: `${dayLabel} ${bucketLabel}: dürtü penceresi`,
      en: `${dayLabel} ${bucketLabel}: impulse window`,
      ru: `${dayLabel}, ${bucketLabel}: окно импульса`,
      th: `${dayLabel} ${bucketLabel}: หน้าต่างแรงดล`,
      es: `${dayLabel} ${bucketLabel}: ventana de impulso`,
      zh: `${dayLabel}${bucketLabel}：冲动时段`,
    }),
    read: pickEventText(locale, event.summary, {
      tr: `${dayLabel} ${bucketLabel} alışverişlerin diğer zamanlara göre daha yoğun görünüyor.`,
      en: `Your ${dayLabel} ${bucketLabel} purchases look heavier than at other times.`,
      ru: `Покупки в ${dayLabel} ${bucketLabel} выглядят плотнее, чем в другое время.`,
      th: `การซื้อใน${dayLabel}${bucketLabel}ดูหนักกว่าช่วงอื่น`,
      es: `Tus compras del ${dayLabel} ${bucketLabel} se ven más intensas que en otros momentos.`,
      zh: `${dayLabel}${bucketLabel}的购买看起来比其他时段更集中。`,
    }),
    humanLayer,
    socialLayer: tx(locale, {
      tr: "Bu tür harcamalar çoğu zaman yalnızca ürün değil, günün ritmiyle ilgilidir: işe yetişmek, mola vermek, kendini toparlamak.",
      en: "This kind of spending is often about the rhythm of the day, not the product: catching up, taking breaks, recovering.",
      ru: "Такие траты чаще про ритм дня, а не про сам товар: успеть, передохнуть, прийти в себя.",
      th: "การใช้จ่ายแบบนี้มักเกี่ยวกับจังหวะของวันมากกว่าตัวสินค้า เช่น ตามให้ทัน พักสั้น ๆ รวบรวมตัวเอง",
      es: "Este tipo de gasto suele ser sobre el ritmo del día, no el producto: llegar a tiempo, descansar, reponerse.",
      zh: "这类消费往往与一天的节奏有关，而不是商品本身：赶时间、歇一下、缓口气。",
    }),
    support: tx(locale, {
      tr: "Bunu yasaklamak yerine geciktirmek daha işe yarar. Aynı saat geldiğinde kendine 10 dakika alan aç; karar hâlâ mantıklıysa al.",
      en: "Delaying works better than banning. When the hour comes, give yourself 10 minutes — if it still feels right, go ahead.",
      ru: "Лучше отсрочить, чем запретить. Когда наступает этот час, дай себе 10 минут — если решение всё ещё разумное, бери.",
      th: "การเลื่อนเวลาได้ผลกว่าการห้าม เมื่อถึงช่วงเวลานั้น ให้ตัวเอง 10 นาที — ถ้ายังสมเหตุสมผล ค่อยซื้อ",
      es: "Aplazar funciona mejor que prohibir. Cuando llegue esa hora, date 10 minutos; si aún tiene sentido, adelante.",
      zh: "推迟比禁止更有效。到了那个时间，给自己 10 分钟，如果仍然合理再下手。",
    }),
    primaryAction: tx(locale, {
      tr: "Bu saate küçük kural koy",
      en: "Set a small rule for this hour",
      ru: "Поставь правило на этот час",
      th: "ตั้งกติกาเล็ก ๆ ในช่วงเวลานี้",
      es: "Crea una regla para esta hora",
      zh: "为这个时段设个小规则",
    }),
    secondaryAction: tx(locale, {
      tr: "Bu saatteki fişleri göster",
      en: "Show receipts at this hour",
      ru: "Показать чеки за этот час",
      th: "แสดงใบเสร็จในช่วงเวลานี้",
      es: "Ver recibos de esta hora",
      zh: "查看该时段的收据",
    }),
    proof: [
      {
        label: tx(locale, { tr: "Fiş", en: "Receipts", ru: "Чеки", th: "ใบเสร็จ", es: "Recibos", zh: "收据" }),
        value: sampleSize !== null ? timesLabel(sampleSize, locale) : "—",
      },
      {
        label: tx(locale, { tr: "Cüzdandaki pay", en: "Wallet share", ru: "Доля в трате", th: "สัดส่วนกระเป๋า", es: "Cuota del gasto", zh: "钱包占比" }),
        value: formatPercent(shareOfWallet, locale),
      },
      {
        label: tx(locale, { tr: "Anlık alışveriş", en: "Impulse share", ru: "Импульсные", th: "ซื้อชั่ววูบ", es: "Cuota impulso", zh: "冲动占比" }),
        value: formatPercent(wantsShare, locale),
        tone: "warn",
      },
      {
        label: tx(locale, { tr: "En çok", en: "Top", ru: "Чаще всего", th: "มากสุด", es: "Más", zh: "最常" }),
        value: category,
      },
      {
        label: tx(locale, { tr: "Toplam", en: "Total", ru: "Всего", th: "รวม", es: "Total", zh: "总计" }),
        value: formatCurrencyValue(totalSpend, event.currency, { locale }),
      },
      {
        label: tx(locale, { tr: "Duygusal pay", en: "Emotional", ru: "Эмоц. часть", th: "ส่วนอารมณ์", es: "Parte emoc.", zh: "情绪部分" }),
        value: formatCurrencyValue(wantsSpend, event.currency, { locale }),
        tone: "warn",
      },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Bazı haftalık tekrarlar iş veya sosyal zorunluluk olabilir; hepsini kişisel ritüel olarak okumak hatalı olabilir.",
        en: "Some weekly repeats may be work or social obligations — not every one is a personal ritual.",
        ru: "Некоторые еженедельные повторения — это работа или соц. обязательства, а не личный ритуал.",
        th: "การทำซ้ำบางอย่างอาจมาจากงานหรือพันธะสังคม ไม่ใช่ทุกครั้งเป็นพิธีกรรมส่วนตัว",
        es: "Algunas repeticiones semanales son trabajo u obligaciones sociales — no todo es un ritual personal.",
        zh: "一些每周重复可能源自工作或社交义务，并非每次都是个人习惯。",
      }),
      tx(locale, {
        tr: "Mevsimsel değişiklikler (okul, tatil, sezon) bu ritmi değiştirebilir; veri sadece mevcut dönemi temsil ediyor olabilir.",
        en: "Seasonal changes (school, holidays) can shift this rhythm — the data may only reflect the current period.",
        ru: "Сезонные изменения (школа, праздники) могут менять ритм — данные могут отражать лишь текущий период.",
        th: "การเปลี่ยนแปลงตามฤดู (โรงเรียน วันหยุด) ทำให้จังหวะนี้เลื่อนได้ — ข้อมูลอาจสะท้อนเฉพาะช่วงปัจจุบัน",
        es: "Los cambios estacionales (escuela, vacaciones) pueden alterar el ritmo — los datos quizá solo reflejen el periodo actual.",
        zh: "季节性变化（开学、假期）会改变这个节奏，数据可能只反映当前阶段。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bir hafta boyunca bu alışkanlığı farklı bir gün veya saatte dene. Farkı hissediyor musun?",
      en: "For one week, try this habit at a different day or hour. Do you feel the difference?",
      ru: "Неделю попробуй это в другой день или час. Чувствуешь разницу?",
      th: "หนึ่งสัปดาห์ ลองทำสิ่งนี้ในวันหรือเวลาอื่น คุณรู้สึกถึงความต่างไหม?",
      es: "Durante una semana, prueba esto otro día u otra hora. ¿Notas la diferencia?",
      zh: "试着用一周，把这件事换到不同的天或时段。你能感受到不同吗？",
    }),
  };
}

function ownPriceNarrative(event: CachedInsightEventRecord, locale: string): PatternNarrative {
  const p = event.payload;
  const product =
    localizedProductName(p.canonicalName, locale) ??
    tx(locale, { tr: "Bu ürün", en: "This item", ru: "Этот товар", th: "สินค้านี้", es: "Este producto", zh: "此商品" });
  const baseline = asNumber(p.baselineUnitPrice);
  const latest = asNumber(p.latestUnitPrice);
  const delta = asNumber(p.deltaRatio);
  const sampleSize = asNumber(p.sampleSize);
  const spanDays = asNumber(p.spanDays);
  const direction = asString(p.direction);
  const increased = direction !== "down";

  // ─── Outlier detection: a product price deviating more than 5x from its own
  // history is almost always an OCR error, a package-size difference, or a
  // wrong canonical-name match. Real price movements typically fall in the
  // 20-50% (1.2x-1.5x) band. So we route to the "data check" branch — telling
  // the user to verify the receipt instead of raising a panic price alert.
  const ratio = baseline !== null && latest !== null && baseline > 0 ? latest / baseline : null;
  const dataLikelyError = ratio !== null && (ratio > 5 || ratio < 0.2);
  const suspiciousJump = !dataLikelyError && delta !== null && Math.abs(delta) > 0.5;

  if (dataLikelyError) {
    return {
      eyebrow: tx(locale, {
        tr: "Veri kontrol\u00fc",
        en: "Data check",
        ru: "Проверка данных",
        th: "ตรวจสอบข้อมูล",
        es: "Revisi\u00f3n de datos",
        zh: "数据核验",
      }),
      headline: tx(locale, {
        tr: `${product} kayd\u0131n\u0131 birlikte kontrol edelim`,
        en: `Let's verify the ${product} record`,
        ru: `Давай проверим запись по ${product}`,
        th: `มาตรวจสอบรายการของ ${product} กันก่อน`,
        es: `Revisemos juntos el registro de ${product}`,
        zh: `让我们一起核对 ${product} 这条记录`,
      }),
      read: tx(locale, {
        tr: "Bu kay\u0131tta fiyat, kendi ge\u00e7mi\u015fine g\u00f6re \u00e7ok ekstrem g\u00f6r\u00fcn\u00fcyor. B\u00fcy\u00fck olas\u0131l\u0131kla bir OCR, gramaj veya \u00fcr\u00fcn e\u015fle\u015fmesi sorunu var. Bu noktada \"zam\" demek dogru olmaz.",
        en: "The price here looks extreme compared to its own history. Most likely it's an OCR error, a packaging change, or a product mismatch — not a real price hike.",
        ru: "Цена здесь выглядит экстремально по сравнению с её историей. Скорее всего, это ошибка OCR, смена фасовки или неверное сопоставление, а не настоящий скачок.",
        th: "ราคาในรายการนี้ดูสุดโต่งเมื่อเทียบกับประวัติของมัน อาจเกิดจาก OCR ผิด การเปลี่ยนแพ็ก หรือการจับคู่สินค้าผิด ยังเร็วเกินไปที่จะบอกว่าขึ้นราคา",
        es: "El precio aqu\u00ed luce extremo frente a su propio historial. Lo m\u00e1s probable: error de OCR, cambio de envase o un emparejamiento equivocado — no una subida real.",
        zh: "这一条的价格相对自身历史显得极端。更可能是 OCR、包装变化或商品匹配出错，而不是真正的涨价。",
      }),
      humanLayer: tx(locale, {
        tr: "Burada do\u011fru olan, hemen sonu\u00e7 \u00e7\u0131karmamak. Sistem kalpsiz say\u0131lara baksa da, biz \u00f6nce verinin temiz olup olmad\u0131\u011f\u0131na bakar\u0131z.",
        en: "The right move here is to not jump to conclusions. Numbers can lie when the input is noisy — we trust the receipt, not the alert.",
        ru: "Правильно — не делать поспешных выводов. Цифры могут обманывать, если данные грязные. Сначала проверим чек.",
        th: "ทางที่ถูกคือไม่รีบสรุป ข้อมูลที่มีสัญญาณรบกวนทำให้ตัวเลขหลอกเราได้ ตรวจใบเสร็จก่อน",
        es: "Lo correcto es no apresurarse. Los números pueden mentir si la entrada es ruidosa — primero confiamos en el recibo.",
        zh: "正确的做法是先别下结论。当输入有噪声时，数字会骗人；先核对收据。",
      }),
      socialLayer: tx(locale, {
        tr: "Fiyat verisi g\u00fcvenilir olmadan yap\u0131lan yorum, kullan\u0131c\u0131ya yard\u0131m de\u011fil g\u00fcr\u00fclt\u00fc \u00fcretir. Onun i\u00e7in burada al\u0131lan en iyi karar: \"henz konu\u015f-mayal\u0131m\".",
        en: "Commenting on unreliable data creates noise, not help. The best move here is silence until the data is verified.",
        ru: "Комментировать ненадёжные данные — значит создавать шум, а не помогать. Лучший шаг — пауза до проверки.",
        th: "การวิเคราะห์ข้อมูลที่ไม่น่าเชื่อถือสร้างเสียงรบกวนแทนที่จะช่วย ทางที่ดีคือรอจนกว่าข้อมูลจะถูกยืนยัน",
        es: "Comentar datos poco fiables genera ruido, no ayuda. Lo mejor es esperar a verificar.",
        zh: "对不可靠的数据妄下结论只会制造噪音，而不是帮助。最好等数据被核实后再说。",
      }),
      support: tx(locale, {
        tr: "Bu kayd\u0131 a\u00e7 ve \u00fcr\u00fcn ad\u0131n\u0131, gramaj\u0131n\u0131 ve fiyat\u0131n\u0131 fi\u015ften kontrol et. E\u011fer ger\u00e7ekten do\u011fru, bu sinyali tekrar tetikleyebiliriz.",
        en: "Open the receipt and verify the product name, weight, and price. If the data is genuine, we can re-trigger this signal.",
        ru: "Откройте чек и проверьте название, фасовку и цену. Если данные верны, мы запустим сигнал заново.",
        th: "เปิดใบเสร็จและตรวจชื่อสินค้า น้ำหนัก และราคา ถ้าถูกต้องจริง เราจะส่งสัญญาณนี้อีกครั้ง",
        es: "Abre el recibo y verifica nombre, peso y precio. Si los datos son reales, podemos volver a emitir esta señal.",
        zh: "打开收据，核对商品名称、规格与价格。若数据属实，我们会再次触发此信号。",
      }),
      primaryAction: tx(locale, {
        tr: "Fi\u015fi a\u00e7 ve do\u011frula",
        en: "Open & verify receipt",
        ru: "Открыть и проверить чек",
        th: "เปิดและตรวจใบเสร็จ",
        es: "Abrir y verificar recibo",
        zh: "打开并核对收据",
      }),
      secondaryAction: tx(locale, {
        tr: "\u00dcr\u00fcn ge\u00e7mi\u015fini a\u00e7",
        en: "Open product history",
        ru: "Показать историю товара",
        th: "เปิดประวัติสินค้า",
        es: "Ver historial del producto",
        zh: "查看商品历史",
      }),
      proof: [
        { label: tx(locale, { tr: "\u00dcr\u00fcn", en: "Product", ru: "Товар", th: "สินค้า", es: "Producto", zh: "商品" }), value: product },
        {
          label: tx(locale, { tr: "Eski medyan", en: "Old median", ru: "Старая медиана", th: "มัธยฐานเดิม", es: "Mediana ant.", zh: "旧中位数" }),
          value: formatCurrencyValue(baseline, event.currency, { locale }),
        },
        {
          label: tx(locale, { tr: "Son fiyat", en: "Latest", ru: "Последняя", th: "ราคาล่าสุด", es: "Precio actual", zh: "最新价" }),
          value: formatCurrencyValue(latest, event.currency, { locale }),
          tone: "muted",
        },
        {
          label: tx(locale, { tr: "Fark", en: "Diff", ru: "Разница", th: "ผลต่าง", es: "Dif.", zh: "差异" }),
          value: tx(locale, {
            tr: "kontrol gerekli",
            en: "needs check",
            ru: "нужна проверка",
            th: "ต้องตรวจ",
            es: "revisar",
            zh: "待核对",
          }),
          tone: "muted",
        },
        {
          label: tx(locale, { tr: "Al\u0131m say\u0131s\u0131", en: "Buys", ru: "Покупок", th: "จำนวนซื้อ", es: "Compras", zh: "购买" }),
          value: sampleSize !== null ? timesLabel(sampleSize, locale) : "—",
        },
      ],
      confidenceLabel: tx(locale, {
        tr: "veri kontrolü",
        en: "data check",
        ru: "проверка",
        th: "ตรวจข้อมูล",
        es: "revisión",
        zh: "数据核验",
      }),
      counterEvidence: [
        tx(locale, {
          tr: "OCR sistemi bazen \u00fcr\u00fcn ad\u0131 veya gramaj\u0131 yanl\u0131\u015f okuyabilir; ekstrem fark\u0131n bir nedeni budur.",
          en: "OCR can sometimes misread the product name or weight — this can cause extreme differences.",
          ru: "OCR иногда неверно распознаёт название или фасовку — отсюда экстремальная разница.",
          th: "OCR อาจอ่านชื่อสินค้าหรือน้ำหนักผิด ทำให้เกิดความต่างที่สุดโต่ง",
          es: "El OCR a veces lee mal el nombre o el peso — eso puede causar diferencias extremas.",
          zh: "OCR 可能会误读商品名或规格，这会造成极端差异。",
        }),
        tx(locale, {
          tr: "Ayn\u0131 kanonik isimle farkl\u0131 paket boyutlar\u0131 e\u015fle\u015fmi\u015f olabilir (50g vs 1kg gibi).",
          en: "Different package sizes may be matched under one canonical name (e.g. 50g vs 1kg).",
          ru: "Под одним каноническим именем могут оказаться разные размеры упаковки (например, 50 г и 1 кг).",
          th: "ขนาดแพ็กที่ต่างกันอาจถูกจับคู่ภายใต้ชื่อเดียวกัน (เช่น 50 ก. กับ 1 กก.)",
          es: "Pueden agruparse tama\u00f1os distintos bajo el mismo nombre can\u00f3nico (50 g vs 1 kg).",
          zh: "不同规格可能被合并到同一个名称下（例如 50g 与 1kg）。",
        }),
      ],
      suggestedExperiment: tx(locale, {
        tr: "Bu \u00fcr\u00fcn\u00fc bir sonraki taramada \u00fcr\u00fcn ad\u0131n\u0131, gramaj\u0131n\u0131 ve markas\u0131n\u0131 kontrol ederek tara. Fiyat ger\u00e7ekten oynad\u0131 m\u0131, beraber g\u00f6relim.",
        en: "Next time you scan it, verify the product name, weight, and brand. We'll see together if the price actually moved.",
        ru: "В следующий раз отсканируй с проверкой названия, веса и бренда. Посмотрим вместе, действительно ли цена изменилась.",
        th: "ครั้งหน้าเมื่อสแกน ให้ตรวจชื่อ น้ำหนัก และยี่ห้อ เราจะเช็กไปด้วยกันว่าราคาขยับจริงไหม",
        es: "La pr\u00f3xima vez que lo escanees, verifica nombre, peso y marca. Veremos juntos si el precio cambi\u00f3 de verdad.",
        zh: "下次扫描时，核对名称、规格和品牌。我们一起看看价格是否真的变了。",
      }),
    };
  }

  const headline = pickEventText(locale, event.title, suspiciousJump
    ? {
        tr: `${product} fiyatında olası sapma var`,
        en: `Possible deviation in ${product} price`,
        ru: `Возможное отклонение цены на ${product}`,
        th: `ราคา ${product} อาจเบี่ยงเบน`,
        es: `Posible desvío en el precio de ${product}`,
        zh: `${product} 价格可能有偏差`,
      }
    : {
        tr: `${product} için fiyat hareketi`,
        en: `Price movement on ${product}`,
        ru: `Движение цены на ${product}`,
        th: `ราคาของ ${product} เคลื่อนไหว`,
        es: `Movimiento de precio en ${product}`,
        zh: `${product} 价格变动`,
      });
  const read = pickEventText(locale, event.summary, suspiciousJump
    ? {
        tr: "Son kayıtta fiyat, kendi geçmişine göre sert ayrışıyor. Bu gerçek bir hareket de olabilir, paket/gramaj farkı da. Körlemesine yorumlamayalım.",
        en: "The latest price diverges sharply from this product's own history. It could be a real move — or a packaging/weight difference. Let's not jump to conclusions.",
        ru: "Последняя цена резко отличается от собственной истории товара. Это может быть реальный рост или разница в фасовке. Не торопимся.",
        th: "ราคาล่าสุดต่างจากประวัติของสินค้านี้อย่างชัดเจน อาจเป็นการขยับจริง หรือเป็นเรื่องของแพ็ก/น้ำหนัก อย่าเพิ่งสรุป",
        es: "El precio más reciente diverge bastante del historial del producto. Puede ser real o una diferencia de envase/peso. No saquemos conclusiones.",
        zh: "最新价格与该商品自身历史明显偏离。可能是真实变动，也可能是包装/规格差异。先别下结论。",
      }
    : {
        tr: `${product} için son fiyat, kendi geçmiş fiyatına göre değişmiş görünüyor.`,
        en: `The latest price for ${product} appears to differ from its own history.`,
        ru: `Последняя цена на ${product} отличается от прежней истории.`,
        th: `ราคาล่าสุดของ ${product} ดูเปลี่ยนไปจากประวัติของมัน`,
        es: `El último precio de ${product} parece diferente a su historial.`,
        zh: `${product} 的最新价格似乎与其自身历史不同。`,
      });

  return {
    eyebrow: tx(locale, {
      tr: "Fiyat hafızası",
      en: "Price memory",
      ru: "Память цены",
      th: "ความจำราคา",
      es: "Memoria de precio",
      zh: "价格记忆",
    }),
    headline,
    read,
    humanLayer: tx(locale, {
      tr: increased
        ? "Burada mesele pahalı ürün almak değil. Fiyatlar hızlı oynadığında beyin eski etikete tutunur; bütçe de çoğu zaman o eski fiyata göre kurulur."
        : "Bu düşüş iyi haber. Önemli olan sadece ucuzlaması değil; bu ürün sende tekrar ettiği için küçük farkların ay sonunda görünür hale gelmesi.",
      en: increased
        ? "This isn't about buying expensive items. When prices move fast, the brain holds onto the old label — and budgets often follow that old price."
        : "This drop is good news. What matters isn't just the cheaper price; because you buy this often, small differences add up by month-end.",
      ru: increased
        ? "Дело не в дорогих покупках. Когда цены прыгают, мозг держится за старую цифру — и бюджет тоже опирается на неё."
        : "Снижение — хорошая новость. Важно не только то, что дешевле; этот товар у тебя повторяется, и маленькая разница даёт эффект к концу месяца.",
      th: increased
        ? "ไม่ใช่เรื่องของการซื้อของแพง เมื่อราคาขยับเร็ว สมองยึดติดกับป้ายเดิม และงบประมาณก็มักอิงราคานั้น"
        : "การลดลงเป็นข่าวดี ไม่ใช่แค่ถูกลง แต่เพราะคุณซื้อสินค้านี้บ่อย ความต่างเล็ก ๆ จะรวมเป็นเรื่องใหญ่เมื่อสิ้นเดือน",
      es: increased
        ? "No se trata de comprar caro. Cuando los precios se mueven r\u00e1pido, el cerebro se aferra al precio viejo — y el presupuesto suele anclarse ah\u00ed."
        : "Esta bajada es buena noticia. No solo importa el precio menor; como compras este art\u00edculo seguido, las peque\u00f1as diferencias suman a fin de mes.",
      zh: increased
        ? "这不是说买了贵东西。价格波动时大脑会抓住旧标签，预算也常按旧价来排。"
        : "下降是好消息。关键不只是便宜了；因为你经常买它，小差异会在月末累积起来。",
    }),
    socialLayer: tx(locale, {
      tr: "Günlük fiyat hissi çok çabuk eskir. Aynı ürünü aynı sanıp aslında farklı bir ekonomik dönemin fiyatıyla alıyor olabilirsin.",
      en: "A sense of price ages quickly. You might think you're paying the same — while actually buying at a very different economic moment.",
      ru: "Ощущение цены быстро устаревает. Кажется, платишь как раньше — а на деле берёшь по цене совсем другого момента.",
      th: "ความรู้สึกต่อราคาเก่าเร็วมาก คุณอาจคิดว่าจ่ายเท่าเดิม ทั้งที่จริง ๆ ซื้อในราคาของเศรษฐกิจอีกแบบ",
      es: "La sensación de precio envejece rápido. Puede que creas pagar igual — mientras compras en otro momento económico distinto.",
      zh: "对价格的直觉过时得很快。你可能觉得花得一样，其实是在完全不同的经济时段下手。",
    }),
    support: tx(locale, {
      tr: increased
        ? "Bu ürünü suçlu ilan etmeye gerek yok. Sadece bir fiyat alarmı kur; artış devam ederse seni dürtelim."
        : "Ucuzlayan ürünü not etmek de değerli. Stoklamak mı, normal akışta kalmak mı — birlikte takip edebiliriz.",
      en: increased
        ? "No need to blame this item. Just set a price alert — if the rise continues, we'll nudge you."
        : "Note the cheaper item — we can decide together whether to stock up or stay with the normal flow.",
      ru: increased
        ? "Не нужно винить товар. Поставь оповещение — если рост продолжится, мы напомним."
        : "Стоит отметить подешевевший товар — вместе решим: запасаться или идти как обычно.",
      th: increased
        ? "ไม่ต้องโทษสินค้านี้ แค่ตั้งเตือนราคา — ถ้าขึ้นต่อ เราจะสะกิด"
        : "การจดสินค้าที่ถูกลงก็มีค่า เราจะตัดสินใจร่วมกันว่าจะตุนหรือไปตามปกติ",
      es: increased
        ? "No hay que culpar al producto. Pon una alerta de precio — si la subida sigue, te avisamos."
        : "Apuntar el producto m\u00e1s barato tambi\u00e9n vale. Decidimos juntos si abastecerse o seguir igual.",
      zh: increased
        ? "不用怪这个商品。设个价格提醒——如果继续涨，我们会提醒你。"
        : "记下变便宜的商品也有价值。要不要囤货还是按平时来，我们一起判断。",
    }),
    primaryAction: tx(locale, {
      tr: increased ? "Fiyat alarmı kur" : "Bu düşüşü izle",
      en: increased ? "Set a price alert" : "Watch this drop",
      ru: increased ? "Настроить алерт" : "Следить за снижением",
      th: increased ? "ตั้งเตือนราคา" : "ติดตามการลดลง",
      es: increased ? "Crear alerta" : "Seguir esta bajada",
      zh: increased ? "设置价格提醒" : "关注此下跌",
    }),
    secondaryAction: tx(locale, {
      tr: "Ürün geçmişini aç",
      en: "Open product history",
      ru: "Открыть историю товара",
      th: "เปิดประวัติสินค้า",
      es: "Abrir historial",
      zh: "查看商品历史",
    }),
    proof: [
      { label: tx(locale, { tr: "Ürün", en: "Product", ru: "Товар", th: "สินค้า", es: "Producto", zh: "商品" }), value: product },
      {
        label: tx(locale, { tr: "Eski medyan", en: "Old median", ru: "Старая медиана", th: "มัธยฐานเดิม", es: "Mediana ant.", zh: "旧中位数" }),
        value: formatCurrencyValue(baseline, event.currency, { locale }),
      },
      {
        label: tx(locale, { tr: "Son fiyat", en: "Latest", ru: "Последняя", th: "ราคาล่าสุด", es: "Actual", zh: "最新" }),
        value: formatCurrencyValue(latest, event.currency, { locale }),
        tone: increased ? "warn" : "good",
      },
      {
        label: tx(locale, { tr: "Fark", en: "Diff", ru: "Разница", th: "ผลต่าง", es: "Dif.", zh: "差异" }),
        value: formatPercent(delta, locale, 0),
        tone: increased ? "warn" : "good",
      },
      {
        label: tx(locale, { tr: "Alım sayısı", en: "Buys", ru: "Покупок", th: "จำนวนซื้อ", es: "Compras", zh: "购买" }),
        value: sampleSize !== null ? timesLabel(sampleSize, locale) : "—",
      },
      {
        label: tx(locale, { tr: "Dönem", en: "Period", ru: "Период", th: "ช่วงเวลา", es: "Periodo", zh: "周期" }),
        value: spanDays !== null ? daysLabel(spanDays, locale) : "—",
      },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Fiyat değişimi gerçekten ürünün kendisinden kaynaklanmayabilir; paket, gramaj veya farklı bir marka olabilir.",
        en: "The change may not come from the product itself — different package, weight, or brand are possible reasons.",
        ru: "Изменение цены может быть не из-за самого товара — другая упаковка, вес или бренд.",
        th: "ความต่างของราคาอาจไม่ใช่ตัวสินค้าเอง อาจเป็นแพ็ก น้ำหนัก หรือยี่ห้อต่างกัน",
        es: "El cambio puede no venir del producto en s\u00ed — distinto envase, peso o marca son posibles.",
        zh: "价格变化也许不是商品本身——可能是包装、规格或品牌不同。",
      }),
      tx(locale, {
        tr: "Kısa dönemli promosyon veya indirim dönemleri normal fiyat dalgalanması gibi görünebilir.",
        en: "Short-term promos or discount periods can look like normal price volatility.",
        ru: "Краткие акции или скидки иногда выглядят как обычные колебания.",
        th: "โปรโมชันสั้น ๆ อาจดูเหมือนความผันผวนของราคาทั่วไป",
        es: "Promos cortas o descuentos pueden parecer simple volatilidad.",
        zh: "短期促销或折扣可能看起来像正常的价格波动。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bir sonraki alışverişinde aynı ürünü farklı bir marka veya paket boyutuyla dene. Fiyat-performans karşılaştırması yap.",
      en: "Next time, try the same item in a different brand or pack size. Compare value for price.",
      ru: "В следующий раз возьми тот же товар другой марки или фасовки. Сравни цену-качество.",
      th: "ครั้งถัดไป ลองยี่ห้อหรือขนาดแพ็กอื่น แล้วเปรียบเทียบความคุ้ม",
      es: "La pr\u00f3xima vez, prueba con otra marca o tama\u00f1o. Compara valor-precio.",
      zh: "下次试试不同品牌或不同规格，做个性价比对比。",
    }),
  };
}

function categoryDriftNarrative(event: CachedInsightEventRecord, locale: string): PatternNarrative {
  const p = event.payload;
  const category = localizedCategory(p.category, locale);
  const recentShare = asNumber(p.recentShare);
  const baselineShare = asNumber(p.baselineShare);
  const delta = asNumber(p.deltaPp);
  const direction = asString(p.direction);
  const recentAmount = asNumber(p.recentAmount);
  const baselineAmount = asNumber(p.baselineAmount);
  const increasing = direction !== "down";
  const rawCategory = (asString(p.category) ?? "").toLowerCase();
  const isCareCategory = ["pharmacy", "health", "healthcare", "beauty"].includes(rawCategory);

  return {
    eyebrow: tx(locale, {
      tr: "Hayat düzeni",
      en: "Life rhythm",
      ru: "Образ жизни",
      th: "จังหวะชีวิต",
      es: "Ritmo de vida",
      zh: "生活节奏",
    }),
    headline: pickEventText(locale, event.title, increasing ? {
      tr: `${category} payı artıyor`,
      en: `${category} share is rising`,
      ru: `Доля «${category}» растёт`,
      th: `สัดส่วน ${category} เพิ่มขึ้น`,
      es: `La cuota de ${category} sube`,
      zh: `${category} 占比上升`,
    } : {
      tr: `${category} payı azalıyor`,
      en: `${category} share is falling`,
      ru: `Доля «${category}» снижается`,
      th: `สัดส่วน ${category} ลดลง`,
      es: `La cuota de ${category} baja`,
      zh: `${category} 占比下降`,
    }),
    read: pickEventText(locale, event.summary, {
      tr: `${category} harcamalarının cüzdanındaki payı son dönemde değişmiş görünüyor.`,
      en: `The share of ${category} in your wallet seems to have shifted recently.`,
      ru: `Доля категории «${category}» в твоих тратах в последнее время сдвинулась.`,
      th: `สัดส่วนค่าใช้จ่าย ${category} ในกระเป๋าของคุณดูเปลี่ยนไปในช่วงนี้`,
      es: `La cuota de ${category} en tu cartera parece haber cambiado.`,
      zh: `${category} 在你钱包中的占比最近似乎有变化。`,
    }),
    humanLayer: increasing
      ? tx(locale, {
          tr: isCareCategory
            ? `${category} sadece bir kategori değil; son günlerde bakım, sağlık ya da iyi hissetme ihtiyacının cüzdanda daha görünür hale geldiğini söylüyor olabilir.`
            : `${category} sadece bir kategori değil; son günlerde zamanının, enerjinin veya sosyal hayatının nereye kaydığını gösteriyor olabilir.`,
          en: isCareCategory
            ? `${category} isn't just a category — it may be saying that care, health, or feeling-good has become more visible in your wallet.`
            : `${category} isn't just a category — it may show where your time, energy, or social life is shifting.`,
          ru: isCareCategory
            ? `«${category}» — не просто категория; возможно, забота о себе, здоровье или самочувствие стали заметнее в кошельке.`
            : `«${category}» — не просто категория; она может показывать, куда смещается твоё время, энергия или социальная жизнь.`,
          th: isCareCategory
            ? `${category} ไม่ใช่แค่หมวดเดียว — มันอาจกำลังบอกว่าการดูแลตัวเอง สุขภาพ หรือความสบายใจกำลังชัดขึ้นในกระเป๋าคุณ`
            : `${category} ไม่ใช่แค่หมวด — อาจสะท้อนว่าตอนนี้เวลา พลัง หรือชีวิตทางสังคมของคุณกำลังเลื่อนไปทางไหน`,
          es: isCareCategory
            ? `${category} no es solo una categor\u00eda — puede estar diciendo que el cuidado, la salud o sentirse bien se han vuelto m\u00e1s visibles en tu cartera.`
            : `${category} no es solo una categor\u00eda — puede mostrar hacia d\u00f3nde se desplazan tu tiempo, energ\u00eda o vida social.`,
          zh: isCareCategory
            ? `${category} 不只是一个分类——它可能在说，最近"自我照顾、健康或良好感受"在钱包里变得更显眼。`
            : `${category} 不只是分类——它可能反映出你的时间、精力或社交生活的方向变化。`,
        })
      : tx(locale, {
          tr: `${category} tarafındaki azalma bazen iyi bir kontrol, bazen de ertelediğin bir ihtiyaç olabilir. Sayı tek başına karar vermesin.`,
          en: `The drop in ${category} can be healthy control — or a deferred need. Don't let the number decide alone.`,
          ru: `Снижение по «${category}» — это либо здоровый контроль, либо отложенная нужда. Цифра одна не решает.`,
          th: `การลดลงของ ${category} อาจเป็นการควบคุมที่ดี หรือเป็นความต้องการที่ถูกเลื่อน อย่าให้ตัวเลขตัดสินคนเดียว`,
          es: `La bajada en ${category} puede ser control sano — o una necesidad postergada. No dejes que el n\u00famero decida solo.`,
          zh: `${category} 的下降可能是健康的克制——也可能是被推迟的需求。别让数字独自决定。`,
        }),
    socialLayer: tx(locale, {
      tr: "Harcama kategorileri çoğu zaman hayat düzeninin gölgesidir: eve kapanmak, dışarıda kalmak, işe gidip gelmek, bakım, arkadaş çevresi.",
      en: "Spending categories are often shadows of how you live: staying in, going out, commuting, self-care, friend circles.",
      ru: "Категории трат — тень того, как ты живёшь: дома, в людях, в дороге, в заботе о себе, с друзьями.",
      th: "หมวดค่าใช้จ่ายมักเป็นเงาของไลฟ์สไตล์ เช่น อยู่บ้าน ออกข้างนอก เดินทาง ดูแลตัวเอง วงเพื่อน",
      es: "Las categor\u00edas de gasto suelen ser sombras de tu vida: quedarte en casa, salir, viajar al trabajo, cuidarte, amistades.",
      zh: "消费类别往往是你生活方式的影子：宅家、外出、通勤、自我照顾、朋友圈。",
    }),
    support: increasing
      ? tx(locale, {
          tr: "Kendine kızmadan bir üst sınır dene. Ama önce bu artışın gerçek ihtiyaç mı, alışkanlık mı olduğunu ayıralım.",
          en: "Try a soft cap without blaming yourself. But first, sort out: is this growth a real need, or a habit?",
          ru: "Поставь мягкий лимит без самобичевания. Но сначала разберись: реальная нужда или привычка?",
          th: "ลองตั้งเพดานเบา ๆ โดยไม่โทษตัวเอง แต่ก่อนอื่น แยกก่อนว่าเป็นความต้องการจริงหรือเพียงนิสัย",
          es: "Prueba un l\u00edmite suave sin culparte. Pero antes, separa: \u00bfes una necesidad real o un h\u00e1bito?",
          zh: "试着设个温和上限，但先别自责。先分辨：这是真实需要，还是习惯？",
        })
      : tx(locale, {
          tr: "Azalan kategoriyi kutlamadan önce şunu soralım: gerçekten rahatladın mı, yoksa sadece erteledin mi?",
          en: "Before celebrating a drop, ask: did you actually feel relief, or only postpone the need?",
          ru: "Прежде чем праздновать снижение, спроси себя: тебе реально стало легче, или ты просто отложил?",
          th: "ก่อนจะดีใจกับการลดลง ลองถามตัวเองว่า โล่งจริง หรือแค่เลื่อนความต้องการออกไป?",
          es: "Antes de celebrar la bajada: \u00bfsentiste alivio de verdad, o solo postergaste?",
          zh: "在为下降高兴之前，问问自己：是真的轻松了，还是只是推迟了需要？",
        }),
    primaryAction: tx(locale, {
      tr: increasing ? "Bu kategoriye yumuşak limit koy" : "Bu düşüşü takip et",
      en: increasing ? "Set a soft limit here" : "Track this drop",
      ru: increasing ? "Поставь мягкий лимит" : "Следи за снижением",
      th: increasing ? "ตั้งเพดานเบา ๆ ในหมวดนี้" : "ติดตามการลดลง",
      es: increasing ? "Pon un l\u00edmite suave" : "Sigue esta bajada",
      zh: increasing ? "为该类设个温和上限" : "跟踪此下降",
    }),
    secondaryAction: tx(locale, {
      tr: "Kategori fişlerini aç",
      en: "Open category receipts",
      ru: "Открыть чеки категории",
      th: "เปิดใบเสร็จในหมวดนี้",
      es: "Ver recibos de la categor\u00eda",
      zh: "查看该类收据",
    }),
    proof: [
      { label: tx(locale, { tr: "Kategori", en: "Category", ru: "Категория", th: "หมวด", es: "Categor\u00eda", zh: "类别" }), value: category },
      {
        label: tx(locale, { tr: "Önceki pay", en: "Previous", ru: "Раньше", th: "สัดส่วนก่อน", es: "Anterior", zh: "之前占比" }),
        value: formatPercent(baselineShare, locale),
      },
      {
        label: tx(locale, { tr: "Son pay", en: "Latest", ru: "Сейчас", th: "ล่าสุด", es: "Reciente", zh: "近期占比" }),
        value: formatPercent(recentShare, locale),
        tone: increasing ? "warn" : "good",
      },
      {
        label: tx(locale, { tr: "Değişim", en: "Change", ru: "Изм.", th: "เปลี่ยนแปลง", es: "Cambio", zh: "变化" }),
        value: delta !== null ? pointsLabel(Math.round(delta * 100), locale) : "—",
      },
      {
        label: tx(locale, { tr: "Önceki tutar", en: "Prev. amount", ru: "Раньше", th: "ยอดก่อน", es: "Importe ant.", zh: "之前金额" }),
        value: formatCurrencyValue(baselineAmount, event.currency, { locale }),
      },
      {
        label: tx(locale, { tr: "Son tutar", en: "Latest amt.", ru: "Последняя", th: "ยอดล่าสุด", es: "Importe act.", zh: "近期金额" }),
        value: formatCurrencyValue(recentAmount, event.currency, { locale }),
      },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Kategori değişimi her zaman davranış değişimi anlamına gelmez; tek seferlik büyük bir alışveriş veya hediye alımı olabilir.",
        en: "A category shift isn't always behavior change — it can be a one-off large purchase or a gift.",
        ru: "Сдвиг категории — не всегда смена поведения; может быть разовая большая покупка или подарок.",
        th: "การเปลี่ยนหมวดไม่ได้แปลว่าพฤติกรรมเปลี่ยนเสมอไป อาจเป็นการซื้อใหญ่ครั้งเดียวหรือของขวัญ",
        es: "Un cambio de categor\u00eda no siempre es cambio de comportamiento — puede ser una compra grande puntual o un regalo.",
        zh: "类别变化不一定是行为改变，可能是一次性的大额购买或送礼。",
      }),
      tx(locale, {
        tr: "Mevsimsel faktörler (bayram, tatil, okul dönemi) kategori harcamalarını geçici olarak değiştirebilir.",
        en: "Seasonal factors (holidays, school terms) can temporarily move category spending.",
        ru: "Сезонные факторы (праздники, школа) могут временно сдвигать категорийные траты.",
        th: "ปัจจัยตามฤดู (เทศกาล วันหยุด เปิดเทอม) อาจเปลี่ยนค่าใช้จ่ายในหมวดชั่วคราว",
        es: "Factores estacionales (fiestas, cursos) pueden mover el gasto por categor\u00eda temporalmente.",
        zh: "季节性因素（节日、开学）可能会暂时改变类别消费。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bir hafta boyunca bu kategorideki harcamalarını not al. Hangileri gerçek ihtiyaç, hangileri alışkanlık?",
      en: "For one week, note your spending in this category. Which are real needs, which are habit?",
      ru: "Неделю записывай траты в этой категории. Что — реальная нужда, а что — привычка?",
      th: "หนึ่งสัปดาห์ จดค่าใช้จ่ายในหมวดนี้ อันไหนคือความจำเป็นจริง อันไหนคือความเคยชิน?",
      es: "Durante una semana, anota tu gasto en esta categor\u00eda. \u00bfQu\u00e9 es necesidad y qu\u00e9 es h\u00e1bito?",
      zh: "用一周记录该类消费。哪些是真正需要，哪些只是习惯？",
    }),
  };
}

function pastSelfNarrative(event: CachedInsightEventRecord, locale: string): PatternNarrative {
  const p = event.payload;
  const currentTotal = asNumber(p.currentTotal);
  const baseline = asNumber(p.baselineMedian);
  const day = asNumber(p.dayOfMonth);
  const delta = asNumber(p.deltaRatio);
  const direction = asString(p.direction);
  const over = direction !== "under";

  return {
    eyebrow: tx(locale, { tr: "Bu ayki tempo", en: "This month's tempo", ru: "Темп этого месяца", th: "จังหวะของเดือนนี้", es: "Tempo del mes", zh: "本月节拍" }),
    headline: pickEventText(locale, event.title, over ? {
      tr: "Bu ay temposu yüksek seyrediyor",
      en: "This month is running hot",
      ru: "В этом месяце темп выше обычного",
      th: "จังหวะเดือนนี้สูงกว่าปกติ",
      es: "Este mes va más rápido de lo habitual",
      zh: "本月节奏偏高",
    } : {
      tr: "Bu ay temposu sakin seyrediyor",
      en: "This month is running calm",
      ru: "В этом месяце темп ниже обычного",
      th: "จังหวะเดือนนี้ต่ำกว่าปกติ",
      es: "Este mes va más tranquilo de lo habitual",
      zh: "本月节奏偏缓",
    }),
    read: pickEventText(locale, event.summary, {
      tr: "Bu ayın temposu, geçmiş ayların aynı gününe göre farklı ilerliyor.",
      en: "This month's pace differs from the same day in past months.",
      ru: "Темп этого месяца отличается от того же дня в прошлых месяцах.",
      th: "จังหวะเดือนนี้ต่างจากวันเดียวกันของเดือนก่อน ๆ",
      es: "El ritmo de este mes difiere del mismo día de meses anteriores.",
      zh: "本月节奏与往月同一天相比有所不同。",
    }),
    humanLayer: tx(locale, {
      tr: over
        ? "Bu bir panik uyarısı değil. Ayın daha erken kısmında daha fazla para çıkmış. Bunu erken görmek, ay sonunu daha sakin kapatmak için değerli."
        : "Aşağıda kalmak her zaman iyi haber olmayabilir. Bazen bilinçli kontrol, bazen de ertelenen ihtiyaç demek. Farkı birlikte ayırmak lazım.",
      en: over
        ? "This isn't a panic alert. Money has moved earlier in the month — seeing that early helps you close the month calmer."
        : "Being below isn't always good news. Sometimes it's mindful control, sometimes deferred need. Worth separating the two.",
      ru: over
        ? "Это не тревога. Просто в начале месяца ушло больше — увидеть это рано полезно, чтобы спокойно закрыть месяц."
        : "Быть ниже — не всегда хорошо. Иногда осознанный контроль, иногда отложенная нужда. Стоит разделить.",
      th: over
        ? "ไม่ใช่สัญญาณตื่นตระหนก แค่เงินไหลออกในต้นเดือนมากขึ้น การเห็นเร็วช่วยให้ปิดเดือนได้สบายขึ้น"
        : "การอยู่ต่ำกว่าไม่ใช่ข่าวดีเสมอไป บางครั้งคือการควบคุมตัวเอง บางครั้งคือเลื่อนความต้องการ ควรแยกให้ออก",
      es: over
        ? "No es una alarma. Sali\u00f3 m\u00e1s dinero en la primera parte del mes — verlo a tiempo ayuda a cerrar mejor."
        : "Estar por debajo no siempre es buena noticia. A veces es control, a veces necesidad postergada. Conviene distinguir.",
      zh: over
        ? "这不是恐慌信号。月初花得更多——早点看到，能更平静地收尾这个月。"
        : "比平均低不一定是好消息。可能是自觉克制，也可能是推迟了需求。值得分清。",
    }),
    socialLayer: tx(locale, {
      tr: "Maaş günü, kira, market stoku, şehir içi hareketlilik ve sosyal planlar ayın ritmini değiştirir. O yüzden seni geçen ayın tamamıyla değil, aynı günle kıyaslıyoruz.",
      en: "Payday, rent, grocery stocking, city movement, and plans shape the month's rhythm. That's why we compare the same day, not the whole month.",
      ru: "Зарплата, аренда, закупки, перемещения и планы — всё это меняет ритм. Поэтому сравниваем тот же день, а не весь месяц.",
      th: "วันเงินเดือน ค่าเช่า การตุนของในบ้าน การเดินทาง และแผนต่าง ๆ ปรับจังหวะเดือน เราจึงเทียบที่วันเดียวกัน ไม่ใช่ทั้งเดือน",
      es: "El d\u00eda de pago, el alquiler, la compra, los desplazamientos y los planes dan ritmo al mes. Por eso comparamos el mismo d\u00eda, no el mes entero.",
      zh: "发薪日、房租、囤货、出行与计划塑造一个月的节奏。所以我们对比同一天，而不是整月。",
    }),
    support: tx(locale, {
      tr: over
        ? "Kendini sıkıştırmak yerine 7 günlük sakin bir seri kur. Büyük karar değil, küçük tempo ayarı."
        : "Bu sakin gidişi koru; ama sağlık, ev, ulaşım gibi ertelenen ihtiyaç varsa bunu başarı gibi okumayalım.",
      en: over
        ? "Instead of squeezing yourself, set up a calm 7-day stretch. Not a big decision — a small tempo adjustment."
        : "Keep this calm pace; but if health, home, or transport needs are being deferred, let's not read this as a win.",
      ru: over
        ? "Не дави на себя — устрой спокойную 7-дневную полосу. Не большое решение, а тонкая настройка темпа."
        : "Сохрани этот спокойный темп; но если откладывается здоровье, дом или транспорт — это не победа.",
      th: over
        ? "ไม่ต้องบีบตัวเอง ลองตั้งช่วง 7 วันที่สงบ ๆ ไม่ใช่การตัดสินใจใหญ่ แค่ปรับจังหวะเล็กน้อย"
        : "รักษาจังหวะที่สงบนี้ไว้ แต่ถ้าต้องเลื่อนเรื่องสุขภาพ บ้าน หรือเดินทาง อย่ามองว่าเป็นชัยชนะ",
      es: over
        ? "En vez de presionarte, monta una racha tranquila de 7 d\u00edas. No una gran decisi\u00f3n — un ajuste de tempo."
        : "Mant\u00e9n este ritmo tranquilo; pero si est\u00e1s postergando salud, hogar o transporte, no lo leamos como triunfo.",
      zh: over
        ? "别挤自己——安排个 7 天的平稳期。不是大决定，只是节奏的微调。"
        : "保持这份平稳；但如果在推迟健康、家居或交通方面的需求，就别当作胜利。",
    }),
    primaryAction: tx(locale, {
      tr: over ? "7 günlük denge serisi kur" : "Bu tempoyu izle",
      en: over ? "Set a 7-day balance run" : "Watch this tempo",
      ru: over ? "Запусти 7-дневный баланс" : "Следи за темпом",
      th: over ? "ตั้งช่วงสมดุล 7 วัน" : "ติดตามจังหวะนี้",
      es: over ? "Activa una racha de 7 d\u00edas" : "Sigue este tempo",
      zh: over ? "启动 7 天平衡期" : "关注这个节奏",
    }),
    secondaryAction: tx(locale, {
      tr: "Geçmiş ayları karşılaştır",
      en: "Compare past months",
      ru: "Сравнить с прошлыми",
      th: "เทียบกับเดือนก่อน ๆ",
      es: "Comparar meses",
      zh: "对比往月",
    }),
    proof: [
      {
        label: tx(locale, { tr: "Ayın günü", en: "Day of month", ru: "День месяца", th: "วันที่ของเดือน", es: "D\u00eda del mes", zh: "本月第几天" }),
        value: day !== null ? tx(locale, { tr: `${day}. gün`, en: `Day ${day}`, ru: `${day}-й день`, th: `วันที่ ${day}`, es: `D\u00eda ${day}`, zh: `第${day}天` }) : "—",
      },
      {
        label: tx(locale, { tr: "Bu ay", en: "This month", ru: "Этот месяц", th: "เดือนนี้", es: "Este mes", zh: "本月" }),
        value: formatCurrencyValue(currentTotal, event.currency, { locale }),
      },
      {
        label: tx(locale, { tr: "Geçmiş medyan", en: "Past median", ru: "Прошлая медиана", th: "มัธยฐานเดิม", es: "Mediana ant.", zh: "往月中位数" }),
        value: formatCurrencyValue(baseline, event.currency, { locale }),
      },
      {
        label: tx(locale, { tr: "Fark", en: "Diff", ru: "Разница", th: "ผลต่าง", es: "Dif.", zh: "差异" }),
        value: formatPercent(delta, locale, 0),
        tone: over ? "warn" : "good",
      },
      {
        label: tx(locale, { tr: "Tahmini etki", en: "Est. impact", ru: "Оценка", th: "ผลกระทบโดยประมาณ", es: "Impacto est.", zh: "预估影响" }),
        value: formatCurrencyValue(event.monetaryImpact, event.currency, { sign: "signed", locale }),
      },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Ayın temposu sadece harcama tutarıyla ölçülemez; bazı aylar zorunlu ödemeler (kira, faturalar) yoğunlaşabilir.",
        en: "The month's pace isn't only about totals — fixed payments (rent, bills) may cluster in some months.",
        ru: "Темп месяца — не только сумма; в некоторых месяцах накапливаются обязательные платежи.",
        th: "จังหวะของเดือนไม่ใช่แค่ยอดเงิน บางเดือนค่าใช้จ่ายประจำ (ค่าเช่า บิล) อาจหนักขึ้น",
        es: "El ritmo del mes no es solo el total — los pagos fijos (renta, facturas) pueden concentrarse.",
        zh: "月节奏不只看总额——固定支出（房租、账单）可能集中。",
      }),
      tx(locale, {
        tr: "Geçmiş aylardaki olağanüstü durumlar (seyahat, sağlık harcaması) medyanı yukarı çekmiş olabilir.",
        en: "Unusual events in past months (travel, healthcare) may have pulled the median up.",
        ru: "Особые события в прошлых месяцах (поездки, медицина) могли поднять медиану.",
        th: "เหตุการณ์พิเศษในเดือนก่อน (เดินทาง สุขภาพ) อาจดึงค่ามัธยฐานให้สูงขึ้น",
        es: "Sucesos at\u00edpicos pasados (viajes, salud) pueden haber subido la mediana.",
        zh: "过往月份的特殊事件（出行、就医）可能拉高了中位数。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bu hafta büyük bir harcama yapmadan önce 24 saat bekle. Aceleci kararların ay sonunda ne kadar etki ettiğini gör.",
      en: "This week, wait 24 hours before any large purchase. See how impulse decisions show up at month-end.",
      ru: "На этой неделе подожди 24 часа перед крупной покупкой. Посмотри, как импульс отражается к концу месяца.",
      th: "สัปดาห์นี้ ก่อนซื้อของชิ้นใหญ่ ให้รอ 24 ชั่วโมง ดูว่าการตัดสินใจเร่งรีบส่งผลแค่ไหนเมื่อสิ้นเดือน",
      es: "Esta semana, espera 24 horas antes de cualquier compra grande. Ver\u00e1s c\u00f3mo el impulso afecta a fin de mes.",
      zh: "本周，做大额消费前等 24 小时。看看冲动决策在月底带来多大影响。",
    }),
  };
}

export function getPatternNarrative(
  kind: InsightEventKind,
  event: CachedInsightEventRecord | null,
  locale: string = "tr",
): PatternNarrative {
  if (!event) return fallbackNarrative(kind, locale);
  if (kind === "impulse_fingerprint") return impulseNarrative(event, locale);
  if (kind === "own_price_track") return ownPriceNarrative(event, locale);
  if (kind === "category_drift") return categoryDriftNarrative(event, locale);
  if (kind === "reward_reflex") return rewardReflexNarrative(event, locale);
  if (kind === "stress_pulse") return stressPulseNarrative(event, locale);
  if (kind === "micro_leak") return microLeakNarrative(event, locale);
  if (kind === "ritual_loop") return ritualLoopNarrative(event, locale);
  return pastSelfNarrative(event, locale);
}

export function portraitTitle(events: CachedInsightEventRecord[], locale: string = "tr"): string {
  if (events.length === 0) {
    return tx(locale, {
      tr: "Henüz portre çizmek için erken",
      en: "Too early to draw your portrait",
      ru: "Пока рано рисовать портрет",
      th: "ยังเร็วเกินไปที่จะวาดภาพรวมของคุณ",
      es: "A\u00fan es pronto para dibujar tu retrato",
      zh: "现在画你的画像还为时过早",
    });
  }

  const emotional = ["impulse_fingerprint", "reward_reflex", "stress_pulse"];
  const routine = ["ritual_loop", "own_price_track"];
  const drift = ["category_drift", "past_self"];

  const emotionalCount = events.filter((e) => emotional.includes(e.kind)).length;
  const routineCount = events.filter((e) => routine.includes(e.kind)).length;
  const driftCount = events.filter((e) => drift.includes(e.kind)).length;

  if (emotionalCount >= routineCount && emotionalCount >= driftCount) {
    return tx(locale, {
      tr: "Duygusal tonun güçlü, rutinlerin henüz formda değil",
      en: "Your emotional tone is strong; routines aren't yet in shape",
      ru: "Эмоциональный тон выражен; рутины пока не настроены",
      th: "โทนทางอารมณ์ของคุณชัด แต่กิจวัตรยังไม่เข้าที่",
      es: "Tu tono emocional es fuerte; las rutinas a\u00fan no est\u00e1n en forma",
      zh: "你的情绪张力较强，日常节奏还没成型",
    });
  }
  if (routineCount >= emotionalCount && routineCount >= driftCount) {
    return tx(locale, {
      tr: "Rutin ve takip tonu baskın, değişimi yavaş hissediyorsun",
      en: "Routine and tracking dominate; change feels slow",
      ru: "Преобладают рутина и отслеживание; перемены кажутся медленными",
      th: "กิจวัตรและการติดตามเด่น การเปลี่ยนแปลงรู้สึกช้า",
      es: "Predominan rutina y seguimiento; el cambio se siente lento",
      zh: "日常与追踪占主导，变化感觉缓慢",
    });
  }
  return tx(locale, {
    tr: "Hayat düzeni değiştikçe cüzdanın da yön değiştiriyor",
    en: "As life rearranges, your wallet shifts direction too",
    ru: "Когда меняется уклад жизни, кошелёк тоже меняет курс",
    th: "เมื่อชีวิตเปลี่ยน กระเป๋าของคุณก็เปลี่ยนทิศไปด้วย",
    es: "Cuando la vida se reorganiza, tu cartera tambi\u00e9n cambia de rumbo",
    zh: "生活在变，你的钱包也在调整方向",
  });
}

export function portraitSummary(events: CachedInsightEventRecord[], locale: string = "tr"): string {
  if (events.length === 0) {
    return tx(locale, {
      tr: "Birkaç fiş daha geldiğinde burada \"ne aldın\" değil, hangi durumda neye yöneldiğin anlatılacak.",
      en: "Once a few more receipts arrive, this won't be about \"what you bought\" but about which states pulled you toward what.",
      ru: "Когда придёт ещё немного чеков, здесь будет не \"что ты купил\", а в каких состояниях к чему ты тянулся.",
      th: "เมื่อมีใบเสร็จเพิ่มอีกสักหน่อย ที่นี่จะไม่ใช่ \"คุณซื้ออะไร\" แต่จะเป็น \"ในอารมณ์แบบไหน คุณหันไปหาอะไร\"",
      es: "Cuando lleguen m\u00e1s recibos, esto no ser\u00e1 sobre \"qu\u00e9 compraste\" sino sobre qu\u00e9 estados te llevaron a qu\u00e9.",
      zh: "等更多收据到位后，这里讲的不再是\"你买了什么\"，而是\"在什么状态下你被带向什么\"。",
    });
  }
  const committed = events.filter((e) => e.state === "committed").length;
  const emotionalCount = events.filter((e) =>
    ["impulse_fingerprint", "reward_reflex", "stress_pulse"].includes(e.kind),
  ).length;
  const strongest = [...events].sort((a, b) => b.confidence - a.confidence)[0];
  const strongestLabel = strongest ? getLocalizedPatternMeta(strongest.kind, locale).shortLabel : "—";

  let tone: string;
  if (emotionalCount >= events.length * 0.5) {
    tone = tx(locale, {
      tr: "En baskın desen: duygusal harcamalar.",
      en: "Dominant pattern: emotional spending.",
      ru: "Доминирует паттерн эмоциональных трат.",
      th: "รูปแบบที่เด่น: การใช้จ่ายทางอารมณ์",
      es: "Patrón dominante: gasto emocional.",
      zh: "主导模式：情绪化消费。",
    });
  } else if (committed > 0) {
    tone = tx(locale, {
      tr: `${committed} sinyali takibe almışsın; farkındalık yüksek.`,
      en: `You're tracking ${committed} signal${committed === 1 ? "" : "s"} — awareness is high.`,
      ru: `Ты отслеживаешь ${committed} сигнал(ов) — осознанность высокая.`,
      th: `คุณกำลังติดตาม ${committed} สัญญาณ — ความตระหนักสูง`,
      es: `Est\u00e1s siguiendo ${committed} se\u00f1al${committed === 1 ? "" : "es"} — alta conciencia.`,
      zh: `你正在跟踪 ${committed} 个信号 — 觉察度较高。`,
    });
  } else {
    tone = tx(locale, {
      tr: "Henüz hiç sinyali takibe almamışsın; sadece gözlem modundasın.",
      en: "You haven't tracked any signal yet — you're in observation mode.",
      ru: "Ты пока ничего не взял на отслеживание — режим наблюдения.",
      th: "คุณยังไม่ได้ติดตามสัญญาณใดเลย — อยู่ในโหมดสังเกต",
      es: "A\u00fan no est\u00e1s siguiendo ninguna se\u00f1al — modo observaci\u00f3n.",
      zh: "你还没有跟踪任何信号——处于观察模式。",
    });
  }

  return tx(locale, {
    tr: `${events.length} canlı sinyal. Güveni en yüksek olanı: ${strongestLabel}. ${tone}`,
    en: `${events.length} live signals. Highest confidence: ${strongestLabel}. ${tone}`,
    ru: `Активных сигналов: ${events.length}. Самый уверенный: ${strongestLabel}. ${tone}`,
    th: `${events.length} สัญญาณที่ใช้งาน ความมั่นใจสูงสุด: ${strongestLabel} — ${tone}`,
    es: `${events.length} se\u00f1ales activas. M\u00e1s confiable: ${strongestLabel}. ${tone}`,
    zh: `当前 ${events.length} 个信号。置信度最高：${strongestLabel}。${tone}`,
  });
}


// ─── Sprint 1: new behavior lens narratives ─────────────────────────────

function rewardReflexNarrative(event: CachedInsightEventRecord, locale: string = "tr"): PatternNarrative {
  const p = event.payload;
  const windowReceipts = asNumber(p.windowReceipts);
  const wantsShare = asNumber(p.wantsShare);
  const avgWeekly = asNumber(p.avgWeeklyFrequency);
  const topCategory = localizedCategory(p.topCategory, locale);

  return {
    eyebrow: tx(locale, { tr: "Ödül refleksi", en: "Reward reflex", ru: "Рефлекс награды", th: "รีเฟล็กซ์รางวัล", es: "Reflejo de recompensa", zh: "奖励反射" }),
    headline: pickEventText(locale, event.title, {
      tr: "Akşam-gece ödül penceresi",
      en: "Evening-night reward window",
      ru: "Вечер-ночь: окно награды",
      th: "หน้าต่างรางวัลช่วงเย็น-ค่ำ",
      es: "Ventana de recompensa nocturna",
      zh: "傍晚到夜间的奖励时段",
    }),
    read: pickEventText(locale, event.summary, {
        tr: `Akşam ve gece saatlerinde ${windowReceipts ?? "—"} alışveriş yapmışsın; bunların ${formatPercent(wantsShare, "tr")}'i küçük ödül kategorilerinde.`,
        en: `In the evening/night window you made ${windowReceipts ?? "—"} purchases; ${formatPercent(wantsShare, "en")} of them sit in small-reward categories.`,
        ru: `Вечером и ночью у тебя ${windowReceipts ?? "—"} покупок; ${formatPercent(wantsShare, "ru")} приходится на категории мини-награды.`,
        th: `ช่วงเย็น-กลางคืน คุณซื้อ ${windowReceipts ?? "—"} ครั้ง; ${formatPercent(wantsShare, "th")} อยู่ในหมวดรางวัลเล็ก ๆ`,
        es: `Por la tarde-noche hiciste ${windowReceipts ?? "—"} compras; ${formatPercent(wantsShare, "es")} en categor\u00edas de peque\u00f1a recompensa.`,
        zh: `傍晚到夜间你有 ${windowReceipts ?? "—"} 笔消费，其中 ${formatPercent(wantsShare, "zh")} 落在小奖励类。`,
      }),
    humanLayer: tx(locale, {
      tr: "Bu harcamalar tek başına problem değil. Ama aynı saat, aynı kategori ve aynı düşük karar süresi tekrarlandığında, cüzdan bir duygu kapatma aracına dönüşebilir. Burada çözmemiz gereken şey ürün değil; o saatteki enerji düşüşü.",
      en: "These purchases aren't the problem on their own. But when the same hour, same category, and same short decision time keep repeating, the wallet starts to close emotions. The issue isn't the item — it's the energy dip at that hour.",
      ru: "Сами по себе эти покупки — не проблема. Но когда тот же час, та же категория и то же быстрое решение повторяются, кошелёк превращается в способ закрыть эмоцию. Решать нужно не товар, а спад энергии в этот час.",
      th: "การซื้อเหล่านี้ไม่ใช่ปัญหาในตัวเอง แต่เมื่อชั่วโมง หมวด และเวลาตัดสินใจสั้น ๆ เกิดซ้ำ กระเป๋าจะกลายเป็นเครื่องมือปิดอารมณ์ สิ่งที่ต้องแก้ไม่ใช่สินค้า แต่เป็นช่วงพลังตกในเวลานั้น",
      es: "Estas compras no son el problema en s\u00ed. Pero cuando se repiten misma hora, misma categor\u00eda y misma decisi\u00f3n r\u00e1pida, la cartera empieza a cerrar emociones. Lo que hay que tratar no es el producto — es la ca\u00edda de energ\u00eda a esa hora.",
      zh: "这些消费本身并不是问题。但当同一时间、同一类别、同样匆忙的决定不断重复时，钱包就成了关闭情绪的工具。要处理的不是商品，而是那个时刻的能量低谷。",
    }),
    socialLayer: tx(locale, {
      tr: "Akşam ödülleri çoğu zaman yalnızca ürün değil, günün sonunda kendine bir kapanış ritüeli arayışıdır. Kahve, tatlı veya dışarıda bir şeyler yemek, 'bugün bitti, kendime izin verebilirim' sinyali taşır.",
      en: "Evening rewards are often less about the item and more about a closing ritual at day's end. Coffee, dessert, or a bite outside carry the signal: 'today is done, I can let go.'",
      ru: "Вечерние награды чаще не про товар, а про ритуал закрытия дня. Кофе, десерт или ужин вне дома несут сигнал: «день закончился, можно отпустить».",
      th: "รางวัลตอนเย็นส่วนใหญ่ไม่ได้เกี่ยวกับสินค้า แต่เป็นพิธีปิดวัน กาแฟ ของหวาน หรือกินข้างนอก สื่อว่า 'วันนี้จบแล้ว ให้รางวัลตัวเองได้'",
      es: "Las recompensas nocturnas suelen ser menos sobre el producto y m\u00e1s sobre un ritual de cierre del d\u00eda. Caf\u00e9, dulce o salir a comer dicen: 'el d\u00eda termin\u00f3, puedo soltar'.",
      zh: "晚间的奖励往往不在商品本身，而是一种收尾仪式。一杯咖啡、一份甜点或在外吃一口，都在说：今天结束了，可以放下。",
    }),
    support: tx(locale, {
      tr: "Bunu yasaklamak yerine geciktirmek daha işe yarar. Aynı saat geldiğinde kendine 10 dakika alan aç; karar hâlâ mantıklıysa al.",
      en: "Delaying works better than banning. When that hour comes, give yourself 10 minutes — if it still makes sense, go ahead.",
      ru: "Лучше отсрочить, чем запретить. Когда наступает тот час, дай себе 10 минут — если решение всё ещё разумное, бери.",
      th: "การเลื่อนเวลาดีกว่าการห้าม เมื่อถึงช่วงเวลานั้น ให้ตัวเอง 10 นาที — ถ้ายังสมเหตุสมผล ค่อยซื้อ",
      es: "Aplazar funciona mejor que prohibir. Cuando llegue esa hora, date 10 minutos; si a\u00fan tiene sentido, adelante.",
      zh: "推迟比禁止更有效。到那个时段，给自己 10 分钟，仍然觉得合理就行动。",
    }),
    primaryAction: tx(locale, { tr: "Bu saate küçük kural koy", en: "Set a small rule for this hour", ru: "Поставь правило на этот час", th: "ตั้งกติกาเล็ก ๆ ในช่วงเวลานี้", es: "Crea una regla para esta hora", zh: "为该时段设个小规则" }),
    secondaryAction: tx(locale, { tr: "Bu saatteki fişleri göster", en: "Show receipts at this hour", ru: "Показать чеки за этот час", th: "แสดงใบเสร็จในช่วงเวลานี้", es: "Ver recibos de esta hora", zh: "查看该时段的收据" }),
    proof: [
      { label: tx(locale, { tr: "Fiş", en: "Receipts", ru: "Чеки", th: "ใบเสร็จ", es: "Recibos", zh: "收据" }), value: windowReceipts !== null ? timesLabel(windowReceipts, locale) : "—" },
      { label: tx(locale, { tr: "Haftada", en: "Per week", ru: "В неделю", th: "ต่อสัปดาห์", es: "Por semana", zh: "每周" }), value: avgWeekly !== null ? `~${Math.round(avgWeekly * 10) / 10}` : "—" },
      { label: tx(locale, { tr: "Ödül payı", en: "Reward share", ru: "Доля наград", th: "สัดส่วนรางวัล", es: "Cuota recomp.", zh: "奖励占比" }), value: formatPercent(wantsShare, locale), tone: "warn" },
      { label: tx(locale, { tr: "En çok", en: "Top", ru: "Чаще всего", th: "มากสุด", es: "M\u00e1s", zh: "最多" }), value: topCategory },
      { label: tx(locale, { tr: "Toplam", en: "Total", ru: "Всего", th: "รวม", es: "Total", zh: "总计" }), value: formatCurrencyValue(event.monetaryImpact, event.currency, { locale }) },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Bazı akşam alışverişleri gerçekten planlı olabilir; hepsini ödül olarak okumak hatalı olabilir.",
        en: "Some evening purchases really are planned — not every one is a reward.",
        ru: "Часть вечерних покупок действительно плановая — не каждая из них «награда».",
        th: "การซื้อบางครั้งในตอนเย็นเป็นการวางแผนจริง ไม่ใช่รางวัลทั้งหมด",
        es: "Algunas compras nocturnas son realmente planificadas — no todas son recompensa.",
        zh: "有些晚间消费其实是计划好的，不必都视为奖励。",
      }),
      tx(locale, {
        tr: "Hafta sonu akşamları farklı bir davranış gösterebilir; veri sadece hafta içini kapsıyor olabilir.",
        en: "Weekend evenings may behave differently — the data may only cover weekdays.",
        ru: "Вечера выходных могут вести себя иначе — данные могут охватывать лишь будни.",
        th: "ช่วงเย็นวันหยุดสุดสัปดาห์อาจต่างออกไป ข้อมูลอาจรวมเฉพาะวันธรรมดา",
        es: "Las noches del finde pueden comportarse distinto — los datos quiz\u00e1 solo cubran d\u00edas laborables.",
        zh: "周末晚间可能不同 — 数据可能仅覆盖工作日。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bir hafta boyunca akşam 18:00'dan sonra ilk alışverişi 10 dakika geciktir. Kararın nasıl değiştiğini gözlemle.",
      en: "For one week, delay the first purchase after 18:00 by 10 minutes. Observe how your decision changes.",
      ru: "Неделю — отсрочь первую покупку после 18:00 на 10 минут. Понаблюдай, как меняется решение.",
      th: "หนึ่งสัปดาห์ ให้เลื่อนการซื้อครั้งแรกหลัง 18:00 ออกไป 10 นาที สังเกตว่าการตัดสินใจเปลี่ยนอย่างไร",
      es: "Durante una semana, retrasa 10 minutos la primera compra despu\u00e9s de las 18:00. Observa c\u00f3mo cambia tu decisi\u00f3n.",
      zh: "用一周，把 18:00 后的第一次消费推迟 10 分钟。观察决策如何变化。",
    }),
  };
}

function stressPulseNarrative(event: CachedInsightEventRecord, locale: string = "tr"): PatternNarrative {
  const p = event.payload;
  const candidateCount = asNumber(p.candidateCount);
  const wantsShare = asNumber(p.wantsShare);
  const hasClustering = p.hasClustering === true;
  const topCategory = localizedCategory(p.topCategory, locale);

  return {
    eyebrow: tx(locale, { tr: "Stres atışı", en: "Stress pulse", ru: "Импульс стресса", th: "ชีพจรความเครียด", es: "Pulso de estrés", zh: "压力脉冲" }),
    headline: pickEventText(locale, event.title, {
      tr: "Geç saat stres atışı",
      en: "Late-night stress pulse",
      ru: "Импульс стресса поздним вечером",
      th: "ชีพจรความเครียดดึก ๆ",
      es: "Pulso de estrés nocturno",
      zh: "深夜压力脉冲",
    }),
    read: pickEventText(locale, event.summary, {
        tr: `Hafta içi geç saatlerde ${candidateCount ?? "—"} alışveriş yapmışsın; bunların ${formatPercent(wantsShare, "tr")}'i rahatlama kategorilerinde${hasClustering ? " ve bazıları birbirine yakın günlerde" : ""}.`,
        en: `Late on weekdays you made ${candidateCount ?? "—"} purchases; ${formatPercent(wantsShare, "en")} of them in comfort categories${hasClustering ? ", clustered close together" : ""}.`,
        ru: `Поздно по будням у тебя ${candidateCount ?? "—"} покупок; ${formatPercent(wantsShare, "ru")} в категориях релакса${hasClustering ? ", и часть кучкуется в близкие дни" : ""}.`,
        th: `ดึก ๆ ของวันธรรมดา คุณซื้อ ${candidateCount ?? "—"} ครั้ง; ${formatPercent(wantsShare, "th")} อยู่ในหมวดผ่อนคลาย${hasClustering ? " และบางส่วนอยู่ในวันใกล้กัน" : ""}`,
        es: `Tarde, entre semana, hiciste ${candidateCount ?? "—"} compras; ${formatPercent(wantsShare, "es")} en categor\u00edas de descanso${hasClustering ? ", agrupadas en d\u00edas cercanos" : ""}.`,
        zh: `工作日深夜你做了 ${candidateCount ?? "—"} 笔消费，其中 ${formatPercent(wantsShare, "zh")} 落在放松类${hasClustering ? "，并且部分集中在相近的日子" : ""}。`,
      }),
    humanLayer: tx(locale, {
      tr: "Bu bir disiplin sorunu değil. Daha çok günün yorgun tarafında, beynin 'dur, dinlen, kapat' sinyali verdiği anlarda cüzdanın devreye giriyor olabilir. Harcama burada çözüm değil, semptom.",
      en: "This isn't a discipline issue. On the tired side of the day, when the brain says 'stop, rest, shut down,' the wallet may step in. Spending here is the symptom — not the solution.",
      ru: "Дело не в дисциплине. К концу дня мозг говорит «стоп, отдых, выключай» — и кошелёк включается вместо отдыха. Трата здесь — симптом, а не решение.",
      th: "นี่ไม่ใช่ปัญหาวินัย ในช่วงเหนื่อยของวัน เมื่อสมองส่งสัญญาณ 'หยุด พัก ปิด' กระเป๋าอาจเข้ามาแทน การใช้จ่ายเป็นอาการ ไม่ใช่ทางแก้",
      es: "No es un tema de disciplina. En la parte cansada del d\u00eda, cuando el cerebro dice 'parar, descansar, cerrar', la cartera entra. El gasto aqu\u00ed es s\u00edntoma — no soluci\u00f3n.",
      zh: "这不是自律的问题。一天疲惫的时段，当大脑说\"停、休息、关机\"，钱包会顶上。这里的消费是症状，不是解决办法。",
    }),
    socialLayer: tx(locale, {
      tr: "Hafta içi gece alışverişleri genellikle yalnızlık, yorgunluk veya ertelenen ihtiyaçların birikimini gösterir. Bu kişisel bir zaaf değil; modern çalışma düzeninin bir yan ürünü.",
      en: "Late weekday purchases often show loneliness, fatigue, or postponed needs piling up. Not a personal weakness — a side effect of modern work patterns.",
      ru: "Покупки поздно в будни часто показывают одиночество, усталость или копящиеся отложенные нужды. Не личная слабость — побочный эффект современного ритма.",
      th: "การซื้อของดึก ๆ ในวันธรรมดามักสะท้อนความเหงา ความเหนื่อย หรือความต้องการที่สะสม ไม่ใช่จุดอ่อนส่วนตัว — เป็นผลพลอยได้ของการทำงานยุคนี้",
      es: "Las compras tarde entre semana suelen mostrar soledad, cansancio o necesidades postergadas que se acumulan. No es debilidad — es efecto colateral del ritmo de trabajo moderno.",
      zh: "工作日深夜消费往往反映孤独、疲惫或被推迟的需求在累积。这不是个人弱点，而是现代工作节奏的副产品。",
    }),
    support: tx(locale, {
      tr: "Kendini sıkıştırmak yerine 21:00 sonrası ilk rahatlama alışverişinden önce 15 dakika bekle. Bu sürede enerji düşüşünü başka yolla dengelemeyi dene.",
      en: "Instead of squeezing yourself, after 21:00 wait 15 minutes before the first comfort purchase. Try balancing the energy dip another way in that gap.",
      ru: "Не дави на себя — после 21:00 подожди 15 минут до первой «релакс»-покупки. В этой паузе попробуй уравновесить энергию иначе.",
      th: "ไม่ต้องบีบตัวเอง หลัง 21:00 ให้รอ 15 นาทีก่อนจะซื้อของผ่อนคลายชิ้นแรก ลองหาทางอื่นเติมพลังในช่วงนั้น",
      es: "En vez de presionarte, despu\u00e9s de las 21:00 espera 15 minutos antes de la primera compra de descanso. Prueba equilibrar la energ\u00eda de otro modo.",
      zh: "别挤自己。21:00 之后，第一次\"放松性消费\"前等 15 分钟。这段时间用别的方式调能量。",
    }),
    primaryAction: tx(locale, { tr: "Gece rahatlama alışverişine 15 dakika ara", en: "Add a 15-min pause to night relief", ru: "15-мин пауза перед вечерней покупкой", th: "เว้น 15 นาทีก่อนซื้อผ่อนคลายตอนกลางคืน", es: "Pausa de 15 min antes de la compra nocturna", zh: "夜间放松消费前停 15 分钟" }),
    secondaryAction: tx(locale, { tr: "Bu günlerin fişlerini göster", en: "Show these days' receipts", ru: "Показать чеки этих дней", th: "แสดงใบเสร็จของวันเหล่านี้", es: "Ver recibos de estos d\u00edas", zh: "查看这些天的收据" }),
    proof: [
      { label: tx(locale, { tr: "Fiş", en: "Receipts", ru: "Чеки", th: "ใบเสร็จ", es: "Recibos", zh: "收据" }), value: candidateCount !== null ? timesLabel(candidateCount, locale) : "—" },
      { label: tx(locale, { tr: "Rahatlama payı", en: "Comfort share", ru: "Доля релакса", th: "สัดส่วนผ่อนคลาย", es: "Cuota descanso", zh: "放松占比" }), value: formatPercent(wantsShare, locale), tone: "warn" },
      { label: tx(locale, { tr: "Kümeleşme", en: "Clustering", ru: "Кластеризация", th: "การเกาะกลุ่ม", es: "Agrupaci\u00f3n", zh: "聚集" }), value: hasClustering ? tx(locale, { tr: "Evet", en: "Yes", ru: "Да", th: "มี", es: "S\u00ed", zh: "是" }) : tx(locale, { tr: "Hayır", en: "No", ru: "Нет", th: "ไม่มี", es: "No", zh: "否" }) },
      { label: tx(locale, { tr: "En çok", en: "Top", ru: "Чаще всего", th: "มากสุด", es: "M\u00e1s", zh: "最多" }), value: topCategory },
      { label: tx(locale, { tr: "Tahmini etki", en: "Est. impact", ru: "Оценка", th: "ผลกระทบโดยประมาณ", es: "Impacto est.", zh: "预估影响" }), value: formatCurrencyValue(event.monetaryImpact, event.currency, { locale }) },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Bazı gece alışverişleri gerçekten acil ihtiyaç olabilir; hepsini stres olarak okumak hatalı olabilir.",
        en: "Some late purchases may be real emergencies — not every one is stress.",
        ru: "Часть ночных покупок — реальные срочные нужды, не всегда это стресс.",
        th: "การซื้อกลางคืนบางครั้งเป็นเหตุฉุกเฉินจริง ไม่ใช่ความเครียดเสมอไป",
        es: "Algunas compras tard\u00edas pueden ser urgencias reales — no todas son estr\u00e9s.",
        zh: "部分深夜消费可能是真的紧急情况 — 不必都解读为压力。",
      }),
      tx(locale, {
        tr: "Hafta sonu geceleri farklı bir davranış gösterebilir; veri sadece hafta içini kapsıyor olabilir.",
        en: "Weekend nights may behave differently — the data may only reflect weekdays.",
        ru: "Ночь в выходные может вести себя иначе — данные могут охватывать лишь будни.",
        th: "คืนสุดสัปดาห์อาจเป็นคนละแบบ ข้อมูลอาจรวมเฉพาะวันธรรมดา",
        es: "Las noches del finde pueden comportarse distinto — los datos quiz\u00e1 solo reflejen d\u00edas laborables.",
        zh: "周末夜可能不同 — 数据可能仅反映工作日。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bir hafta boyunca 21:00'dan sonra ilk rahatlama alışverişinden önce 15 dakika bekle. Alternatif bir mola yöntemi dene.",
      en: "For one week, after 21:00 wait 15 minutes before the first comfort buy. Try an alternative break instead.",
      ru: "Неделю — после 21:00 жди 15 минут до первой «релакс»-покупки. Попробуй альтернативный перерыв.",
      th: "หนึ่งสัปดาห์ หลัง 21:00 ให้รอ 15 นาทีก่อนซื้อของผ่อนคลายชิ้นแรก ลองวิธีพักอื่นแทน",
      es: "Una semana: tras las 21:00 espera 15 minutos antes de la primera compra de descanso. Prueba otra pausa.",
      zh: "用一周，21:00 后第一次\"放松性消费\"前等 15 分钟，换一种方式休息。",
    }),
  };
}

function microLeakNarrative(event: CachedInsightEventRecord, locale: string = "tr"): PatternNarrative {
  const p = event.payload;
  const merchant =
    asString(p.merchant) ??
    tx(locale, { tr: "Bu yer", en: "This place", ru: "Это место", th: "ร้านนี้", es: "Este lugar", zh: "这家店" });
  const repeatCount = asNumber(p.repeatCount);
  const avgAmount = asNumber(p.avgAmount);
  const avgWeekly = asNumber(p.avgWeeklyFrequency);
  const monthlyProjected = asNumber(p.monthlyProjected);

  return {
    eyebrow: tx(locale, { tr: "Mikro sızıntı", en: "Micro leak", ru: "Микро-утечка", th: "รั่วไหลเล็ก ๆ", es: "Micro-fuga", zh: "微泄漏" }),
    headline: pickEventText(locale, event.title, {
      tr: `${merchant}'te küçük tekrarlar`,
      en: `Small repeats at ${merchant}`,
      ru: `Маленькие повторы в ${merchant}`,
      th: `การซื้อซ้ำเล็ก ๆ ที่ ${merchant}`,
      es: `Pequeñas repeticiones en ${merchant}`,
      zh: `${merchant} 的小额重复消费`,
    }),
    read: pickEventText(locale, event.summary, {
        tr: `${merchant}'ten ${repeatCount ?? "—"} kez ortalama ${formatCurrencyValue(avgAmount, event.currency, { locale: "tr" })} harcamışsın. Tek başına küçük ama haftada ~${avgWeekly !== null ? Math.round(avgWeekly * 10) / 10 : "—"} kez tekrar ediyor.`,
        en: `${repeatCount ?? "—"} purchases at ${merchant}, avg ${formatCurrencyValue(avgAmount, event.currency, { locale: "en" })}. Small individually — but it repeats ~${avgWeekly !== null ? Math.round(avgWeekly * 10) / 10 : "—"} times a week.`,
        ru: `${repeatCount ?? "—"} покупок в ${merchant}, средняя ${formatCurrencyValue(avgAmount, event.currency, { locale: "ru" })}. По отдельности мало, но повторяется ~${avgWeekly !== null ? Math.round(avgWeekly * 10) / 10 : "—"} раз в неделю.`,
        th: `${repeatCount ?? "—"} ครั้งที่ ${merchant} เฉลี่ย ${formatCurrencyValue(avgAmount, event.currency, { locale: "th" })} แต่ละครั้งดูเล็ก แต่เกิดซ้ำ ~${avgWeekly !== null ? Math.round(avgWeekly * 10) / 10 : "—"} ครั้งต่อสัปดาห์`,
        es: `${repeatCount ?? "—"} compras en ${merchant}, prom ${formatCurrencyValue(avgAmount, event.currency, { locale: "es" })}. Cada una peque\u00f1a — pero se repite ~${avgWeekly !== null ? Math.round(avgWeekly * 10) / 10 : "—"} veces por semana.`,
        zh: `在 ${merchant} 共 ${repeatCount ?? "—"} 次，平均 ${formatCurrencyValue(avgAmount, event.currency, { locale: "zh" })}。单笔不大，但每周大约 ${avgWeekly !== null ? Math.round(avgWeekly * 10) / 10 : "—"} 次重复。`,
      }),
    humanLayer: tx(locale, {
      tr: "Bu bir sızıntı değil; bir ritim. Aynı yerden küçük tutarlarla düzenli alışveriş, beynin 'burası güvenli, burası kolay' sinyalidir. Farkında olmak, değiştirmekten daha önemli.",
      en: "This isn't a leak — it's a rhythm. Regular small spends from the same spot are the brain saying 'safe, easy here.' Awareness matters more than change.",
      ru: "Это не утечка — это ритм. Регулярные маленькие траты в одном месте — это мозг говорит «здесь безопасно и легко». Осознанность важнее перемены.",
      th: "นี่ไม่ใช่การรั่วไหล แต่เป็นจังหวะ การซื้อเล็ก ๆ ซ้ำ ๆ จากที่เดิม คือสมองบอกว่า 'ที่นี่ปลอดภัย ง่าย' การรู้ตัวสำคัญกว่าการเปลี่ยน",
      es: "No es una fuga — es un ritmo. Pequeñas compras regulares en el mismo lugar son el cerebro diciendo 'seguro y f\u00e1cil aqu\u00ed'. La conciencia importa m\u00e1s que el cambio.",
      zh: "这不是泄漏，是节奏。在同一处反复小额消费，是大脑在说\"这里安全、轻松\"。觉察比改变更重要。",
    }),
    socialLayer: tx(locale, {
      tr: "Mikro harcamalar görünmez kalmayı sever. Kimse 'her gün bir kahve içiyorum' demez ama ay sonu o kahve toplam olur. Bu suçluluk değil, bir yapı.",
      en: "Micro-spends prefer to stay invisible. No one says 'I drink one coffee a day,' but month-end the total adds up. Not guilt — structure.",
      ru: "Микро-траты любят оставаться незаметными. Никто не скажет «каждый день один кофе», но к концу месяца сумма впечатляет. Это не вина — это структура.",
      th: "การใช้จ่ายเล็ก ๆ ชอบหายไปในเงา ไม่มีใครพูดว่า 'ฉันกินกาแฟวันละแก้ว' แต่สิ้นเดือนรวมแล้วเยอะ มันไม่ใช่ความผิด แต่เป็นโครงสร้าง",
      es: "Los micro-gastos prefieren ser invisibles. Nadie dice 'tomo un caf\u00e9 al d\u00eda', pero a fin de mes la suma aparece. No es culpa — es estructura.",
      zh: "微消费偏爱隐形。没人会说\"我每天一杯咖啡\"，但月底加起来不容忽视。这不是负罪感，是结构。",
    }),
    support: tx(locale, {
      tr: "Bu ritmi tamamen kesmek yerine haftada 2 kez sınırı dene. Kalan günlerde alternatif bir mola: yürüyüş, evde içecek veya 5 dakika nefes.",
      en: "Instead of cutting this rhythm fully, try a 2-times-a-week limit. On other days, an alternative break: a walk, a homemade drink, or just 5 mins of breath.",
      ru: "Не обрывай ритм полностью — попробуй лимит «2 раза в неделю». В остальные дни — альтернативный перерыв: прогулка, домашний напиток или 5 минут дыхания.",
      th: "แทนที่จะหยุดจังหวะนี้ทั้งหมด ลองตั้งเพดาน 2 ครั้งต่อสัปดาห์ วันอื่นใช้การพักทางเลือก เช่น เดิน เครื่องดื่มที่ทำเอง หรือหายใจ 5 นาที",
      es: "En vez de cortar el ritmo, prueba un l\u00edmite de 2 veces por semana. Los dem\u00e1s d\u00edas, una pausa alternativa: paseo, bebida casera o 5 min de respiraci\u00f3n.",
      zh: "不要彻底断掉这种节奏，尝试每周 2 次的上限。其他日子用替代休息：散步、自制饮品，或 5 分钟呼吸。",
    }),
    primaryAction: tx(locale, { tr: "Haftada 2 kez sınırı dene", en: "Try a 2/week limit", ru: "Лимит 2 раза в неделю", th: "ลองเพดาน 2 ครั้ง/สัปดาห์", es: "Prueba l\u00edmite 2/semana", zh: "尝试每周 2 次上限" }),
    secondaryAction: tx(locale, { tr: "Bu ritmin fişlerini göster", en: "Show this rhythm's receipts", ru: "Показать чеки этого ритма", th: "แสดงใบเสร็จของจังหวะนี้", es: "Ver recibos de este ritmo", zh: "查看该节奏的收据" }),
    proof: [
      { label: tx(locale, { tr: "Yer", en: "Place", ru: "Место", th: "ร้าน", es: "Lugar", zh: "地点" }), value: merchant },
      { label: tx(locale, { tr: "Tekrar", en: "Repeat", ru: "Повторов", th: "ทำซ้ำ", es: "Repetici\u00f3n", zh: "重复" }), value: repeatCount !== null ? timesLabel(repeatCount, locale) : "—" },
      { label: tx(locale, { tr: "Ortalama", en: "Average", ru: "Среднее", th: "เฉลี่ย", es: "Promedio", zh: "平均" }), value: formatCurrencyValue(avgAmount, event.currency, { locale }) },
      { label: tx(locale, { tr: "Haftada", en: "Per week", ru: "В неделю", th: "ต่อสัปดาห์", es: "Por semana", zh: "每周" }), value: avgWeekly !== null ? `~${Math.round(avgWeekly * 10) / 10}` : "—" },
      { label: tx(locale, { tr: "Aylık projeksiyon", en: "Monthly proj.", ru: "Прогноз/мес", th: "คาดการณ์รายเดือน", es: "Proyecci\u00f3n mes", zh: "月预测" }), value: formatCurrencyValue(monthlyProjected, event.currency, { locale }), tone: "warn" },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Aynı yerden küçük alışverişler bazen gerçekten farklı ürünler içerebilir; hepsini aynı ritim olarak okumak hatalı olabilir.",
        en: "Small repeat purchases at the same spot may actually be different items — not always the same rhythm.",
        ru: "Маленькие повторные покупки в одном месте могут быть разными товарами — не всегда тот же ритм.",
        th: "การซื้อเล็ก ๆ ที่ร้านเดิมอาจเป็นสินค้าคนละแบบ ไม่ใช่จังหวะเดียวกันเสมอ",
        es: "Compras peque\u00f1as repetidas en el mismo lugar pueden ser art\u00edculos distintos — no siempre el mismo ritmo.",
        zh: "在同一处的小额重复消费可能是不同商品 — 未必都是同一节奏。",
      }),
      tx(locale, {
        tr: "Seyahat veya tatil dönemlerinde bu ritim kırılabilir; veri normal dönemi temsil etmeyebilir.",
        en: "Travel or holidays can break this rhythm — the data may not reflect normal life.",
        ru: "Поездки или каникулы ломают ритм — данные могут не отражать обычную жизнь.",
        th: "การเดินทางหรือวันหยุดอาจทำลายจังหวะนี้ ข้อมูลอาจไม่ใช่ภาพชีวิตปกติ",
        es: "Viajes o vacaciones rompen este ritmo — los datos pueden no reflejar la vida normal.",
        zh: "出行或假期会打破这种节奏 — 数据可能不代表平时生活。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bir hafta boyunca bu ritmi farklı bir alternatif ile değiştir. Aynı ihtiyacı başka yolla karşılayabiliyor musun?",
      en: "For one week, swap this rhythm with an alternative. Can you meet the same need another way?",
      ru: "Неделю — замени этот ритм альтернативой. Удаётся закрыть ту же потребность иначе?",
      th: "หนึ่งสัปดาห์ ลองเปลี่ยนจังหวะนี้เป็นทางเลือกอื่น คุณตอบสนองความต้องการเดียวกันด้วยวิธีอื่นได้ไหม?",
      es: "Una semana: cambia este ritmo por una alternativa. \u00bfPuedes cubrir la misma necesidad de otra forma?",
      zh: "用一周，把这种节奏换成别的方式。你能用另一种方式满足同样的需要吗？",
    }),
  };
}

function ritualLoopNarrative(event: CachedInsightEventRecord, locale: string = "tr"): PatternNarrative {
  const p = event.payload;
  const dayOfWeek = asNumber(p.dayOfWeek);
  const bucket = asString(p.hourBucket);
  const category = localizedCategory(p.category, locale);
  const repeatCount = asNumber(p.repeatCount);
  const weeklyRate = asNumber(p.weeklyRate);
  const regularity = asNumber(p.regularity);
  const dayLabel = getDayLabel(dayOfWeek, locale);
  const bucketLabel = getBucketLabel(bucket, locale);

  return {
    eyebrow: tx(locale, { tr: "Ritüel döngü", en: "Ritual loop", ru: "Ритуал", th: "วงจรพิธีกรรม", es: "Bucle ritual", zh: "仪式循环" }),
    headline: pickEventText(locale, event.title, {
      tr: `${dayLabel} ${bucketLabel} — ${category} ritüelin`,
      en: `${dayLabel} ${bucketLabel} — your ${category} ritual`,
      ru: `${dayLabel} ${bucketLabel} — твой ритуал «${category}»`,
      th: `${dayLabel} ${bucketLabel} — พิธีกรรม ${category} ของคุณ`,
      es: `${dayLabel} ${bucketLabel} — tu ritual de ${category}`,
      zh: `${dayLabel}${bucketLabel} — 你的${category}仪式`,
    }),
    read: pickEventText(locale, event.summary, {
        tr: `${dayLabel} ${bucketLabel} saatlerinde ${category} harcaması ${repeatCount ?? "—"} kez tekrar etmiş. Bu kategoride harcamalarının ${formatPercent(regularity, "tr")}'i tam bu zamana denk geliyor.`,
        en: `On ${dayLabel} ${bucketLabel}, ${category} spending repeated ${repeatCount ?? "—"} times. ${formatPercent(regularity, "en")} of this category falls exactly in that window.`,
        ru: `В ${dayLabel} ${bucketLabel} траты на ${category} повторились ${repeatCount ?? "—"} раз. ${formatPercent(regularity, "ru")} этой категории приходится именно на это окно.`,
        th: `${dayLabel} ${bucketLabel} ค่าใช้จ่ายของ ${category} เกิดซ้ำ ${repeatCount ?? "—"} ครั้ง — ${formatPercent(regularity, "th")} ของหมวดนี้ตกในช่วงเวลานั้นพอดี`,
        es: `Los ${dayLabel} ${bucketLabel}, el gasto en ${category} se repiti\u00f3 ${repeatCount ?? "—"} veces. ${formatPercent(regularity, "es")} de esta categor\u00eda cae justo ah\u00ed.`,
        zh: `${dayLabel} ${bucketLabel}，${category} 类消费重复 ${repeatCount ?? "—"} 次。该类的 ${formatPercent(regularity, "zh")} 正好落在这个时段。`,
      }),
    humanLayer: tx(locale, {
      tr: "Bu bir düzen — iyi veya kötü değil, sadece bir ritim. Ritüeller beynin enerji tasarrufu yapma yoludur. Aynı gün ve saatte aynı şeyi yapmak, hayatın öngörülebilirliğine dair bir sinyaldir.",
      en: "This is a pattern — neither good nor bad, just a rhythm. Rituals are how the brain saves energy. Doing the same thing at the same hour signals that life is predictable.",
      ru: "Это узор — не хорошо и не плохо, просто ритм. Ритуалы — способ мозга экономить энергию. Делать одно и то же в один час — знак, что жизнь предсказуема.",
      th: "นี่คือรูปแบบ ไม่ใช่ดีหรือร้าย เพียงแค่จังหวะ พิธีกรรมคือวิธีที่สมองประหยัดพลัง การทำเรื่องเดียวกันในเวลาเดิม เป็นสัญญาณว่าชีวิตคาดเดาได้",
      es: "Es un patr\u00f3n — ni bueno ni malo, solo un ritmo. Los rituales ahorran energ\u00eda al cerebro. Hacer lo mismo a la misma hora dice: la vida es predecible.",
      zh: "这是一种模式 — 不分好坏，只是节奏。仪式是大脑省能的方式。在同一时段做同样的事，意味着生活是可预期的。",
    }),
    socialLayer: tx(locale, {
      tr: "Haftalık ritüeller genellikle sosyal çevrenin veya iş düzeninin yansımasıdır. Cuma akşamı dışarıda olmak, pazar kahvesi, salı market alışverişi — bireysel seçimden çok toplumsal yapının parçası.",
      en: "Weekly rituals usually mirror social circles or work cycles. Friday night out, Sunday coffee, Tuesday groceries — more about social structure than personal choice.",
      ru: "Еженедельные ритуалы — отражение круга общения или рабочего цикла. Пятница вечером, воскресный кофе, вторничный магазин — это часть структуры, а не выбор.",
      th: "พิธีกรรมรายสัปดาห์มักสะท้อนวงสังคมหรือรอบงาน เย็นวันศุกร์ออกไปข้างนอก กาแฟวันอาทิตย์ ตลาดวันอังคาร — เป็นส่วนของโครงสร้างสังคมมากกว่าทางเลือกส่วนตัว",
      es: "Los rituales semanales suelen reflejar c\u00edrculos sociales o ciclos laborales. Viernes noche, caf\u00e9 del domingo, compra del martes — m\u00e1s estructura social que elecci\u00f3n.",
      zh: "每周仪式往往映射着社交圈或工作周期。周五出门、周日咖啡、周二采购 — 多是社会结构的一部分，不只是个人选择。",
    }),
    support: tx(locale, {
      tr: "Bu ritmi tamamen kırmak yerine bir hafta farklı bir alternatif dene. Aynı ihtiyacı başka yolla karşılayabiliyor musun? Farkı hisset, sonra karar ver.",
      en: "Instead of breaking this fully, try an alternative for one week. Can you meet the same need differently? Feel the difference, then decide.",
      ru: "Не ломай ритм целиком — на неделю попробуй альтернативу. Удаётся закрыть ту же нужду иначе? Почувствуй разницу, потом решай.",
      th: "ไม่ต้องหยุดทั้งหมด ลองทางเลือกหนึ่งสัปดาห์ คุณตอบสนองความต้องการเดียวกันด้วยวิธีอื่นได้ไหม รู้สึกถึงความต่างก่อนจึงค่อยตัดสินใจ",
      es: "En lugar de romperlo del todo, prueba una alternativa por una semana. \u00bfPuedes cubrir la misma necesidad de otra forma? Siente la diferencia y decide.",
      zh: "不要全盘打破，先用一周试一种替代。能用别的方式满足同样的需要吗？感受差异后再做决定。",
    }),
    primaryAction: tx(locale, { tr: "Ritüeli bir kez farklı yap", en: "Try the ritual differently once", ru: "Сделай ритуал иначе один раз", th: "ลองทำพิธีกรรมแบบต่าง 1 ครั้ง", es: "Prueba el ritual distinto una vez", zh: "试着把仪式做一次不同的" }),
    secondaryAction: tx(locale, { tr: "Bu ritmin fişlerini göster", en: "Show this rhythm's receipts", ru: "Показать чеки ритма", th: "แสดงใบเสร็จของจังหวะนี้", es: "Ver recibos de este ritmo", zh: "查看该节奏的收据" }),
    proof: [
      { label: tx(locale, { tr: "Gün", en: "Day", ru: "День", th: "วัน", es: "D\u00eda", zh: "日" }), value: dayLabel },
      { label: tx(locale, { tr: "Zaman", en: "Time", ru: "Время", th: "เวลา", es: "Hora", zh: "时段" }), value: bucketLabel },
      { label: tx(locale, { tr: "Kategori", en: "Category", ru: "Категория", th: "หมวด", es: "Categor\u00eda", zh: "类别" }), value: category },
      { label: tx(locale, { tr: "Tekrar", en: "Repeat", ru: "Повторов", th: "ทำซ้ำ", es: "Repetici\u00f3n", zh: "重复" }), value: repeatCount !== null ? timesLabel(repeatCount, locale) : "—" },
      { label: tx(locale, { tr: "Haftada", en: "Per week", ru: "В неделю", th: "ต่อสัปดาห์", es: "Por semana", zh: "每周" }), value: weeklyRate !== null ? `~${Math.round(weeklyRate * 10) / 10}` : "—" },
      { label: tx(locale, { tr: "Düzenlilik", en: "Regularity", ru: "Регулярность", th: "ความสม่ำเสมอ", es: "Regularidad", zh: "规律性" }), value: formatPercent(regularity, locale) },
    ],
    confidenceLabel: formatPercent(event.confidence, locale, 0),
    counterEvidence: [
      tx(locale, {
        tr: "Bazı haftalık tekrarlar iş veya sosyal zorunluluk olabilir; hepsini kişisel ritüel olarak okumak hatalı olabilir.",
        en: "Some weekly repeats may be work or social obligations — not every one is a personal ritual.",
        ru: "Часть еженедельных повторений — это работа или обязательства, а не личный ритуал.",
        th: "การทำซ้ำรายสัปดาห์บางอย่างอาจเป็นงานหรือพันธะสังคม ไม่ใช่พิธีกรรมส่วนตัว",
        es: "Algunas repeticiones semanales son trabajo u obligaciones sociales — no todo es ritual personal.",
        zh: "部分每周重复可能是工作或社交义务，并非每次都是个人习惯。",
      }),
      tx(locale, {
        tr: "Mevsimsel değişiklikler (okul, tatil, spor sezonu) bu ritmi değiştirebilir; veri sadece mevcut dönemi temsil ediyor olabilir.",
        en: "Seasonal shifts (school, holidays, sports) can change this rhythm — the data may only reflect the current period.",
        ru: "Сезонные перемены (школа, праздники, спортсезон) меняют ритм — данные могут отражать лишь текущий период.",
        th: "การเปลี่ยนตามฤดู (โรงเรียน วันหยุด ฤดูกีฬา) อาจเปลี่ยนจังหวะนี้ ข้อมูลอาจสะท้อนเฉพาะช่วงปัจจุบัน",
        es: "Cambios estacionales (escuela, vacaciones) pueden alterar el ritmo — los datos quiz\u00e1 solo reflejen el periodo actual.",
        zh: "季节性变化（开学、假期、体育季）会改变这种节奏 — 数据可能只反映当前阶段。",
      }),
    ],
    suggestedExperiment: tx(locale, {
      tr: "Bir hafta boyunca bu ritüeli farklı bir gün veya saatte yap. Farkı hissediyor musun?",
      en: "For one week, do this ritual on a different day or hour. Do you feel the difference?",
      ru: "Неделю — сделай ритуал в другой день или час. Чувствуешь разницу?",
      th: "หนึ่งสัปดาห์ ทำพิธีกรรมนี้ในวันหรือเวลาอื่น คุณรู้สึกถึงความต่างไหม?",
      es: "Una semana: haz este ritual en otro d\u00eda u hora. \u00bfNotas la diferencia?",
      zh: "用一周，把这个仪式换到不同的天或时段。你能感受到不同吗？",
    }),
  };
}
