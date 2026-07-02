"use client";

import { motion } from "framer-motion";
import { Compass, MapPin, Sparkles, Users } from "lucide-react";
import type { TraitKey } from "@/lib/insights/identity/identity-types";
import type { TribeData } from "@/lib/insights/identity/tribe";
import { className as classNameOf, num, TRAIT_ACCENT, tx, UI } from "../identity-copy";

interface Props {
  tribe: TribeData;
  locale: string;
}

const card =
  "rounded-[18px] border p-4 [background:linear-gradient(180deg,var(--app-bg-surface),var(--app-bg-elevated))]";

export function TribeSections({ tribe, locale }: Props) {
  const cls = tribe.classKeys;
  const accent = cls ? TRAIT_ACCENT[cls[0]] : "var(--app-primary)";

  // Empty state — not enough cohort. Still show any real teaser numbers we have.
  if (!tribe.enough) {
    return (
      <section className="mt-6">
        <Eyebrow text={tx(locale, UI.tribeEyebrow)} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className={card}
          style={{ borderColor: "var(--app-border)" }}
        >
          <div
            className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--app-bg-surface3)", border: "1px solid var(--app-border-strong)" }}
          >
            <Users size={18} style={{ color: "var(--app-text-muted)" }} />
          </div>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
            {tx(locale, UI.tribeEmptyTitle)}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
            {tx(locale, UI.tribeEmptyBody)}
          </p>
          {(tribe.cityClassCohort > 0 || tribe.cityPeers > 0) && tribe.city && (
            <div
              className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px]"
              style={{ background: "var(--app-bg-base)", color: "var(--app-text-secondary)" }}
            >
              <MapPin size={13} style={{ color: accent }} />
              <span>
                <b style={{ color: "var(--app-text-primary)" }}>{tribe.city}</b> · {num(tribe.cityPeers, locale)}{" "}
                {tx(locale, UI.inCity)}
              </span>
            </div>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <Eyebrow text={tx(locale, UI.tribeEyebrow)} />

      {/* belonging */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className={card}
        style={{ borderColor: "var(--app-border-strong)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)` }}
          >
            <Users size={20} style={{ color: accent }} />
          </div>
          <div className="text-[12.5px] leading-snug" style={{ color: "var(--app-text-secondary)" }}>
            <b style={{ color: "var(--app-text-primary)" }}>
              {tribe.city} · {num(tribe.cityClassCohort, locale)}
            </b>{" "}
            {tx(locale, UI.inYourTribe)}
            {cls && (
              <>
                <br />
                {classNameOf(cls, locale)} · {num(tribe.globalClassCohort, locale)}{" "}
                {tx(locale, UI.inYourTribe)}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* leaderboard */}
      {tribe.leaderboard.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between px-0.5">
            <span className="text-[13px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
              {tx(locale, UI.leaderboardTitle)}
            </span>
            <Compass size={14} style={{ color: "var(--app-text-muted)" }} />
          </div>
          <div className="flex flex-col gap-2">
            {tribe.leaderboard.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-[13px] border px-3 py-2.5"
                style={{
                  background: m.isYou ? `color-mix(in srgb, ${accent} 12%, var(--app-bg-surface))` : "var(--app-bg-surface)",
                  borderColor: m.isYou ? `color-mix(in srgb, ${accent} 40%, transparent)` : "var(--app-border)",
                }}
              >
                <span
                  className="w-4 text-center text-[13px] font-bold tabular-nums"
                  style={{ color: i < 3 ? "var(--app-gold)" : "var(--app-text-muted)" }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-[12.5px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
                  {m.displayName ?? "—"}
                  {m.isYou && (
                    <span className="ml-1.5 text-[9px] font-bold" style={{ color: accent }}>
                      {tx(locale, UI.you)}
                    </span>
                  )}
                </span>
                {m.explorer !== null && (
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: accent }}>
                    {m.explorer}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* discovery */}
      {tribe.discovery.length > 0 && (
        <div className="mt-6">
          <Eyebrow text={tx(locale, UI.discoveryEyebrow)} />
          <h3 className="mb-3 px-0.5 text-[17px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
            {tx(locale, UI.discoveryTitle)}
          </h3>
          <div className="flex flex-col gap-2.5">
            {tribe.discovery.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-[15px] border p-3"
                style={{
                  background: "linear-gradient(180deg,var(--app-bg-surface),var(--app-bg-elevated))",
                  borderColor: "var(--app-border)",
                }}
              >
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
                >
                  <Sparkles size={18} style={{ color: accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold" style={{ color: "var(--app-text-primary)" }}>
                    {p.merchant}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--app-text-muted)" }}>
                    {num(p.visitors, locale)} {tx(locale, UI.visitors)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Eyebrow({ text }: { text: string }) {
  return (
    <p
      className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: "var(--app-text-muted)" }}
    >
      {text}
    </p>
  );
}
