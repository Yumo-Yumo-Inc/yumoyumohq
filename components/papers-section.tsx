"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/i18n/hooks"
import { motion } from "framer-motion"

// Performance-conscious rewrite of the magazine-cover papers grid.
// The previous version stacked 6 backdrop-blur-xl layers + 4 blur-3xl overlays + 2 inline SVG
// patterns per card; with 2 cards that's a compositor pipeline of ~20 GPU layers competing
// every scroll frame. Magazine-cover identity preserved via solid gradients, CSS grid
// pattern (data URL), and a single static glow per card.
export function PapersSection() {
  const { t, locale } = useTranslations()
  const visionPaperTagsRaw = t('papers.visionPaper.tags')
  const seriousPaperTagsRaw = t('papers.seriousPaper.tags')
  const visionPaperTags = Array.isArray(visionPaperTagsRaw) ? visionPaperTagsRaw : []
  const seriousPaperTags = Array.isArray(seriousPaperTagsRaw) ? seriousPaperTagsRaw : []

  const getVisionPaperUrl = () => `/vision/${locale || "en"}`
  const getTechnicalPaperUrl = () => `/technical-paper/${locale || "tr"}`

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl lg:max-w-[80%] xl:max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-pink-500 to-orange-500 bg-clip-text text-transparent">
            {t('papers.title')}
          </h2>
          <p className="text-gray-400">{t('papers.subtitle')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto lg:max-w-[80%] xl:max-w-4xl items-stretch">

          {/* Vision Paper — manifesto cover (matches the vision paper's paper-dark + violet identity) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="flex"
          >
            <Link
              href={getVisionPaperUrl()}
              className="group block relative bg-white/[0.04] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col w-full transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Cover area — vision-paper palette (#0B0B0E → #1E1E26) with violet accent orbs */}
              <div
                className="relative h-[500px] border-b border-white/10 overflow-hidden"
                style={{
                  background:
                    'radial-gradient(ellipse 60% 50% at 22% 18%, rgba(122, 90, 248, 0.30), transparent 60%),' +
                    'radial-gradient(ellipse 52% 42% at 82% 84%, rgba(169, 146, 255, 0.16), transparent 60%),' +
                    'linear-gradient(135deg, #0B0B0E 0%, #15151B 50%, #1E1E26 100%)',
                }}
              >
                {/* Ruled-paper baseline lines — editorial manifesto feel (no grain) */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(169, 146, 255, 0.8) 1px, transparent 1px)',
                    backgroundSize: '100% 34px',
                  }}
                />

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-6 z-10 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-white text-xl font-bold tracking-wider">YUMO YUMO</h3>
                    <p className="whitespace-nowrap text-[#A992FF]/85 text-xs font-mono tracking-wide mt-0.5">Vision · v0.4 · 2026</p>
                  </div>
                  <div className="shrink-0 rounded-full border border-[#A992FF]/40 bg-[#7A5AF8]/15 px-3 py-1 backdrop-blur-sm">
                    <span className="whitespace-nowrap text-[#D8CFFF] font-semibold text-xs tracking-wide">VISION PAPER</span>
                  </div>
                </div>

                {/* Center orb — Proof of Expense (echoes the vision hero orb) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/15 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 30%, #A992FF, #7A5AF8 55%, #4A2EBA 100%)',
                      boxShadow:
                        '0 0 60px rgba(122, 90, 248, 0.45), inset 0 2px 14px rgba(255, 255, 255, 0.22)',
                    }}
                  >
                    <span className="text-center text-sm font-semibold leading-tight tracking-wide text-white drop-shadow">
                      Proof<br />of Expense
                    </span>
                  </div>
                </div>

                {/* Cover title — solid gradient overlay, no backdrop-blur */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-6 z-10"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 70%, transparent 100%)',
                  }}
                >
                  <h4 className="text-white text-4xl md:text-5xl font-bold mb-3 leading-tight drop-shadow-lg whitespace-pre-line break-words">
                    {t('papers.visionPaper.title')}
                  </h4>
                  <p className="text-[#D8CFFF] text-lg md:text-xl mb-4 font-medium italic drop-shadow-md">
                    {t('papers.visionPaper.subtitle')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visionPaperTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-[#7A5AF8]/85 text-white px-3 py-1.5 rounded-full text-sm font-semibold border border-[#A992FF]/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description strip */}
              <div className="p-4 pb-6 bg-white/[0.03] border-t border-white/10 min-h-[120px] flex flex-col justify-center">
                <p className="text-gray-300 text-sm leading-normal whitespace-pre-line">
                  {t('papers.visionPaper.description')}
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Technical Paper — mirrors the Vision card exactly; blue accent instead of violet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex"
          >
            <Link
              href={getTechnicalPaperUrl()}
              className="group block relative bg-white/[0.04] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col w-full transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Cover area — same paper base as the Vision card (#0B0B0E → #1E1E26), blue accent orbs */}
              <div
                className="relative h-[500px] border-b border-white/10 overflow-hidden"
                style={{
                  background:
                    'radial-gradient(ellipse 60% 50% at 22% 18%, rgba(59, 130, 246, 0.30), transparent 60%),' +
                    'radial-gradient(ellipse 52% 42% at 82% 84%, rgba(125, 211, 252, 0.16), transparent 60%),' +
                    'linear-gradient(135deg, #0B0B0E 0%, #15151B 50%, #1E1E26 100%)',
                }}
              >
                {/* Ruled-paper baseline lines — identical structure to the Vision card */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(125, 211, 252, 0.8) 1px, transparent 1px)',
                    backgroundSize: '100% 34px',
                  }}
                />

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-6 z-10 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-white text-xl font-bold tracking-wider">YUMO YUMO</h3>
                    <p className="whitespace-nowrap text-[#7DD3FC]/85 text-xs font-mono tracking-wide mt-0.5">Technical · v0.1 · 2026</p>
                  </div>
                  <div className="shrink-0 rounded-full border border-[#5BA8FF]/40 bg-[#3B82F6]/15 px-3 py-1 backdrop-blur-sm">
                    <span className="whitespace-nowrap text-[#CFE6FF] font-semibold text-xs tracking-wide">TECHNICAL PAPER</span>
                  </div>
                </div>

                {/* Center orb — engineering glyph (mirrors the Vision orb shape/size/glow) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/15 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 30%, #7DD3FC, #3B82F6 55%, #1E40AF 100%)',
                      boxShadow:
                        '0 0 60px rgba(59, 130, 246, 0.45), inset 0 2px 14px rgba(255, 255, 255, 0.22)',
                    }}
                  >
                    <svg className="h-16 w-16 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                </div>

                {/* Cover title — identical treatment to the Vision card */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-6 z-10"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 70%, transparent 100%)',
                  }}
                >
                  <h4 className="text-white text-4xl md:text-5xl font-bold mb-3 leading-tight drop-shadow-lg whitespace-pre-line break-words">
                    {t('papers.seriousPaper.title')}
                  </h4>
                  <p className="text-[#CFE6FF] text-lg md:text-xl mb-4 font-medium italic drop-shadow-md">
                    {t('papers.seriousPaper.subtitle')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {seriousPaperTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-[#3B82F6]/85 text-white px-3 py-1.5 rounded-full text-sm font-semibold border border-[#5BA8FF]/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description strip — identical to the Vision card */}
              <div className="p-4 pb-6 bg-white/[0.03] border-t border-white/10 min-h-[120px] flex flex-col justify-center">
                <p className="text-gray-300 text-sm leading-normal whitespace-pre-line">
                  {t('papers.seriousPaper.description')}
                </p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
