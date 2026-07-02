"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_LOCALES } from "@/components/app/app-locale-dropdown";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useMounted } from "@/lib/hooks/use-mounted";

export function AppLanguageSelector() {
  const { locale, setLocale } = useAppLocale();
  const mounted = useMounted();

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="gap-2"
    >
      <Globe className="h-4 w-4" />
    </Button>
  );

  if (!mounted) return trigger;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={6}
        className="max-h-[min(70vh,420px)] min-w-[188px] overflow-y-auto"
      >
        {APP_LOCALES.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setLocale(opt.value)}
            className={`cursor-pointer gap-2 ${locale === opt.value ? "bg-gray-100 font-semibold dark:bg-gray-800" : ""} text-foreground`}
          >
            <span aria-hidden>{opt.flag}</span>
            <span className="flex-1">{opt.label}</span>
            <span className="text-[10px] font-bold uppercase opacity-60">{opt.short}</span>
            {locale === opt.value && <span className="text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
