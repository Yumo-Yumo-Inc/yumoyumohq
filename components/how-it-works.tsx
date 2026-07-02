"use client"

import { Card } from "@/components/ui/card"
import { useTranslations } from "@/lib/i18n/hooks"
import { motion } from "framer-motion"

// Simple elegant number badges
const StepNumber = ({ number, gradient }: { number: number; gradient: string }) => (
  <div className={`text-6xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent opacity-90`}>
    {number}
  </div>
)

export function HowItWorks() {
  const { t } = useTranslations()
  const stepsData = t('howItWorks.steps') as Array<{ title: string; description: string }>

  const steps = [
    { gradient: "from-primary/20 to-primary/5", numberGradient: "from-primary to-orange-500" },
    { gradient: "from-purple-500/20 to-pink-500/5", numberGradient: "from-purple-500 to-pink-500" },
    { gradient: "from-cyan-500/20 to-blue-500/5", numberGradient: "from-cyan-500 to-blue-500" },
  ]

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl lg:max-w-[80%] xl:max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/40 bg-orange-500/10">
            <span className="w-2 h-2 rounded-full bg-orange-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-orange-300 tracking-wide">
              {t('howItWorks.betaNotice')}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.isArray(stepsData) && stepsData.map((stepData, index) => {
            const { gradient, numberGradient } = steps[index]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20 transition-all group h-full">
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
                  
                  <div className="p-8 relative z-10">
                    {/* Large elegant number */}
                    <div className="mb-6 text-center">
                      <StepNumber number={index + 1} gradient={numberGradient} />
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4 text-center">
                      <h3 className="text-2xl font-bold text-white">{stepData.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{stepData.description}</p>
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
