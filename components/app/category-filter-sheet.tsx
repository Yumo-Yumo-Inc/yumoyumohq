"use client";

/**
 * Category filter for the receipts feed.
 *
 * Design (researched pattern): native <select> is wrong on mobile for ~17
 * options. Instead a chip trigger opens a bottom sheet with large, touch-
 * friendly rows — icon + localized label + count + selected check. Built on
 * Radix Dialog primitives (reliable taps; vaul's drag handling swallowed the
 * row clicks). Categories are real canonical categories (normalizeReceiptCategory),
 * labelled via the shared categoryLabel(); nothing is collapsed into a guess.
 */

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Coffee, UtensilsCrossed, ShoppingCart, Shirt, Smartphone, Fuel, Wine,
  Cigarette, Pill, ShoppingBag, Sparkles, Droplets, Plug, Plane, Hotel,
  Stethoscope, Wrench, Tag, Check, ChevronDown, SlidersHorizontal, Layers,
  type LucideIcon,
} from "lucide-react";
import { categoryLabel } from "@/lib/i18n/taxonomy";
import { useAppLocale } from "@/lib/i18n/app-context";
import type { YumoLocale } from "@/lib/product-architecture/dashboard-contract";

export interface CategoryOption {
  key: string; // canonical category or "other"
  count: number;
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  cafe: Coffee,
  restaurant: UtensilsCrossed,
  grocery: ShoppingCart,
  apparel: Shirt,
  fashion: ShoppingBag,
  electronics: Smartphone,
  fuel: Fuel,
  alcohol: Wine,
  tobacco: Cigarette,
  pharmacy: Pill,
  beauty: Sparkles,
  personal_care: Droplets,
  utilities: Plug,
  travel: Plane,
  hospitality_lodging: Hotel,
  healthcare: Stethoscope,
  services: Wrench,
  other: Tag,
  __all: Layers,
  __filter: SlidersHorizontal,
};

// Module-level so the mapped icon isn't "created during render".
function Glyph({ k, className, color }: { k: string; className?: string; color?: string }) {
  const Icon = CATEGORY_ICON[k] ?? Tag;
  return <Icon className={className} style={color ? { color } : undefined} />;
}

interface Props {
  value: string; // "all" or a category key
  options: CategoryOption[];
  accent: string;
  onChange: (value: string) => void;
}

export function CategoryFilterSheet({ value, options, accent, onChange }: Props) {
  const { locale } = useAppLocale();
  const loc = (locale ?? "en") as YumoLocale;
  const [open, setOpen] = useState(false);

  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    loc === "tr" ? tr : loc === "ru" ? ru : loc === "th" ? th : loc === "es" ? es : loc === "zh" ? zh : en;

  const active = value !== "all";
  const triggerLabel = active
    ? categoryLabel(value, loc)
    : byLocale("Kategori", "Category", "Категория", "หมวดหมู่", "Categoría", "类别");

  const total = options.reduce((s, o) => s + o.count, 0);

  const pick = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
          style={
            active
              ? { background: `${accent}1f`, color: accent, border: `1px solid ${accent}55` }
              : { background: "var(--app-bg-elevated)", color: "var(--app-text-secondary)", border: "1px solid var(--app-border)" }
          }
        >
          <Glyph k={active ? value : "__filter"} className="h-3.5 w-3.5" />
          <span className="max-w-[120px] truncate">{triggerLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 2147483646 }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed bottom-0 left-0 right-0 mx-auto flex max-h-[80vh] max-w-2xl flex-col rounded-t-3xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          style={{ background: "var(--app-bg-surface)", borderTop: "1px solid var(--app-border-strong)", zIndex: 2147483647 }}
        >
          {/* Grabber */}
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full" style={{ background: "var(--app-border-strong)" }} />
          </div>

          <div className="flex items-center justify-between px-5 pb-3 pt-1">
            <Dialog.Title className="text-base font-bold" style={{ color: "var(--app-text-primary)" }}>
              {byLocale("Kategori seç", "Choose category", "Выбор категории", "เลือกหมวดหมู่", "Elegir categoría", "选择类别")}
            </Dialog.Title>
            <span className="font-mono text-[11px]" style={{ color: "var(--app-text-muted)" }}>
              {options.length} · {total}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            {/* All */}
            <Row
              iconKey="__all"
              label={byLocale("Tüm kategoriler", "All categories", "Все категории", "ทุกหมวด", "Todas", "全部类别")}
              count={total}
              selected={value === "all"}
              accent={accent}
              onClick={() => pick("all")}
            />
            <div className="my-1.5 h-px" style={{ background: "var(--app-border)" }} />
            {options.map((o) => (
              <Row
                key={o.key}
                iconKey={o.key}
                label={categoryLabel(o.key, loc)}
                count={o.count}
                selected={value === o.key}
                accent={accent}
                onClick={() => pick(o.key)}
              />
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row({
  iconKey,
  label,
  count,
  selected,
  accent,
  onClick,
}: {
  iconKey: string;
  label: string;
  count: number;
  selected: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:scale-[0.99]"
      style={selected ? { background: `${accent}14` } : undefined}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: selected ? `${accent}22` : "var(--app-bg-elevated)",
          border: `1px solid ${selected ? `${accent}55` : "var(--app-border)"}`,
        }}
      >
        <Glyph k={iconKey} className="h-[18px] w-[18px]" color={selected ? accent : "var(--app-text-secondary)"} />
      </span>
      <span className="flex-1 truncate text-sm font-medium" style={{ color: "var(--app-text-primary)" }}>
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums" style={{ color: "var(--app-text-muted)" }}>
        {count}
      </span>
      {selected && <Check className="h-4 w-4 shrink-0" style={{ color: accent }} />}
    </button>
  );
}
