// Centralized translations file
// Add new languages by adding a new key to each translation object

export type Locale = 'en' | 'ru' | 'tr' | 'th' | 'zh' | 'es';

export const translations = {
  // Hero Section
  hero: {
    en: {
      title: "Feed the Yumbie.",
      subtitle: "Turn spending into rewards.",
      description: "Your receipts hide value. Yumbie helps you unlock it.",
      buttonGoApp: "Go App",
      buttonWaitlist: "Join the Waitlist",
      aboutTitle: "About Yumo Yumo",
      aboutText1: "Yumo Yumo is the world's first receipt-to-earn gamified platform. Turn your everyday spending into rewards by feeding your Yumbie with receipts.",
      aboutText2: "Join early users exploring Yumo Yumo's contribution-based reward system. Every eligible purchase can count."
    },
    ru: {
      title: "Накорми Юмби.",
      subtitle: "Преврати траты в награды.",
      description: "В твоих чеках скрыта ценность. Юмби помогает её раскрыть.",
      buttonGoApp: "В приложение",
      buttonWaitlist: "Присоединиться",
      aboutTitle: "О Yumo Yumo",
      aboutText1: "Yumo Yumo — первая в мире геймифицированная платформа, которая превращает ежедневные траты в награды через Proof of Expense (PoE). Загружай чеки, корми своего Юмби и зарабатывай токены, веселясь!",
      aboutText2: "Присоединяйся к тысячам пользователей, которые уже зарабатывают токены $YUMO, получая удовольствие. Каждая покупка имеет значение."
    },
    tr: {
      title: "Yumbie'yi Besle.",
      subtitle: "Harcamaları ödüllere dönüştür.",
      description: "Fişlerin değer saklıyor. Yumbie bunu açığa çıkarmana yardım ediyor.",
      buttonGoApp: "Uygulamaya Git",
      buttonWaitlist: "Bekleme Listesine Katıl",
      aboutTitle: "Yumo Yumo Hakkında",
      aboutText1: "Yumo Yumo, Proof of Expense (PoE) ile günlük harcamaları oyunlaştıran dünyanın ilk platformu. Fişlerini yükle, Yumbie'ni besle ve eğlenirken ödül kazan!",
      aboutText2: "Yumo Yumo'nun katkı bazlı ödül sistemini keşfeden erken kullanıcılara katıl. Her uygun harcama sayılabilir."
    },
    th: {
      title: "ให้อาหาร Yumbie",
      subtitle: "เปลี่ยนการใช้จ่ายเป็นรางวัล",
      description: "ใบเสร็จของคุณซ่อนคุณค่าไว้ Yumbie ช่วยคุณเปิดเผยมัน",
      buttonGoApp: "ไปที่แอป",
      buttonWaitlist: "เข้าร่วมรายชื่อรอ",
      aboutTitle: "เกี่ยวกับ Yumo Yumo",
      aboutText1: "Yumo Yumo เป็นแพลตฟอร์มแรกของโลกที่เปลี่ยนการใช้จ่ายในชีวิตประจำวันให้เป็นรางวัลผ่าน Proof of Expense (PoE) อัปโหลดใบเสร็จ ให้อาหาร Yumbie ของคุณ และรับรางวัลในขณะที่สนุก!",
      aboutText2: "เข้าร่วมกับผู้ใช้หลายพันคนที่กำลังได้รับโทเคน $YUMO ในขณะที่สนุก การซื้อทุกครั้งมีความสำคัญ"
    },
    zh: {
      title: "喂养 Yumbie。",
      subtitle: "将消费转化为奖励。",
      description: "你的收据隐藏着价值。Yumbie 帮你解锁它。",
      buttonGoApp: "进入应用",
      buttonWaitlist: "加入候补名单",
      aboutTitle: "关于 Yumo Yumo",
      aboutText1: "Yumo Yumo 是世界上第一个通过支出证明（PoE）将日常消费游戏化的平台。上传收据，喂养你的 Yumbie，在享受乐趣的同时赚取奖励！",
      aboutText2: "加入数千名已经在享受乐趣的同时赚取 $YUMO 代币的用户。每次购买都很重要。"
    },
    es: {
      title: "Alimenta al Yumbie.",
      subtitle: "Convierte tus gastos en recompensas.",
      description: "Tus recibos ocultan valor. Yumbie te ayuda a descubrirlo.",
      buttonGoApp: "Ir a la App",
      buttonWaitlist: "Únete a la Lista",
      aboutTitle: "Acerca de Yumo Yumo",
      aboutText1: "Yumo Yumo es la primera plataforma gamificada del mundo que convierte los gastos diarios en recompensas a través de Proof of Expense (PoE). ¡Sube recibos, alimenta a tu Yumbie y gana recompensas mientras te diviertes!",
      aboutText2: "Únete a miles de usuarios que ya están ganando tokens $YUMO mientras se divierten. Cada compra cuenta."
    }
  },

  // Footer
  footer: {
    en: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards. Feed the Yumbie and join the cutest Web3 adventure.',
      resources: 'Resources',
      whitepaper: 'Whitepaper',
      roadmap: 'Roadmap',
      community: 'Community',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy',
      faq: 'FAQ',
      support: 'Support',
      followUs: 'Follow Us',
      copyright: '© 2025 Yumo Yumo. All rights reserved. Built with love and Yumbies.',
    },
    ru: {
      logo: 'Yumo Yumo',
      description: 'Преврати свои чеки в награды. Корми Юмби, зарабатывай токены и присоединяйся к самой милой Web3 революции.',
      resources: 'Ресурсы',
      whitepaper: 'Whitepaper',
      roadmap: 'Дорожная карта',
      community: 'Сообщество',
      terms: 'Условия использования',
      privacy: 'Политика конфиденциальности',
      faq: 'FAQ',
      support: 'Поддержка',
      followUs: 'Следите за нами',
      copyright: '© 2025 Yumo Yumo. Все права защищены. Сделано с любовью и Юмби.',
    },
    tr: {
      logo: 'Yumo Yumo',
      description: 'Uygun fişlerini uygulama içi ödüllere dönüştür. Yumbie\'ni besle ve en sevimli Web3 macerasına katıl.',
      resources: 'Kaynaklar',
      whitepaper: 'Whitepaper',
      roadmap: 'Yol Haritası',
      community: 'Topluluk',
      terms: 'Kullanım Koşulları',
      privacy: 'Gizlilik Politikası',
      faq: 'SSS',
      support: 'Destek',
      followUs: 'Bizi Takip Edin',
      copyright: '© 2025 Yumo Yumo. Tüm hakları saklıdır. Sevgi ve Yumbie\'lerle yapıldı.',
    },
    th: {
      logo: 'Yumo Yumo',
      description: 'เปลี่ยนใบเสร็จของคุณเป็นรางวัล ให้อาหาร Yumbie รับโทเคน และเข้าร่วมการปฏิวัติ Web3 ที่น่ารักที่สุด',
      resources: 'ทรัพยากร',
      whitepaper: 'Whitepaper',
      roadmap: 'แผนงาน',
      community: 'ชุมชน',
      terms: 'ข้อกำหนดและเงื่อนไข',
      privacy: 'นโยบายความเป็นส่วนตัว',
      faq: 'คำถามที่พบบ่อย',
      support: 'สนับสนุน',
      followUs: 'ติดตามเรา',
      copyright: '© 2025 Yumo Yumo. สงวนลิขสิทธิ์ สร้างด้วยความรักและ Yumbie',
    },
    zh: {
      logo: 'Yumo Yumo',
      description: '将你的收据转化为奖励。喂养 Yumbie，赚取代币，加入最可爱的 Web3 革命。',
      resources: '资源',
      whitepaper: 'Whitepaper',
      roadmap: '路线图',
      community: '社区',
      terms: '条款和条件',
      privacy: '隐私政策',
      faq: '常见问题',
      support: '支持',
      followUs: '关注我们',
      copyright: '© 2025 Yumo Yumo. 保留所有权利。用爱和 Yumbie 打造。',
    },
    es: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards. Feed the Yumbie and join the cutest Web3 adventure.',
      resources: 'Recursos',
      whitepaper: 'Whitepaper',
      roadmap: 'Hoja de Ruta',
      community: 'Comunidad',
      terms: 'Términos y Condiciones',
      privacy: 'Política de Privacidad',
      faq: 'Preguntas Frecuentes',
      support: 'Soporte',
      followUs: 'Síguenos',
      copyright: '© 2025 Yumo Yumo. Todos los derechos reservados. Hecho con amor y Yumbies.',
    }
  },

  // Navigation
  navigation: {
    en: {
      home: 'Home',
      whitepaper: 'Whitepaper',
      roadmap: 'Roadmap',
      tokenomics: 'Tokenomics',
      faq: 'FAQ',
      signUp: 'Sign Up',
      goApp: 'Go App',
      logo: 'Yumo Yumo',
    },
    ru: {
      home: 'Главная',
      whitepaper: 'Whitepaper',
      roadmap: 'Дорожная карта',
      tokenomics: 'Токеномика',
      faq: 'FAQ',
      signUp: 'Регистрация',
      goApp: 'В приложение',
      logo: 'Yumo Yumo',
    },
    tr: {
      home: 'Ana Sayfa',
      whitepaper: 'Whitepaper',
      roadmap: 'Yol Haritası',
      tokenomics: 'Tokenomics',
      faq: 'SSS',
      signUp: 'Kayıt Ol',
      goApp: 'Uygulamaya Git',
      logo: 'Yumo Yumo',
    },
    th: {
      home: 'หน้าแรก',
      whitepaper: 'Whitepaper',
      roadmap: 'แผนงาน',
      tokenomics: 'Tokenomics',
      faq: 'คำถามที่พบบ่อย',
      signUp: 'สมัครสมาชิก',
      goApp: 'ไปที่แอป',
      logo: 'Yumo Yumo',
    },
    zh: {
      home: '首页',
      whitepaper: 'Whitepaper',
      roadmap: '路线图',
      tokenomics: '代币经济学',
      faq: '常见问题',
      signUp: '注册',
      goApp: '进入应用',
      logo: 'Yumo Yumo',
    },
    es: {
      home: 'Inicio',
      whitepaper: 'Whitepaper',
      roadmap: 'Hoja de Ruta',
      tokenomics: 'Tokenomics',
      faq: 'Preguntas Frecuentes',
      signUp: 'Registrarse',
      goApp: 'Ir a la App',
      logo: 'Yumo Yumo',
    }
  }
};

