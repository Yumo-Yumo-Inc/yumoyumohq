"use client"

import { useLocale } from '@/lib/i18n/context'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroIsoRoom } from '@/components/hero-iso-room'

interface HeroSectionProps {
  onSignUp?: () => void
}

// Official Solana logo mark (three slanted bars, green -> purple gradient).
function SolanaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 397.7 311.7" className={className} role="img" aria-label="Solana">
      <defs>
        <linearGradient id="solana-mark-gradient" x1="360.879" y1="-37.455" x2="141.213" y2="383.294" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path fill="url(#solana-mark-gradient)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
      <path fill="url(#solana-mark-gradient)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
      <path fill="url(#solana-mark-gradient)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  )
}

// Frozen traction cut — single source for all locales
// (memory/decisions/2026-08-10-temiz-traction-metrikleri.md):
// 9 countries, 10,070 receipts, 24 monthly active users. Refresh these
// numbers once here; every locale updates together. The MAU footnote is
// mandatory — an unlabeled MAU figure counts as inflation.
const TRACTION = {
  countries: 9,
  receipts: 10070,
  mau: 24,
} as const

// Editorial Minimal hero: zero framer-motion, zero JS animations, zero scroll handlers.
// Only animation in this entire section is a single CSS-driven cursor blink (opacity only,
// runs on the compositor thread). All visual richness comes from static gradients and
// typography. Decision context: memory/decisions/hero-editorial-2026-05.md (TODO add).
export function HeroSection({ onSignUp }: HeroSectionProps) {
  const { locale } = useLocale()

  const heroContent: Record<string, {
    badge: string
    title: string
    subtitle: string
    description: string
    pills?: string[]
    buttonSignIn: string
    buttonWaitlist: string
    stats: {
      countries: string
      receipts: string
      mau: string
      footnote: string
    }
  }> = {
    en: {
      badge: "Open Beta",
      title: "The financial OS for everyday life.",
      subtitle: "Receipt-powered financial intelligence.",
      description: "",
      pills: ["Spending analysis", "Habit visibility", "Price memory"],
      buttonSignIn: "Sign in",
      buttonWaitlist: "Create Account",
      stats: {
        countries: "Countries",
        receipts: "Receipts processed",
        mau: "Monthly active users",
        footnote: "Monthly active users: unique users who uploaded at least one receipt in the trailing 30 days, as of Aug 10, 2026.",
      },
    },
    tr: {
      badge: "Açık Beta",
      title: "Harcamanı anlayan finansal OS.",
      subtitle: "Fiş destekli finansal zeka.",
      description: "",
      pills: ["Harcama analizi", "Alışkanlık görünürlüğü", "Fiyat hafızası"],
      buttonSignIn: "Giriş Yap",
      buttonWaitlist: "Hesap Oluştur",
      stats: {
        countries: "Ülke",
        receipts: "İşlenen fiş",
        mau: "Aylık aktif kullanıcı",
        footnote: "Aylık aktif kullanıcı: son 30 gün içinde en az bir fiş yükleyen tekil kullanıcı sayısı (10 Ağustos 2026 itibarıyla).",
      },
    },
    ru: {
      badge: "Открытая бета",
      title: "Финансовая ОС, которая понимает ваши траты.",
      subtitle: "Финансовый интеллект на основе чеков.",
      description: "",
      pills: ["Анализ трат", "Видимость привычек", "Память цен"],
      buttonSignIn: "Войти",
      buttonWaitlist: "Создать аккаунт",
      stats: {
        countries: "Страны",
        receipts: "Обработано чеков",
        mau: "Активных пользователей в месяц",
        footnote: "Активные пользователи в месяц — уникальные пользователи, загрузившие хотя бы один чек за последние 30 дней (по состоянию на 10 августа 2026 года).",
      },
    },
    th: {
      badge: "เปิดระยะเบต้า",
      title: "ระบบปฏิบัติการการเงินที่เข้าใจการใช้จ่ายของคุณ",
      subtitle: "ปัญญาทางการเงินจากใบเสร็จ",
      description: "",
      pills: ["วิเคราะห์การใช้จ่าย", "มองเห็นนิสัย", "ความจำราคา"],
      buttonSignIn: "เข้าสู่ระบบ",
      buttonWaitlist: "สร้างบัญชี",
      stats: {
        countries: "ประเทศ",
        receipts: "ใบเสร็จที่ประมวลผลแล้ว",
        mau: "ผู้ใช้งานต่อเดือน",
        footnote: "ผู้ใช้งานต่อเดือน: ผู้ใช้รายที่อัปโหลดใบเสร็จอย่างน้อยหนึ่งใบในช่วง 30 วันที่ผ่านมา (ข้อมูล ณ วันที่ 10 สิงหาคม 2026)",
      },
    },
    zh: {
      badge: "公测",
      title: "懂你的支出的金融 OS。",
      subtitle: "收据驱动的金融智能。",
      description: "",
      pills: ["支出分析", "习惯可见性", "价格记忆"],
      buttonSignIn: "登录",
      buttonWaitlist: "创建账户",
      stats: {
        countries: "国家",
        receipts: "已处理收据",
        mau: "月活跃用户",
        footnote: "月活跃用户：截至2026年8月10日，过去30天内上传过至少一张收据的独立用户。",
      },
    },
    es: {
      badge: "Beta Abierta",
      title: "El OS financiero que entiende tu gasto.",
      subtitle: "Inteligencia financiera basada en recibos.",
      description: "",
      pills: ["Análisis de gasto", "Visibilidad de hábitos", "Memoria de precios"],
      buttonSignIn: "Iniciar sesión",
      buttonWaitlist: "Crear Cuenta",
      stats: {
        countries: "Países",
        receipts: "Recibos procesados",
        mau: "Usuarios activos mensuales",
        footnote: "Usuarios activos mensuales: usuarios únicos que subieron al menos un recibo en los últimos 30 días (al 10 de agosto de 2026).",
      },
    },
  }

  const content = heroContent[locale] || heroContent.en
  const numbers = new Intl.NumberFormat(locale)

  const handleButtonClick = () => {
    if (onSignUp) {
      onSignUp()
      return
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/app/register'
    }
  }

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden min-h-[calc(100svh-4rem)] py-4 md:py-0"
      style={{ background: 'radial-gradient(120% 110% at 50% 28%, #262838 0%, #121420 60%, #0d0e16 100%)' }}
    >
      {/* Isometric Yumbie command room — single rAF loop, paused offscreen/hidden,
          static frame under prefers-reduced-motion. */}
      <HeroIsoRoom />

      {/* Ambient light over the room — lifts the dark scene (screen blend) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          mixBlendMode: 'screen',
          background:
            'radial-gradient(72% 60% at 50% 30%, rgba(150,170,210,0.22), transparent 68%), radial-gradient(38% 30% at 22% 50%, rgba(255,150,90,0.10), transparent 70%)',
        }}
      />

      {/* Center vignette so the headline stays legible over the room */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(58% 50% at 50% 42%, rgba(12,13,20,0.52) 0%, rgba(12,13,20,0.22) 52%, transparent 82%)',
        }}
      />
      {/* Bottom fade into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-b from-transparent to-[#0d0e16]" />

      {/* Main content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-3xl text-center">

          {/* Solana badge */}
          <div className="relative inline-flex mb-5 md:mb-9">
            <div className="absolute -inset-3 rounded-full bg-[radial-gradient(circle_at_center,rgba(153,69,255,0.18),transparent_70%)] blur-lg" />
            <div className="relative inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <SolanaMark className="h-3 w-3.5" />
              <span className="text-[11px] md:text-xs font-semibold tracking-[0.14em] uppercase text-white/85">
                {content.badge}
              </span>
              <span className="hero-live-dot" aria-hidden="true" />
            </div>
          </div>

          <style>{`
            .hero-live-dot {
              width: 6px; height: 6px; border-radius: 9999px;
              background: #14f195;
              box-shadow: 0 0 0 0 rgba(20,241,149,0.55);
              animation: hero-live-pulse 2.2s ease-in-out infinite;
            }
            @keyframes hero-live-pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(20,241,149,0.5); opacity: 1; }
              50% { box-shadow: 0 0 0 5px rgba(20,241,149,0); opacity: 0.55; }
            }
            @media (prefers-reduced-motion: reduce) {
              .hero-live-dot { animation: none; }
            }
          `}</style>

          {/* Title */}
          <h1
            className="font-black tracking-tight text-white text-balance"
            style={{
              fontSize: 'clamp(2.125rem, 7.2vw, 4.75rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              textShadow: '0 4px 40px rgba(0,0,0,0.78)',
            }}
          >
            {content.title}
          </h1>

          <p
            className="mt-4 md:mt-6 font-extrabold text-white text-balance"
            style={{ fontSize: 'clamp(1.125rem, 3.2vw, 1.75rem)', textShadow: '0 2px 20px rgba(0,0,0,0.78)' }}
          >
            {content.subtitle}
          </p>

          {content.pills && content.pills.length > 0 && (
            <div className="mt-5 md:mt-7 flex flex-wrap items-center justify-center gap-2">
              {content.pills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-white/90 backdrop-blur-sm"
                >
                  {pill}
                </span>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="mt-6 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Button
              onClick={handleButtonClick}
              size="lg"
              className="group relative w-full sm:w-auto px-9 py-5 md:py-6 text-base md:text-lg font-bold rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(90deg, #f97316 0%, #ec4899 100%)',
                boxShadow: '0 12px 34px -8px rgba(236, 72, 153, 0.55)',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                {content.buttonWaitlist}
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-9 py-5 md:py-6 text-base md:text-lg font-bold rounded-2xl border border-white/20 bg-black/45 backdrop-blur-xl hover:bg-white/10 hover:border-white/40 text-white transition-colors"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/app/login'
              }}
            >
              {content.buttonSignIn}
            </Button>
          </div>

          {/* Traction stats — frozen 2026-08-10 clean cut (see decision note),
              values from the shared TRACTION constant. MAU ships with its
              definition; an unlabeled MAU is inflated by default. Opaque bg,
              no backdrop blur: the iso-room canvas repaints every frame and
              backdrop-filter would force per-frame GPU recompositing. */}
          <div className="mt-8 md:mt-12 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-black/70 px-4 py-5 md:px-8 md:py-6">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              <div className="px-2 md:px-4 text-center">
                <div className="text-2xl md:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                  {numbers.format(TRACTION.countries)}
                </div>
                <div className="mt-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                  {content.stats.countries}
                </div>
              </div>
              <div className="px-2 md:px-4 text-center">
                <div className="text-2xl md:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                  {numbers.format(TRACTION.receipts)}
                </div>
                <div className="mt-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                  {content.stats.receipts}
                </div>
              </div>
              <div className="px-2 md:px-4 text-center">
                <div className="text-2xl md:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                  {numbers.format(TRACTION.mau)}
                </div>
                <div className="mt-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                  {content.stats.mau}
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-[10px] md:text-[11px] leading-relaxed text-white/40 max-w-xl mx-auto">
              {content.stats.footnote}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
