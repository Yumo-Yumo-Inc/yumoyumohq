"use client"

import { useLocale } from '@/lib/i18n/context'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Receipt, Database, Coins } from 'lucide-react'
import { Fragment } from 'react'

// Cool accent (cyan -> indigo), set apart from the warm hero so the
// hero -> definition handoff reads cooler.
const COOL_GRADIENT = 'linear-gradient(92deg, #38bdf8 0%, #818cf8 55%, #a78bfa 100%)'

const coolTextStyle = {
  background: COOL_GRADIENT,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
} as const

type Part = { t: string; hl?: 'brand' | 'accent' }
type Locale = { label: string; parts: Part[]; steps: [string, string, string] }

const CONTENT: Record<string, Locale> = {
  en: {
    label: 'What is Yumo Yumo?',
    parts: [
      { t: 'Yumo Yumo', hl: 'brand' },
      { t: ' is the first blockchain project that records all spending and generates value from ' },
      { t: 'real economic data', hl: 'accent' },
      { t: '. Every purchase you make turns into data — and that data turns into ' },
      { t: 'rewards for you', hl: 'accent' },
      { t: '.' },
    ],
    steps: ['Spending', 'Data', 'Rewards'],
  },
  tr: {
    label: 'Yumo Yumo nedir?',
    parts: [
      { t: 'Yumo Yumo', hl: 'brand' },
      { t: ', tüm harcamaları kayıt altına alan ve ' },
      { t: 'gerçek ekonomik verilerden', hl: 'accent' },
      { t: ' değer üreten ilk blockchain projesidir. Harcadığın her kuruş artık veriye, o veri de ' },
      { t: 'sana ödüle', hl: 'accent' },
      { t: ' dönüşüyor.' },
    ],
    steps: ['Harcama', 'Veri', 'Ödül'],
  },
  ru: {
    label: 'Что такое Yumo Yumo?',
    parts: [
      { t: 'Yumo Yumo', hl: 'brand' },
      { t: ' — первый блокчейн-проект, который фиксирует все расходы и создаёт ценность из ' },
      { t: 'реальных экономических данных', hl: 'accent' },
      { t: '. Каждая твоя покупка превращается в данные, а эти данные — в ' },
      { t: 'награды для тебя', hl: 'accent' },
      { t: '.' },
    ],
    steps: ['Расходы', 'Данные', 'Награды'],
  },
  th: {
    label: 'Yumo Yumo คืออะไร?',
    parts: [
      { t: 'Yumo Yumo', hl: 'brand' },
      { t: ' คือโครงการบล็อกเชนแรกที่บันทึกค่าใช้จ่ายทั้งหมดและสร้างมูลค่าจาก' },
      { t: 'ข้อมูลเศรษฐกิจจริง', hl: 'accent' },
      { t: ' ทุกการใช้จ่ายของคุณกลายเป็นข้อมูล และข้อมูลนั้นก็กลายเป็น' },
      { t: 'รางวัลของคุณ', hl: 'accent' },
    ],
    steps: ['การใช้จ่าย', 'ข้อมูล', 'รางวัล'],
  },
  zh: {
    label: '什么是 Yumo Yumo？',
    parts: [
      { t: 'Yumo Yumo', hl: 'brand' },
      { t: ' 是首个记录所有支出并从' },
      { t: '真实经济数据', hl: 'accent' },
      { t: '中创造价值的区块链项目。你的每一笔消费都化作数据，而这些数据又化作' },
      { t: '属于你的奖励', hl: 'accent' },
      { t: '。' },
    ],
    steps: ['消费', '数据', '奖励'],
  },
  es: {
    label: '¿Qué es Yumo Yumo?',
    parts: [
      { t: 'Yumo Yumo', hl: 'brand' },
      { t: ' es el primer proyecto blockchain que registra todos los gastos y genera valor a partir de ' },
      { t: 'datos económicos reales', hl: 'accent' },
      { t: '. Cada compra que haces se convierte en datos, y esos datos se convierten en ' },
      { t: 'recompensas para ti', hl: 'accent' },
      { t: '.' },
    ],
    steps: ['Gasto', 'Datos', 'Recompensa'],
  },
}

const STEP_META = [
  { Icon: Receipt, color: '#38bdf8' }, // spending — cyan
  { Icon: Database, color: '#818cf8' }, // data — indigo
  { Icon: Coins, color: '#14f195' }, // rewards — Solana green
]

// Full-bleed editorial "definition" band shown directly under the hero.
export function WhatIsYumo() {
  const { locale } = useLocale()
  const reduce = useReducedMotion()
  const c = CONTENT[locale] || CONTENT.en

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section className="relative overflow-hidden py-28 md:py-44">
      {/* Cool seam: mute the warm wash inherited from the page background at the
          hero -> definition transition, then wash the whole band in cool light. */}
      <div
        className="absolute inset-x-0 top-0 h-72 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #0b0e16 0%, rgba(11,14,22,0) 100%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 6%, rgba(56,189,248,0.13), transparent 70%), radial-gradient(50% 60% at 4% 8%, rgba(99,102,241,0.12), transparent 68%)',
        }}
      />
      {/* Full-width editorial hairlines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

      <motion.div
        className="container relative z-10 mx-auto px-6"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Eyebrow */}
        <motion.div variants={item} className="flex justify-center">
          <span className="inline-flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#38bdf8', boxShadow: '0 0 12px #38bdf8' }} />
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.32em]" style={coolTextStyle}>
              {c.label}
            </span>
          </span>
        </motion.div>

        {/* Oversized editorial statement — muted base, brand + key phrases lifted */}
        <motion.p
          variants={item}
          className="mx-auto mt-10 max-w-5xl text-center font-bold text-white/45 text-balance"
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 3.15rem)',
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
          }}
        >
          {c.parts.map((p, i) =>
            p.hl === 'brand' ? (
              <span key={i} className="font-extrabold" style={coolTextStyle}>
                {p.t}
              </span>
            ) : p.hl === 'accent' ? (
              <span key={i} className="text-white">
                {p.t}
              </span>
            ) : (
              <Fragment key={i}>{p.t}</Fragment>
            ),
          )}
        </motion.p>

        {/* Value loop: Spending -> Data -> Rewards */}
        <motion.div
          variants={item}
          className="mx-auto mt-16 flex max-w-2xl items-start justify-center md:mt-20"
        >
          {c.steps.map((label, i) => {
            const { Icon, color } = STEP_META[i]
            return (
              <Fragment key={label}>
                <div className="flex w-24 flex-col items-center gap-3 md:w-28">
                  <div
                    className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 backdrop-blur-md md:h-16 md:w-16"
                    style={{
                      background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: `radial-gradient(circle at 50% 30%, ${color}22, transparent 70%)` }}
                    />
                    <Icon className="relative h-6 w-6 md:h-7 md:w-7" style={{ color }} />
                  </div>
                  <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.16em] text-white/75">
                    {label}
                  </span>
                </div>

                {/* connector with a flowing dot */}
                {i < c.steps.length - 1 && (
                  <div className="relative mt-7 h-px flex-1 md:mt-8" style={{ background: 'linear-gradient(90deg, rgba(129,140,248,0.12), rgba(56,189,248,0.45), rgba(20,241,149,0.12))' }}>
                    {!reduce && (
                      <motion.span
                        className="absolute top-1/2 h-1.5 w-1.5 rounded-full"
                        style={{ background: '#7dd3fc', boxShadow: '0 0 10px #38bdf8', marginTop: -3 }}
                        initial={{ left: '0%', opacity: 0 }}
                        animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                      />
                    )}
                  </div>
                )}
              </Fragment>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}
