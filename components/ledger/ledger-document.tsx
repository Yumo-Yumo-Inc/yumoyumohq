"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { ThemeToggle } from "@/components/app/theme-toggle";
import type { SealedPriceEpoch } from "@/lib/prices/epoch-list";

const VERIFIER_REPO = "https://github.com/Yumo-Yumo-Inc/price-ledger-verifier";
const SOLSCAN_TX = "https://solscan.io/tx/";
const ARWEAVE_TX = "https://arweave.net/";

function shortHash(hash: string | null, head = 12): string {
  if (!hash) return "—";
  if (hash.length <= head * 2) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-6)}`;
}

function formatDay(iso: string, locale: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.day} ${map.month} ${map.year}`;
}

function EpochRow({ epoch, index, reduce }: { epoch: SealedPriceEpoch; index: number; reduce: boolean }) {
  const { t, locale } = useAppLocale();

  const root = epoch.merkleRoot ?? null;
  const solanaHref = epoch.memoTx ? `${SOLSCAN_TX}${epoch.memoTx}` : null;
  const arweaveHref = epoch.arweaveTx ? `${ARWEAVE_TX}${epoch.arweaveTx}` : null;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.6), ease: "easeOut" }}
      className="group grid grid-cols-1 gap-x-6 gap-y-3 py-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_auto] sm:items-baseline"
    >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[15px] font-semibold tracking-[-0.01em]"
              style={{ color: "var(--app-text-primary)" }}
            >
              #{epoch.epochNumber}
            </span>
            <span
              className="font-mono text-[10px] font-medium uppercase tracking-[0.08em]"
              style={{ color: "var(--app-gold-dim)" }}
            >
              {t("ledger.sealedBadge")}
            </span>
          </div>
        <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
          {formatDay(epoch.windowStart, locale)} → {formatDay(epoch.windowEnd, locale)}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <span
          className="font-mono text-[12px] break-all"
          style={{ color: "var(--app-text-secondary)" }}
          title={root ?? undefined}
        >
          {shortHash(root)}
        </span>
        <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
          {epoch.observationCount} {t("ledger.observations").toLowerCase()} · {epoch.receiptCount}{" "}
          {t("ledger.receipts").toLowerCase()} · {epoch.withdrawnCount} {t("ledger.withdrawn").toLowerCase()}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 sm:items-end">
        {solanaHref ? (
          <a
            href={solanaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 truncate font-mono text-[11px] transition-opacity hover:opacity-70"
            style={{ color: "var(--app-gold)" }}
          >
            <ExternalLink size={12} strokeWidth={2} />
            {t("ledger.viewSolana")}
          </a>
        ) : (
          <span className="font-mono text-[11px]" style={{ color: "var(--app-text-muted)" }}>
            —
          </span>
        )}
        {arweaveHref ? (
          <a
            href={arweaveHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 truncate font-mono text-[11px] transition-opacity hover:opacity-70"
            style={{ color: "var(--app-gold)" }}
          >
            <ExternalLink size={12} strokeWidth={2} />
            {t("ledger.viewArweave")}
          </a>
        ) : (
          <span className="font-mono text-[11px]" style={{ color: "var(--app-text-muted)" }}>
            —
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function LedgerDocument({
  epochs,
  loadError,
}: {
  epochs: SealedPriceEpoch[];
  loadError: boolean;
}) {
  const { t } = useAppLocale();
  const reduce = useReducedMotion();

  const newestEpoch = useMemo(
    () => (epochs.length ? epochs[0].epochNumber : null),
    [epochs]
  );

  return (
    <div
      className="min-h-screen px-5 py-12 sm:px-8 sm:py-16"
      style={{ background: "var(--app-bg-shell)", color: "var(--app-text-primary)" }}
    >
      <div className="mx-auto w-full max-w-[920px]">
        {/* Document header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <p
              className="font-mono text-[11px] font-medium uppercase tracking-[0.16em]"
              style={{ color: "var(--app-gold-dim)" }}
            >
              {t("ledger.overline")}
            </p>
            <h1 className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[40px]">
              {t("ledger.title")}
            </h1>
          </div>
          <ThemeToggle className="shrink-0" />
        </header>

        <p
          className="mt-5 max-w-[64ch] text-[15px] leading-7"
          style={{ color: "var(--app-text-secondary)" }}
        >
          {t("ledger.lede")}
        </p>

        <div
          className="mt-10 h-px w-full"
          style={{ background: "var(--surface-hairline)" }}
        />

        {/* Sealed epochs */}
        <section className="mt-12">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
              {t("ledger.sealedSection")}
            </h2>
            <span className="font-mono text-[12px] tabular-nums" style={{ color: "var(--app-text-muted)" }}>
              {t("ledger.sealedCount", { count: epochs.length })}
            </span>
          </div>

          {loadError ? (
            <p className="mt-4 max-w-[64ch] text-[14px] leading-6" style={{ color: "var(--app-text-muted)" }}>
              {t("ledger.errorBody")}
            </p>
          ) : epochs.length === 0 ? (
            <div className="mt-8">
              <p className="text-[15px] font-semibold">{t("ledger.emptyTitle")}</p>
              <p className="mt-1 max-w-[56ch] text-[14px] leading-6" style={{ color: "var(--app-text-muted)" }}>
                {t("ledger.emptyBody")}
              </p>
            </div>
          ) : (
            <div className="mt-8">
              {epochs.map((epoch, index) => (
                <div key={epoch.epochNumber}>
                  {index > 0 && (
                    <div className="h-px w-full" style={{ background: "var(--surface-hairline)" }} />
                  )}
                  <EpochRow epoch={epoch} index={index} reduce={!!reduce} />
                </div>
              ))}
            </div>
          )}
        </section>

        <div
          className="mt-14 h-px w-full"
          style={{ background: "var(--surface-hairline)" }}
        />

        {/* Verify it yourself */}
        <section className="mt-12">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
            {t("ledger.verifySection")}
          </h2>
          <p
            className="mt-3 max-w-[64ch] text-[14px] leading-7"
            style={{ color: "var(--app-text-secondary)" }}
          >
            {t("ledger.verifyBody")}
          </p>

          <div className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--app-text-muted)" }}>
              {t("ledger.verifyCmdLabel")}
            </p>
            <pre
              className="mt-2 overflow-x-auto rounded-lg px-4 py-3 font-mono text-[13px] leading-6"
              style={{
                background: "var(--app-bg-elevated)",
                border: "1px solid var(--app-border)",
                color: "var(--app-text-primary)",
              }}
            >
              <code>
                <span style={{ color: "var(--app-gold)" }}>$</span> {t("ledger.verifyCmd")}
              </code>
            </pre>
            {newestEpoch !== null && (
              <p className="mt-2 font-mono text-[12px]" style={{ color: "var(--app-text-muted)" }}>
                {t("ledger.verifyExample", { n: newestEpoch })}
              </p>
            )}
          </div>

          <a
            href={VERIFIER_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--app-gold)" }}
          >
            {t("ledger.verifyCta")}
            <ArrowUpRight size={15} strokeWidth={2} />
          </a>
        </section>

        {/* Document footer */}
        <footer className="mt-16">
          <div className="h-px w-full" style={{ background: "var(--surface-hairline)" }} />
          <p className="mt-5 font-mono text-[11px] leading-5" style={{ color: "var(--app-text-muted)" }}>
            {t("ledger.sealerLabel")}: <span className="break-all">{t("ledger.sealerAddress")}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
