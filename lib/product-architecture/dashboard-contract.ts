import { buildLocaleCopy, dashboardMessages } from "./dashboard-locale-loader";

export type YumoLocale = "tr" | "en" | "ru" | "th" | "es" | "zh";

export type Daypart = "morning" | "noon" | "evening";

export type UserFacingText = {
  tr: string;
  en: string;
} & Partial<Record<Exclude<YumoLocale, "tr" | "en">, string>>;

/**
 * UserFacingText factory that takes all locales in a single call.
 * Argument order: tr, en, ru, th, es, zh — matches the `byLocale` helper elsewhere in the project.
 */
export function uft(tr: string, en: string, ru: string, th: string, es: string, zh: string): UserFacingText {
  return { tr, en, ru, th, es, zh };
}

export type CompanionAction =
  | { kind: "external_search"; label: UserFacingText; query: string }
  | { kind: "internal_route"; label: UserFacingText; href: string }
  | { kind: "chat"; label: UserFacingText; href: string }
  | { kind: "reminder"; label: UserFacingText; href: string };

export type YumbieProductCandidate = {
  name: string;
  kind: string;
  heroEligible: boolean;
  heroMode: "recipe_search" | "none";
  heroQuery: string | null;
};

export type YumbieMoment = {
  greeting: UserFacingText;
  opening: UserFacingText;
  context: UserFacingText;
  chips: UserFacingText[];
  primaryAction?: CompanionAction;
  secondaryAction?: CompanionAction;
};

const DASHBOARD_COPY_TR = {
  financialOs: "",
  notifications: "BİLDİRİMLER",
  unread: "okunmamış",
  markAllRead: "Tümünü okundu yap",
  noNotificationsTitle: "Yeni bildirim yok.",
  noNotificationsBody: "Günün notları ve hesap hareketleri geldiğinde burada görünecek.",
  notificationCenter: "Bildirim merkezine git",
  newNotification: "Yeni bildirim",
  rhythmEyebrow: "Bu hafta",
  thisWeek: "Bu Hafta",
  todayEyebrow: "Günün notları",
  todaysEvents: "Günün olayları",
  noEventsTitle: "Bugün için yeni kayıt yok.",
  noEventsBody: "Takvim, fatura, yolculuk ve etkinlik notları geldikçe burada görünür.",
  platformEyebrow: "Yumo öğreniyor",
  platform: "",
  live: "",
  profileEyebrow: "Merhaba",
  level: "LEVEL",
  xpThreshold: "eşik",
  shoppingEyebrow: "Alışveriş",
  shoppingTitle: "Alışveriş listesi",
  shoppingEmptyTitle: "Alışveriş listen şimdilik boş",
  shoppingEmptyBody: "Fiş taramaya başladığında Yumo burayı senin için dolduracak",
  shoppingHint: "Listeye eklemeye uygun görünüyor.",
  listCandidate: "Liste adayı",
  todayNote: "Bugün",
  contributionScore: "Katkı puanı",
  total: "toplam",
  items: "ürün",
  notes: "not",
  addProfilePhoto: "Profil fotoğrafı ekle",
  home: "Bugün",
  scan: "Fiş Tara",
  myWorld: "Dünyam",
  social: "Arkadaşlar",
  web3: "Web3",
  verifyEyebrow: "Workhub",
  verifyTitle: "Vizyona katkıda bulun, ödüller kazan",
  verifyBody: "Yumo'nun merkeziyetsiz fiyat verisi vizyonuna katkı sağla. Her kontrol ağı keskinleştirir, her keskinleşme ödüller getirir.",
  verifyPending: "bekliyor",
  verifyMore: "Daha gör",
  verifyEmptyTitle: "Şu an doğrulanacak görev yok",
  verifyEmptyBody: "Yumo yeni fişler eklendikçe burayı dolduracak.",
  verifyQuotaUsed: "Bugün",
  verifyQuotaRemaining: "doğrulama hakkı",
  verifyConfirm: "Evet, doğru",
  verifyReject: "Hayır, farklı",
  verifySkip: "Bilmiyorum, atla",
  verifyCorrectTitle: "Doğrusu nedir?",
  verifyCorrectHint: "Fişteki işletmenin tam adını yaz",
  verifyCorrectSave: "Kaydet ve devam et",
  verifySimilar: "Benzer işletmeler — dokun, otomatik doldur",
  servicesEyebrow: "Hizmet sağlayıcılarım",
  servicesTitle: "Aboneliklerim & faturalarım",
  servicesAdd: "+ Ekle",
  servicesEmptyTitle: "Henüz sağlayıcı eklemedin",
  servicesEmptyBody: "Elektrik, internet, dijital üyelik gibi tekrar eden hizmetlerini ekle, Yumo seni vadelere göre uyarsın.",
  servicesReminderHint: "Vade tarihinden 3 ve 1 gün önce hatırlatma gelir",
  servicesDayCounter: "gün",
  servicesUpcomingTitle: "Yaklaşan ödemeler",
  servicesAddTitle: "Hizmet sağlayıcı ekle",
  servicesStepCategory: "1 · Kategori",
  servicesStepName: "2 · Sağlayıcı adı",
  servicesStepNameHint: "Markayı sen seçersin — Yumo logoları toplamaz, sadece adını saklar",
  servicesStepDay: "3 · Ödeme günü",
  servicesStepReminder: "4 · Hatırlatma",
  servicesPaymentDayLabel: "Her ayın",
  servicesReminder3: "3 gün önce",
  servicesReminder1: "1 gün önce",
  servicesReminderSameDay: "Aynı gün sabah",
  servicesSubmit: "Ekle ve hatırlat",
  shoppingListAdd: "+ Ekle",
  shoppingItemPlaceholder: "Yeni ürün ekle...",
  shoppingItemSave: "Ekle",
  shoppingHintMatch: "Listene fiş yüklediğinde Yumo otomatik eşler ve marketler arası fark gösterir",
  todayMicroEyebrow: "Bugünün hamlesi",
  todayMicroAddReceipt: "İlk fişini ekle",
  todayMicroSeconds: "sn",
  todayMicroContribution: "katkı",
} as const;

