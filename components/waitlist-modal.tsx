"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Heart, Star, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "@/lib/i18n/hooks"

const WAITLIST_MARKETING_CONSENT_VERSION = "2026-04-20"

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

const countries = [
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "OTHER", name: "Other", flag: "🌍" },
]

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const { t, locale } = useTranslations()
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("")
  const [referralSource, setReferralSource] = useState("")
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const referralSources = (t('waitlist.sources') as string[]) || []
  const waitlistPrivacyNote =
    locale === "tr"
      ? t('alerts.waitlist.privacyNote')
      : "Yumo Yumo Inc., 8 The Green Suite B, Dover, DE 19901. We use your waitlist details for launch and update emails. Every marketing email will include unsubscribe instructions."

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    setError(null)
    
    if (!email || !country || !referralSource || !marketingConsent) {
      setError(t('waitlist.error'))
      return
    }

    setIsSubmitting(true)
    
    try {
      // Use API route to avoid CORS issues
      // API route will proxy to Google Apps Script
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          country,
          referralSource,
          marketingConsent,
          consentVersion: WAITLIST_MARKETING_CONSENT_VERSION,
          consentedAt: new Date().toISOString(),
          locale,
        }),
      })

      // API route returns JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }))
        setError(errorData.error || t('waitlist.genericError') || "Something went wrong 😢")
        setIsSubmitting(false)
        return
      }

      const data = await response.json()

      // Check for errors in response
      if (data?.error) {
        if (data.error.includes("already") || data.error.includes("duplicate")) {
          setError(t('waitlist.alreadyExists') || "You're already on the waitlist! 🎉")
        } else {
          setError(data.error || t('waitlist.genericError') || "Something went wrong 😢")
        }
        setIsSubmitting(false)
        return
      }

      // Check for success
      if (!data?.success) {
        setError(t('waitlist.genericError') || "Something went wrong 😢")
        setIsSubmitting(false)
        return
      }

      // Success - show success message
      setIsSubmitted(true)
      
      // Clean up previous timeout if exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Clean up and close modal after delay
      timeoutRef.current = setTimeout(() => {
        try {
          onClose()
          setEmail("")
          setCountry("")
          setReferralSource("")
          setMarketingConsent(false)
          setIsSubmitted(false)
          timeoutRef.current = null
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError)
          // Ignore cleanup errors - modal might already be closed
        }
      }, 3000)
    } catch (err: any) {
      // Handle network errors, JSON parse errors, etc.
      console.error("Waitlist submission error:", err)
      
      // Provide user-friendly error message
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(t('waitlist.networkError') || "Network error. Please check your connection and try again! 💫")
      } else if (err instanceof Error) {
        setError(err.message || t('waitlist.connectionError') || "Connection error. Please try again! 💫")
      } else {
        setError(t('waitlist.genericError') || "Something went wrong. Please try again! 💫")
      }
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-purple-900/40 backdrop-blur-md"
        />

        {/* Floating decorations */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          className="absolute top-20 left-[15%] text-4xl pointer-events-none hidden md:block"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          className="absolute top-32 right-[20%] text-3xl pointer-events-none hidden md:block"
        >
          💖
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 left-[25%] text-3xl pointer-events-none hidden md:block"
        >
          🌟
        </motion.div>
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          className="absolute bottom-40 right-[15%] text-4xl pointer-events-none hidden md:block"
        >
          🧾
        </motion.div>

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative w-full max-w-xl"
        >
          {/* Kawaii border glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-400 to-emerald-400 rounded-3xl blur-lg opacity-50 animate-pulse" />
          
          <div className="relative bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/30 rounded-3xl p-8 md:p-10 shadow-2xl border-2 border-pink-200 dark:border-purple-700">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-pink-100 hover:bg-pink-200 dark:bg-purple-800 dark:hover:bg-purple-700 flex items-center justify-center transition-colors group"
            >
              <X className="w-4 h-4 text-pink-500 dark:text-purple-300 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Decorative corner elements */}
            <div className="absolute top-3 left-3 flex gap-1">
              <div className="w-2 h-2 rounded-full bg-pink-300" />
              <div className="w-2 h-2 rounded-full bg-purple-300" />
              <div className="w-2 h-2 rounded-full bg-emerald-300" />
            </div>

            {!isSubmitted ? (
              <>
                {/* Header with icon */}
                <div className="text-center mb-8">
                  <motion.div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-500 bg-clip-text text-transparent">
                    {t('waitlist.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    {t('waitlist.subtitle')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 mb-2 block font-medium flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      {t('waitlist.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={locale === "tr" ? "ornek@eposta.com" : "your@email.com"}
                      required
                      className="w-full h-12 text-base rounded-xl border-2 border-pink-200 focus:border-purple-400 dark:border-purple-700 bg-white dark:bg-gray-800 shadow-sm"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <Label htmlFor="country" className="text-gray-700 dark:text-gray-300 mb-2 block font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      {t('waitlist.country')}
                    </Label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="flex h-12 w-full rounded-xl border-2 border-pink-200 focus:border-purple-400 dark:border-purple-700 bg-white dark:bg-gray-800 px-4 py-2 text-base shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 transition-all duration-300 cursor-pointer"
                    >
                      <option value="">🌍 {t('waitlist.selectCountry') || 'Select your country'}</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Referral Source */}
                  <div>
                    <Label htmlFor="referral" className="text-gray-700 dark:text-gray-300 mb-2 block font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 text-emerald-400" />
                      {t('waitlist.referralSource')}
                    </Label>
                    <select
                      id="referral"
                      value={referralSource}
                      onChange={(e) => setReferralSource(e.target.value)}
                      required
                      className="flex h-12 w-full rounded-xl border-2 border-pink-200 focus:border-purple-400 dark:border-purple-700 bg-white dark:bg-gray-800 px-4 py-2 text-base shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 transition-all duration-300 cursor-pointer"
                    >
                      <option value="">✨ {t('waitlist.selectOption') || 'Select an option'}</option>
                      {referralSources.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-pink-200 bg-white/70 p-3 text-sm text-gray-600 dark:border-purple-700 dark:bg-gray-800/70 dark:text-gray-300">
                    <Checkbox
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                      className="mt-0.5"
                    />
                    <span>
                      {t('waitlist.marketingConsent') ||
                        "I agree to receive Yumo Yumo launch news, product updates, and waitlist emails. I can unsubscribe from marketing emails at any time."}
                    </span>
                  </label>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 px-4 py-3 rounded-xl text-center text-sm font-medium"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-500 hover:from-pink-600 hover:via-purple-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          ✨
                        </motion.div>
                        {t('waitlist.submitting')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('waitlist.submit')}
                        <Sparkles className="w-5 h-5" />
                      </span>
                    )}
                  </Button>

                  {/* Privacy note */}
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    {waitlistPrivacyNote}
                  </p>
                </form>
              </>
            ) : (
              /* Success state */
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-pink-400 via-purple-500 to-emerald-400 flex items-center justify-center shadow-xl"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-3">
                    {t('waitlist.successTitle') || t('waitlist.success')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {t('waitlist.successMessage') || "We'll notify you when Yumo Yumo launches."}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    {t('waitlist.inboxMessage') || "Keep an eye on your inbox! 💌"}
                  </p>
                </motion.div>

                {/* Confetti-like elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 0, 
                        x: "50%", 
                        y: "50%",
                        scale: 0 
                      }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        x: `${20 + Math.random() * 60}%`,
                        y: `${Math.random() * 100}%`,
                        scale: [0, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        delay: 0.3 + i * 0.1,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="absolute text-2xl"
                    >
                      {["✨", "💖", "🌟", "🎉", "💫", "🧾"][i]}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}



