export type Lang = "tr" | "en" | "es" | "ru" | "zh" | "th";

export const SUPPORTED_LANGS: { code: Lang; label: string; nativeLabel: string }[] = [
  { code: "tr", label: "TR", nativeLabel: "Türkçe" },
  { code: "en", label: "EN", nativeLabel: "English" },
  { code: "es", label: "ES", nativeLabel: "Español" },
  { code: "ru", label: "RU", nativeLabel: "Русский" },
  { code: "zh", label: "ZH", nativeLabel: "中文" },
  { code: "th", label: "TH", nativeLabel: "ไทย" },
];

export const LANG_TO_LOCALE: Record<Lang, string> = {
  tr: "tr-TR",
  en: "en-US",
  es: "es-ES",
  ru: "ru-RU",
  zh: "zh-CN",
  th: "th-TH",
};

type TranslationShape = {
  headerLabel: string;
  welcome: string;
  subtitle: string;
  stepIndicator: (current: number, total: number) => string;
  savingLabel: string;
  genericError: string;
  next: string;
  back: string;
  skip: string;
  finish: string;
  doneTitle: string;
  doneSubtitle: string;
  goToApp: string;

  personalInfoTitle: string;
  personalInfoSubtitle: string;
  displayNameLabel: string;
  displayNamePlaceholder: string;
  displayNameRequired: string;
  ageLabel: string;
  agePlaceholder: string;
  genderLabel: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  countryLabel: string;
  countryPlaceholder: string;

  financialTitle: string;
  financialSubtitle: string;
  incomeLabel: string;
  incomePlaceholder: string;
  incomeUnder: (amount: string) => string;
  incomeOver: (amount: string) => string;
  incomeRange: (lo: string, hi: string) => string;
  incomeSelectCountryHint: string;

  whyYumoTitle: string;
  whyYumoSubtitle: string;
  reason_fin_track: string;
  reason_min_goals: string;
  reason_fin_budget: string;
  reason_min_habits: string;
  reason_fin_save: string;
  reason_com_motivation: string;
  reason_min_freedom: string;

  yumbieSettingsTitle: string;
  yumbieSettingsSubtitle: string;
  toneLabel: string;
  toneWarm: string;
  toneWarmDesc: string;
  toneProfessional: string;
  toneProfessionalDesc: string;
  toneEnergetic: string;
  toneEnergeticDesc: string;
  notificationLabel: string;
  notifImportant: string;
  notifImportantDesc: string;
  notifDaily: string;
  notifDailyDesc: string;
  notifFrequent: string;
  notifFrequentDesc: string;
};

