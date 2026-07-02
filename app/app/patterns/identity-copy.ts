/**
 * Patterns page — localized copy + trait presentation.
 *
 * The API returns raw numbers; this layer turns them into localized prose and
 * supplies the visual identity (labels, accent colors) per trait. Evidence
 * sentences interpolate real counts — the only translated part is the frame,
 * so numbers never get fabricated or mistranslated.
 */

import type { Trait, TraitKey } from "@/lib/insights/identity/identity-types";

type Locale = "tr" | "en" | "ru" | "th" | "es" | "zh";
type Six = Record<Locale, string>;

const LOCALES: Locale[] = ["tr", "en", "ru", "th", "es", "zh"];

function lc(locale: string): Locale {
  return (LOCALES as string[]).includes(locale) ? (locale as Locale) : "en";
}

export function tx(locale: string, dict: Six): string {
  return dict[lc(locale)] ?? dict.en;
}

const NUMBER_LOCALE: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-US",
  ru: "ru-RU",
  th: "th-TH",
  es: "es-ES",
  zh: "zh-CN",
};

/** Locale-correct percent: TR puts the sign before the number. */
export function pct(value0to100: number, locale: string): string {
  const l = lc(locale);
  const n = Math.round(value0to100).toLocaleString(NUMBER_LOCALE[l]);
  return l === "tr" ? `%${n}` : `${n}%`;
}

export function num(value: number, locale: string): string {
  return Math.round(value).toLocaleString(NUMBER_LOCALE[lc(locale)]);
}

/** Fixed accent per trait — chosen to read on both light and dark surfaces.
 *  Distinct-per-trait by design (chart color rule), not theme tokens. */
export const TRAIT_ACCENT: Record<TraitKey, string> = {
  impulse: "#F97316", // orange
  hunter: "#C9A84C", // gold — deal value
  explorer: "#10B981", // emerald
  hedonist: "#EC4899", // pink
  loyal: "#8B5CF6", // violet
  planner: "#3B82F6", // blue
};

/** Short radar-axis label. */
export const TRAIT_LABEL: Record<TraitKey, Six> = {
  impulse: { tr: "Anlık", en: "Impulsive", ru: "Импульс", th: "ฉับพลัน", es: "Impulsivo", zh: "冲动" },
  hunter: { tr: "Avcı", en: "Hunter", ru: "Охотник", th: "นักล่า", es: "Cazador", zh: "猎手" },
  explorer: { tr: "Keşifçi", en: "Explorer", ru: "Исследователь", th: "นักสำรวจ", es: "Explorador", zh: "探索者" },
  hedonist: { tr: "Keyif", en: "Hedonist", ru: "Гедонист", th: "เสพสุข", es: "Hedonista", zh: "享乐" },
  loyal: { tr: "Sadık", en: "Loyal", ru: "Верный", th: "ภักดี", es: "Leal", zh: "忠诚" },
  planner: { tr: "Planlı", en: "Planner", ru: "Плановик", th: "วางแผน", es: "Planificador", zh: "计划型" },
};

/** Noun used to build the class name, e.g. "Keşifçi-Avcı". */
const TRAIT_NOUN: Record<TraitKey, Six> = {
  impulse: { tr: "Anlıkçı", en: "Impulse", ru: "Импульсивный", th: "สายฉับพลัน", es: "Impulsivo", zh: "冲动派" },
  hunter: { tr: "Avcı", en: "Hunter", ru: "Охотник", th: "นักล่า", es: "Cazador", zh: "猎手" },
  explorer: { tr: "Keşifçi", en: "Explorer", ru: "Искатель", th: "นักสำรวจ", es: "Explorador", zh: "探索者" },
  hedonist: { tr: "Keyifçi", en: "Hedonist", ru: "Гедонист", th: "สายเสพสุข", es: "Hedonista", zh: "享乐家" },
  loyal: { tr: "Sadık", en: "Loyalist", ru: "Верный", th: "สายภักดี", es: "Leal", zh: "忠实派" },
  planner: { tr: "Planlı", en: "Planner", ru: "Плановик", th: "นักวางแผน", es: "Planificador", zh: "计划家" },
};

export function className(classKeys: [TraitKey, TraitKey], locale: string): string {
  return `${tx(locale, TRAIT_NOUN[classKeys[0]])}-${tx(locale, TRAIT_NOUN[classKeys[1]])}`;
}