const DASHBOARD_COPY_EN = {
  financialOs: "FINANCIAL OS",
  notifications: "NOTIFICATIONS",
  unread: "unread",
  markAllRead: "Mark all as read",
  noNotificationsTitle: "No new notifications.",
  noNotificationsBody: "Daily notes and account movement will appear here.",
  notificationCenter: "Open notification center",
  newNotification: "New notification",
  rhythmEyebrow: "This week",
  thisWeek: "This Week",
  todayEyebrow: "Today's notes",
  todaysEvents: "Today",
  noEventsTitle: "Nothing new for today.",
  noEventsBody: "Calendar, bill, travel, and event notes will appear here.",
  platformEyebrow: "Yumo learns",
  platform: "",
  live: "",
  profileEyebrow: "Hello",
  level: "LEVEL",
  xpThreshold: "threshold",
  shoppingEyebrow: "Shopping",
  shoppingTitle: "Shopping list",
  shoppingEmptyTitle: "Your shopping list is empty for now",
  shoppingEmptyBody: "When you start scanning receipts, Yumo will fill this in for you",
  shoppingHint: "Looks suitable for your list.",
  listCandidate: "List candidate",
  todayNote: "Today",
  contributionScore: "Contribution score",
  total: "total",
  items: "items",
  notes: "notes",
  addProfilePhoto: "Add profile photo",
  home: "Today",
  scan: "Scan",
  myWorld: "My World",
  social: "Friends",
  web3: "Web3",
  verifyEyebrow: "Workhub",
  verifyTitle: "Contribute to the vision, earn prizes",
  verifyBody: "Help build Yumo's decentralized price intelligence. Each verification sharpens the network — and earns prizes along the way.",
  verifyPending: "pending",
  verifyMore: "See more",
  verifyEmptyTitle: "No tasks to verify right now",
  verifyEmptyBody: "Yumo will fill this in as new receipts arrive.",
  verifyQuotaUsed: "Today",
  verifyQuotaRemaining: "verifications left",
  verifyConfirm: "Yes, correct",
  verifyReject: "No, different",
  verifySkip: "Don't know, skip",
  verifyCorrectTitle: "What's the correct one?",
  verifyCorrectHint: "Type the merchant's full name as on the receipt",
  verifyCorrectSave: "Save and continue",
  verifySimilar: "Similar merchants — tap to autofill",
  servicesEyebrow: "My service providers",
  servicesTitle: "Subscriptions & bills",
  servicesAdd: "+ Add",
  servicesEmptyTitle: "No providers yet",
  servicesEmptyBody: "Add recurring services like electricity, internet, or digital subscriptions and Yumo will remind you of due dates.",
  servicesReminderHint: "Reminders arrive 3 and 1 days before due date",
  servicesDayCounter: "days",
  servicesUpcomingTitle: "Upcoming payments",
  servicesAddTitle: "Add service provider",
  servicesStepCategory: "1 · Category",
  servicesStepName: "2 · Provider name",
  servicesStepNameHint: "You pick the brand — Yumo doesn't collect logos, only stores the name you write",
  servicesStepDay: "3 · Payment day",
  servicesStepReminder: "4 · Reminder",
  servicesPaymentDayLabel: "Day of month",
  servicesReminder3: "3 days before",
  servicesReminder1: "1 day before",
  servicesReminderSameDay: "Morning of due date",
  servicesSubmit: "Add and remind",
  shoppingListAdd: "+ Add",
  shoppingItemPlaceholder: "New item...",
  shoppingItemSave: "Add",
  shoppingHintMatch: "When you upload a receipt, Yumo auto-matches your list and shows price differences across stores",
  todayMicroEyebrow: "Today's move",
  todayMicroAddReceipt: "Add your first receipt",
  todayMicroSeconds: "sec",
  todayMicroContribution: "contribution",
} as const;

