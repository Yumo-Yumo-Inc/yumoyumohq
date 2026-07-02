"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, Home, ChevronDown, FileText, Code2 } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LanguageSelector } from "@/components/language-selector"
import { useLocale } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/hooks"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPapersOpen, setIsPapersOpen] = useState(false)
  const pathname = usePathname()
  const { locale } = useLocale()
  const { t } = useTranslations("navigation")
  
  // Check if we're on the home page
  const isHomePage = pathname === "/"
  
  // Smart navigation helpers
  const getTokenomicsUrl = () => {
    return isHomePage 
      ? "#tokenomics" 
      : `/technical-paper/${locale}/04-tokenomics-mechanics/08-supply-and-allocation`
  }
  
  const getRoadmapUrl = () => {
    return isHomePage 
      ? "#roadmap" 
      : "/#roadmap"
  }

  return (
    <nav className="sticky top-0 z-50 flex min-h-16 flex-col backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="w-full px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
          <motion.div whileHover={{ scale: 1.05 }}>
            <div
              className="yumo-lockup-topbar"
              style={{ fontSize: "17px" } as React.CSSProperties}
            >
              <span className="yumo-word yumo-word-gold">YUMO</span>
              <div className="yumo-sep" />
              <span className="yumo-word yumo-word-silver">YUMO</span>
            </div>
          </motion.div>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            {t("home")}
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setIsPapersOpen(true)}
            onMouseLeave={() => setIsPapersOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsPapersOpen(!isPapersOpen)}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm flex items-center gap-1.5"
              aria-haspopup="menu"
              aria-expanded={isPapersOpen}
            >
              {t("papers")}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPapersOpen ? "rotate-180" : ""}`} />
            </button>
            {isPapersOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f]/95 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              >
                <Link
                  href={`/vision/${locale}`}
                  onClick={() => setIsPapersOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 text-sm text-gray-200 transition-colors hover:bg-white/[0.06]"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84C]" />
                  <span className="block min-w-0 flex-1">
                    <span className="block font-medium text-white">{t("visionPaper")}</span>
                    <span className="mt-0.5 block text-xs text-gray-400">
                      {t("visionPaperDesc")}
                    </span>
                  </span>
                </Link>
                <div className="h-px bg-white/[0.06]" />
                <Link
                  href={`/technical-paper/${locale}`}
                  onClick={() => setIsPapersOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 text-sm text-gray-200 transition-colors hover:bg-white/[0.06]"
                >
                  <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-[#A78BFA]" />
                  <span className="block min-w-0 flex-1">
                    <span className="block font-medium text-white">
                      {t("technicalPaper")}
                      <span className="ml-2 inline-block rounded-sm border border-[#A78BFA]/30 bg-[#A78BFA]/10 px-1.5 py-0.5 align-middle text-[9px] font-medium uppercase tracking-[0.08em] text-[#A78BFA]">
                        v0.1
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-400">
                      {t("technicalPaperDesc")}
                    </span>
                  </span>
                </Link>
              </div>
            ) : null}
          </div>
          <a
            href={getRoadmapUrl()}
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm"
          >
            {t("roadmap")}
          </a>
          <a
            href={getTokenomicsUrl()}
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm flex items-center gap-1.5"
          >
            {t("tokenomics")}
          </a>
          <a
            href="/faq"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm"
          >
            {t("faq")}
          </a>
          <LanguageSelector />
          <Button
            onClick={() => window.location.href = '/app/login'}
            className="ml-4 bg-primary hover:bg-primary/90 text-white"
          >
            {t("goApp")}
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-1.5"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                {t("home")}
              </Link>
              <Link
                href={`/vision/${locale}`}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-1.5"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-4 w-4 text-[#C9A84C]" />
                {t("visionPaper")}
              </Link>
              <Link
                href={`/technical-paper/${locale}`}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-1.5"
                onClick={() => setIsMenuOpen(false)}
              >
                <Code2 className="h-4 w-4 text-[#A78BFA]" />
                {t("technicalPaper")}
                <span className="ml-1 inline-block rounded-sm border border-[#A78BFA]/30 bg-[#A78BFA]/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[#A78BFA]">
                  v0.1
                </span>
              </Link>
              <a
                href={getRoadmapUrl()}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("roadmap")}
              </a>
              <a
                href={getTokenomicsUrl()}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-1.5"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("tokenomics")}
              </a>
              <a
                href="/faq"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("faq")}
              </a>
              <Button
                onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = '/app/login';
                }}
                className="mt-2 bg-primary hover:bg-primary/90 text-white"
              >
                {t("goApp")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