// Messages type - flat structure for compatibility with existing code
export type Messages = Record<string, any>;

// Helper function to get translations for a specific locale (new format)
export function getTranslations(locale: Locale) {
  return {
    hero: translations.hero[locale] || translations.hero.en,
    footer: translations.footer[locale] || translations.footer.en,
    navigation: translations.navigation[locale] || translations.navigation.en,
  };
}

// Get messages from JSON files (nested structure)
export async function getMessages(locale: Locale): Promise<Messages> {
  try {
    // Try to load the locale-specific messages file
    const messages = require(`../../messages/${locale}.json`);
    return messages as Messages;
  } catch (error) {
    // Fallback to English if locale file doesn't exist
    try {
      const messages = require(`../../messages/en.json`);
      return messages as Messages;
    } catch (fallbackError) {
      console.error('Failed to load messages:', fallbackError);
      // Return minimal structure with translations from translations.ts
      const trans = getTranslations(locale);
      return {
        hero: trans.hero,
        footer: trans.footer,
        navigation: trans.navigation,
      } as Messages;
    }
  }
}

// Get nested translation by key path (e.g., "hero.title" or "howItWorks.steps")
export function getNestedTranslation(
  messages: Messages,
  key: string,
  allowFallback: boolean = false
): any {
  // Direct key lookup (for flat keys like "hero.title")
  if (messages[key] !== undefined) {
    return messages[key];
  }
  
  // Nested key lookup (e.g., "hero.title", "howItWorks.steps")
  const parts = key.split('.');
  let value: any = messages;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      // Fallback to English if allowed
      if (allowFallback) {
        try {
          const enMessages = require(`../../messages/en.json`);
          let enValue: any = enMessages;
          for (const enPart of parts) {
            if (enValue && typeof enValue === 'object' && enPart in enValue) {
              enValue = enValue[enPart];
            } else {
              return key; // Return key if not found
            }
          }
          return enValue;
        } catch {
          return key; // Return key if fallback fails
        }
      }
      return key; // Return key if not found
    }
  }
  
  return value;
}

