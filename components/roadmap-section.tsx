"use client"

import { Card } from "@/components/ui/card"
import { useTranslations } from "@/lib/i18n/hooks"
import { motion } from "framer-motion"

// Phase badges with elegant gradients
const PhaseBadge = ({ phase, gradient }: { phase: string; gradient: string }) => (
  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${gradient} text-white font-bold text-sm`}>
    {phase}
  </div>
)

export function RoadmapSection() {
  const { t } = useTranslations()
  const roadmapData = t('roadmap.items') as Array<{
    quarter: string
    year: string
    title: string
    items: Array<{ text: string; status?: 'live' | 'launching' }>
  }>

  const phases = [
    { gradient: "from-primary to-orange-500", emoji: "🚀" },
    { gradient: "from-purple-500 to-pink-500", emoji: "📈" },
    { gradient: "from-cyan-500 to-blue-500", emoji: "🌍" },
  ]

  return (
    <section id="roadmap" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl lg:max-w-[80%] xl:max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            {t('roadmap.title')}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t('roadmap.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.isArray(roadmapData) && roadmapData.map((item, idx) => {
            const phase = phases[idx]
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
              >
                <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20 transition-all h-full group">
                  {/* Top gradient border */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${phase.gradient}`} />
                  
                  <div className="p-8">
                    {/* Phase badge */}
                    <div className="mb-6">
                      <PhaseBadge phase={`P${idx + 1} ${phase.emoji}`} gradient={phase.gradient} />
                    </div>

                    {/* Title */}
                    <div className="mb-6">
                      <div className="text-sm font-semibold text-gray-400 mb-2" suppressHydrationWarning>
                        {item.quarter} {phase.emoji}
                      </div>
                      <h3 className="text-2xl font-bold text-white leading-tight">{item.title}</h3>
                    </div>

                    {/* Items — status badges only on verified items (plan item 8:
                        Live = cPoints ledger / PoE data contribution; Launching
                        = TGE public announcement (Aug 24); others carry no marker). */}
                    <div className="space-y-3">
                      {Array.isArray(item.items) && item.items.map((subItem, subIdx) => (
                        <div key={subIdx} className="flex items-start gap-3 group/item">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${phase.gradient} mt-1.5 flex-shrink-0`} />
                          <span className="text-gray-300 text-sm leading-relaxed group-hover/item:text-white transition-colors">
                            {subItem.text}
                            {subItem.status === 'live' && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 align-middle">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                                {t('roadmap.statusLive')}
                              </span>
                            )}
                            {subItem.status === 'launching' && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 align-middle">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                                {t('roadmap.statusLaunching')}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
