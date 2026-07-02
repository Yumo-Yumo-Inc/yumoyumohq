"use client"

import { Send } from "lucide-react"
import Link from "next/link"
import { useLocale } from "@/lib/i18n/context"
import { openCookiePreferences } from "@/lib/legal/cookie-consent"

export function Footer() {
  const { locale } = useLocale();
  
  const footerContent: Record<string, any> = {
    en: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'Resources',
      whitepaper: 'Whitepaper',
      roadmap: 'Roadmap',
      community: 'Community',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy',
      faq: 'FAQ',
      support: 'Support',
      cookies: 'Cookie Preferences',
      followUs: 'Follow Us',
      copyright: '© 2025 Yumo Yumo. All rights reserved.',
    },
    ru: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'Ресурсы',
      whitepaper: 'Whitepaper',
      roadmap: 'Дорожная карта',
      community: 'Сообщество',
      terms: 'Условия использования',
      privacy: 'Политика конфиденциальности',
      faq: 'FAQ',
      support: 'Поддержка',
      cookies: 'Настройки cookie',
      followUs: 'Следите за нами',
      copyright: '© 2025 Yumo Yumo. Все права защищены. Сделано с любовью и Юмби.',
    },
    tr: {
      logo: 'Yumo Yumo',
      description: 'Uygun fişlerini uygulama içi ödüllere dönüştür ve Yumbie ile ilerlemeni takip et.',
      resources: 'Kaynaklar',
      whitepaper: 'Whitepaper',
      roadmap: 'Yol Haritası',
      community: 'Topluluk',
      terms: 'Kullanım Koşulları',
      privacy: 'Gizlilik Politikası',
      faq: 'SSS',
      support: 'Destek',
      cookies: 'Çerez Tercihleri',
      followUs: 'Bizi Takip Edin',
      copyright: '© 2025 Yumo Yumo. Tüm hakları saklıdır.',
    },
    th: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'ทรัพยากร',
      whitepaper: 'Whitepaper',
      roadmap: 'แผนงาน',
      community: 'ชุมชน',
      terms: 'ข้อกำหนดและเงื่อนไข',
      privacy: 'นโยบายความเป็นส่วนตัว',
      faq: 'คำถามที่พบบ่อย',
      support: 'สนับสนุน',
      cookies: 'การตั้งค่าคุกกี้',
      followUs: 'ติดตามเรา',
      copyright: '© 2025 Yumo Yumo. สงวนลิขสิทธิ์ สร้างด้วยความรักและ Yumbie',
    },
    zh: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: '资源',
      whitepaper: 'Whitepaper',
      roadmap: '路线图',
      community: '社区',
      terms: '条款和条件',
      privacy: '隐私政策',
      faq: '常见问题',
      support: '支持',
      cookies: 'Cookie 偏好设置',
      followUs: '关注我们',
      copyright: '© 2025 Yumo Yumo. 保留所有权利。用爱和 Yumbie 打造。',
    },
    es: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'Recursos',
      whitepaper: 'Whitepaper',
      roadmap: 'Hoja de Ruta',
      community: 'Comunidad',
      terms: 'Términos y Condiciones',
      privacy: 'Política de Privacidad',
      faq: 'Preguntas Frecuentes',
      support: 'Soporte',
      cookies: 'Preferencias de cookies',
      followUs: 'Síguenos',
      copyright: '© 2025 Yumo Yumo. Todos los derechos reservados.',
    }
  };

  const t = footerContent[locale] || footerContent.en;

  const getVisionPaperUrl = () => {
    return `/vision/${locale || "en"}`
  }

  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur-xl mt-20">
      <div className="container mx-auto px-4 py-12 lg:max-w-[80%] xl:max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary via-pink-500 to-orange-500 bg-clip-text text-transparent">
              {t.logo}
            </div>
            <p className="text-sm text-gray-400">
              {t.description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t.resources}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={getVisionPaperUrl()} className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5">
                  {t.whitepaper}
                </Link>
              </li>
              <li>
                <a href="#roadmap" className="text-gray-400 hover:text-primary transition-colors">
                  {t.roadmap}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t.community}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms/" className="text-gray-400 hover:text-primary transition-colors">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy/" className="text-gray-400 hover:text-primary transition-colors">
                  {t.privacy}
                </Link>
              </li>
              <li>
                <Link href="/faq/" className="text-gray-400 hover:text-primary transition-colors">
                  {t.faq}
                </Link>
              </li>
              <li>
                <Link href="/support/" className="text-gray-400 hover:text-primary transition-colors">
                  {t.support}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="text-left text-gray-400 hover:text-primary transition-colors"
                >
                  {t.cookies || "Cookie Preferences"}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t.followUs}</h3>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/yumohq"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center hover:from-primary/90 hover:to-pink-500/90 transition-all shadow-md hover:shadow-lg"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center opacity-40 cursor-not-allowed"
                aria-label="Discord"
                tabIndex={-1}
              >
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.077.077 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center opacity-40 cursor-not-allowed"
                aria-label="Telegram"
                tabIndex={-1}
              >
                <Send className="w-5 h-5 text-gray-400" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center opacity-40 cursor-not-allowed"
                aria-label="TikTok"
                tabIndex={-1}
              >
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>{t.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