type DashboardCopy = { [K in keyof typeof DASHBOARD_COPY_EN]: string };

export const DASHBOARD_COPY: Record<YumoLocale, DashboardCopy> = {
  tr: DASHBOARD_COPY_TR,
  en: DASHBOARD_COPY_EN,
  ru: buildLocaleCopy(DASHBOARD_COPY_EN, dashboardMessages.ru),
  th: buildLocaleCopy(DASHBOARD_COPY_EN, dashboardMessages.th),
  es: buildLocaleCopy(DASHBOARD_COPY_EN, dashboardMessages.es),
  zh: buildLocaleCopy(DASHBOARD_COPY_EN, dashboardMessages.zh),
};

export const DASHBOARD_WEEKDAYS: Record<YumoLocale, string[]> = {
  tr: ["PT", "SA", "ÇA", "PE", "CU", "CT", "PZ"],
  en: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
  ru: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
  th: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
  es: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
  zh: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
};

const UNSAFE_USER_TEXT_PATTERNS = [
  /\b(receipt verified|verified receipt|impulse window|category drift|own price track|past self)\b/i,
  /\b(restaurant category|alcohol category|merchant category)\b/i,
  /\b(restaurant|alcohol|impulse|debug|snake_case)\b/i,
  /[a-z]+_[a-z0-9_]+/i,
  /[a-z]+\d|\d[a-z]+/i,
  /[ÂÃÄÅ�]/,
];

export function pickText(text: UserFacingText, locale: YumoLocale): string {
  return text[locale] || text.en || text.tr;
}

export function hasUnsafeUserFacingText(value: string | null | undefined): boolean {
  const text = String(value ?? "").trim();
  if (!text) return false;
  return UNSAFE_USER_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function safeUserText(
  value: string | null | undefined,
  fallback: UserFacingText,
  locale: YumoLocale
): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text || hasUnsafeUserFacingText(text)) return pickText(fallback, locale);
  return text;
}

export function getDaypart(date = new Date()): Daypart {
  const hour = date.getHours();
  if (hour < 11) return "morning";
  if (hour < 17) return "noon";
  return "evening";
}

export function buildYoutubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function cleanProductNameForHero(product: YumbieProductCandidate): string | null {
  if (!product.heroEligible || product.kind !== "prepared_meal" || product.heroMode !== "recipe_search") return null;
  if (!product.name || hasUnsafeUserFacingText(product.name)) return null;
  if (!product.heroQuery || hasUnsafeUserFacingText(product.heroQuery)) return null;
  return product.name;
}

export function buildYumbieMoment(input: {
  daypart: Daypart;
  firstName: string;
  product?: YumbieProductCandidate;
  eventTitle?: string | null;
}): YumbieMoment {
  const greetingByDaypart: Record<Daypart, UserFacingText> = {
    morning: uft("Günaydın", "Good morning", "Доброе утро", "อรุณสวัสดิ์", "Buenos días", "早上好"),
    noon: uft("İyi günler", "Good afternoon", "Добрый день", "สวัสดีตอนบ่าย", "Buenas tardes", "下午好"),
    evening: uft("İyi akşamlar", "Good evening", "Добрый вечер", "สวัสดีตอนเย็น", "Buenas noches", "晚上好"),
  };

  void cleanProductNameForHero;
  void hasUnsafeUserFacingText;
  void input.product;
  void input.eventTitle;

  // Trim first name; keep within 42-char headline budget when prefixed.
  const name = input.firstName?.trim() ?? "";
  const opening: UserFacingText = name
    ? uft(
        `${name}, hazırım.`,
        `${name}, I'm ready.`,
        `${name}, я готов.`,
        `${name}, ฉันพร้อมแล้ว`,
        `${name}, estoy listo.`,
        `${name}, 我准备好了。`,
      )
    : uft(
        "Hazırım.",
        "I'm ready.",
        "Я готов.",
        "ฉันพร้อมแล้ว",
        "Estoy listo.",
        "我准备好了。",
      );

  return {
    greeting: greetingByDaypart[input.daypart],
    opening,
    context: uft(
      "İlk fişini at, günün ne diyor bakalım.",
      "Drop your first receipt and let's see what today's about.",
      "Кинь первый чек, посмотрим, что говорит день.",
      "ส่งใบเสร็จแรกมา มาดูกันว่าวันนี้เป็นอย่างไร",
      "Tira tu primer recibo y veamos qué cuenta el día.",
      "把第一张收据丢过来，看看今天怎么样。",
    ),
    chips: [],
    primaryAction: {
      kind: "internal_route",
      label: uft("Fiş ekle", "Add receipt", "Добавить чек", "เพิ่มใบเสร็จ", "Agregar recibo", "添加收据"),
      href: "/app/upload",
    },
  };
}
