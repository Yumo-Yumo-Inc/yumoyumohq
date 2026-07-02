"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  buildCookieConsent,
  COOKIE_CONSENT_OPEN_EVENT,
  isGlobalPrivacyControlEnabled,
  readCookieConsent,
  saveCookieConsent,
} from "@/lib/legal/cookie-consent"
import type { Locale } from "@/lib/i18n/types"
import { useLocale } from "@/lib/i18n/context"

const translations = {
  en: {
    title: "Cookie preferences",
    message:
      "We use strictly necessary cookies and local storage to keep Yumo Yumo secure and working. With your permission, we may also use optional cookies to remember preferences and understand aggregate product usage. We do not use optional cookies unless you choose to allow them.",
    note:
      "You can reject optional cookies and still use the site. You can change your choice later from your browser settings or by clearing site data.",
    necessaryTitle: "Strictly necessary",
    necessaryDescription:
      "Required for security, sign-in, fraud prevention, language settings, and core site features. These cannot be switched off through this banner.",
    functionalTitle: "Functional preferences",
    functionalDescription:
      "Helps remember choices such as language, display preferences, and similar product settings.",
    analyticsTitle: "Analytics",
    analyticsDescription:
      "Helps us understand aggregate usage and improve the product without selling your personal information or setting targeted advertising cookies.",
    privacyPrefix: "Read more in our",
    privacyLink: "Privacy Notice",
    acceptAll: "Accept optional cookies",
    rejectAll: "Reject optional cookies",
    manage: "Manage choices",
    save: "Save choices",
    back: "Back",
    alwaysOn: "Always on",
    close: "Close and reject optional cookies",
    analyticsGpcOff: "Off — set by your browser (GPC)",
  },
  tr: {
    title: "Çerez tercihleri",
    message:
      "Yumo Yumo'nun güvenli ve doğru çalışması için zorunlu çerezler ve yerel depolama kullanıyoruz. İzin verirsen, tercihlerini hatırlamak ve ürünü toplu kullanım verileriyle iyileştirmek için opsiyonel çerezler de kullanabiliriz. Opsiyonel çerezleri yalnızca sen izin verirsen çalıştırırız.",
    note:
      "Opsiyonel çerezleri reddetsen de siteyi kullanabilirsin. Tercihini daha sonra tarayıcı ayarlarından veya site verilerini temizleyerek değiştirebilirsin.",
    necessaryTitle: "Zorunlu",
    necessaryDescription:
      "Güvenlik, oturum açma, kötüye kullanım önleme, dil ayarları ve temel site özellikleri için gereklidir. Bu kategori bu banner üzerinden kapatılamaz.",
    functionalTitle: "İşlevsel tercihler",
    functionalDescription:
      "Dil, görünüm ve benzeri ürün tercihlerini hatırlamamıza yardımcı olur.",
    analyticsTitle: "Analitik",
    analyticsDescription:
      "Kişisel bilgilerini satmadan veya hedefli reklam çerezi yerleştirmeden, ürünü toplu kullanım verileriyle iyileştirmemize yardımcı olur.",
    privacyPrefix: "Detaylar için",
    privacyLink: "Gizlilik Bildirimi",
    acceptAll: "Opsiyonel çerezleri kabul et",
    rejectAll: "Opsiyonel çerezleri reddet",
    manage: "Tercihleri yönet",
    save: "Tercihleri kaydet",
    back: "Geri",
    alwaysOn: "Her zaman açık",
    close: "Kapat ve opsiyonel çerezleri reddet",
    analyticsGpcOff: "Kapalı — tarayıcın tarafından (GPC)",
  },
  "zh-TW": {
    title: "Cookie 偏好設定",
    message:
      "我們會使用必要 Cookie 與本機儲存空間，確保 Yumo Yumo 安全並正常運作。經你同意後，我們也可能使用選用 Cookie 來記住偏好並了解彙總的產品使用情況。除非你允許，否則我們不會啟用選用 Cookie。",
    note:
      "即使拒絕選用 Cookie，你仍可使用本網站。日後你可以透過瀏覽器設定或清除網站資料來變更選擇。",
    necessaryTitle: "絕對必要",
    necessaryDescription:
      "用於安全、登入、防止濫用、語言設定與核心網站功能。此類別無法透過本提示關閉。",
    functionalTitle: "功能偏好",
    functionalDescription:
      "協助記住語言、顯示設定與類似產品偏好。",
    analyticsTitle: "分析",
    analyticsDescription:
      "協助我們了解彙總使用情況並改進產品；我們不會出售你的個人資訊，也不會設定定向廣告 Cookie。",
    privacyPrefix: "詳情請見",
    privacyLink: "隱私權通知",
    acceptAll: "接受選用 Cookie",
    rejectAll: "拒絕選用 Cookie",
    manage: "管理選擇",
    save: "儲存選擇",
    back: "返回",
    alwaysOn: "一律開啟",
    close: "關閉並拒絕選用 Cookie",
    analyticsGpcOff: "已關閉 — 由你的瀏覽器設定（GPC）",
  },
  es: {
    title: "Preferencias de cookies",
    message:
      "Usamos cookies estrictamente necesarias y almacenamiento local para mantener Yumo Yumo seguro y funcionando. Con tu permiso, también podemos usar cookies opcionales para recordar preferencias y entender el uso agregado del producto. No usamos cookies opcionales salvo que decidas permitirlas.",
    note:
      "Puedes rechazar las cookies opcionales y seguir usando el sitio. Puedes cambiar tu elección más tarde desde la configuración del navegador o borrando los datos del sitio.",
    necessaryTitle: "Estrictamente necesarias",
    necessaryDescription:
      "Necesarias para seguridad, inicio de sesión, prevención de abuso, idioma y funciones principales. No se pueden desactivar desde este aviso.",
    functionalTitle: "Preferencias funcionales",
    functionalDescription:
      "Ayudan a recordar idioma, visualización y preferencias similares del producto.",
    analyticsTitle: "Analítica",
    analyticsDescription:
      "Nos ayuda a entender el uso agregado y mejorar el producto sin vender tu información personal ni establecer cookies de publicidad dirigida.",
    privacyPrefix: "Lee más en nuestro",
    privacyLink: "Aviso de Privacidad",
    acceptAll: "Aceptar cookies opcionales",
    rejectAll: "Rechazar cookies opcionales",
    manage: "Gestionar opciones",
    save: "Guardar opciones",
    back: "Volver",
    alwaysOn: "Siempre activas",
    close: "Cerrar y rechazar cookies opcionales",
    analyticsGpcOff: "Desactivado — por tu navegador (GPC)",
  },
  ru: {
    title: "Настройки cookie",
    message:
      "Мы используем строго необходимые cookie и локальное хранилище, чтобы Yumo Yumo работал безопасно и корректно. С вашего разрешения мы также можем использовать необязательные cookie, чтобы запоминать настройки и понимать агрегированное использование продукта. Необязательные cookie не включаются без вашего выбора.",
    note:
      "Вы можете отказаться от необязательных cookie и продолжить пользоваться сайтом. Позже выбор можно изменить в настройках браузера или очистив данные сайта.",
    necessaryTitle: "Строго необходимые",
    necessaryDescription:
      "Нужны для безопасности, входа, предотвращения злоупотреблений, языковых настроек и основных функций сайта. Их нельзя отключить через этот баннер.",
    functionalTitle: "Функциональные настройки",
    functionalDescription:
      "Помогают запоминать язык, отображение и похожие настройки продукта.",
    analyticsTitle: "Аналитика",
    analyticsDescription:
      "Помогает нам понимать агрегированное использование и улучшать продукт без продажи ваших персональных данных и без cookie для таргетированной рекламы.",
    privacyPrefix: "Подробнее в нашем",
    privacyLink: "Уведомлении о конфиденциальности",
    acceptAll: "Принять необязательные cookie",
    rejectAll: "Отклонить необязательные cookie",
    manage: "Управлять выбором",
    save: "Сохранить выбор",
    back: "Назад",
    alwaysOn: "Всегда включено",
    close: "Закрыть и отклонить необязательные cookie",
    analyticsGpcOff: "Отключено — вашим браузером (GPC)",
  },
  th: {
    title: "การตั้งค่าคุกกี้",
    message:
      "เราใช้คุกกี้ที่จำเป็นอย่างยิ่งและพื้นที่จัดเก็บในเครื่องเพื่อให้ Yumo Yumo ปลอดภัยและทำงานได้ตามปกติ หากคุณอนุญาต เราอาจใช้คุกกี้เพิ่มเติมเพื่อจดจำการตั้งค่าและทำความเข้าใจการใช้งานผลิตภัณฑ์ในภาพรวม เราจะไม่ใช้คุกกี้เพิ่มเติมจนกว่าคุณจะเลือกอนุญาต",
    note:
      "คุณสามารถปฏิเสธคุกกี้เพิ่มเติมและยังใช้เว็บไซต์ได้ตามปกติ ภายหลังคุณสามารถเปลี่ยนตัวเลือกได้จากการตั้งค่าเบราว์เซอร์หรือล้างข้อมูลเว็บไซต์",
    necessaryTitle: "จำเป็นอย่างยิ่ง",
    necessaryDescription:
      "จำเป็นสำหรับความปลอดภัย การเข้าสู่ระบบ การป้องกันการใช้งานในทางที่ผิด การตั้งค่าภาษา และฟังก์ชันหลักของเว็บไซต์ ไม่สามารถปิดผ่านแบนเนอร์นี้ได้",
    functionalTitle: "การตั้งค่าฟังก์ชัน",
    functionalDescription:
      "ช่วยจดจำภาษา การแสดงผล และการตั้งค่าผลิตภัณฑ์ที่คล้ายกัน",
    analyticsTitle: "การวิเคราะห์",
    analyticsDescription:
      "ช่วยให้เราเข้าใจการใช้งานโดยรวมและปรับปรุงผลิตภัณฑ์ โดยไม่ขายข้อมูลส่วนบุคคลของคุณหรือใช้คุกกี้โฆษณาแบบเจาะกลุ่ม",
    privacyPrefix: "อ่านเพิ่มเติมใน",
    privacyLink: "ประกาศความเป็นส่วนตัว",
    acceptAll: "ยอมรับคุกกี้เพิ่มเติม",
    rejectAll: "ปฏิเสธคุกกี้เพิ่มเติม",
    manage: "จัดการตัวเลือก",
    save: "บันทึกตัวเลือก",
    back: "กลับ",
    alwaysOn: "เปิดเสมอ",
    close: "ปิดและปฏิเสธคุกกี้เพิ่มเติม",
    analyticsGpcOff: "ปิดอยู่ — กำหนดโดยเบราว์เซอร์ของคุณ (GPC)",
  },
}

