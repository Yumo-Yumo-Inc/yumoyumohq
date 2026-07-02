"use client"

import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/lib/i18n/context"
import { locales, localeNames, localeFlags } from "@/lib/i18n/types"
import { EnFlag } from "@/components/icons/en-flag"
import { useState, useEffect } from "react"

// English has no single emoji flag, so render the composite EnFlag mark.
function FlagGlyph({ loc, size }: { loc: keyof typeof localeFlags; size: number }) {
  if (loc === "en") return <EnFlag size={size} className="rounded-[3px]" />;
  return <span style={{ fontSize: size }}>{localeFlags[loc]}</span>;
}

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2 bg-white/5 hover:bg-white/10 border-white/20 text-white"
        disabled
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline text-sm">{localeNames['en']}</span>
        <span className="sm:hidden inline-flex"><FlagGlyph loc="en" size={20} /></span>
      </Button>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white/5 hover:bg-white/15 border-white/20 text-white backdrop-blur-xl transition-all hover:border-primary/50"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline text-sm">{localeNames[locale]}</span>
          <span className="sm:hidden inline-flex"><FlagGlyph loc={locale} size={20} /></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] bg-black/95 backdrop-blur-xl border-white/10 shadow-2xl">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={`cursor-pointer flex items-center gap-3 text-white hover:bg-white/10 py-2.5 ${
              locale === loc ? 'bg-primary/20 font-semibold' : ''
            }`}
          >
            <span className="inline-flex w-7 justify-center"><FlagGlyph loc={loc} size={22} /></span>
            <span>{localeNames[loc]}</span>
            {locale === loc && (
              <span className="ml-auto text-xs text-primary font-bold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}




































