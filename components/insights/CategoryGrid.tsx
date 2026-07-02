"use client";

/**
 * Category grid — spending categories in a regular card grid.
 * Each card: category-colored icon chip + name + amount (mono) + a thin fill
 * line proportional to share. Sorted largest to smallest, 2 columns. Static
 * layout — no autonomous motion, only tap/hover feedback. The clicked category
 * is passed to the parent via onSelect.
 */

import { motion, useReducedMotion } from "framer-motion";
import { CATEGORY_GLYPHS } from "./CategoryGlyphs";

export interface CategoryItem {
  key: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
}

// hex → rgba (produces lower-opacity tones from the category color)
function rgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Readable text color on top of the swatch (dark on light chips, white on dark)
function textOn(hex: string): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "#FFFFFF";
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#1A1505" : "#FFFFFF";
}

export interface CategoryGridProps {
  categories: CategoryItem[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  dCurrency: (n: number) => string;
}

export function CategoryGrid({
  categories,
  selectedKey,
  onSelect,
  dCurrency,
}: CategoryGridProps) {
  const reduceMotion = useReducedMotion();
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  const maxPct = Math.max(1, ...sorted.map((c) => c.pct));

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {sorted.map((c, idx) => {
        const isSelected = selectedKey === c.key;
        const Glyph = CATEGORY_GLYPHS[c.key];
        const chipText = textOn(c.color);
        // Bar fill: normalized against the largest category (for comparison clarity).
        const fillPct = Math.max(6, (c.pct / maxPct) * 100);

        return (
          <motion.button
            key={c.key}
            type="button"
            onClick={() => onSelect(isSelected ? null : c.key)}
            aria-pressed={isSelected}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: reduceMotion ? 0 : idx * 0.025, ease: "easeOut" }}
            whileTap={{ scale: 0.975 }}
            className="group relative flex flex-col gap-2.5 rounded-2xl p-3 text-left outline-none transition-colors duration-150"
            style={{
              background: isSelected
                ? `linear-gradient(160deg, ${rgba(c.color, 0.16)}, ${rgba(c.color, 0.05)}), var(--app-bg-surface)`
                : "linear-gradient(160deg, var(--app-bg-surface), var(--app-bg-elevated))",
              border: `1px solid ${isSelected ? rgba(c.color, 0.55) : "var(--app-border)"}`,
              boxShadow: isSelected
                ? `var(--app-shadow-card), 0 0 0 1px ${rgba(c.color, 0.35)}, 0 6px 20px ${rgba(c.color, 0.16)}`
                : "var(--app-shadow-card)",
            }}
          >
            {/* Top-inner light hairline — material depth */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
            />

            {/* Top row: icon chip + share badge */}
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-105"
                style={{
                  background: `linear-gradient(160deg, ${rgba(c.color, 0.95)}, ${rgba(c.color, 0.7)})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px ${rgba(c.color, 0.3)}`,
                }}
              >
                {Glyph ? (
                  <Glyph size={20} color={chipText} bgOpacity={0} />
                ) : (
                  <span className="h-2 w-2 rounded-full" style={{ background: chipText }} />
                )}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{
                  fontFamily: "DM Mono, ui-monospace, monospace",
                  color: "var(--app-text-secondary)",
                  background: rgba(c.color, 0.1),
                }}
              >
                %{c.pct.toFixed(c.pct < 10 ? 1 : 0)}
              </span>
            </div>

            {/* Category name */}
            <div
              className="truncate text-[12.5px] font-semibold tracking-tight text-app-text-secondary"
              style={{ fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif" }}
              title={c.label}
            >
              {c.label}
            </div>

            {/* Amount — hero figure */}
            <div
              className="text-[18px] font-bold leading-none tabular-nums text-app-text-primary"
              style={{ fontFamily: "DM Mono, ui-monospace, monospace", letterSpacing: "-0.03em" }}
            >
              {dCurrency(c.amount)}
            </div>

            {/* Share line — normalized against the largest, in the category color */}
            <div
              className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--app-bg-base, rgba(255,255,255,0.06))" }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.1 + idx * 0.025, ease: "easeOut" }}
                style={{
                  background: `linear-gradient(90deg, ${rgba(c.color, 0.85)}, ${c.color})`,
                  boxShadow: `0 0 8px ${rgba(c.color, 0.4)}`,
                }}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