export const TRANSLATIONS: Record<Lang, TranslationShape> = {
  tr: {
    headerLabel: "Kişiselleştirme",
    welcome: "Hoş geldin",
    subtitle: "Yumo Yumo deneyimini sana göre ayarlayalım.",
    stepIndicator: (c, t) => `Adım ${c} / ${t}`,
    savingLabel: "Kaydediliyor...",
    genericError: "Bir sorun oluştu. Lütfen tekrar deneyin.",
    next: "Devam",
    back: "Geri",
    skip: "Geç",
    finish: "Tamamla",
    doneTitle: "Hazırsın!",
    doneSubtitle: "Profilin hazır. İlk fişini ekleyerek başlayabilirsin.",
    goToApp: "Dashboard'a Git",

    personalInfoTitle: "Kendini Tanıt",
    personalInfoSubtitle: "Sana nasıl hitap edeceğimizi ve seni daha iyi tanımamızı sağlayacak birkaç bilgi.",
    displayNameLabel: "İsim veya Takma Ad",
    displayNamePlaceholder: "Adınız",
    displayNameRequired: "Lütfen bir isim girin (en az 2 karakter)",
    ageLabel: "Yaş",
    agePlaceholder: "Örn: 25",
    genderLabel: "Cinsiyet",
    genderMale: "Erkek",
    genderFemale: "Kadın",
    genderOther: "Diğer",
    countryLabel: "Ülke",
    countryPlaceholder: "Ülke seçin",

    financialTitle: "Finansal Profil",
    financialSubtitle: "Hedeflerini ve beklentilerini anlamamıza yardımcı ol.",
    incomeLabel: "Aylık Gelir Aralığı",
    incomePlaceholder: "Gelir aralığı seçin",
    incomeUnder: (a) => `${a} altı`,
    incomeOver: (a) => `${a} üstü`,
    incomeRange: (lo, hi) => `${lo} - ${hi}`,
    incomeSelectCountryHint: "Para birimi için önce ülke seçin",
    whyYumoTitle: "Neden Yumo Yumo?",
    whyYumoSubtitle: "Birden fazla seçebilirsin (isteğe bağlı)",
    reason_fin_track: "Harcamalarımı takip etmek",
    reason_min_goals: "Finansal hedeflerime ulaşmak",
    reason_fin_budget: "Bütçe oluşturmak",
    reason_min_habits: "Harcama alışkanlıklarımı anlamak",
    reason_fin_save: "Tasarruf etmeye başlamak",
    reason_com_motivation: "Motivasyon ve hesap verebilirlik",
    reason_min_freedom: "Finansal özgürlük kazanmak",

    yumbieSettingsTitle: "Yumbie Ayarları",
    yumbieSettingsSubtitle: "Yumbie'nin iletişim stilini ve bildirim tercihlerini ayarla.",
    toneLabel: "Yumbie Ses Tonu",
    toneWarm: "Samimi ve Sıcak",
    toneWarmDesc: "Bir arkadaş gibi konuşur",
    toneProfessional: "Profesyonel",
    toneProfessionalDesc: "Net ve yapıcı öneriler",
    toneEnergetic: "Enerjik ve Eğlenceli",
    toneEnergeticDesc: "Motivasyon dolu ve neşeli",
    notificationLabel: "Bildirim Sıklığı",
    notifImportant: "Sadece Önemli",
    notifImportantDesc: "Sadece kritik durumlarda",
    notifDaily: "Günde Bir Kez",
    notifDailyDesc: "Günlük özet ve ipuçları",
    notifFrequent: "Sık",
    notifFrequentDesc: "Aktif takip ve hatırlatmalar",
  },
  en: {
    headerLabel: "Personalization",
    welcome: "Welcome",
    subtitle: "Let's tailor Yumo Yumo to your preferences.",
    stepIndicator: (c, t) => `Step ${c} / ${t}`,
    savingLabel: "Saving...",
    genericError: "Something went wrong. Please try again.",
    next: "Continue",
    back: "Back",
    skip: "Skip",
    finish: "Finish",
    doneTitle: "You're ready",
    doneSubtitle: "Your profile is saved. Start by adding your first receipt.",
    goToApp: "Go to Dashboard",

    personalInfoTitle: "Introduce Yourself",
    personalInfoSubtitle: "A few details so we know how to address you and understand you better.",
    displayNameLabel: "Name or Nickname",
    displayNamePlaceholder: "Your name",
    displayNameRequired: "Please enter a name (at least 2 characters)",
    ageLabel: "Age",
    agePlaceholder: "E.g. 25",
    genderLabel: "Gender",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    countryLabel: "Country",
    countryPlaceholder: "Select a country",

    financialTitle: "Financial Profile",
    financialSubtitle: "Help us understand your goals and expectations.",
    incomeLabel: "Monthly Income Range",
    incomePlaceholder: "Select income range",
    incomeUnder: (a) => `Under ${a}`,
    incomeOver: (a) => `Over ${a}`,
    incomeRange: (lo, hi) => `${lo} - ${hi}`,
    incomeSelectCountryHint: "Select a country first to see your currency",
    whyYumoTitle: "Why Yumo Yumo?",
    whyYumoSubtitle: "You can select multiple (optional)",
    reason_fin_track: "Track my spending",
    reason_min_goals: "Reach financial goals",
    reason_fin_budget: "Build a budget",
    reason_min_habits: "Understand my habits",
    reason_fin_save: "Start saving money",
    reason_com_motivation: "Accountability & motivation",
    reason_min_freedom: "Achieve financial freedom",

    yumbieSettingsTitle: "Yumbie Settings",
    yumbieSettingsSubtitle: "Set Yumbie's communication style and notification preferences.",
    toneLabel: "Yumbie Tone",
    toneWarm: "Warm & Friendly",
    toneWarmDesc: "Speaks like a friend",
    toneProfessional: "Professional",
    toneProfessionalDesc: "Clear and constructive advice",
    toneEnergetic: "Energetic & Fun",
    toneEnergeticDesc: "Full of motivation and cheer",
    notificationLabel: "Notification Frequency",
    notifImportant: "Important Only",
    notifImportantDesc: "Only critical situations",
    notifDaily: "Once a Day",
    notifDailyDesc: "Daily summary and tips",
    notifFrequent: "Frequent",
    notifFrequentDesc: "Active tracking and reminders",
  },
  es: {
    headerLabel: "Personalización",
    welcome: "Bienvenido",
    subtitle: "Adaptemos Yumo Yumo a tus preferencias.",
    stepIndicator: (c, t) => `Paso ${c} / ${t}`,
    savingLabel: "Guardando...",
    genericError: "Algo salió mal. Por favor, inténtalo de nuevo.",
    next: "Continuar",
    back: "Atrás",
    skip: "Omitir",
    finish: "Finalizar",
    doneTitle: "¡Listo!",
    doneSubtitle: "Tu perfil está guardado. Empieza añadiendo tu primer recibo.",
    goToApp: "Ir al panel",

    personalInfoTitle: "Preséntate",
    personalInfoSubtitle: "Algunos datos para conocerte mejor.",
    displayNameLabel: "Nombre o apodo",
    displayNamePlaceholder: "Tu nombre",
    displayNameRequired: "Por favor, ingresa un nombre (al menos 2 caracteres)",
    ageLabel: "Edad",
    agePlaceholder: "Ej: 25",
    genderLabel: "Género",
    genderMale: "Masculino",
    genderFemale: "Femenino",
    genderOther: "Otro",
    countryLabel: "País",
    countryPlaceholder: "Selecciona un país",

    financialTitle: "Perfil financiero",
    financialSubtitle: "Ayúdanos a entender tus objetivos y expectativas.",
    incomeLabel: "Ingreso mensual",
    incomePlaceholder: "Selecciona un rango",
    incomeUnder: (a) => `Menos de ${a}`,
    incomeOver: (a) => `Más de ${a}`,
    incomeRange: (lo, hi) => `${lo} - ${hi}`,
    incomeSelectCountryHint: "Selecciona un país primero para ver tu moneda",
    whyYumoTitle: "¿Por qué Yumo Yumo?",
    whyYumoSubtitle: "Puedes seleccionar varias (opcional)",
    reason_fin_track: "Rastrear mis gastos",
    reason_min_goals: "Alcanzar mis metas financieras",
    reason_fin_budget: "Crear un presupuesto",
    reason_min_habits: "Entender mis hábitos",
    reason_fin_save: "Empezar a ahorrar",
    reason_com_motivation: "Responsabilidad y motivación",
    reason_min_freedom: "Lograr la libertad financiera",

    yumbieSettingsTitle: "Ajustes de Yumbie",
    yumbieSettingsSubtitle: "Configura el estilo y las notificaciones de Yumbie.",
    toneLabel: "Tono de Yumbie",
    toneWarm: "Cálido y Amistoso",
    toneWarmDesc: "Habla como un amigo",
    toneProfessional: "Profesional",
    toneProfessionalDesc: "Consejos claros y constructivos",
    toneEnergetic: "Enérgico y Divertido",
    toneEnergeticDesc: "Lleno de motivación y alegría",
    notificationLabel: "Frecuencia de notificaciones",
    notifImportant: "Solo importantes",
    notifImportantDesc: "Solo situaciones críticas",
    notifDaily: "Una vez al día",
    notifDailyDesc: "Resumen y consejos diarios",
    notifFrequent: "Frecuente",
    notifFrequentDesc: "Seguimiento activo y recordatorios",
  },
  ru: {
    headerLabel: "Персонализация",
    welcome: "Добро пожаловать",
    subtitle: "Настроим Yumo Yumo под ваши предпочтения.",
    stepIndicator: (c, t) => `Шаг ${c} / ${t}`,
    savingLabel: "Сохранение...",
    genericError: "Что-то пошло не так. Попробуйте снова.",
    next: "Продолжить",
    back: "Назад",
    skip: "Пропустить",
    finish: "Готово",
    doneTitle: "Всё готово!",
    doneSubtitle: "Ваш профиль сохранён. Начните с первого чека.",
    goToApp: "В панель управления",

    personalInfoTitle: "Представьтесь",
    personalInfoSubtitle: "Несколько данных, чтобы узнать вас лучше.",
    displayNameLabel: "Имя или ник",
    displayNamePlaceholder: "Ваше имя",
    displayNameRequired: "Введите имя (минимум 2 символа)",
    ageLabel: "Возраст",
    agePlaceholder: "Напр.: 25",
    genderLabel: "Пол",
    genderMale: "Мужской",
    genderFemale: "Женский",
    genderOther: "Другой",
    countryLabel: "Страна",
    countryPlaceholder: "Выберите страну",

    financialTitle: "Финансовый профиль",
    financialSubtitle: "Помогите нам понять ваши цели и ожидания.",
    incomeLabel: "Месячный доход",
    incomePlaceholder: "Выберите диапазон",
    incomeUnder: (a) => `До ${a}`,
    incomeOver: (a) => `Более ${a}`,
    incomeRange: (lo, hi) => `${lo} - ${hi}`,
    incomeSelectCountryHint: "Сначала выберите страну, чтобы увидеть валюту",
    whyYumoTitle: "Почему Yumo Yumo?",
    whyYumoSubtitle: "Можно выбрать несколько (необязательно)",
    reason_fin_track: "Отслеживать траты",
    reason_min_goals: "Достичь финансовых целей",
    reason_fin_budget: "Составить бюджет",
    reason_min_habits: "Понять свои привычки",
    reason_fin_save: "Начать копить",
    reason_com_motivation: "Ответственность и мотивация",
    reason_min_freedom: "Достичь финансовой свободы",

    yumbieSettingsTitle: "Настройки Yumbie",
    yumbieSettingsSubtitle: "Настройте стиль общения и уведомления Yumbie.",
    toneLabel: "Тон Yumbie",
    toneWarm: "Тёплый и дружелюбный",
    toneWarmDesc: "Говорит как друг",
    toneProfessional: "Профессиональный",
    toneProfessionalDesc: "Чёткие и конструктивные советы",
    toneEnergetic: "Энергичный и весёлый",
    toneEnergeticDesc: "Полный мотивации и радости",
    notificationLabel: "Частота уведомлений",
    notifImportant: "Только важные",
    notifImportantDesc: "Только критические ситуации",
    notifDaily: "Раз в день",
    notifDailyDesc: "Ежедневная сводка и советы",
    notifFrequent: "Часто",
    notifFrequentDesc: "Активное отслеживание и напоминания",
  },
  zh: {
    headerLabel: "个性化设置",
    welcome: "欢迎",
    subtitle: "让我们根据你的喜好定制 Yumo Yumo。",
    stepIndicator: (c, t) => `第 ${c} 步 / 共 ${t} 步`,
    savingLabel: "保存中...",
    genericError: "出现问题。请重试。",
    next: "继续",
    back: "返回",
    skip: "跳过",
    finish: "完成",
    doneTitle: "全部就绪!",
    doneSubtitle: "你的资料已保存。从添加第一张小票开始吧。",
    goToApp: "前往仪表板",

    personalInfoTitle: "自我介绍",
    personalInfoSubtitle: "一些信息,让我们更好地了解你。",
    displayNameLabel: "姓名或昵称",
    displayNamePlaceholder: "你的名字",
    displayNameRequired: "请输入姓名(至少 2 个字符)",
    ageLabel: "年龄",
    agePlaceholder: "例如:25",
    genderLabel: "性别",
    genderMale: "男",
    genderFemale: "女",
    genderOther: "其他",
    countryLabel: "国家",
    countryPlaceholder: "选择国家",

    financialTitle: "财务概况",
    financialSubtitle: "帮助我们了解你的目标与期望。",
    incomeLabel: "月收入范围",
    incomePlaceholder: "选择收入范围",
    incomeUnder: (a) => `低于 ${a}`,
    incomeOver: (a) => `高于 ${a}`,
    incomeRange: (lo, hi) => `${lo} - ${hi}`,
    incomeSelectCountryHint: "请先选择国家以显示对应货币",
    whyYumoTitle: "为什么选择 Yumo Yumo?",
    whyYumoSubtitle: "可多选(可选填)",
    reason_fin_track: "追踪我的支出",
    reason_min_goals: "实现财务目标",
    reason_fin_budget: "制定预算",
    reason_min_habits: "了解我的消费习惯",
    reason_fin_save: "开始储蓄",
    reason_com_motivation: "自律与激励",
    reason_min_freedom: "实现财务自由",

    yumbieSettingsTitle: "Yumbie 设置",
    yumbieSettingsSubtitle: "设置 Yumbie 的沟通风格和通知偏好。",
    toneLabel: "Yumbie 语气",
    toneWarm: "温暖友好",
    toneWarmDesc: "像朋友一样说话",
    toneProfessional: "专业",
    toneProfessionalDesc: "清晰且有建设性的建议",
    toneEnergetic: "活力有趣",
    toneEnergeticDesc: "充满动力与欢乐",
    notificationLabel: "通知频率",
    notifImportant: "仅重要",
    notifImportantDesc: "仅在关键情况下",
    notifDaily: "每日一次",
    notifDailyDesc: "每日总结与建议",
    notifFrequent: "频繁",
    notifFrequentDesc: "主动追踪与提醒",
  },
  th: {
    headerLabel: "การปรับแต่งส่วนตัว",
    welcome: "ยินดีต้อนรับ",
    subtitle: "มาปรับแต่ง Yumo Yumo ตามความชอบของคุณกัน",
    stepIndicator: (c, t) => `ขั้นที่ ${c} / ${t}`,
    savingLabel: "กำลังบันทึก...",
    genericError: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
    next: "ถัดไป",
    back: "ย้อนกลับ",
    skip: "ข้าม",
    finish: "เสร็จสิ้น",
    doneTitle: "พร้อมแล้ว!",
    doneSubtitle: "บันทึกโปรไฟล์ของคุณแล้ว เริ่มต้นด้วยการเพิ่มใบเสร็จแรก",
    goToApp: "ไปที่แดชบอร์ด",

    personalInfoTitle: "แนะนำตัว",
    personalInfoSubtitle: "ข้อมูลเล็กน้อยเพื่อให้เรารู้จักคุณดีขึ้น",
    displayNameLabel: "ชื่อหรือชื่อเล่น",
    displayNamePlaceholder: "ชื่อของคุณ",
    displayNameRequired: "กรุณากรอกชื่อ (อย่างน้อย 2 ตัวอักษร)",
    ageLabel: "อายุ",
    agePlaceholder: "เช่น 25",
    genderLabel: "เพศ",
    genderMale: "ชาย",
    genderFemale: "หญิง",
    genderOther: "อื่น ๆ",
    countryLabel: "ประเทศ",
    countryPlaceholder: "เลือกประเทศ",

    financialTitle: "ข้อมูลการเงิน",
    financialSubtitle: "ช่วยให้เราเข้าใจเป้าหมายและความคาดหวังของคุณ",
    incomeLabel: "รายได้ต่อเดือน",
    incomePlaceholder: "เลือกช่วงรายได้",
    incomeUnder: (a) => `ต่ำกว่า ${a}`,
    incomeOver: (a) => `มากกว่า ${a}`,
    incomeRange: (lo, hi) => `${lo} - ${hi}`,
    incomeSelectCountryHint: "เลือกประเทศก่อนเพื่อดูสกุลเงินของคุณ",
    whyYumoTitle: "ทำไมต้อง Yumo Yumo?",
    whyYumoSubtitle: "เลือกได้หลายข้อ (ไม่บังคับ)",
    reason_fin_track: "ติดตามการใช้จ่ายของฉัน",
    reason_min_goals: "บรรลุเป้าหมายทางการเงิน",
    reason_fin_budget: "จัดทำงบประมาณ",
    reason_min_habits: "เข้าใจพฤติกรรมการใช้จ่าย",
    reason_fin_save: "เริ่มต้นออมเงิน",
    reason_com_motivation: "ความรับผิดชอบและแรงจูงใจ",
    reason_min_freedom: "บรรลุอิสรภาพทางการเงิน",

    yumbieSettingsTitle: "การตั้งค่า Yumbie",
    yumbieSettingsSubtitle: "ตั้งค่ารูปแบบการสื่อสารและการแจ้งเตือนของ Yumbie",
    toneLabel: "โทนเสียง Yumbie",
    toneWarm: "อบอุ่นและเป็นมิตร",
    toneWarmDesc: "พูดคุยเหมือนเพื่อน",
    toneProfessional: "เป็นทางการ",
    toneProfessionalDesc: "คำแนะนำที่ชัดเจนและสร้างสรรค์",
    toneEnergetic: "สดใสและสนุกสนาน",
    toneEnergeticDesc: "เต็มไปด้วยพลังและความสุข",
    notificationLabel: "ความถี่ในการแจ้งเตือน",
    notifImportant: "เฉพาะสำคัญ",
    notifImportantDesc: "เฉพาะกรณีสำคัญเท่านั้น",
    notifDaily: "วันละครั้ง",
    notifDailyDesc: "สรุปและเคล็ดลับรายวัน",
    notifFrequent: "บ่อยครั้ง",
    notifFrequentDesc: "ติดตามและเตือนอย่างใกล้ชิด",
  },
};