/** One-line tagline composed from the two defining traits. */
export function classTagline(classKeys: [TraitKey, TraitKey], locale: string): string {
  const a = tx(locale, TRAIT_LABEL[classKeys[0]]).toLocaleLowerCase(NUMBER_LOCALE[lc(locale)]);
  const b = tx(locale, TRAIT_LABEL[classKeys[1]]).toLocaleLowerCase(NUMBER_LOCALE[lc(locale)]);
  return tx(locale, {
    tr: `Harcamanı en çok "${a}" ve "${b}" yanların tanımlıyor.`,
    en: `Your spending is defined most by your "${a}" and "${b}" sides.`,
    ru: `Твои траты больше всего определяют стороны «${a}» и «${b}».`,
    th: `การใช้จ่ายของคุณถูกกำหนดด้วยด้าน "${a}" และ "${b}" มากที่สุด`,
    es: `Tu gasto se define sobre todo por tus lados "${a}" y "${b}".`,
    zh: `你的消费最受“${a}”和“${b}”两面影响。`,
  });
}

/**
 * "Why?" evidence for a trait, built from its raw counts. Returns null when the
 * trait has no data (the UI shows an empty hint instead).
 */
export function evidenceText(trait: Trait, locale: string): string | null {
  const e = trait.evidence;
  switch (trait.key) {
    case "impulse": {
      if (!e.impulse) return null;
      return tx(locale, {
        tr: `Harcamanın ${pct(e.impulse.weekendNightShare * 100, "tr")}'i hafta sonu ya da akşam/gece.`,
        en: `${pct(e.impulse.weekendNightShare * 100, "en")} of your spend lands on weekends or evening/night.`,
        ru: `${pct(e.impulse.weekendNightShare * 100, "ru")} трат приходится на выходные или вечер/ночь.`,
        th: `${pct(e.impulse.weekendNightShare * 100, "th")} ของการใช้จ่ายอยู่ในวันหยุดหรือช่วงเย็น/กลางคืน`,
        es: `El ${pct(e.impulse.weekendNightShare * 100, "es")} de tu gasto cae en fines de semana o noche.`,
        zh: `你有 ${pct(e.impulse.weekendNightShare * 100, "zh")} 的消费发生在周末或傍晚/夜间。`,
      });
    }
    case "hunter": {
      if (!e.hunter) return null;
      return tx(locale, {
        tr: `${num(e.hunter.totalItems, "tr")} kalemin ${num(e.hunter.discountedItems, "tr")}'i indirimliydi.`,
        en: `${num(e.hunter.discountedItems, "en")} of ${num(e.hunter.totalItems, "en")} items were on discount.`,
        ru: `${num(e.hunter.discountedItems, "ru")} из ${num(e.hunter.totalItems, "ru")} позиций были со скидкой.`,
        th: `${num(e.hunter.discountedItems, "th")} จาก ${num(e.hunter.totalItems, "th")} รายการมีส่วนลด`,
        es: `${num(e.hunter.discountedItems, "es")} de ${num(e.hunter.totalItems, "es")} artículos con descuento.`,
        zh: `${num(e.hunter.totalItems, "zh")} 件中有 ${num(e.hunter.discountedItems, "zh")} 件是打折买的。`,
      });
    }
    case "explorer": {
      if (!e.explorer) return null;
      return tx(locale, {
        tr: `Bu dönemde ${num(e.explorer.newMerchants, "tr")} yeni mekân keşfettin.`,
        en: `You discovered ${num(e.explorer.newMerchants, "en")} new places this period.`,
        ru: `За период ты открыл ${num(e.explorer.newMerchants, "ru")} новых мест.`,
        th: `ช่วงนี้คุณค้นพบสถานที่ใหม่ ${num(e.explorer.newMerchants, "th")} แห่ง`,
        es: `Descubriste ${num(e.explorer.newMerchants, "es")} lugares nuevos este periodo.`,
        zh: `这段时间你发现了 ${num(e.explorer.newMerchants, "zh")} 个新地方。`,
      });
    }
    case "hedonist": {
      if (!e.hedonist) return null;
      return tx(locale, {
        tr: `Hedonik harcaman ${pct(e.hedonist.hedonicShare * 100, "tr")} (kafe, tatlı, eğlence).`,
        en: `${pct(e.hedonist.hedonicShare * 100, "en")} of your spend is hedonic (cafés, treats, fun).`,
        ru: `${pct(e.hedonist.hedonicShare * 100, "ru")} трат — гедонистические (кафе, сладкое, развлечения).`,
        th: `${pct(e.hedonist.hedonicShare * 100, "th")} ของการใช้จ่ายเป็นการเสพสุข (คาเฟ่ ของหวาน ความบันเทิง)`,
        es: `El ${pct(e.hedonist.hedonicShare * 100, "es")} de tu gasto es hedónico (cafés, dulces, ocio).`,
        zh: `你有 ${pct(e.hedonist.hedonicShare * 100, "zh")} 的消费偏享乐（咖啡、甜点、娱乐）。`,
      });
    }
    case "loyal": {
      if (!e.loyal) return null;
      const top = e.loyal.topMerchantName;
      return tx(locale, {
        tr: `Ziyaretlerinin ${pct((trait.value ?? 0), "tr")}'i birkaç yerde${top ? ` (${top} başta)` : ""} yoğunlaşıyor.`,
        en: `${pct(trait.value ?? 0, "en")} of your visits cluster in a few places${top ? ` (led by ${top})` : ""}.`,
        ru: `${pct(trait.value ?? 0, "ru")} визитов сосредоточены в нескольких местах${top ? ` (во главе с ${top})` : ""}.`,
        th: `${pct(trait.value ?? 0, "th")} ของการไปร้านกระจุกอยู่ไม่กี่แห่ง${top ? ` (นำโดย ${top})` : ""}`,
        es: `El ${pct(trait.value ?? 0, "es")} de tus visitas se concentra en pocos lugares${top ? ` (liderado por ${top})` : ""}.`,
        zh: `你有 ${pct(trait.value ?? 0, "zh")} 的到访集中在少数几个地方${top ? `（以 ${top} 为主）` : ""}。`,
      });
    }
    case "planner": {
      if (!e.planner) return null;
      return tx(locale, {
        tr: `Temel harcama payın ${pct(e.planner.essentialShare * 100, "tr")}; sepetin düzenli.`,
        en: `Essentials are ${pct(e.planner.essentialShare * 100, "en")} of your spend; your basket is steady.`,
        ru: `Базовые покупки — ${pct(e.planner.essentialShare * 100, "ru")} трат; корзина стабильна.`,
        th: `ของจำเป็นคิดเป็น ${pct(e.planner.essentialShare * 100, "th")} ของการใช้จ่าย ตะกร้าของคุณสม่ำเสมอ`,
        es: `Los básicos son el ${pct(e.planner.essentialShare * 100, "es")} de tu gasto; tu cesta es estable.`,
        zh: `必需品占你消费的 ${pct(e.planner.essentialShare * 100, "zh")}，购物篮很稳定。`,
      });
    }
    default:
      return null;
  }
}

