"use client"

import Link from "next/link"
import { useLocale } from "@/lib/i18n/context"
import { openCookiePreferences } from "@/lib/legal/cookie-consent"

interface FooterContent {
  logo: string
  description: string
  resources: string
  visionPaper: string
  roadmap: string
  ledger: string
  company: string
  legal: string
  terms: string
  privacy: string
  about: string
  faq: string
  support: string
  cookies: string
  copyright: string
}

export function Footer() {
  const { locale } = useLocale();

  const footerContent: Record<string, FooterContent> = {
    en: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'Resources',
      visionPaper: 'Vision Paper',
      roadmap: 'Roadmap',
      ledger: 'Price ledger',
      company: 'Company',
      legal: 'Legal',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy',
      about: 'About',
      faq: 'FAQ',
      support: 'Support',
      cookies: 'Cookie Preferences',
      copyright: '© 2026 Yumo Yumo. All rights reserved.',
    },
    ru: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'Ресурсы',
      visionPaper: 'Vision Paper',
      roadmap: 'Дорожная карта',
      ledger: 'Price ledger',
      company: 'Компания',
      legal: 'Юридическая информация',
      terms: 'Условия использования',
      privacy: 'Политика конфиденциальности',
      about: 'О нас',
      faq: 'FAQ',
      support: 'Поддержка',
      cookies: 'Настройки cookie',
      copyright: '© 2026 Yumo Yumo. Все права защищены. Сделано с любовью и Юмби.',
    },
    tr: {
      logo: 'Yumo Yumo',
      description: 'Uygun fişlerini uygulama içi ödüllere dönüştür ve Yumbie ile ilerlemeni takip et.',
      resources: 'Kaynaklar',
      visionPaper: 'Vision Paper',
      roadmap: 'Yol Haritası',
      ledger: 'Fiyat defteri',
      company: 'Şirket',
      legal: 'Yasal',
      terms: 'Kullanım Koşulları',
      privacy: 'Gizlilik Politikası',
      about: 'Hakkımızda',
      faq: 'SSS',
      support: 'Destek',
      cookies: 'Çerez Tercihleri',
      copyright: '© 2026 Yumo Yumo. Tüm hakları saklıdır.',
    },
    th: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'ทรัพยากร',
      visionPaper: 'Vision Paper',
      roadmap: 'แผนงาน',
      ledger: 'Price ledger',
      company: 'บริษัท',
      legal: 'ข้อกฎหมาย',
      terms: 'ข้อกำหนดและเงื่อนไข',
      privacy: 'นโยบายความเป็นส่วนตัว',
      about: 'เกี่ยวกับเรา',
      faq: 'คำถามที่พบบ่อย',
      support: 'สนับสนุน',
      cookies: 'การตั้งค่าคุกกี้',
      copyright: '© 2026 Yumo Yumo. สงวนลิขสิทธิ์ สร้างด้วยความรักและ Yumbie',
    },
    zh: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: '资源',
      visionPaper: 'Vision Paper',
      roadmap: '路线图',
      ledger: 'Price ledger',
      company: '公司',
      legal: '法律信息',
      terms: '条款和条件',
      privacy: '隐私政策',
      about: '关于我们',
      faq: '常见问题',
      support: '支持',
      cookies: 'Cookie 偏好设置',
      copyright: '© 2026 Yumo Yumo. 保留所有权利。用爱和 Yumbie 打造。',
    },
    es: {
      logo: 'Yumo Yumo',
      description: 'Turn eligible receipts into in-app rewards and track your progress with Yumbie.',
      resources: 'Recursos',
      visionPaper: 'Vision Paper',
      roadmap: 'Hoja de Ruta',
      ledger: 'Price ledger',
      company: 'Empresa',
      legal: 'Legal',
      terms: 'Términos y Condiciones',
      privacy: 'Política de Privacidad',
      about: 'Sobre nosotros',
      faq: 'Preguntas Frecuentes',
      support: 'Soporte',
      cookies: 'Preferencias de cookies',
      copyright: '© 2026 Yumo Yumo. Todos los derechos reservados.',
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
            {/* Social: only verified public profiles. Telegram icon renders
                once Uğur provides the channel URL — no dead links (plan item 11). */}
            <div className="flex items-center gap-3 pt-1">
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
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t.resources}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={getVisionPaperUrl()} className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5">
                  {t.visionPaper}
                </Link>
              </li>
              <li>
                <a href="#roadmap" className="text-gray-400 hover:text-primary transition-colors">
                  {t.roadmap}
                </a>
              </li>
              <li>
                <Link href="/ledger" className="text-gray-400 hover:text-primary transition-colors">
                  {t.ledger}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t.company}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-primary transition-colors">
                  {t.about}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-primary transition-colors">
                  {t.faq}
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-primary transition-colors">
                  {t.support}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t.legal}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-primary transition-colors">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors">
                  {t.privacy}
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
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>{t.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