const CURRENCY_BRACKETS: Record<string, [number, number, number, number]> = {
  TRY: [10000, 20000, 40000, 80000],
  USD: [1000, 2000, 4000, 8000],
  EUR: [1000, 2000, 4000, 8000],
  GBP: [800, 1600, 3200, 6400],
  CHF: [1500, 3000, 6000, 12000],
  CAD: [1500, 3000, 6000, 12000],
  AUD: [2000, 4000, 8000, 16000],
  NZD: [2000, 4000, 8000, 16000],
  SGD: [2000, 4000, 8000, 16000],
  JPY: [150000, 300000, 600000, 1200000],
  KRW: [1500000, 3000000, 6000000, 12000000],
  CNY: [4000, 8000, 16000, 32000],
  INR: [25000, 50000, 100000, 200000],
  RUB: [40000, 80000, 160000, 320000],
  BRL: [3000, 6000, 12000, 24000],
  MXN: [10000, 20000, 40000, 80000],
  ARS: [200000, 400000, 800000, 1600000],
  CLP: [500000, 1000000, 2000000, 4000000],
  AED: [4000, 8000, 16000, 32000],
  SAR: [4000, 8000, 16000, 32000],
  ILS: [4000, 8000, 16000, 32000],
  EGP: [10000, 20000, 40000, 80000],
  ZAR: [10000, 20000, 40000, 80000],
  PLN: [3000, 6000, 12000, 24000],
  CZK: [25000, 50000, 100000, 200000],
  HUF: [300000, 600000, 1200000, 2400000],
  RON: [3000, 6000, 12000, 24000],
  SEK: [10000, 20000, 40000, 80000],
  NOK: [10000, 20000, 40000, 80000],
  DKK: [8000, 16000, 32000, 64000],
  THB: [20000, 40000, 80000, 160000],
  PHP: [20000, 40000, 80000, 160000],
  IDR: [5000000, 10000000, 20000000, 40000000],
  VND: [10000000, 20000000, 40000000, 80000000],
  MYR: [3000, 6000, 12000, 24000],
};

export type IncomeOption = { key: string; label: string };

export function getIncomeOptions(currency: string, lang: Lang): IncomeOption[] {
  const amounts = CURRENCY_BRACKETS[currency] ?? CURRENCY_BRACKETS.USD;
  const locale = LANG_TO_LOCALE[lang] ?? "en-US";
  const t = TRANSLATIONS[lang];

  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  const fmt = (n: number) => formatter.format(n);

  return [
    { key: "under_10k", label: t.incomeUnder(fmt(amounts[0])) },
    { key: "10k_20k", label: t.incomeRange(fmt(amounts[0]), fmt(amounts[1])) },
    { key: "20k_40k", label: t.incomeRange(fmt(amounts[1]), fmt(amounts[2])) },
    { key: "40k_80k", label: t.incomeRange(fmt(amounts[2]), fmt(amounts[3])) },
    { key: "over_80k", label: t.incomeOver(fmt(amounts[3])) },
  ];
}