export function emptyTraitHint(key: TraitKey, locale: string): string {
  const hints: Record<TraitKey, Six> = {
    impulse: {
      tr: "Saat kalıbı için farklı zamanlarda fiş gerekiyor.",
      en: "Time patterns need receipts from different hours.",
      ru: "Для паттерна времени нужны чеки в разные часы.",
      th: "ต้องมีใบเสร็จหลายช่วงเวลาเพื่อดูรูปแบบ",
      es: "El patrón de hora necesita recibos de distintos momentos.",
      zh: "时间规律需要不同时段的收据。",
    },
    hunter: {
      tr: "İndirim kalemleri biriktikçe netleşir.",
      en: "Clears up as discounted items accumulate.",
      ru: "Прояснится по мере накопления скидочных позиций.",
      th: "จะชัดเมื่อมีรายการลดราคามากขึ้น",
      es: "Se aclara a medida que se acumulan artículos en oferta.",
      zh: "随着打折商品累积会更清晰。",
    },
    explorer: {
      tr: "Yeni mekânları gördükçe oluşur.",
      en: "Builds as you visit new places.",
      ru: "Формируется по мере новых мест.",
      th: "ก่อตัวเมื่อคุณไปที่ใหม่ ๆ",
      es: "Se forma al visitar lugares nuevos.",
      zh: "随着你去新地方而形成。",
    },
    hedonist: {
      tr: "Kategori verisi biriktikçe görünür.",
      en: "Appears as category data builds.",
      ru: "Появится по мере данных о категориях.",
      th: "จะปรากฏเมื่อมีข้อมูลหมวดหมู่",
      es: "Aparece a medida que crecen los datos de categoría.",
      zh: "随着分类数据积累而显现。",
    },
    loyal: {
      tr: "Mekân tekrarı oluştukça belirir.",
      en: "Shows up as repeat visits form.",
      ru: "Проявляется при повторных визитах.",
      th: "จะปรากฏเมื่อมีการไปซ้ำ",
      es: "Aparece cuando hay visitas repetidas.",
      zh: "出现于重复到访形成时。",
    },
    planner: {
      tr: "Birkaç fiş daha gelince hesaplanır.",
      en: "Computes once a few more receipts arrive.",
      ru: "Рассчитается после нескольких чеков.",
      th: "คำนวณเมื่อมีใบเสร็จเพิ่ม",
      es: "Se calcula con algunos recibos más.",
      zh: "再有几张收据后即可计算。",
    },
  };
  return tx(locale, hints[key]);
}

