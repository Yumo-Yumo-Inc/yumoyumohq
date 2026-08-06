"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Flame,
  Gift,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";

const RULES = [
  {
    icon: Shield,
    accent: "rgba(56, 189, 248, 0.35)",
    titleKey: "dashboard.genesisPatchNotes.rule1Title",
    descKey: "dashboard.genesisPatchNotes.rule1Desc",
  },
  {
    icon: Gift,
    accent: "rgba(245, 166, 35, 0.45)",
    titleKey: "dashboard.genesisPatchNotes.rule2Title",
    descKey: "dashboard.genesisPatchNotes.rule2Desc",
  },
  {
    icon: Trophy,
    accent: "rgba(167, 139, 250, 0.4)",
    titleKey: "dashboard.genesisPatchNotes.rule4Title",
    descKey: "dashboard.genesisPatchNotes.rule4Desc",
  },
] as const;

const TIERS = [
  "dashboard.genesisPatchNotes.tierSpark",
  "dashboard.genesisPatchNotes.tierEmber",
  "dashboard.genesisPatchNotes.tierFlame",
  "dashboard.genesisPatchNotes.tierForge",
] as const;

interface GenesisPatchNotesModalProps {
  open: boolean;
  onDismiss: (dontShowAgain: boolean) => void;
}

export function GenesisPatchNotesModal({ open, onDismiss }: GenesisPatchNotesModalProps) {
  const { t } = useAppLocale();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss(false);
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[min(92dvh,700px)] gap-0 overflow-hidden border-primary/20 p-0 sm:max-w-[400px]",
          "rounded-[28px] bg-[var(--app-bg-elevated)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
          "[&>button.absolute]:right-3 [&>button.absolute]:top-3 [&>button.absolute]:rounded-full",
          "[&>button.absolute]:border [&>button.absolute]:border-[var(--app-border)]",
          "[&>button.absolute]:bg-[var(--app-bg-elevated)]/80 [&>button.absolute]:opacity-80"
        )}
      >
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-[var(--app-border)] px-5 pb-5 pt-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "rgba(245,166,35,0.22)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-8 top-8 h-28 w-28 rounded-full blur-3xl"
            style={{ background: "rgba(139,92,246,0.18)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(245,166,35,0.55), transparent)",
            }}
          />

          <DialogHeader className="relative space-y-3 text-left">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {t("dashboard.genesisPatchNotes.badge")}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {t("dashboard.genesisPatchNotes.duration")}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 text-primary"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.04))",
                }}
              >
                <Flame className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <DialogTitle className="text-[1.35rem] font-bold leading-tight tracking-tight text-[var(--app-text-primary)]">
                  {t("dashboard.genesisPatchNotes.title")}
                </DialogTitle>
                <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
                  {t("dashboard.genesisPatchNotes.subtitle")}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Reward preview */}
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.07] px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-primary">
                <Zap className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {t("dashboard.genesisPatchNotes.rewardPointsLabel")}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--app-text-secondary)]">
                {t("dashboard.genesisPatchNotes.rewardPointsHint")}
              </p>
            </div>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.07] px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-violet-400">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {t("dashboard.genesisPatchNotes.rewardXpLabel")}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--app-text-secondary)]">
                {t("dashboard.genesisPatchNotes.rewardXpHint")}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[min(46dvh,380px)] space-y-3 overflow-y-auto px-5 py-4">
          {RULES.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.titleKey}
                className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-dashboard)]/60 p-3"
                style={{ borderLeftWidth: 3, borderLeftColor: rule.accent }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${rule.accent.replace(/[\d.]+\)$/, "0.12)")}` }}
                >
                  <Icon className="h-4 w-4 text-[var(--app-text-primary)]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--app-text-primary)]">
                    {t(rule.titleKey)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(rule.descKey)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Daily limits */}
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-dashboard)]/40 p-3">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("dashboard.genesisPatchNotes.limitsTitle")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-2 text-center">
                <p className="text-lg font-black tabular-nums text-violet-400">
                  {t("dashboard.genesisPatchNotes.limitXpValue")}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  {t("dashboard.genesisPatchNotes.limitXpDesc")}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-2 text-center">
                <p className="text-sm font-black leading-tight text-primary">
                  {t("dashboard.genesisPatchNotes.limitPointsValue")}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  {t("dashboard.genesisPatchNotes.limitPointsDesc")}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {t("dashboard.genesisPatchNotes.limitFootnote")}
            </p>
          </div>

          {/* Season tiers */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("dashboard.genesisPatchNotes.tiersTitle")}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {TIERS.map((tierKey, i) => (
                <span key={tierKey} className="flex items-center gap-1">
                  <span className="rounded-lg border border-primary/20 bg-primary/[0.08] px-2 py-1 text-[11px] font-semibold text-primary">
                    {t(tierKey)}
                  </span>
                  {i < TIERS.length - 1 ? (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" aria-hidden />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--app-border)] bg-[var(--app-bg-dashboard)]/30 px-5 pb-5 pt-3">
          <label className="mb-3 flex cursor-pointer items-center justify-center gap-2.5 select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={dontShowAgain}
              onClick={() => setDontShowAgain((v) => !v)}
              className={cn(
                "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-colors",
                dontShowAgain
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[var(--app-border)] bg-[var(--app-bg-elevated)]"
              )}
            >
              {dontShowAgain ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
            </button>
            <span
              className="text-xs text-muted-foreground"
              onClick={() => setDontShowAgain((v) => !v)}
            >
              {t("dashboard.genesisPatchNotes.dontShowAgain")}
            </span>
          </label>
          <button
            type="button"
            onClick={() => onDismiss(dontShowAgain)}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-[#1a1208] transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              background: "linear-gradient(135deg, #FFD37A 0%, #F5A623 48%, #E8940F 100%)",
              boxShadow: "0 8px 24px rgba(245,166,35,0.28)",
            }}
          >
            {t("dashboard.genesisPatchNotes.cta")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
