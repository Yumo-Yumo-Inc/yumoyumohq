"use client"

import type { ReactNode } from "react"
import { useTranslations } from "@/lib/i18n/hooks"
import { motion } from "framer-motion"

type StackItem = {
  name: BrandName
}

type BrandName =
  | "OpenAI"
  | "Anthropic"
  | "Google"
  | "Solana"
  | "Vercel"
  | "Cursor"
  | "Cloudflare"
  | "Phantom"

function BrandLogoImage({ src, className }: { src: string; className: string }) {
  return <img src={src} alt="" aria-hidden className={className} />
}

function VercelMark() {
  return <BrandLogoImage src="/logos/brands/vercel.svg" className="h-24 w-auto" />
}

function CursorMark() {
  return <BrandLogoImage src="/logos/brands/cursor.svg" className="h-24 w-auto" />
}

function CloudflareMark() {
  return (
    <svg viewBox="0 0 72 48" className="h-24 w-36" aria-hidden="true">
      <path
        d="M51.7 36.2c4.9 0 8.9-4 8.9-8.9s-4-8.9-8.9-8.9c-.8 0-1.7.1-2.4.3C46.6 13.1 41 9.6 34.6 9.6c-8 0-14.8 5.7-16.4 13.3C12.1 23.5 7.4 28.7 7.4 35c0 6.8 5.6 12.4 12.4 12.4h31.4c3.9 0 7-3.1 7-7 0-1.9-.8-3.7-2.1-5-1.3.5-2.8.8-4.4.8Z"
        fill="#f38020"
      />
      <path
        d="M52.8 33H30.5c-.8 0-1.5-.6-1.5-1.4 0-.7.6-1.4 1.3-1.4l22.5-.1c2.9-.1 5.2-2.5 5.2-5.4 0-1.4-.5-2.7-1.4-3.7 2.5 1.6 4.2 4.3 4.2 7.5 0 2.2-.8 4.3-2.2 5.9-1.6-.9-3.5-1.4-5.8-1.4Z"
        fill="#faae40"
      />
    </svg>
  )
}

function PhantomMark() {
  return <BrandLogoImage src="/logos/brands/phantom.svg" className="h-24 w-auto" />
}

function SolanaMark() {
  return (
    <svg viewBox="0 0 96 64" className="h-24 w-36" aria-hidden="true">
      <defs>
        <linearGradient id="solana-a" x1="8" x2="88" y1="8" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14f195" />
          <stop offset="0.5" stopColor="#80ecff" />
          <stop offset="1" stopColor="#9945ff" />
        </linearGradient>
      </defs>
      <path d="M20 12h64L72 24H8L20 12Z" fill="url(#solana-a)" />
      <path d="M8 38h64l12-12H20L8 38Z" fill="url(#solana-a)" />
      <path d="M20 40h64L72 52H8l12-12Z" fill="url(#solana-a)" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24" aria-hidden="true">
      <path d="M57.7 32.7c0-2.1-.2-3.7-.6-5.4H32.6v10.3h14.3c-.3 2.6-1.9 6.4-5.5 9l-.1.7 8 6.2.6.1c5.4-5 8.5-12.4 8.5-21Z" fill="#4285F4" />
      <path d="M32.6 58c7.7 0 14.2-2.5 18.9-6.9l-9-7c-2.4 1.7-5.6 2.9-9.9 2.9-7.6 0-14-5-16.3-11.8l-.7.1-8.3 6.4-.1.6C11.9 51.6 21.5 58 32.6 58Z" fill="#34A853" />
      <path d="M16.3 35.2c-.6-1.7-1-3.6-1-5.5s.4-3.8.9-5.5v-.7l-8.4-6.5-.6.3C5.2 21.2 4 25.4 4 29.7s1.1 8.5 3.1 12.2l9.2-6.7Z" fill="#FBBC05" />
      <path d="M32.6 12.4c5.4 0 9.1 2.3 11.2 4.3l8.2-8C47 4.1 40.3 1.4 32.6 1.4 21.5 1.4 11.9 7.8 7.1 17l9.1 7.1c2.3-6.8 8.8-11.7 16.4-11.7Z" fill="#EB4335" />
    </svg>
  )
}

function OpenAIMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24 text-white" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 7.5c5.9 0 10.6 4.7 10.6 10.6v5.5" />
        <path d="M51.8 18.8c3 5.1 1.2 11.6-3.9 14.6l-4.8 2.8" />
        <path d="M51.8 45.2c-3 5.1-9.5 6.8-14.6 3.9l-4.8-2.8" />
        <path d="M32 56.5c-5.9 0-10.6-4.7-10.6-10.6v-5.5" />
        <path d="M12.2 45.2c-3-5.1-1.2-11.6 3.9-14.6l4.8-2.8" />
        <path d="M12.2 18.8c3-5.1 9.5-6.8 14.6-3.9l4.8 2.8" />
        <path d="M24 27.4 32 22.8l8 4.6v9.2l-8 4.6-8-4.6v-9.2Z" />
      </g>
    </svg>
  )
}

// Anthropic burst mark, rendered in the brand clay tone.
function AnthropicMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24" aria-hidden="true">
      <g stroke="#D97757" strokeWidth="3.4" strokeLinecap="round">
        <line x1="38" y1="32" x2="58" y2="32" />
        <line x1="37.2" y1="35" x2="54.5" y2="45" />
        <line x1="35" y1="37.2" x2="45" y2="54.5" />
        <line x1="32" y1="38" x2="32" y2="58" />
        <line x1="29" y1="37.2" x2="19" y2="54.5" />
        <line x1="26.8" y1="35" x2="9.5" y2="45" />
        <line x1="26" y1="32" x2="6" y2="32" />
        <line x1="26.8" y1="29" x2="9.5" y2="19" />
        <line x1="29" y1="26.8" x2="19" y2="9.5" />
        <line x1="32" y1="26" x2="32" y2="6" />
        <line x1="35" y1="26.8" x2="45" y2="9.5" />
        <line x1="37.2" y1="29" x2="54.5" y2="19" />
      </g>
      <circle cx="32" cy="32" r="5.2" fill="#D97757" />
    </svg>
  )
}

const brandMarks: Record<BrandName, () => ReactNode> = {
  OpenAI: OpenAIMark,
  Anthropic: AnthropicMark,
  Google: GoogleMark,
  Solana: SolanaMark,
  Vercel: VercelMark,
  Cursor: CursorMark,
  Cloudflare: CloudflareMark,
  Phantom: PhantomMark,
}

function isBrandName(value: unknown): value is BrandName {
  return typeof value === "string" && value in brandMarks
}

function resolveStackItems(raw: unknown): Array<StackItem & { name: BrandName }> {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object" || !("name" in item)) return []
    const name = (item as StackItem).name
    return isBrandName(name) ? [{ name }] : []
  })
}

export function TechnologyStackSection() {
  const { t } = useTranslations()
  const items = resolveStackItems(t("technologyStack.items"))

  return (
    <section id="technology-stack" className="relative scroll-mt-32 overflow-hidden px-4 py-28 md:scroll-mt-24">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 18% 10%, rgba(255,122,26,0.13), transparent 65%), radial-gradient(ellipse 48% 38% at 88% 50%, rgba(20,241,149,0.09), transparent 64%), radial-gradient(ellipse 45% 35% at 50% 100%, rgba(153,69,255,0.11), transparent 66%)",
        }}
      />

      <div className="container relative z-10 mx-auto max-w-7xl lg:max-w-[84%] xl:max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-4xl text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/90">
            {t("technologyStack.eyebrow")}
          </p>
          <h2 className="text-5xl font-black tracking-normal text-white md:text-6xl">
            {t("technologyStack.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">
            {t("technologyStack.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
              const Mark = brandMarks[item.name]

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group relative min-h-[280px] overflow-hidden rounded-lg border border-white/12 bg-white/[0.055] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.075] md:min-h-[300px]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/[0.045] blur-2xl transition-opacity group-hover:opacity-80" />

                  <div className="relative flex h-full min-h-[216px] flex-col items-center justify-center gap-8 text-center">
                    <div className="flex h-28 items-center justify-center">
                      <Mark />
                    </div>
                    <h3
                      className="bg-gradient-to-b from-white via-white to-white/72 bg-clip-text text-4xl font-black tracking-normal text-transparent md:text-5xl"
                      style={{
                        textShadow:
                          "0 1px 0 rgba(255,255,255,0.35), 0 12px 28px rgba(0,0,0,0.55), 0 0 34px rgba(255,255,255,0.16)",
                      }}
                    >
                      {item.name}
                    </h3>
                  </div>
                </motion.div>
              )
            })}
        </div>

        <div className="mx-auto mt-7 max-w-5xl rounded-lg border border-white/10 bg-black/30 px-6 py-4 text-center text-xs leading-relaxed text-gray-400">
          {t("technologyStack.disclaimer")}
        </div>
      </div>
    </section>
  )
}
