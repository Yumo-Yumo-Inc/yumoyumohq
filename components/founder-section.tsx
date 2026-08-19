"use client"

import Link from "next/link"
import { ArrowRight, Landmark } from "lucide-react"
import { useTranslations } from "@/lib/i18n/hooks"
import { motion } from "framer-motion"

// Founder card (plan item 6): Uğur Alacakapı, credentials sourced from the
// /about page. The bio sentence is duplicated in app/(landing)/about/page.tsx
// (inline en/tr) — keep the two in sync when credentials change. The monogram
// avatar stands in until Uğur provides a photo; the LinkedIn link renders once
// its URL is provided — no dead links.
export function FounderSection() {
  const { t } = useTranslations()

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl lg:max-w-[80%] xl:max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-pink-500 to-orange-500" />

            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10">
                {/* Avatar — monogram until a founder photo is provided */}
                <div className="shrink-0">
                  <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-gradient-to-br from-primary via-pink-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      UA
                    </span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left min-w-0">
                  <div className="flex items-center justify-center md:justify-start gap-2.5 mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" style={{ boxShadow: "0 0 12px #f97316" }} />
                    <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.32em] text-primary">
                      {t('founder.label')}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    {t('founder.name')}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-gray-400">
                    {t('founder.role')}
                  </p>

                  <p className="mt-4 text-gray-300 leading-relaxed">
                    {t('founder.bio')}
                  </p>

                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-400">
                    <Landmark className="h-4 w-4 shrink-0 text-primary/80" />
                    {t('founder.company')}
                  </p>

                  <div className="mt-6">
                    <Link
                      href="/about"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-black/45 px-6 py-3 text-sm font-bold text-white backdrop-blur-xl transition-colors hover:bg-white/10 hover:border-white/40"
                    >
                      {t('founder.cta')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