/** Static UI strings for the page. */
export const UI = {
  eyebrow: { tr: "Yaşam · Kimliğin", en: "Life · Your identity", ru: "Жизнь · Твоя личность", th: "ชีวิต · ตัวตนของคุณ", es: "Vida · Tu identidad", zh: "生活 · 你的身份" } as Six,
  whyHint: { tr: "sınıfını oluşturan özelliklere dokun", en: "tap the traits that shape your class", ru: "нажми на черты, формирующие твой класс", th: "แตะคุณลักษณะที่กำหนดคลาสของคุณ", es: "toca los rasgos que definen tu clase", zh: "点按定义你类型的特质" } as Six,
  share: { tr: "Kimlik kartını paylaş", en: "Share your identity card", ru: "Поделиться карточкой", th: "แชร์การ์ดตัวตน", es: "Comparte tu tarjeta", zh: "分享身份卡" } as Six,
  why: { tr: "neden?", en: "why?", ru: "почему?", th: "ทำไม?", es: "¿por qué?", zh: "为什么？" } as Six,
  evidence: { tr: "Kanıt", en: "Evidence", ru: "Доказательство", th: "หลักฐาน", es: "Evidencia", zh: "证据" } as Six,
  notEnoughTitle: { tr: "Kimliğini okumak için biraz daha fiş lazım", en: "A few more receipts to read your identity", ru: "Нужно ещё немного чеков", th: "ต้องมีใบเสร็จเพิ่มอีกหน่อย", es: "Faltan algunos recibos más", zh: "还需要几张收据" } as Six,
  notEnoughBody: { tr: "Tarayıp besledikçe sınıfın ve radarın gerçek harcamandan oluşur. Uydurma yok — yeterli veri olunca açılır.", en: "As you scan, your class and radar form from real spending. Nothing fabricated — it unlocks with enough data.", ru: "По мере сканирования класс и радар строятся из реальных трат. Ничего выдуманного.", th: "เมื่อคุณสแกน คลาสและเรดาร์จะสร้างจากการใช้จ่ายจริง ไม่มีการกุข้อมูล", es: "Al escanear, tu clase y radar se forman con gasto real. Nada inventado.", zh: "随着扫描，你的类型与雷达由真实消费生成，绝不编造。" } as Six,
  // Tribe
  tribeEyebrow: { tr: "Tribün · Bu hafta", en: "Tribe · This week", ru: "Племя · На этой неделе", th: "เผ่า · สัปดาห์นี้", es: "Tribu · Esta semana", zh: "部落 · 本周" } as Six,
  tribeEmptyTitle: { tr: "Bu sınıfta şehrinde ilk sensin", en: "You're the first of your class here", ru: "Ты первый своего класса в городе", th: "คุณเป็นคนแรกของคลาสนี้ในเมือง", es: "Eres el primero de tu clase aquí", zh: "你是本市同类中的第一人" } as Six,
  tribeEmptyBody: { tr: "Aynı sınıftan biri daha çıktığında tribünün, sıralaman ve sevdiğiniz yerler burada belirir. Sayı uydurmuyoruz — gerçek kohort oluşunca gösteririz.", en: "When one more person shares your class, your tribe, standing, and shared places appear here. We don't invent numbers — we show the real cohort as it forms.", ru: "Как только появится ещё один человек твоего класса, здесь возникнут племя, рейтинг и общие места. Числа не выдумываем.", th: "เมื่อมีคนคลาสเดียวกันเพิ่มอีกคน เผ่า อันดับ และสถานที่ร่วมจะปรากฏที่นี่ เราไม่กุตัวเลข", es: "Cuando otra persona comparta tu clase, aquí aparecerán tu tribu, posición y lugares. No inventamos cifras.", zh: "当再有一位同类出现时，你的部落、排名和共同地点会显示在此。我们不编造数字。" } as Six,
  discoveryEyebrow: { tr: "Tribün · Keşifler", en: "Tribe · Discoveries", ru: "Племя · Открытия", th: "เผ่า · การค้นพบ", es: "Tribu · Descubrimientos", zh: "部落 · 发现" } as Six,
  discoveryTitle: { tr: "Tribünün sevdiği yerler", en: "Places your tribe loves", ru: "Места, которые любит племя", th: "สถานที่ที่เผ่าชอบ", es: "Lugares que ama tu tribu", zh: "你的部落喜爱的地方" } as Six,
  visitors: { tr: "tribü üyesi", en: "tribe members", ru: "участников", th: "สมาชิกเผ่า", es: "miembros", zh: "位成员" } as Six,
  inYourTribe: { tr: "senin tribünde", en: "in your tribe", ru: "в твоём племени", th: "ในเผ่าของคุณ", es: "en tu tribu", zh: "在你的部落" } as Six,
  inCity: { tr: "şehrinde", en: "in your city", ru: "в твоём городе", th: "ในเมืองของคุณ", es: "en tu ciudad", zh: "在你的城市" } as Six,
  you: { tr: "SEN", en: "YOU", ru: "ТЫ", th: "คุณ", es: "TÚ", zh: "你" } as Six,
  newPlaces: { tr: "yeni yer", en: "new places", ru: "новых мест", th: "ที่ใหม่", es: "lugares nuevos", zh: "个新地方" } as Six,
  leaderboardTitle: { tr: "Bu haftanın Keşifçileri", en: "This week's Explorers", ru: "Исследователи недели", th: "นักสำรวจประจำสัปดาห์", es: "Exploradores de la semana", zh: "本周探索者" } as Six,
  range30: { tr: "30g", en: "30d", ru: "30д", th: "30ว", es: "30d", zh: "30天" } as Six,
  range90: { tr: "90g", en: "90d", ru: "90д", th: "90ว", es: "90d", zh: "90天" } as Six,
  rangeAll: { tr: "Tüm", en: "All", ru: "Все", th: "ทั้งหมด", es: "Todo", zh: "全部" } as Six,
  shareCaption: { tr: "Harcama kimliğim", en: "My spending identity", ru: "Моя личность трат", th: "ตัวตนการใช้จ่ายของฉัน", es: "Mi identidad de gasto", zh: "我的消费身份" } as Six,
  // Share-card flow
  shareTitle: { tr: "Kartını paylaş", en: "Share your card", ru: "Поделись карточкой", th: "แชร์การ์ดของคุณ", es: "Comparte tu tarjeta", zh: "分享你的卡片" } as Six,
  shareDo: { tr: "Paylaş", en: "Share", ru: "Поделиться", th: "แชร์", es: "Compartir", zh: "分享" } as Six,
  shareDownload: { tr: "İndir", en: "Download", ru: "Скачать", th: "ดาวน์โหลด", es: "Descargar", zh: "下载" } as Six,
  shareBuilding: { tr: "Kart hazırlanıyor…", en: "Building your card…", ru: "Готовим карточку…", th: "กำลังสร้างการ์ด…", es: "Creando tu tarjeta…", zh: "正在生成卡片…" } as Six,
  shareError: { tr: "Kart oluşturulamadı", en: "Could not build the card", ru: "Не удалось создать карточку", th: "สร้างการ์ดไม่สำเร็จ", es: "No se pudo crear la tarjeta", zh: "无法生成卡片" } as Six,
  // Public share page (/i/<token>)
  sharePageLead: { tr: "Bir Yumo Yumo kullanıcısının harcama kimliği", en: "A Yumo Yumo user's spending identity", ru: "Личность трат пользователя Yumo Yumo", th: "ตัวตนการใช้จ่ายของผู้ใช้ Yumo Yumo", es: "La identidad de gasto de un usuario de Yumo Yumo", zh: "一位 Yumo Yumo 用户的消费身份" } as Six,
  sharePageCta: { tr: "Kendi kimliğini keşfet", en: "Discover your own", ru: "Узнай свою", th: "ค้นพบตัวตนของคุณ", es: "Descubre la tuya", zh: "发现你的身份" } as Six,
};

export type IdentityRange = "30d" | "90d" | "all";
