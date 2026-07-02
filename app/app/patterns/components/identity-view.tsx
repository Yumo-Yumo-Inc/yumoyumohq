"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { SpendHeatmap } from "@/components/insights/SpendHeatmap";
import type { SpendingIdentity, TraitKey } from "@/lib/insights/identity/identity-types";
import type { TribeData } from "@/lib/insights/identity/tribe";
import { IdentityRadar } from "./identity-radar";
import { ShareCard } from "./share-card";
import { TribeSections } from "./tribe-sections";
import {
  className as classNameOf,
  classTagline,
  emptyTraitHint,
  evidenceText,
  type IdentityRange,
  TRAIT_ACCENT,
  TRAIT_LABEL,
  tx,
  UI,
} from "../identity-copy";

const RANGES: { key: IdentityRange; label: keyof typeof UI }[] = [
  { key: "30d", label: "range30" },
  { key: "90d", label: "range90" },
  { key: "all", label: "rangeAll" },
];

/** The full identity experience: shareable hero (graphic + description) on top,
 *  then trait chips, proof, and the tribe layer. */
export function IdentityView({
  identity,
  tribe,
  heatmap,
  locale,
  range,
  onRangeChange,
}: {
  identity: SpendingIdentity;
  tribe: TribeData | null;
  heatmap: number[][] | null;
  locale: string;
  range: IdentityRange;
  onRangeChange: (r: IdentityRange) => void;
}) {
  const classKeys = identity.classKeys!;
  const accent = TRAIT_ACCENT[classKeys[0]];
  const [selected, setSelected] = useState<TraitKey | null>(classKeys[0]);
  const [shareOpen, setShareOpen] = useState(false);
  const sel = identity.traits.find((t) => t.key === selected) ?? null;

  return (
    <>
      {/* ───── shareable hero: graphic + short description, at the top ───── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[22px] border p-5"
        style={{
          background: "linear-gradient(165deg,var(--app-bg-surface),var(--app-bg-elevated))",
          borderColor: "var(--app-border-strong)",
          boxShadow: "var(--app-shadow-card)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)`, filter: "blur(26px)" }}
        />

        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--app-text-muted)" }}>
            {tx(locale, UI.eyebrow)}
          </p>
          {/* period selector */}
          <div
            className="flex items-center gap-0.5 rounded-full p-0.5"
            style={{ background: "var(--app-bg-base)", border: "1px solid var(--app-border)" }}
          >
            {RANGES.map((r) => {
              const on = range === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => onRangeChange(r.key)}
                  className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-colors"
                  style={{
                    background: on ? accent : "transparent",
                    color: on ? "#0A0C10" : "var(--app-text-muted)",
                  }}
                >
                  {tx(locale, UI[r.label])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <h1
            className="text-[30px] font-bold leading-[1.05]"
            style={{
              background: `linear-gradient(120deg, ${accent}, var(--app-gold-light) 80%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {classNameOf(classKeys, locale)}
          </h1>
          <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
            {classTagline(classKeys, locale)}
          </p>
        </div>

        <div className="mt-1 grid place-items-center">
          <IdentityRadar traits={identity.traits} selected={selected} onSelect={setSelected} locale={locale} primaryAccent={accent} />
        </div>

        <button
          onClick={() => setShareOpen(true)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-[13px] py-3 text-[13px] font-semibold transition-transform active:scale-[0.98]"
          style={{ background: accent, color: "#0A0C10" }}
        >
          <Share2 size={15} />
          {tx(locale, UI.share)}
        </button>
      </motion.section>

      <ShareCard
        open={shareOpen}
        onOpenChange={setShareOpen}
        classKeys={classKeys}
        identity={identity}
        locale={locale}
      />

      {/* hint */}
      <div className="mb-2 mt-4 flex items-center justify-center gap-1.5 text-[11px]" style={{ color: "var(--app-text-muted)" }}>
        <Sparkles size={12} style={{ color: accent }} />
        {tx(locale, UI.whyHint)}
      </div>

      {/* trait chips */}
      <div className="grid grid-cols-3 gap-2">
        {identity.traits.map((t) => {
          const on = selected === t.key;
          const a = TRAIT_ACCENT[t.key];
          const dimmed = t.value === null;
          return (
            <button
              key={t.key}
              onClick={() => setSelected(t.key)}
              className="rounded-[13px] border px-1.5 py-2.5 text-center transition-transform active:scale-[0.96]"
              style={{
                background: on ? `color-mix(in srgb, ${a} 14%, var(--app-bg-surface))` : "var(--app-bg-surface)",
                borderColor: on ? a : "var(--app-border)",
                opacity: dimmed ? 0.55 : 1,
              }}
            >
              <div className="text-[12px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
                {tx(locale, TRAIT_LABEL[t.key])}
              </div>
              <div className="text-[15px] font-bold tabular-nums" style={{ color: a }}>
                {t.value ?? "—"}
              </div>
              {t.delta !== null && t.value !== null && (
                <div
                  className="text-[8.5px] font-semibold tabular-nums"
                  style={{ color: t.delta >= 0 ? "var(--app-success)" : "var(--app-text-muted)" }}
                >
                  {t.delta >= 0 ? "+" : ""}
                  {t.delta}
                  {t.delta >= 0 ? "↑" : "↓"}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* proof panel */}
      <AnimatePresence mode="wait">
        {sel && (
          <motion.div
            key={sel.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-3 rounded-[16px] border p-4"
            style={{
              background: "linear-gradient(180deg,var(--app-bg-surface),var(--app-bg-elevated))",
              borderColor: `color-mix(in srgb, ${TRAIT_ACCENT[sel.key]} 35%, transparent)`,
            }}
          >
            <div className="mb-1.5 flex items-center gap-2.5">
              <span
                className="grid h-7 w-7 place-items-center rounded-lg text-[12px] font-bold tabular-nums"
                style={{ background: `color-mix(in srgb, ${TRAIT_ACCENT[sel.key]} 18%, transparent)`, color: TRAIT_ACCENT[sel.key] }}
              >
                {sel.value ?? "—"}
              </span>
              <span className="text-[13px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
                {tx(locale, TRAIT_LABEL[sel.key])} · {tx(locale, UI.why)}
              </span>
              <span className="ml-auto text-[8.5px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--app-text-muted)" }}>
                {tx(locale, UI.evidence)}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
              {evidenceText(sel, locale) ?? emptyTraitHint(sel.key, locale)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="my-6 h-px" style={{ background: "linear-gradient(90deg,transparent,var(--app-border-strong),transparent)" }} />

      {tribe && <TribeSections tribe={tribe} locale={locale} />}

      {/* ───── spending rhythm: when you spend (day × hour), at the very end ───── */}
      {heatmap && heatmap.some((row) => row.some((v) => v > 0)) && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-6 overflow-hidden rounded-[18px] border p-5"
          style={{
            background: "linear-gradient(180deg,var(--app-bg-surface),var(--app-bg-elevated))",
            borderColor: "var(--app-border-strong)",
          }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center rounded-xl"
              style={{
                background: "linear-gradient(160deg, rgba(232,201,122,0.22), rgba(201,168,76,0.06))",
                border: "1px solid var(--app-gold-border)",
                color: "var(--app-gold-light)",
              }}
            >
              <Clock size={15} strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold leading-tight" style={{ color: "var(--app-text-primary)" }}>
                {locale === "tr" ? "Ne zaman harcıyorsun" : "When you spend"}
              </h3>
              <div className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--app-text-muted)" }}>
                {locale === "tr" ? "gün × saat" : "day × hour"}
              </div>
            </div>
          </div>
          <SpendHeatmap matrix={heatmap} locale={locale} />
        </motion.section>
      )}
    </>
  );
}

export function EmptyIdentity({ locale }: { locale: string }) {
  return (
    <div className="mx-auto max-w-md px-2 py-10 text-center">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--app-text-muted)" }}>
        {tx(locale, UI.eyebrow)}
      </p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-[20px] border p-8"
        style={{ background: "linear-gradient(180deg,var(--app-bg-surface),var(--app-bg-elevated))", borderColor: "var(--app-border)" }}
      >
        <div
          className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl"
          style={{ background: "var(--app-bg-surface3)", border: "1px solid var(--app-border-strong)" }}
        >
          <Sparkles className="h-8 w-8" style={{ color: "var(--app-primary)" }} />
        </div>
        <h1 className="mb-2 text-xl font-bold" style={{ color: "var(--app-text-primary)" }}>
          {tx(locale, UI.notEnoughTitle)}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
          {tx(locale, UI.notEnoughBody)}
        </p>
      </motion.div>
    </div>
  );
}

export function PatternsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[440px] w-full rounded-[22px]" style={{ background: "var(--app-bg-surface)" }} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-[13px]" style={{ background: "var(--app-bg-surface)" }} />
        ))}
      </div>
    </div>
  );
}