type SupportedLanguage = keyof typeof translations

function landingLocaleToBannerLanguage(locale: Locale): SupportedLanguage {
  if (locale === "zh") return "zh-TW"
  return locale as SupportedLanguage
}

export function CookieConsentBanner() {
  const { locale: landingLocale } = useLocale()
  const [isVisible, setIsVisible] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [functional, setFunctional] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [gpcEnabled, setGpcEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false

    const showBanner = (manage = false) => {
      window.setTimeout(() => {
        if (cancelled) return
        setGpcEnabled(isGlobalPrivacyControlEnabled())
        const existing = readCookieConsent()
        setFunctional(existing?.preferences.functional ?? false)
        setAnalytics(existing?.preferences.analytics ?? false)
        setIsManaging(manage)
        setIsVisible(true)
      }, 0)
    }

    const handleOpenPreferences = () => showBanner(true)
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpenPreferences)

    const consent = readCookieConsent()
    if (!consent) {
      showBanner()
      return () => {
        cancelled = true
        window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpenPreferences)
      }
    }

    return () => {
      cancelled = true
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpenPreferences)
    }
  }, [])

  const handleAcceptAll = () => {
    saveCookieConsent(buildCookieConsent("accepted", { necessary: true, functional: true, analytics: !gpcEnabled }))
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    saveCookieConsent(buildCookieConsent("rejected", { necessary: true, functional: false, analytics: false }))
    setIsVisible(false)
  }

  const handleSaveChoices = () => {
    saveCookieConsent(buildCookieConsent("customized", { necessary: true, functional, analytics: gpcEnabled ? false : analytics }))
    setIsVisible(false)
  }

  const t = translations[landingLocaleToBannerLanguage(landingLocale)]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
            <section
              aria-label={t.title}
              className="relative rounded-lg border border-white/10 bg-[#10131a]/95 p-4 text-white shadow-2xl backdrop-blur-sm sm:p-5"
            >
              <button
                onClick={handleRejectAll}
                className="absolute right-3 top-3 rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={t.close}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div className="space-y-4 pr-8">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-white sm:text-lg">{t.title}</h2>
                  <p className="text-sm leading-6 text-white/78">{t.message}</p>
                  <p className="text-xs leading-5 text-white/58">
                    {t.note} {t.privacyPrefix}{" "}
                    <Link href="/privacy" className="font-medium text-app-gold underline-offset-4 hover:underline">
                      {t.privacyLink}
                    </Link>
                    .
                  </p>
                </div>

                {isManaging ? (
                  <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                    <CookieCategory
                      title={t.necessaryTitle}
                      description={t.necessaryDescription}
                      badge={t.alwaysOn}
                    />
                    <CookieToggle
                      title={t.functionalTitle}
                      description={t.functionalDescription}
                      checked={functional}
                      onChange={setFunctional}
                    />
                    <CookieToggle
                      title={t.analyticsTitle}
                      description={t.analyticsDescription}
                      checked={analytics}
                      disabled={gpcEnabled}
                      lockedLabel={gpcEnabled ? t.analyticsGpcOff : undefined}
                      onChange={setAnalytics}
                    />
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {isManaging ? (
                    <>
                      <Button onClick={handleSaveChoices} className="min-w-[150px] rounded-md">
                        {t.save}
                      </Button>
                      <Button
                        onClick={() => setIsManaging(false)}
                        variant="outline"
                        className="min-w-[150px] rounded-md border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      >
                        {t.back}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleAcceptAll} className="min-w-[180px] rounded-md">
                        {t.acceptAll}
                      </Button>
                      <Button
                        onClick={handleRejectAll}
                        variant="outline"
                        className="min-w-[180px] rounded-md border-red-500/60 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        {t.rejectAll}
                      </Button>
                      <Button
                        onClick={() => setIsManaging(true)}
                        variant="ghost"
                        className="min-w-[150px] rounded-md text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        {t.manage}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CookieCategory({
  title,
  description,
  badge,
}: {
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/62">{description}</p>
      </div>
      <span className="shrink-0 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-100">
        {badge}
      </span>
    </div>
  )
}

function CookieToggle({
  title,
  description,
  checked,
  disabled,
  lockedLabel,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  lockedLabel?: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-start sm:justify-between data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-65" data-disabled={disabled ? "true" : "false"}>
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-white/62">{description}</span>
      </span>
      {disabled && lockedLabel ? (
        <span className="shrink-0 self-start rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-100">
          {lockedLabel}
        </span>
      ) : (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-app-gold"
        />
      )}
    </label>
  )
}
