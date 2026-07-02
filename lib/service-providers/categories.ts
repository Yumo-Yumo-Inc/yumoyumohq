import type { YumoLocale, UserFacingText } from "@/lib/product-architecture/dashboard-contract";

export const SERVICE_CATEGORY_LABELS: Record<string, UserFacingText> = {
  electricity: { tr: "Elektrik", en: "Electricity", ru: "Электричество", th: "ไฟฟ้า", es: "Electricidad", zh: "电力" },
  water: { tr: "Su", en: "Water", ru: "Вода", th: "ค่าน้ำ", es: "Agua", zh: "用水" },
  gas: { tr: "Doğalgaz", en: "Natural gas", ru: "Газ", th: "ก๊าซธรรมชาติ", es: "Gas natural", zh: "天然气" },
  phone: { tr: "Telefon", en: "Phone", ru: "Телефон", th: "โทรศัพท์", es: "Teléfono", zh: "电话" },
  internet: { tr: "İnternet", en: "Internet", ru: "Интернет", th: "อินเทอร์เน็ต", es: "Internet", zh: "互联网" },
  streaming: { tr: "Yayın platformu", en: "Streaming", ru: "Стриминг", th: "สตรีมมิง", es: "Streaming", zh: "流媒体" },
  entertainment: { tr: "Eğlence", en: "Entertainment", ru: "Развлечения", th: "บันเทิง", es: "Entretenimiento", zh: "娱乐" },
  digital_subscription: { tr: "Dijital üyelik", en: "Digital subscription", ru: "Цифровая подписка", th: "สมาชิกดิจิทัล", es: "Suscripción digital", zh: "数字订阅" },
  other: { tr: "Diğer", en: "Other", ru: "Другое", th: "อื่นๆ", es: "Otros", zh: "其他" },
};

export const SERVICE_CATEGORY_ORDER = [
  "electricity",
  "water",
  "gas",
  "phone",
  "internet",
  "streaming",
  "entertainment",
  "digital_subscription",
  "other",
] as const;

export const SERVICE_CATEGORY_COLOR: Record<string, string> = {
  electricity: "text-[#fbbf24] bg-[#d97706]/14",
  water: "text-[#93c5fd] bg-[#3b82f6]/14",
  gas: "text-[#fb923c] bg-[#ea580c]/14",
  phone: "text-[#a3e635] bg-[#65a30d]/14",
  internet: "text-[#86efac] bg-[#22c55e]/14",
  streaming: "text-[#f9a8d4] bg-[#ec4899]/14",
  entertainment: "text-[#c4b5fd] bg-[#8b5cf6]/14",
  digital_subscription: "text-[#67e8f9] bg-[#06b6d4]/14",
  other: "text-white/70 bg-white/[0.06]",
};

export function categoryLabel(category: string, locale: YumoLocale): string {
  const label = SERVICE_CATEGORY_LABELS[category];
  if (!label) return category;
  return label[locale] || label.en || label.tr;
}
